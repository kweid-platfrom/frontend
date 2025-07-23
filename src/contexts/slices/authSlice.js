// context/slices/authSlice.js
export const authInitialState = {
    user: null,
    loading: false,
    error: null
};

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'AUTH_SET_USER':
            return {
                ...state,
                user: action.payload,
                loading: false,
                error: null
            };

        case 'AUTH_SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };

        case 'AUTH_SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case 'AUTH_LOGOUT':
            return authInitialState;

        default:
            return state;
    }
};