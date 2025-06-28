/* eslint-disable @typescript-eslint/no-unused-vars */
// services/accountService.js - User account capabilities and subscription management
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Subscription plan definitions
const SUBSCRIPTION_PLANS = {
    // Individual Plans
    individual_free: {
        type: 'individual',
        name: 'Individual Free',
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
        name: 'Individual Trial',
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
            custom_integrations: false
        }
    },
    individual_pro: {
        type: 'individual',
        name: 'Individual Pro',
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
        name: 'Organization Free',
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
        name: 'Organization Trial',
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
        name: 'Organization Starter',
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
        name: 'Organization Professional',
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
        name: 'Organization Enterprise',
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
 * Get user capabilities based on their profile and subscription
 * @param {Object} userProfile - The user profile object
 * @returns {Object} User capabilities and limits
 */
const getUserCapabilities = (userProfile) => {
    if (!userProfile) {
        return getDefaultCapabilities();
    }

    // Determine account type
    const accountType = determineAccountType(userProfile);
    
    // Get subscription plan
    const subscriptionPlan = userProfile.subscriptionPlan || getDefaultPlan(accountType);
    const planFeatures = SUBSCRIPTION_PLANS[subscriptionPlan]?.features || SUBSCRIPTION_PLANS.individual_free.features;

    // Calculate trial status
    const trialStatus = calculateTrialStatus(userProfile);

    // Build capabilities object
    const capabilities = {
        // Account information
        accountType,
        userId: userProfile.uid || userProfile.user_id,
        organizationId: userProfile.organizationId || null,
        
        // Subscription information
        subscriptionType: subscriptionPlan,
        subscriptionStatus: userProfile.subscriptionStatus || 'inactive',
        subscriptionPlan,
        
        // Trial information
        isTrialActive: trialStatus.isActive,
        trialDaysRemaining: trialStatus.daysRemaining,
        trialStartDate: trialStatus.startDate,
        trialEndDate: trialStatus.endDate,
        showTrialBanner: trialStatus.showBanner,
        
        // Feature capabilities
        canAccessAdvancedReports: planFeatures.advanced_reports || trialStatus.isActive,
        canUseAPI: planFeatures.api_access || trialStatus.isActive,
        canUseAutomation: planFeatures.automation || trialStatus.isActive,
        canUseCustomIntegrations: planFeatures.custom_integrations || trialStatus.isActive,
        canInviteTeamMembers: accountType === 'organization' && (planFeatures.team_members > 1 || planFeatures.team_members === -1),
        
        // Limits
        limits: {
            suites: planFeatures.suites,
            test_scripts: planFeatures.test_scripts,
            automated_tests: planFeatures.automated_tests,
            recordings: planFeatures.recordings,
            report_exports: planFeatures.report_exports,
            team_members: planFeatures.team_members
        }
    };

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
 * Calculate trial status
 * @param {Object} userProfile 
 * @returns {Object} Trial status information
 */
const calculateTrialStatus = (userProfile) => {
    const now = new Date();
    const trialStart = userProfile.subscriptionStartDate?.toDate?.() || userProfile.createdAt?.toDate?.() || now;
    const trialEnd = userProfile.subscriptionEndDate?.toDate?.() || new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const isTrialPlan = userProfile.subscriptionPlan?.includes('trial') || userProfile.subscriptionStatus === 'trial';
    const isActive = isTrialPlan && now <= trialEnd;
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000)));
    
    return {
        isActive,
        daysRemaining,
        startDate: trialStart,
        endDate: trialEnd,
        showBanner: isActive && daysRemaining <= 7 // Show banner in last 7 days
    };
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
        limits: SUBSCRIPTION_PLANS.individual_free.features
    };
};

/**
 * Check if user can create a new project
 * @param {Object} userProfile 
 * @returns {Promise<Object>} Can create status and current count
 */
const canCreateNewProject = async (userProfile) => {
    try {
        const capabilities = getUserCapabilities(userProfile);
        const projectLimit = capabilities.limits.suites;
        
        // Unlimited projects
        if (projectLimit === -1) {
            return {
                canCreate: true,
                currentCount: 0,
                maxAllowed: -1,
                isTrialActive: capabilities.isTrialActive
            };
        }
        
        // Count user's current projects
        const currentCount = await getUserProjectCount(userProfile.uid || userProfile.user_id);
        
        return {
            canCreate: currentCount < projectLimit,
            currentCount,
            maxAllowed: projectLimit,
            isTrialActive: capabilities.isTrialActive
        };
        
    } catch (error) {
        console.error('Error checking project creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
            error: error.message
        };
    }
};

/**
 * Get current project count for user
 * @param {string} userId 
 * @returns {Promise<number>}
 */
const getUserProjectCount = async (userId) => {
    try {
        if (!userId) return 0;
        
        const projectsRef = collection(db, 'projects');
        const q = query(
            projectsRef,
            where('ownerId', '==', userId),
            where('isDeleted', '!=', true)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
        
    } catch (error) {
        console.error('Error getting user project count:', error);
        return 0;
    }
};

/**
 * Check if user can create a new test suite
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
                isTrialActive: capabilities.isTrialActive
            };
        }
        
        // Count user's current test suites
        const currentCount = await getUserTestSuiteCount(userProfile.uid || userProfile.user_id);
        
        return {
            canCreate: currentCount < suiteLimit,
            currentCount,
            maxAllowed: suiteLimit,
            isTrialActive: capabilities.isTrialActive
        };
        
    } catch (error) {
        console.error('Error checking test suite creation capability:', error);
        return {
            canCreate: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
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
                isTrialActive: capabilities.isTrialActive
            };
        }
        
        // Count current team members
        const currentCount = await getOrganizationMemberCount(userProfile.organizationId);
        
        return {
            canInvite: currentCount < memberLimit,
            currentCount,
            maxAllowed: memberLimit,
            isTrialActive: capabilities.isTrialActive
        };
        
    } catch (error) {
        console.error('Error checking team invitation capability:', error);
        return {
            canInvite: false,
            currentCount: 0,
            maxAllowed: 1,
            isTrialActive: false,
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
        .filter(([planId, plan]) => plan.type === accountType)
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
    getUserCapabilities,
    canCreateNewProject,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    hasFeatureAccess,
    getUserProjectCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount,
    determineAccountType,
    calculateTrialStatus,
    getDefaultCapabilities
};

// Also export individual functions for backward compatibility
export {
    getUserCapabilities,
    canCreateNewProject,
    canCreateNewTestSuite,
    canInviteTeamMembers,
    getSubscriptionPlanDetails,
    getAvailableSubscriptionPlans,
    hasFeatureAccess,
    getUserProjectCount,
    getUserTestSuiteCount,
    getOrganizationMemberCount
};