import { useReducer } from 'react';
import firestoreService from '../../services';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

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

export const useBugReducer = () => {
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
                const result = await firestoreService.assets.getBugs(suiteId);
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
        createBug: async (bugData, sprintId = null) => {
            dispatch({ type: 'BUGS_LOADING' });
            try {
                const suiteId = bugData.suiteId || bugData.suite_id;
                if (!suiteId) {
                    throw new Error('Suite ID is required');
                }

                const formattedBugData = {
                    ...bugData,
                    created_at: bugData.created_at || Timestamp.fromDate(new Date()),
                    updated_at: bugData.updated_at || Timestamp.fromDate(new Date()),
                    lastActivity: bugData.lastActivity || Timestamp.fromDate(new Date()),
                    status: bugData.status || 'New',
                    tags: bugData.tags || [],
                    comments: bugData.comments || [],
                    searchTerms: bugData.searchTerms || [],
                    resolutionHistory: bugData.resolutionHistory || [],
                    attachments: bugData.attachments || [],
                    commentCount: bugData.commentCount || 0,
                    viewCount: bugData.viewCount || 0,
                    version: bugData.version || 1,
                    suite_id: suiteId,
                    suiteId: undefined,
                };

                console.log('Creating bug with data:', { suiteId, formattedBugData, sprintId });

                const result = await firestoreService.createBug(suiteId, formattedBugData, sprintId);

                if (result.success) {
                    dispatch({ type: 'BUG_CREATED', payload: { ...result.data, suiteId } });
                    console.log('Bug created successfully:', result.data);
                    toast.success('Bug created successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'BUGS_ERROR', payload: result.error.message });
                    console.error('Bug creation failed:', result.error);
                    toast.error(result.error.message, { duration: 5000 });
                    throw new Error(result.error.message);
                }
            } catch (error) {
                console.error('Error in createBug:', error);
                dispatch({ type: 'BUGS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                throw error;
            }
        },
        updateBug: async (bugId, updateData) => {
            dispatch({ type: 'BUGS_LOADING' });
            try {
                const suiteId = updateData.suite_id || updateData.suiteId;
                if (!suiteId) {
                    throw new Error('Suite ID is required for update');
                }

                const formattedUpdateData = {
                    ...updateData,
                    updated_at: updateData.updated_at || Timestamp.fromDate(new Date()),
                    lastActivity: updateData.lastActivity || Timestamp.fromDate(new Date()),
                    suite_id: suiteId,
                    suiteId: undefined,
                };

                console.log('Updating bug with data:', { suiteId, bugId, formattedUpdateData });

                const result = await firestoreService.updateDocument(`suites/${suiteId}/bugs`, bugId, formattedUpdateData);
                if (result.success) {
                    dispatch({ type: 'BUG_UPDATED', payload: { id: bugId, ...result.data } });
                    toast.success('Bug updated successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'BUGS_ERROR', payload: result.error.message });
                    console.error('Bug update failed:', result.error);
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                console.error('Error in updateBug:', error);
                dispatch({ type: 'BUGS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        deleteBug: async (bugId, suiteId) => {
            dispatch({ type: 'BUGS_LOADING' });
            try {
                if (!suiteId) {
                    throw new Error('Suite ID is required for delete');
                }
                const result = await firestoreService.deleteDocument(`suites/${suiteId}/bugs`, bugId);
                if (result.success) {
                    dispatch({ type: 'BUG_DELETED', payload: bugId });
                    toast.success('Bug deleted successfully', { duration: 5000 });
                    return result;
                } else {
                    dispatch({ type: 'BUGS_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                    return result;
                }
            } catch (error) {
                console.error('Error in deleteBug:', error);
                dispatch({ type: 'BUGS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
    };

    return { state, actions };
};