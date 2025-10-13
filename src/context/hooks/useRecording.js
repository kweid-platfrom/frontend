// context/hooks/useRecording.js
import { useReducer } from 'react';

export const useRecordings = () => {
    const initialState = {
        recordings: [],
        loading: false,
        error: null,
    };

    const recordingsReducer = (state, action) => {
        switch (action.type) {
            case 'LOAD_START':
                return {
                    ...state,
                    loading: true,
                    error: null,
                };
            case 'LOAD_SUCCESS':
                console.log('📦 Recordings slice: LOAD_SUCCESS with', action.payload?.length || 0, 'recordings');
                return {
                    ...state,
                    recordings: action.payload || [],
                    loading: false,
                    error: null,
                };
            case 'LOAD_FAILURE':
                return {
                    ...state,
                    recordings: [],
                    loading: false,
                    error: action.payload,
                };
            case 'ADD_RECORDING':
                return {
                    ...state,
                    recordings: [action.payload, ...state.recordings],
                    loading: false,
                    error: null,
                };
            case 'UPDATE_RECORDING':
                return {
                    ...state,
                    recordings: state.recordings.map(r =>
                        r.id === action.payload.id 
                            ? { ...r, ...action.payload.updates } 
                            : r
                    ),
                };
            case 'DELETE_RECORDING':
                return {
                    ...state,
                    recordings: state.recordings.filter(r => r.id !== action.payload),
                };
            case 'CLEAR_RECORDINGS':
                return initialState;
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(recordingsReducer, initialState);

    const actions = {
        loadRecordingsStart: () => {
            console.log('📦 Recordings slice: loadRecordingsStart');
            dispatch({ type: 'LOAD_START' });
        },
        loadRecordingsSuccess: (recordings) => {
            console.log('📦 Recordings slice: loadRecordingsSuccess with', recordings?.length || 0, 'recordings');
            dispatch({ type: 'LOAD_SUCCESS', payload: recordings });
        },
        loadRecordingsFailure: (error) => {
            console.error('📦 Recordings slice: loadRecordingsFailure', error);
            dispatch({ type: 'LOAD_FAILURE', payload: error });
        },
        addRecording: (recording) => {
            console.log('📦 Recordings slice: addRecording', recording.id);
            dispatch({ type: 'ADD_RECORDING', payload: recording });
        },
        updateRecording: (id, updates) => {
            console.log('📦 Recordings slice: updateRecording', id);
            dispatch({ type: 'UPDATE_RECORDING', payload: { id, updates } });
        },
        deleteRecording: (id) => {
            console.log('📦 Recordings slice: deleteRecording', id);
            dispatch({ type: 'DELETE_RECORDING', payload: id });
        },
        clearRecordings: () => {
            console.log('📦 Recordings slice: clearRecordings');
            dispatch({ type: 'CLEAR_RECORDINGS' });
        },
    };

    console.log('📦 Recordings slice state:', {
        recordingsCount: state.recordings.length,
        loading: state.loading,
        error: state.error
    });

    return {
        state,
        actions,
    };
};