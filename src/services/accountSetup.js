// services/accountSetup.js - Enhanced with better verification handling
import { serverTimestamp } from "firebase/firestore";
import firestoreService from "./firestoreService";

// Global flag to prevent concurrent setup processes
let isSetupInProgress = false;

/**
 * Check if account exists and get setup status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Account setup status
 */
export const getAccountSetupStatus = async (userId) => {
    try {
        if (!userId) {
            return { exists: false, needsSetup: true };
        }

        const result = await firestoreService.getDocument('users', userId);

        if (!result.success) {
            return { exists: false, needsSetup: true };
        }

        const userData = result.data;

        // Check if user has completed basic setup
        const hasBasicInfo = userData.firstName && userData.email;

        // Check if user has proper account structure
        const hasAccountStructure = userData.accountType &&
            (userData.accountType === 'individual' ||
                (userData.accountType === 'organization' && userData.organizationId));

        const isComplete = hasBasicInfo && hasAccountStructure;

        return {
            exists: true,
            needsSetup: !isComplete,
            userData: userData,
            hasBasicInfo,
            hasAccountStructure,
            emailVerified: userData.emailVerified
        };
    } catch (error) {
        console.error('Error checking account setup status:', error);
        return { exists: false, needsSetup: true, error: error.message };
    }
};

/**
 * Check if user needs account setup - ENHANCED with better verification checks
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether setup is needed
 */
export const shouldRunAccountSetup = async (userId) => {
    try {
        // Don't run setup if already in progress
        if (isSetupInProgress) {
            console.log('Account setup already in progress, skipping...');
            return false;
        }

        // Get current user to check email verification status
        const currentUser = firestoreService.getCurrentUser();

        // CRITICAL: Don't run setup for email-verified users
        if (currentUser && currentUser.emailVerified) {
            console.log('User email is verified, skipping account setup and clearing registration state...');
            clearRegistrationState();
            return false;
        }

        // CRITICAL: Don't run setup if not explicitly in registration mode
        if (!window.isRegistering) {
            console.log('Not in registration mode, skipping account setup...');
            return false;
        }

        // Additional safety check - if user exists and is verified, don't run setup
        const status = await getAccountSetupStatus(userId);
        if (status.exists && status.userData && status.userData.emailVerified) {
            console.log('User exists and email is verified, clearing registration state...');
            clearRegistrationState();
            return false;
        }

        // Only run setup if user doesn't exist or needs setup AND is in registration flow
        const shouldRun = (!status.exists || status.needsSetup) && window.isRegistering;

        console.log('Account setup check:', {
            userId,
            exists: status.exists,
            needsSetup: status.needsSetup,
            emailVerified: status.userData?.emailVerified || false,
            currentUserVerified: currentUser?.emailVerified || false,
            isRegistering: window.isRegistering,
            shouldRun
        });

        return shouldRun;
    } catch (error) {
        console.error('Error checking if account setup should run:', error);
        return false;
    }
};

/**
 * Clear registration state - ENHANCED with better cleanup
 */
export const clearRegistrationState = () => {
    if (typeof window !== 'undefined') {
        window.isRegistering = false;
        isSetupInProgress = false;

        // Clear any registration-related localStorage items
        try {
            localStorage.removeItem('registrationInProgress');
            localStorage.removeItem('pendingEmailVerification');
        } catch (e) {
            console.warn('Could not clear localStorage items:', e);
        }

        console.log('Registration state cleared completely');
    }
};

/**
 * Handle post-verification cleanup - ENHANCED
 * Should be called immediately after email verification is complete
 * @param {string} userId - User ID
 */
export const handlePostVerification = async (userId) => {
    try {
        console.log('Handling post-verification cleanup for user:', userId);

        // CRITICAL: Clear registration state immediately
        clearRegistrationState();

        // Update user's emailVerified status in Firestore if needed
        const userStatus = await getAccountSetupStatus(userId);
        if (userStatus.exists && userStatus.userData && !userStatus.userData.emailVerified) {
            const updateResult = await firestoreService.updateDocument('users', userId, {
                emailVerified: true,
                updated_at: serverTimestamp()
            });

            if (updateResult.success) {
                console.log('Updated user emailVerified status in Firestore');
            } else {
                console.error('Failed to update emailVerified status:', updateResult.error);
            }
        }

        return { success: true, message: 'Post-verification cleanup completed' };
    } catch (error) {
        console.error('Error in post-verification cleanup:', error);
        return { success: false, error: { message: error.message } };
    }
};

/**
 * Setup user account - FIXED to avoid serverTimestamp in arrays
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
export const setupAccount = async (setupData) => {
    try {
        const userId = setupData.userId || (setupData.user && setupData.user.uid);
        if (!userId) {
            throw new Error('User ID is required for account setup');
        }

        // CRITICAL: Check if setup should run before proceeding
        const shouldRun = await shouldRunAccountSetup(userId);
        if (!shouldRun) {
            console.log('Account setup not needed or not in registration flow, skipping...');
            return {
                success: true,
                skipped: true,
                message: 'Account setup not needed or not in registration flow'
            };
        }

        // Prevent concurrent setup
        if (isSetupInProgress) {
            console.log('Account setup already in progress, returning...');
            return { success: false, error: { message: 'Setup already in progress' } };
        }

        // Set flags to prevent concurrent execution
        isSetupInProgress = true;
        window.isRegistering = true;

        let user = setupData.user;
        if (!user) {
            user = firestoreService.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
        }

        const email = setupData.email || user.email;
        const accountType = setupData.accountType || determineAccountType(email);

        console.log('Setting up account for user:', { userId, email, accountType });

        const userProfileData = {
            user_id: userId,
            uid: userId,
            email: email,
            firstName: setupData.firstName || '',
            lastName: setupData.lastName || '',
            fullName: `${setupData.firstName || ''} ${setupData.lastName || ''}`.trim(),
            accountType: accountType,
            isActive: true,
            emailVerified: user.emailVerified,
            timezone: setupData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            account_memberships: [] // Initialize empty, will update later if needed
        };

        console.log('Creating user profile:', userProfileData);
        const userResult = await firestoreService.createDocument('users', userProfileData, userId);
        if (!userResult.success) {
            console.error('Failed to create user profile:', userResult.error);
            throw new Error(userResult.error.message);
        }
        console.log('User profile created successfully:', userResult);

        let organizationData = null;

        if (accountType === 'individual') {
            const individualAccountData = {
                user_id: userId,
                email: email,
                firstName: setupData.firstName || '',
                lastName: setupData.lastName || '',
                isActive: true
            };

            console.log('Creating individual account:', individualAccountData);
            const individualResult = await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
            if (!individualResult.success) {
                console.error('Failed to create individual account:', individualResult.error);
                throw new Error(individualResult.error.message);
            }
            console.log('Individual account created successfully:', individualResult);
        } else if (accountType === 'organization' && setupData.organizationName) {
            console.log('Starting organization setup transaction...');
            const transactionResult = await firestoreService.executeTransaction(async (transaction) => {
                const orgId = `org_${userId}`;
                const now = serverTimestamp();

                const orgData = {
                    id: orgId,
                    name: setupData.organizationName,
                    ownerId: userId,
                    domain: email.split('@')[1],
                    isActive: true,
                    created_at: now,
                    updated_at: now
                };

                const orgRef = firestoreService.createDocRef('organizations', orgId);
                transaction.set(orgRef, orgData);

                const membershipData = {
                    userId: userId,
                    email: email,
                    role: 'Admin',
                    status: 'active',
                    joinedAt: now,
                    created_at: now,
                    updated_at: now
                };

                const memberRef = firestoreService.createDocRef('organizations', orgId, 'members', userId);
                transaction.set(memberRef, membershipData);

                const userUpdates = {
                    organizationId: orgId,
                    organizationName: setupData.organizationName,
                    // Store membership reference without serverTimestamp in array
                    account_memberships: [{
                        org_id: orgId,
                        role: 'Admin',
                        status: 'active'
                        // joined_at is moved to the members subcollection
                    }],
                    updated_at: now
                };

                const userRef = firestoreService.createDocRef('users', userId);
                transaction.update(userRef, userUpdates);

                console.log('Transaction prepared:', { orgData, membershipData, userUpdates });
                return {
                    orgId,
                    orgData,
                    membershipData,
                    userUpdates
                };
            });

            if (!transactionResult.success) {
                console.error('Transaction failed:', transactionResult.error);
                throw new Error(transactionResult.error.message);
            }

            console.log('Organization setup completed successfully:', transactionResult.data);
            organizationData = transactionResult.data;
            Object.assign(userProfileData, transactionResult.data.userUpdates);
        }

        return {
            success: true,
            userId: userId,
            accountType: accountType,
            userProfile: userProfileData,
            organizationData: organizationData
        };
    } catch (error) {
        console.error('Error setting up account:', error);
        return {
            success: false,
            error: { message: error.message || 'Account setup failed' }
        };
    } finally {
        // Clear setup flag
        isSetupInProgress = false;
        // Keep registration flag until explicitly cleared by verification
    }
};

/**
 * Determine account type based on email domain
 * @param {string} email - User email
 * @returns {string} Account type ('individual' or 'organization')
 */
const determineAccountType = (email) => {
    if (!email) return 'individual';
    const domain = email.split('@')[1];
    const commonPersonalDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'icloud.com', 'aol.com', 'protonmail.com'
    ];
    return commonPersonalDomains.includes(domain.toLowerCase()) ? 'individual' : 'organization';
};

// Export all functions
export {
    setupAccount,
    getAccountSetupStatus,
    shouldRunAccountSetup,
    clearRegistrationState,
    handlePostVerification
};