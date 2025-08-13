/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useSlices, getAppState } from './hooks/useSlices';
import { useAI } from './hooks/useAI';
import { useTestCases } from './hooks/useTestCases';
import { useTheme } from './hooks/useTheme';
import { useAssetLinking } from './hooks/useAssetLinking';
import { useRecording } from './hooks/useRecording';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import FirestoreService from '../services';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const slices = useSlices();
    const [suitesLoaded, setSuitesLoaded] = useState(false);
    const [suiteSubscriptionActive, setSuiteSubscriptionActive] = useState(false);
    const [aiInitialized, setAiInitialized] = useState(false);

    const unsubscribeSuitesRef = useRef(null);
    const assetUnsubscribersRef = useRef({});
    const retryTimeoutRef = useRef(null);

    const { initializeAI, generateTestCasesWithAI, getAIAnalytics, updateAISettings } = useAI(
        slices.auth,
        slices.ai,
        slices.ui,
        aiInitialized,
        setAiInitialized
    );

    const { wrappedCreateTestCase, wrappedUpdateTestCase, wrappedDeleteTestCase } = useTestCases(slices);

    const { setTheme, toggleTheme } = useTheme(slices.theme, slices.ui);

    const {
        linkTestCasesToBug,
        unlinkTestCaseFromBug,
        linkBugsToTestCase,
        unlinkBugFromTestCase,
        addTestCasesToSprint,
        addBugsToSprint,
    } = useAssetLinking(slices);

    const { saveRecording, linkRecordingToBug } = useRecording(slices);

    const logout = async () => {
        slices.ai.actions.clearAIState();
        setAiInitialized(false);
        return slices.auth.actions.signOut();
    };

    const initializeAuth = () => slices.auth.actions.initializeAuth();

    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile from AppProvider...');
            if (!slices.auth.state.currentUser?.uid) {
                throw new Error('No authenticated user');
            }

            // Use FirestoreService to get user profile
            const profileResult = await FirestoreService.getUserProfile(slices.auth.state.currentUser.uid);
            console.log('📋 Profile fetched:', profileResult);

            if (profileResult.success) {
                const profileData = profileResult.data;
                const enhancedUser = {
                    ...slices.auth.state.currentUser,
                    displayName: profileData.displayName || profileData.name || '',
                    firstName: profileData.first_name || '',
                    lastName: profileData.last_name || '',
                    name: profileData.name || profileData.displayName || '',
                    organizationName: profileData.organizationName || null,
                    organizationId: profileData.organizationId || null,
                    orgId: profileData.organizationId || null,
                    role: profileData.role || 'member',
                    accountType: profileData.accountType || profileData.account_type || 'individual',
                };

                slices.auth.actions.restoreAuth({
                    user: enhancedUser,
                    profile: profileData,
                    accountType: profileData.accountType || profileData.account_type || 'individual',
                });

                return profileResult;
            } else if (profileResult.error.message === 'Document not found') {
                console.log('Creating new user profile...');
                const userData = {
                    uid: slices.auth.state.currentUser.uid,
                    email: slices.auth.state.currentUser.email || '',
                    displayName: slices.auth.state.currentUser.displayName || '',
                    accountType: 'individual', // Default to individual, not organization
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: slices.auth.state.currentUser.uid,
                    updated_by: slices.auth.state.currentUser.uid,
                };

                const createResult = await FirestoreService.createOrUpdateUserProfile(userData);

                if (createResult.success) {
                    const enhancedUser = {
                        ...slices.auth.state.currentUser,
                        displayName: createResult.data.displayName || '',
                        firstName: createResult.data.first_name || '',
                        lastName: createResult.data.last_name || '',
                        name: createResult.data.name || createResult.data.displayName || '',
                        organizationName: createResult.data.organizationName || null,
                        organizationId: createResult.data.organizationId || null,
                        orgId: createResult.data.organizationId || null,
                        role: createResult.data.role || 'member',
                        accountType: createResult.data.accountType || createResult.data.account_type || 'individual',
                    };

                    slices.auth.actions.restoreAuth({
                        user: enhancedUser,
                        profile: createResult.data,
                        accountType: createResult.data.accountType || createResult.data.account_type || 'individual',
                    });

                    return createResult;
                }
                throw new Error('Failed to create user profile');
            }
            throw new Error(profileResult.error.message);
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            slices.ui.actions.showNotification?.({
                id: 'refresh-profile-error',
                type: 'error',
                message: getFirebaseErrorMessage(error),
                duration: 5000,
            });
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

            Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};

            slices.auth.actions.clearAuthState();
            slices.suites.actions.loadSuitesSuccess([]);
            slices.testCases.actions.loadTestCasesSuccess([]);
            slices.bugs.actions.loadBugsSuccess([]);
            slices.recordings.actions.loadRecordingsSuccess([]);
            slices.sprints.actions.loadSprintsSuccess([]);
            slices.subscription.actions.clearSubscription?.();
            slices.team.actions.clearTeam?.();
            slices.automation.actions.clearAutomation?.();
            slices.ui.actions.clearUI?.();
            slices.ai.actions.clearAIState();

            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            setAiInitialized(false);
        } catch (error) {
            console.error('Error clearing state:', error);
            slices.ui.actions.showNotification?.({
                id: 'clear-state-error',
                type: 'error',
                message: getFirebaseErrorMessage(error),
                duration: 5000,
            });
        }
    };

    useEffect(() => {
        console.log('Initializing auth...');
        initializeAuth();
    }, []);

    useEffect(() => {
        console.log('Auth state changed:', {
            isAuthenticated: slices.auth.state.isAuthenticated,
            currentUser: slices.auth.state.currentUser?.uid,
            accountType: slices.auth.state.accountType,
            organizationId: slices.auth.state.currentUser?.organizationId,
            authInitialized: slices.auth.state.isInitialized,
            authLoading: slices.auth.state.loading,
            profileLoaded: slices.auth.state.profileLoaded,
            subscriptionLoading: slices.subscription.state.loading,
            suiteSubscriptionActive,
            aiInitialized,
        });

        if (!slices.auth.state.isInitialized || slices.auth.state.loading || slices.subscription.state.loading) {
            console.log('Waiting for auth and subscription initialization...');
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            return;
        }

        if (slices.auth.state.isAuthenticated && slices.auth.state.currentUser) {
            console.log('User authenticated, refreshing profile and initializing app...');

            refreshUserProfile().then(() => {
                console.log('✅ Profile refreshed, proceeding with app initialization');
                slices.suites.actions.loadSuitesStart();
                setSuitesLoaded(false);
                initializeAI();

                if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                    unsubscribeSuitesRef.current();
                    unsubscribeSuitesRef.current = null;
                }

                let retryCount = 0;
                const maxRetries = 3;
                const retryDelay = 2000;

                const setupSuiteSubscription = () => {
                    handleFirebaseOperation(
                        () =>
                            new Promise((resolve, reject) => {
                                console.log(`Setting up suite subscription (attempt ${retryCount + 1}/${maxRetries + 1})`);
                                const currentUser = slices.auth.state.currentUser;
                                const accountType = slices.auth.state.accountType || currentUser?.accountType;
                                console.log('Subscription setup details:', {
                                    accountType,
                                    organizationId: currentUser?.organizationId,
                                    uid: currentUser?.uid,
                                });

                                // Use FirestoreService.subscribeToUserTestSuites
                                const subscriptionMethod = FirestoreService.subscribeToUserTestSuites(
                                    (fetchedSuites) => {
                                        const safeSuites = Array.isArray(fetchedSuites) ? fetchedSuites : [];
                                        console.log('Suites fetched successfully:', {
                                            count: safeSuites.length,
                                            accountType,
                                            suites: safeSuites.map((s) => ({
                                                id: s.id,
                                                name: s.name,
                                                ownerType: s.ownerType,
                                                ownerId: s.ownerId,
                                                organizationId: s.organizationId,
                                            })),
                                        });
                                        resolve(safeSuites);
                                    },
                                    (error) => reject(error)
                                );
                                unsubscribeSuitesRef.current = subscriptionMethod;
                            }),
                        'Suites loaded successfully',
                        (errorMessage) => {
                            if (
                                slices.suites.state.testSuites.length === 0 &&
                                errorMessage !== getFirebaseErrorMessage({ code: 'permission-denied' })
                            ) {
                                slices.ui.actions.showNotification?.({
                                    id: 'suite-subscription-error',
                                    type: 'error',
                                    message: errorMessage,
                                    duration: 5000,
                                });
                            } else {
                                console.debug('Ignoring error as suites are already loaded or permission denied:', errorMessage);
                            }
                        }
                    ).then((result) => {
                        if (result.success) {
                            slices.suites.actions.loadSuitesSuccess(result.data);
                            setSuitesLoaded(true);
                            setSuiteSubscriptionActive(true);
                            retryCount = 0;

                            if (result.data.length > 0 && !slices.suites.state.activeSuite) {
                                console.log('Auto-activating first suite:', result.data[0].name);
                                slices.suites.actions.activateSuite(result.data[0]);
                            }
                        } else if (slices.suites.state.testSuites.length === 0 && retryCount < maxRetries) {
                            retryCount++;
                            console.log(`Retrying suite subscription in ${retryDelay * retryCount}ms (attempt ${retryCount}/${maxRetries})`);
                            retryTimeoutRef.current = setTimeout(setupSuiteSubscription, retryDelay * retryCount);
                        } else {
                            slices.suites.actions.loadSuitesSuccess([]);
                            setSuitesLoaded(true);
                            setSuiteSubscriptionActive(false);
                        }
                    }).catch((error) => {
                        console.error('Unexpected error setting up suite subscription:', error);
                        slices.suites.actions.loadSuitesSuccess([]);
                        setSuitesLoaded(true);
                        setSuiteSubscriptionActive(false);
                        slices.ui.actions.showNotification?.({
                            id: 'suite-subscription-unexpected-error',
                            type: 'error',
                            message: getFirebaseErrorMessage(error),
                            duration: 5000,
                        });
                    });
                };

                if (slices.subscription.state.isTrialActive || slices.subscription.state.isSubscriptionActive) {
                    setupSuiteSubscription();
                } else {
                    console.log('Subscription not active, skipping suite subscription');
                    slices.suites.actions.loadSuitesSuccess([]);
                    setSuitesLoaded(true);
                    setSuiteSubscriptionActive(false);
                    slices.ui.actions.showNotification?.({
                        id: 'subscription-inactive',
                        type: 'warning',
                        message: 'Your subscription is not active. Upgrade to access test suites!',
                        duration: 10000,
                    });
                }
            }).catch((error) => {
                console.error('Failed to refresh user profile:', error);
                slices.suites.actions.loadSuitesSuccess([]);
                setSuitesLoaded(true);
                setSuiteSubscriptionActive(false);
            });

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
            clearState();
            slices.subscription.actions.loadSubscriptionInfo({ accountType: 'individual', currentUser: null }, slices.ui.actions);
            slices.suites.actions.loadSuitesSuccess([]);
            setSuitesLoaded(true);
            setSuiteSubscriptionActive(false);
        }
    }, [
        slices.auth.state.isInitialized,
        slices.auth.state.isAuthenticated,
        slices.auth.state.currentUser?.uid,
        slices.auth.state.accountType,
        slices.auth.state.currentUser?.organizationId,
        slices.subscription.state.loading,
        slices.subscription.state.isTrialActive,
        slices.subscription.state.isSubscriptionActive,
    ]);

    useEffect(() => {
        if (
            !slices.auth.state.isAuthenticated ||
            !slices.suites.state.activeSuite?.id ||
            !suitesLoaded ||
            !suiteSubscriptionActive
        ) {
            console.log('Clearing assets - conditions not met:', {
                authenticated: slices.auth.state.isAuthenticated,
                activeSuite: !!slices.suites.state.activeSuite?.id,
                suitesLoaded,
                suiteSubscriptionActive,
            });

            Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};

            slices.testCases.actions.loadTestCasesSuccess([]);
            slices.bugs.actions.loadBugsSuccess([]);
            slices.recordings.actions.loadRecordingsSuccess([]);
            slices.sprints.actions.loadSprintsSuccess([]);
            return;
        }

        const suiteId = slices.suites.state.activeSuite.id;
        console.log('Setting up asset subscriptions for suite:', suiteId);

        Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        assetUnsubscribersRef.current = {};

        const subscribeAsset = (type, loadSuccess) => {
            return handleFirebaseOperation(
                () =>
                    new Promise((resolve, reject) => {
                        assetUnsubscribersRef.current[type] = FirestoreService[`subscribeTo${type}`](
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
                        slices.ui.actions.showNotification?.({
                            id: `${type.toLowerCase()}-subscription-error`,
                            type: 'error',
                            message: `Failed to load ${type.toLowerCase()}: ${errorMessage}`,
                            duration: 5000,
                        });
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

        subscribeAsset('TestCases', slices.testCases.actions.loadTestCasesSuccess);
        subscribeAsset('Bugs', slices.bugs.actions.loadBugsSuccess);
        subscribeAsset('Recordings', slices.recordings.actions.loadRecordingsSuccess);
        subscribeAsset('Sprints', slices.sprints.actions.loadSprintsSuccess);

        return () => {
            console.log('Cleaning up asset subscriptions');
            Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};
        };
    }, [slices.auth.state.isAuthenticated, slices.suites.state.activeSuite?.id, suitesLoaded, suiteSubscriptionActive]);

    useEffect(() => {
        if (!slices.auth.state.isAuthenticated || !slices.subscription.state.isTrialActive) return;

        console.log('Setting up trial expiry check');
        const checkTrialExpiry = () => {
            const { trialEndsAt } = slices.subscription.state;
            if (trialEndsAt && new Date() > new Date(trialEndsAt)) {
                console.log('Trial expired');
                slices.subscription.actions.handleTrialExpiry(slices.suites.state, slices.suites.actions, slices.ui.actions);
            } else if (trialEndsAt) {
                const daysRemaining = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 7) {
                    console.log(`Trial expiring in ${daysRemaining} days`);
                    slices.ui.actions.showNotification?.({
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
    }, [slices.auth.state.isAuthenticated, slices.subscription.state.isTrialActive, slices.subscription.state.trialEndsAt]);

    useEffect(() => {
        return () => {
            console.log('App provider unmounting, cleaning up');
            clearState();
        };
    }, []);

    const value = useMemo(
        () => ({
            state: getAppState(slices),
            actions: {
                auth: { ...slices.auth.actions, logout, initializeAuth, refreshUserProfile, reports: slices.reports.actions },
                suites: slices.suites.actions,
                testCases: { 
                    ...slices.testCases.actions, 
                    createTestCase: wrappedCreateTestCase, 
                    updateTestCase: wrappedUpdateTestCase, 
                    deleteTestCase: wrappedDeleteTestCase 
                },
                bugs: slices.bugs.actions,
                recordings: { ...slices.recordings.actions, saveRecording, linkRecordingToBug },
                sprints: slices.sprints.actions,
                subscription: slices.subscription.actions,
                team: slices.team.actions,
                automation: slices.automation.actions,
                ui: slices.ui.actions,
                ai: { ...slices.ai.actions, generateTestCasesWithAI, getAIAnalytics, updateAISettings },
                theme: { ...slices.theme.actions, setTheme, toggleTheme },
                linkTestCasesToBug,
                unlinkTestCaseFromBug,
                linkBugsToTestCase,
                unlinkBugFromTestCase,
                addTestCasesToSprint,
                addBugsToSprint,
                clearState,
            },
            isAuthenticated: slices.auth.state.isAuthenticated,
            currentUser: slices.auth.state.currentUser,
            activeSuite: slices.suites.state.activeSuite,
            hasCreatedSuite: slices.suites.state.hasCreatedSuite,
            suiteCreationBlocked: slices.suites.state.suiteCreationBlocked,
            isTrialActive: slices.subscription.state.isTrialActive,
            planLimits: slices.subscription.state.planLimits,
            aiAvailable: slices.ai.state.isInitialized && !slices.ai.state.error,
            aiGenerating: slices.ai.state.isGenerating,
            isDarkMode: slices.theme.state.isDark,
            isLightMode: slices.theme.state.isLight,
            isSystemTheme: slices.theme.state.isSystem,
            currentTheme: slices.theme.state.actualTheme,
            selectedTheme: slices.theme.state.selectedTheme,
            systemTheme: slices.theme.state.systemTheme,
            themeLoading: slices.theme.state.isLoading,
            isLoading:
                slices.auth.state.loading ||
                slices.suites.state.loading ||
                slices.testCases.state.loading ||
                slices.bugs.state.loading ||
                slices.recordings.state.loading ||
                slices.sprints.state.loading ||
                slices.subscription.state.loading ||
                slices.team.state.loading ||
                slices.automation.state.loading ||
                slices.ui.state.loading ||
                slices.ai.state.loading ||
                slices.theme.state.isLoading ||
                !suitesLoaded,
        }),
        [
            slices,
            wrappedCreateTestCase,
            wrappedUpdateTestCase,
            wrappedDeleteTestCase,
            saveRecording,
            linkRecordingToBug,
            generateTestCasesWithAI,
            getAIAnalytics,
            updateAISettings,
            setTheme,
            toggleTheme,
            linkTestCasesToBug,
            unlinkTestCaseFromBug,
            linkBugsToTestCase,
            unlinkBugFromTestCase,
            addTestCasesToSprint,
            addBugsToSprint,
            clearState,
            logout,
            initializeAuth,
            refreshUserProfile,
            suitesLoaded,
            aiInitialized,
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppProvider;