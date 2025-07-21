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

        const newUserData = {
            user_id: firebaseUser.uid,
            primary_email: firebaseUser.email?.toLowerCase().trim() || '',
            profile_info: {
                name: {
                    first: firstName,
                    last: lastName,
                    display: displayName,
                },
                timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                avatar_url: userData.avatarURL || firebaseUser.photoURL || null,
                bio: userData.bio?.trim() || '',
                location: userData.location?.trim() || '',
                phone: userData.phone?.trim() || '',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            },
            account_memberships: userData.account_memberships || [],
            auth_metadata: {
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
            },
            environment: userData.environment || 'development',
            ...(userData.organizationId && { organizationId: userData.organizationId }),
        };

        const result = await firestoreService.createOrUpdateUserProfile(newUserData);
        if (!result.success) {
            throw new UserServiceError(result.error.message || 'Failed to create user profile', result.error.code);
        }

        console.log('User document created successfully:', result.data);
        return result.data;
    } catch (error) {
        console.error('Error creating user document:', error);
        throw new UserServiceError(`Failed to create user profile: ${error.message}`, error.code || 'CREATE_ERROR');
    }
};

export const fetchUserData = async (userId) => {
    if (!userId) {
        console.error('fetchUserData: No userId provided');
        return { userData: null, error: 'No user ID provided', isNewUser: false };
    }

    try {
        console.log('Fetching user data for userId:', userId);
        const result = await firestoreService.getUserProfile(userId);

        if (result.success) {
            console.log('User document exists:', result.data);
            return {
                userData: result.data,
                error: null,
                isNewUser: false,
            };
        } else if (result.error.code === 'not-found') {
            console.log('User document does not exist');
            return {
                userData: null,
                error: null,
                isNewUser: true,
            };
        } else {
            throw new UserServiceError(result.error.message, result.error.code);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        const errorMessage = error.code === 'permission-denied'
            ? 'Permission denied: User may not have access to this profile'
            : `Failed to fetch user data: ${error.message}`;
        return {
            userData: null,
            error: errorMessage,
            isNewUser: false,
        };
    }
};

export const updateUserProfile = async (userId, updateData, currentUserUid) => {
    if (!userId) throw new UserServiceError('User ID is required', 'INVALID_USER');
    if (currentUserUid !== userId) throw new UserServiceError('You can only update your own profile', 'PERMISSION_DENIED');

    try {
        console.log('Updating user profile:', userId, updateData);
        const result = await firestoreService.getUserProfile(userId);
        if (!result.success) {
            throw new UserServiceError('User profile not found', result.error.code || 'NOT_FOUND');
        }

        const updatePayload = buildUpdatePayload(result.data, updateData);
        const updateResult = await firestoreService.updateDocument('users', userId, updatePayload);
        if (!updateResult.success) {
            throw new UserServiceError(updateResult.error.message || 'Failed to update user profile', updateResult.error.code);
        }

        const updatedProfile = await firestoreService.getUserProfile(userId);
        if (!updatedProfile.success) {
            throw new UserServiceError('Failed to fetch updated profile', updatedProfile.error.code);
        }

        return updatedProfile.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new UserServiceError(
            error.code === 'permission-denied'
                ? 'You do not have permission to update this profile'
                : `Failed to update profile: ${error.message}`,
            error.code || 'UPDATE_ERROR'
        );
    }
};

const buildUpdatePayload = (existingData, updateData) => {
    const updatePayload = {};

    if (updateData.email && updateData.email !== existingData.primary_email) {
        updatePayload.primary_email = updateData.email.toLowerCase().trim();
    }

    const profileUpdates = {};
    const nameUpdates = { ...existingData.profile_info.name };

    if (updateData.firstName) {
        nameUpdates.first = updateData.firstName.trim();
        nameUpdates.display = `${nameUpdates.first} ${nameUpdates.last || ''}`.trim();
        profileUpdates.name = nameUpdates;
    }

    if (updateData.lastName) {
        nameUpdates.last = updateData.lastName.trim();
        nameUpdates.display = `${nameUpdates.first || ''} ${nameUpdates.last}`.trim();
        profileUpdates.name = nameUpdates;
    }

    if (updateData.displayName) {
        nameUpdates.display = updateData.displayName.trim();
        profileUpdates.name = nameUpdates;
    }

    if (updateData.avatarURL !== undefined) profileUpdates.avatar_url = updateData.avatarURL;
    if (updateData.bio !== undefined) profileUpdates.bio = updateData.bio?.trim() || '';
    if (updateData.location !== undefined) profileUpdates.location = updateData.location?.trim() || '';
    if (updateData.phone !== undefined) profileUpdates.phone = updateData.phone?.trim() || '';
    if (updateData.timezone) profileUpdates.timezone = updateData.timezone;

    if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = serverTimestamp();
        updatePayload.profile_info = {
            ...existingData.profile_info,
            ...profileUpdates,
        };
    }

    if (typeof updateData.emailVerified === 'boolean') {
        updatePayload.auth_metadata = {
            ...existingData.auth_metadata,
            email_verified: updateData.emailVerified,
        };
    }

    if (updateData.account_memberships) {
        updatePayload.account_memberships = updateData.account_memberships;
    }

    return updatePayload;
};

export const getUserDisplayName = (userData) => {
    if (!userData) {
        console.warn('getUserDisplayName: No user data provided');
        return '';
    }

    return userData.profile_info?.name?.display || userData.primary_email || 'User';
};

export const getAvatarInitials = (userData) => {
    if (!userData) {
        console.warn('getAvatarInitials: No user data provided');
        return '';
    }

    const firstName = userData.profile_info?.name?.first || '';
    const lastName = userData.profile_info?.name?.last || '';
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
        return firstName.slice(0, 2).toUpperCase();
    } else if (lastName) {
        return lastName.slice(0, 2).toUpperCase();
    }

    return userData.primary_email?.slice(0, 2).toUpperCase() || '';
};

export const getUserEmail = (userData) => {
    return userData?.primary_email || '';
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
    try {
        const finalAccountData = {
            user_id: userId,
            account_type: 'individual',
            account_profile: {
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                ...accountData.account_profile,
            },
            subscription: {
                started_at: serverTimestamp(),
                ...accountData.subscription,
            },
        };
        const result = await firestoreService.createDocument('individualAccounts', finalAccountData, userId);
        if (!result.success) {
            throw new UserServiceError(result.error.message || 'Failed to create individual account', result.error.code);
        }
        console.log('Individual account created successfully:', result.data);
        return result.data;
    } catch (error) {
        console.error('Error creating individual account:', error);
        throw new UserServiceError(`Failed to create individual account: ${error.message}`, error.code || 'CREATE_ACCOUNT_ERROR');
    }
};

export const subscribeToUserData = (userId, callback, errorCallback) => {
    if (!userId) {
        console.error('subscribeToUserData: No userId provided');
        if (errorCallback) {
            errorCallback(new UserServiceError('No user ID provided', 'INVALID_USER'));
        }
        return () => { };
    }

    try {
        console.log('Subscribing to user data for:', userId);
        return firestoreService.subscribeToUserProfile(
            userId,
            (data) => {
                console.log('User data received:', data);
                callback(data);
            },
            (error) => {
                console.error('Subscription error:', error);
                if (errorCallback) {
                    errorCallback(new UserServiceError(error.message, error.code));
                }
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        if (errorCallback) {
            errorCallback(new UserServiceError(error.message, error.code || 'SUBSCRIPTION_ERROR'));
        }
        return () => { };
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