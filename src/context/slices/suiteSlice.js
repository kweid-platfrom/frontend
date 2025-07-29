import { useReducer } from 'react';
import { FirestoreService } from '../../services/firestoreService';
import { handleFirebaseOperation } from '../../utils/firebaseErrorHandler';

const initialState = {
    testSuites: [],
    activeSuite: null,
    hasCreatedSuite: false,
    suiteCreationBlocked: false,
    loading: false,
    error: null,
};

const suitesReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD_SUITES_START':
            return { ...state, loading: true, error: null };
        case 'LOAD_SUITES_SUCCESS':
            return {
                ...state,
                testSuites: action.payload,
                activeSuite: action.payload.length > 0 ? action.payload[0] : state.activeSuite,
                hasCreatedSuite: action.payload.length > 0,
                loading: false,
                error: null,
            };
        case 'LOAD_SUITES_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'CREATE_SUITE_START':
            return { ...state, loading: true, error: null };
        case 'CREATE_SUITE_SUCCESS':
            return {
                ...state,
                testSuites: [...state.testSuites, action.payload],
                activeSuite: action.payload, // Automatically activate the newly created suite
                hasCreatedSuite: true,
                loading: false,
                error: null,
            };
        case 'CREATE_SUITE_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'ACTIVATE_SUITE':
            return { ...state, activeSuite: action.payload };
        case 'MARK_SUITE_CREATED':
            return { ...state, hasCreatedSuite: true };
        case 'CLEAR_SUITES':
            return {
                ...initialState,
                loading: false,
            };
        default:
            return state;
    }
};

export const useSuites = () => {
    const [state, dispatch] = useReducer(suitesReducer, initialState);

    const actions = {
        loadSuitesStart: () => {
            console.log('🏢 Starting to load suites');
            dispatch({ type: 'LOAD_SUITES_START' });
        },
        loadSuitesSuccess: (suites) => {
            console.log('✅ Suites loaded successfully:', suites.length);
            dispatch({ type: 'LOAD_SUITES_SUCCESS', payload: suites });
        },
        loadSuitesError: (error) => {
            console.error('❌ Error loading suites:', error);
            dispatch({ type: 'LOAD_SUITES_ERROR', payload: error });
        },
        createSuite: async (suiteData, authState, subscriptionState, uiActions) => {
            try {
                console.log('🏢 Creating suite:', suiteData);
                dispatch({ type: 'CREATE_SUITE_START' });

                // Validate required data
                if (!authState?.currentUser?.uid) {
                    throw new Error('User authentication required');
                }

                if (!suiteData?.name?.trim()) {
                    throw new Error('Suite name is required');
                }

                // Prepare suite data
                const suiteToCreate = {
                    name: suiteData.name.trim(),
                    description: suiteData.description?.trim() || '',
                    ownerType: authState.accountType || 'individual',
                    ownerId: authState.currentUser.uid,
                    organizationId: authState.currentUser.organizationId || null,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    ...suiteData, // Allow override of any other fields
                };

                console.log('🏢 Suite data to create:', suiteToCreate);

                // Create the suite using FirestoreService
                const result = await handleFirebaseOperation(
                    () => FirestoreService.createTestSuite(suiteToCreate),
                    'Suite created successfully',
                    (errorMessage) => {
                        console.error('Suite creation failed:', errorMessage);
                        throw new Error(errorMessage);
                    }
                );

                if (result.success) {
                    console.log('✅ Suite created successfully:', result.data);
                    dispatch({ type: 'CREATE_SUITE_SUCCESS', payload: result.data });
                    
                    // Show success notification if UI actions are available
                    if (uiActions?.showNotification) {
                        uiActions.showNotification({
                            id: 'suite-created',
                            type: 'success',
                            message: `Suite "${result.data.name}" created successfully!`,
                            duration: 5000,
                        });
                    }

                    return { success: true, data: result.data };
                } else {
                    throw new Error(result.error || 'Failed to create suite');
                }
            } catch (error) {
                console.error('❌ Error creating suite:', error);
                const errorMessage = error.message || 'An unexpected error occurred while creating the suite';
                dispatch({ type: 'CREATE_SUITE_ERROR', payload: errorMessage });
                
                return { 
                    success: false, 
                    error: { message: errorMessage }
                };
            }
        },
        activateSuite: (suite) => {
            console.log('🏢 Activating suite:', suite?.id);
            dispatch({ type: 'ACTIVATE_SUITE', payload: suite });
        },
        markSuiteCreated: () => {
            console.log('🏢 Marking suite as created');
            dispatch({ type: 'MARK_SUITE_CREATED' });
        },
        clearSuites: () => {
            console.log('🧹 Clearing suites state');
            dispatch({ type: 'CLEAR_SUITES' });
        },
    };

    return { state, actions };
};