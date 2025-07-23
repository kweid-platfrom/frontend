// hooks/useSprints.js
'use client';

import { useApp } from '../context/AppProvider';

export const useSprints = () => {
    const { state, actions } = useApp();

    return {
        // State
        sprints: state.sprints.sprints,
        activeSprint: state.sprints.activeSprint,
        selectedSprints: state.ui.selectedItems.sprints,
        loading: state.sprints.loading,
        error: state.sprints.error,

        // Actions
        loadSprints: actions.loadSprints,
        createSprint: actions.createSprint,
        updateSprint: actions.updateSprint,
        deleteSprint: actions.deleteSprint,
        activateSprint: actions.activateSprint,
        addTestCasesToSprint: actions.addTestCasesToSprint,
        addBugsToSprint: actions.addBugsToSprint,
        selectSprints: (sprints) => actions.updateSelection('sprints', sprints),
        clearSprintSelection: () => actions.updateSelection('sprints', []),

        // Computed
        canCreateSprints: state.subscription.planLimits.canCreateTestCases,
    };
};