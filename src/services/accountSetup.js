// services/accountSetup.js - Account setup and management operations
import {
    doc,
    updateDoc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";
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

        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return { exists: false, needsSetup: true };
        }

        const userData = userDoc.data();

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
 * FIXED: Setup user account with proper structure aligned to security rules
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
export const setupAccount = async (setupData) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const userId = user.uid;
        const email = user.email;

        // Determine account type
        const accountType = getAccountType(email);

        // Create user profile data
        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

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

            // Timestamps
            createdAt: now,
            updatedAt: now,

            // User preferences
            timezone: setupData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Initialize empty account memberships - will be populated after org creation
            account_memberships: []
        };

        // Create user document first
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, userProfileData, { merge: true });

        console.log('User profile created successfully');

        // STEP 2: Handle account type specific setup
        if (accountType === 'individual') {
            // FIXED: Create individual account document (required by security rules)
            const individualAccountData = {
                userId: userId,
                email: email,
                firstName: setupData.firstName || '',
                lastName: setupData.lastName || '',
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'trial',
                subscriptionStartDate: now,
                subscriptionEndDate: trialEndDate,
                createdAt: now,
                updatedAt: now,
                isActive: true
            };

            const individualAccountRef = doc(db, 'individualAccounts', userId);
            await setDoc(individualAccountRef, individualAccountData);

            console.log('Individual account created successfully');

        } else if (accountType === 'organization' && setupData.organizationName) {
            // STEP 2A: Create organization document first
            const orgId = `org_${userId}`;

            const orgData = {
                id: orgId,
                name: setupData.organizationName,
                ownerId: userId,
                domain: email.split('@')[1],
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'trial',
                subscriptionStartDate: now,
                subscriptionEndDate: trialEndDate,
                createdAt: now,
                updatedAt: now,
                isActive: true
            };

            const orgDocRef = doc(db, 'organizations', orgId);
            await setDoc(orgDocRef, orgData);

            console.log('Organization created successfully');

            // STEP 2B: Create organization membership (required by security rules for isOrgAdmin to work)
            const membershipData = {
                userId: userId,
                email: email,
                role: 'Admin', 
                status: 'active',
                joinedAt: now,
                createdAt: now,
                updatedAt: now
            };

            const memberDocRef = doc(db, 'organizations', orgId, 'members', userId);
            await setDoc(memberDocRef, membershipData);

            console.log('Organization membership created successfully');

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
                updatedAt: now
            };

            await updateDoc(userDocRef, userUpdates);

            console.log('User profile updated with organization info');

            // REMOVED: The problematic userMemberships subcollection creation
            // This was causing the "Missing or insufficient permissions" error
            // The account_memberships array in the user document serves the same purpose

            // Update local profile data for return
            Object.assign(userProfileData, userUpdates);
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
 * Check and update trial status in database
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
                const userDocRef = doc(db, 'users', userId);
                await updateDoc(userDocRef, {
                    ...updates,
                    updatedAt: new Date()
                });

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