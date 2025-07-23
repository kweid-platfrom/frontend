// hooks/useSubscription.js
import { useApp } from '../context/AppProvider';

const useSubscription = () => {
    const { state, actions } = useApp();

    return {
        // State
        currentPlan: state.subscription.currentPlan,
        trialEndsAt: state.subscription.trialEndsAt,
        isTrialActive: state.subscription.isTrialActive,
        isSubscriptionActive: state.subscription.isSubscriptionActive,
        planLimits: state.subscription.planLimits,
        loading: state.subscription.loading,
        error: state.subscription.error,

        // Actions
        loadSubscriptionInfo: actions.loadSubscriptionInfo,
        checkSubscriptionLimits: actions.checkSubscriptionLimits,

        // Computed
        daysRemainingInTrial: state.subscription.trialEndsAt
            ? Math.ceil((new Date(state.subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
            : 0,
        needsUpgrade: !state.subscription.isTrialActive && !state.subscription.isSubscriptionActive,
        canAccessFeature: (feature) => {
            const featureMap = {
                testCases: state.subscription.planLimits.canCreateTestCases,
                recordings: state.subscription.planLimits.canUseRecordings,
                automation: state.subscription.planLimits.canUseAutomation,
                team: state.subscription.planLimits.canInviteTeam
            };
            return featureMap[feature] || false;
        }
    };
};

export default useSubscription;