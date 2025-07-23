// hooks/useDashboard.js (placeholder for future expansion)
import { useApp } from '../context/AppProvider';

export const useDashboard = () => {
    const { state } = useApp();

    return {
        // State (will be expanded in future phases)
        activeSuite: state.suites.activeSuite,
        isTrialActive: state.subscription.isTrialActive,
        planLimits: state.subscription.planLimits,

        // Computed
        showTrialBanner: state.subscription.isTrialActive,
        showUpgradeBanner: !state.subscription.isTrialActive && !state.subscription.isSubscriptionActive,
        canAccessDashboard: state.suites.hasCreatedSuite
    };
};
