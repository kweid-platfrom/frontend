import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    automations: [],
    loading: false,
    error: null,
};

const automationReducer = (state, action) => {
    switch (action.type) {
        case 'AUTOMATIONS_LOADING':
            return { ...state, loading: true, error: null };
        case 'AUTOMATIONS_LOADED':
            return { ...state, automations: action.payload, loading: false, error: null };
        case 'AUTOMATIONS_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export const useAutomation = () => {
    const [state, dispatch] = useReducer(automationReducer, initialState);

    const actions = {
        loadAutomationsSuccess: (automations) => {
            dispatch({ type: 'AUTOMATIONS_LOADED', payload: automations });
        },
        loadAutomationsError: (error) => {
            dispatch({ type: 'AUTOMATIONS_ERROR', payload: error });
        },
        loadAutomations: async (suiteId) => {
            dispatch({ type: 'AUTOMATIONS_LOADING' });
            try {
                const result = await firestoreService.getAutomationsBySuite(suiteId);
                if (result.success) {
                    dispatch({ type: 'AUTOMATIONS_LOADED', payload: result.data });
                } else {
                    dispatch({ type: 'AUTOMATIONS_ERROR', payload: result.error.message });
                    toast.error(result.error.message, { duration: 5000 });
                }
            } catch (error) {
                dispatch({ type: 'AUTOMATIONS_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
    };

    return { state, actions };
};