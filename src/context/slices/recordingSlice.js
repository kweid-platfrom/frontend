import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    recordings: [],
    loading: false,
    error: null,
    id: 'REC-001',
    suiteId: 'suite-123',
    title: 'Login Flow Recording',
    created_at: '2025-07-23T00:00:00Z',
    url: 'https://example.com/recording',
};

const recordingReducer = (state, action) => {
    switch (action.type) {
        case 'RECORDINGS_LOADING':
            return { ...state, loading: true, error: null };
        case 'RECORDINGS_LOADED':
            return { ...state, recordings: action.payload, loading: false, error: null };
        case 'RECORDING_CREATED':
            return { ...state, recordings: [action.payload, ...state.recordings], loading: false, error: null };
        case 'RECORDING_UPDATED':
            return {
                ...state,
                recordings: state.recordings.map((rec) =>
                    rec.id === action.payload.id ? action.payload : rec
                ),
                loading: false,
                error: null,
            };
        case 'RECORDING_DELETED':
            return {
                ...state,
                recordings: state.recordings.filter((rec) => rec.id !== action.payload),
                loading: false,
                error: null,
            };
        case 'RECORDINGS_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useRecordings = () => {
    const [state, dispatch] = useReducer(recordingReducer, initialState);

    const actions = {
        loadRecordingsSuccess: (recordings) => {
            dispatch({ type: 'RECORDINGS_LOADED', payload: recordings });
        },
        loadRecordingsError: (error) => {
            dispatch({ type: 'RECORDINGS_ERROR', payload: error });
        },
        loadRecordings: async (suiteId) => {
            dispatch({ type: 'RECORDINGS_LOADING' });
            try {
                const result = await firestoreService.getRecordingsBySuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'RECORDINGS_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'RECORDINGS_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'RECORDINGS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        createRecording: async (recordingData, subscriptionState, suitesState, uiActions) => {
            try {
                if (!subscriptionState.planLimits.canUseRecordings) {
                    toast.error('Recording creation is locked. Please upgrade your plan.', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Recording creation restricted' };
                }

                const result = await firestoreService.createRecording({
                    ...recordingData,
                    suiteId: suitesState.activeSuite.id,
                    created_at: new Date().toISOString(),
                });

                if (result.success) {
                    dispatch({ type: 'RECORDING_CREATED', payload: result.data });
                    toast.success('Recording created successfully', { duration: 5000 });
                    return result;
                } else {
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        updateRecording: async (recordingId, updateData) => {
            try {
                const result = await firestoreService.updateRecording(recordingId, updateData);
                if (result.success) {
                    dispatch({ type: 'RECORDING_UPDATED', payload: result.data });
                    return result;
                } else {
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        deleteRecording: async (recordingId) => {
            try {
                const result = await firestoreService.deleteRecording(recordingId);
                if (result.success) {
                    dispatch({ type: 'RECORDING_DELETED', payload: recordingId });
                    toast.success('Recording deleted successfully', { duration: 5000 });
                    return result;
                } else {
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
    };

    return { state, actions };
};