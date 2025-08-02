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
    const hasCreatedSuite = state?.suites?.hasCreatedSuite || testSuites.length > 0;
    const activeSuite = state?.suites?.activeSuite || null;
    const isAuthenticated = state?.auth?.isAuthenticated || false;
    
    const suiteCreationBlocked = testSuites.length >= planLimits.maxSuites && isAuthenticated;

    // Enhanced createSuite function with better error handling and state management
    const createSuite = async (suiteData) => {
        try {
            console.log('useSuiteAccess: Creating suite with data:', suiteData);
            
            if (suiteCreationBlocked) {
                const error = `Cannot create suite: Maximum limit of ${planLimits.maxSuites} suites reached.`;
                console.error('useSuiteAccess:', error);
                return { success: false, error: { message: error } };
            }
            
            // Enhanced safety check for actions
            if (!actions?.suites?.createSuite) {
                const error = 'Suite creation action not available. Please refresh the page and try again.';
                console.error('useSuiteAccess:', error);
                console.log('Available suite actions:', Object.keys(actions?.suites || {}));
                return { success: false, error: { message: error } };
            }
            
            // Validate required authentication state
            if (!state?.auth?.currentUser?.uid) {
                const error = 'User authentication required to create a suite';
                console.error('useSuiteAccess:', error);
                return { success: false, error: { message: error } };
            }

            // Validate suite data
            if (!suiteData?.name?.trim()) {
                const error = 'Suite name is required';
                console.error('useSuiteAccess:', error);
                return { success: false, error: { message: error } };
            }
            
            // Use the createSuite action from your suite slice
            const result = await actions.suites.createSuite(
                suiteData, 
                state?.auth || {}, 
                state?.subscription || {}, 
                actions?.ui || {}
            );
            
            console.log('useSuiteAccess: Suite creation result:', result);
            
            if (result.success) {
                const createdSuite = result.data;
                
                // The suite should already be added to state via the createSuite action
                // But let's ensure it's activated if no other suite is active
                if (!activeSuite || testSuites.length === 0) {
                    console.log('useSuiteAccess: Activating newly created suite');
                    if (actions.suites.activateSuite) {
                        actions.suites.activateSuite(createdSuite);
                    }
                }
                
                // Mark that user has created a suite (if action exists)
                if (actions.suites.markSuiteCreated) {
                    actions.suites.markSuiteCreated();
                }
                
                return result;
            }
            
            return result;
        } catch (error) {
            console.error('useSuiteAccess: Error creating suite:', error);
            return { 
                success: false, 
                error: { 
                    message: error.message || 'An unexpected error occurred while creating the suite' 
                } 
            };
        }
    };

    return {
        // State
        hasCreatedSuite,
        suiteCreationBlocked,
        activeSuite,
        testSuites,

        // Actions
        createSuite,
        openCreateSuiteModal: () => actions?.ui?.openModal?.('createSuite'),

        // Computed
        needsSuiteCreation: testSuites.length === 0 && isAuthenticated,
        canAccessApp: testSuites.length > 0 && activeSuite,
        shouldShowSuiteModal: !suiteCreationBlocked && testSuites.length === 0 && isAuthenticated,
    };
};