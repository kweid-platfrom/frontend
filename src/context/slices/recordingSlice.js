// In context/hooks/useRecording.js (or wherever your slice is)
import { useReducer } from 'react';

export const useRecordings = () => {
    const initialState = {
        recordings: [],
        loading: false,
        error: null,
    };

    // ADD THIS REDUCER
    const recordingsReducer = (state, action) => {
        switch (action.type) {
            case 'LOAD_START':
                return {
                    ...state,
                    loading: true,
                    error: null,
                };
            case 'LOAD_SUCCESS':
                return {
                    ...state,
                    recordings: action.payload,
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
                        r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
                    ),
                };
            case 'DELETE_RECORDING':
                return {
                    ...state,
                    recordings: state.recordings.filter(r => r.id !== action.payload),
                };
            default:
                return state;
        }
    };

    // USE THE REDUCER
    const [state, dispatch] = useReducer(recordingsReducer, initialState);

    const actions = {
        loadRecordingsStart: () => dispatch({ type: 'LOAD_START' }),
        loadRecordingsSuccess: (recordings) => dispatch({ type: 'LOAD_SUCCESS', payload: recordings }),
        loadRecordingsFailure: (error) => dispatch({ type: 'LOAD_FAILURE', payload: error }),
        addRecording: (recording) => dispatch({ type: 'ADD_RECORDING', payload: recording }),
        updateRecording: (id, updates) => dispatch({ type: 'UPDATE_RECORDING', payload: { id, updates } }),
        deleteRecording: (id) => dispatch({ type: 'DELETE_RECORDING', payload: id }),
        // ... other actions
    };

    return {
        state,
        actions,
    };
};