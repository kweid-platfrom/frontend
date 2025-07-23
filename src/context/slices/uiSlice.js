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
    toasts: [],
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
        case 'TOAST_ADD':
            return {
                ...state,
                toasts: [...state.toasts, { id: Date.now(), ...action.payload }],
            };
        case 'TOAST_REMOVE':
            return {
                ...state,
                toasts: state.toasts.filter((toast) => toast.id !== action.payload),
            };
        case 'NOTIFICATION_ADD':
            return {
                ...state,
                notifications: [...state.notifications, { id: Date.now(), ...action.payload }],
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
        showNotification: (type, message, duration = 5000) => {
            const notificationId = Date.now();
            dispatch({ type: 'NOTIFICATION_ADD', payload: { type, message, duration } });
            setTimeout(() => {
                dispatch({ type: 'NOTIFICATION_REMOVE', payload: notificationId });
            }, duration);
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