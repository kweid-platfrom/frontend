// context/slices/uiSlice.js
export const uiInitialState = {
    modal: {
        isOpen: false,
        type: null,
        props: {}
    },
    overlay: {
        isOpen: false,
        type: null,
        props: {}
    },
    notification: {
        isVisible: false,
        type: 'info', // 'success', 'error', 'warning', 'info'
        message: '',
        duration: 5000
    }
};

export const uiReducer = (state, action) => {
    switch (action.type) {
        case 'UI_SET_MODAL':
            return {
                ...state,
                modal: {
                    isOpen: true,
                    type: action.payload.type,
                    props: action.payload.props || {}
                }
            };

        case 'UI_CLOSE_MODAL':
            return {
                ...state,
                modal: {
                    isOpen: false,
                    type: null,
                    props: {}
                }
            };

        case 'UI_SET_OVERLAY':
            return {
                ...state,
                overlay: {
                    isOpen: true,
                    type: action.payload.type,
                    props: action.payload.props || {}
                }
            };

        case 'UI_CLOSE_OVERLAY':
            return {
                ...state,
                overlay: {
                    isOpen: false,
                    type: null,
                    props: {}
                }
            };

        case 'UI_SET_NOTIFICATION':
            return {
                ...state,
                notification: {
                    isVisible: true,
                    type: action.payload.type || 'info',
                    message: action.payload.message,
                    duration: action.payload.duration || 5000
                }
            };

        case 'UI_CLEAR_NOTIFICATION':
            return {
                ...state,
                notification: {
                    ...state.notification,
                    isVisible: false
                }
            };

        default:
            return state;
    }
};