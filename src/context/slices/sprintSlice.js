import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
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

    const actions = {
        loadSprintsSuccess: (sprints) => {
            dispatch({ type: 'SPRINTS_LOADED', payload: sprints });
        },
        loadSprintsError: (error) => {
            dispatch({ type: 'SPRINTS_ERROR', payload: error });
        },
        loadSprints: async (suiteId) => {
            dispatch({ type: 'SPRINTS_LOADING' });
            try {
                const result = await firestoreService.getSprintsBySuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'SPRINTS_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'SPRINTS_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'SPRINTS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        createSprint: async (sprintData, suitesState) => {
            try {
                const result = await firestoreService.createSprint({
                    ...sprintData,
                    suiteId: suitesState.activeSuite.id,
                    created_at: new Date().toISOString(),
                    testCaseIds: sprintData.testCaseIds || [],
                    bugIds: sprintData.bugIds || [],
                });

                if (result.success) {
                    dispatch({ type: 'SPRINT_CREATED', payload: result.data });
                    toast.success('Sprint created successfully', { duration: 5000 });
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
        updateSprint: async (sprintId, updateData) => {
            try {
                const result = await firestoreService.updateSprint(sprintId, updateData);
                if (result.success) {
                    dispatch({ type: 'SPRINT_UPDATED', payload: result.data });
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
        deleteSprint: async (sprintId) => {
            try {
                const result = await firestoreService.deleteSprint(sprintId);
                if (result.success) {
                    dispatch({ type: 'SPRINT_DELETED', payload: sprintId });
                    toast.success('Sprint deleted successfully', { duration: 5000 });
                    return result;
                } else {
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            }
            catch (error) {
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        activateSprint: (sprint) => {
            dispatch({ type: 'SPRINT_ACTIVATED', payload: sprint });
            toast.success(`Switched to sprint ${sprint.title}`, { duration: 5000 });
        },
    };

    return { state, actions };
};