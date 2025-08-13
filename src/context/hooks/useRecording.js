import FirestoreService from '../../services';

export const useRecording = (slices) => {
    const saveRecording = async (blob, networkErrors) => {
        try {
            const recordingId = `rec_${Date.now()}`;
            const recordingData = {
                id: recordingId,
                url: URL.createObjectURL(blob),
                size: blob.size,
                created_at: new Date().toISOString(),
                networkErrors,
                suiteId: slices.suites.state.activeSuite?.id,
            };

            const result = await slices.recordings.actions.createRecording(slices.suites.state, {
                recordings: slices.recordings.actions,
                ui: slices.ui.actions,
                bugs: slices.bugs.actions,
            })(recordingData);

            if (result.success && networkErrors.length > 0) {
                const bugData = {
                    title: `Network Error: ${networkErrors[0].status || 'Unknown'}`,
                    description: `Auto-detected network error during recording:\n${JSON.stringify(networkErrors, null, 2)}`,
                    status: 'open',
                    severity: 'high',
                    created_at: new Date().toISOString(),
                    recordingIds: [recordingId],
                };
                const bugResult = await slices.bugs.actions.createBug(bugData);
                if (bugResult.success) {
                    await FirestoreService.recordings.linkRecordingToBug(recordingId, bugResult.data.id);
                    slices.recordings.actions.updateRecording(recordingId, { bugId: bugResult.data.id });
                }
                slices.ui.actions.showNotification?.({
                    id: 'bug-created-network-error',
                    type: 'info',
                    message: 'Bug created for network error',
                    duration: 3000,
                });
            }
            return result;
        } catch (error) {
            slices.ui.actions.showNotification?.({
                id: 'save-recording-failed',
                type: 'error',
                message: 'Failed to save recording',
                duration: 5000,
            });
            throw error;
        }
    };

    const linkRecordingToBug = async (recordingId, bugId) => {
        return handleFirebaseOperation(
            () => FirestoreService.recordings.linkRecordingToBug(recordingId, bugId),
            'Recording linked to bug',
            (errorMessage) =>
                slices.ui.actions.showNotification?.({
                    id: `link-recording-bug-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                })
        ).then((result) => {
            if (result.success) {
                slices.recordings.actions.updateRecording(recordingId, { bugId });
            }
            return result;
        });
    };

    return { saveRecording, linkRecordingToBug };
};