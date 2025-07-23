// hooks/useBugs.js
'use client';

import { useApp } from '../context/AppProvider';

export const useBugs = () => {
    const { state, actions } = useApp();

    return {
        // State
        bugs: state.bugs.bugs,
        selectedBugs: state.ui.selectedItems.bugs,
        loading: state.bugs.loading,
        error: state.bugs.error,

        // Actions
        loadBugs: actions.loadBugs,
        createBug: actions.createBug,
        updateBug: actions.updateBug,
        deleteBug: actions.deleteBug,
        selectBugs: (bugs) => actions.updateSelection('bugs', bugs),
        clearBugSelection: () => actions.updateSelection('bugs', []),
        linkTestCasesToBug: actions.linkTestCasesToBug,
        unlinkTestCaseFromBug: actions.unlinkTestCaseFromBug,

        // Computed
        canCreateBugs: state.subscription.planLimits.canCreateTestCases, // Bugs tied to test case access
    };
};