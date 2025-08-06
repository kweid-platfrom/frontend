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
import { useTheme } from './slices/themeSlice';
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
    const theme = useTheme();

    const [suitesLoaded, setSuitesLoaded] = useState(false);
    const [suiteSubscriptionActive, setSuiteSubscriptionActive] = useState(false);
    const [aiInitialized, setAiInitialized] = useState(false);

    // Registration flow states
    const [registrationState, setRegistrationState] = useState('completed'); // 'pending', 'org-setup', 'completed'
    const [pendingRegistrationData, setPendingRegistrationData] = useState(null);

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
        theme: theme.state,
    }), [
        auth.state, suites.state, testCases.state, bugs.state, recordings.state,
        sprints.state, subscription.state, team.state, automation.state,
        ui.state, ai.state, reports.state, theme.state,
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
        theme: theme.actions,
    }), [
        auth.actions, suites.actions, testCases.actions, bugs.actions, recordings.actions,
        sprints.actions, subscription.actions, team.actions, automation.actions,
        ui.actions, ai.actions, reports.actions, theme.actions,
    ]);

    // Check if user needs to complete registration
    const checkRegistrationStatus = useCallback(async (user) => {
        if (!user?.uid) return 'completed';

        try {
            console.log('🔍 Checking registration status for user:', user.uid);

            // Check pending registration first
            const pendingResult = await FirestoreService.getDocument('pendingRegistrations', user.uid);
            if (pendingResult.success) {
                console.log('📝 Pending registration found:', pendingResult.data);
                if (!pendingResult.data.accountType) {
                    throw new Error('Invalid accountType in pendingRegistrations');
                }
                setPendingRegistrationData(pendingResult.data);
                return pendingResult.data.accountType === 'organization' ? 'org-setup' : 'pending';
            }

            // Check if user profile exists and is complete
            const profileResult = await FirestoreService.user.getUserProfile(user.uid);
            if (!profileResult.success) {
                if (profileResult.error.message === 'Document not found') {
                    console.log('📝 User profile not found - registration pending');
                    return 'pending';
                }
                throw new Error(profileResult.error.message);
            }

            const profile = profileResult.data;
            console.log('👤 User profile found:', {
                accountType: profile.account_type,
                organizationId: profile.organizationId,
                registrationCompleted: profile.registrationCompleted
            });

            // Check if registration is marked as incomplete
            if (profile.registrationCompleted === false) {
                console.log('📋 Registration marked as incomplete');
                return profile.account_type === 'organization' ? 'org-setup' : 'pending';
            }

            // For organization accounts, check if organization exists
            if (profile.account_type === 'organization' && profile.organizationId) {
                const orgResult = await FirestoreService.organization.getOrganization(profile.organizationId);
                if (!orgResult.success) {
                    console.log('🏢 Organization not found - needs org setup');
                    return 'org-setup';
                }
            }

            console.log('✅ Registration completed');
            return 'completed';

        } catch (error) {
            console.error('Error checking registration status:', error);
            return 'pending';
        }
    }, [ui.actions]);

    // Complete pending registration
    const completePendingRegistration = useCallback(async (registrationData) => {
        try {
            console.log('🚀 Completing pending registration:', registrationData);

            const currentUser = auth.state.currentUser;
            if (!currentUser?.uid) {
                throw new Error('No authenticated user found');
            }

            if (!registrationData.accountType || !['individual', 'organization'].includes(registrationData.accountType)) {
                throw new Error('Invalid or missing accountType');
            }

            // Create or update user profile with accountType from pendingRegistrations
            const profileData = {
                user_id: currentUser.uid,
                display_name: registrationData.displayName || currentUser.displayName || '',
                email: currentUser.email,
                first_name: registrationData.firstName || '',
                last_name: registrationData.lastName || '',
                account_type: registrationData.accountType,
                registrationCompleted: registrationData.accountType === 'organization' ? false : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: currentUser.uid,
                updated_by: currentUser.uid,
            };

            // Save user profile and verify creation
            const profileResult = await FirestoreService.user.createOrUpdateUserProfile(profileData);
            if (!profileResult.success) {
                throw new Error(profileResult.error.message || 'Failed to create user profile');
            }

            // Verify user document exists and has correct account_type
            const verifyProfile = await FirestoreService.user.getUserProfile(currentUser.uid);
            if (!verifyProfile.success || verifyProfile.data.account_type !== registrationData.accountType) {
                throw new Error(`User profile verification failed: expected account_type ${registrationData.accountType}, got ${verifyProfile.data?.account_type}`);
            }

            console.log('✅ User profile created/updated:', verifyProfile.data);

            // Delete pending registration to prevent reuse
            await FirestoreService.deleteDocument('pendingRegistrations', currentUser.uid);

            // Store registration data for organization setup if needed
            setPendingRegistrationData({
                ...registrationData,
                userId: currentUser.uid,
                profileId: profileResult.data.id
            });

            // Update auth state with profile info
            const enhancedUser = {
                ...currentUser,
                displayName: profileData.display_name,
                firstName: profileData.first_name,
                lastName: profileData.last_name,
                accountType: profileData.account_type,
            };

            auth.actions.restoreAuth({
                user: enhancedUser,
                profile: profileResult.data,
                accountType: profileData.account_type,
            });

            // Set appropriate registration state
            setRegistrationState(registrationData.accountType === 'organization' ? 'org-setup' : 'completed');

            return { success: true, data: profileResult.data };

        } catch (error) {
            console.error('❌ Error completing registration:', error);
            ui.actions.showNotification?.({
                id: 'registration-error',
                type: 'error',
                message: 'Registration failed',
                description: error.message,
                duration: 5000,
            });
            return { success: false, error: error.message };
        }
    }, [auth.state.currentUser, auth.actions, ui.actions]);

    // Complete organization setup
    const completeOrganizationSetup = useCallback(async (organizationData) => {
        try {
            console.log('🏢 Setting up organization:', organizationData);
            console.log('Current user:', auth.state.currentUser?.email, auth.state.currentUser?.uid);

            const currentUser = auth.state.currentUser;
            if (!currentUser?.uid || !pendingRegistrationData) {
                throw new Error('Invalid state for organization setup');
            }

            // Verify user exists in Firestore and has correct account_type
            const userProfile = await FirestoreService.user.getUserProfile(currentUser.uid);
            if (!userProfile.success) {
                throw new Error('User profile not found. Please complete registration first.');
            }
            if (userProfile.data.account_type !== 'organization') {
                throw new Error(`Invalid account_type: expected 'organization', got '${userProfile.data.account_type}'`);
            }

            // Create organization
            const orgResult = await FirestoreService.organization.createOrganization({
                name: organizationData.organizationName,
                description: organizationData.description || '',
                industry: organizationData.industry || '',
                size: organizationData.size || '',
                owner_id: currentUser.uid,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: currentUser.uid,
                updated_by: currentUser.uid,
            });

            if (!orgResult.success) {
                throw new Error(orgResult.error.message || 'Failed to create organization');
            }

            console.log('✅ Organization created:', orgResult.data.id);

            // Update user profile with organization info and complete registration
            const updatedProfileData = {
                user_id: currentUser.uid,
                organizationId: orgResult.data.id,
                organizationName: orgResult.data.name,
                role: 'owner',
                registrationCompleted: true,
                updated_at: new Date().toISOString(),
                updated_by: currentUser.uid,
            };

            const profileUpdateResult = await FirestoreService.user.createOrUpdateUserProfile(updatedProfileData);
            if (!profileUpdateResult.success) {
                throw new Error(profileUpdateResult.error.message || 'Failed to update user profile');
            }

            console.log('✅ User profile updated with organization info:', profileUpdateResult.data);

            // Update auth state
            const enhancedUser = {
                ...currentUser,
                organizationId: orgResult.data.id,
                organizationName: orgResult.data.name,
                role: 'owner',
                accountType: 'organization',
            };

            auth.actions.restoreAuth({
                user: enhancedUser,
                profile: profileUpdateResult.data,
                accountType: 'organization',
            });

            // Clear pending data and mark as completed
            setPendingRegistrationData(null);
            setRegistrationState('completed');

            ui.actions.showNotification?.({
                id: 'org-setup-success',
                type: 'success',
                message: 'Organization setup completed!',
                description: `Welcome to ${orgResult.data.name}`,
                duration: 5000,
            });

            return { success: true, data: orgResult.data };

        } catch (error) {
            console.error('❌ Error setting up organization:', error);
            ui.actions.showNotification?.({
                id: 'org-setup-error',
                type: 'error',
                message: 'Organization setup failed',
                description: error.message,
                duration: 5000,
            });
            return { success: false, error: error.message };
        }
    }, [auth.state.currentUser, auth.actions, ui.actions, pendingRegistrationData]);

    // Create properly wrapped test case functions that directly call the slice functions
    const wrappedCreateTestCase = useCallback(async (testCaseData) => {
        const appState = getCurrentAppState();
        const appActions = getCurrentAppActions();
        const createFunction = testCases.actions.createTestCase(appState, appActions);
        return await createFunction(testCaseData);
    }, [testCases.actions.createTestCase, getCurrentAppState, getCurrentAppActions]);

    const wrappedUpdateTestCase = useCallback(async (testCaseId, updateData) => {
        const appState = getCurrentAppState();
        const updateFunction = testCases.actions.updateTestCase(appState);
        return await updateFunction(testCaseId, updateData);
    }, [testCases.actions.updateTestCase, getCurrentAppState]);

    const wrappedDeleteTestCase = useCallback(async (testCaseId) => {
        const appState = getCurrentAppState();
        const deleteFunction = testCases.actions.deleteTestCase(appState);
        return await deleteFunction(testCaseId);
    }, [testCases.actions.deleteTestCase, getCurrentAppState]);

    // Theme management functions
    const setTheme = useCallback((newTheme) => {
        try {
            theme.actions.setTheme(newTheme);
            if (ui.actions.showNotification) {
                const themeNames = { light: 'Light', dark: 'Dark', system: 'System' };
                ui.actions.showNotification({
                    id: 'theme-changed',
                    type: 'success',
                    message: `Theme changed to ${themeNames[newTheme] || newTheme}`,
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error('Failed to set theme:', error);
            ui.actions.showNotification?.({
                id: 'theme-change-error',
                type: 'error',
                message: 'Failed to change theme',
                description: error.message,
                duration: 3000,
            });
        }
    }, [theme.actions, ui.actions]);

    const toggleTheme = useCallback(() => {
        try {
            theme.actions.toggleTheme();
        } catch (error) {
            console.error('Failed to toggle theme:', error);
            ui.actions.showNotification?.({
                id: 'theme-toggle-error',
                type: 'error',
                message: 'Failed to toggle theme',
                description: error.message,
                duration: 3000,
            });
        }
    }, [theme.actions, ui.actions]);

    // Initialize AI service when authentication is ready
    const initializeAI = useCallback(async () => {
        if (!auth.state.isAuthenticated || aiInitialized || ai.state.isInitialized) {
            return;
        }

        console.log('Initializing AI service...');

        try {
            const result = await ai.actions.initializeAI();
            if (result.success) {
                setAiInitialized(true);
                console.log('✅ AI service initialized successfully');
                await ai.actions.updateSettings({
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
            await ai.actions.updateSettings({
                isInitialized: false,
                error: error.message,
                serviceInstance: null
            });

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
    }, [auth.state.isAuthenticated, aiInitialized, ai.state.isInitialized, ai.actions, ui.actions]);

    // AI-powered test case generation wrapper
    const generateTestCasesWithAI = useCallback(async (documentContent, documentTitle, templateConfig = {}) => {
        const currentState = getCurrentAppState();

        if (!currentState.ai.isInitialized || !currentState.ai.serviceInstance) {
            const error = 'AI service not available. Please check your configuration.';
            ui.actions.showNotification?.({
                id: 'ai-service-unavailable',
                type: 'error',
                message: error,
                description: 'Try refreshing the page or check your environment variables',
                duration: 5000,
            });
            return { success: false, error };
        }

        try {
            console.log('🚀 Starting AI test case generation...', { documentTitle });
            const result = await ai.actions.generateTestCases(documentContent, documentTitle, templateConfig);

            if (result.success && result.data?.testCases?.length > 0) {
                console.log(`✅ Generated ${result.data.testCases.length} test cases`);
                return {
                    success: true,
                    data: {
                        testCases: result.data.testCases.map((testCase, index) => ({
                            ...testCase,
                            id: testCase.id || `temp_${Date.now()}_${index}`,
                            _isGenerated: true,
                            _generationTimestamp: new Date().toISOString(),
                            _generationId: result.generationId || `gen_${Date.now()}`,
                            _provider: result.provider,
                            _model: result.model
                        })),
                        summary: result.data.summary || {
                            totalTests: result.data.testCases.length,
                            breakdown: result.data.testCases.reduce((acc, tc) => {
                                const type = tc.type?.toLowerCase() || 'functional';
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                            }, {})
                        }
                    },
                    generationId: result.generationId,
                    provider: result.provider,
                    model: result.model
                };
            } else if (result.success && (!result.data?.testCases || result.data.testCases.length === 0)) {
                ui.actions.showNotification?.({
                    id: 'no-test-cases-generated',
                    type: 'warning',
                    message: 'No test cases generated',
                    description: 'Try providing more detailed requirements or adjusting the prompt',
                    duration: 5000,
                });
                return result;
            }
            return result;
        } catch (error) {
            console.error('❌ AI test case generation failed:', error);
            ui.actions.showNotification?.({
                id: 'ai-generation-failed',
                type: 'error',
                message: 'AI generation failed',
                description: error.message || 'Unknown error occurred',
                duration: 5000,
            });
            return { success: false, error: error.message };
        }
    }, [ai.state.isInitialized, ai.actions, getCurrentAppState, ui.actions]);

    // Get AI generation statistics for dashboard/analytics
    const getAIAnalytics = useCallback(() => {
        if (!ai.state.isInitialized) {
            return { available: false, message: 'AI service not available' };
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
            await ai.actions.updateSettings(newSettings);
            ui.actions.showNotification?.({
                id: 'ai-settings-updated',
                type: 'success',
                message: 'AI settings updated',
                description: `Provider: ${newSettings.provider || ai.state.settings.provider}`,
                duration: 3000,
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to update AI settings:', error);
            ui.actions.showNotification?.({
                id: 'ai-settings-update-failed',
                type: 'error',
                message: 'Failed to update AI settings',
                description: error.message,
                duration: 5000,
            });
            return { success: false, error: error.message };
        }
    }, [ai.actions, ai.state.settings.provider, ui.actions]);

    // Helper functions for linking operations
    const linkTestCasesToBug = async (bugId, testCaseIds) => {
        return handleFirebaseOperation(
            () => FirestoreService.batchLinkTestCasesToBug(bugId, testCaseIds),
            'Test cases linked to bug',
            (errorMessage) => ui.actions.showNotification?.({
                id: `link-testcases-bug-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
            (errorMessage) => ui.actions.showNotification?.({
                id: `unlink-testcase-bug-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
            (errorMessage) => ui.actions.showNotification?.({
                id: `link-bugs-testcase-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
            (errorMessage) => ui.actions.showNotification?.({
                id: `unlink-bug-testcase-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
            (errorMessage) => ui.actions.showNotification?.({
                id: `add-testcases-sprint-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
            (errorMessage) => ui.actions.showNotification?.({
                id: `add-bugs-sprint-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
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
                url: URL.createObjectURL(blob),
                size: blob.size,
                created_at: new Date().toISOString(),
                networkErrors,
                suiteId: suites.state.activeSuite?.id,
            };

            const result = await recordings.actions.createRecording(suites.state, {
                recordings: recordings.actions,
                ui: ui.actions,
                bugs: bugs.actions,
            })(recordingData);

            if (result.success && networkErrors.length > 0) {
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
                    await FirestoreService.recordings.linkRecordingToBug(recordingId, bugResult.data.id);
                    recordings.actions.updateRecording(recordingId, { bugId: bugResult.data.id });
                }
                ui.actions.showNotification?.({
                    id: 'bug-created-network-error',
                    type: 'info',
                    message: 'Bug created for network error',
                    duration: 3000,
                });
            }
            return result;
        } catch (error) {
            ui.actions.showNotification?.({
                id: 'save-recording-failed',
                type: 'error',
                message: 'Failed to save recording',
                duration: 5000,
            });
            throw error;
        }
    };

    const linkRecordingToBug = async (recordingId, bugId) => {
        return handleFirebaseOperation(
            () => FirestoreService.recordings.linkRecordingToBug(recordingId, bugId),
            'Recording linked to bug',
            (errorMessage) => ui.actions.showNotification?.({
                id: `link-recording-bug-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            })
        ).then((result) => {
            if (result.success) {
                recordings.actions.updateRecording(recordingId, { bugId });
            }
            return result;
        });
    };

    const logout = async () => {
        ai.actions.clearAIState();
        setAiInitialized(false);
        setRegistrationState('completed');
        setPendingRegistrationData(null);
        return auth.actions.signOut();
    };

    const initializeAuth = () => {
        return auth.actions.initializeAuth();
    };

    // Refresh user profile
    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile from AppProvider...');

            if (!auth.state.currentUser?.uid) {
                console.error('No authenticated user found');
                throw new Error('No authenticated user');
            }

            // Check registration status first
            const regStatus = await checkRegistrationStatus(auth.state.currentUser);
            console.log('📋 Registration status:', regStatus);

            setRegistrationState(regStatus);

            // If registration is not complete, don't proceed with normal profile refresh
            if (regStatus !== 'completed') {
                console.log('⏸️ Registration not completed, skipping full profile refresh');
                return { success: true, registrationPending: true, status: regStatus };
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
                    accountType: profileData.account_type || 'organization',
                };

                console.log('Enhanced user object:', {
                    uid: enhancedUser.uid,
                    accountType: enhancedUser.accountType,
                    organizationId: enhancedUser.organizationId,
                });

                auth.actions.restoreAuth({
                    user: enhancedUser,
                    profile: profileData,
                    accountType: profileData.account_type || 'organization',
                });

                return profileResult;
            } else if (profileResult.error.message === 'Document not found') {
                console.log('Creating new user profile...');
                const createResult = await FirestoreService.user.createOrUpdateUserProfile({
                    user_id: auth.state.currentUser.uid,
                    display_name: auth.state.currentUser.displayName || '',
                    email: auth.state.currentUser.email || '',
                    account_type: pendingRegistrationData?.accountType || 'organization',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: auth.state.currentUser.uid,
                    updated_by: auth.state.currentUser.uid,
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
                        accountType: createResult.data.account_type || 'organization',
                    };

                    auth.actions.restoreAuth({
                        user: enhancedUser,
                        profile: createResult.data,
                        accountType: createResult.data.account_type || 'organization',
                    });

                    return createResult;
                }
                throw new Error('Failed to create user profile');
            }
            throw new Error(profileResult.error.message);
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            ui.actions.showNotification?.({
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

            setRegistrationState('completed');
            setPendingRegistrationData(null);

            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            setAiInitialized(false);
        } catch (error) {
            console.error('Error clearing state:', error);
            ui.actions.showNotification?.({
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

    // Main auth effect with registration flow handling
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
            registrationState,
        });

        if (!auth.state.isInitialized || auth.state.loading || subscription.state.loading) {
            console.log('Waiting for auth and subscription initialization...');
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            return;
        }

        if (auth.state.isAuthenticated && auth.state.currentUser) {
            console.log('User authenticated, checking registration status...');

            refreshUserProfile().then((result) => {
                if (result?.registrationPending) {
                    console.log('📋 Registration pending, stopping here');
                    setSuitesLoaded(false);
                    setSuiteSubscriptionActive(false);
                    return;
                }

                console.log('✅ Registration completed, proceeding with app initialization');

                suites.actions.loadSuitesStart();
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
                                ui.actions.showNotification?.({
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
                        ui.actions.showNotification?.({
                            id: 'suite-subscription-unexpected-error',
                            type: 'error',
                            message: getFirebaseErrorMessage(error),
                            duration: 5000,
                        });
                    });
                };

                if (subscription.state.isTrialActive || subscription.state.isSubscriptionActive) {
                    setupSuiteSubscription();
                } else {
                    console.log('Subscription not active, skipping suite subscription');
                    suites.actions.loadSuitesSuccess([]);
                    setSuitesLoaded(true);
                    setSuiteSubscriptionActive(false);
                    ui.actions.showNotification?.({
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
        subscription.state.isSubscriptionActive,
        registrationState,
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
                        ui.actions.showNotification?.({
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
                    ui.actions.showNotification?.({
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
            theme: theme.state,
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
            theme: {
                ...theme.actions,
                setTheme,
                toggleTheme,
            },
            registration: {
                completePendingRegistration,
                completeOrganizationSetup,
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
        registrationState,
        pendingRegistrationData,
        needsRegistration: registrationState !== 'completed',
        needsOrgSetup: registrationState === 'org-setup',
        isDarkMode: theme.state.isDark,
        isLightMode: theme.state.isLight,
        isSystemTheme: theme.state.isSystem,
        currentTheme: theme.state.actualTheme,
        selectedTheme: theme.state.selectedTheme,
        systemTheme: theme.state.systemTheme,
        themeLoading: theme.state.isLoading,
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
            theme.state.isLoading ||
            !suitesLoaded,
    }), [
        auth.state, suites.state, testCases.state, bugs.state, recordings.state,
        sprints.state, subscription.state, team.state, automation.state,
        ui.state, ai.state, reports.state, theme.state,
        auth.actions, suites.actions, testCases.actions, bugs.actions, recordings.actions,
        sprints.actions, subscription.actions, team.actions, automation.actions,
        ui.actions, ai.actions, theme.actions,
        wrappedCreateTestCase, wrappedUpdateTestCase, wrappedDeleteTestCase,
        saveRecording, linkRecordingToBug, generateTestCasesWithAI, getAIAnalytics, updateAISettings,
        setTheme, toggleTheme, completePendingRegistration, completeOrganizationSetup,
        linkTestCasesToBug, unlinkTestCaseFromBug, linkBugsToTestCase, unlinkBugFromTestCase,
        addTestCasesToSprint, addBugsToSprint, clearState, logout, initializeAuth, refreshUserProfile,
        suitesLoaded, aiInitialized, registrationState, pendingRegistrationData,
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