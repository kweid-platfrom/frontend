// services/accountSetup.js - Optimized Account setup for registration
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
            hasAccountStructure
        };
    } catch (error) {
        console.error('Error checking account setup status:', error);
        return { exists: false, needsSetup: true, error: error.message };
    }
};

/**
 * Check if user needs account setup - prevents running for existing users
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

        // Don't run setup if not in registration mode
        if (!window.isRegistering) {
            console.log('Not in registration mode, skipping account setup...');
            return false;
        }

        const status = await getAccountSetupStatus(userId);
        
        // Only run setup if user doesn't exist or needs setup
        const shouldRun = !status.exists || status.needsSetup;
        
        console.log('Account setup check:', {
            userId,
            exists: status.exists,
            needsSetup: status.needsSetup,
            shouldRun,
            isRegistering: window.isRegistering
        });

        return shouldRun;
    } catch (error) {
        console.error('Error checking if account setup should run:', error);
        return false;
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

/**
 * Setup user account with proper structure - optimized for registration
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
export const setupAccount = async (setupData) => {
    try {
        // Check if setup should run
        const userId = setupData.userId || (setupData.user && setupData.user.uid);
        if (!userId) {
            throw new Error('User ID is required for account setup');
        }

        // Prevent concurrent setup
        if (isSetupInProgress) {
            console.log('Account setup already in progress, returning...');
            return { success: false, error: { message: 'Setup already in progress' } };
        }

        // Check if setup is needed
        const shouldRun = await shouldRunAccountSetup(userId);
        if (!shouldRun) {
            console.log('Account setup not needed, skipping...');
            return { 
                success: true, 
                skipped: true, 
                message: 'Account setup not needed' 
            };
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

        // Check if user already exists with complete data
        const existingStatus = await getAccountSetupStatus(userId);
        if (existingStatus.exists && !existingStatus.needsSetup) {
            console.log('User already has complete account setup, returning existing data');
            return {
                success: true,
                userId: userId,
                accountType: existingStatus.userData.accountType,
                userProfile: existingStatus.userData,
                organizationData: existingStatus.userData.organizationId ? {
                    orgId: existingStatus.userData.organizationId,
                    orgData: { name: existingStatus.userData.organizationName }
                } : null
            };
        }

        // Create or update user profile
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
            account_memberships: [],
            
            // Add default subscription fields
            subscriptionPlan: accountType === 'organization' ? 'organization_free' : 'individual_free',
            subscriptionStatus: 'active',
            isTrialActive: false,
            trialDaysRemaining: 0
        };

        console.log('Creating user profile:', userProfileData);
        const userResult = await firestoreService.createDocument('users', userProfileData, userId);
        if (!userResult.success) {
            console.error('Failed to create user profile:', userResult.error);
            throw new Error(userResult.error.message || 'Failed to create user profile');
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
                throw new Error(individualResult.error.message || 'Failed to create individual account');
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
                    subscriptionPlan: 'organization_free',
                    subscriptionStatus: 'active'
                };

                const orgRef = firestoreService.createDocRef('organizations', orgId);
                const orgDataWithTimestamps = firestoreService.addCommonFields(orgData);
                transaction.set(orgRef, orgDataWithTimestamps);

                const membershipData = {
                    userId: userId,
                    email: email,
                    role: 'Admin',
                    status: 'active',
                    joinedAt: now
                };

                const memberRef = firestoreService.createDocRef('organizations', orgId, 'members', userId);
                const memberDataWithTimestamps = firestoreService.addCommonFields(membershipData);
                transaction.set(memberRef, memberDataWithTimestamps);

                const userUpdates = {
                    organizationId: orgId,
                    organizationName: setupData.organizationName,
                    account_memberships: [{
                        org_id: orgId,
                        role: 'Admin',
                        status: 'active',
                        joined_at: now
                    }],
                    updated_at: now
                };

                const userRef = firestoreService.createDocRef('users', userId);
                transaction.update(userRef, userUpdates);

                console.log('Transaction prepared:', { orgData, membershipData, userUpdates });
                return {
                    orgId,
                    orgData: orgDataWithTimestamps,
                    membershipData: memberDataWithTimestamps,
                    userUpdates
                };
            });

            if (!transactionResult.success) {
                console.error('Transaction failed:', transactionResult.error);
                throw new Error(transactionResult.error.message || 'Failed to create organization');
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
        // Keep registration flag until explicitly cleared by registration component
        // window.isRegistering will be cleared after email verification step
    }
};

/**
 * Get user's complete account information including organization details
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<Object>} Complete account information
 */
export const getCompleteAccountInfo = async (userId = null) => {
    try {
        const targetUserId = userId || firestoreService.getCurrentUserId();
        if (!targetUserId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Get user profile with retry logic for registration scenarios
        let userResult;
        let retryCount = 0;
        const maxRetries = 3;

        do {
            userResult = await firestoreService.getUserProfile(targetUserId);
            if (userResult.success) break;
            
            if (retryCount < maxRetries) {
                console.log(`Retrying user profile fetch (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            retryCount++;
        } while (retryCount < maxRetries);

        if (!userResult.success) {
            return userResult;
        }

        const userProfile = userResult.data;

        // Get organizations if user is part of any
        const orgsResult = await firestoreService.getUserOrganizations();
        const organizations = orgsResult.success ? orgsResult.data : [];

        return {
            success: true,
            data: {
                userProfile,
                organizations,
                accountType: userProfile.accountType
            }
        };

    } catch (error) {
        console.error('Error getting complete account info:', error);
        return {
            success: false,
            error: { message: error.message || 'Failed to get account information' }
        };
    }
};

/**
 * Update user profile using centralized service
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Update result
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const result = await firestoreService.updateDocument('users', userId, updates);
        return result;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return {
            success: false,
            error: { message: error.message || 'Failed to update profile' }
        };
    }
};

/**
 * Delete user account and all associated data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteUserAccount = async (userId) => {
    try {
        const transactionResult = await firestoreService.executeTransaction(async (transaction) => {
            // Get user profile first
            const userRef = firestoreService.createDocRef('users', userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error('User profile not found');
            }

            const userData = userDoc.data();

            // Delete user profile
            transaction.delete(userRef);

            // Delete individual account if exists
            if (userData.accountType === 'individual') {
                const individualRef = firestoreService.createDocRef('individualAccounts', userId);
                transaction.delete(individualRef);
            }

            // Handle organization cleanup if user is organization owner
            if (userData.accountType === 'organization' && userData.organizationId) {
                const orgRef = firestoreService.createDocRef('organizations', userData.organizationId);
                transaction.delete(orgRef);
            }

            return { userId, accountType: userData.accountType };
        });

        if (!transactionResult.success) {
            throw new Error(transactionResult.error.message || 'Failed to delete account');
        }

        return {
            success: true,
            message: 'Account deleted successfully'
        };

    } catch (error) {
        console.error('Error deleting user account:', error);
        return {
            success: false,
            error: { message: error.message || 'Failed to delete account' }
        };
    }
};

/**
 * Clear registration state - called after successful registration
 */
export const clearRegistrationState = () => {
    if (typeof window !== 'undefined') {
        window.isRegistering = false;
        isSetupInProgress = false;
        console.log('Registration state cleared');
    }
};

/**
 * Initialize user with default subscription plan if missing
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Initialization result
 */
export const initializeUserSubscription = async (userId) => {
    try {
        const userDocRef = firestoreService.createDocRef('users', userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists()) {
            return { success: false, error: { message: 'User not found' } };
        }

        const userData = userDoc.data();
        
        // Check if user already has subscription data
        if (userData.subscriptionPlan) {
            return { success: true, message: 'User already has subscription data' };
        }

        // Add default subscription fields
        const subscriptionDefaults = {
            subscriptionPlan: userData.accountType === 'organization' ? 'organization_free' : 'individual_free',
            subscriptionStatus: 'active',
            isTrialActive: false,
            trialDaysRemaining: 0,
            updatedAt: new Date()
        };

        await firestoreService.updateDocument('users', userId, subscriptionDefaults);

        return {
            success: true,
            message: 'User subscription initialized',
            subscriptionPlan: subscriptionDefaults.subscriptionPlan
        };

    } catch (error) {
        console.error('Error initializing user subscription:', error);
        return {
            success: false,
            error: { message: error.message || 'Failed to initialize subscription' }
        };
    }
};