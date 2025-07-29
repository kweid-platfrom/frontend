// hooks/useTestCases.js  
'use client';

import { useApp } from '../context/AppProvider';

export const useTestCases = () => {
    const { state, actions } = useApp();

    return {
        // Test case data
        testCases: state.testCases.testCases || [],
        bugs: state.bugs.bugs || [],
        relationships: state.testCases.relationships || { testCaseToBugs: {} },
        loading: state.testCases.loading,
        
        // User and suite context
        currentUser: state.auth.currentUser,
        activeSuite: state.suites.activeSuite,
        
        // Permissions and restrictions
        selectedTestCases: state.ui.selectedItems.testCases || [],
        canCreateTestCases: state.subscription.planLimits?.canCreateTestCases !== false,
        testCasesLocked: state.ui.featureLocks?.testCasesLocked || false,
        
        // CRUD methods - these are what the component is trying to call
        createTestCase: actions.testCases.createTestCase,
        updateTestCase: actions.testCases.updateTestCase,
        deleteTestCase: actions.testCases.deleteTestCase,
        
        // Linking methods
        linkBugToTestCase: actions.linkBugsToTestCase,
        unlinkBugFromTestCase: actions.unlinkBugFromTestCase,
        
        // Selection methods
        selectTestCases: (testCases) => actions.ui.updateSelection('testCases', testCases),
        clearTestCaseSelection: () => actions.ui.updateSelection('testCases', []),
    };
};