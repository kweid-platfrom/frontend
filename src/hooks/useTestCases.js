// hooks/useTestCases.js  
'use client';

import { useApp } from '../context/AppProvider';

export const useTestCases = () => {
    const { state, actions } = useApp();

    return {
        // Only computed/convenience values
        selectedTestCases: state.ui.selectedItems.testCases,
        canCreateTestCases: state.subscription.planLimits.canCreateTestCases,
        testCasesLocked: state.ui.featureLocks.testCasesLocked,
        
        // Convenience methods
        selectTestCases: (testCases) => actions.ui.updateSelection('testCases', testCases),
        clearTestCaseSelection: () => actions.ui.updateSelection('testCases', []),
    };
};