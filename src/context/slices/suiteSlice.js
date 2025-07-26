import { useReducer } from 'react';

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
        case 'ACTIVATE_SUITE':
            return { ...state, activeSuite: action.payload };
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
        activateSuite: (suite) => {
            console.log('🏢 Activating suite:', suite?.id);
            dispatch({ type: 'ACTIVATE_SUITE', payload: suite });
        },
        clearSuites: () => {
            console.log('🧹 Clearing suites state');
            dispatch({ type: 'CLEAR_SUITES' });
        },
    };

    return { state, actions };
};