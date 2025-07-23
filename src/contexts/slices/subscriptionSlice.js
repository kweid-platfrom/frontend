// context/slices/subscriptionSlice.js
export const subscriptionInitialState = {
    plan: null, // Will contain: { accountType, plan, status, features, limits }
    loading: false,
    error: null,
    downgradePending: false
};

export const subscriptionReducer = (state, action) => {
    switch (action.type) {
        case 'SUBSCRIPTION_SET_PLAN':
            return {
                ...state,
                plan: action.payload,
                loading: false,
                error: null
            };

        case 'SUBSCRIPTION_SET_TRIAL':
            return {
                ...state,
                plan: {
                    ...state.plan,
                    isTrialActive: action.payload.isTrialActive,
                    trialEndsAt: action.payload.trialEndsAt
                }
            };

        case 'SUBSCRIPTION_SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };

        case 'SUBSCRIPTION_SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case 'SUBSCRIPTION_TRIGGER_DOWNGRADE':
            return {
                ...state,
                downgradePending: true,
                plan: {
                    ...state.plan,
                    status: 'downgrade_pending'
                }
            };

        default:
            return state;
    }
};
