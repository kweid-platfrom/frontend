
import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    testCases: [],
    loading: false,
    error: null,
};

const testCaseReducer = (state, action) => {
    switch (action.type) {
        case 'TEST_CASES_LOADING':
            return { ...state, loading: true, error: null };
        case 'TEST_CASES_LOADED':
            return { ...state, testCases: action.payload, loading: false, error: null };
        case 'TEST_CASE_CREATED':
            return { ...state, testCases: [action.payload, ...state.testCases], loading: false, error: null };
        case 'TEST_CASE_UPDATED':
            return {
                ...state,
                testCases: state.testCases.map((tc) =>
                    tc.id === action.payload.id ? { ...tc, ...action.payload } : tc
                ),
                loading: false,
                error: null,
            };
        case 'TEST_CASE_DELETED':
            return {
                ...state,
                testCases: state.testCases.filter((tc) => tc.id !== action.payload),
                loading: false,
                error: null,
            };
        case 'TEST_CASES_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useTestCases = () => {
    const [state, dispatch] = useReducer(testCaseReducer, initialState);

    const actions = {
        loadTestCasesSuccess: (testCases) => {
            dispatch({ type: 'TEST_CASES_LOADED', payload: testCases });
        },
        loadTestCasesError: (error) => {
            dispatch({ type: 'TEST_CASES_ERROR', payload: error });
        },
        loadTestCases: async (suiteId) => {
            dispatch({ type: 'TEST_CASES_LOADING' });
            try {
                const result = await firestoreService.getTestCasesBySuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'TEST_CASES_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'TEST_CASES_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'TEST_CASES_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        createTestCase: async (testCaseData, subscriptionState, suitesState, uiActions) => {
            try {
                if (!subscriptionState.planLimits.canCreateTestCases) {
                    toast.error('Test case creation is locked. Please upgrade your plan.', { duration: 5000 });
                    uiActions.openModal('upgradePrompt');
                    return { success: false, error: 'Test case creation restricted' };
                }

                const result = await firestoreService.createTestCase({
                    ...testCaseData,
                    suiteId: suitesState.activeSuite.id,
                    created_at: new Date().toISOString(),
                    linkedBugIds: testCaseData.linkedBugIds || [],
                });

                if (result.success) {
                    dispatch({ type: 'TEST_CASE_CREATED', payload: result.data });
                    toast.success('Test case created successfully', { duration: 5000 });
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
        updateTestCase: async (testCaseId, updateData) => {
            try {
                const result = await firestoreService.updateTestCase(testCaseId, updateData);
                if (result.success) {
                    dispatch({ type: 'TEST_CASE_UPDATED', payload: result.data });
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
        deleteTestCase: async (testCaseId) => {
            try {
                const result = await firestoreService.deleteTestCase(testCaseId);
                if (result.success) {
                    dispatch({ type: 'TEST_CASE_DELETED', payload: testCaseId });
                    toast.success('Test case deleted successfully', { duration: 5000 });
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