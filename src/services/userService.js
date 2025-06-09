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
            setupCompleted: Boolean(additionalData.setupCompleted) || false,

            bio: additionalData.bio?.trim() || "",
            location: additionalData.location?.trim() || "",
            phone: additionalData.phone?.trim() || "",
            role: additionalData.role || ['member'],

            registrationMethod: source === 'google' ? 'google' : 'email',
            lastLogin: serverTimestamp(),
            lastPasswordChange: source === 'email' ? serverTimestamp() : null,
            deviceHistory: [],

            setupStep: additionalData.setupStep || 'pending',
            onboardingProgress: {
                emailVerified: firebaseUser.emailVerified || false,
                organizationInfo: accountType === 'organization',
                teamInvites: accountType === 'organization',
                projectCreation: false,
                ...(additionalData.onboardingProgress || {})
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
        if (!userData.uid || !userData.email || !userData.firstName) {
            throw new Error('Missing required fields: uid, email, or firstName');
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
        // More explicit error handling here if needed
        throw new Error(`Failed to create user profile: ${error.message}`);
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
        const userSnap = await Promise.race([
            getDoc(userRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database read timeout')), 5000))
        ]);

        if (userSnap.exists()) {
            const existingData = userSnap.data();
            // Update last login timestamp but don't fail if error
            setDoc(userRef, {
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true }).catch(() => {});

            return {
                isNewUser: false,
                userData: existingData,
                needsSetup: !existingData.setupCompleted,
                error: null
            };
        }

        const userData = await createUserDocument(firebaseUser, additionalData, source);

        return {
            isNewUser: true,
            userData,
            needsSetup: !userData.setupCompleted,
            error: null
        };

    } catch (error) {
        return {
            isNewUser: false,
            userData: null,
            needsSetup: false,
            error: error.message
        };
    }
};

export const completeUserSetup = async (userId, setupData) => {
    if (!userId) throw new Error('User ID is required');

    try {
        const userRef = doc(db, 'users', userId);

        const updateData = {
            ...(setupData.displayName && { displayName: setupData.displayName.trim() }),
            ...(setupData.firstName && { firstName: setupData.firstName.trim() }),
            ...(setupData.lastName && { lastName: setupData.lastName.trim() }),
            ...(setupData.email && { email: setupData.email.toLowerCase().trim() }),
            ...(typeof setupData.emailVerified === 'boolean' && { emailVerified: setupData.emailVerified }),
            ...(setupData.avatarURL !== undefined && { avatarURL: setupData.avatarURL }),
            ...(setupData.accountType && { 
                accountType: setupData.accountType,
                userType: setupData.accountType
            }),
            ...(setupData.organizationId !== undefined && { organizationId: setupData.organizationId }),
            ...(typeof setupData.setupCompleted === 'boolean' && { setupCompleted: setupData.setupCompleted }),

            ...(setupData.phone && { phone: setupData.phone.trim() }),
            ...(setupData.bio && { bio: setupData.bio.trim() }),
            ...(setupData.location && { location: setupData.location.trim() }),

            setupCompleted: true,
            setupStep: 'completed',
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        };

        await setDoc(userRef, updateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to update this user profile.');
        }
        throw new Error(`Failed to complete user setup: ${error.message}`);
    }
};

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
            ...(updateData.accountType && {
                accountType: updateData.accountType,
                userType: updateData.accountType
            }),
            ...(updateData.organizationId !== undefined && { organizationId: updateData.organizationId }),
            ...(typeof updateData.setupCompleted === 'boolean' && { setupCompleted: updateData.setupCompleted }),

            updatedAt: serverTimestamp()
        };

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
        if (error.code === 'permission-denied') {
            console.error('Permission denied: User may not have access to this profile');
        }
        return null;
    }
};

// Utility to validate user data against rules
export const validateUserData = (userData, isCreate = false) => {
    const errors = [];

    if (isCreate) {
        if (!userData.uid) errors.push('uid is required');
        if (!userData.email) errors.push('email is required');
        if (!userData.firstName) errors.push('firstName is required');
    }

    if (userData.uid && typeof userData.uid !== 'string') errors.push('uid must be string');
    if (userData.email && typeof userData.email !== 'string') errors.push('email must be string');
    if (userData.firstName && typeof userData.firstName !== 'string') errors.push('firstName must be string');
    if (userData.lastName && typeof userData.lastName !== 'string') errors.push('lastName must be string');
    if (userData.emailVerified && typeof userData.emailVerified !== 'boolean') errors.push('emailVerified must be boolean');
    if (userData.displayName && typeof userData.displayName !== 'string') errors.push('displayName must be string');
    if (userData.avatarURL && userData.avatarURL !== null && typeof userData.avatarURL !== 'string') errors.push('avatarURL must be string or null');
    if (userData.accountType && !['individual', 'organization'].includes(userData.accountType)) errors.push('accountType must be individual or organization');
    if (userData.userType && !['individual', 'organization'].includes(userData.userType)) errors.push('userType must be individual or organization');
    if (userData.organizationId && userData.organizationId !== null && typeof userData.organizationId !== 'string') errors.push('organizationId must be string or null');
    if (userData.setupCompleted && typeof userData.setupCompleted !== 'boolean') errors.push('setupCompleted must be boolean');

    return {
        isValid: errors.length === 0,
        errors
    };
};
