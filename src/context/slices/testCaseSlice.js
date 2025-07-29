import { useReducer } from 'react';
import { FirestoreService } from '../../services/firestoreService';
import { toast } from 'sonner';

// Create a singleton instance
const firestoreService = new FirestoreService();

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
                const result = await firestoreService.queryDocuments(`testSuites/${suiteId}/testCases`);
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
        
        // Fixed createTestCase with proper field validation for Firestore rules
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

                    // Prepare data with ALL required fields for Firestore rules
                    const collectionPath = `testSuites/${activeSuite.id}/testCases`;
                    console.log('Creating test case in collection:', collectionPath);
                    
                    // CRITICAL: Ensure all required fields match Firestore security rules
                    const testCaseDocument = {
                        // Required by Firestore rules for test case creation
                        created_by: currentUser.uid,
                        suite_id: activeSuite.id,
                        
                        // Core test case fields
                        title: testCaseData.title || '',
                        description: testCaseData.description || '',
                        priority: testCaseData.priority || 'medium',
                        status: testCaseData.status || 'draft',
                        assignee: testCaseData.assignee || '',
                        
                        // Steps and expected results
                        steps: testCaseData.steps || [],
                        expected_result: testCaseData.expected_result || '',
                        
                        // Additional fields
                        tags: testCaseData.tags || [],
                        linkedBugIds: testCaseData.linkedBugIds || [],
                        
                        // Metadata
                        estimated_duration: testCaseData.estimated_duration || null,
                        category: testCaseData.category || 'functional',
                        
                        // Execution tracking
                        last_executed: null,
                        execution_history: [],
                        
                        // Version control
                        version: 1,
                        
                        // Additional properties that might be expected by your rules
                        test_type: testCaseData.test_type || 'manual',
                        automation_status: testCaseData.automation_status || 'not_automated',
                        
                        // Ensure we don't have any undefined values
                        ...Object.fromEntries(
                            Object.entries(testCaseData).filter(([ value]) => value !== undefined)
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
                    console.error('Error creating test case:', error);
                    const errorMessage = error.message || 'Unknown error occurred';
                    toast.error(errorMessage, { duration: 5000 });
                    return { success: false, error: errorMessage };
                }
            };
        },
        
        // Fixed updateTestCase with proper validation
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
                    
                    const collectionPath = `testSuites/${activeSuite.id}/testCases`;
                    console.log('Updating test case in collection:', collectionPath);
                    
                    // Clean update data - remove undefined values
                    const cleanUpdateData = Object.fromEntries(
                        Object.entries(updateData).filter(([ value]) => value !== undefined)
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
                    console.error('Error updating test case:', error);
                    toast.error(error.message, { duration: 5000 });
                    return { success: false, error: error.message };
                }
            };
        },
        
        // Fixed deleteTestCase with proper validation
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
                    console.error('Error deleting test case:', error);
                    toast.error(error.message, { duration: 5000 });
                    return { success: false, error: error.message };
                }
            };
        },
    };

    return { state, actions };
};