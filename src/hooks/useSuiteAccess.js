import { useApp } from '../context/AppProvider';

export const useSuiteAccess = () => {
    const { state, actions } = useApp();

    // Add comprehensive safety checks for all state properties
    const planLimits = state?.subscription?.planLimits || {
        maxSuites: 999,
        maxTestCasesPerSuite: 999,
        canCreateTestCases: true,
        canUseRecordings: true,
        canUseAutomation: true,
        canInviteTeam: true,
        canExportReports: true,
        canCreateOrganizations: true,
        advancedAnalytics: true,
        prioritySupport: true,
    };

    // Add comprehensive safety checks for suites state
    const testSuites = state?.suites?.testSuites || [];
    const hasCreatedSuite = state?.suites?.hasCreatedSuite || false;
    const activeSuite = state?.suites?.activeSuite || null;
    const isAuthenticated = state?.auth?.isAuthenticated || false;
    
    const suiteCreationBlocked = testSuites.length >= planLimits.maxSuites && isAuthenticated;

    return {
        // State
        hasCreatedSuite,
        suiteCreationBlocked,
        activeSuite,

        // Actions
        createSuite: async (suiteData) => {
            if (suiteCreationBlocked) {
                return { success: false, error: `Cannot create suite: Maximum limit of ${planLimits.maxSuites} suites reached.` };
            }
            
            // Add safety check for actions
            if (!actions?.suites?.createSuite) {
                return { success: false, error: 'Suite creation action not available' };
            }
            
            // Fixed: Use the correct createSuite action from your suite slice
            const result = await actions.suites.createSuite(
                suiteData, 
                state?.auth || {}, 
                state?.subscription || {}, 
                actions?.ui || {}
            );
            
            // Note: The suite slice already handles updating the state in the reducer,
            // so we don't need to manually update it here
            return result;
        },
        openCreateSuiteModal: () => actions?.ui?.openModal?.('createSuite'),

        // Computed
        needsSuiteCreation: !hasCreatedSuite && isAuthenticated,
        canAccessApp: hasCreatedSuite && activeSuite,
        shouldShowSuiteModal: suiteCreationBlocked || (!hasCreatedSuite && isAuthenticated),
    };
};