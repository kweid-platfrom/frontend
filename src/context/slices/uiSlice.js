import { useReducer } from 'react';

const initialState = {
    modals: {
        createSuite: false,
        createTestCase: false,
        createBug: false,
        createRecording: false,
        createSprint: false,
        linkResources: false,
        upgradePrompt: false,
    },
    featureLocks: {
        testCasesLocked: false,
        recordingsLocked: false,
        automationLocked: false,
        teamFeaturesLocked: false,
    },
    selectedItems: {
        testCases: [],
        bugs: [],
        recordings: [],
        sprints: [],
    },
    notifications: [],
    loading: false,
};

const uiReducer = (state, action) => {
    switch (action.type) {
        case 'MODAL_OPEN':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: true },
            };
        case 'MODAL_CLOSE':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: false },
            };
        case 'NOTIFICATION_ADD':
            return {
                ...state,
                notifications: [...state.notifications, {
                    id: action.payload.id || `notification-${Date.now()}`,
                    type: action.payload.type || 'info',
                    message: action.payload.message,
                    duration: action.payload.duration || 10000,
                }],
            };
        case 'NOTIFICATION_REMOVE':
            return {
                ...state,
                notifications: state.notifications.filter((n) => n.id !== action.payload),
            };
        case 'FEATURE_LOCK_UPDATE':
            return {
                ...state,
                featureLocks: { ...state.featureLocks, ...action.payload },
            };
        case 'SELECTION_UPDATE':
            return {
                ...state,
                selectedItems: { ...state.selectedItems, [action.payload.type]: action.payload.items },
            };
        case 'SELECTION_CLEAR':
            return {
                ...state,
                selectedItems: { testCases: [], bugs: [], recordings: [], sprints: [] },
            };
        case 'CLEAR_UI':
            return initialState;
        default:
            return state;
    }
};

export const useUI = () => {
    const [state, dispatch] = useReducer(uiReducer, initialState);

    const actions = {
        openModal: (modalName) => {
            dispatch({ type: 'MODAL_OPEN', payload: modalName });
        },
        closeModal: (modalName) => {
            dispatch({ type: 'MODAL_CLOSE', payload: modalName });
        },
        showNotification: ({ id, type, message, duration }) => {
            const payload = { id, type, message, duration: duration || 10000 };
            dispatch({ type: 'NOTIFICATION_ADD', payload });
            if (payload.duration) {
                setTimeout(() => {
                    dispatch({ type: 'NOTIFICATION_REMOVE', payload: payload.id });
                }, payload.duration);
            }
        },
        removeNotification: (id) => {
            dispatch({ type: 'NOTIFICATION_REMOVE', payload: id });
        },
        clearUI: () => {
            dispatch({ type: 'CLEAR_UI' });
        },
        updateFeatureLocks: (planLimits) => {
            dispatch({
                type: 'FEATURE_LOCK_UPDATE',
                payload: {
                    testCasesLocked: !planLimits.canCreateTestCases,
                    recordingsLocked: !planLimits.canUseRecordings,
                    automationLocked: !planLimits.canUseAutomation,
                    teamFeaturesLocked: !planLimits.canInviteTeam,
                },
            });
        },
        updateSelection: (type, items) => {
            dispatch({ type: 'SELECTION_UPDATE', payload: { type, items } });
        },
        clearSelections: () => {
            dispatch({ type: 'SELECTION_CLEAR' });
        },
    };

    return { state, actions };
};