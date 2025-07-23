// hooks/useSuiteAccess.js - Special hook for access control
import { useApp } from '../context/AppProvider';

export const useSuiteAccess = () => {
    const { state, actions } = useApp();

    return {
        // State
        hasCreatedSuite: state.suites.hasCreatedSuite,
        suiteCreationBlocked: state.suites.suiteCreationBlocked,
        activeSuite: state.suites.activeSuite,

        // Actions
        createSuite: actions.createSuite,
        openCreateSuiteModal: () => actions.openModal('createSuite'),

        // Computed
        needsSuiteCreation: !state.suites.hasCreatedSuite,
        canAccessApp: state.suites.hasCreatedSuite && state.suites.activeSuite,
        shouldShowSuiteModal: state.suites.suiteCreationBlocked || (!state.suites.hasCreatedSuite && state.auth.isAuthenticated)
    };
};
