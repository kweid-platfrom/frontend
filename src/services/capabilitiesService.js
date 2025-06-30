// services/capabilitiesService.js
import { SUBSCRIPTION_PLANS } from '../constants/subscriptionPlans';
import { determineAccountType } from './accountTypeService';
import { calculateTrialStatus } from './trialService';

export const getUserCapabilities = (userProfile) => {
    if (!userProfile) {
        return getDefaultCapabilities();
    }

    const accountType = determineAccountType(userProfile);
    const trialStatus = calculateTrialStatus(userProfile);
    
    const effectiveSubscriptionPlan = getEffectiveSubscriptionPlan(userProfile, accountType, trialStatus);
    const planFeatures = SUBSCRIPTION_PLANS[effectiveSubscriptionPlan]?.features || SUBSCRIPTION_PLANS.individual_free.features;
    const planInfo = SUBSCRIPTION_PLANS[effectiveSubscriptionPlan] || SUBSCRIPTION_PLANS.individual_free;

    return {
        accountType,
        userId: userProfile.uid || userProfile.user_id,
        organizationId: userProfile.organizationId || null,
        
        subscriptionType: effectiveSubscriptionPlan,
        subscriptionStatus: trialStatus.isActive ? 'trial' : (userProfile.subscriptionStatus || 'inactive'),
        subscriptionPlan: userProfile.subscriptionPlan || getDefaultPlan(accountType),
        effectiveSubscriptionPlan,
        subscriptionDisplayName: planInfo.name,
        
        isTrialActive: trialStatus.isActive,
        trialDaysRemaining: trialStatus.daysRemaining,
        showTrialBanner: trialStatus.showBanner,
        
        canAccessAdvancedReports: planFeatures.advanced_reports,
        canUseAPI: planFeatures.api_access,
        canUseAutomation: planFeatures.automation,
        canUseCustomIntegrations: planFeatures.custom_integrations,
        canInviteTeamMembers: accountType === 'organization' && (planFeatures.team_members > 1 || planFeatures.team_members === -1),
        
        limits: {
            suites: planFeatures.suites,
            test_scripts: planFeatures.test_scripts,
            automated_tests: planFeatures.automated_tests,
            recordings: planFeatures.recordings,
            report_exports: planFeatures.report_exports,
            team_members: planFeatures.team_members
        }
    };
};

const getEffectiveSubscriptionPlan = (userProfile, accountType, trialStatus) => {
    if (trialStatus.isActive) {
        return accountType === 'organization' ? 'organization_trial' : 'individual_trial';
    }
    return userProfile.subscriptionPlan || getDefaultPlan(accountType);
};

const getDefaultPlan = (accountType) => {
    return accountType === 'organization' ? 'organization_free' : 'individual_free';
};

const getDefaultCapabilities = () => {
    const freePlan = SUBSCRIPTION_PLANS.individual_free;
    return {
        accountType: 'individual',
        userId: null,
        organizationId: null,
        subscriptionType: 'individual_free',
        subscriptionStatus: 'inactive',
        subscriptionPlan: 'individual_free',
        effectiveSubscriptionPlan: 'individual_free',
        subscriptionDisplayName: freePlan.name,
        isTrialActive: false,
        trialDaysRemaining: 0,
        showTrialBanner: false,
        canAccessAdvancedReports: false,
        canUseAPI: false,
        canUseAutomation: false,
        canUseCustomIntegrations: false,
        canInviteTeamMembers: false,
        limits: { ...freePlan.features }
    };
}