// services/accountSetup.js - Account setup and management operations using centralized Firestore service
import { serverTimestamp } from "firebase/firestore";
import firestoreService from "./firestoreService";
import {
    getAccountType,
    getDefaultPlan,
    calculateTrialStatus,
    determineAccountType
} from "../config/subscriptionPlans";

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

        // Check if user profile is complete
        const isComplete = userData.firstName && userData.email;

        return {
            exists: true,
            needsSetup: !isComplete,
            userData: userData
        };

    } catch (error) {
        console.error('Error checking account setup status:', error);
        return { exists: false, needsSetup: true, error: error.message };
    }
};

/**
 * Setup user account with proper structure using centralized Firestore service
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
export const setupAccount = async (setupData) => {
    try {
        const user = firestoreService.getCurrentUser();
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const userId = user.uid;
        const email = user.email;

        // Determine account type
        const accountType = getAccountType(email);

        // Create user profile data
        const now = serverTimestamp();
        const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        // Determine subscription plan (always start with trial for new users)
        const subscriptionPlan = accountType === 'organization' ? 'organization_trial' : 'individual_trial';

        // STEP 1: Create base user profile first (required by security rules)
        const userProfileData = {
            user_id: userId, // Required by security rules
            uid: userId,
            email: email,
            firstName: setupData.firstName || '',
            lastName: setupData.lastName || '',
            fullName: `${setupData.firstName || ''} ${setupData.lastName || ''}`.trim(),

            // Account type
            accountType: accountType,

            // Subscription and trial data
            subscriptionPlan: subscriptionPlan,
            subscriptionStatus: 'trial',
            subscriptionStartDate: now,
            subscriptionEndDate: trialEndDate,

            // User status
            isActive: true,
            emailVerified: user.emailVerified,

            // User preferences
            timezone: setupData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Initialize empty account memberships - will be populated after org creation
            account_memberships: []
        };

        // Create user document first using centralized service
        const userResult = await firestoreService.createDocument('users', userProfileData, userId);
        if (!userResult.success) {
            throw new Error(userResult.error.message);
        }

        console.log('User profile created successfully');

        // STEP 2: Handle account type specific setup
        if (accountType === 'individual') {
            // Create individual account document (required by security rules)
            const individualAccountData = {
                userId: userId,
                email: email,
                firstName: setupData.firstName || '',
                lastName: setupData.lastName || '',
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'trial',
                subscriptionStartDate: now,
                subscriptionEndDate: trialEndDate,
                isActive: true
            };

            const individualResult = await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
            if (!individualResult.success) {
                throw new Error(individualResult.error.message);
            }

            console.log('Individual account created successfully');

        } else if (accountType === 'organization' && setupData.organizationName) {
            // Use transaction for organization setup to ensure data consistency
            const transactionResult = await firestoreService.executeTransaction(async (transaction) => {
                const orgId = `org_${userId}`;

                // STEP 2A: Create organization document
                const orgData = {
                    id: orgId,
                    name: setupData.organizationName,
                    ownerId: userId,
                    domain: email.split('@')[1],
                    subscriptionPlan: subscriptionPlan,
                    subscriptionStatus: 'trial',
                    subscriptionStartDate: now,
                    subscriptionEndDate: trialEndDate,
                    isActive: true
                };

                const orgRef = firestoreService.createDocRef('organizations', orgId);
                const orgDataWithTimestamps = firestoreService.addCommonFields(orgData);
                transaction.set(orgRef, orgDataWithTimestamps);

                // STEP 2B: Create organization membership
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

                // STEP 2C: Update user profile with organization information
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

                return {
                    orgId,
                    orgData: orgDataWithTimestamps,
                    membershipData: memberDataWithTimestamps,
                    userUpdates
                };
            });

            if (!transactionResult.success) {
                throw new Error(transactionResult.error.message);
            }

            console.log('Organization setup completed successfully');

            // Update local profile data for return
            Object.assign(userProfileData, transactionResult.data.userUpdates);
        }

        return {
            success: true,
            userId: userId,
            accountType: accountType,
            subscriptionPlan: subscriptionPlan,
            trialEndDate: trialEndDate,
            userProfile: userProfileData
        };

    } catch (error) {
        console.error('Error setting up account:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Check and update trial status in database using centralized service
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Updated trial status and user profile
 */
export const checkAndUpdateTrialStatus = async (userProfile) => {
    try {
        if (!userProfile || !userProfile.uid) {
            return {
                trialStatus: calculateTrialStatus(userProfile),
                userProfile,
                updated: false
            };
        }

        const userId = userProfile.uid || userProfile.user_id;
        const currentTrialStatus = calculateTrialStatus(userProfile);

        // Check if we need to update the user's trial status in the database
        const needsUpdate = await shouldUpdateTrialStatus(userProfile, currentTrialStatus);

        if (needsUpdate) {
            const updates = {};

            // Update subscription plan if trial should be active
            if (currentTrialStatus.isActive && !userProfile.subscriptionPlan?.includes('trial')) {
                const accountType = determineAccountType(userProfile);
                updates.subscriptionPlan = accountType === 'organization' ? 'organization_trial' : 'individual_trial';
                updates.subscriptionStatus = 'trial';
            }

            // Update trial end date if not set
            if (!userProfile.subscriptionEndDate && currentTrialStatus.endDate) {
                updates.subscriptionEndDate = currentTrialStatus.endDate;
            }

            // Update trial start date if not set
            if (!userProfile.subscriptionStartDate && currentTrialStatus.startDate) {
                updates.subscriptionStartDate = currentTrialStatus.startDate;
            }

            // If trial has expired, update to free plan
            if (!currentTrialStatus.isActive && userProfile.subscriptionPlan?.includes('trial')) {
                const accountType = determineAccountType(userProfile);
                updates.subscriptionPlan = getDefaultPlan(accountType);
                updates.subscriptionStatus = 'inactive';
            }

            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
                const updateResult = await firestoreService.updateDocument('users', userId, updates);
                
                if (!updateResult.success) {
                    throw new Error(updateResult.error.message);
                }

                // Return updated profile
                const updatedProfile = { ...userProfile, ...updates };
                return {
                    trialStatus: calculateTrialStatus(updatedProfile),
                    userProfile: updatedProfile,
                    updated: true,
                    updates
                };
            }
        }

        return {
            trialStatus: currentTrialStatus,
            userProfile,
            updated: false
        };

    } catch (error) {
        console.error('Error checking/updating trial status:', error);
        return {
            trialStatus: calculateTrialStatus(userProfile),
            userProfile,
            updated: false,
            error: error.message
        };
    }
};

/**
 * Helper: Check if trial status needs updating in database
 * @param {Object} userProfile 
 * @param {Object} trialStatus 
 * @returns {Promise<boolean>}
 */
const shouldUpdateTrialStatus = async (userProfile, trialStatus) => {
    try {
        // If trial is active but user doesn't have trial plan
        if (trialStatus.isActive && !userProfile.subscriptionPlan?.includes('trial')) {
            return true;
        }

        // If trial is not active but user has trial plan
        if (!trialStatus.isActive && userProfile.subscriptionPlan?.includes('trial')) {
            return true;
        }

        // If trial dates are missing
        if (!userProfile.subscriptionStartDate || !userProfile.subscriptionEndDate) {
            return true;
        }

        return false;

    } catch (error) {
        console.error('Error checking if trial status needs update:', error);
        return false;
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

        // Get user profile
        const userResult = await firestoreService.getUserProfile(targetUserId);
        if (!userResult.success) {
            return userResult;
        }

        const userProfile = userResult.data;

        // Get organizations if user is part of any
        const orgsResult = await firestoreService.getUserOrganizations();
        const organizations = orgsResult.success ? orgsResult.data : [];

        // Get trial status
        const trialStatus = calculateTrialStatus(userProfile);

        return {
            success: true,
            data: {
                userProfile,
                organizations,
                trialStatus,
                accountType: userProfile.accountType,
                subscriptionPlan: userProfile.subscriptionPlan,
                subscriptionStatus: userProfile.subscriptionStatus
            }
        };

    } catch (error) {
        console.error('Error getting complete account info:', error);
        return {
            success: false,
            error: { message: error.message }
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
            error: { message: error.message }
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
        // Use transaction to ensure all data is deleted consistently
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
                
                // Note: Organization members subcollection will be automatically cleaned up
                // by Firestore security rules or cloud functions
            }

            return { userId, accountType: userData.accountType };
        });

        if (!transactionResult.success) {
            throw new Error(transactionResult.error.message);
        }

        return {
            success: true,
            message: 'Account deleted successfully'
        };

    } catch (error) {
        console.error('Error deleting user account:', error);
        return {
            success: false,
            error: { message: error.message }
        };
    }
};