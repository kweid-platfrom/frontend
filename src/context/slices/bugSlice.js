import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    bugs: [],
    loading: false,
    error: null,
};

const bugReducer = (state, action) => {
    switch (action.type) {
        case 'BUGS_LOADING':
            return { ...state, loading: true, error: null };
        case 'BUGS_LOADED':
            return { ...state, bugs: action.payload, loading: false, error: null };
        case 'BUG_CREATED':
            return { ...state, bugs: [action.payload, ...state.bugs], loading: false, error: null };
        case 'BUG_UPDATED':
            return {
                ...state,
                bugs: state.bugs.map((bug) =>
                    bug.id === action.payload.id ? { ...bug, ...action.payload } : bug
                ),
                loading: false,
                error: null,
            };
        case 'BUG_DELETED':
            return {
                ...state,
                bugs: state.bugs.filter((bug) => bug.id !== action.payload),
                loading: false,
                error: null,
            };
        case 'BUGS_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useBugs = () => {
    const [state, dispatch] = useReducer(bugReducer, initialState);

    const actions = {
        loadBugsSuccess: (bugs) => {
            dispatch({ type: 'BUGS_LOADED', payload: bugs });
        },
        loadBugsError: (error) => {
            dispatch({ type: 'BUGS_ERROR', payload: error });
        },
        loadBugs: async (suiteId) => {
            dispatch({ type: 'BUGS_LOADING' });
            try {
                const result = await firestoreService.getBugsBySuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'BUGS_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'BUGS_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'BUGS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        createBug: async (bugData, subscriptionState, suitesState, uiActions) => {
            try {
                if (!subscriptionState.planLimits.canCreateTestCases) {
                    toast.error('Bug creation is locked. Please upgrade your plan.', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Bug creation restricted' };
                }

                const result = await firestoreService.createBug({
                    ...bugData,
                    suiteId: suitesState.activeSuite.id,
                    created_at: new Date().toISOString(),
                    linkedTestCaseIds: bugData.linkedTestCaseIds || [],
                    recordingId: bugData.recordingId || null,
                });

                if (result.success) {
                    dispatch({ type: 'BUG_CREATED', payload: result.data });
                    toast.success('Bug created successfully', { duration: 5000 });
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
        updateBug: async (bugId, updateData) => {
            try {
                const result = await firestoreService.updateBug(bugId, updateData);
                if (result.success) {
                    dispatch({ type: 'BUG_UPDATED', payload: result.data });
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
        deleteBug: async (bugId) => {
            try {
                const result = await firestoreService.deleteBug(bugId);
                if (result.success) {
                    dispatch({ type: 'BUG_DELETED', payload: bugId });
                    toast.success('Bug deleted successfully', { duration: 5000 });
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