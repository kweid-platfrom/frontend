// services/userService.js - Core user CRUD operations
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, environment } from "../config/firebase";
import {
    extractNameFromEmail,
    parseDisplayName,
} from "../utils/userUtils";


// Helper to add timeout to Firestore operations
const withTimeout = async (promise, ms = 5000) => {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore operation timed out')), ms);
    });
    return Promise.race([promise, timeout]);
};

/**
 * Create a new user document in Firestore
 * Supports both new format (from Register component) and legacy format conversion
 */
export const createUserDocument = async (firebaseUser, userData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new Error('Invalid Firebase user provided');
    }

    try {
        console.log('Creating user document with data:', { uid: firebaseUser.uid, source, userData });

        if (userData.user_id && userData.profile_info) {
            console.log('Using new format user data from Register component');
            const finalUserData = {
                ...userData,
                profile_info: {
                    ...userData.profile_info,
                    created_at: userData.profile_info.created_at || serverTimestamp(),
                    updated_at: serverTimestamp()
                },
                auth_metadata: {
                    ...userData.auth_metadata,
                    registration_date: userData.auth_metadata.registration_date || serverTimestamp(),
                    last_login: source === 'google' ? serverTimestamp() : null
                }
            };

            const userRef = doc(db, 'users', firebaseUser.uid);
            await withTimeout(setDoc(userRef, finalUserData));
            console.log('User document created successfully with new format');
            return finalUserData;
        }

        console.log('Converting to new format or creating from minimal data');
        const { firstName: parsedFirstName, lastName: parsedLastName } = parseDisplayName(firebaseUser.displayName);

        let firstName = (userData.firstName?.trim() || parsedFirstName || "").trim();
        let lastName = (userData.lastName?.trim() || parsedLastName || "").trim();

        if (!firstName && !lastName) {
            const extractedName = extractNameFromEmail(firebaseUser.email);
            const nameParts = extractedName.split(' ');
            firstName = nameParts[0] || "User";
            lastName = nameParts.slice(1).join(' ') || "";
        }

        const userType = ['individual', 'organization'].includes(userData.userType) ? userData.userType : 'individual';
        const initialRole = userType === 'organization' ? ['admin'] : ['member'];

        const newFormatUserData = {
            user_id: firebaseUser.uid,
            primary_email: firebaseUser.email?.toLowerCase().trim() || "",
            profile_info: {
                name: {
                    first: firstName,
                    last: lastName,
                    display: userData.displayName?.trim() ||
                        firebaseUser.displayName?.trim() ||
                        `${firstName} ${lastName}`.trim() ||
                        extractNameFromEmail(firebaseUser.email) || ""
                },
                timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                avatar_url: userData.avatarURL || firebaseUser.photoURL || null,
                bio: userData.bio?.trim() || "",
                location: userData.location?.trim() || "",
                phone: userData.phone?.trim() || "",
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },
            account_memberships: userData.account_memberships || [],
            session_context: {
                current_account_id: userData.current_account_id || null,
                current_account_type: userType,
                preferences: {
                    theme: 'light',
                    notifications: true,
                    ...userData.preferences
                }
            },
            auth_metadata: {
                registration_method: source === 'google' ? 'google' : 'email',
                email_verified: firebaseUser.emailVerified || false,
                registration_date: serverTimestamp(),
                last_login: source === 'google' ? serverTimestamp() : null,
                ...(source === 'google' && {
                    google_profile: {
                        id: firebaseUser.uid,
                        photo_url: firebaseUser.photoURL
                    }
                })
            },
            role: userData.role || initialRole,
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
                ...(userData.preferences || {})
            },
            environment: environment || 'development',
            source,
            ...(userData.organizationId && { organizationId: userData.organizationId }),
            ...(userData.lastPasswordChange && { lastPasswordChange: userData.lastPasswordChange }),
            ...(userData.deviceHistory && { deviceHistory: userData.deviceHistory }),
        };

        const userRef = doc(db, 'users', firebaseUser.uid);
        await withTimeout(setDoc(userRef, newFormatUserData));
        console.log('User document created successfully (converted to new format)');
        return newFormatUserData;
    } catch (error) {
        console.error('Error creating user document:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
};

/**
 * Fetch user data from Firestore
 * Returns consistent format: { userData, error, isNewUser }
 */
export const fetchUserData = async (userId) => {
    if (!userId) {
        console.error('fetchUserData: No userId provided');
        return { 
            userData: null, 
            error: 'No user ID provided', 
            isNewUser: false
        };
    }

    try {
        console.log('Fetching user data for userId:', userId);
        const userRef = doc(db, "users", userId);
        const userSnap = await withTimeout(getDoc(userRef));

        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User document exists');
            let normalizedData = userData.user_id && userData.profile_info 
                ? userData 
                : normalizeLegacyUserData(userData, userId);
            return {
                userData: normalizedData,
                error: null,
                isNewUser: false
            };
        } else {
            console.log('User document does not exist');
            return {
                userData: null,
                error: null,
                isNewUser: true
            };
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        let errorMessage = 'Failed to fetch user data';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied: User may not have access to this profile';
        } else if (error.message.includes('timed out')) {
            errorMessage = 'Firestore request timed out';
        }
        return {
            userData: null,
            error: errorMessage,
            isNewUser: false
        };
    }
};

/**
 * Update user profile (supports both new and legacy formats)
 */
export const updateUserProfile = async (userId, updateData, currentUserUid) => {
    if (!userId) throw new Error('User ID is required');
    if (currentUserUid !== userId) throw new Error('You can only update your own profile');

    try {
        console.log('Updating user profile:', userId, updateData);
        
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            throw new Error('User profile not found');
        }

        const existingData = userSnap.data();
        const isNewFormat = existingData.user_id && existingData.profile_info;

        let updatePayload;

        if (isNewFormat) {
            updatePayload = buildNewFormatUpdate(existingData, updateData);
        } else {
            updatePayload = buildLegacyFormatUpdate(existingData, updateData);
        }

        await updateDoc(userRef, updatePayload);
        
        // Return fresh data
        const updatedSnap = await getDoc(userRef);
        const updatedData = updatedSnap.data();
        
        return isNewFormat ? updatedData : normalizeLegacyUserData(updatedData, userId);

    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to update this profile.');
        }
        throw new Error(`Failed to update profile: ${error.message}`);
    }
};

/**
 * Helper function to build update payload for new format
 */
const buildNewFormatUpdate = (existingData, updateData) => {
    const updatePayload = {};

    // Handle email updates
    if (updateData.email && updateData.email !== existingData.primary_email) {
        updatePayload.primary_email = updateData.email.toLowerCase().trim();
    }

    // Handle profile info updates
    const profileUpdates = {};
    const nameUpdates = { ...existingData.profile_info.name };

    if (updateData.firstName) {
        nameUpdates.first = updateData.firstName.trim();
        nameUpdates.display = `${nameUpdates.first} ${nameUpdates.last}`.trim();
        profileUpdates.name = nameUpdates;
    }

    if (updateData.lastName) {
        nameUpdates.last = updateData.lastName.trim();
        nameUpdates.display = `${nameUpdates.first} ${nameUpdates.last}`.trim();
        profileUpdates.name = nameUpdates;
    }

    if (updateData.displayName) {
        nameUpdates.display = updateData.displayName.trim();
        profileUpdates.name = nameUpdates;
    }

    // Handle other profile fields
    if (updateData.avatarURL !== undefined) profileUpdates.avatar_url = updateData.avatarURL;
    if (updateData.bio !== undefined) profileUpdates.bio = updateData.bio?.trim() || "";
    if (updateData.location !== undefined) profileUpdates.location = updateData.location?.trim() || "";
    if (updateData.phone !== undefined) profileUpdates.phone = updateData.phone?.trim() || "";
    if (updateData.timezone) profileUpdates.timezone = updateData.timezone;

    if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = serverTimestamp();
        updatePayload.profile_info = {
            ...existingData.profile_info,
            ...profileUpdates
        };
    }

    // Handle auth metadata updates
    if (typeof updateData.emailVerified === 'boolean') {
        updatePayload.auth_metadata = {
            ...existingData.auth_metadata,
            email_verified: updateData.emailVerified
        };
    }

    // Handle preferences updates
    if (updateData.preferences) {
        updatePayload.session_context = {
            ...existingData.session_context,
            preferences: {
                ...existingData.session_context.preferences,
                ...updateData.preferences
            }
        };
    }

    return updatePayload;
};

/**
 * Helper function to build update payload for legacy format
 */
const buildLegacyFormatUpdate = (existingData, updateData) => {
    const updatePayload = {};

    if (updateData.email && updateData.email !== existingData.email) {
        updatePayload.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.firstName) updatePayload.firstName = updateData.firstName.trim();
    if (updateData.lastName) updatePayload.lastName = updateData.lastName.trim();
    if (updateData.displayName) updatePayload.displayName = updateData.displayName.trim();
    if (updateData.avatarURL !== undefined) updatePayload.avatarURL = updateData.avatarURL;
    if (updateData.bio !== undefined) updatePayload.bio = updateData.bio?.trim() || "";
    if (updateData.location !== undefined) updatePayload.location = updateData.location?.trim() || "";
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone?.trim() || "";
    if (typeof updateData.emailVerified === 'boolean') updatePayload.emailVerified = updateData.emailVerified;
    if (updateData.preferences) updatePayload.preferences = updateData.preferences;

    updatePayload.updatedAt = serverTimestamp();
    return updatePayload;
};

/**
 * Helper function to normalize legacy user data to new format
 */
const normalizeLegacyUserData = (userData, userId) => {
    return {
        user_id: userData.uid || userId,
        primary_email: userData.email || "",

        profile_info: {
            name: {
                first: userData.firstName || "",
                last: userData.lastName || "",
                display: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || ""
            },
            timezone: userData.timezone || 'UTC',
            avatar_url: userData.avatarURL || null,
            bio: userData.bio || "",
            location: userData.location || "",
            phone: userData.phone || "",
            created_at: userData.createdAt,
            updated_at: userData.updatedAt
        },

        account_memberships: Array.isArray(userData.account_memberships) ? userData.account_memberships : [],

        session_context: {
            current_account_id: userData.organizationId || null,
            current_account_type: userData.accountType || userData.userType || 'individual',
            preferences: userData.preferences || {
                theme: 'light',
                notifications: true
            }
        },

        auth_metadata: {
            registration_method: userData.registrationMethod || 'email',
            email_verified: userData.emailVerified || false,
            registration_date: userData.createdAt,
            last_login: userData.lastLogin,
            ...(userData.registrationMethod === 'google' && {
                google_profile: {
                    id: userData.uid,
                    photo_url: userData.avatarURL
                }
            })
        },

        // Keep all legacy fields for backward compatibility
        ...userData
    };
};

// =====================================
// HELPER FUNCTIONS FOR CONTEXT TO USE
// =====================================

export const getUserDisplayName = (userData) => {
    if (!userData) return '';
    
    if (userData.profile_info?.name?.display) {
        return userData.profile_info.name.display;
    }
    
    return userData.displayName ||
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
        'User';
};

export const getUserEmail = (userData) => {
    if (!userData) return '';
    return userData.primary_email || userData.email || '';
};

export const getUserAccountType = (userData) => {
    if (!userData) return 'individual';
    
    if (userData.session_context?.current_account_type) {
        return userData.session_context.current_account_type;
    }
    
    return userData.accountType || userData.userType || 'individual';
};

export const isUserAdmin = (userData) => {
    if (!userData) return false;

    // Check role field (legacy)
    if (userData.role && Array.isArray(userData.role) && userData.role.includes('admin')) {
        return true;
    }

    // Check account memberships for admin role
    if (userData.account_memberships && Array.isArray(userData.account_memberships)) {
        return userData.account_memberships.some(membership => 
            membership.role === 'Admin' && membership.status === 'active'
        );
    }

    return false;
};

export const isUserAdminOfAccount = (userData, accountId) => {
    if (!userData || !accountId) return false;

    if (userData.account_memberships && Array.isArray(userData.account_memberships)) {
        return userData.account_memberships.some(membership => 
            membership.account_id === accountId && 
            membership.role === 'Admin' && 
            membership.status === 'active'
        );
    }

    return false;
};

export const getCurrentAccountInfo = (userData) => {
    if (!userData) return null;

    // New format
    if (userData.session_context?.current_account_id) {
        const accountId = userData.session_context.current_account_id;
        const accountType = userData.session_context.current_account_type;
        
        const membership = userData.account_memberships?.find(
            m => m.account_id === accountId
        );

        return {
            account_id: accountId,
            account_type: accountType,
            role: membership?.role || 'Member',
            is_admin: membership?.role === 'Admin'
        };
    }

    // Legacy format fallback
    return {
        account_id: userData.organizationId || userData.user_id,
        account_type: userData.accountType || userData.userType || 'individual',
        role: userData.role?.includes('admin') ? 'Admin' : 'Member',
        is_admin: userData.role?.includes('admin') || false
    };
};

export const hasPermission = (userData) => {
    if (!userData) return false;

    if (isUserAdmin(userData)) {
        return true;
    }

    const currentAccount = getCurrentAccountInfo(userData);
    if (!currentAccount) return false;

    if (currentAccount.account_type === 'individual' && currentAccount.is_admin) {
        return true;
    }

    if (currentAccount.account_type === 'organization' && currentAccount.is_admin) {
        return true;
    }

    return false;
};

// Account creation helper
export const createIndividualAccount = async (userId, accountData) => {
    try {
        const accountRef = doc(db, "individualAccounts", userId);
        const finalAccountData = {
            ...accountData,
            account_profile: {
                ...accountData.account_profile,
                created_at: accountData.account_profile.created_at || serverTimestamp(),
                updated_at: serverTimestamp()
            },
            subscription: {
                ...accountData.subscription,
                started_at: accountData.subscription.started_at || serverTimestamp()
            }
        };

        await setDoc(accountRef, finalAccountData);
        console.log('Individual account created successfully');
        return finalAccountData;
    } catch (error) {
        console.error('Error creating individual account:', error);
        throw new Error(`Failed to create individual account: ${error.message}`);
    }
};

export const subscribeToUserData = (userId, callback, errorCallback) => {
    if (!userId) {
        console.error('subscribeToUserData: No userId provided');
        if (errorCallback) {
            errorCallback({ message: 'No user ID provided' });
        }
        return null;
    }

    try {
        console.log('Subscribing to user data for:', userId);
        const userRef = doc(db, "users", userId);
        return onSnapshot(
            userRef,
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    console.log('User data received:', data);
                    callback(data.user_id && data.profile_info ? data : normalizeLegacyUserData(data, userId));
                } else {
                    console.log('User document does not exist');
                    callback(null);
                }
            },
            (error) => {
                console.error('Subscription error:', error);
                if (errorCallback) {
                    errorCallback(error);
                }
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        if (errorCallback) {
            errorCallback(error);
        }
        return null;
    }
}

export const userService = {
    createUserDocument,
    fetchUserData,  
    updateUserProfile,
    getUserDisplayName,
    getUserEmail,
    getUserAccountType,
    isUserAdmin,
    isUserAdminOfAccount,
    getCurrentAccountInfo,
    hasPermission,
    subscribeToUserData
};

// Export as userService object for backward compatibility
// export const userService = {
//     createUserDocument,
//     fetchUserData,
//     updateUserProfile,
//     getUserDisplayName,
//     getUserEmail,
//     getUserAccountType,
//     isUserAdmin,
//     isUserAdminOfAccount,
//     getCurrentAccountInfo,
//     hasPermission,
//     createIndividualAccount,
//     // Add a getUserProfile method that your hook is expecting
//     getUserProfile: fetchUserData
// };