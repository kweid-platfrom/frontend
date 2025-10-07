import { useReducer } from 'react';
import FirestoreService from '../../services';
import { toast } from 'sonner';

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

    // Helper functions that use dispatch directly
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
            // FIXED: Don't prevent loading, just skip if no suiteId
            if (!suiteId) {
                console.warn('No suiteId provided to loadSprints');
                return { success: false, error: { message: 'No suite ID provided' } };
            }
            
            // FIXED: Only skip if already loading AND we have sprints
            // This prevents unnecessary reloads but doesn't block initial load
            if (state.loading && state.sprints.length > 0) {
                console.log('Sprints already loading and data exists, skipping');
                return { success: true, data: state.sprints };
            }
            
            dispatch({ type: 'SPRINTS_LOADING' });
            
            try {
                const result = await FirestoreService.getSprints(suiteId);
                if (result.success) {
                    loadSprintsSuccess(result.data || []);
                    return result;
                } else {
                    const errorMessage = result.error?.message || 'Failed to load sprints';
                    loadSprintsError(errorMessage);
                    // Only show toast for real errors, not "no sprints found"
                    if (result.error?.message && !result.error.message.includes('not found')) {
                        toast.error(errorMessage);
                    }
                    return result;
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to load sprints';
                loadSprintsError(errorMessage);
                toast.error(errorMessage);
                return { success: false, error: { message: errorMessage } };
            }
        },

        createSprint: async (sprintData, suitesState) => {
            if (!suitesState?.activeSuite?.id) {
                toast.error('No active suite selected');
                return { success: false, error: { message: 'No active suite selected' } };
            }

            try {
                const result = await FirestoreService.createSprint(suitesState.activeSuite.id, {
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
                const result = await FirestoreService.updateSprint(sprintId, updateData, suiteId);
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
                const result = await FirestoreService.deleteSprint(sprintId, suiteId);
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