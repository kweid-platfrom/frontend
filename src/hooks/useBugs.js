// hooks/useBugs.js
'use client';

import { useApp } from '../context/AppProvider';

export const useBugs = () => {
    const { state, actions } = useApp();

    return {
        // Only computed/convenience values - not direct forwarding
        selectedBugs: state.ui.selectedItems.bugs,
        canCreateBugs: state.subscription.planLimits.canCreateTestCases,
        
        // Convenience methods that add value
        selectBugs: (bugs) => actions.ui.updateSelection('bugs', bugs),
        clearBugSelection: () => actions.ui.updateSelection('bugs', []),
        
        // Components would access state.bugs.bugs and actions.bugs.* directly via useApp()
    };
};