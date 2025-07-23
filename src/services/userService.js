import { serverTimestamp } from 'firebase/firestore';
import firestoreService from './firestoreService';
import { extractNameFromEmail, parseDisplayName } from '../utils/userUtils';

class UserServiceError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'UserServiceError';
        this.code = code;
    }
}

// Schema for users collection (aligned with FirestoreService expectations):
// {
//   user_id: string (required),
//   email: string (required),
//   display_name: string,
//   contact_info: { firstName: string, lastName: string, timezone: string, bio: string, location: string, phone: string },
//   profile_picture: string|null,
//   account_memberships: Array<{ account_id: string, account_type: string, role: string, status: string }>,
//   created_at: Timestamp,
//   updated_at: Timestamp,
//   created_by: string,
//   updated_by: string
// }

export const createUserDocument = async (firebaseUser, userData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new UserServiceError('Invalid Firebase user provided', 'INVALID_USER');
    }

    try {
        console.log('Creating user document with data:', { uid: firebaseUser.uid, source, userData });

        const { firstName: parsedFirstName, lastName: parsedLastName } = parseDisplayName(firebaseUser.displayName);

        let firstName = (userData.firstName?.trim() || parsedFirstName || '').trim();
        let lastName = (userData.lastName?.trim() || parsedLastName || '').trim();

        if (!firstName && !lastName) {
            const extractedName = extractNameFromEmail(firebaseUser.email);
            const nameParts = extractedName.split(' ');
            firstName = nameParts[0] || 'User';
            lastName = nameParts.slice(1).join(' ') || '';
            console.log('Extracted name from email:', { firstName, lastName });
        }

        const displayName = userData.displayName?.trim() ||
            firebaseUser.displayName?.trim() ||
            `${firstName} ${lastName}`.trim() ||
            firstName ||
            'User';

        if (!firebaseUser.email) {
            throw new UserServiceError('Email is required', 'INVALID_EMAIL');
        }

        const newUserData = {
            user_id: firebaseUser.uid,
            email: firebaseUser.email.toLowerCase().trim(),
            display_name: displayName,
            contact_info: {
                firstName,
                lastName,
                timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                bio: userData.bio?.trim() || '',
                location: userData.location?.trim() || '',
                phone: userData.phone?.trim() || '',
            },
            profile_picture: userData.avatarURL || firebaseUser.photoURL || null,
            account_memberships: userData.account_memberships || [],
            // Map auth_metadata to preferences for compatibility
            preferences: {
                registration_method: source === 'google' ? 'google' : 'email',
                email_verified: firebaseUser.emailVerified || false,
                registration_date: serverTimestamp(),
                last_login: source === 'google' ? serverTimestamp() : null,
                ...(source === 'google' && {
                    google_profile: {
                        id: firebaseUser.uid,
                        photo_url: firebaseUser.photoURL,
                    },
                }),
                environment: userData.environment || 'development',
                ...(userData.organizationId && { organizationId: userData.organizationId }),
            },
        };

        const result = await firestoreService.createOrUpdateUserProfile(newUserData);
        if (!result.success) {
            throw new UserServiceError(
                result.error.message || 'Failed to create user profile',
                result.error.code || 'CREATE_ERROR'
            );
        }

        console.log('User document created successfully:', result.data);
        return result.data;
    } catch (error) {
        console.error('Error creating user document:', error);
        throw new UserServiceError(
            error.message || 'Failed to create user profile',
            error.code || 'CREATE_ERROR'
        );
    }
};

export const fetchUserData = async (userId) => {
    if (!userId) {
        throw new UserServiceError('No user ID provided', 'INVALID_USER');
    }

    const currentUserId = firestoreService.getCurrentUserId();
    if (userId !== currentUserId) {
        throw new UserServiceError('Cannot fetch other users\' data', 'PERMISSION_DENIED');
    }

    try {
        console.log('Fetching user data for userId:', userId);
        const result = await firestoreService.getUserProfile(userId);

        if (result.success && result.data) {
            console.log('User document exists:', result.data);
            return {
                userData: result.data,
                error: null,
                isNewUser: false,
            };
        } else if (result.error?.code === 'not-found') {
            console.log('User document does not exist');
            return {
                userData: null,
                error: null,
                isNewUser: true,
            };
        } else {
            throw new UserServiceError(
                result.error?.message || 'Failed to fetch user data',
                result.error?.code || 'FETCH_ERROR'
            );
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw new UserServiceError(
            error.message || 'Failed to fetch user data',
            error.code || 'FETCH_ERROR'
        );
    }
};

export const updateUserProfile = async (userId, updateData, currentUserUid) => {
    if (!userId) throw new UserServiceError('User ID is required', 'INVALID_USER');
    if (currentUserUid !== userId) throw new UserServiceError('You can only update your own profile', 'PERMISSION_DENIED');

    try {
        console.log('Updating user profile:', userId, updateData);
        const result = await firestoreService.getUserProfile(userId);
        if (!result.success) {
            throw new UserServiceError(
                result.error?.message || 'User profile not found',
                result.error?.code || 'NOT_FOUND'
            );
        }

        const existingData = result.data;
        const updatePayload = buildUpdatePayload(existingData, updateData);

        const updateResult = await firestoreService.updateDocument('users', userId, updatePayload);
        if (!updateResult.success) {
            throw new UserServiceError(
                updateResult.error?.message || 'Failed to update user profile',
                updateResult.error?.code || 'UPDATE_ERROR'
            );
        }

        const updatedProfile = await firestoreService.getUserProfile(userId);
        if (!updatedProfile.success) {
            throw new UserServiceError(
                'Failed to fetch updated profile',
                updatedProfile.error?.code || 'FETCH_ERROR'
            );
        }

        return updatedProfile.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new UserServiceError(
            error.message || 'Failed to update profile',
            error.code || 'UPDATE_ERROR'
        );
    }
};

const buildUpdatePayload = (existingData, updateData) => {
    const updatePayload = {};

    if (updateData.email && updateData.email !== existingData.email) {
        updatePayload.email = updateData.email.toLowerCase().trim();
    }

    const contactInfoUpdates = {};
    const contactInfo = existingData.contact_info || {};

    if (updateData.firstName !== undefined) {
        contactInfoUpdates.firstName = updateData.firstName.trim();
        updatePayload.display_name = `${contactInfoUpdates.firstName} ${contactInfo.lastName || ''}`.trim();
    }

    if (updateData.lastName !== undefined) {
        contactInfoUpdates.lastName = updateData.lastName.trim();
        updatePayload.display_name = `${contactInfo.firstName || ''} ${contactInfoUpdates.lastName}`.trim();
    }

    if (updateData.displayName !== undefined) {
        updatePayload.display_name = updateData.displayName.trim();
    }

    if (updateData.avatarURL !== undefined) updatePayload.profile_picture = updateData.avatarURL;
    if (updateData.bio !== undefined) contactInfoUpdates.bio = updateData.bio?.trim() || '';
    if (updateData.location !== undefined) contactInfoUpdates.location = updateData.location?.trim() || '';
    if (updateData.phone !== undefined) contactInfoUpdates.phone = updateData.phone?.trim() || '';
    if (updateData.timezone !== undefined) contactInfoUpdates.timezone = updateData.timezone;

    if (Object.keys(contactInfoUpdates).length > 0) {
        updatePayload.contact_info = {
            ...contactInfo,
            ...contactInfoUpdates,
        };
    }

    const preferencesUpdates = {};
    const preferences = existingData.preferences || {};

    if (typeof updateData.emailVerified === 'boolean') {
        preferencesUpdates.email_verified = updateData.emailVerified;
    }

    if (updateData.environment !== undefined) {
        preferencesUpdates.environment = updateData.environment;
    }

    if (updateData.organizationId !== undefined) {
        preferencesUpdates.organizationId = updateData.organizationId;
    }

    if (Object.keys(preferencesUpdates).length > 0) {
        updatePayload.preferences = {
            ...preferences,
            ...preferencesUpdates,
        };
    }

    if (updateData.account_memberships !== undefined) {
        updatePayload.account_memberships = updateData.account_memberships;
    }

    return updatePayload;
};

export const getUserDisplayName = (userData) => {
    if (!userData) {
        console.warn('getUserDisplayName: No user data provided');
        return '';
    }

    return userData.display_name ||
           userData.email ||
           'User';
};

export const getAvatarInitials = (userData) => {
    if (!userData) {
        console.warn('getAvatarInitials: No user data provided');
        return '';
    }

    const firstName = userData.contact_info?.firstName || '';
    const lastName = userData.contact_info?.lastName || '';
    
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
        return firstName.slice(0, 2).toUpperCase();
    } else if (lastName) {
        return lastName.slice(0, 2).toUpperCase();
    }

    const email = userData.email || '';
    return email.slice(0, 2).toUpperCase() || '';
};

export const getUserEmail = (userData) => {
    return userData?.email || '';
};

export const getUserAccountType = (userData) => {
    return userData?.account_memberships?.[0]?.account_type || 'individual';
};

export const isUserAdmin = (userData) => {
    if (!userData) return false;
    return userData.account_memberships?.some(
        (membership) => membership.role === 'Admin' && membership.status === 'active'
    ) || false;
};

export const isUserAdminOfAccount = (userData, accountId) => {
    if (!userData || !accountId) return false;
    return userData.account_memberships?.some(
        (membership) =>
            membership.account_id === accountId &&
            membership.role === 'Admin' &&
            membership.status === 'active'
    ) || false;
};

export const getCurrentAccountInfo = (userData) => {
    if (!userData) return null;
    const membership = userData.account_memberships?.[0];
    return {
        account_id: membership?.account_id || userData.user_id,
        account_type: membership?.account_type || 'individual',
        role: membership?.role || 'Member',
        is_admin: membership?.role === 'Admin',
    };
};

export const hasPermission = (userData) => {
    if (!userData) return false;
    const currentAccount = getCurrentAccountInfo(userData);
    return currentAccount?.is_admin || false;
};

export const createIndividualAccount = async (userId, accountData) => {
    if (!userId) throw new UserServiceError('User ID is required', 'INVALID_USER');

    try {
        const finalAccountData = {
            user_id: userId,
            account_type: 'individual',
            account_profile: {
                ...accountData.account_profile,
            },
            subscription: {
                started_at: serverTimestamp(),
                ...accountData.subscription,
            },
        };

        const result = await firestoreService.createDocument('individualAccounts', finalAccountData, userId);
        if (!result.success) {
            throw new UserServiceError(
                result.error?.message || 'Failed to create individual account',
                result.error?.code || 'CREATE_ACCOUNT_ERROR'
            );
        }

        console.log('Individual account created successfully:', result.data);
        return result.data;
    } catch (error) {
        console.error('Error creating individual account:', error);
        throw new UserServiceError(
            error.message || 'Failed to create individual account',
            error.code || 'CREATE_ACCOUNT_ERROR'
        );
    }
};

export const subscribeToUserData = (userId, callback, errorCallback) => {
    if (!userId) {
        console.error('subscribeToUserData: No userId provided');
        if (errorCallback) {
            errorCallback(new UserServiceError('No user ID provided', 'INVALID_USER'));
        }
        return () => {};
    }

    const currentUserId = firestoreService.getCurrentUserId();
    if (userId !== currentUserId) {
        if (errorCallback) {
            errorCallback(new UserServiceError('Cannot subscribe to other users\' data', 'PERMISSION_DENIED'));
        }
        return () => {};
    }

    try {
        console.log('Subscribing to user data for:', userId);
        return firestoreService.subscribeToDocument(
            'users',
            userId,
            (data) => {
                console.log('User data received:', data);
                callback({ userData: data, isNewUser: !data });
            },
            (error) => {
                console.error('Subscription error:', error);
                if (errorCallback) {
                    errorCallback(new UserServiceError(
                        error.error?.message || 'Subscription failed',
                        error.error?.code || 'SUBSCRIPTION_ERROR'
                    ));
                }
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        if (errorCallback) {
            errorCallback(new UserServiceError(
                error.message || 'Subscription failed',
                error.code || 'SUBSCRIPTION_ERROR'
            ));
        }
        return () => {};
    }
};

export const cleanup = () => {
    firestoreService.cleanup();
};

export const userService = {
    createUserDocument,
    fetchUserData,
    updateUserProfile,
    getUserDisplayName,
    getAvatarInitials,
    getUserEmail,
    getUserAccountType,
    isUserAdmin,
    isUserAdminOfAccount,
    getCurrentAccountInfo,
    hasPermission,
    createIndividualAccount,
    subscribeToUserData,
    cleanup,
};

export default userService;