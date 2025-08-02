import { useApp } from '../context/AppProvider';

const useSubscription = () => {
    const { state, actions } = useApp();

    // Fallback subscription state with correct trial/free tier logic
    const subscription = state.subscription || {
        currentPlan: 'trial', // Default to trial for new users
        status: 'trial_active',
        trialEndsAt: null,
        trialStartsAt: null,
        isTrialActive: false,
        isSubscriptionActive: false,
        isTrialExpired: false,
        daysRemainingInTrial: 0,
        daysInTrial: 0,
        planLimits: {
            maxSuites: 999, // Unlimited during trial
            maxTestCasesPerSuite: 999, // Unlimited during trial
            canCreateTestCases: true,
            canUseRecordings: true,
            canUseAutomation: true,
            canInviteTeam: true,
            canExportReports: true,
            canCreateOrganizations: true,
            advancedAnalytics: true,
            prioritySupport: true,
        },
        freeTierLimits: {
            maxSuites: 1,
            maxTestCasesPerSuite: 10,
            canCreateTestCases: true,
            canUseRecordings: false,
            canUseAutomation: false,
            canInviteTeam: false,
            canExportReports: false,
            canCreateOrganizations: false,
            advancedAnalytics: false,
            prioritySupport: false,
        },
        loading: true,
        error: null,
    };

    // Determine current effective limits based on subscription status
    const getEffectiveLimits = () => {
        if (subscription.isTrialActive) {
            return subscription.planLimits; // Full features during trial
        } else if (subscription.status === 'premium' || subscription.status === 'pro') {
            return subscription.planLimits; // Full features for paid plans
        } else {
            return subscription.freeTierLimits; // Limited features for free tier
        }
    };

    const effectiveLimits = getEffectiveLimits();

    // Calculate trial status
    const getTrialStatus = () => {
        if (!subscription.trialEndsAt) return { isActive: false, daysRemaining: 0 };

        const now = new Date();
        const trialEnd = new Date(subscription.trialEndsAt);
        const isActive = now <= trialEnd && subscription.status === 'trial_active';
        const daysRemaining = isActive ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

        return { isActive, daysRemaining };
    };

    const trialStatus = getTrialStatus();

    // Check if user needs to upgrade
    const needsUpgrade = subscription.status === 'free' ||
        (subscription.status === 'trial_active' && trialStatus.daysRemaining <= 3);

    // Feature access checker
    const canAccessFeature = (feature) => {
        const featureMap = {
            testCases: effectiveLimits.canCreateTestCases,
            recordings: effectiveLimits.canUseRecordings,
            automation: effectiveLimits.canUseAutomation,
            team: effectiveLimits.canInviteTeam,
            reports: effectiveLimits.canExportReports,
            organizations: effectiveLimits.canCreateOrganizations,
            analytics: effectiveLimits.advancedAnalytics,
            support: effectiveLimits.prioritySupport,
        };
        return featureMap[feature] || false;
    };

    // Check if user has hit limits
    const checkLimit = (limitType, currentUsage) => {
        const limits = {
            suites: effectiveLimits.maxSuites,
            testCases: effectiveLimits.maxTestCasesPerSuite,
        };

        const limit = limits[limitType];
        if (limit === 999) return { hasHitLimit: false, remaining: 'unlimited' }; // Unlimited

        return {
            hasHitLimit: currentUsage >= limit,
            remaining: Math.max(0, limit - currentUsage),
            limit: limit
        };
    };

    // Get subscription display info
    const getSubscriptionDisplayInfo = () => {
        if (subscription.isTrialActive) {
            return {
                displayName: 'Free Trial',
                description: `${trialStatus.daysRemaining} days remaining in your trial`,
                badgeColor: 'bg-blue-100 text-blue-800',
                showUpgradePrompt: trialStatus.daysRemaining <= 7,
            };
        } else if (subscription.status === 'free') {
            return {
                displayName: 'Free Plan',
                description: 'Limited features available',
                badgeColor: 'bg-gray-100 text-gray-800',
                showUpgradePrompt: true,
            };
        } else if (subscription.status === 'premium') {
            return {
                displayName: 'Premium Plan',
                description: 'Full access to all features',
                badgeColor: 'bg-green-100 text-green-800',
                showUpgradePrompt: false,
            };
        } else {
            return {
                displayName: 'Unknown Plan',
                description: 'Please check your subscription status',
                badgeColor: 'bg-yellow-100 text-yellow-800',
                showUpgradePrompt: true,
            };
        }
    };

    return {
        // State
        currentPlan: subscription.currentPlan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        trialStartsAt: subscription.trialStartsAt,
        isTrialActive: trialStatus.isActive,
        isTrialExpired: subscription.isTrialExpired,
        isSubscriptionActive: subscription.isSubscriptionActive,
        planLimits: effectiveLimits,
        freeTierLimits: subscription.freeTierLimits,
        loading: subscription.loading,
        error: subscription.error,

        // Computed values
        daysRemainingInTrial: trialStatus.daysRemaining,
        daysInTrial: subscription.daysInTrial,
        needsUpgrade,
        subscriptionInfo: getSubscriptionDisplayInfo(),

        // Actions

        loadSubscriptionInfo: async (authState, uiActions) => {
            dispatch({ type: 'SUBSCRIPTION_LOADING' });
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 1000;

            const fetchSubscription = async () => {
                try {
                    const userId = authState?.currentUser?.uid;
                    const accountType = authState?.accountType || 'individual';
                    const defaultSubscription = {
                        currentPlan: 'free',
                        status: 'free',
                        trialEndsAt: null,
                        trialStartsAt: null,
                        isTrialActive: false,
                        isTrialExpired: false,
                        isSubscriptionActive: false,
                        daysInTrial: 0,
                        daysRemainingInTrial: 0,
                        planLimits: getPlanLimits(accountType, 'free', false),
                        freeTierLimits: getPlanLimits(accountType, 'free', false),
                    };

                    if (!userId) {
                        dispatch({ type: 'SUBSCRIPTION_LOADED', payload: defaultSubscription });
                        uiActions?.updateFeatureLocks(defaultSubscription.planLimits);
                        return;
                    }

                    const subscriptionResult = await firestoreService.getSubscriptionWithStatus(userId);
                    if (subscriptionResult.success) {
                        const subscriptionData = subscriptionResult.data;
                        const planLimits = getPlanLimits(accountType, subscriptionData.plan, subscriptionData.isTrialActive);
                        dispatch({
                            type: 'SUBSCRIPTION_LOADED',
                            payload: {
                                currentPlan: subscriptionData.plan,
                                status: subscriptionData.status,
                                trialEndsAt: subscriptionData.trial_ends_at,
                                trialStartsAt: subscriptionData.trial_starts_at,
                                isTrialActive: subscriptionData.isTrialActive,
                                isTrialExpired: subscriptionData.isTrialExpired,
                                isSubscriptionActive: subscriptionData.status === 'pro' || subscriptionData.status === 'enterprise',
                                daysInTrial: subscriptionData.daysInTrial,
                                daysRemainingInTrial: subscriptionData.daysRemainingInTrial,
                                planLimits,
                                freeTierLimits: getPlanLimits(accountType, 'free', false),
                            },
                        });
                        uiActions?.updateFeatureLocks(planLimits);
                    } else {
                        throw new Error(subscriptionResult.error.message);
                    }
                } catch (error) {
                    console.error('Failed to load subscription:', error);
                    if (retryCount < maxRetries && error.code !== 'permission-denied') {
                        retryCount++;
                        console.log(`🔄 Retrying subscription load in ${retryDelay}ms (${retryCount}/${maxRetries})...`);
                        setTimeout(fetchSubscription, retryDelay);
                    } else {
                        const defaultSubscription = {
                            currentPlan: 'free',
                            status: 'free',
                            trialEndsAt: null,
                            trialStartsAt: null,
                            isTrialActive: false,
                            isTrialExpired: false,
                            isSubscriptionActive: false,
                            daysInTrial: 0,
                            daysRemainingInTrial: 0,
                            planLimits: getPlanLimits(authState?.accountType || 'individual', 'free', false),
                            freeTierLimits: getPlanLimits(authState?.accountType || 'individual', 'free', false),
                        };
                        dispatch({ type: 'SUBSCRIPTION_LOADED', payload: defaultSubscription });
                        uiActions?.updateFeatureLocks(defaultSubscription.planLimits);
                        toast.error('Failed to load subscription: ' + error.message, { duration: 5000 });
                    }
                }
            };

            fetchSubscription();
        },
        checkSubscriptionLimits: actions.subscription?.checkSubscriptionLimits,

        // Utility functions
        canAccessFeature,
        checkLimit,

        // Quick access to common checks
        canCreateTestSuites: !checkLimit('suites', 0).hasHitLimit, // Pass current usage count
        canUseRecordings: canAccessFeature('recordings'),
        canUseAutomation: canAccessFeature('automation'),
        canInviteTeam: canAccessFeature('team'),
        canExportReports: canAccessFeature('reports'),
        canCreateOrganizations: canAccessFeature('organizations'),
        hasAdvancedAnalytics: canAccessFeature('analytics'),
        hasPrioritySupport: canAccessFeature('support'),

        // Trial specific helpers
        isInTrialPeriod: subscription.status === 'trial_active',
        shouldShowTrialWarning: trialStatus.isActive && trialStatus.daysRemaining <= 7,
        shouldShowUpgradePrompt: needsUpgrade,

        // Plan comparison helper
        getUpgradeMessage: () => {
            if (subscription.isTrialActive && trialStatus.daysRemaining <= 3) {
                return `Your trial expires in ${trialStatus.daysRemaining} days. Upgrade to continue using all features.`;
            } else if (subscription.status === 'free') {
                return 'Upgrade to unlock all features and remove limitations.';
            }
            return null;
        }
    };
};

export default useSubscription;