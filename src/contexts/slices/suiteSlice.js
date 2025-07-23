export const suiteInitialState = {
    suites: [],
    activeSuite: null,
    sprints: [],
    activeSprint: null,
    loading: false,
    error: null,
};

export const suiteReducer = (state, action) => {
    switch (action.type) {
        case 'SUITE_SET_SUITES':
            return { ...state, suites: action.payload, error: null };
        case 'SUITE_SET_ACTIVE':
            return { ...state, activeSuite: action.payload, sprints: [], activeSprint: null };
        case 'SUITE_ADD_SUITE':
            return { ...state, suites: [...state.suites, action.payload], error: null };
        case 'SUITE_UPDATE_SUITE':
            return {
                ...state,
                suites: state.suites.map((suite) =>
                    suite.id === action.payload.id ? action.payload : suite
                ),
                activeSuite:
                    state.activeSuite?.id === action.payload.id ? action.payload : state.activeSuite,
            };
        case 'SUITE_DELETE_SUITE':
            return {
                ...state,
                suites: state.suites.filter((suite) => suite.id !== action.payload),
                activeSuite: state.activeSuite?.id === action.payload ? null : state.activeSuite,
                sprints: [],
                activeSprint: null,
            };
        case 'SUITE_SET_SPRINTS':
            return { ...state, sprints: action.payload, error: null };
        case 'SUITE_SET_ACTIVE_SPRINT':
            return { ...state, activeSprint: action.payload };
        case 'SUITE_ADD_SPRINT':
            return { ...state, sprints: [...state.sprints, action.payload], error: null };
        case 'SUITE_SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SUITE_SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        default:
            return state;
    }
};