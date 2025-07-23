// hooks/useTestCases.js
'use client';

import { useApp } from '../context/AppProvider';

export const useTestCases = () => {
    const { state, actions } = useApp();

    return {
        // State
        testCases: state.testCases.testCases,
        selectedTestCases: state.ui.selectedItems.testCases,
        loading: state.testCases.loading,
        error: state.testCases.error,

        // Actions
        loadTestCases: actions.loadTestCases,
        createTestCase: actions.createTestCase,
        updateTestCase: actions.updateTestCase,
        deleteTestCase: actions.deleteTestCase,
        selectTestCases: (testCases) => actions.updateSelection('testCases', testCases),
        clearTestCaseSelection: () => actions.updateSelection('testCases', []),
        linkBugsToTestCase: actions.linkBugsToTestCase,
        unlinkBugFromTestCase: actions.unlinkBugFromTestCase,

        // Computed
        canCreateTestCases: state.subscription.planLimits.canCreateTestCases,
        testCasesLocked: state.ui.featureLocks.testCasesLocked,
    };
};