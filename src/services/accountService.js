// services/accountService.js - Fixed User account capabilities and subscription management
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";

// Subscription plan definitions
const SUBSCRIPTION_PLANS = {
    // Individual Plans
    individual_free: {
        type: 'individual',
        name: 'Free',
        displayName: 'Individual Free',
        features: {
            suites: 1,
            test_scripts: 25,
            automated_tests: 10,
            recordings: 5,
            report_exports: 2,
            team_members: 1,
            advanced_reports: false,
            api_access: false,
            automation: false,
            custom_integrations: false
        }
    },
    individual_trial: {
        type: 'individual',
        name: 'Trial',
        displayName: 'Individual Trial',
        features: {
            suites: 5,
            test_scripts: 100,
            automated_tests: 50,
            recordings: 25,
            report_exports: 10,
            team_members: 1,
            advanced_reports: true,
            api_access: true,
            automation: true,
            custom_integrations: true
        }
    },
    individual_pro: {
        type: 'individual',
        name: 'Pro',
        displayName: 'Individual Pro',
        features: {
            suites: 10,
            test_scripts: 500,
            automated_tests: 200,
            recordings: 100,
            report_exports: 50,
            team_members: 1,
            advanced_reports: true,
            api_access: true,
            automation: true,
            custom_integrations: true
        }
    },

    // Organization Plans
    organization_free: {
        type: 'organization',
        name: 'Free',
        displayName: 'Organization Free',
        features: {
            suites: 3,
            test_scripts: 100,
            automated_tests: 25,
            recordings: 15,
            report_exports: 5,
            team_members: 5,
            advanced_reports: false,
            api_access: false,
            automation: false,
            custom_integrations: false
        }
    },
    organization_trial: {
        type: 'organization',
        name: 'Trial',
        displayName: 'Organization Trial',
        features: {
            suites: 25,
            test_scripts: 1000,
            automated_tests: 500,
            recordings: 200,
            report_exports: 100,
            team_members: 25,
            advanced_reports: true,
            api_access: true,
            automation: true,
            custom_integrations: true
        }
    },
    organization_starter: {
        type: 'organization',
        name: 'Starter',
        displayName: 'Organization Starter',
        features: {
            suites: 10,
            test_scripts: 500,
            automated_tests: 100,
            recordings: 50,
            report_exports: 25,
            team_members: 10,
            advanced_reports: true,
            api_access: false,
            automation: false,
            custom_integrations: false
        }
    },
    organization_professional: {
        type: 'organization',
        name: 'Professional',
        displayName: 'Organization Professional',
        features: {
            suites: 50,
            test_scripts: 2500,
            automated_tests: 1000,
            recordings: 500,
            report_exports: 200,
            team_members: 50,
            advanced_reports: true,
            api_access: true,
            automation: true,
            custom_integrations: true
        }
    },
    organization_enterprise: {
        type: 'organization',
        name: 'Enterprise',
        displayName: 'Organization Enterprise',
        features: {
            suites: -1, // Unlimited
            test_scripts: -1, // Unlimited
            automated_tests: -1, // Unlimited
            recordings: -1, // Unlimited
            report_exports: -1, // Unlimited
            team_members: -1, // Unlimited
            advanced_reports: true,
            api_access: true,
            automation: true,
            custom_integrations: true
        }
    }
};

/**
 * NEW: Check if account exists and get setup status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Account setup status
 */
const getAccountSetupStatus = async (userId) => {
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
 * NEW: Detect account type from email domain
 * @param {string} email - User email
 * @returns {string} 'individual' or 'organization'
 */
const getAccountType = (email) => {
    if (!email) return 'individual';

    const domain = email.split('@')[1]?.toLowerCase();
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];

    return personalDomains.includes(domain) ? 'individual' : 'organization';
};

/**
 * NEW: Setup user account with proper trial configuration
 * @param {Object} setupData - Account setup data
 * @returns {Promise<Object>} Setup result
 */
const setupAccount = async (setupData) => {
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

        const userProfileData = {
            uid: userId,
            email: email,
            firstName: setupData.firstName || '',
            lastName: setupData.lastName || '',
            fullName: `${setupData.firstName || ''} ${setupData.lastName || ''}`.trim(),

            // Account type and organization data
            accountType: accountType,
            organizationName: setupData.organizationName || null,
            organizationId: setupData.organizationName ? `org_${userId}` : null,

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

            // Account memberships (for organization users)
            account_memberships: accountType === 'organization' ? [{
                org_id: `org_${userId}`,
                role: 'owner',
                status: 'active',
                joined_at: now
            }] : []
        };

        // Save user profile to Firestore
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, userProfileData, { merge: true });

        // If organization account, create organization document
        if (accountType === 'organization' && setupData.organizationName) {
            const orgData = {
                id: `org_${userId}`,
                name: setupData.organizationName,
                ownerId: userId,
                domain: email.split('@')[1],
                subscriptionPlan: subscriptionPlan,
                subscriptionStatus: 'trial',
                createdAt: now,
                updatedAt: now,
                isActive: true,
                members: [{
                    userId: userId,
                    role: 'owner',
                    status: 'active',
                    joinedAt: now
                }]
            };

            const orgDocRef = doc(db, 'organizations', `org_${userId}`);
            await setDoc(orgDocRef, orgData);
        }

        console.log('Account setup completed successfully:', {
            userId,
            accountType,
            subscriptionPlan,
            organizationName: setupData.organizationName
        });

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
 * FIXED: Get user capabilities based on their profile and subscription
 * @param {Object} userProfile - The user profile object
 * @returns {Object} User capabilities and limits
 */
const getUserCapabilities = (userProfile) => {
    if (!userProfile) {
        return getDefaultCapabilities();
    }

    // Determine account type
    const accountType = determineAccountType(userProfile);

    // Calculate trial status FIRST
    const trialStatus = calculateTrialStatus(userProfile);

    // FIXED: Determine effective subscription plan
    let effectiveSubscriptionPlan;
    let actualSubscriptionPlan = userProfile.subscriptionPlan || getDefaultPlan(accountType);

    // If trial is active, use trial plan regardless of actual subscription
    if (trialStatus.isActive) {
        effectiveSubscriptionPlan = accountType === 'organization' ? 'organization_trial' : 'individual_trial';
    } else {
        effectiveSubscriptionPlan = actualSubscriptionPlan;
    }

    // Get features from effective plan
    const planFeatures = SUBSCRIPTION_PLANS[effectiveSubscriptionPlan]?.features || SUBSCRIPTION_PLANS.individual_free.features;
    const planInfo = SUBSCRIPTION_PLANS[effectiveSubscriptionPlan] || SUBSCRIPTION_PLANS.individual_free;

    console.log('Trial Status:', trialStatus);
    console.log('Effective Plan:', effectiveSubscriptionPlan);
    console.log('Plan Features:', planFeatures);

    // Build capabilities object
    const capabilities = {
        // Account information
        accountType,
        userId: userProfile.uid || userProfile.user_id,
        organizationId: userProfile.organizationId || null,

        // FIXED: Subscription information with proper display names
        subscriptionType: effectiveSubscriptionPlan,
        subscriptionStatus: trialStatus.isActive ? 'trial' : (userProfile.subscriptionStatus || 'inactive'),
        subscriptionPlan: actualSubscriptionPlan, // Keep original plan
        effectiveSubscriptionPlan, // Add effective plan for reference

        // FIXED: Add display name for UI
        subscriptionDisplayName: planInfo.name, // This will show "Trial", "Free", "Pro", etc.
        subscriptionFullName: planInfo.displayName, // This will show full name if needed

        // Trial information
        isTrialActive: trialStatus.isActive,
        trialDaysRemaining: trialStatus.daysRemaining,
        trialStartDate: trialStatus.startDate,
        trialEndDate: trialStatus.endDate,
        showTrialBanner: trialStatus.showBanner,

        // FIXED: Feature capabilities - use effective plan features
        canAccessAdvancedReports: planFeatures.advanced_reports,
        canUseAPI: planFeatures.api_access,
        canUseAutomation: planFeatures.automation,
        canUseCustomIntegrations: planFeatures.custom_integrations,
        canInviteTeamMembers: accountType === 'organization' && (planFeatures.team_members > 1 || planFeatures.team_members === -1),

        // FIXED: Limits - use effective plan limits and rename for consistency
        limits: {
            suites: planFeatures.suites,
            maxSuites: planFeatures.suites, // Add this for backward compatibility
            test_scripts: planFeatures.test_scripts,
            automated_tests: planFeatures.automated_tests,
            recordings: planFeatures.recordings,
            report_exports: planFeatures.report_exports,
            team_members: planFeatures.team_members
        }
    };

    console.log('Final Capabilities:', capabilities);
    return capabilities;
};

/**
 * Determine account type from user profile
 * @param {Object} userProfile 
 * @returns {string} 'individual' or 'organization'
 */
const determineAccountType = (userProfile) => {
    // Check explicit account type
    if (userProfile.accountType) {
        return userProfile.accountType;
    }

    // Check userType (legacy)
    if (userProfile.userType) {
        return userProfile.userType;
    }

    // Check if user has organization ID
    if (userProfile.organizationId) {
        return 'organization';
    }

    // Check account memberships
    if (userProfile.account_memberships && Array.isArray(userProfile.account_memberships)) {
        for (const membership of userProfile.account_memberships) {
            if (membership.org_id) {
                return 'organization';
            }
        }
    }

    // Default to individual
    return 'individual';
};

/**
 * Get default subscription plan for account type
 * @param {string} accountType 
 * @returns {string}
 */
const getDefaultPlan = (accountType) => {
    return accountType === 'organization' ? 'organization_free' : 'individual_free';
};

/**
 * FIXED: Calculate trial status with better logic
 * @param {Object} userProfile 
 * @returns {Object} Trial status information
 */
const calculateTrialStatus = (userProfile) => {
    const now = new Date();

    // Check for explicit trial plan first
    const hasTrialPlan = userProfile.subscriptionPlan?.includes('trial');
    const hasTrialStatus = userProfile.subscriptionStatus === 'trial';

    // FIXED: Better trial date calculation
    let trialStart, trialEnd;

    // Try to get trial dates from subscription data
    if (userProfile.subscriptionStartDate) {
        trialStart = userProfile.subscriptionStartDate?.toDate ?
            userProfile.subscriptionStartDate.toDate() :
            new Date(userProfile.subscriptionStartDate);
    } else if (userProfile.createdAt) {
        // Fallback to account creation date
        trialStart = userProfile.createdAt?.toDate ?
            userProfile.createdAt.toDate() :
            new Date(userProfile.createdAt);
    } else {
        // Last resort - assume trial started now
        trialStart = now;
    }

    if (userProfile.subscriptionEndDate) {
        trialEnd = userProfile.subscriptionEndDate?.toDate ?
            userProfile.subscriptionEndDate.toDate() :
            new Date(userProfile.subscriptionEndDate);
    } else {
        // Default 30-day trial
        trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // FIXED: Trial is active if:
    // 1. User has trial plan OR trial status, AND
    // 2. Current date is within trial period, AND
    // 3. No paid subscription is active
    const hasPaidSubscription = userProfile.subscriptionStatus === 'active' &&
        !userProfile.subscriptionPlan?.includes('free') &&
        !userProfile.subscriptionPlan?.includes('trial');

    const isWithinTrialPeriod = now >= trialStart && now <= trialEnd;
    const shouldHaveTrial = (hasTrialPlan || hasTrialStatus || !hasPaidSubscription) && isWithinTrialPeriod;

    // For new users (created within last 30 days), automatically give trial
    const accountAge = now - trialStart;
    const accountAgeInDays = accountAge / (24 * 60 * 60 * 1000);
    const isNewUser = accountAgeInDays <= 30;

    const isActive = shouldHaveTrial || (isNewUser && !hasPaidSubscription);
    const daysRemaining = isActive ? Math.max(0, Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000))) : 0;

    const trialInfo = {
        isActive,
        daysRemaining,
        startDate: trialStart,
        endDate: trialEnd,
        showBanner: isActive && daysRemaining <= 7, // Show banner in last 7 days
        isNewUser,
        accountAgeInDays: Math.floor(accountAgeInDays),
        hasTrialPlan,
        hasTrialStatus,
        hasPaidSubscription,
        isWithinTrialPeriod
    };

    console.log('Trial calculation details:', trialInfo);
    return trialInfo;
};

/**
 * NEW: Check and update trial status in database
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Updated trial status and user profile
 */
const checkAndUpdateTrialStatus = async (userProfile) => {
    try {
        if (!userProfile || !userProfile.uid) {
            console.warn('No user profile or uid provided for trial status check');
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
            console.log('Updating trial status for user:', userId);

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
        console.error('Error checking and updating trial status:', error);
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
 * Get default capabilities for null/undefined profiles
 * @returns {Object}
 */
const getDefaultCapabilities = () => {
    return {
        accountType: 'individual',
        userId: null,
        organizationId: null,
        subscriptionType: 'individual_free',
        subscriptionStatus: 'inactive',
        subscriptionPlan: 'individual_free',
        effectiveSubscriptionPlan: 'individual_free',
        subscriptionDisplayName: 'Free',
        subscriptionFullName: 'Individual Free',
        isTrialActive: false,
        trialDaysRemaining: 0,
        trialStartDate: null,
        trialEndDate: null,
        showTrialBanner: false,
        canAccessAdvancedReports: false,
        canUseAPI: false,
        canUseAutomation: false,
        canUseCustomIntegrations: false,
        canInviteTeamMembers: false,
        limits: {
            ...SUBSCRIPTION_PLANS.individual_free.features,
            maxSuites: SUBSCRIPTION_PLANS.individual_free.features.suites
        }
    };
};

/**
 * FIXED: Check if user can create a new suite with proper trial support
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
const canCreateNewSuite = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const suiteLimit = capabilities.limits.suites;

        console.log('Suite creation check:', {
            userId: capabilities.userId,
            suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName
        });

        // Unlimited suites
        if (suiteLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current suites
        const currentCount = await getUserSuiteCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
        };
    }
};

/**
 * Get current suite count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
const getUserSuiteCount = async (userId) => {
    try {
        if (!userId) return 0;

        const suitesRef = collection(db, 'suites');
        const q = query(
            suitesRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user suite count:', error);
        return 0;
    }
};

/**
 * FIXED: Check if user can create a new test suite with proper trial support
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
const canCreateNewTestSuite = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const suiteLimit = capabilities.limits.suites;

        // Unlimited test suites
        if (suiteLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count user's current test suites
        const currentCount = await getUserTestSuiteCount(userProfile.uid || userProfile.user_id);

        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: capabilities.isTrialActive,
            effectivePlan: capabilities.effectiveSubscriptionPlan,
            subscriptionDisplayName: capabilities.subscriptionDisplayName,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking test suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
        };
    }
};

/**
 * Get current test suite count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
const getUserTestSuiteCount = async (userId) => {
    try {
        if (!userId) return 0;

        const suitesRef = collection(db, 'test_suites');
        const q = query(
            suitesRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting user test suite count:', error);
        return 0;
    }
};

/**
 * Check if user can invite team members
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can invite status and current count
 */
const canInviteTeamMembers = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);

        // Individual accounts cannot invite team members
        if (capabilities.accountType === 'individual') {
            return {
                canInvite: false,
                reason: 'individual_account',
                currentCount: 1,
                maxAllowed: 1
            };
        }

        const memberLimit = capabilities.limits.team_members;

        // Unlimited team members
        if (memberLimit === -1) {
            return {
                canInvite: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive,
                unlimited: true
            };
        }

        // Count current team members
        const currentCount = await getOrganizationMemberCount(userProfile.organizationId);

        return {
            canInvite: currentCount < memberLimit,
            currentCount,
            maxAllowed: memberLimit,
            isTrialActive: capabilities.isTrialActive,
            unlimited: false
        };

    } catch (error) {
        console.error('Error checking team invitation capability:', error);
        return {
            canInvite: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            unlimited: false,
            error: error.message
        };
    }
};

/**
 * Get current organization member count
 * @param {string} organizationId 
 * @returns {Promise<number>}
 */
const getOrganizationMemberCount = async (organizationId) => {
    try {
        if (!organizationId) return 1;

        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('organizationId', '==', organizationId),
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;

    } catch (error) {
        console.error('Error getting organization member count:', error);
        return 1;
    }
};

/**
 * Get subscription plan details
 * @param {string} planId 
 * @returns {Object} Plan details
 */
const getSubscriptionPlanDetails = (planId) => {
    return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.individual_free;
};

/**
 * Get all available subscription plans
 * @param {string} accountType - 'individual' or 'organization'
 * @returns {Array} Available plans for account type
 */
const getAvailableSubscriptionPlans = (accountType = 'individual') => {
    return Object.entries(SUBSCRIPTION_PLANS)
        .filter(([ plan]) => plan.type === accountType)
        .map(([planId, plan]) => ({
            id: planId,
            ...plan
        }));
};


/**
 * Check if user has access to a specific feature
 * @param {Object} userProfile 
 * @param {string} feature 
 * @returns {boolean}
 */
const hasFeatureAccess = (userProfile, feature) => {
    const capabilities = getUserCapabilities(userProfile);

    switch (feature) {
        case 'advanced_reports':
            return capabilities.canAccessAdvancedReports;
        case 'api_access':
            return capabilities.canUseAPI;
        case 'automation':
            return capabilities.canUseAutomation;
        case 'custom_integrations':
            return capabilities.canUseCustomIntegrations;
        case 'team_collaboration':
            return capabilities.canInviteTeamMembers;
        default:
            return false;
    }
};

// Export the accountService object
export const accountService = {
    // NEW functions
    getAccountSetupStatus,
    getAccountType,
    setupAccount,

    // Existing functions
    getUserCapabilities,
    canCreateNewSuite,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    hasFeatureAccess,
    getUserSuiteCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    determineAccountType,
    calculateTrialStatus,
    checkAndUpdateTrialStatus,
    getDefaultCapabilities
};

// Also export individual functions for backward compatibility
export {
    // NEW functions
    getAccountSetupStatus,
    getAccountType,
    setupAccount,

    // Existing functions
    getUserCapabilities,
    canCreateNewSuite,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    hasFeatureAccess,
    getUserSuiteCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    checkAndUpdateTrialStatus
}
