/* eslint-disable @typescript-eslint/no-unused-vars */
import { useReducer } from 'react';
import firestoreService from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    currentPlan: null,
    trialEndsAt: null,
    isTrialActive: false,
    isSubscriptionActive: false,
    planLimits: {
        maxSuites: 0,
        canCreateTestCases: false,
        canUseRecordings: false,
        canUseAutomation: false,
        canInviteTeam: false,
    },
    loading: false,
    error: null,
};

const subscriptionReducer = (state, action) => {
    switch (action.type) {
        case 'SUBSCRIPTION_LOADING':
            return { ...state, loading: true, error: null };
        case 'SUBSCRIPTION_LOADED':
            return {
                ...state,
                currentPlan: action.payload.plan,
                trialEndsAt: action.payload.trialEndsAt,
                isTrialActive: action.payload.isTrialActive,
                isSubscriptionActive: action.payload.isSubscriptionActive,
                planLimits: action.payload.planLimits,
                loading: false,
                error: null,
            };
        case 'SUBSCRIPTION_DOWNGRADED':
            return {
                ...state,
                currentPlan: action.payload.plan,
                isTrialActive: false,
                isSubscriptionActive: false,
                planLimits: action.payload.planLimits,
            };
        case 'TRIAL_EXPIRED':
            return {
                ...state,
                isTrialActive: false,
                currentPlan: action.payload.downgradeToPlan,
                planLimits: action.payload.planLimits,
            };
        case 'SUBSCRIPTION_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

const getPlanLimits = (accountType, plan, isTrialActive) => {
    if (isTrialActive) {
        return {
            maxSuites: accountType === 'individual' ? 5 : 10,
            canCreateTestCases: true,
            canUseRecordings: true,
            canUseAutomation: true,
            canInviteTeam: accountType === 'organization',
        };
    }

    const limits = {
        individual: {
            free: { maxSuites: 1, canCreateTestCases: false, canUseRecordings: false, canUseAutomation: false, canInviteTeam: false },
            pro: { maxSuites: 5, canCreateTestCases: true, canUseRecordings: true, canUseAutomation: true, canInviteTeam: false },
        },
        organization: {
            free: { maxSuites: 3, canCreateTestCases: false, canUseRecordings: false, canUseAutomation: false, canInviteTeam: false },
            pro: { maxSuites: 10, canCreateTestCases: true, canUseRecordings: true, canUseAutomation: true, canInviteTeam: true },
            enterprise: { maxSuites: Infinity, canCreateTestCases: true, canUseRecordings: true, canUseAutomation: true, canInviteTeam: true },
        },
    };

    return limits[accountType]?.[plan] || limits.individual.free;
};

export const useSubscription = () => {
    const [state, dispatch] = useReducer(subscriptionReducer, initialState);

    const actions = {
        loadSubscriptionInfo: async (authState, uiActions) => {
            dispatch({ type: 'SUBSCRIPTION_LOADING' });
            try {
                const userId = authState.currentUser.uid;
                const subscriptionResult = await firestoreService.getDocument('subscriptions', userId);
                if (subscriptionResult.success) {
                    const subscriptionData = subscriptionResult.data;
                    const planLimits = getPlanLimits(authState.accountType, subscriptionData.plan, subscriptionData.isTrialActive);
                    dispatch({
                        type: 'SUBSCRIPTION_LOADED',
                        payload: { ...subscriptionData, planLimits },
                    });
                    uiActions.updateFeatureLocks(planLimits);
                } else {
                    const defaultSubscription = {
                        plan: 'free',
                        trialEndsAt: null,
                        isTrialActive: false,
                        isSubscriptionActive: false,
                    };
                    const planLimits = getPlanLimits(authState.accountType, defaultSubscription.plan, false);
                    dispatch({
                        type: 'SUBSCRIPTION_LOADED',
                        payload: { ...defaultSubscription, planLimits },
                    });
                    uiActions.updateFeatureLocks(planLimits);
                }
            } catch (error) {
                dispatch({ type: 'SUBSCRIPTION_ERROR', payload: error.message });
                toast.error(error.message, { duration: 5000 });
            }
        },
        handleTrialExpiry: async (suitesState, suitesActions) => {
            try {
                const downgradeToPlan = 'free';
                const newPlanLimits = getPlanLimits(authState.accountType, downgradeToPlan, false);
                dispatch({
                    type: 'TRIAL_EXPIRED',
                    payload: { downgradeToPlan, planLimits: newPlanLimits },
                });

                const activeSuites = suitesState.suites.filter((suite) => suite.status !== 'inactive');
                if (activeSuites.length > newPlanLimits.maxSuites) {
                    const suitesToDeactivate = activeSuites
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(newPlanLimits.maxSuites);
                    for (const suite of suitesToDeactivate) {
                        await suitesActions.updateSuite(suite.id, { status: 'inactive' });
                    }
                    dispatch({
                        type: 'SUITES_DEACTIVATED',
                        payload: { maxAllowed: newPlanLimits.maxSuites },
                    });
                }

                uiActions.updateFeatureLocks(newPlanLimits);
                toast.warning('Your trial has expired. Some features are now limited.', { duration: 8000 });
            } catch (error) {
                toast.error('Error updating your subscription. Please contact support.', { duration: 5000 });
            }
        },
        upgradeSubscription: async (newPlan, authState, uiActions) => {
            try {
                dispatch({ type: 'SUBSCRIPTION_LOADING' });
                const newPlanLimits = getPlanLimits(authState.accountType, newPlan, false);
                dispatch({
                    type: 'SUBSCRIPTION_LOADED',
                    payload: {
                        plan: newPlan,
                        trialEndsAt: null,
                        isTrialActive: false,
                        isSubscriptionActive: true,
                        planLimits: newPlanLimits,
                    },
                });
                uiActions.updateFeatureLocks(newPlanLimits);
                toast.success(`Successfully upgraded to ${newPlan} plan!`, { duration: 5000 });
                return { success: true };
            } catch (error) {
                dispatch({ type: 'SUBSCRIPTION_ERROR', payload: error.message });
                toast.error('Failed to upgrade subscription', { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
    };

    return { state, actions };
};