import { useReducer } from 'react';
import { FirestoreService } from '../../services/firestoreService';
import { toast } from 'sonner';

const initialState = {
    currentPlan: 'trial', // Aligned with useSubscription.js
    status: 'trial_active', // Aligned with useSubscription.js
    trialEndsAt: null,
    trialStartsAt: null,
    isTrialActive: true, // Aligned with useSubscription.js
    isTrialExpired: false,
    isSubscriptionActive: false,
    daysInTrial: 0,
    daysRemainingInTrial: 0,
    planLimits: {
        maxSuites: 999, // Aligned with useSubscription.js
        maxTestCasesPerSuite: 999,
        canCreateTestCases: true,
        canUseRecordings: true,
        canUseAutomation: true,
        canInviteTeam: true,
        canExportReports: true,
        canCreateOrganizations: true,
        advancedAnalytics: true,
        prioritySupport: true,
    },
    freeTierLimits: {
        maxSuites: 1,
        maxTestCasesPerSuite: 10,
        canCreateTestCases: true,
        canUseRecordings: false,
        canUseAutomation: false,
        canInviteTeam: false,
        canExportReports: false,
        canCreateOrganizations: false,
        advancedAnalytics: false,
        prioritySupport: false,
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
                currentPlan: action.payload.currentPlan,
                status: action.payload.status,
                trialEndsAt: action.payload.trialEndsAt,
                trialStartsAt: action.payload.trialStartsAt,
                isTrialActive: action.payload.isTrialActive,
                isTrialExpired: action.payload.isTrialExpired,
                isSubscriptionActive: action.payload.isSubscriptionActive,
                daysInTrial: action.payload.daysInTrial,
                daysRemainingInTrial: action.payload.daysRemainingInTrial,
                planLimits: action.payload.planLimits,
                freeTierLimits: action.payload.freeTierLimits || state.freeTierLimits,
                loading: false,
                error: null,
            };
        case 'SUBSCRIPTION_DOWNGRADED':
            return {
                ...state,
                currentPlan: action.payload.currentPlan,
                status: action.payload.status,
                isTrialActive: false,
                isTrialExpired: action.payload.isTrialExpired || false,
                isSubscriptionActive: false,
                planLimits: action.payload.planLimits,
                loading: false,
            };
        case 'TRIAL_EXPIRED':
            return {
                ...state,
                currentPlan: 'free',
                status: 'free',
                isTrialActive: false,
                isTrialExpired: true,
                isSubscriptionActive: false,
                planLimits: action.payload.planLimits,
                loading: false,
            };
        case 'SUBSCRIPTION_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

const getPlanLimits = (accountType, plan, isTrialActive) => {
    const defaultLimits = {
        maxSuites: 1,
        maxTestCasesPerSuite: 10,
        canCreateTestCases: true,
        canUseRecordings: false,
        canUseAutomation: false,
        canInviteTeam: false,
        canExportReports: false,
        canCreateOrganizations: false,
        advancedAnalytics: false,
        prioritySupport: false,
    };

    if (isTrialActive) {
        return {
            maxSuites: 999, // Aligned with useSubscription.js
            maxTestCasesPerSuite: 999,
            canCreateTestCases: true,
            canUseRecordings: true,
            canUseAutomation: true,
            canInviteTeam: accountType === 'organization',
            canExportReports: true,
            canCreateOrganizations: true,
            advancedAnalytics: true,
            prioritySupport: true,
        };
    }

    const limits = {
        individual: {
            free: {
                maxSuites: 1,
                maxTestCasesPerSuite: 10,
                canCreateTestCases: true,
                canUseRecordings: false,
                canUseAutomation: false,
                canInviteTeam: false,
                canExportReports: false,
                canCreateOrganizations: false,
                advancedAnalytics: false,
                prioritySupport: false,
            },
            pro: {
                maxSuites: 5,
                maxTestCasesPerSuite: 999,
                canCreateTestCases: true,
                canUseRecordings: true,
                canUseAutomation: true,
                canInviteTeam: false,
                canExportReports: true,
                canCreateOrganizations: true,
                advancedAnalytics: true,
                prioritySupport: true,
            },
        },
        organization: {
            free: {
                maxSuites: 3,
                maxTestCasesPerSuite: 10,
                canCreateTestCases: true,
                canUseRecordings: false,
                canUseAutomation: false,
                canInviteTeam: false,
                canExportReports: false,
                canCreateOrganizations: false,
                advancedAnalytics: false,
                prioritySupport: false,
            },
            pro: {
                maxSuites: 10,
                maxTestCasesPerSuite: 999,
                canCreateTestCases: true,
                canUseRecordings: true,
                canUseAutomation: true,
                canInviteTeam: true,
                canExportReports: true,
                canCreateOrganizations: true,
                advancedAnalytics: true,
                prioritySupport: true,
            },
            enterprise: {
                maxSuites: Infinity,
                maxTestCasesPerSuite: 999,
                canCreateTestCases: true,
                canUseRecordings: true,
                canUseAutomation: true,
                canInviteTeam: true,
                canExportReports: true,
                canCreateOrganizations: true,
                advancedAnalytics: true,
                prioritySupport: true,
            },
        },
    };

    return limits[accountType]?.[plan] || defaultLimits;
};

export const useSubscription = () => {
    const [state, dispatch] = useReducer(subscriptionReducer, initialState);

    const actions = {
        loadSubscriptionInfo: async (authState, uiActions) => {
            dispatch({ type: 'SUBSCRIPTION_LOADING' });
            try {
                const userId = authState?.currentUser?.uid;
                const accountType = authState?.accountType || 'individual';
                const defaultSubscription = {
                    currentPlan: 'trial',
                    status: 'trial_active',
                    trialEndsAt: null,
                    trialStartsAt: null,
                    isTrialActive: true,
                    isTrialExpired: false,
                    isSubscriptionActive: false,
                    daysInTrial: 0,
                    daysRemainingInTrial: 0,
                    planLimits: getPlanLimits(accountType, 'trial', true),
                    freeTierLimits: getPlanLimits(accountType, 'free', false),
                };

                if (!userId) {
                    dispatch({ type: 'SUBSCRIPTION_LOADED', payload: defaultSubscription });
                    uiActions?.updateFeatureLocks(defaultSubscription.planLimits);
                    return;
                }

                const subscriptionResult = await FirestoreService.getSubscriptionWithStatus(userId);
                if (subscriptionResult.success) {
                    const subscriptionData = subscriptionResult.data;
                    const planLimits = getPlanLimits(accountType, subscriptionData.plan, subscriptionData.isTrialActive);
                    dispatch({
                        type: 'SUBSCRIPTION_LOADED',
                        payload: {
                            currentPlan: subscriptionData.plan,
                            status: subscriptionData.status,
                            trialEndsAt: subscriptionData.trial_ends_at,
                            trialStartsAt: subscriptionData.trial_starts_at,
                            isTrialActive: subscriptionData.isTrialActive,
                            isTrialExpired: subscriptionData.isTrialExpired,
                            isSubscriptionActive: subscriptionData.status === 'pro' || subscriptionData.status === 'enterprise',
                            daysInTrial: subscriptionData.daysInTrial,
                            daysRemainingInTrial: subscriptionData.daysRemainingInTrial,
                            planLimits,
                            freeTierLimits: getPlanLimits(accountType, 'free', false),
                        },
                    });
                    uiActions?.updateFeatureLocks(planLimits);
                } else {
                    dispatch({ type: 'SUBSCRIPTION_LOADED', payload: defaultSubscription });
                    uiActions?.updateFeatureLocks(defaultSubscription.planLimits);
                }
            } catch (error) {
                console.error('Failed to load subscription:', error);
                const defaultSubscription = {
                    currentPlan: 'trial',
                    status: 'trial_active',
                    trialEndsAt: null,
                    trialStartsAt: null,
                    isTrialActive: true,
                    isTrialExpired: false,
                    isSubscriptionActive: false,
                    daysInTrial: 0,
                    daysRemainingInTrial: 0,
                    planLimits: getPlanLimits(authState?.accountType || 'individual', 'trial', true),
                    freeTierLimits: getPlanLimits(authState?.accountType || 'individual', 'free', false),
                };
                dispatch({ type: 'SUBSCRIPTION_LOADED', payload: defaultSubscription });
                uiActions?.updateFeatureLocks(defaultSubscription.planLimits);
                toast.error('Failed to load subscription: ' + error.message, { duration: 5000 });
            }
        },
        handleTrialExpiry: async (suitesState, suitesActions, uiActions) => {
            try {
                const downgradeToPlan = 'free';
                const newPlanLimits = getPlanLimits(suitesState.accountType || 'individual', downgradeToPlan, false);
                dispatch({
                    type: 'TRIAL_EXPIRED',
                    payload: { planLimits: newPlanLimits },
                });

                const activeSuites = suitesState.suites.filter((suite) => suite.status !== 'inactive');
                if (activeSuites.length > newPlanLimits.maxSuites) {
                    const suitesToDeactivate = activeSuites
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(newPlanLimits.maxSuites);
                    for (const suite of suitesToDeactivate) {
                        await suitesActions.updateSuite(suite.id, { status: 'inactive' });
                    }
                }

                uiActions?.updateFeatureLocks(newPlanLimits);
                toast.warning('Your trial has expired. Some features are now limited.', { duration: 8000 });
            } catch (error) {
                dispatch({ type: 'SUBSCRIPTION_ERROR', payload: error.message });
                toast.error('Error updating your subscription. Please contact support.', { duration: 5000 });
            }
        },
        upgradeSubscription: async (newPlan, authState, uiActions) => {
            try {
                dispatch({ type: 'SUBSCRIPTION_LOADING' });
                const newPlanLimits = getPlanLimits(authState?.accountType || 'individual', newPlan, false);
                dispatch({
                    type: 'SUBSCRIPTION_LOADED',
                    payload: {
                        currentPlan: newPlan,
                        status: newPlan,
                        trialEndsAt: null,
                        trialStartsAt: null,
                        isTrialActive: false,
                        isTrialExpired: false,
                        isSubscriptionActive: true,
                        daysInTrial: 0,
                        daysRemainingInTrial: 0,
                        planLimits: newPlanLimits,
                        freeTierLimits: getPlanLimits(authState?.accountType || 'individual', 'free', false),
                    },
                });
                uiActions?.updateFeatureLocks(newPlanLimits);
                toast.success(`Successfully upgraded to ${newPlan} plan!`, { duration: 5000 });
                return { success: true };
            } catch (error) {
                dispatch({ type: 'SUBSCRIPTION_ERROR', payload: error.message });
                toast.error('Failed to upgrade subscription', { duration: 5000 });
                return { success: false, error: error.message };
            }
        },
        checkSubscriptionLimits: () => {},
    };

    return { state, actions };
};

export default useSubscription;