'use client';

import { useApp } from '../context/AppProvider';

export const useBugs = () => {
    const { state, actions } = useApp();

    return {
        selectedBugs: state.ui.selectedItems?.bugs || [],
        canCreateBugs: state.subscription?.planLimits?.canCreateBugs !== false,
        bugs: state.bugs.bugs || [],
        bugsLoading: state.bugs.loading,
        bugsError: state.bugs.error,
        totalBugs: state.bugs.bugs?.length || 0,
        selectBugs: (bugs) => actions.ui.updateSelection('bugs', bugs),
        clearBugSelection: () => actions.ui.updateSelection('bugs', []),
        createBug: async (suiteId, bugData, sprintId = null) => {
            return actions.bugs.createBug(suiteId, bugData, sprintId);
        },
    };
};