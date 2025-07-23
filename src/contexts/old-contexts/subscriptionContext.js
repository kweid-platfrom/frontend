import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import subscriptionService from '../../services/subscriptionService';
import { useAccountCapabilities } from '../../hooks/old-hooks/useAccountCapabilities';
import { getUserUsageStats } from '../../services/accountLimits';

const SubscriptionContext = createContext();

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
    return context;
};

export const SubscriptionProvider = ({ children }) => {
    const { capabilities, loading, error } = useAccountCapabilities();
    const [subscriptionStatus, setSubscriptionStatus] = useState({
        subscriptionPlan: null,
        subscriptionStatus: null,
        isValid: false,
        isTrial: false,
        trialDaysRemaining: 0,
        billingCycle: null,
        nextBillingDate: null,
        willCancelAt: null,
        isExpired: false,
        showTrialBanner: false,
        showUpgradePrompt: false,
    });

    const fetchSubscriptionStatus = useCallback(async (userId) => {
        if (!userId) return;
        const subscriptionResult = await subscriptionService.getSubscription(userId);
        if (subscriptionResult.success) {
            const { data } = subscriptionResult;
            setSubscriptionStatus({
                subscriptionPlan: data.subscriptionPlan,
                subscriptionStatus: data.subscriptionStatus,
                isValid: data.isActive,
                isTrial: data.isTrialActive,
                trialDaysRemaining: data.trialDaysRemaining,
                billingCycle: data.billingCycle,
                nextBillingDate: data.nextBillingDate,
                willCancelAt: data.willCancelAt,
                isExpired: data.subscriptionStatus === subscriptionService.SUBSCRIPTION_STATUS.EXPIRED,
                showTrialBanner: data.isTrialActive && data.trialDaysRemaining <= 7,
                showUpgradePrompt: !data.isPaidPlan && !data.isTrialActive,
            });
        }
    }, []);

    const updateSubscriptionStatus = useCallback(async (userId) => {
        if (!userId) return;
        const result = await subscriptionService.updateTrialStatus(userId);
        if (result.success) {
            setSubscriptionStatus({
                subscriptionPlan: result.data.subscriptionPlan,
                subscriptionStatus: result.data.subscriptionStatus,
                isValid: result.data.isActive,
                isTrial: result.data.isTrialActive,
                trialDaysRemaining: result.data.trialDaysRemaining,
                billingCycle: result.data.billingCycle,
                nextBillingDate: result.data.nextBillingDate,
                willCancelAt: result.data.willCancelAt,
                isExpired: result.data.subscriptionStatus === subscriptionService.SUBSCRIPTION_STATUS.EXPIRED,
                showTrialBanner: result.data.isTrialActive && result.data.trialDaysRemaining <= 7,
                showUpgradePrompt: !result.data.isPaidPlan && !result.data.isTrialActive,
            });
        }
        return result;
    }, []);

    const hasFeatureAccess = useCallback((feature) => {
        if (!capabilities) return false;
        if (subscriptionStatus.isTrial) return true;
        if (subscriptionStatus.isValid && subscriptionService.isPaidPlan(subscriptionStatus.subscriptionPlan)) {
            return true;
        }
        const restrictedFeatures = ['test_cases', 'reports', 'automation', 'team_management', 'api_access', 'beta_features'];
        if (restrictedFeatures.includes(feature)) return false;
        if (feature === 'invite_team_members' && capabilities.accountType === 'organization') return false;
        return true;
    }, [capabilities, subscriptionStatus]);

    const canCreateResource = useCallback(async (resourceType) => {
        if (!capabilities) return false;
        if (resourceType === 'bugs') return true;
        if (['test_cases', 'reports', 'automation'].includes(resourceType)) {
            return hasFeatureAccess(resourceType);
        }
        if (resourceType === 'suites') {
            const result = await getUserUsageStats({
                uid: capabilities.userId,
                subscriptionPlan: subscriptionStatus.subscriptionPlan,
                accountType: capabilities.accountType,
                isTrialActive: subscriptionStatus.isTrial
            });
            return result.success && result.usage.suites.current < result.limits.maxTestSuites;
        }
        if (resourceType === 'team_members' && capabilities.accountType === 'organization') {
            const result = await getUserUsageStats({
                uid: capabilities.userId,
                subscriptionPlan: subscriptionStatus.subscriptionPlan,
                accountType: capabilities.accountType,
                isTrialActive: subscriptionStatus.isTrial
            });
            return result.success && result.usage.teamMembers.current < result.limits.maxTeamMembers;
        }
        return false;
    }, [capabilities, hasFeatureAccess, subscriptionStatus.isTrial, subscriptionStatus.subscriptionPlan]);

    const getResourceLimit = useCallback((resourceType) => {
        if (!capabilities) return 0;
        if (resourceType === 'bugs') return -1;
        const limits = subscriptionService.getPlanLimits(subscriptionStatus.subscriptionPlan, capabilities.accountType);
        switch (resourceType) {
            case 'suites': return limits.maxTestSuites;
            case 'testScripts': return limits.maxTestScripts;
            case 'automatedTests': return limits.maxAutomatedTests;
            case 'recordings': return limits.maxRecordings;
            case 'reportExports': return limits.maxMonthlyExports;
            case 'team_members': return limits.maxTeamMembers;
            default: return 0;
        }
    }, [capabilities, subscriptionStatus]);

    const getFeatureLimits = useCallback(async () => {
        if (!capabilities) return {};
        const result = await getUserUsageStats({
            uid: capabilities.userId,
            subscriptionPlan: subscriptionStatus.subscriptionPlan,
            accountType: capabilities.accountType,
            isTrialActive: subscriptionStatus.isTrial
        });
        return result.success ? result.limits : {};
    }, [capabilities, subscriptionStatus]);

    // Add limits to capabilities
    const enhancedCapabilities = useMemo(() => {
        if (!capabilities) return null;
        const limits = subscriptionService.getPlanLimits(subscriptionStatus.subscriptionPlan, capabilities.accountType);
        console.log('Enhanced Capabilities Debug:', {
            userId: capabilities.userId,
            accountType: capabilities.accountType,
            subscriptionPlan: subscriptionStatus.subscriptionPlan,
            limits
        });
        return {
            ...capabilities,
            limits: {
                suites: limits.maxTestSuites,
                testScripts: limits.maxTestScripts,
                automatedTests: limits.maxAutomatedTests,
                recordings: limits.maxRecordings,
                reportExports: limits.maxMonthlyExports,
                team_members: limits.maxTeamMembers
            }
        };
    }, [capabilities, subscriptionStatus.subscriptionPlan]);

    useEffect(() => {
        if (capabilities?.userId) {
            fetchSubscriptionStatus(capabilities.userId);
        }
    }, [capabilities, fetchSubscriptionStatus]);

    const value = useMemo(() => ({
        subscriptionStatus,
        isLoading: loading,
        error,
        capabilities: enhancedCapabilities,
        hasFeatureAccess,
        canCreateResource,
        getResourceLimit,
        getFeatureLimits,
        createCheckoutSession: subscriptionService.createCheckoutSession,
        cancelSubscription: subscriptionService.cancelSubscription,
        reactivateSubscription: subscriptionService.reactivateSubscription,
        getBillingHistory: subscriptionService.getBillingHistory,
        updatePaymentMethod: subscriptionService.updatePaymentMethod,
        updateSubscriptionStatus,
        billingConfig: {
            plans: subscriptionService.getAvailablePlans(capabilities?.accountType),
            billingCycles: Object.values(subscriptionService.BILLING_CYCLES),
        },
    }), [subscriptionStatus, loading, error, enhancedCapabilities, hasFeatureAccess, canCreateResource, getResourceLimit, getFeatureLimits, updateSubscriptionStatus, capabilities?.accountType]);

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionProvider;