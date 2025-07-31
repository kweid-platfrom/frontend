/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth as useAuthSlice } from './slices/authSlice';
import { useSuites } from './slices/suiteSlice';
import { useTestCases } from './slices/testCaseSlice';
import { useBugReducer } from './slices/bugReducer';
import { useRecordings } from './slices/recordingSlice';
import { useSprints } from './slices/sprintSlice';
import { useSubscription } from './slices/subscriptionSlice';
import { useTeam } from './slices/teamSlice';
import { useAutomation } from './slices/automationSlice';
import { useUI } from './slices/uiSlice';
import { useAI } from './slices/aiSlice';
import { toast } from 'sonner';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import FirestoreService from '../services';
import { useReports } from './slices/reportSlice';


const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const auth = useAuthSlice();
    const suites = useSuites();
    const testCases = useTestCases();
    const bugs = useBugReducer();
    const recordings = useRecordings();
    const sprints = useSprints();
    const subscription = useSubscription();
    const team = useTeam();
    const automation = useAutomation();
    const ui = useUI();
    const ai = useAI();
    const reports = useReports();

    const [suitesLoaded, setSuitesLoaded] = useState(false);
    const [suiteSubscriptionActive, setSuiteSubscriptionActive] = useState(false);
    const [aiInitialized, setAiInitialized] = useState(false);

    const unsubscribeSuitesRef = useRef(null);
    const assetUnsubscribersRef = useRef({});
    const retryTimeoutRef = useRef(null);

    // Helper function to get current app state
    const getCurrentAppState = useCallback(() => ({
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
        ai: ai.state,
        reports: reports.state,
    }), [
        auth.state,
        suites.state,
        testCases.state,
        bugs.state,
        recordings.state,
        sprints.state,
        subscription.state,
        team.state,
        automation.state,
        ui.state,
        ai.state,
        reports.state,
    ]);

    // Helper function to get current app actions
    const getCurrentAppActions = useCallback(() => ({
        auth: auth.actions,
        suites: suites.actions,
        testCases: testCases.actions,
        bugs: bugs.actions,
        recordings: recordings.actions,
        sprints: sprints.actions,
        subscription: subscription.actions,
        team: team.actions,
        automation: automation.actions,
        ui: ui.actions,
        ai: ai.actions,
        reports: reports.actions,
    }), [
        auth.actions,
        suites.actions,
        testCases.actions,
        bugs.actions,
        recordings.actions,
        sprints.actions,
        subscription.actions,
        team.actions,
        automation.actions,
        ui.actions,
        ai.actions,
        reports.actions
    ]);

    // Create properly wrapped test case functions that directly call the slice functions
    const wrappedCreateTestCase = useCallback(async (testCaseData) => {
        const appState = getCurrentAppState();
        const appActions = getCurrentAppActions();

        // Call the function returned by the slice (the curried function)
        const createFunction = testCases.actions.createTestCase(appState, appActions);
        return await createFunction(testCaseData);
    }, [testCases.actions.createTestCase, getCurrentAppState, getCurrentAppActions]);

    const wrappedUpdateTestCase = useCallback(async (testCaseId, updateData) => {
        const appState = getCurrentAppState();

        // Call the function returned by the slice (the curried function)
        const updateFunction = testCases.actions.updateTestCase(appState);
        return await updateFunction(testCaseId, updateData);
    }, [testCases.actions.updateTestCase, getCurrentAppState]);

    const wrappedDeleteTestCase = useCallback(async (testCaseId) => {
        const appState = getCurrentAppState();

        // Call the function returned by the slice (the curried function)
        const deleteFunction = testCases.actions.deleteTestCase(appState);
        return await deleteFunction(testCaseId);
    }, [testCases.actions.deleteTestCase, getCurrentAppState]);

    // Initialize AI service when authentication is ready
    const initializeAI = useCallback(async () => {
        // Only initialize once and when user is authenticated
        if (!auth.state.isAuthenticated || aiInitialized || ai.state.isInitialized) {
            return;
        }

        console.log('Initializing AI service...');

        try {
            // Get the current app state for the AI action
            const currentState = getCurrentAppState();

            // Call the AI initialization action
            const initFunction = ai.actions.initializeAI();
            const result = await initFunction();

            if (result.success) {
                setAiInitialized(true);
                console.log('✅ AI service initialized successfully');

                // Update the AI state with the initialized service
                const updateFunction = ai.actions.updateSettings(currentState.ai);
                updateFunction({
                    isInitialized: true,
                    serviceInstance: result.data.aiService,
                    error: null
                });

                ui.actions.showNotification?.({
                    id: 'ai-initialized',
                    type: 'success',
                    message: 'AI assistant ready',
                    description: `Using ${result.data.provider} provider`,
                    duration: 3000,
                });
            } else {
                throw new Error(result.error || result.userMessage || 'AI initialization failed');
            }
        } catch (error) {
            console.error('AI service initialization error:', error);
            setAiInitialized(false);

            // Update AI state with error
            const currentState = getCurrentAppState();
            const updateFunction = ai.actions.updateSettings(currentState.ai);
            updateFunction({
                isInitialized: false,
                error: error.message,
                serviceInstance: null
            });

            // Show appropriate error message
            let message = 'AI assistant unavailable';
            let description = 'Please check your AI configuration';

            if (error.message.includes('API_KEY')) {
                description = 'Please configure your AI provider API key';
            } else if (error.message.includes('provider')) {
                description = 'Please set NEXT_PUBLIC_AI_PROVIDER environment variable';
            } else if (error.message.includes('Connection')) {
                description = 'Please check your internet connection and API key';
            }

            ui.actions.showNotification?.({
                id: 'ai-init-error',
                type: 'error',
                message,
                description,
                duration: 8000,
            });
        }
    }, [
        auth.state.isAuthenticated,
        aiInitialized,
        ai.state.isInitialized,
        ai.actions,
        ui.actions,
        getCurrentAppState
    ]);


    // AI-powered test case generation wrapper
    const generateTestCasesWithAI = useCallback(async (documentContent, documentTitle, templateConfig = {}) => {
        const currentState = getCurrentAppState();

        if (!currentState.ai.isInitialized || !currentState.ai.serviceInstance) {
            const error = 'AI service not available. Please check your configuration.';
            toast.error(error, {
                description: 'Try refreshing the page or check your environment variables'
            });
            return { success: false, error };
        }

        try {
            console.log('🚀 Starting AI test case generation...', { documentTitle });

            // Call the AI generation action
            const generateFunction = ai.actions.generateTestCases(currentState.ai);
            const result = await generateFunction(documentContent, documentTitle, templateConfig);

            if (result.success && result.data?.testCases?.length > 0) {
                console.log(`✅ Generated ${result.data.testCases.length} test cases`);

                // Auto-save to active suite if available
                if (suites.state.activeSuite?.id) {
                    console.log('💾 Auto-saving generated test cases to active suite...');

                    const testCasesToSave = result.data.testCases.map(testCase => ({
                        ...testCase,
                        suiteId: suites.state.activeSuite.id,
                        source: 'ai_generated',
                        generationId: result.generationId,
                        aiProvider: result.provider,
                        aiModel: result.model,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }));

                    // Batch create test cases with progress tracking
                    const savePromises = testCasesToSave.map(async (testCaseData, index) => {
                        try {
                            const saveResult = await wrappedCreateTestCase(testCaseData);
                            console.log(`Saved test case ${index + 1}/${testCasesToSave.length}`);
                            return saveResult;
                        } catch (error) {
                            console.error(`Error saving test case ${index + 1}:`, error);
                            return { success: false, error: error.message };
                        }
                    });

                    const saveResults = await Promise.allSettled(savePromises);
                    const successfulSaves = saveResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
                    const failedSaves = saveResults.length - successfulSaves;

                    if (successfulSaves > 0) {
                        toast.success(`Saved ${successfulSaves} AI-generated test cases`, {
                            description: failedSaves > 0 ? `${failedSaves} failed to save` : 'All test cases saved successfully'
                        });
                    }

                    if (failedSaves > 0) {
                        toast.warning(`${failedSaves} test cases failed to save`, {
                            description: 'You can still copy them manually from the generation results'
                        });
                    }
                }

                return {
                    ...result,
                    autoSaved: suites.state.activeSuite?.id ? true : false,
                    savedCount: suites.state.activeSuite?.id ? result.data.testCases.length : 0
                };
            } else if (result.success && (!result.data?.testCases || result.data.testCases.length === 0)) {
                toast.warning('No test cases generated', {
                    description: 'Try providing more detailed requirements or adjusting the prompt'
                });
                return result;
            }

            return result;
        } catch (error) {
            console.error('❌ AI test case generation failed:', error);
            toast.error('AI generation failed', {
                description: error.message || 'Unknown error occurred'
            });
            return { success: false, error: error.message };
        }
    }, [
        ai.state.isInitialized,
        ai.actions,
        suites.state.activeSuite?.id,
        wrappedCreateTestCase,
        getCurrentAppState
    ]);

    // Get AI generation statistics for dashboard/analytics
    const getAIAnalytics = useCallback(() => {
        if (!ai.state.isInitialized) {
            return {
                available: false,
                message: 'AI service not available'
            };
        }

        const stats = ai.actions.getGenerationStats();
        return {
            available: true,
            ...stats,
            provider: ai.state.settings.provider,
            isHealthy: ai.state.error === null && stats.isHealthy,
            lastGeneration: ai.state.lastGeneration,
            settings: ai.state.settings,
        };
    }, [ai.state.isInitialized, ai.state.settings, ai.state.error, ai.state.lastGeneration, ai.actions]);

    // Update AI settings
    const updateAISettings = useCallback(async (newSettings) => {
        try {
            ai.actions.updateSettings(newSettings);

            toast.success('AI settings updated', {
                description: `Provider: ${newSettings.provider || ai.state.settings.provider}`
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to update AI settings:', error);
            toast.error('Failed to update AI settings', { description: error.message });
            return { success: false, error: error.message };
        }
    }, [ai.actions, ai.state.settings.provider]);

    // Helper functions for linking operations (unchanged)
    const linkTestCasesToBug = async (bugId, testCaseIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchLinkTestCasesToBug(bugId, testCaseIds),
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
            () => FirestoreService.batchUnlinkTestCaseFromBug(bugId, testCaseId),
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
            () => FirestoreService.batchLinkBugsToTestCase(testCaseId, bugIds),
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
            () => FirestoreService.batchUnlinkBugFromTestCase(testCaseId, bugId),
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
            () => FirestoreService.addTestCasesToSprint(sprintId, testCaseIds),
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
            () => FirestoreService.addBugsToSprint(sprintId, bugIds),
            'Bugs added to sprint',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                sprints.actions.updateSprint(sprintId, result.data);
            }
            return result;
        });
    };

    const saveRecording = async (blob, networkErrors) => {
        try {
            const recordingId = `rec_${Date.now()}`;
            const recordingData = {
                id: recordingId,
                url: URL.createObjectURL(blob), // Temporary URL for client-side preview
                size: blob.size,
                created_at: new Date().toISOString(),
                networkErrors,
                suiteId: suites.state.activeSuite?.id,
            };

            // Save to Firestore
            const result = await recordings.actions.createRecording(suites.state, {
                recordings: recordings.actions,
                ui: ui.actions,
                bugs: bugs.actions,
            })(recordingData);

            if (result.success && networkErrors.length > 0) {
                // Create bug for network errors
                const bugData = {
                    title: `Network Error: ${networkErrors[0].status || 'Unknown'}`,
                    description: `Auto-detected network error during recording:\n${JSON.stringify(networkErrors, null, 2)}`,
                    status: 'open',
                    severity: 'high',
                    created_at: new Date().toISOString(),
                    recordingIds: [recordingId],
                };
                const bugResult = await bugs.actions.createBug(bugData);
                if (bugResult.success) {
                    // Link recording to bug
                    await FirestoreService.recordings.linkRecordingToBug(recordingId, bugResult.data.id);
                    recordings.actions.updateRecording(recordingId, { bugId: bugResult.data.id });
                }
                ui.actions.showNotification('info', 'Bug created for network error', 3000);
            }

            return result;
        } catch (error) {
            ui.actions.showNotification('error', 'Failed to save recording', 5000);
            throw error;
        }
    };

    const linkRecordingToBug = async (recordingId, bugId) => {
        return handleFirebaseOperation(
            () => FirestoreService.recordings.linkRecordingToBug(recordingId, bugId),
            'Recording linked to bug',
            (errorMessage) => toast.error(errorMessage, { duration: 5000 })
        ).then((result) => {
            if (result.success) {
                recordings.actions.updateRecording(recordingId, { bugId });
            }
            return result;
        });
    };

    const logout = async () => {
        // Clear AI state on logout
        ai.actions.clearAIState();
        setAiInitialized(false);
        return auth.actions.signOut();
    };

    const initializeAuth = () => {
        return auth.actions.initializeAuth();
    };

    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile from AppProvider...');

            if (!auth.state.currentUser?.uid) {
                console.error('No authenticated user found');
                throw new Error('No authenticated user');
            }

            if (auth.actions.refreshUserProfile) {
                const result = await auth.actions.refreshUserProfile();
                if (result.success) {
                    console.log('✅ Profile refreshed via auth slice:', result);
                    return result;
                }
            }

            const profileResult = await FirestoreService.user.getUserProfile(auth.state.currentUser.uid);
            console.log('📋 Profile fetched (fallback):', profileResult);

            if (profileResult.success) {
                const profileData = profileResult.data;
                const enhancedUser = {
                    ...auth.state.currentUser,
                    displayName: auth.state.currentUser.displayName || profileData.display_name || profileData.name || '',
                    firstName: profileData.first_name || '',
                    lastName: profileData.last_name || '',
                    name: profileData.name || profileData.display_name || '',
                    organizationName: profileData.organizationName || null,
                    organizationId: profileData.organizationId || null,
                    orgId: profileData.organizationId || null,
                    role: profileData.role || 'member',
                    accountType: profileData.account_type || 'individual',
                };

                console.log('Enhanced user object:', {
                    uid: enhancedUser.uid,
                    accountType: enhancedUser.accountType,
                    organizationId: enhancedUser.organizationId,
                });

                auth.actions.restoreAuth({
                    user: enhancedUser,
                    profile: profileData,
                    accountType: profileData.account_type || 'individual',
                });

                return profileResult;
            } else if (profileResult.error.message === 'Document not found') {
                console.log('Creating new user profile...');
                const createResult = await FirestoreService.user.createOrUpdateUserProfile({
                    display_name: auth.state.currentUser.displayName || '',
                    email: auth.state.currentUser.email || '',
                });
                if (createResult.success) {
                    const enhancedUser = {
                        ...auth.state.currentUser,
                        displayName: createResult.data.display_name || '',
                        firstName: createResult.data.first_name || '',
                        lastName: createResult.data.last_name || '',
                        name: createResult.data.name || createResult.data.display_name || '',
                        organizationName: createResult.data.organizationName || null,
                        organizationId: createResult.data.organizationId || null,
                        orgId: createResult.data.organizationId || null,
                        role: createResult.data.role || 'member',
                        accountType: createResult.data.account_type || 'individual',
                    };

                    auth.actions.restoreAuth({
                        user: enhancedUser,
                        profile: createResult.data,
                        accountType: createResult.data.account_type || 'individual',
                    });

                    return createResult;
                }
                throw new Error('Failed to create user profile');
            }
            throw new Error(profileResult.error.message);
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            toast.error(getFirebaseErrorMessage(error), { duration: 5000 });
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
            suites.actions.loadSuitesSuccess([]);
            testCases.actions.loadTestCasesSuccess([]);
            bugs.actions.loadBugsSuccess([]);
            recordings.actions.loadRecordingsSuccess([]);
            sprints.actions.loadSprintsSuccess([]);
            subscription.actions.clearSubscription?.();
            team.actions.clearTeam?.();
            automation.actions.clearAutomation?.();
            ui.actions.clearUI?.();
            ai.actions.clearAIState();
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            setAiInitialized(false);
        } catch (error) {
            console.error('Error clearing state:', error);
            toast.error(getFirebaseErrorMessage(error), { duration: 5000 });
        }
    };

    useEffect(() => {
        console.log('Initializing auth...');
        initializeAuth();
    }, []);


    useEffect(() => {
        console.log('Auth state changed:', {
            isAuthenticated: auth.state.isAuthenticated,
            currentUser: auth.state.currentUser?.uid,
            accountType: auth.state.accountType,
            organizationId: auth.state.currentUser?.organizationId,
            authInitialized: auth.state.isInitialized,
            authLoading: auth.state.loading,
            profileLoaded: auth.state.profileLoaded,
            subscriptionLoading: subscription.state.loading,
            suiteSubscriptionActive,
            aiInitialized,
        });

        if (!auth.state.isInitialized || auth.state.loading || subscription.state.loading) {
            console.log('Waiting for auth and subscription initialization...');
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            return;
        }

        if (auth.state.isAuthenticated && auth.state.currentUser) {
            console.log('User authenticated, refreshing profile and setting up subscriptions...');
            refreshUserProfile().then(() => {
                suites.actions.loadSuitesStart();
                setSuitesLoaded(false);

                // Initialize AI service after auth is complete
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
                        () => new Promise((resolve, reject) => {
                            console.log(`Setting up suite subscription (attempt ${retryCount + 1}/${maxRetries + 1})`);

                            const currentUser = auth.state.currentUser;
                            const accountType = auth.state.accountType || currentUser?.accountType;

                            console.log('Subscription setup details:', {
                                accountType,
                                organizationId: currentUser?.organizationId,
                                uid: currentUser?.uid
                            });

                            console.log('Setting up suite subscription for user:', currentUser?.uid);
                            const subscriptionMethod = FirestoreService.testSuite.subscribeToUserTestSuites(
                                (fetchedSuites) => {
                                    const safeSuites = Array.isArray(fetchedSuites) ? fetchedSuites : [];
                                    console.log('Suites fetched successfully:', {
                                        count: safeSuites.length,
                                        accountType,
                                        suites: safeSuites.map(s => ({
                                            id: s.id,
                                            name: s.name,
                                            ownerType: s.ownerType,
                                            ownerId: s.ownerId,
                                            organizationId: s.organizationId
                                        }))
                                    });
                                    resolve(safeSuites);
                                },
                                (error) => {
                                    console.error('Suite subscription error:', error);
                                    reject(error);
                                }
                            );

                            unsubscribeSuitesRef.current = subscriptionMethod;
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

                            if (result.data.length > 0 && !suites.state.activeSuite) {
                                console.log('Auto-activating first suite:', result.data[0].name);
                                suites.actions.activateSuite(result.data[0]);
                            }
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
            }).catch((error) => {
                console.error('Failed to refresh user profile:', error);
                suites.actions.loadSuitesSuccess([]);
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
            subscription.actions.loadSubscriptionInfo(
                { accountType: 'individual', currentUser: null },
                ui.actions
            );
            suites.actions.loadSuitesSuccess([]);
            setSuitesLoaded(true);
            setSuiteSubscriptionActive(false);
        }
    }, [
        auth.state.isInitialized,
        auth.state.isAuthenticated,
        auth.state.currentUser?.uid,
        auth.state.accountType,
        auth.state.currentUser?.organizationId,
        subscription.state.loading,
        subscription.state.isTrialActive,
        subscription.state.isSubscriptionActive
    ]);

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
                    assetUnsubscribersRef.current[type] = FirestoreService.assets[`subscribeTo${type}`](
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

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
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
            ai: ai.state,
            reports: reports.state,
        },
        actions: {
            auth: {
                ...auth.actions,
                logout,
                initializeAuth,
                refreshUserProfile,
                reports: reports.actions
            },
            suites: suites.actions,
            testCases: {
                ...testCases.actions,
                createTestCase: wrappedCreateTestCase,
                updateTestCase: wrappedUpdateTestCase,
                deleteTestCase: wrappedDeleteTestCase,
            },
            bugs: bugs.actions,
            recordings: {
                ...recordings.actions,
                saveRecording,
                linkRecordingToBug,
            },
            sprints: sprints.actions,
            subscription: subscription.actions,
            team: team.actions,
            automation: automation.actions,
            ui: ui.actions,
            ai: {
                ...ai.actions,
                generateTestCasesWithAI,
                getAIAnalytics,
                updateAISettings,
            },
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
        aiAvailable: ai.state.isInitialized && !ai.state.error,
        aiGenerating: ai.state.isGenerating,
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
            ai.state.loading ||
            !suitesLoaded,
    }), [
        auth.state,
        suites.state,
        testCases.state,
        bugs.state,
        recordings.state,
        sprints.state,
        subscription.state,
        team.state,
        automation.state,
        ui.state,
        ai.state,
        auth.actions,
        suites.actions,
        testCases.actions,
        bugs.actions,
        recordings.actions,
        sprints.actions,
        subscription.actions,
        team.actions,
        automation.actions,
        ui.actions,
        ai.actions,
        wrappedCreateTestCase,
        wrappedUpdateTestCase,
        wrappedDeleteTestCase,
        saveRecording,
        linkRecordingToBug,
        generateTestCasesWithAI,
        getAIAnalytics,
        updateAISettings,
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
    ]);

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