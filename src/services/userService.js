// userService.js - Core user CRUD operations only
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, environment } from "../config/firebase";
import {
    extractNameFromEmail,
    parseDisplayName,
    validateUserData
} from "../utils/userUtils";
import {
    normalizeOnboardingProgress,
    initializeOnboardingStatus,
    initializeOnboardingProgress
} from "../utils/onboardingUtils";

/**
 * Create a new user document in Firestore
 */
export const createUserDocument = async (firebaseUser, additionalData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new Error('Invalid Firebase user provided');
    }

    try {
        // Parse display name for Google users or fallback
        const { firstName: parsedFirstName, lastName: parsedLastName } = parseDisplayName(firebaseUser.displayName);

        // Use additionalData or parsed names, fallback to email extraction
        let firstName = (additionalData.firstName?.trim() || parsedFirstName || "").trim();
        let lastName = (additionalData.lastName?.trim() || parsedLastName || "").trim();

        if (!firstName && !lastName) {
            const extractedName = extractNameFromEmail(firebaseUser.email);
            const nameParts = extractedName.split(' ');
            firstName = nameParts[0] || "User";
            lastName = nameParts.slice(1).join(' ') || "";
        }

        // Normalize userType/accountType - default to 'individual'
        const userTypeRaw = additionalData.userType || additionalData.accountType || 'individual';
        const userType = ['individual', 'organization'].includes(userTypeRaw) ? userTypeRaw : 'individual';
        const accountType = userType;

        // Determine initial setup step based on account type and source
        let initialSetupStep = 'email_verification';
        if (source === 'google') {
            // Google users skip email verification
            initialSetupStep = accountType === 'organization' ? 'organization_info' : 'profile_setup';
        }

        // Set role - first organization user becomes admin, individuals are members
        const initialRole = accountType === 'organization' ? ['admin'] : ['member'];

        // Initialize consistent onboarding structures
        const onboardingProgress = initializeOnboardingProgress(accountType);
        const onboardingStatus = initializeOnboardingStatus(accountType);

        // Update progress based on source and email verification
        if (firebaseUser.emailVerified) {
            onboardingProgress.emailVerified = true;
        }

        // Build user data aligned with your security rules & register flow
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email?.toLowerCase().trim() || "",
            firstName,
            lastName,

            emailVerified: firebaseUser.emailVerified || false,
            displayName: additionalData.displayName?.trim() ||
                firebaseUser.displayName?.trim() ||
                `${firstName} ${lastName}`.trim() ||
                extractNameFromEmail(firebaseUser.email) || "",
            avatarURL: additionalData.avatarURL || firebaseUser.photoURL || null,
            accountType,
            userType,
            organizationId: additionalData.organizationId || null,

            // Don't set setupCompleted to true by default - must be explicitly completed
            setupCompleted: Boolean(additionalData.setupCompleted) || false,

            bio: additionalData.bio?.trim() || "",
            location: additionalData.location?.trim() || "",
            phone: additionalData.phone?.trim() || "",

            // Set appropriate initial role
            role: initialRole,

            registrationMethod: source === 'google' ? 'google' : 'email',
            lastLogin: serverTimestamp(),
            lastPasswordChange: source === 'email' ? serverTimestamp() : null,
            deviceHistory: [],

            // Set appropriate setup step
            setupStep: initialSetupStep,

            // Use consistent onboarding progress structure
            onboardingProgress: {
                ...onboardingProgress,
                ...(additionalData.onboardingProgress || {})
            },

            // Use consistent onboarding status structure
            onboardingStatus: {
                ...onboardingStatus,
                ...(additionalData.onboardingStatus || {})
            },

            preferences: {
                notifications: {
                    newMessages: true,
                    productUpdates: false,
                    securityAlerts: true
                },
                pushNotifications: {
                    approvalRequests: true,
                    newMessages: true,
                    productUpdates: true,
                    reminders: false
                },
                ...(additionalData.preferences || {})
            },

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            environment: environment || 'development',
            source
        };

        // Validate required fields
        const validation = validateUserData(userData, true);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Security check
        if (userData.uid !== firebaseUser.uid) {
            throw new Error('UID mismatch: document UID must match authenticated user UID');
        }

        const userRef = doc(db, 'users', firebaseUser.uid);

        await Promise.race([
            setDoc(userRef, userData),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database write timeout')), 10000))
        ]);

        return userData;

    } catch (error) {
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
};

/**
 * Fetch user data from Firestore
 */
export const fetchUserData = async (userId) => {
    if (!userId) return null;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            // Return data with normalized onboarding progress for consistent access
            return {
                ...userData,
                onboardingProgress: normalizeOnboardingProgress(userData.onboardingProgress)
            };
        }

        return null;
    } catch (error) {
        if (error.code === 'permission-denied') {
            console.error('Permission denied: User may not have access to this profile');
        }
        return null;
    }
};

/**
 * Update user profile (basic profile data only)
 */
export const updateUserProfile = async (userId, updateData, currentUserUid) => {
    if (!userId) throw new Error('User ID is required');
    if (currentUserUid !== userId) throw new Error('You can only update your own profile');

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error('User profile not found');
        const existingData = userSnap.data();

        const safeUpdateData = {
            uid: existingData.uid, // immutable

            ...(updateData.email && updateData.email !== existingData.email && {
                email: updateData.email.toLowerCase().trim()
            }),
            ...(updateData.firstName && { firstName: updateData.firstName.trim() }),
            ...(updateData.lastName && { lastName: updateData.lastName.trim() }),
            ...(typeof updateData.emailVerified === 'boolean' && { emailVerified: updateData.emailVerified }),
            ...(updateData.displayName && { displayName: updateData.displayName.trim() }),
            ...(updateData.avatarURL !== undefined && { avatarURL: updateData.avatarURL }),
            ...(updateData.bio !== undefined && { bio: updateData.bio?.trim() || "" }),
            ...(updateData.location !== undefined && { location: updateData.location?.trim() || "" }),
            ...(updateData.phone !== undefined && { phone: updateData.phone?.trim() || "" }),

            updatedAt: serverTimestamp()
        };

        // Validate the update data
        const validation = validateUserData(safeUpdateData, false);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        await setDoc(userRef, safeUpdateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to update this profile.');
        }
        throw new Error(`Failed to update profile: ${error.message}`);
    }
};