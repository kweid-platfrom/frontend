import FirestoreService from '../../services';

export const useRecordings = () => {
    const initialState = {
        recordings: [],
        loading: false,
        error: null,
    };

    const loadRecordingsStart = () => ({
        recordings: [],
        loading: true,
        error: null,
    });

    const loadRecordingsSuccess = (recordings) => ({
        recordings,
        loading: false,
        error: null,
    });

    const loadRecordingsFailure = (error) => ({
        recordings: [],
        loading: false,
        error,
    });

    const addRecording = (recording) => (state) => ({
        recordings: [recording, ...state.recordings],
        loading: false,
        error: null,
    });

    const loadRecordings = (appState, appActions) => async () => {
        const suiteId = appState.suites.activeSuite?.id;
        if (!suiteId) {
            appActions.ui.showNotification('error', 'No active suite selected', 5000);
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            appActions.recordings.loadRecordingsStart();
            const result = await FirestoreService.recordings.queryRecordings(suiteId);
            if (result.success) {
                appActions.recordings.loadRecordingsSuccess(result.data);
                return result;
            }
            throw new Error(result.error.message);
        } catch (error) {
            appActions.recordings.loadRecordingsFailure(error.message);
            appActions.ui.showNotification('error', 'Failed to load recordings', 5000);
            return { success: false, error };
        }
    };

    const createRecording = (appState, appActions) => async (recordingData) => {
        const suiteId = appState.suites.activeSuite?.id;
        if (!suiteId) {
            appActions.ui.showNotification('error', 'No active suite selected', 5000);
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            const result = await FirestoreService.recordings.createRecording({
                ...recordingData,
                suiteId,
            });
            if (result.success) {
                appActions.recordings.addRecording(result.data);
                appActions.ui.showNotification('success', 'Recording saved', 3000);
                return result;
            }
            throw new Error(result.error.message);
        } catch (error) {
            appActions.ui.showNotification('error', 'Failed to save recording', 5000);
            return { success: false, error };
        }
    };

    const updateRecording = (appState, appActions) => async (recordingId, updateData) => {
        const suiteId = appState.suites.activeSuite?.id;
        if (!suiteId) {
            appActions.ui.showNotification('error', 'No active suite selected', 5000);
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            const result = await FirestoreService.recordings.updateRecording(suiteId, recordingId, updateData);
            if (result.success) {
                appActions.recordings.updateRecording(recordingId, updateData);
                appActions.ui.showNotification('success', 'Recording updated', 3000);
                return result;
            }
            throw new Error(result.error.message);
        } catch (error) {
            appActions.ui.showNotification('error', 'Failed to update recording', 5000);
            return { success: false, error };
        }
    };

    const deleteRecording = (appState, appActions) => async (recordingId) => {
        const suiteId = appState.suites.activeSuite?.id;
        if (!suiteId) {
            appActions.ui.showNotification('error', 'No active suite selected', 5000);
            return { success: false, error: { message: 'No active suite' } };
        }

        try {
            const result = await FirestoreService.recordings.deleteRecording(suiteId, recordingId);
            if (result.success) {
                appActions.recordings.deleteRecording(recordingId);
                appActions.ui.showNotification('success', 'Recording deleted', 3000);
                return result;
            }
            throw new Error(result.error.message);
        } catch (error) {
            appActions.ui.showNotification('error', 'Failed to delete recording', 5000);
            return { success: false, error };
        }
    };

    return {
        state: initialState,
        actions: {
            loadRecordingsStart,
            loadRecordingsSuccess,
            loadRecordingsFailure,
            addRecording,
            updateRecording,
            deleteRecording,
            loadRecordings,
            createRecording,
            updateRecording,
            deleteRecording,
        },
    };
};