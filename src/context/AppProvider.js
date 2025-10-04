/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useSlices, getAppState } from './hooks/useSlices';
import { useAI } from './hooks/useAI';
import { useTestCases } from './hooks/useTestCases';
import { useTheme } from './hooks/useTheme';
import { useAssetLinking } from './hooks/useAssetLinking';
import { useRecording } from './hooks/useRecording';
import { useRecommendations } from '../hooks/useRecommendations';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import FirestoreService from '../services';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const slices = useSlices();
    const [suitesLoaded, setSuitesLoaded] = useState(false);
    const [suiteSubscriptionActive, setSuiteSubscriptionActive] = useState(false);
    const [aiInitialized, setAiInitialized] = useState(false);

    // Bulk Actions State
    const [bulkActions, setBulkActions] = useState({
        selectedItems: [],
        currentPageType: '',
        portalContainer: null,
        onBulkAction: null
    });

    const unsubscribeSuitesRef = useRef(null);
    const assetUnsubscribersRef = useRef({});
    const retryTimeoutRef = useRef(null);

    // Check if recommendations slice is available
    const hasRecommendationsSlice = slices.recommendations !== undefined;

    const { initializeAI, generateTestCasesWithAI, getAIAnalytics, updateAISettings } = useAI(
        slices.auth,
        slices.ai,
        slices.ui,
        aiInitialized,
        setAiInitialized
    );

    const { wrappedCreateTestCase, wrappedUpdateTestCase } = useTestCases(slices);
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

    // Always call useRecommendations hook, but conditionally use its return values
    const recommendationsHook = useRecommendations(
        hasRecommendationsSlice ? slices.recommendations : null,
        slices.auth,
        slices.suites,
        slices.ui
    );

    // Safe recommendations actions with fallbacks
    const {
        createRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        updateRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        voteOnRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        addComment = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        removeComment = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        setFilters = () => { },
        setSortConfig = () => { },
        setViewMode = () => { },
        openModal = () => { },
        closeModal = () => { },
        resetFilters = () => { },
        cleanup: cleanupRecommendations = () => { }
    } = hasRecommendationsSlice ? recommendationsHook : {};

    // Archive/trash functionality using FirestoreService directly
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archivedItems, setArchivedItems] = useState({});
    const [trashedItems, setTrashedItems] = useState({});

    // Archive operations wrapper
    const createArchiveOperation = (operation) => async (...args) => {
        setArchiveLoading(true);
        try {
            const result = await operation(...args);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: `archive-success-${Date.now()}`,
                    type: 'success',
                    message: 'Operation completed successfully',
                    duration: 3000,
                });
            } else {
                throw new Error(result.error?.message || 'Archive operation failed');
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: `archive-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        } finally {
            setArchiveLoading(false);
        }
    };

    const createUndoableAction = (actionFn, undoFn, description) => {
        return async (...args) => {
            const actionId = `undo_${Date.now()}_${Math.random()}`;

            try {
                // Execute the action
                const result = await actionFn(...args);

                if (result.success) {
                    // Show success notification with undo button
                    slices.ui.actions.showNotification?.({
                        id: actionId,
                        type: 'success',
                        message: description,
                        duration: 8000,
                        action: {
                            label: 'Undo',
                            onClick: async () => {
                                try {
                                    console.log('Undoing action:', description);
                                    const undoResult = await undoFn(...args);

                                    if (undoResult.success) {
                                        slices.ui.actions.showNotification?.({
                                            id: `undo-success-${actionId}`,
                                            type: 'info',
                                            message: `Undone: ${description}`,
                                            duration: 3000,
                                        });
                                    } else {
                                        throw new Error(undoResult.error?.message || 'Undo failed');
                                    }
                                } catch (error) {
                                    console.error('Undo failed:', error);
                                    slices.ui.actions.showNotification?.({
                                        id: `undo-error-${actionId}`,
                                        type: 'error',
                                        message: `Failed to undo: ${error.message}`,
                                        duration: 5000,
                                    });
                                }
                            }
                        }
                    });
                }

                return result;
            } catch (error) {
                console.error('Action failed:', error);
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: `action-error-${Date.now()}`,
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        };
    };

    // Wrapped archive operations
    const archiveItem = createArchiveOperation((suiteId, assetType, assetId, sprintId = null, reason = null) => {
        console.log('Archive operation called:', { suiteId, assetType, assetId, sprintId, reason });

        switch (assetType) {
            case 'testCases':
                return FirestoreService.archiveTrash.archiveTestCase(suiteId, assetId, sprintId, reason);
            case 'bugs':
                return FirestoreService.archiveTrash.archiveBug(suiteId, assetId, sprintId, reason);
            case 'recordings':
                return FirestoreService.archiveTrash.archiveRecording(suiteId, assetId, sprintId, reason);
            case 'sprints':
                return FirestoreService.archiveTrash.archiveSprint(suiteId, assetId, reason);
            case 'recommendations':
                return FirestoreService.archiveTrash.archiveRecommendation(suiteId, assetId, sprintId, reason);
            case 'documents':
                return FirestoreService.archiveTrash.archiveDocument(suiteId, assetId, sprintId, reason);
            case 'testData':
                return FirestoreService.archiveTrash.archiveTestData(suiteId, assetId, sprintId, reason);
            default:
                throw new Error(`Unknown asset type: ${assetType}`);
        }
    });

    const unarchiveItem = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        console.log('Unarchive called:', { suiteId, assetType, assetId, sprintId });

        switch (assetType) {
            case 'testCases':
                return FirestoreService.archiveTrash.unarchiveTestCase(suiteId, assetId, sprintId);
            case 'bugs':
                return FirestoreService.archiveTrash.unarchiveBug(suiteId, assetId, sprintId);
            case 'recordings':
                return FirestoreService.archiveTrash.unarchiveRecording(suiteId, assetId, sprintId);
            case 'sprints':
                return FirestoreService.archiveTrash.unarchiveSprint(suiteId, assetId);
            case 'recommendations':
                return FirestoreService.archiveTrash.unarchiveRecommendation(suiteId, assetId, sprintId);
            case 'documents':
                return FirestoreService.archiveTrash.unarchiveDocument(suiteId, assetId, sprintId);
            case 'testData':
                return FirestoreService.archiveTrash.unarchiveRecommendation(suiteId, assetId, sprintId);
            default:
                throw new Error(`Unknown asset type: ${assetType}`);
        }
    });

    const moveToTrash = createArchiveOperation((suiteId, assetType, assetId, sprintId = null, reason = null) => {
        switch (assetType) {
            case 'testCases':
                return FirestoreService.archiveTrash.deleteTestCase(suiteId, assetId, sprintId, reason);
            case 'bugs':
                return FirestoreService.archiveTrash.deleteBug(suiteId, assetId, sprintId, reason);
            case 'recordings':
                return FirestoreService.archiveTrash.deleteRecording(suiteId, assetId, sprintId, reason);
            case 'sprints':
                return FirestoreService.archiveTrash.deleteSprint(suiteId, assetId, reason);
            case 'recommendations':
                return FirestoreService.archiveTrash.deleteRecommendation(suiteId, assetId, sprintId, reason);
            case 'documents':
                return FirestoreService.archiveTrash.deleteDocument(suiteId, assetId, sprintId, reason);
            case 'testData':
                return FirestoreService.archiveTrash.deleteTestData(suiteId, assetId, sprintId, reason);
            default:
                throw new Error(`Unknown asset type: ${assetType}`);
        }
    });

    const restoreFromTrash = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        console.log('Restore from trash called:', { suiteId, assetType, assetId, sprintId });

        switch (assetType) {
            case 'testCases':
                return FirestoreService.archiveTrash.restoreTestCase(suiteId, assetId, sprintId);
            case 'bugs':
                return FirestoreService.archiveTrash.restoreBug(suiteId, assetId, sprintId);
            case 'recordings':
                return FirestoreService.archiveTrash.restoreRecording(suiteId, assetId, sprintId);
            case 'sprints':
                return FirestoreService.archiveTrash.restoreSprint(suiteId, assetId);
            case 'recommendations':
                return FirestoreService.archiveTrash.restoreRecommendation(suiteId, assetId, sprintId);
            case 'documents':
                return FirestoreService.archiveTrash.restoreDocument(suiteId, assetId, sprintId);
            case 'testData':
                return FirestoreService.archiveTrash.restoreTestData(suiteId, assetId, sprintId);
            default:
                throw new Error(`Unknown asset type: ${assetType}`);
        }
    });

    const permanentlyDelete = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        switch (assetType) {
            case 'testCases':
                return FirestoreService.archiveTrash.permanentlyDeleteTestCase(suiteId, assetId, sprintId);
            case 'bugs':
                return FirestoreService.archiveTrash.permanentlyDeleteBug(suiteId, assetId, sprintId);
            case 'recordings':
                return FirestoreService.archiveTrash.permanentlyDeleteRecording(suiteId, assetId, sprintId);
            case 'sprints':
                return FirestoreService.archiveTrash.permanentlyDeleteSprint(suiteId, assetId);
            case 'recommendations':
                return FirestoreService.archiveTrash.permanentlyDeleteRecommendation(suiteId, assetId, sprintId);
            case 'documents':
                return FirestoreService.archiveTrash.permanentlyDeleteDocument(suiteId, assetId, sprintId);
            case 'testData':
                return FirestoreService.archiveTrash.permanentlyDeleteTestData(suiteId, assetId, sprintId);
            default:
                throw new Error(`Unknown asset type: ${assetType}`);
        }
    });

    // Bulk delete with undo
    const bulkDelete = createUndoableAction(
        async (suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk deletion') => {
            return await FirestoreService.archiveTrash.bulkDelete(suiteId, assetType, assetIds, sprintId, reason);
        },
        async (suiteId, assetType, assetIds, sprintId = null) => {
            return await FirestoreService.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, true);
        },
        `Items deleted`
    );

    // Bulk archive with undo
    const bulkArchive = createUndoableAction(
        async (suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk archive') => {
            return await FirestoreService.archiveTrash.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
        },
        async (suiteId, assetType, assetIds, sprintId = null) => {
            return await FirestoreService.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, false);
        },
        `Items archived`
    );

    const bulkRestore = createArchiveOperation((suiteId, assetType, assetIds, sprintId = null, fromTrash = false) => {
        return FirestoreService.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, fromTrash);
    });

    const bulkPermanentDelete = createArchiveOperation((suiteId, assetType, assetIds, sprintId = null) => {
        return FirestoreService.archiveTrash.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
    });

    const loadArchivedItems = async (suiteId, assetType, sprintId = null) => {
        try {
            const result = await FirestoreService.archiveTrash.getArchivedAssets(suiteId, assetType, sprintId);
            if (result.success) {
                setArchivedItems(prev => ({
                    ...prev,
                    [`${suiteId}-${assetType}-${sprintId || 'null'}`]: result.data
                }));
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: `load-archived-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const loadTrashedItems = async (suiteId, assetType, sprintId = null) => {
        try {
            const result = await FirestoreService.archiveTrash.getTrashedAssets(suiteId, assetType, sprintId);
            if (result.success) {
                setTrashedItems(prev => ({
                    ...prev,
                    [`${suiteId}-${assetType}-${sprintId || 'null'}`]: result.data
                }));
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: `load-trashed-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const loadExpiredItems = async (suiteId, assetType, sprintId = null) => {
        try {
            return await FirestoreService.getExpiredItems(suiteId, assetType, sprintId);
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: `load-expired-error-${Date.now()}`,
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const cleanupExpiredItems = createArchiveOperation((suiteId, assetType, sprintId = null, dryRun = true) => {
        return FirestoreService.cleanupExpiredAssets(suiteId, assetType, sprintId, dryRun);
    });

    // Initialize bulk actions portal container
    useEffect(() => {
        let container = document.getElementById('bulk-actions-portal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bulk-actions-portal';
            container.className = 'fixed bottom-0 left-0 right-0 z-50';
            document.body.appendChild(container);
        }
        setBulkActions(prev => ({ ...prev, portalContainer: container }));

        return () => {
            const existingContainer = document.getElementById('bulk-actions-portal');
            if (existingContainer && existingContainer.children.length === 0) {
                document.body.removeChild(existingContainer);
            }
        };
    }, []);

    const logout = async () => {
        slices.ai.actions.clearAIState();
        setAiInitialized(false);
        try {
            cleanupRecommendations();
        } catch (error) {
            console.warn('Error cleaning up recommendations on logout:', error.message);
        }
        // Clear bulk actions on logout
        setBulkActions({
            selectedItems: [],
            currentPageType: '',
            portalContainer: bulkActions.portalContainer,
            onBulkAction: null
        });
        return slices.auth.actions.signOut();
    };

    const initializeAuth = () => slices.auth.actions.initializeAuth();

    const refreshUserProfile = async () => {
        try {
            if (!slices.auth.state.currentUser?.uid) {
                throw new Error('No authenticated user');
            }

            const profileResult = await FirestoreService.getUserProfile(slices.auth.state.currentUser.uid);
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
                const userData = {
                    uid: slices.auth.state.currentUser.uid,
                    email: slices.auth.state.currentUser.email || '',
                    displayName: slices.auth.state.currentUser.displayName || '',
                    accountType: 'individual',
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

            // Clear all slices safely
            try { slices.auth.actions.clearAuthState(); } catch (e) { console.warn('Auth clear error:', e.message); }

            try {
                if (slices.suites.actions.loadSuitesSuccess) {
                    slices.suites.actions.loadSuitesSuccess([]);
                }
            } catch (e) { console.warn('Suites clear error:', e.message); }

            try {
                if (slices.testCases.actions.loadTestCasesSuccess) {
                    slices.testCases.actions.loadTestCasesSuccess([]);
                }
            } catch (e) { console.warn('TestCases clear error:', e.message); }

            try {
                if (slices.bugs.actions.loadBugsSuccess) {
                    slices.bugs.actions.loadBugsSuccess([]);
                }
            } catch (e) { console.warn('Bugs clear error:', e.message); }

            try {
                if (slices.recordings.actions.loadRecordingsSuccess) {
                    slices.recordings.actions.loadRecordingsSuccess([]);
                }
            } catch (e) { console.warn('Recordings clear error:', e.message); }

            try { slices.subscription.actions.clearSubscription?.(); } catch (e) { console.warn('Subscription clear error:', e.message); }
            try { slices.team.actions.clearTeam?.(); } catch (e) { console.warn('Team clear error:', e.message); }
            try { slices.automation.actions.clearAutomation?.(); } catch (e) { console.warn('Automation clear error:', e.message); }
            try { slices.ui.actions.clearUI?.(); } catch (e) { console.warn('UI clear error:', e.message); }
            try { slices.ai.actions.clearAIState(); } catch (e) { console.warn('AI clear error:', e.message); }

            // Clear recommendations safely
            if (hasRecommendationsSlice) {
                try {
                    if (slices.recommendations.actions.clearRecommendations) {
                        slices.recommendations.actions.clearRecommendations();
                    }
                } catch (e) { console.warn('Recommendations clear error:', e.message); }
            }
            try {
                if (slices.documents?.actions?.loadDocumentsSuccess) {
                    slices.documents.actions.loadDocumentsSuccess([]);
                }
            } catch (e) { console.warn('Documents clear error:', e.message); }

            try {
                if (slices.testData?.actions?.loadTestDataSuccess) {
                    slices.testData.actions.loadTestDataSuccess([]);
                }
            } catch (e) { console.warn('TestData clear error:', e.message); }

            // Clear archive/trash state
            setArchivedItems({});
            setTrashedItems({});

            // Clear bulk actions state
            setBulkActions(prev => ({
                selectedItems: [],
                currentPageType: '',
                portalContainer: prev.portalContainer,
                onBulkAction: null
            }));

            // Clean up recommendations hook
            try {
                cleanupRecommendations();
            } catch (error) {
                console.warn('Error cleaning up recommendations hook:', error.message);
            }

            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            setAiInitialized(false);
        } catch (error) {
            slices.ui.actions.showNotification?.({
                id: 'clear-state-error',
                type: 'error',
                message: getFirebaseErrorMessage(error),
                duration: 5000,
            });
        }
    };

    // Auth initialization
    useEffect(() => {
        initializeAuth();
    }, []);

    // Auth state management effect
    useEffect(() => {
        if (!slices.auth.state.isInitialized || slices.auth.state.loading || slices.subscription.state.loading) {
            setSuitesLoaded(false);
            setSuiteSubscriptionActive(false);
            return;
        }

        if (slices.auth.state.isAuthenticated && slices.auth.state.currentUser) {
            refreshUserProfile().then(() => {
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
                    try {
                        const unsubscribe = FirestoreService.subscribeToUserTestSuites(
                            (fetchedSuites) => {
                                const safeSuites = Array.isArray(fetchedSuites) ? fetchedSuites : [];

                                slices.suites.actions.loadSuitesSuccess(safeSuites);
                                setSuitesLoaded(true);
                                setSuiteSubscriptionActive(true);
                                retryCount = 0;

                                if (safeSuites.length > 0 && !slices.suites.state.activeSuite) {
                                    slices.suites.actions.activateSuite(safeSuites[0]);
                                }
                            },
                            (error) => {
                                const errorMessage = getFirebaseErrorMessage(error);

                                if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
                                    console.log('Authentication/permission error, not retrying');
                                    slices.suites.actions.loadSuitesSuccess([]);
                                    setSuitesLoaded(true);
                                    setSuiteSubscriptionActive(false);
                                    return;
                                }

                                if (retryCount < maxRetries) {
                                    retryCount++;
                                    retryTimeoutRef.current = setTimeout(setupSuiteSubscription, retryDelay * retryCount);
                                } else {
                                    slices.suites.actions.loadSuitesSuccess([]);
                                    setSuitesLoaded(true);
                                    setSuiteSubscriptionActive(false);

                                    if (slices.suites.state.testSuites.length === 0) {
                                        slices.ui.actions.showNotification?.({
                                            id: 'suite-subscription-error',
                                            type: 'error',
                                            message: `Failed to load test suites: ${errorMessage}`,
                                            duration: 5000,
                                        });
                                    }
                                }
                            }
                        );

                        unsubscribeSuitesRef.current = unsubscribe;

                    } catch (error) {
                        slices.suites.actions.loadSuitesSuccess([]);
                        setSuitesLoaded(true);
                        setSuiteSubscriptionActive(false);
                        slices.ui.actions.showNotification?.({
                            id: 'suite-subscription-setup-error',
                            type: 'error',
                            message: `Failed to set up suite subscription: ${getFirebaseErrorMessage(error)}`,
                            duration: 5000,
                        });
                    }
                };

                if (slices.subscription.state.isTrialActive || slices.subscription.state.isSubscriptionActive) {
                    setupSuiteSubscription();
                } else {
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
                slices.suites.actions.loadSuitesSuccess([]);
                setSuitesLoaded(true);
                setSuiteSubscriptionActive(false);
            });

            return () => {
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

    // Asset subscriptions effect
    useEffect(() => {
        if (
            !slices.auth.state.isAuthenticated ||
            !slices.suites.state.activeSuite?.id ||
            !suitesLoaded ||
            !suiteSubscriptionActive
        ) {
            // Clear existing subscriptions
            Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};

            // Clear asset data
            try {
                if (slices.testCases.actions.loadTestCasesSuccess) {
                    slices.testCases.actions.loadTestCasesSuccess([]);
                }
                if (slices.bugs.actions.loadBugsSuccess) {
                    slices.bugs.actions.loadBugsSuccess([]);
                }
                if (slices.recordings.actions.loadRecordingsSuccess) {
                    slices.recordings.actions.loadRecordingsSuccess([]);
                }
                if (hasRecommendationsSlice && slices.recommendations.actions.loadRecommendationsSuccess) {
                    slices.recommendations.actions.loadRecommendationsSuccess([]);
                }
                if (slices.documents?.actions?.loadDocumentsSuccess) {
                    slices.documents.actions.loadDocumentsSuccess([]);
                }
                if (slices.testData?.actions?.loadTestDataSuccess) {
                    slices.testData.actions.loadTestDataSuccess([]);
                }
            } catch (e) {
                console.warn('Error clearing asset data:', e.message);
            }
            return;
        }

        const suiteId = slices.suites.state.activeSuite.id;

        // Clear existing subscriptions
        Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        assetUnsubscribersRef.current = {};

        // Subscribe with explicit filtering
        const subscribeAssetWithFiltering = (type, loadSuccess, methodName) => {
            try {
                if (typeof FirestoreService[methodName] !== 'function') {
                    console.error(`FirestoreService.${methodName} is not a function`);
                    loadSuccess([]);
                    return;
                }

                assetUnsubscribersRef.current[type] = FirestoreService[methodName](
                    suiteId,
                    (assets) => {
                        // Filter out deleted and archived items in real-time
                        const safeAssets = Array.isArray(assets) ? assets : [];
                        const activeAssets = safeAssets.filter(asset =>
                            asset.status !== 'deleted' && asset.status !== 'archived'
                        );
                        loadSuccess(activeAssets);
                    },
                    (error) => {
                        console.error(`${type} subscription error:`, error);
                        const errorMessage = getFirebaseErrorMessage(error);

                        if (error?.code !== 'permission-denied') {
                            slices.ui.actions.showNotification?.({
                                id: `${type.toLowerCase()}-subscription-error`,
                                type: 'error',
                                message: `Failed to load ${type.toLowerCase()}: ${errorMessage}`,
                                duration: 5000,
                            });
                        }
                        loadSuccess([]);
                    }
                );
            } catch (error) {
                console.error(`Error setting up ${type} subscription:`, error);
                loadSuccess([]);
            }
        };

        // Set up filtered subscriptions
        if (slices.testCases.actions.loadTestCasesSuccess) {
            subscribeAssetWithFiltering('TestCases', slices.testCases.actions.loadTestCasesSuccess, 'subscribeToTestCases');
        }
        if (slices.bugs.actions.loadBugsSuccess) {
            subscribeAssetWithFiltering('Bugs', slices.bugs.actions.loadBugsSuccess, 'subscribeToBugs');
        }
        if (slices.recordings.actions.loadRecordingsSuccess) {
            subscribeAssetWithFiltering('Recordings', slices.recordings.actions.loadRecordingsSuccess, 'subscribeToRecordings');
        }
        if (hasRecommendationsSlice && slices.recommendations.actions.loadRecommendationsSuccess) {
            subscribeAssetWithFiltering('Recommendations', slices.recommendations.actions.loadRecommendationsSuccess, 'subscribeToRecommendations');
        }
        if (slices.documents?.actions?.loadDocumentsSuccess) {
            subscribeAssetWithFiltering('Documents', slices.documents.actions.loadDocumentsSuccess, 'subscribeToDocuments');
        }
        if (slices.testData?.actions?.loadTestDataSuccess) {
            subscribeAssetWithFiltering('TestData', slices.testData.actions.loadTestDataSuccess, 'subscribeToTestData');
        }

        // Sprints subscription with filtering
        try {
            if (typeof FirestoreService.subscribeToSprints === 'function') {
                assetUnsubscribersRef.current['Sprints'] = FirestoreService.subscribeToSprints(
                    suiteId,
                    (sprints) => {
                        const safeSprints = Array.isArray(sprints) ? sprints : [];
                        const activeSprints = safeSprints.filter(sprint =>
                            sprint.status !== 'deleted' && sprint.status !== 'archived'
                        );
                        if (slices.sprints?.actions?.loadSprintsSuccess) {
                            slices.sprints.actions.loadSprintsSuccess(activeSprints);
                        }
                    },
                    (error) => {
                        console.error('Sprints subscription error:', error);
                        const errorMessage = getFirebaseErrorMessage(error);
                        if (error?.code !== 'permission-denied') {
                            slices.ui.actions.showNotification?.({
                                id: 'sprints-subscription-error',
                                type: 'error',
                                message: `Failed to load sprints: ${errorMessage}`,
                                duration: 5000,
                            });
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Error setting up Sprints subscription:', error);
        }

        return () => {
            Object.values(assetUnsubscribersRef.current).forEach((unsubscribe) => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            assetUnsubscribersRef.current = {};
        };
    }, [slices.auth.state.isAuthenticated, slices.suites.state.activeSuite?.id, suitesLoaded, suiteSubscriptionActive, hasRecommendationsSlice]);

    // Trial expiry check effect
    useEffect(() => {
        if (!slices.auth.state.isAuthenticated || !slices.subscription.state.isTrialActive) return;

        const checkTrialExpiry = () => {
            const { trialEndsAt } = slices.subscription.state;
            if (trialEndsAt && new Date() > new Date(trialEndsAt)) {
                slices.subscription.actions.handleTrialExpiry(slices.suites.state, slices.suites.actions, slices.ui.actions);
            } else if (trialEndsAt) {
                const daysRemaining = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 7) {
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearState();
        };
    }, []);

    // Enhanced delete methods that use soft delete (move to trash) with undo
    const enhancedDeleteTestCase = createUndoableAction(
        async (testCaseId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'testCases', testCaseId, sprintId, 'User deletion');
        },
        async (testCaseId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'testCases', testCaseId, sprintId);
        },
        'Test case deleted'
    );

    const enhancedDeleteBug = createUndoableAction(
        async (bugId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'bugs', bugId, sprintId, 'User deletion');
        },
        async (bugId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'bugs', bugId, sprintId);
        },
        'Bug deleted'
    );

    const enhancedDeleteRecording = createUndoableAction(
        async (recordingId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'recordings', recordingId, sprintId, 'User deletion');
        },
        async (recordingId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'recordings', recordingId, sprintId);
        },
        'Recording deleted'
    );

    const enhancedDeleteSprint = createUndoableAction(
        async (sprintId, suiteId) => {
            return await moveToTrash(suiteId, 'sprints', sprintId, null, 'User deletion');
        },
        async (sprintId, suiteId) => {
            return await restoreFromTrash(suiteId, 'sprints', sprintId, null);
        },
        'Sprint deleted'
    );

    const enhancedDeleteRecommendation = createUndoableAction(
        async (recommendationId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'recommendations', recommendationId, sprintId, 'User deletion');
        },
        async (recommendationId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'recommendations', recommendationId, sprintId);
        },
        'Recommendation deleted'
    );

    const enhancedDeleteDocument = createUndoableAction(
        async (documentId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'documents', documentId, sprintId, 'User deletion');
        },
        async (documentId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'documents', documentId, sprintId);
        },
        'Document deleted'
    );

    const enhancedDeleteTestData = createUndoableAction(
        async (dataId, suiteId, sprintId = null) => {
            return await moveToTrash(suiteId, 'testData', dataId, sprintId, 'User deletion');
        },
        async (dataId, suiteId, sprintId = null) => {
            return await restoreFromTrash(suiteId, 'testData', dataId, sprintId);
        },
        'Test data deleted'
    );

    const enhancedArchiveTestCase = createUndoableAction(
        async (testCaseId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'testCases', testCaseId, sprintId, reason);
        },
        async (testCaseId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'testCases', testCaseId, sprintId);
        },
        'Test case archived'
    );

    const enhancedArchiveBug = createUndoableAction(
        async (bugId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'bugs', bugId, sprintId, reason);
        },
        async (bugId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'bugs', bugId, sprintId);
        },
        'Bug archived'
    );

    const enhancedArchiveRecording = createUndoableAction(
        async (recordingId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'recordings', recordingId, sprintId, reason);
        },
        async (recordingId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'recordings', recordingId, sprintId);
        },
        'Recording archived'
    );

    const enhancedArchiveSprint = createUndoableAction(
        async (sprintId, suiteId, reason = 'User archive') => {
            return await archiveItem(suiteId, 'sprints', sprintId, null, reason);
        },
        async (sprintId, suiteId) => {
            return await unarchiveItem(suiteId, 'sprints', sprintId, null);
        },
        'Sprint archived'
    );

    const enhancedArchiveRecommendation = createUndoableAction(
        async (recommendationId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'recommendations', recommendationId, sprintId, reason);
        },
        async (recommendationId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'recommendations', recommendationId, sprintId);
        },
        'Recommendation archived'
    );

    const enhancedArchiveDocument = createUndoableAction(
        async (documentId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'documents', documentId, sprintId, reason);
        },
        async (documentId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'documents', documentId, sprintId);
        },
        'Document archived'
    );

    const enhancedArchiveTestData = createUndoableAction(
        async (dataId, suiteId, sprintId = null, reason = 'User archive') => {
            return await archiveItem(suiteId, 'testData', dataId, sprintId, reason);
        },
        async (dataId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'testData', dataId, sprintId);
        },
        'Test data archived'
    );

    // Enhanced organization methods
    const createOrganization = async (orgData) => {
        try {
            const result = await FirestoreService.createOrganization(orgData);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: 'org-create-success',
                    type: 'success',
                    message: 'Organization created successfully',
                    duration: 3000,
                });
                await refreshUserProfile();
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'org-create-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const updateOrganization = async (orgId, updateData) => {
        try {
            const result = await FirestoreService.updateOrganization(orgId, updateData);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: 'org-update-success',
                    type: 'success',
                    message: 'Organization updated successfully',
                    duration: 3000,
                });
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'org-update-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const deleteOrganization = async (orgId) => {
        try {
            const result = await FirestoreService.deleteOrganization(orgId);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: 'org-delete-success',
                    type: 'success',
                    message: 'Organization deleted successfully',
                    duration: 3000,
                });
                await refreshUserProfile();
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'org-delete-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    // Enhanced reports functionality
    const getReports = async (orgId) => {
        try {
            return await FirestoreService.reports.getReports(orgId);
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'reports-get-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const saveReport = async (reportData) => {
        try {
            const result = await FirestoreService.reports.saveReport(reportData);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: 'report-save-success',
                    type: 'success',
                    message: 'Report saved successfully',
                    duration: 3000,
                });
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'report-save-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const deleteReport = async (reportId, organizationId) => {
        try {
            const result = await FirestoreService.reports.deleteReport(reportId, organizationId);
            if (result.success) {
                slices.ui.actions.showNotification?.({
                    id: 'report-delete-success',
                    type: 'success',
                    message: 'Report deleted successfully',
                    duration: 3000,
                });
            }
            return result;
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'report-delete-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    const generatePDF = async (report) => {
        try {
            return await FirestoreService.reports.generatePDF(report);
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            slices.ui.actions.showNotification?.({
                id: 'pdf-generate-error',
                type: 'error',
                message: errorMessage,
                duration: 5000,
            });
            return { success: false, error: { message: errorMessage } };
        }
    };

    // Asset counts functionality
    const getAssetCounts = async (suiteId) => {
        try {
            return await FirestoreService.getAssetCounts(suiteId);
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            return { success: false, error: { message: errorMessage } };
        }
    };

    // Bulk actions methods
    const bulkActionMethods = useMemo(() => ({
        registerPageBulkActions: (pageType, onBulkAction) => {
            setBulkActions(prev => ({
                ...prev,
                currentPageType: pageType,
                onBulkAction
            }));
        },

        updateBulkSelection: (items) => {
            setBulkActions(prev => ({
                ...prev,
                selectedItems: Array.isArray(items) ? items : []
            }));
        },

        clearBulkSelection: () => {
            setBulkActions(prev => ({
                ...prev,
                selectedItems: []
            }));
        },

        executeBulkAction: async (actionId, items) => {
            const { onBulkAction } = bulkActions;

            // Use custom bulk action handler if provided
            if (onBulkAction) {
                await onBulkAction(actionId, items);
            }
        }
    }), [bulkActions]);

    // Memoized context value
    const value = useMemo(
        () => ({
            state: {
                ...getAppState(slices),
                ...(hasRecommendationsSlice && { recommendations: slices.recommendations.state }),
                archivedItems,
                trashedItems,
                archiveLoading,
                bulkActions: {
                    selectedItems: bulkActions.selectedItems,
                    currentPageType: bulkActions.currentPageType,
                    hasSelection: bulkActions.selectedItems.length > 0
                }
            },
            actions: {
                auth: { ...slices.auth.actions, logout, initializeAuth, refreshUserProfile },
                suites: slices.suites.actions,
                testCases: {
                    ...slices.testCases.actions,
                    createTestCase: wrappedCreateTestCase,
                    updateTestCase: wrappedUpdateTestCase,
                    deleteTestCase: enhancedDeleteTestCase
                },
                bugs: {
                    ...slices.bugs.actions,
                    deleteBug: enhancedDeleteBug,                  // Soft delete to trash
                    archiveBug: enhancedArchiveBug                 // Archive (stays visible until filtered)
                },
                recordings: {
                    ...slices.recordings.actions,
                    saveRecording,
                    linkRecordingToBug,
                    deleteRecording: enhancedDeleteRecording
                },
                sprints: {
                    ...slices.sprints.actions,
                    deleteSprint: enhancedDeleteSprint
                },
                subscription: slices.subscription.actions,
                team: slices.team.actions,
                automation: slices.automation.actions,
                ui: slices.ui.actions,
                ai: { ...slices.ai.actions, generateTestCasesWithAI, getAIAnalytics, updateAISettings },
                theme: { ...slices.theme.actions, setTheme, toggleTheme },

                organization: {
                    createOrganization,
                    updateOrganization,
                    deleteOrganization,
                    getOrganization: FirestoreService.getOrganization.bind(FirestoreService),
                    getUserOrganizations: FirestoreService.getUserOrganizations.bind(FirestoreService),
                    addOrganizationMember: FirestoreService.addOrganizationMember.bind(FirestoreService),
                    removeOrganizationMember: FirestoreService.removeOrganizationMember.bind(FirestoreService),
                    getOrganizationMembers: FirestoreService.getOrganizationMembers.bind(FirestoreService),
                },

                reports: {
                    getReports,
                    saveReport,
                    deleteReport,
                    generatePDF,
                    toggleSchedule: FirestoreService.reports.toggleSchedule.bind(FirestoreService.reports),
                    subscribeToTriggers: FirestoreService.reports.subscribeToTriggers.bind(FirestoreService.reports),
                },

                recommendations: {
                    createRecommendation,
                    updateRecommendation,
                    deleteRecommendation: enhancedDeleteRecommendation,
                    voteOnRecommendation,
                    addComment,
                    removeComment,
                    setFilters,
                    setSortConfig,
                    setViewMode,
                    openModal,
                    closeModal,
                    resetFilters
                },

                documents: {
                    ...slices.documents?.actions,
                    createDocument: FirestoreService.createDocument.bind(FirestoreService),
                    updateDocument: FirestoreService.updateDocument.bind(FirestoreService),
                    getDocument: FirestoreService.getDocument.bind(FirestoreService),
                    getDocuments: FirestoreService.getDocuments.bind(FirestoreService),
                    deleteDocument: enhancedDeleteDocument,
                    archiveDocument: enhancedArchiveDocument,
                    searchDocuments: FirestoreService.searchDocuments.bind(FirestoreService),
                    getDocumentStatistics: FirestoreService.getDocumentStatistics.bind(FirestoreService),
                    getDocumentVersionHistory: FirestoreService.getDocumentVersionHistory.bind(FirestoreService),
                },

                testData: {
                    ...slices.testData?.actions,
                    createTestData: FirestoreService.createTestData.bind(FirestoreService),
                    updateTestData: FirestoreService.updateTestData.bind(FirestoreService),
                    getTestDataById: FirestoreService.getTestDataById.bind(FirestoreService),
                    getTestData: FirestoreService.getTestData.bind(FirestoreService),
                    deleteTestData: enhancedDeleteTestData,
                    archiveTestData: enhancedArchiveTestData,
                    bulkImportTestData: FirestoreService.bulkImportTestData.bind(FirestoreService),
                    exportTestData: FirestoreService.exportTestData.bind(FirestoreService),
                    validateTestData: FirestoreService.validateTestData.bind(FirestoreService),
                    duplicateTestData: FirestoreService.duplicateTestData.bind(FirestoreService),
                    mergeTestData: FirestoreService.mergeTestData.bind(FirestoreService),
                    searchTestData: FirestoreService.searchTestData.bind(FirestoreService),
                    getTestDataStatistics: FirestoreService.getTestDataStatistics.bind(FirestoreService),
                },

                // Archive/trash actions
                archive: {
                    archiveItem,
                    unarchiveItem,
                    moveToTrash,
                    restoreFromTrash,
                    permanentlyDelete,
                    bulkArchive,
                    bulkRestore,
                    bulkPermanentDelete,
                    loadArchivedItems,
                    loadTrashedItems,
                    loadExpiredItems,
                    cleanupExpiredItems,
                    getAssetCounts,
                    // Convenience methods
                    archiveTestCase: (suiteId, testCaseId, sprintId, reason) =>
                        archiveItem(suiteId, 'testCases', testCaseId, sprintId, reason),
                    archiveBug: (suiteId, bugId, sprintId, reason) =>
                        archiveItem(suiteId, 'bugs', bugId, sprintId, reason),
                    archiveRecording: (suiteId, recordingId, sprintId, reason) =>
                        archiveItem(suiteId, 'recordings', recordingId, sprintId, reason),
                    archiveSprint: (suiteId, sprintId, reason) =>
                        archiveItem(suiteId, 'sprints', sprintId, null, reason),
                    archiveRecommendation: (suiteId, recommendationId, sprintId, reason) =>
                        archiveItem(suiteId, 'recommendations', recommendationId, sprintId, reason),
                    archiveDocument: (suiteId, documentId, sprintId, reason) =>
                        archiveItem(suiteId, 'documents', documentId, sprintId, reason),
                    archiveTestData: (suiteId, dataId, sprintId, reason) =>
                        archiveItem(suiteId, 'testData', dataId, sprintId, reason),
                },

                // Asset linking actions
                linking: {
                    linkTestCasesToBug,
                    unlinkTestCaseFromBug,
                    linkBugsToTestCase,
                    unlinkBugFromTestCase,
                    addTestCasesToSprint,
                    addBugsToSprint,
                    linkTestCasesToBugAdvanced: FirestoreService.linkTestCasesToBug.bind(FirestoreService),
                    unlinkTestCasesFromBug: FirestoreService.unlinkTestCasesFromBug.bind(FirestoreService),
                    linkBugsToTestCaseAdvanced: FirestoreService.linkBugsToTestCase.bind(FirestoreService),
                    getLinkedTestCasesForBug: FirestoreService.getLinkedTestCasesForBug.bind(FirestoreService),
                    getLinkedBugsForTestCase: FirestoreService.getLinkedBugsForTestCase.bind(FirestoreService),
                    getAvailableTestCasesForLinking: FirestoreService.getAvailableTestCasesForLinking.bind(FirestoreService),
                    getAvailableBugsForLinking: FirestoreService.getAvailableBugsForLinking.bind(FirestoreService),
                    bulkLinkTestCasesToBugs: FirestoreService.bulkLinkTestCasesToBugs.bind(FirestoreService),
                    bulkLinkBugsToTestCases: FirestoreService.bulkLinkBugsToTestCases.bind(FirestoreService),
                },

                // Bulk actions
                bulkActions: bulkActionMethods,

                clearState,
            },

            // Direct state access for convenience
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

            // Archive/Trash state
            archiveLoading,
            archivedItems,
            trashedItems,

            // Bulk actions state
            bulkSelection: bulkActions.selectedItems,
            hasBulkSelection: bulkActions.selectedItems.length > 0,
            currentBulkPageType: bulkActions.currentPageType,

            // Recommendations state (if available)
            recommendations: hasRecommendationsSlice ? slices.recommendations.state.recommendations : [],
            recommendationsLoading: hasRecommendationsSlice ? slices.recommendations.state.loading : false,
            recommendationsError: hasRecommendationsSlice ? slices.recommendations.state.error : null,
            recommendationsAvailable: hasRecommendationsSlice,

            isLoading:
                slices.auth.state.loading ||
                slices.suites.state.loading ||
                slices.testCases.state.loading ||
                (slices.bugs.state.loading && slices.bugs.state.bugs.length === 0) ||
                slices.recordings.state.loading ||
                slices.sprints.state.loading ||
                slices.documents?.state?.loading ||
                slices.testData?.state?.loading ||
                slices.subscription.state.loading ||
                slices.team.state.loading ||
                slices.automation.state.loading ||
                slices.ui.state.loading ||
                slices.ai.state.loading ||
                slices.theme.state.isLoading ||
                archiveLoading ||
                (hasRecommendationsSlice ? slices.recommendations.state.loading : false) ||
                !suitesLoaded,
        }),
        [
            slices,
            hasRecommendationsSlice,
            wrappedCreateTestCase,
            wrappedUpdateTestCase,
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
            archiveLoading,
            archivedItems,
            trashedItems,
            archiveItem,
            unarchiveItem,
            moveToTrash,
            restoreFromTrash,
            permanentlyDelete,
            bulkArchive,
            bulkRestore,
            bulkPermanentDelete,
            loadArchivedItems,
            loadTrashedItems,
            loadExpiredItems,
            cleanupExpiredItems,
            createRecommendation,
            updateRecommendation,
            voteOnRecommendation,
            addComment,
            removeComment,
            setFilters,
            setSortConfig,
            setViewMode,
            openModal,
            closeModal,
            resetFilters,
            createOrganization,
            updateOrganization,
            deleteOrganization,
            getReports,
            saveReport,
            deleteReport,
            generatePDF,
            enhancedDeleteTestCase,
            enhancedDeleteBug,
            enhancedDeleteRecording,
            enhancedDeleteSprint,
            enhancedDeleteRecommendation,
            enhancedDeleteDocument,
            enhancedDeleteTestData,
            enhancedArchiveDocument,
            enhancedArchiveTestData,
            getAssetCounts,
            bulkActionMethods,
            bulkActions,
        ]
    );

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppProvider;