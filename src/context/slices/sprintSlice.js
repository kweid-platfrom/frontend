import { useReducer } from 'react';
import { BaseFirestoreService } from '../../services/firestoreService';
import { toast } from 'sonner';

// Create a service instance
const firestoreService = new BaseFirestoreService();

const initialState = {
    sprints: [],
    activeSprint: null,
    loading: false,
    error: null,
};

const sprintReducer = (state, action) => {
    switch (action.type) {
        case 'SPRINTS_LOADING':
            return { ...state, loading: true, error: null };
        case 'SPRINTS_LOADED':
            return { ...state, sprints: action.payload, loading: false, error: null };
        case 'SPRINT_CREATED':
            return {
                ...state,
                sprints: [action.payload, ...state.sprints],
                activeSprint: action.payload,
                loading: false,
                error: null,
            };
        case 'SPRINT_UPDATED':
            return {
                ...state,
                sprints: state.sprints.map((sprint) =>
                    sprint.id === action.payload.id ? { ...sprint, ...action.payload } : sprint
                ),
                activeSprint:
                    state.activeSprint?.id === action.payload.id
                        ? { ...state.activeSprint, ...action.payload }
                        : state.activeSprint,
                loading: false,
                error: null,
            };
        case 'SPRINT_DELETED':
            return {
                ...state,
                sprints: state.sprints.filter((sprint) => sprint.id !== action.payload),
                activeSprint: state.activeSprint?.id === action.payload ? null : state.activeSprint,
                loading: false,
                error: null,
            };
        case 'SPRINT_ACTIVATED':
            return { ...state, activeSprint: action.payload };
        case 'SPRINTS_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useSprints = () => {
    const [state, dispatch] = useReducer(sprintReducer, initialState);

    // FIXED: Define helper functions that use dispatch directly
    const loadSprintsSuccess = (sprints) => {
        dispatch({ type: 'SPRINTS_LOADED', payload: sprints || [] });
    };

    const loadSprintsError = (error) => {
        dispatch({ type: 'SPRINTS_ERROR', payload: error });
    };

    const actions = {
        // Export the helper functions for AppProvider compatibility
        loadSprintsSuccess,
        loadSprintsError,

        loadSprints: async (suiteId) => {
            // Prevent multiple simultaneous calls
            if (state.loading || !suiteId) return;
            
            dispatch({ type: 'SPRINTS_LOADING' });
            try {
                const result = await firestoreService.getSprints(suiteId);
                if (result.success) {
                    // FIXED: Use the helper function directly
                    loadSprintsSuccess(result.data || []);
                } else {
                    const errorMessage = result.error?.message || 'Failed to load sprints';
                    loadSprintsError(errorMessage);
                    // Show toast only for actual errors, not initialization
                    if (result.error?.message) {
                        toast.error(errorMessage);
                    }
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to load sprints';
                loadSprintsError(errorMessage);
                // Show toast only for actual errors
                if (error.message) {
                    toast.error(errorMessage);
                }
            }
        },

        createSprint: async (sprintData, suitesState) => {
            if (!suitesState?.activeSuite?.id) {
                toast.error('No active suite selected');
                return { success: false, error: { message: 'No active suite selected' } };
            }

            try {
                const result = await firestoreService.createSprint(suitesState.activeSuite.id, {
                    ...sprintData,
                    suiteId: suitesState.activeSuite.id,
                    created_at: new Date().toISOString(),
                    testCaseIds: sprintData.testCaseIds || [],
                    bugIds: sprintData.bugIds || [],
                });

                if (result.success) {
                    dispatch({ type: 'SPRINT_CREATED', payload: result.data });
                    toast.success('Sprint created successfully');
                    return result;
                } else {
                    toast.error(result.error?.message || 'Failed to create sprint');
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to create sprint';
                toast.error(errorMessage);
                return { success: false, error: { message: errorMessage } };
            }
        },

        updateSprint: async (sprintId, updateData, suiteId) => {
            try {
                const result = await firestoreService.updateSprint(sprintId, updateData, suiteId);
                if (result.success) {
                    dispatch({ type: 'SPRINT_UPDATED', payload: result.data });
                    return result;
                } else {
                    toast.error(result.error?.message || 'Failed to update sprint');
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to update sprint';
                toast.error(errorMessage);
                return { success: false, error: { message: errorMessage } };
            }
        },

        deleteSprint: async (sprintId, suiteId) => {
            try {
                const result = await firestoreService.deleteSprint(sprintId, suiteId);
                if (result.success) {
                    dispatch({ type: 'SPRINT_DELETED', payload: sprintId });
                    toast.success('Sprint deleted successfully');
                    return result;
                } else {
                    toast.error(result.error?.message || 'Failed to delete sprint');
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to delete sprint';
                toast.error(errorMessage);
                return { success: false, error: { message: errorMessage } };
            }
        },

        setActiveSprint: (sprint) => {
            dispatch({ type: 'SPRINT_ACTIVATED', payload: sprint });
            if (sprint) {
                toast.success(`Switched to sprint "${sprint.name}"`, { duration: 2000 });
            }
        },

        activateSprint: (sprint) => {
            dispatch({ type: 'SPRINT_ACTIVATED', payload: sprint });
            if (sprint) {
                toast.success(`Switched to sprint "${sprint.name}"`, { duration: 2000 });
            }
        },
    };

    return { state, actions };
};