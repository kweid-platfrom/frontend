import { serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase"; // Adjust path as needed
import firestoreService from "./firestoreService";

class AccountSetupError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR') {
        super(message);
        this.name = 'AccountSetupError';
        this.code = code;
    }
}

let isSetupInProgress = false;

// Helper function to wait for auth state to be ready
const waitForAuthState = (user, maxWaitTime = 5000) => {
    return new Promise((resolve) => {
        if (!user) {
            resolve(null);
            return;
        }

        let unsubscribe;
        const timeout = setTimeout(() => {
            if (unsubscribe) unsubscribe();
            resolve(user); // Resolve with current user even if not fully ready
        }, maxWaitTime);

        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.uid === user.uid) {
                clearTimeout(timeout);
                if (unsubscribe) unsubscribe();
                resolve(currentUser);
            }
        });
    });
};

// Helper function to retry operations with exponential backoff
const retryWithBackoff = async (operation, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`Attempt ${attempt + 1} failed:`, error.message);
            
            // Don't retry if it's not a permissions error
            if (!error.message.includes('permissions') && 
                !error.message.includes('Access denied') &&
                !error.code?.includes('permission')) {
                throw error;
            }

            if (attempt === maxRetries - 1) {
                throw error;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

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
        const hasBasicInfo = userData.profile_info?.name?.first && userData.email;
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
            // Wait for auth state and retry with backoff
            const currentUser = auth.currentUser;
            if (currentUser) {
                await waitForAuthState(currentUser);
            }

            const updateResult = await retryWithBackoff(async () => {
                return await firestoreService.updateDocument('users', userId, {
                    'auth_metadata.email_verified': true,
                    'auth_metadata.last_login': serverTimestamp(),
                });
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

        // Wait for auth state to be properly established
        console.log('Waiting for auth state to be ready...');
        await waitForAuthState(user);

        const email = user.email;
        const accountType = setupData.accountType || determineAccountType(email);

        console.log('Setting up account for user:', { userId, email, accountType });

        // Create user profile with retry logic
        const userProfileData = {
            user_id: userId,
            email: email,
            primary_email: email.toLowerCase().trim(),
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

        console.log('Creating user profile with retry logic...');
        const userResult = await retryWithBackoff(async () => {
            return await firestoreService.createOrUpdateUserProfile(userProfileData);
        });

        if (!userResult.success) {
            throw new AccountSetupError(userResult.error.message || 'Failed to create user profile', userResult.error.code);
        }

        let organizationData = null;

        if (accountType === 'individual') {
            // Create individual account data
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

            console.log('Creating individual account with retry logic...');
            const individualResult = await retryWithBackoff(async () => {
                return await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
            });

            if (!individualResult.success) {
                throw new AccountSetupError(individualResult.error.message || 'Failed to create individual account', individualResult.error.code);
            }

            // Update user profile with account memberships
            const membershipUpdate = {
                account_memberships: [{
                    account_id: userId,
                    account_type: 'individual',
                    role: 'Admin',
                    status: 'active',
                }]
            };

            console.log('Updating user with membership (with retry)...');
            const userUpdate = await retryWithBackoff(async () => {
                return await firestoreService.updateDocument('users', userId, membershipUpdate);
            });

            if (!userUpdate.success) {
                throw new AccountSetupError(userUpdate.error.message || 'Failed to update user memberships', userUpdate.error.code);
            }

            console.log('Individual account created successfully:', individualResult);
        } else if (accountType === 'organization' && setupData.organizationName) {
            console.log('Starting organization setup...');
            
            const orgId = `org_${userId}`;
            const orgData = {
                id: orgId,
                name: setupData.organizationName,
                ownerId: userId,
                created_by: userId,
                domain: email.split('@')[1],
                is_active: true,
                description: '',
                settings: {},
            };

            // Create organization with retry logic
            const orgResult = await retryWithBackoff(async () => {
                return await firestoreService.createDocument('organizations', orgData, orgId);
            });

            if (!orgResult.success) {
                throw new AccountSetupError(orgResult.error.message || 'Failed to create organization', orgResult.error.code);
            }

            // Create member record
            const membershipData = {
                user_id: userId,
                email: email.toLowerCase().trim(),
                role: 'Admin',
                status: 'active',
                joined_at: serverTimestamp(),
            };

            const memberResult = await retryWithBackoff(async () => {
                return await firestoreService.createDocument(`organizations/${orgId}/members`, membershipData, userId);
            });

            if (!memberResult.success) {
                throw new AccountSetupError(memberResult.error.message || 'Failed to create organization membership', memberResult.error.code);
            }

            // Update user profile with organization membership
            const orgMembershipUpdate = {
                account_memberships: [{
                    account_id: orgId,
                    account_type: 'organization',
                    role: 'Admin',
                    status: 'active',
                }],
                organization_id: orgId,
            };

            const userOrgUpdate = await retryWithBackoff(async () => {
                return await firestoreService.updateDocument('users', userId, orgMembershipUpdate);
            });

            if (!userOrgUpdate.success) {
                throw new AccountSetupError(userOrgUpdate.error.message || 'Failed to update user with organization membership', userOrgUpdate.error.code);
            }

            console.log('Organization setup completed successfully');
            organizationData = { orgId, orgData, membershipData };
        }

        console.log('Account setup completed successfully');
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