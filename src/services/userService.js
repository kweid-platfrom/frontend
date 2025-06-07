// services/userService.js
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, environment } from "../config/firebase";

/**
 * Unified user document creation service
 * Handles all user creation scenarios with consistent data structure
 */

// Extract name from email as fallback
const extractNameFromEmail = (email) => {
    if (!email) return "";
    const emailPrefix = email.split('@')[0];
    return emailPrefix
        .replace(/[._0-9]/g, ' ')
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// FIXED: Determine account type based on email domain
const determineAccountType = (email) => {
    if (!email) return 'personal';

    // Common personal/public email domains
    const personalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com', 'live.com',
        'ymail.com', 'rocketmail.com', 'mail.com', 'zoho.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    
    // If it's a public domain, it's personal
    // If it's a custom domain, it's business
    return personalDomains.includes(domain) ? 'personal' : 'business';
};

// Parse display name into first/last name
const parseDisplayName = (displayName) => {
    if (!displayName || !displayName.trim()) {
        return { firstName: "", lastName: "" };
    }

    const nameParts = displayName.trim().split(' ');
    return {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(' ') || ""
    };
};

/**
 * Create comprehensive user document
 * @param {Object} firebaseUser - Firebase user object
 * @param {Object} additionalData - Additional user data from forms/setup
 * @param {string} source - Source of user creation ('setup', 'google', 'email', 'link')
 * @returns {Object} User document data
 */
export const createUserDocument = async (firebaseUser, additionalData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new Error('Invalid Firebase user provided');
    }

    console.log('🏗️ Creating user document:', {
        uid: firebaseUser.uid,
        source,
        email: firebaseUser.email,
        hasAdditionalData: Object.keys(additionalData).length > 0
    });

    try {
        // Parse display name for Google users
        const { firstName: parsedFirstName, lastName: parsedLastName } =
            parseDisplayName(firebaseUser.displayName);

        // Determine account type
        const accountType = additionalData.accountType ||
            determineAccountType(firebaseUser.email) || 'personal';

        // Build comprehensive user data
        const userData = {
            // Core identity
            uid: firebaseUser.uid,
            email: firebaseUser.email?.toLowerCase().trim() || "",
            emailVerified: firebaseUser.emailVerified || false,

            // Name fields (prioritize form data, then Firebase data, then extracted)
            name: additionalData.name?.trim() ||
                firebaseUser.displayName?.trim() ||
                extractNameFromEmail(firebaseUser.email) || "",
            displayName: firebaseUser.displayName?.trim() ||
                additionalData.name?.trim() || "",
            firstName: additionalData.firstName?.trim() ||
                parsedFirstName || "",
            lastName: additionalData.lastName?.trim() ||
                parsedLastName || "",

            // Profile information
            photoURL: firebaseUser.photoURL || additionalData.avatarUrl || "",
            avatarUrl: firebaseUser.photoURL || additionalData.avatarUrl || "",
            phone: additionalData.phone?.trim() || "",
            location: additionalData.location?.trim() || "",
            jobRole: additionalData.jobRole?.trim() || "",

            // Organization/Business fields
            company: additionalData.company?.trim() || "",
            industry: additionalData.industry || "",
            companySize: additionalData.companySize || "",
            organizationId: additionalData.organizationId || null,

            // Account configuration
            accountType: accountType,
            role: additionalData.role || "user",

            // Permissions structure
            permissions: additionalData.permissions || {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            },

            // Metadata
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            updatedAt: serverTimestamp(),
            environment: environment,
            source: source, // Track where user was created

            // Setup tracking
            setupCompleted: source === 'setup' || !!additionalData.setupCompleted,
            setupStep: additionalData.setupStep || (source === 'setup' ? 'completed' : 'pending')
        };

        console.log('💾 Writing user document to Firestore:', {
            uid: userData.uid,
            email: userData.email,
            accountType: userData.accountType,
            setupCompleted: userData.setupCompleted
        });

        // Write to Firestore with retry logic for offline issues
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        try {
            await setDoc(userRef, userData);
        } catch (firestoreError) {
            console.error('Firestore write error:', firestoreError);
            
            // If offline, try to enable offline persistence
            if (firestoreError.code === 'unavailable') {
                console.log('🔄 Retrying Firestore operation...');
                // Wait a bit and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                await setDoc(userRef, userData);
            } else {
                throw firestoreError;
            }
        }

        // Verify document was created
        const createdDoc = await getDoc(userRef);
        if (!createdDoc.exists()) {
            throw new Error('Failed to verify document creation');
        }

        console.log('✅ User document created successfully');
        return userData;

    } catch (error) {
        console.error('💥 User document creation failed:', {
            code: error.code,
            message: error.message,
            uid: firebaseUser.uid
        });

        // Enhanced error handling
        if (error.code === 'permission-denied') {
            throw new Error('Permission denied. Please check your account permissions and try again.');
        } else if (error.code === 'unavailable') {
            throw new Error('Service temporarily unavailable. Please check your connection and try again.');
        } else if (error.code === 'unauthenticated') {
            throw new Error('Authentication error. Please sign in again.');
        } else {
            throw new Error(error.message || 'Failed to create user account.');
        }
    }
};

/**
 * Create user document if it doesn't exist, update if it does
 * @param {Object} firebaseUser - Firebase user object
 * @param {Object} additionalData - Additional user data
 * @param {string} source - Source of user creation
 * @returns {Object} Result with user data and creation status
 */
export const createUserIfNotExists = async (firebaseUser, additionalData = {}, source = 'auth') => {
    if (!firebaseUser?.uid) {
        console.warn('🚨 createUserIfNotExists called without valid user');
        return { isNewUser: false, userData: null, error: 'Invalid user' };
    }

    console.log('🔍 Checking user existence:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        source
    });

    try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const existingData = userSnap.data();
            console.log('✅ Existing user found:', {
                uid: existingData.uid,
                setupCompleted: existingData.setupCompleted
            });

            // Update last login for existing users
            try {
                await setDoc(userRef, {
                    lastLogin: new Date().toISOString(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
                console.log('✅ Last login updated');
            } catch (updateError) {
                console.error('⚠️ Failed to update last login:', updateError.message);
            }

            return {
                isNewUser: false,
                userData: existingData,
                needsSetup: !existingData.setupCompleted
            };
        }

        // Create new user document
        console.log('🆕 Creating new user document...');
        const userData = await createUserDocument(firebaseUser, additionalData, source);

        return {
            isNewUser: true,
            userData,
            needsSetup: !userData.setupCompleted
        };

    } catch (error) {
        console.error('💥 createUserIfNotExists failed:', error);
        return {
            isNewUser: false,
            userData: null,
            error: error.message || 'Failed to process user account.'
        };
    }
};

/**
 * Update user document with setup completion data
 * @param {string} userId - User ID
 * @param {Object} setupData - Data from account setup form
 * @returns {Object} Updated user data
 */
export const completeUserSetup = async (userId, setupData) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    console.log('🏁 Completing user setup:', {
        userId,
        accountType: setupData.accountType,
        hasCompany: !!setupData.company
    });

    try {
        const userRef = doc(db, 'users', userId);

        // Prepare setup completion data
        const updateData = {
            // Update name and contact info
            name: setupData.name?.trim() || "",
            firstName: setupData.firstName?.trim() || "",
            lastName: setupData.lastName?.trim() || "",
            phone: setupData.phone?.trim() || "",

            // Update organization info
            company: setupData.company?.trim() || "",
            industry: setupData.industry || "",
            companySize: setupData.companySize || "",

            // Update account configuration
            accountType: setupData.accountType || 'personal',

            // Mark setup as completed
            setupCompleted: true,
            setupStep: 'completed',

            // Update timestamps
            lastLogin: new Date().toISOString(),
            updatedAt: serverTimestamp()
        };

        // Merge with existing document with retry logic
        try {
            await setDoc(userRef, updateData, { merge: true });
        } catch (firestoreError) {
            if (firestoreError.code === 'unavailable') {
                console.log('🔄 Retrying setup completion...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                await setDoc(userRef, updateData, { merge: true });
            } else {
                throw firestoreError;
            }
        }

        // Fetch and return updated document
        const updatedDoc = await getDoc(userRef);
        const updatedData = updatedDoc.data();

        console.log('✅ User setup completed successfully');
        return updatedData;

    } catch (error) {
        console.error('💥 Setup completion failed:', error);
        throw new Error(error.message || 'Failed to complete user setup.');
    }
};

/**
 * Fetch user data by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User data or null if not found
 */
export const fetchUserData = async (userId) => {
    if (!userId) {
        console.warn('🚨 fetchUserData called without userId');
        return null;
    }

    try {
        console.log('🔍 Fetching user data for:', userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('✅ User data fetched successfully:', {
                uid: userData.uid,
                email: userData.email,
                setupCompleted: userData.setupCompleted
            });
            return userData;
        } else {
            console.log('⚠️ No user document found for:', userId);
            return null;
        }
    } catch (error) {
        console.error("❌ Error fetching user data:", {
            code: error.code,
            message: error.message,
            userId
        });
        return null;
    }
};