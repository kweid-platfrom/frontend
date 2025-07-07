// config/subscriptionPlans.js - Subscription plan definitions and utilities

// Subscription plan definitions
export const SUBSCRIPTION_PLANS = {
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
        displayName: 'Trial',
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
        displayName: 'Pro',
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
        displayName: 'Free',
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
        displayName: 'Trial',
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
        displayName: 'Starter',
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
        displayName: 'Professional',
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
        displayName: 'Enterprise',
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
 * Detect account type from email domain
 * @param {string} email - User email
 * @returns {string} 'individual' or 'organization'
 */
export const getAccountType = (email) => {
    if (!email) return 'individual';

    const domain = email.split('@')[1]?.toLowerCase();
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];

    return personalDomains.includes(domain) ? 'individual' : 'organization';
};

/**
 * Determine account type from user profile
 * @param {Object} userProfile 
 * @returns {string} 'individual' or 'organization'
 */
export const determineAccountType = (userProfile) => {
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
export const getDefaultPlan = (accountType) => {
    return accountType === 'organization' ? 'organization_free' : 'individual_free';
};

/**
 * Get subscription plan details
 * @param {string} planId 
 * @returns {Object} Plan details
 */
export const getSubscriptionPlanDetails = (planId) => {
    return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.individual_free;
};

/**
 * Get all available subscription plans
 * @param {string} accountType - 'individual' or 'organization'
 * @returns {Array} Available plans for account type
 */
export const getAvailableSubscriptionPlans = (accountType = 'individual') => {
    return Object.entries(SUBSCRIPTION_PLANS)
        .filter(([ plan]) => plan.type === accountType)
        .map(([planId, plan]) => ({
            id: planId,
            ...plan
        }));
};

/**
 * Calculate trial status with better logic
 * @param {Object} userProfile 
 * @returns {Object} Trial status information
 */
export const calculateTrialStatus = (userProfile) => {
    const now = new Date();

    // Check for explicit trial plan first
    const hasTrialPlan = userProfile.subscriptionPlan?.includes('trial');
    const hasTrialStatus = userProfile.subscriptionStatus === 'trial';

    // Better trial date calculation
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
        showBanner: isActive && daysRemaining <= 7,
        isNewUser,
        accountAgeInDays: Math.floor(accountAgeInDays),
        hasTrialPlan,
        hasTrialStatus,
        hasPaidSubscription,
        isWithinTrialPeriod
    };
    return trialInfo;
};

/**
 * Get user capabilities based on their profile and subscription
 * @param {Object} userProfile - The user profile object
 * @returns {Object} User capabilities and limits
 */
export const getUserCapabilities = (userProfile) => {
    if (!userProfile) {
        return getDefaultCapabilities();
    }

    // Determine account type
    const accountType = determineAccountType(userProfile);

    // Calculate trial status FIRST
    const trialStatus = calculateTrialStatus(userProfile);

    // Determine effective subscription plan
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

    // Build capabilities object
    const capabilities = {
        // Account information
        accountType,
        userId: userProfile.uid || userProfile.user_id,
        organizationId: userProfile.organizationId || null,

        // Subscription information with proper display names
        subscriptionType: effectiveSubscriptionPlan,
        subscriptionStatus: trialStatus.isActive ? 'trial' : (userProfile.subscriptionStatus || 'inactive'),
        subscriptionPlan: actualSubscriptionPlan, // Keep original plan
        effectiveSubscriptionPlan, // Add effective plan for reference

        // Add display name for UI
        subscriptionDisplayName: planInfo.name, // This will show "Trial", "Free", "Pro", etc.
        subscriptionFullName: planInfo.displayName, // This will show full name if needed

        // Trial information
        isTrialActive: trialStatus.isActive,
        trialDaysRemaining: trialStatus.daysRemaining,
        trialStartDate: trialStatus.startDate,
        trialEndDate: trialStatus.endDate,
        showTrialBanner: trialStatus.showBanner,

        // Feature capabilities - use effective plan features
        canAccessAdvancedReports: planFeatures.advanced_reports,
        canUseAPI: planFeatures.api_access,
        canUseAutomation: planFeatures.automation,
        canUseCustomIntegrations: planFeatures.custom_integrations,
        canInviteTeamMembers: accountType === 'organization' && (planFeatures.team_members > 1 || planFeatures.team_members === -1),

        // Limits - use effective plan limits and rename for consistency
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

    return capabilities;
};

/**
 * Get default capabilities for null/undefined profiles
 * @returns {Object}
 */
export const getDefaultCapabilities = () => {
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
 * Check if user has access to a specific feature
 * @param {Object} userProfile 
 * @param {string} feature 
 * @returns {boolean}
 */
export const hasFeatureAccess = (userProfile, feature) => {
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