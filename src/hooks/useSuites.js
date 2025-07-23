// hooks/useSuites.js
import { useApp } from '../context/AppProvider';

export const useSuites = () => {
    const { state, actions } = useApp();

    return {
        // State
        suites: state.suites.suites,
        activeSuite: state.suites.activeSuite,
        hasCreatedSuite: state.suites.hasCreatedSuite,
        suiteCreationBlocked: state.suites.suiteCreationBlocked,
        loading: state.suites.loading,
        error: state.suites.error,

        // Actions
        loadUserSuites: actions.loadUserSuites,
        createSuite: actions.createSuite,
        activateSuite: actions.activateSuite,

        // Computed
        canCreateMoreSuites: state.suites.suites.length < state.subscription.planLimits.maxSuites,
        suitesRemaining: Math.max(0, state.subscription.planLimits.maxSuites - state.suites.suites.length)
    };
};
