// services/accountSetup.js - Simplified Account setup using centralized Firestore service
import { serverTimestamp } from "firebase/firestore";
import firestoreService from "./firestoreService";

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
 * Setup user account with proper structure using centralized Firestore service
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
export const setupAccount = async (setupData) => {
    try {
        let user = setupData.user;
        if (!user) {
            user = firestoreService.getCurrentUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }
        }

        const userId = setupData.userId || user.uid;
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
            account_memberships: []
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
                user_id: userId, // Fixed: Changed from userId to user_id
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
                    isActive: true
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
            error: { message: error.message }
        };
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