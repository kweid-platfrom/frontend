/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useReducer, useEffect, useMemo } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import firestoreService from '../services/firestoreService';

// Import state slices
import { authReducer, authInitialState } from './slices/authSlice';
import { suiteReducer, suiteInitialState } from './slices/suiteSlice';
import { subscriptionReducer, subscriptionInitialState } from './slices/subscriptionSlice';
import { uiReducer, uiInitialState } from './slices/uiSlice';

// Create the main App Context
const AppContext = createContext();

// Initial combined state with dashboardMetrics and sprint support
const initialState = {
    auth: authInitialState,
    suite: {
        ...suiteInitialState,
        sprints: [],
        activeSprint: null,
    },
    subscription: subscriptionInitialState,
    ui: uiInitialState,
    dashboardMetrics: { testCases: 0, bugs: 0, recordings: 0, recentActivity: [] },
    loading: true,
    error: null,
};

// Combined reducer with dashboard and sprint actions
const appReducer = (state, action) => {
    switch (action.type) {
        // Auth actions
        case 'AUTH_SET_USER':
        case 'AUTH_SET_LOADING':
        case 'AUTH_SET_ERROR':
        case 'AUTH_LOGOUT':
            return { ...state, auth: authReducer(state.auth, action) };

        // Suite actions (including sprints)
        case 'SUITE_SET_SUITES':
        case 'SUITE_SET_ACTIVE':
        case 'SUITE_ADD_SUITE':
        case 'SUITE_UPDATE_SUITE':
        case 'SUITE_DELETE_SUITE':
        case 'SUITE_SET_SPRINTS':
        case 'SUITE_SET_ACTIVE_SPRINT':
        case 'SUITE_ADD_SPRINT':
        case 'SUITE_SET_LOADING':
        case 'SUITE_SET_ERROR':
            return { ...state, suite: suiteReducer(state.suite, action) };

        // Subscription actions
        case 'SUBSCRIPTION_SET_PLAN':
        case 'SUBSCRIPTION_SET_TRIAL':
        case 'SUBSCRIPTION_SET_LOADING':
        case 'SUBSCRIPTION_SET_ERROR':
        case 'SUBSCRIPTION_TRIGGER_DOWNGRADE':
            return { ...state, subscription: subscriptionReducer(state.subscription, action) };

        // UI actions
        case 'UI_SET_MODAL':
        case 'UI_CLOSE_MODAL':
        case 'UI_SET_OVERLAY':
        case 'UI_CLOSE_OVERLAY':
        case 'UI_SET_NOTIFICATION':
        case 'UI_CLEAR_NOTIFICATION':
            return { ...state, ui: uiReducer(state.ui, action) };

        // Dashboard actions
        case 'DASHBOARD_SET_METRICS':
            return { ...state, dashboardMetrics: action.payload };

        // Global actions
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'CLEAR_ERROR':
            return { ...state, error: null };

        default:
            return state;
    }
};

// AppProvider Component
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Authentication effect
    useEffect(() => {
        dispatch({ type: 'AUTH_SET_LOADING', payload: true });

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const userProfileResult = await firestoreService.getUserProfile(user.uid);
                    if (userProfileResult.success) {
                        dispatch({
                            type: 'AUTH_SET_USER',
                            payload: { ...user, profile: userProfileResult.data },
                        });
                        await loadUserTestSuites(user.uid);
                        await loadSubscriptionData(user.uid);
                    } else {
                        console.error('Failed to load user profile:', userProfileResult.error);
                        dispatch({ type: 'AUTH_SET_ERROR', payload: userProfileResult.error.message });
                    }
                } else {
                    dispatch({ type: 'AUTH_LOGOUT' });
                    dispatch({ type: 'SUITE_SET_SUITES', payload: [] });
                    dispatch({ type: 'SUITE_SET_SPRINTS', payload: [] });
                    dispatch({ type: 'SUITE_SET_ACTIVE_SPRINT', payload: null });
                    dispatch({ type: 'SUBSCRIPTION_SET_PLAN', payload: null });
                    dispatch({ type: 'DASHBOARD_SET_METRICS', payload: { testCases: 0, bugs: 0, recordings: 0, recentActivity: [] } });
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                dispatch({ type: 'AUTH_SET_ERROR', payload: error.message });
            } finally {
                dispatch({ type: 'AUTH_SET_LOADING', payload: false });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        });

        return () => unsubscribe();
    }, []);

    // Load user test suites
    const loadUserTestSuites = async () => {
        dispatch({ type: 'SUITE_SET_LOADING', payload: true });
        try {
            const suitesResult = await firestoreService.getUserTestSuites();
            if (suitesResult.success) {
                dispatch({ type: 'SUITE_SET_SUITES', payload: suitesResult.data });
                if (suitesResult.data.length > 0 && !state.suite.activeSuite) {
                    dispatch({ type: 'SUITE_SET_ACTIVE', payload: suitesResult.data[0] });
                }
            } else {
                dispatch({ type: 'SUITE_SET_ERROR', payload: suitesResult.error.message });
            }
        } catch (error) {
            dispatch({ type: 'SUITE_SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SUITE_SET_LOADING', payload: false });
        }
    };

    // Load subscription data
    const loadSubscriptionData = async (userId) => {
        dispatch({ type: 'SUBSCRIPTION_SET_LOADING', payload: true });
        try {
            const individualResult = await firestoreService.getIndividualAccount(userId);
            if (individualResult.success) {
                const accountData = individualResult.data;
                dispatch({
                    type: 'SUBSCRIPTION_SET_PLAN',
                    payload: {
                        accountType: 'individual',
                        plan: accountData.subscription?.plan || 'free',
                        status: accountData.subscription?.status || 'inactive',
                        trialEndsAt: accountData.subscription?.trialEndsAt,
                        isTrialActive: accountData.subscription?.isTrialActive || false,
                        features: getFeatureAccess('individual', accountData.subscription?.plan || 'free'),
                        limits: getAccountLimits('individual', accountData.subscription?.plan || 'free'),
                    },
                });
            } else {
                dispatch({
                    type: 'SUBSCRIPTION_SET_PLAN',
                    payload: {
                        accountType: 'individual',
                        plan: 'free',
                        status: 'inactive',
                        isTrialActive: false,
                        features: getFeatureAccess('individual', 'free'),
                        limits: getAccountLimits('individual', 'free'),
                    },
                });
            }
        } catch (error) {
            dispatch({ type: 'SUBSCRIPTION_SET_ERROR', payload: error.message });
        } finally {
            dispatch({ type: 'SUBSCRIPTION_SET_LOADING', payload: false });
        }
    };

    // Helper function to get feature access
    const getFeatureAccess = (accountType, plan) => {
        const features = {
            individual: {
                free: { testCases: false, reports: false, recordings: false, testAutomation: false, maxSuites: 1 },
                trial: { testCases: true, reports: true, recordings: true, testAutomation: true, maxSuites: 5 },
                paid: { testCases: true, reports: true, recordings: true, testAutomation: true, maxSuites: 5 },
            },
            organization: {
                free: { testCases: false, reports: false, recordings: false, testAutomation: false, teamMembers: false, maxSuites: 3 },
                trial: { testCases: true, reports: true, recordings: true, testAutomation: true, teamMembers: true, maxSuites: 10 },
                pro: { testCases: true, reports: true, recordings: true, testAutomation: true, teamMembers: true, maxSuites: 10 },
                enterprise: { testCases: true, reports: true, recordings: true, testAutomation: true, teamMembers: true, maxSuites: -1 },
            },
        };
        return features[accountType]?.[plan] || features.individual.free;
    };

    // Helper function to get account limits
    const getAccountLimits = (accountType, plan) => {
        const limits = {
            individual: { free: { suites: 1, writeCap: 100 }, trial: { suites: 5, writeCap: -1 }, paid: { suites: 5, writeCap: 1000 } },
            organization: {
                free: { suites: 3, writeCap: 100, members: 1 },
                trial: { suites: 10, writeCap: -1, members: -1 },
                pro: { suites: 10, writeCap: 2000, members: 50 },
                enterprise: { suites: -1, writeCap: -1, members: -1 },
            },
        };
        return limits[accountType]?.[plan] || limits.individual.free;
    };

    // Action creators
    const actions = {
        setUser: (user) => dispatch({ type: 'AUTH_SET_USER', payload: user }),
        logout: () => dispatch({ type: 'AUTH_LOGOUT' }),
        setActiveSuite: (suite) => dispatch({ type: 'SUITE_SET_ACTIVE', payload: suite }),
        addSuite: (suite) => dispatch({ type: 'SUITE_ADD_SUITE', payload: suite }),
        updateSuite: (suite) => dispatch({ type: 'SUITE_UPDATE_SUITE', payload: suite }),
        deleteSuite: (suiteId) => dispatch({ type: 'SUITE_DELETE_SUITE', payload: suiteId }),
        setSprints: (sprints) => dispatch({ type: 'SUITE_SET_SPRINTS', payload: sprints }),
        setActiveSprint: (sprint) => dispatch({ type: 'SUITE_SET_ACTIVE_SPRINT', payload: sprint }),
        addSprint: (sprint) => dispatch({ type: 'SUITE_ADD_SPRINT', payload: sprint }),
        updateSubscription: (subscriptionData) => dispatch({ type: 'SUBSCRIPTION_SET_PLAN', payload: subscriptionData }),
        triggerDowngrade: () => dispatch({ type: 'SUBSCRIPTION_TRIGGER_DOWNGRADE' }),
        showModal: (modalType, props = {}) => dispatch({ type: 'UI_SET_MODAL', payload: { type: modalType, props } }),
        closeModal: () => dispatch({ type: 'UI_CLOSE_MODAL' }),
        showOverlay: (overlayType, props = {}) => dispatch({ type: 'UI_SET_OVERLAY', payload: { type: overlayType, props } }),
        closeOverlay: () => dispatch({ type: 'UI_CLOSE_OVERLAY' }),
        showNotification: (notification) => dispatch({ type: 'UI_SET_NOTIFICATION', payload: notification }),
        clearNotification: () => dispatch({ type: 'UI_CLEAR_NOTIFICATION' }),
        setDashboardMetrics: (metrics) => dispatch({ type: 'DASHBOARD_SET_METRICS', payload: metrics }),
        setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
        clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    };

    // Memoized context value
    const contextValue = useMemo(
        () => ({
            state,
            actions,
            isAuthenticated: !!state.auth.user,
            hasActiveSuite: !!state.suite.activeSuite,
            hasActiveSprint: !!state.suite.activeSprint,
            canCreateSuite: state.suite.suites.length < (state.subscription.plan?.limits?.suites || 1),
            hasFeatureAccess: (feature) => state.subscription.plan?.features?.[feature] || false,
            isLoading: state.loading || state.auth.loading || state.suite.loading || state.subscription.loading,
        }),
        [state],
    );

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export default AppProvider;