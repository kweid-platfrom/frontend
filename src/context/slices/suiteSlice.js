import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    suites: [],
    activeSuite: null,
    loading: false,
    error: null,
    hasCreatedSuite: false,
    suiteCreationBlocked: false,
};

const suiteReducer = (state, action) => {
    switch (action.type) {
        case 'SUITES_LOADING':
            return { ...state, loading: true, error: null };
        case 'SUITES_LOADED':
            return {
                ...state,
                suites: action.payload,
                hasCreatedSuite: action.payload.length > 0,
                loading: false,
                error: null,
            };
        case 'SUITE_ACTIVATED':
            return {
                ...state,
                activeSuite: action.payload,
                suiteCreationBlocked: false,
            };
        case 'SUITE_CREATED':
            return {
                ...state,
                suites: [action.payload, ...state.suites],
                activeSuite: action.payload,
                hasCreatedSuite: true,
                suiteCreationBlocked: false,
            };
        case 'SUITE_UPDATED':
            return {
                ...state,
                suites: state.suites.map((suite) =>
                    suite.id === action.payload.id ? action.payload : suite
                ),
                activeSuite:
                    state.activeSuite?.id === action.payload.id ? action.payload : state.activeSuite,
            };
        case 'SUITE_DELETED':
            const filteredSuites = state.suites.filter((suite) => suite.id !== action.payload);
            return {
                ...state,
                suites: filteredSuites,
                activeSuite: state.activeSuite?.id === action.payload ? null : state.activeSuite,
                hasCreatedSuite: filteredSuites.length > 0,
            };
        case 'SUITE_CREATION_BLOCKED':
            return { ...state, suiteCreationBlocked: true };
        case 'SUITES_DEACTIVATED':
            return {
                ...state,
                suites: state.suites.map((suite, index) =>
                    index >= action.payload.maxAllowed
                        ? { ...suite, status: 'inactive' }
                        : { ...suite, status: 'active' }
                ),
            };
        case 'SUITES_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useSuites = () => {
    const [state, dispatch] = useReducer(suiteReducer, initialState);

    const actions = {
        loadSuitesSuccess: (suites) => {
            dispatch({ type: 'SUITES_LOADED', payload: suites });
            if (suites.length === 0) {
                dispatch({ type: 'SUITE_CREATION_BLOCKED' });
            }
        },
        loadSuitesError: (error) => {
            dispatch({ type: 'SUITES_ERROR', payload: error });
        },
        loadUserSuites: async () => {
            dispatch({ type: 'SUITES_LOADING' });
            try {
                const result = await firestoreService.getUserTestSuites();
                if (result.success) {
                    dispatch({ type: 'SUITES_LOADED', payload: result.data });
                    if (result.data.length === 0) {
                        dispatch({ type: 'SUITE_CREATION_BLOCKED' });
                    }
                } else {
                    dispatch({ type: 'SUITES_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'SUITES_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        createSuite: async (suiteData, authState, subscriptionState, uiActions) => {
            try {
                if (state.suites.length >= subscriptionState.planLimits.maxSuites) {
                    toast.error('Suite limit reached for your current plan', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Suite limit reached' };
                }

                const result = await firestoreService.createTestSuite({
                    ...suiteData,
                    ownerType: authState.accountType,
                    ownerId: authState.currentUser.uid,
                    status: 'active',
                });

                if (result.success) {
                    dispatch({ type: 'SUITE_CREATED', payload: result.data });
                    toast.success('Test suite created successfully', { duration: 5000 });
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
        activateSuite: (suite) => {
            dispatch({ type: 'SUITE_ACTIVATED', payload: suite });
            toast.success(`Switched to ${suite.name}`, { duration: 5000 });
        },
        updateSuite: async (suiteId, updateData) => {
            try {
                const result = await firestoreService.updateTestSuite(suiteId, updateData);
                if (result.success) {
                    dispatch({ type: 'SUITE_UPDATED', payload: result.data });
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
        deleteSuite: async (suiteId) => {
            try {
                const result = await firestoreService.deleteTestSuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'SUITE_DELETED', payload: suiteId });
                    toast.success('Test suite deleted successfully', { duration: 5000 });
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