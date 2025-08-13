/* eslint-disable @typescript-eslint/no-unused-vars */
import { useReducer } from 'react';
import { BaseFirestoreService } from '../../services/firestoreService'; // Fixed import
import { toast } from 'sonner';

// Create a singleton instance
const firestoreService = new BaseFirestoreService();

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
                // Check if queryDocuments method exists
                if (typeof firestoreService.queryDocuments !== 'function') {
                    throw new Error('Test case query service is not available');
                }

                const result = await firestoreService.queryDocuments(`testSuites/${suiteId}/testCases`);
                if (result.success) {
                    dispatch({ type: 'TEST_CASES_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'TEST_CASES_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                const errorMessage = error.message || 'An unexpected error occurred while loading test cases';
                dispatch({ type: 'TEST_CASES_ERROR', payload: errorMessage });
                toast.error(errorMessage, { duration: 5000 });
            }
        },
        createTestCase: (appState, appActions) => {
            return async (testCaseData) => {
                try {
                    console.log('Creating test case with data:', testCaseData);

                    // Safe access to subscription state with better error handling
                    const planLimits = appState?.subscription?.planLimits;
                    const canCreate = planLimits?.canCreateTestCases !== false;

                    if (!canCreate) {
                        const error = 'Test case creation is locked. Please upgrade your plan.';
                        toast.error(error, { duration: 5000 });
                        if (appActions?.ui?.openModal) {
                            appActions.ui.openModal('upgradePrompt');
                        }
                        return { success: false, error };
                    }

                    const activeSuite = appState?.suites?.activeSuite;
                    if (!activeSuite?.id) {
                        const error = 'No active suite selected';
                        toast.error(error, { duration: 5000 });
                        return { success: false, error };
                    }

                    const currentUser = firestoreService.getCurrentUser();
                    if (!currentUser?.uid) {
                        const error = 'User not authenticated';
                        toast.error(error, { duration: 5000 });
                        return { success: false, error };
                    }

                    // Check if createDocument method exists
                    if (typeof firestoreService.createDocument !== 'function') {
                        throw new Error('Test case creation service is not available');
                    }

                    // Prepare data with ALL required fields for Firestore rules
                    const collectionPath = `testSuites/${activeSuite.id}/testCases`;
                    console.log('Creating test case in collection:', collectionPath);

                    const testCaseDocument = {
                        created_by: currentUser.uid,
                        suite_id: activeSuite.id,
                        title: testCaseData.title || '',
                        description: testCaseData.description || '',
                        priority: testCaseData.priority || 'medium',
                        status: testCaseData.status || 'draft',
                        assignee: testCaseData.assignee || '',
                        steps: testCaseData.steps || [],
                        expected_result: testCaseData.expected_result || '',
                        tags: testCaseData.tags || [],
                        linkedBugIds: testCaseData.linkedBugIds || [],
                        estimated_duration: testCaseData.estimated_duration || null,
                        category: testCaseData.category || 'functional',
                        last_executed: null,
                        execution_history: [],
                        version: 1,
                        test_type: testCaseData.test_type || 'manual',
                        automation_status: testCaseData.automation_status || 'not_automated',
                        ...Object.fromEntries(
                            Object.entries(testCaseData).filter(([_, value]) => value !== undefined)
                        )
                    };

                    console.log('Final test case document:', testCaseDocument);

                    const result = await firestoreService.createDocument(collectionPath, testCaseDocument);

                    if (result.success) {
                        dispatch({ type: 'TEST_CASE_CREATED', payload: result.data });
                        toast.success('Test case created successfully', { duration: 5000 });
                        return result;
                    } else {
                        console.error('Failed to create test case:', result.error);
                        toast.error(result.error.message, { duration: 5000 });
                        return result;
                    }
                } catch (error) {
                    const errorMessage = error.message || 'An unexpected error occurred while creating test case';
                    console.error('Error creating test case:', error);
                    toast.error(errorMessage, { duration: 5000 });
                    return { success: false, error: errorMessage };
                }
            };
        },
        updateTestCase: (appState) => {
            return async (testCaseId, updateData) => {
                try {
                    const currentUser = firestoreService.getCurrentUser();
                    if (!currentUser) {
                        throw new Error('User not authenticated');
                    }

                    const activeSuite = appState?.suites?.activeSuite;
                    if (!activeSuite?.id) {
                        throw new Error('No active suite selected');
                    }

                    // Check if updateDocument method exists
                    if (typeof firestoreService.updateDocument !== 'function') {
                        throw new Error('Test case update service is not available');
                    }

                    const collectionPath = `testSuites/${activeSuite.id}/testCases`;
                    console.log('Updating test case in collection:', collectionPath);

                    const cleanUpdateData = Object.fromEntries(
                        Object.entries(updateData).filter(([_, value]) => value !== undefined)
                    );

                    const result = await firestoreService.updateDocument(collectionPath, testCaseId, cleanUpdateData);
                    if (result.success) {
                        const updatedData = { id: testCaseId, ...result.data };
                        dispatch({ type: 'TEST_CASE_UPDATED', payload: updatedData });
                        toast.success('Test case updated successfully', { duration: 5000 });
                        return { success: true, data: updatedData };
                    } else {
                        toast.error(result.error.message, { duration: 5000 });
                        return result;
                    }
                } catch (error) {
                    const errorMessage = error.message || 'An unexpected error occurred while updating test case';
                    console.error('Error updating test case:', error);
                    toast.error(errorMessage, { duration: 5000 });
                    return { success: false, error: errorMessage };
                }
            };
        },
        deleteTestCase: (appState) => {
            return async (testCaseId) => {
                try {
                    const currentUser = firestoreService.getCurrentUser();
                    if (!currentUser) {
                        throw new Error('User not authenticated');
                    }

                    const activeSuite = appState?.suites?.activeSuite;
                    if (!activeSuite?.id) {
                        throw new Error('No active suite selected');
                    }

                    // Check if deleteDocument method exists
                    if (typeof firestoreService.deleteDocument !== 'function') {
                        throw new Error('Test case deletion service is not available');
                    }

                    const collectionPath = `testSuites/${activeSuite.id}/testCases`;
                    console.log('Deleting test case from collection:', collectionPath);

                    const result = await firestoreService.deleteDocument(collectionPath, testCaseId);
                    if (result.success) {
                        dispatch({ type: 'TEST_CASE_DELETED', payload: testCaseId });
                        toast.success('Test case deleted successfully', { duration: 5000 });
                        return result;
                    } else {
                        toast.error(result.error.message, { duration: 5000 });
                        return result;
                    }
                } catch (error) {
                    const errorMessage = error.message || 'An unexpected error occurred while deleting test case';
                    console.error('Error deleting test case:', error);
                    toast.error(errorMessage, { duration: 5000 });
                    return { success: false, error: errorMessage };
                }
            };
        },
    };

    return { state, actions };
};