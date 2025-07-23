// hooks/useRecordings.js
'use client';

import { useApp } from '../context/AppProvider';

export const useRecordings = () => {
    const { state, actions } = useApp();

    return {
        // State
        recordings: state.recordings.recordings,
        loading: state.recordings.loading,
        error: state.recordings.error,

        // Actions
        loadRecordings: actions.loadRecordings,
        createRecording: actions.createRecording,
        updateRecording: actions.updateRecording,
        deleteRecording: actions.deleteRecording,

        // Computed
        canUseRecordings: state.subscription.planLimits.canUseRecordings,
        recordingsLocked: state.ui.featureLocks.recordingsLocked,
        needsUpgradeForRecordings: !state.subscription.planLimits.canUseRecordings,
    };
};