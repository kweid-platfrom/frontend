/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth as useAuthSlice } from './slices/authSlice';
import { useSuites } from './slices/suiteSlice';
import { useTestCases } from './slices/testCaseSlice';
import { useBugs } from './slices/bugSlice';
import { useRecordings } from './slices/recordingSlice';
import { useSprints } from './slices/sprintSlice';
import { useSubscription } from './slices/subscriptionSlice';
import { useTeam } from './slices/teamSlice';
import { useAutomation } from './slices/automationSlice';
import { useUI } from './slices/uiSlice';
import { toast } from 'sonner';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import firestoreService from '../services/firestoreService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const auth = useAuthSlice();
    const suites = useSuites();
    const testCases = useTestCases();
    const bugs = useBugs();
    const recordings = useRecordings();
    const sprints = useSprints();
    const subscription = useSubscription();
    const team = useTeam();
    const automation = useAutomation();
    const ui = useUI();

    const [suitesLoaded, setSuitesLoaded] = useState(false);
    const [suiteSubscriptionActive, setSuiteSubscriptionActive] = useState(false);

    const unsubscribeSuitesRef = useRef(null);
    const assetUnsubscribersRef = useRef({});
    const retryTimeoutRef = useRef(null);

    const linkTestCasesToBug = async (bugId, testCaseIds) => {
        return handleFirebaseOperation(
            () => firestoreService.batchLinkTestCasesToBug(bugId, testCaseIds),
            'Test cases linked to bug',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                bugs.actions.updateBug(bugId, result.data.bug);
                result.data.testCases.forEach((tc) => {
                    testCases.actions.updateTestCase(tc.id, tc);
                });
            }
            return result;
        });
    };

    const unlinkTestCaseFromBug = async (bugId, testCaseId) => {
        return handleFirebaseOperation(
            () => firestoreService.batchUnlinkTestCaseFromBug(bugId, testCaseId),
            'Test case unlinked from bug',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                bugs.actions.updateBug(bugId, result.data.bug);
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
            }
            return result;
        });
    };

    const linkBugsToTestCase = async (testCaseId, bugIds) => {
        return handleFirebaseOperation(
            () => firestoreService.batchLinkBugsToTestCase(testCaseId, bugIds),
            'Bugs linked to test case',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                result.data.bugs.forEach((bug) => {
                    bugs.actions.updateBug(bug.id, bug);
                });
            }
            return result;
        });
    };

    const unlinkBugFromTestCase = async (testCaseId, bugId) => {
        return handleFirebaseOperation(
            () => firestoreService.batchUnlinkBugFromTestCase(testCaseId, bugId),
            'Bug unlinked from test case',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                testCases.actions.updateTestCase(testCaseId, result.data.testCase);
                bugs.actions.updateBug(bugId, result.data.bug);
            }
            return result;
        });
    };

    const addTestCasesToSprint = async (sprintId, testCaseIds) => {
        return handleFirebaseOperation(
            () => firestoreService.addTestCasesToSprint(sprintId, testCaseIds),
            'Test cases added to sprint',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                sprints.actions.updateSprint(sprintId, result.data);
            }
            return result;
        });
    };

    const addBugsToSprint = async (sprintId, bugIds) => {
        return handleFirebaseOperation(
            () => firestoreService.addBugsToSprint(sprintId, bugIds),
            'Bugs added to sprint',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                sprints.actions.updateSprint(sprintId, result.data);
            }
            return result;
        });
    };

    // Enhanced auth actions for the new useAuth hook
    const logout = async () => {
        return auth.actions.signOut();
    };

    const initializeAuth = () => {
        return auth.actions.initializeAuth();
    };

    // In your AppProvider, replace the refreshUserProfile function with this:

    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile from AppProvider...');

            // Use the auth slice's refreshUserProfile (which now includes complete profile loading)
            if (auth.actions.refreshUserProfile) {
                const result = await auth.actions.refreshUserProfile();
                console.log('✅ Profile refreshed via auth slice:', result);
                return result;
            }

            // Fallback implementation (should rarely be needed now)
            if (auth.state.currentUser?.uid) {
                const profileResult = await firestoreService.getUserProfile(auth.state.currentUser.uid);
                console.log('📋 Profile fetched (fallback):', profileResult);

                if (profileResult.success) {
                    // Create enhanced user object with profile data
                    const enhancedUser = {
                        ...auth.state.currentUser,
                        displayName: auth.state.currentUser.displayName || profileResult.data.displayName || profileResult.data.name,
                        firstName: profileResult.data.firstName,
                        lastName: profileResult.data.lastName,
                        name: profileResult.data.name || profileResult.data.displayName,
                        organizationName: profileResult.data.organizationName,
                        organizationId: profileResult.data.organizationId,
                        role: profileResult.data.role,
                    };

                    auth.actions.restoreAuth({
                        user: enhancedUser,
                        profile: profileResult.data,
                        accountType: profileResult.data.accountType || 'individual',
                    });

                    console.log('✅ Profile restored with enhanced data');
                    return profileResult;
                }
            }

            throw new Error('No current user or profile data available');
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            throw error;
        }
    };

    const clearState = () => {
        console.log('Clearing all app state');
        try {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }

            if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                unsubscribeSuitesRef.current();
                unsubscribeSuitesRef.current = null;
            }

            Object.values(assetUnsubscribersRef.current).forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};

            auth.actions.clearAuthState();
            if (suites.actions.clearSuites) {
                suites.actions.clearSuites();
            } else {
                suites.actions.loadSuitesSuccess([]);
            }
            testCases.actions.loadTestCasesSuccess([]);
            bugs.actions.loadBugsSuccess([]);
            recordings.actions.loadRecordingsSuccess([]);
            sprints.actions.loadSprintsSuccess([]);
            subscription.actions.clearSubscription?.();
            team.actions.clearTeam?.();
            automation.actions.clearAutomation?.();
            ui.actions.clearUI?.();
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
        } catch (error) {
            console.error('Error clearing state:', error);
            toast.error(getFirebaseErrorMessage(error), { duration: 5000 });
        }
    };

    useEffect(() => {
        console.log('Initializing auth...');
        auth.actions.initializeAuth();
    }, []);

    useEffect(() => {
        console.log('Auth state changed:', {
            isAuthenticated: auth.state.isAuthenticated,
            currentUser: auth.state.currentUser?.uid,
            authInitialized: auth.state.isInitialized,
            authLoading: auth.state.loading,
            profileLoaded: auth.state.profileLoaded, // Add this for debugging
            subscriptionLoading: subscription.state.loading,
            suiteSubscriptionActive,
        });

        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        if (!auth.state.isInitialized || auth.state.loading || subscription.state.loading) {
            console.log('Waiting for auth and subscription initialization...');
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            return;
        }

        if (auth.state.isAuthenticated && auth.state.currentUser) {
            console.log('User authenticated, setting up subscriptions...');
            suites.actions.loadSuitesStart();
            setSuitesLoaded(false);

            if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                unsubscribeSuitesRef.current();
                unsubscribeSuitesRef.current = null;
            }

            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 2000;

            const setupSuiteSubscription = () => {
                handleFirebaseOperation(
                    () => new Promise((resolve, reject) => {
                        console.log(`Setting up suite subscription (attempt ${retryCount + 1}/${maxRetries + 1})`);
                        unsubscribeSuitesRef.current = firestoreService.subscribeToUserTestSuites(
                            (fetchedSuites) => {
                                const safeSuites = Array.isArray(fetchedSuites) ? fetchedSuites : [];
                                console.log('Suites fetched successfully, count:', safeSuites.length,
                                    'suites:', safeSuites.map(s => ({ id: s.id, name: s.name })));
                                resolve(safeSuites);
                            },
                            (error) => reject(error)
                        );
                    }),
                    'Suites loaded successfully',
                    (errorMessage) => {
                        if (suites.state.testSuites.length === 0 && errorMessage !== getFirebaseErrorMessage({ code: 'permission-denied' })) {
                            toast.error(errorMessage, { duration: 5000 });
                        } else {
                            console.debug('Ignoring error as suites are already loaded or permission denied:', errorMessage);
                        }
                    }
                ).then((result) => {
                    if (result.success) {
                        suites.actions.loadSuitesSuccess(result.data);
                        setSuitesLoaded(true);
                        setSuiteSubscriptionActive(true);
                        retryCount = 0;
                    } else if (suites.state.testSuites.length === 0 && retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying suite subscription in ${retryDelay * retryCount}ms (attempt ${retryCount}/${maxRetries})`);
                        retryTimeoutRef.current = setTimeout(setupSuiteSubscription, retryDelay * retryCount);
                    } else {
                        suites.actions.loadSuitesSuccess([]);
                        setSuitesLoaded(true);
                        setSuiteSubscriptionActive(false);
                    }
                }).catch((error) => {
                    console.error('Unexpected error setting up suite subscription:', error);
                    suites.actions.loadSuitesSuccess([]);
                    setSuitesLoaded(true);
                    setSuiteSubscriptionActive(false);
                    toast.error(getFirebaseErrorMessage(error), { duration: 5000 });
                });
            };

            if (subscription.state.isTrialActive || subscription.state.isSubscriptionActive) {
                setupSuiteSubscription();
            } else {
                console.log('Subscription not active, skipping suite subscription');
                suites.actions.loadSuitesSuccess([]);
                setSuitesLoaded(true);
                setSuiteSubscriptionActive(false);
                ui.actions.showNotification({
                    id: 'subscription-inactive',
                    type: 'warning',
                    message: 'Your subscription is not active. Upgrade to access test suites!',
                    duration: 10000,
                });
            }

            return () => {
                console.log('Cleaning up auth effect');
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                    retryTimeoutRef.current = null;
                }
                if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                    unsubscribeSuitesRef.current();
                    unsubscribeSuitesRef.current = null;
                }
                setSuiteSubscriptionActive(false);
            };
        } else {
            console.log('User not authenticated, clearing state');
            if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                unsubscribeSuitesRef.current();
                unsubscribeSuitesRef.current = null;
            }
            clearState();
            subscription.actions.loadSubscriptionInfo(
                { accountType: 'individual', currentUser: null },
                ui.actions
            );
            suites.actions.loadSuitesSuccess([]);
            setSuitesLoaded(true);
            setSuiteSubscriptionActive(false);
        }
    }, [auth.state.isInitialized, auth.state.isAuthenticated, auth.state.currentUser?.uid, subscription.state.loading, subscription.state.isTrialActive, subscription.state.isSubscriptionActive]);

    useEffect(() => {
        if (!auth.state.isAuthenticated || !suites.state.activeSuite?.id || !suitesLoaded || !suiteSubscriptionActive) {
            console.log('Clearing assets - conditions not met:', {
                authenticated: auth.state.isAuthenticated,
                activeSuite: !!suites.state.activeSuite?.id,
                suitesLoaded,
                suiteSubscriptionActive
            });

            Object.values(assetUnsubscribersRef.current).forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};

            testCases.actions.loadTestCasesSuccess([]);
            bugs.actions.loadBugsSuccess([]);
            recordings.actions.loadRecordingsSuccess([]);
            sprints.actions.loadSprintsSuccess([]);
            return;
        }

        const suiteId = suites.state.activeSuite.id;
        console.log('Setting up asset subscriptions for suite:', suiteId);

        Object.values(assetUnsubscribersRef.current).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        assetUnsubscribersRef.current = {};

        const subscribeAsset = (type, action, loadSuccess) => {
            return handleFirebaseOperation(
                () => new Promise((resolve, reject) => {
                    assetUnsubscribersRef.current[type] = firestoreService[`subscribeTo${type}`](
                        suiteId,
                        (assets) => {
                            const safeAssets = Array.isArray(assets) ? assets : [];
                            console.log(`${type} loaded:`, safeAssets.length);
                            resolve(safeAssets);
                        },
                        (error) => reject(error)
                    );
                }),
                `${type} loaded successfully`,
                (errorMessage) => {
                    if (errorMessage !== getFirebaseErrorMessage({ code: 'permission-denied' })) {
                        toast.error(`Failed to load ${type.toLowerCase()}: ${errorMessage}`, { duration: 5000 });
                    }
                }
            ).then((result) => {
                if (result.success) {
                    loadSuccess(result.data);
                } else {
                    loadSuccess([]);
                }
            }).catch((error) => {
                console.error(`Error setting up ${type.toLowerCase()} subscription:`, error);
                loadSuccess([]);
            });
        };

        subscribeAsset('TestCases', 'testCases', testCases.actions.loadTestCasesSuccess);
        subscribeAsset('Bugs', 'bugs', bugs.actions.loadBugsSuccess);
        subscribeAsset('Recordings', 'recordings', recordings.actions.loadRecordingsSuccess);
        subscribeAsset('Sprints', 'sprints', sprints.actions.loadSprintsSuccess);

        return () => {
            console.log('Cleaning up asset subscriptions');
            Object.values(assetUnsubscribersRef.current).forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};
        };
    }, [auth.state.isAuthenticated, suites.state.activeSuite?.id, suitesLoaded, suiteSubscriptionActive]);

    useEffect(() => {
        if (!auth.state.isAuthenticated || !subscription.state.isTrialActive) return;

        console.log('Setting up trial expiry check');
        const checkTrialExpiry = () => {
            const { trialEndsAt } = subscription.state;
            if (trialEndsAt && new Date() > new Date(trialEndsAt)) {
                console.log('Trial expired');
                subscription.actions.handleTrialExpiry(suites.state, suites.actions, ui.actions);
            } else if (trialEndsAt) {
                const daysRemaining = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 7) {
                    console.log(`Trial expiring in ${daysRemaining} days`);
                    ui.actions.showNotification({
                        id: `trial-warning-${daysRemaining}`,
                        type: 'warning',
                        message: `Your trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade to continue using all features!`,
                        duration: 10000,
                    });
                }
            }
        };

        checkTrialExpiry();
        const interval = setInterval(checkTrialExpiry, 60000);
        return () => clearInterval(interval);
    }, [auth.state.isAuthenticated, subscription.state.isTrialActive, subscription.state.trialEndsAt]);

    useEffect(() => {
        return () => {
            console.log('App provider unmounting, cleaning up');
            clearState();
        };
    }, []);

    const value = {
        state: {
            auth: auth.state,
            suites: suites.state,
            testCases: testCases.state,
            bugs: bugs.state,
            recordings: recordings.state,
            sprints: sprints.state,
            subscription: subscription.state,
            team: team.state,
            automation: automation.state,
            ui: ui.state,
        },
        actions: {
            auth: {
                ...auth.actions,
                logout,
                initializeAuth,
                refreshUserProfile,
            },
            suites: suites.actions,
            testCases: testCases.actions,
            bugs: bugs.actions,
            recordings: recordings.actions,
            sprints: sprints.actions,
            subscription: subscription.actions,
            team: team.actions,
            automation: automation.actions,
            ui: ui.actions,
            linkTestCasesToBug,
            unlinkTestCaseFromBug,
            linkBugsToTestCase,
            unlinkBugFromTestCase,
            addTestCasesToSprint,
            addBugsToSprint,
            clearState,
        },
        isAuthenticated: auth.state.isAuthenticated,
        currentUser: auth.state.currentUser,
        activeSuite: suites.state.activeSuite,
        hasCreatedSuite: suites.state.hasCreatedSuite,
        suiteCreationBlocked: suites.state.suiteCreationBlocked,
        isTrialActive: subscription.state.isTrialActive,
        planLimits: subscription.state.planLimits,
        isLoading:
            auth.state.loading ||
            suites.state.loading ||
            testCases.state.loading ||
            bugs.state.loading ||
            recordings.state.loading ||
            sprints.state.loading ||
            subscription.state.loading ||
            team.state.loading ||
            automation.state.loading ||
            ui.state.loading ||
            !suitesLoaded,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// Enhanced useAuth hook that uses the AppProvider context
export const useAuth = () => {
    const { state, actions } = useApp();
    return {
        // State
        currentUser: state.auth.currentUser,
        isAuthenticated: state.auth.isAuthenticated,
        accountType: state.auth.accountType,
        loading: state.auth.loading,
        error: state.auth.error,
        isInitialized: state.auth.isInitialized,
        profileLoaded: state.auth.profileLoaded, // Add profileLoaded to the useAuth hook
        // Actions
        logout: actions.auth.logout,
        initializeAuth: actions.auth.initializeAuth,
        refreshUserProfile: actions.auth.refreshUserProfile,
        // Also expose the original auth slice actions if needed
        signOut: actions.auth.signOut,
        clearAuthState: actions.auth.clearAuthState,
        restoreAuth: actions.auth.restoreAuth,
    };
};

export default AppProvider;