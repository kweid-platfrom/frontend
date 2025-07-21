import { serverTimestamp } from "firebase/firestore";
import firestoreService from "./firestoreService";

class AccountSetupError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'AccountSetupError';
        this.code = code;
    }
}

let isSetupInProgress = false;

export const getAccountSetupStatus = async (userId) => {
    try {
        if (!userId) {
            return { exists: false, needsSetup: true, error: 'User ID required' };
        }

        const result = await firestoreService.getUserProfile(userId);
        if (!result.success) {
            return { exists: false, needsSetup: true, error: result.error.message };
        }

        const userData = result.data;
        const hasBasicInfo = userData.profile_info?.name?.first && userData.email; // Changed from primary_email
        const hasAccountStructure = userData.account_memberships?.length > 0;

        const isComplete = hasBasicInfo && hasAccountStructure;

        return {
            exists: true,
            needsSetup: !isComplete,
            userData,
            hasBasicInfo,
            hasAccountStructure,
            emailVerified: userData.auth_metadata?.email_verified || false,
        };
    } catch (error) {
        console.error('Error checking account setup status:', error);
        return { exists: false, needsSetup: true, error: error.message };
    }
};

export const shouldRunAccountSetup = async (userId) => {
    try {
        if (isSetupInProgress) {
            console.log('Account setup already in progress, skipping...');
            return false;
        }

        const currentUser = firestoreService.getCurrentUser();
        if (currentUser && currentUser.emailVerified) {
            console.log('User email is verified, skipping account setup and clearing registration state...');
            clearRegistrationState();
            return false;
        }

        if (!window.isRegistering) {
            console.log('Not in registration mode, skipping account setup...');
            return false;
        }

        const status = await getAccountSetupStatus(userId);
        if (status.exists && status.userData?.auth_metadata?.email_verified) {
            console.log('User exists and email is verified, clearing registration state...');
            clearRegistrationState();
            return false;
        }

        const shouldRun = (!status.exists || status.needsSetup) && window.isRegistering;

        console.log('Account setup check:', {
            userId,
            exists: status.exists,
            needsSetup: status.needsSetup,
            emailVerified: status.userData?.auth_metadata?.email_verified || false,
            currentUserVerified: currentUser?.emailVerified || false,
            isRegistering: window.isRegistering,
            shouldRun,
        });

        return shouldRun;
    } catch (error) {
        console.error('Error checking if account setup should run:', error);
        return false;
    }
};

export const clearRegistrationState = () => {
    if (typeof window !== 'undefined') {
        window.isRegistering = false;
        isSetupInProgress = false;

        try {
            localStorage.removeItem('registrationInProgress');
            localStorage.removeItem('pendingEmailVerification');
        } catch (e) {
            console.warn('Could not clear localStorage items:', e);
        }

        console.log('Registration state cleared completely');
    }
};

export const handlePostVerification = async (userId) => {
    try {
        console.log('Handling post-verification cleanup for user:', userId);
        clearRegistrationState();

        const userStatus = await getAccountSetupStatus(userId);
        if (userStatus.exists && userStatus.userData && !userStatus.userData.auth_metadata?.email_verified) {
            const updateResult = await firestoreService.updateDocument('users', userId, {
                auth_metadata: {
                    ...userStatus.userData.auth_metadata,
                    email_verified: true,
                },
                profile_info: {
                    ...userStatus.userData.profile_info,
                    updated_at: serverTimestamp(),
                },
            });

            if (!updateResult.success) {
                console.error('Failed to update emailVerified status:', updateResult.error);
            } else {
                console.log('Updated user emailVerified status in Firestore');
            }
        }

        return { success: true, message: 'Post-verification cleanup completed' };
    } catch (error) {
        console.error('Error in post-verification cleanup:', error);
        return { success: false, error: { message: error.message, code: error.code || 'POST_VERIFICATION_ERROR' } };
    }
};

export const setupAccount = async (setupData) => {
    try {
        const userId = setupData.userId || (setupData.user && setupData.user.uid);
        if (!userId) {
            throw new AccountSetupError('User ID is required for account setup', 'INVALID_USER');
        }

        const shouldRun = await shouldRunAccountSetup(userId);
        if (!shouldRun) {
            console.log('Account setup not needed or not in registration flow, skipping...');
            return {
                success: true,
                skipped: true,
                message: 'Account setup not needed or not in registration flow',
            };
        }

        if (isSetupInProgress) {
            console.log('Account setup already in progress, returning...');
            return { success: false, error: { message: 'Setup already in progress', code: 'SETUP_IN_PROGRESS' } };
        }

        isSetupInProgress = true;
        window.isRegistering = true;

        let user = setupData.user;
        if (!user) {
            user = firestoreService.getCurrentUser();
            if (!user) {
                throw new AccountSetupError('No authenticated user found', 'NO_AUTHENTICATED_USER');
            }
        }

        // CRITICAL FIX: Use the exact email from Firebase Auth without modification
        const email = user.email; // Don't lowercase or trim here
        const accountType = setupData.accountType || determineAccountType(email);

        console.log('Setting up account for user:', { userId, email, accountType });

        // CRITICAL FIX: Match your security rules exactly
        const userProfileData = {
            user_id: userId,
            email: email, // Use 'email' not 'primary_email' to match security rules
            primary_email: email.toLowerCase().trim(), // Keep this for app logic
            profile_info: {
                name: {
                    first: setupData.firstName || '',
                    last: setupData.lastName || '',
                    display: `${setupData.firstName || ''} ${setupData.lastName || ''}`.trim() || 'User',
                },
                timezone: setupData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                avatar_url: null,
                bio: '',
                location: '',
                phone: '',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            },
            account_memberships: [],
            auth_metadata: {
                registration_method: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
                email_verified: user.emailVerified || false,
                registration_date: serverTimestamp(),
                last_login: serverTimestamp(),
            },
            environment: 'production',
        };

        console.log('Creating user profile:', userProfileData);
        const userResult = await firestoreService.createOrUpdateUserProfile(userProfileData);
        if (!userResult.success) {
            throw new AccountSetupError(userResult.error.message || 'Failed to create user profile', userResult.error.code);
        }

        let organizationData = null;

        if (accountType === 'individual') {
            const individualAccountData = {
                user_id: userId,
                account_type: 'individual',
                profile: {
                    email: email.toLowerCase().trim(),
                    first_name: setupData.firstName || '',
                    last_name: setupData.lastName || '',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                },
                status: 'active',
            };

            console.log('Creating individual account:', individualAccountData);
            const individualResult = await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
            if (!individualResult.success) {
                throw new AccountSetupError(individualResult.error.message || 'Failed to create individual account', individualResult.error.code);
            }

            const userUpdate = await firestoreService.updateDocument('users', userId, {
                account_memberships: [{
                    account_id: userId,
                    account_type: 'individual',
                    role: 'Admin',
                    status: 'active',
                }],
                profile_info: {
                    ...userResult.data.profile_info,
                    updated_at: serverTimestamp(),
                },
            });

            if (!userUpdate.success) {
                throw new AccountSetupError(userUpdate.error.message || 'Failed to update user memberships', userUpdate.error.code);
            }

            console.log('Individual account created successfully:', individualResult);
        } else if (accountType === 'organization' && setupData.organizationName) {
            console.log('Starting organization setup transaction...');
            const transactionResult = await firestoreService.executeTransaction(async () => {
                const orgId = `org_${userId}`;
                const now = serverTimestamp();

                const orgData = {
                    id: orgId,
                    name: setupData.organizationName,
                    ownerId: userId, // Changed from owner_id to match security rules
                    created_by: userId, // Add this field for security rules
                    domain: email.split('@')[1],
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                };

                const membershipData = {
                    user_id: userId,
                    email: email.toLowerCase().trim(),
                    role: 'Admin',
                    status: 'active',
                    joined_at: now,
                    created_at: now,
                    updated_at: now,
                };

                const userUpdates = {
                    account_memberships: [{
                        account_id: orgId,
                        account_type: 'organization',
                        role: 'Admin',
                        status: 'active',
                    }],
                    profile_info: {
                        ...userResult.data.profile_info,
                        updated_at: now,
                    },
                    organization_id: orgId,
                };

                await firestoreService.createDocument('organizations', orgData, orgId);
                await firestoreService.createDocument(`organizations/${orgId}/members`, membershipData, userId);
                await firestoreService.updateDocument('users', userId, userUpdates);

                return { orgId, orgData, membershipData, userUpdates };
            });

            if (!transactionResult.success) {
                throw new AccountSetupError(transactionResult.error.message || 'Transaction failed', transactionResult.error.code);
            }

            console.log('Organization setup completed successfully:', transactionResult.data);
            organizationData = transactionResult.data;
        }

        return {
            success: true,
            userId,
            accountType,
            userProfile: userResult.data,
            organizationData,
        };
    } catch (error) {
        console.error('Error setting up account:', error);
        return {
            success: false,
            error: { message: error.message || 'Account setup failed', code: error.code || 'SETUP_ERROR' },
        };
    } finally {
        isSetupInProgress = false;
    }
};

const determineAccountType = (email) => {
    if (!email) return 'individual';
    const domain = email.split('@')[1];
    const commonPersonalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com',
    ];
    return commonPersonalDomains.includes(domain.toLowerCase()) ? 'individual' : 'organization';
};

export const cleanup = () => {
    firestoreService.cleanup();
};

export {
    setupAccount,
    getAccountSetupStatus,
    shouldRunAccountSetup,
    clearRegistrationState,
    handlePostVerification,
    cleanup,
};