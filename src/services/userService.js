// services/userService.js
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, environment } from "../config/firebase";

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

// Determine account type based on email domain
const determineAccountType = (email) => {
    if (!email) return 'personal';

    const personalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com', 'live.com',
        'ymail.com', 'rocketmail.com', 'mail.com', 'zoho.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
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

export const createUserDocument = async (firebaseUser, additionalData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new Error('Invalid Firebase user provided');
    }

    console.log('Creating user document:', {
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

        // Build user data with proper fallbacks
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email?.toLowerCase().trim() || "",
            emailVerified: firebaseUser.emailVerified || false,

            // Name handling with proper fallbacks
            firstName: additionalData.firstName?.trim() || parsedFirstName || "",
            lastName: additionalData.lastName?.trim() || parsedLastName || "",
            
            // Account configuration
            accountType: accountType,

            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),

            // Setup tracking - Fix the boolean logic here
            setupCompleted: Boolean(additionalData.setupCompleted) || source === 'setup',
            setupStep: additionalData.setupStep || 
                      (source === 'setup' ? 'completed' : 'pending'),

            // Permissions with defaults
            permissions: {
                isAdmin: false,
                roles: ["user"],
                capabilities: ["read_tests"]
            },

            // Optional fields
            ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
            ...(additionalData.phone && { phone: additionalData.phone.trim() }),
            ...(additionalData.company && { company: additionalData.company.trim() }),
            ...(additionalData.organizationId && { organizationId: additionalData.organizationId }),
            ...(environment && { environment: environment }),
            ...(source && { source: source })
        };

        // Compute name field after firstName/lastName are set
        userData.name = additionalData.name?.trim() ||
                      firebaseUser.displayName?.trim() ||
                      `${userData.firstName} ${userData.lastName}`.trim() ||
                      extractNameFromEmail(firebaseUser.email) || "";

        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Single write operation with better error handling
        await setDoc(userRef, userData);
        
        console.log('User document created successfully');
        return userData;

    } catch (error) {
        console.error('User document creation failed:', {
            code: error.code,
            message: error.message,
            uid: firebaseUser.uid
        });

        // Specific Firebase error handling
        if (error.code === 'permission-denied') {
            throw new Error('Permission denied creating user account');
        }
        if (error.code === 'unavailable') {
            throw new Error('Database temporarily unavailable');
        }
        
        throw new Error(error.message || 'Failed to create user account');
    }
};

export const createUserIfNotExists = async (firebaseUser, additionalData = {}, source = 'auth') => {
    if (!firebaseUser?.uid) {
        return { 
            isNewUser: false, 
            userData: null, 
            needsSetup: false,
            error: 'Invalid user provided' 
        };
    }

    try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const existingData = userSnap.data();
            
            // Update last login
            await setDoc(userRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return {
                isNewUser: false,
                userData: existingData,
                needsSetup: !existingData.setupCompleted,
                error: null
            };
        }

        // Create new user
        const userData = await createUserDocument(firebaseUser, additionalData, source);

        return {
            isNewUser: true,
            userData,
            needsSetup: !userData.setupCompleted,
            error: null
        };

    } catch (error) {
        console.error('createUserIfNotExists failed:', error);
        return {
            isNewUser: false,
            userData: null,
            needsSetup: false,
            error: error.message
        };
    }
};

export const completeUserSetup = async (userId, setupData) => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const userRef = doc(db, 'users', userId);

        const updateData = {
            ...(setupData.name && { name: setupData.name.trim() }),
            ...(setupData.firstName && { firstName: setupData.firstName.trim() }),
            ...(setupData.lastName && { lastName: setupData.lastName.trim() }),
            ...(setupData.phone && { phone: setupData.phone.trim() }),
            ...(setupData.company && { company: setupData.company.trim() }),
            ...(setupData.industry && { industry: setupData.industry }),
            ...(setupData.companySize && { companySize: setupData.companySize }),
            ...(setupData.accountType && { accountType: setupData.accountType }),

            setupCompleted: true,
            setupStep: 'completed',
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(userRef, updateData, { merge: true });

        // Return updated data
        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        console.error('Setup completion failed:', error);
        throw new Error('Failed to complete user setup');
    }
};

export const fetchUserData = async (userId) => {
    if (!userId) return null;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data();
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};