/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useSlices, getAppState } from './hooks/useSlices';
import { useTestCases } from './hooks/useTestCases';
import { useTheme } from './hooks/useTheme';
import { useAssetLinking } from './hooks/useAssetLinking';
import { useRecordings } from './hooks/useRecording';
import { useRecommendations } from '../hooks/useRecommendations';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
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

    // Check if recommendations slice is available
    const hasRecommendationsSlice = slices.recommendations !== undefined;

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

    const { saveRecording, linkRecordingToBug } = useRecordings(slices);

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

    // NEW: Undoable action wrapper
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
                return FirestoreService.archiveTrash.unarchiveTestData(suiteId, assetId, sprintId);
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

    // NEW: Bulk operations with undo
    const bulkDelete = createUndoableAction(
        async (suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk deletion') => {
            return await FirestoreService.archiveTrash.bulkDelete(suiteId, assetType, assetIds, sprintId, reason);
        },
        async (suiteId, assetType, assetIds, sprintId = null) => {
            return await FirestoreService.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, true);
        },
        `Items deleted`
    );

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

    const logout = async () => {
        slices.ai.actions.clearAIState();
        setAiInitialized(false);
        try {
            cleanupRecommendations();
        } catch (error) {
            console.warn('Error cleaning up recommendations on logout:', error.message);
        }
        return slices.auth.actions.signOut();
    };

    const initializeAuth = () => slices.auth.actions.initializeAuth();

    const refreshUserProfile = async () => {
        try {
            console.log('🔄 Refreshing user profile from AppProvider...');
            if (!slices.auth.state.currentUser?.uid) {
                throw new Error('No authenticated user');
            }

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

            // NEW: Clear documents and testData slices
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
            console.error('Error clearing state:', error);
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
        console.log('Initializing auth...');
        initializeAuth();
    }, []);

    // Auth state management effect
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

                if (unsubscribeSuitesRef.current && typeof unsubscribeSuitesRef.current === 'function') {
                    unsubscribeSuitesRef.current();
                    unsubscribeSuitesRef.current = null;
                }

                let retryCount = 0;
                const maxRetries = 3;
                const retryDelay = 2000;

                const setupSuiteSubscription = () => {
                    console.log(`Setting up suite subscription (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    const currentUser = slices.auth.state.currentUser;
                    const accountType = slices.auth.state.accountType || currentUser?.accountType;
                    console.log('Subscription setup details:', {
                        accountType,
                        organizationId: currentUser?.organizationId,
                        uid: currentUser?.uid,
                    });

                    try {
                        const unsubscribe = FirestoreService.subscribeToUserTestSuites(
                            (fetchedSuites) => {
                                console.log('Suite subscription callback triggered');
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

                                slices.suites.actions.loadSuitesSuccess(safeSuites);
                                setSuitesLoaded(true);
                                setSuiteSubscriptionActive(true);
                                retryCount = 0;

                                if (safeSuites.length > 0 && !slices.suites.state.activeSuite) {
                                    console.log('Auto-activating first suite:', safeSuites[0].name);
                                    slices.suites.actions.activateSuite(safeSuites[0]);
                                }
                            },
                            (error) => {
                                console.error('Suite subscription error:', error);
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
                                    console.log(`Retrying suite subscription in ${retryDelay * retryCount}ms (attempt ${retryCount}/${maxRetries})`);
                                    retryTimeoutRef.current = setTimeout(setupSuiteSubscription, retryDelay * retryCount);
                                } else {
                                    console.error('Max retries exceeded for suite subscription');
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
                        console.error('Error setting up suite subscription:', error);
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
        if (slices.auth.state.isAuthenticated && slices.suites.state.activeSuite) {
            // Mark services as operating in authenticated context
            FirestoreService.assets.setAuthenticatedContext(true);
        } else {
            FirestoreService.assets.setAuthenticatedContext(false);
        }
    }, [slices.auth.state.isAuthenticated, slices.suites.state.activeSuite]);

    // Asset subscriptions effect with NEW: Documents and TestData support
    useEffect(() => {
        if (
            !slices.auth.state.isAuthenticated ||
            !slices.suites.state.activeSuite?.id ||
            !suitesLoaded ||
            !suiteSubscriptionActive
        ) {
            console.log('Clearing assets - conditions not met');

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
                // NEW: Clear documents and testData
                if (slices.documents?.actions?.loadDocumentsSuccess) {
                    slices.documents.actions.loadDocumentsSuccess([]);
                }
                if (slices.testData?.actions?.loadTestDataSuccess) {
                    slices.testData.actions.loadTestDataSuccess([]);
                }
            } catch (e) {
                console.warn('Asset clear error:', e.message);
            }
            return;
        }

        const suiteId = slices.suites.state.activeSuite.id;
        console.log('Setting up FILTERED asset subscriptions for suite:', suiteId);

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

                console.log(`Setting up filtered subscription for ${type}`);
                assetUnsubscribersRef.current[type] = FirestoreService[methodName](
                    suiteId,
                    (assets) => {
                        // Filter out deleted and archived items in real-time
                        const safeAssets = Array.isArray(assets) ? assets : [];
                        const activeAssets = safeAssets.filter(asset =>
                            asset.status !== 'deleted' && asset.status !== 'archived'
                        );

                        console.log(`${type} update - Total: ${safeAssets.length}, Active: ${activeAssets.length}, Filtered out: ${safeAssets.length - activeAssets.length}`);
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
        // NEW: Subscribe to documents and testData
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
                        console.log(`Sprints update - Total: ${safeSprints.length}, Active: ${activeSprints.length}`);
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
            console.log('Cleaning up filtered asset subscriptions');
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('App provider unmounting, cleaning up');
            clearState();
        };
    }, []);

    // NEW: Enhanced delete methods with UNDO support
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

    // NEW: Delete methods for documents and testData with UNDO
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

    // NEW: Enhanced archive methods with UNDO support
    const enhancedArchiveTestCase = createUndoableAction(
        async (testCaseId, suiteId, sprintId = null, reason = 'User archive') => {
            console.log('Enhanced archive test case called:', { testCaseId, suiteId, sprintId, reason });
            return await archiveItem(suiteId, 'testCases', testCaseId, sprintId, reason);
        },
        async (testCaseId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'testCases', testCaseId, sprintId);
        },
        'Test case archived'
    );

    const enhancedArchiveBug = createUndoableAction(
        async (bugId, suiteId, sprintId = null, reason = 'User archive') => {
            console.log('Enhanced archive bug called:', { bugId, suiteId, sprintId, reason });
            return await archiveItem(suiteId, 'bugs', bugId, sprintId, reason);
        },
        async (bugId, suiteId, sprintId = null) => {
            return await unarchiveItem(suiteId, 'bugs', bugId, sprintId);
        },
        'Bug archived'
    );

    const enhancedArchiveRecording = createUndoableAction(
        async (recordingId, suiteId, sprintId = null, reason = 'User archive') => {
            console.log('Enhanced archive recording called:', { recordingId, suiteId, sprintId, reason });
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

    // NEW: Archive methods for documents and testData with UNDO
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

    // Memoized context value
    const value = useMemo(
        () => ({
            state: {
                ...getAppState(slices),
                ...(hasRecommendationsSlice && { recommendations: slices.recommendations.state }),
                archivedItems,
                trashedItems,
                archiveLoading,
            },
            actions: {
                auth: { ...slices.auth.actions, logout, initializeAuth, refreshUserProfile },
                suites: slices.suites.actions,
                testCases: {
                    ...slices.testCases.actions,
                    createTestCase: wrappedCreateTestCase,
                    updateTestCase: wrappedUpdateTestCase,
                    deleteTestCase: enhancedDeleteTestCase,
                    archiveTestCase: enhancedArchiveTestCase
                },
                bugs: {
                    ...slices.bugs.actions,
                    // CRITICAL FIX: Explicitly expose updateBug with fallback logic
                    updateBug: async (bugId, updates, suiteId = null, sprintId = null) => {
                        console.log('🐛 AppProvider.bugs.updateBug called:', {
                            bugId,
                            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
                            suiteId,
                            sprintId,
                            activeSuiteId: slices.suites.state.activeSuite?.id
                        });

                        // Determine final suiteId
                        let finalSuiteId = suiteId;

                        // Fallback 1: Try to extract from updates object
                        if (!finalSuiteId && updates?.suite_id) {
                            finalSuiteId = updates.suite_id;
                            console.log('📌 Using suite_id from updates:', finalSuiteId);
                        }

                        // Fallback 2: Use active suite
                        if (!finalSuiteId && slices.suites.state.activeSuite?.id) {
                            finalSuiteId = slices.suites.state.activeSuite.id;
                            console.log('📌 Using active suite ID:', finalSuiteId);
                        }

                        if (!finalSuiteId) {
                            console.error('❌ No suite ID available for bug update');
                            slices.ui.actions.showNotification?.({
                                id: 'bug-update-no-suite',
                                type: 'error',
                                message: 'Cannot update bug: Suite ID is missing',
                                duration: 5000,
                            });
                            return {
                                success: false,
                                error: { message: 'Suite ID is required but not provided' }
                            };
                        }

                        console.log('✅ Calling FirestoreService.updateBug with:', {
                            bugId,
                            finalSuiteId,
                            sprintId
                        });

                        try {
                            const result = await FirestoreService.updateBug(bugId, updates, finalSuiteId, sprintId);
                            console.log('📊 FirestoreService.updateBug result:', result);

                            if (!result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'bug-update-failed',
                                    type: 'error',
                                    message: result.error?.message || 'Failed to update bug',
                                    duration: 5000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('💥 Exception in updateBug:', error);
                            slices.ui.actions.showNotification?.({
                                id: 'bug-update-exception',
                                type: 'error',
                                message: `Update failed: ${error.message}`,
                                duration: 5000,
                            });
                            return {
                                success: false,
                                error: { message: error.message }
                            };
                        }
                    },
                    deleteBug: enhancedDeleteBug,
                    archiveBug: enhancedArchiveBug
                },
                recordings: {
                    ...slices.recordings.actions,
                    createRecording: FirestoreService.createRecording.bind(FirestoreService),
                    saveRecording,
                    linkRecordingToBug,
                    deleteRecording: enhancedDeleteRecording,
                    archiveRecording: enhancedArchiveRecording
                },
                sprints: {
                    ...slices.sprints.actions,
                    deleteSprint: enhancedDeleteSprint,
                    archiveSprint: enhancedArchiveSprint
                },
                subscription: slices.subscription.actions,
                team: slices.team.actions,
                automation: slices.automation.actions,
                ui: slices.ui.actions,
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
                    archiveRecommendation: enhancedArchiveRecommendation,
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

                // Then update your createDocument method to use this helper:
                documents: {
                    ...slices.documents?.actions,

                    createDocument: async (suiteId, documentData, sprintId = null) => {
                        console.log('📄 Creating document:', {
                            suiteId: suiteId || slices.suites.state.activeSuite?.id,
                            title: documentData?.title
                        });

                        const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;

                        if (!finalSuiteId || !documentData?.title) {
                            return {
                                success: false,
                                error: { message: 'Suite ID and title are required' }
                            };
                        }

                        try {
                            const { content: dataContent, ...metadataOnly } = documentData;
                            const suiteName = slices.suites.state.activeSuite?.name ||
                                slices.suites.state.testSuites?.find(s => s.id === finalSuiteId)?.name;

                            // ✅ NO AUTH CHECKS - Just make the API call
                            const response = await fetch('/api/documents/create', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                    // ❌ NO Authorization header
                                },
                                body: JSON.stringify({
                                    suiteId: finalSuiteId,
                                    sprintId,
                                    documentData: metadataOnly,
                                    content: dataContent || '',
                                    suiteName
                                })
                            });

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
                            }

                            const result = await response.json();

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'doc-create-success',
                                    type: 'success',
                                    message: `Document "${documentData.title}" created`,
                                    duration: 3000,
                                });
                            } else {
                                throw new Error(result.error?.message || 'Failed to create document');
                            }

                            return result;

                        } catch (error) {
                            console.error('Create document error:', error);
                            slices.ui.actions.showNotification?.({
                                id: 'doc-create-error',
                                type: 'error',
                                message: `Failed: ${error.message}`,
                                duration: 5000,
                            });
                            return {
                                success: false,
                                error: { message: error.message }
                            };
                        }
                    },

                    updateDocument: async (documentId, updates, suiteId = null, sprintId = null) => {
                        const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;

                        if (!finalSuiteId) {
                            return { success: false, error: { message: 'Suite ID required' } };
                        }

                        try {
                            const { content: updatesContent, ...metadataUpdates } = updates;

                            // NO AUTH HEADER NEEDED
                            const response = await fetch('/api/documents/update', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    documentId,
                                    suiteId: finalSuiteId,
                                    sprintId,
                                    updates: metadataUpdates,
                                    content: updatesContent
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'doc-update-success',
                                    type: 'success',
                                    message: 'Document updated',
                                    duration: 3000,
                                });
                            }

                            return result;

                        } catch (error) {
                            return {
                                success: false,
                                error: { message: error.message }
                            };
                        }
                    },

                    // Keep all your other document methods as they are...
                    getDocument: async (documentId, suiteId, sprintId = null) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }
                            return await FirestoreService.getDocument(documentId, finalSuiteId, sprintId);
                        } catch (error) {
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    fetchDocumentContent: async (documentId, suiteId, sprintId = null) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }

                            const docResult = await FirestoreService.getDocument(documentId, finalSuiteId, sprintId);
                            if (!docResult.success || !docResult.data.googleDoc?.docId) {
                                return docResult;
                            }

                            // Get token for API request
                            const idToken = await getFirebaseIdToken();

                            const response = await fetch(`/api/docs/${docResult.data.googleDoc.docId}`, {
                                headers: { 'Authorization': `Bearer ${idToken}` }
                            });

                            if (!response.ok) {
                                throw new Error('Failed to fetch document content');
                            }

                            const googleDocData = await response.json();
                            return {
                                success: true,
                                data: { ...docResult.data, content: googleDocData.content }
                            };
                        } catch (error) {
                            console.error('Fetch content error:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    getDocuments: async (suiteId, sprintId = null, options = {}) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }

                            return await FirestoreService.getDocuments(finalSuiteId, sprintId, options);
                        } catch (error) {
                            console.error('Error getting documents:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    deleteDocument: enhancedDeleteDocument,
                    archiveDocument: enhancedArchiveDocument,

                    searchDocuments: async (suiteId, searchQuery, sprintId = null) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }

                            return await FirestoreService.searchDocuments(finalSuiteId, searchQuery, sprintId);
                        } catch (error) {
                            console.error('Error searching documents:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    getDocumentStatistics: async (suiteId, sprintId = null) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }

                            return await FirestoreService.getDocumentStatistics(finalSuiteId, sprintId);
                        } catch (error) {
                            console.error('Error getting document statistics:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    getDocumentVersionHistory: async (documentId, suiteId, sprintId = null) => {
                        try {
                            const finalSuiteId = suiteId || slices.suites.state.activeSuite?.id;
                            if (!finalSuiteId) {
                                return { success: false, error: { message: 'Suite ID required' } };
                            }

                            return await FirestoreService.getDocumentVersionHistory(documentId, finalSuiteId, sprintId);
                        } catch (error) {
                            console.error('Error getting document version history:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },
                },

                // NEW: TestData actions
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
                    bulkDelete,
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

                    // Sprint management - FIXED with proper implementations
                    addTestCasesToSprint: async (sprintId, testCaseIds) => {
                        const suiteId = slices.suites.state.activeSuite?.id;
                        if (!suiteId) {
                            slices.ui.actions.showNotification?.({
                                id: 'add-to-sprint-no-suite',
                                type: 'error',
                                message: 'No active suite selected',
                                duration: 5000,
                            });
                            return { success: false, error: { message: 'No active suite' } };
                        }

                        console.log('Adding test cases to sprint:', { sprintId, testCaseIds, suiteId });

                        try {
                            const result = await FirestoreService.assets.addTestCasesToSprint(
                                sprintId,
                                testCaseIds,
                                suiteId
                            );

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-to-sprint-success',
                                    type: 'success',
                                    message: `${result.data.added} test case(s) added to sprint successfully`,
                                    duration: 3000,
                                });

                                if (result.data.failed > 0) {
                                    slices.ui.actions.showNotification?.({
                                        id: 'add-to-sprint-partial',
                                        type: 'warning',
                                        message: `${result.data.failed} test case(s) failed to add`,
                                        duration: 5000,
                                    });
                                }
                            } else {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-to-sprint-error',
                                    type: 'error',
                                    message: result.error?.message || 'Failed to add test cases to sprint',
                                    duration: 5000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('Error adding test cases to sprint:', error);
                            slices.ui.actions.showNotification?.({
                                id: 'add-to-sprint-exception',
                                type: 'error',
                                message: `Error: ${error.message}`,
                                duration: 5000,
                            });
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    addBugsToSprint: async (sprintId, bugIds) => {
                        const suiteId = slices.suites.state.activeSuite?.id;
                        if (!suiteId) {
                            slices.ui.actions.showNotification?.({
                                id: 'add-bugs-to-sprint-no-suite',
                                type: 'error',
                                message: 'No active suite selected',
                                duration: 5000,
                            });
                            return { success: false, error: { message: 'No active suite' } };
                        }

                        console.log('Adding bugs to sprint:', { sprintId, bugIds, suiteId });

                        try {
                            const result = await FirestoreService.assets.addBugsToSprint(
                                sprintId,
                                bugIds,
                                suiteId
                            );

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-bugs-to-sprint-success',
                                    type: 'success',
                                    message: `${result.data.added} bug(s) added to sprint successfully`,
                                    duration: 3000,
                                });

                                if (result.data.failed > 0) {
                                    slices.ui.actions.showNotification?.({
                                        id: 'add-bugs-to-sprint-partial',
                                        type: 'warning',
                                        message: `${result.data.failed} bug(s) failed to add`,
                                        duration: 5000,
                                    });
                                }
                            } else {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-bugs-to-sprint-error',
                                    type: 'error',
                                    message: result.error?.message || 'Failed to add bugs to sprint',
                                    duration: 5000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('Error adding bugs to sprint:', error);
                            slices.ui.actions.showNotification?.({
                                id: 'add-bugs-to-sprint-exception',
                                type: 'error',
                                message: `Error: ${error.message}`,
                                duration: 5000,
                            });
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    addRecommendationsToSprint: async (sprintId, recommendationIds) => {
                        const suiteId = slices.suites.state.activeSuite?.id;
                        if (!suiteId) {
                            slices.ui.actions.showNotification?.({
                                id: 'add-recommendations-to-sprint-no-suite',
                                type: 'error',
                                message: 'No active suite selected',
                                duration: 5000,
                            });
                            return { success: false, error: { message: 'No active suite' } };
                        }

                        console.log('Adding recommendations to sprint:', { sprintId, recommendationIds, suiteId });

                        try {
                            const result = await FirestoreService.assets.addRecommendationsToSprint(
                                sprintId,
                                recommendationIds,
                                suiteId
                            );

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-recommendations-to-sprint-success',
                                    type: 'success',
                                    message: `${result.data.added} recommendation(s) added to sprint successfully`,
                                    duration: 3000,
                                });

                                if (result.data.failed > 0) {
                                    slices.ui.actions.showNotification?.({
                                        id: 'add-recommendations-to-sprint-partial',
                                        type: 'warning',
                                        message: `${result.data.failed} recommendation(s) failed to add`,
                                        duration: 5000,
                                    });
                                }
                            } else {
                                slices.ui.actions.showNotification?.({
                                    id: 'add-recommendations-to-sprint-error',
                                    type: 'error',
                                    message: result.error?.message || 'Failed to add recommendations to sprint',
                                    duration: 5000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('Error adding recommendations to sprint:', error);
                            slices.ui.actions.showNotification?.({
                                id: 'add-recommendations-to-sprint-exception',
                                type: 'error',
                                message: `Error: ${error.message}`,
                                duration: 5000,
                            });
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    // Remove from sprint methods
                    removeTestCasesFromSprint: async (sprintId, testCaseIds) => {
                        const suiteId = slices.suites.state.activeSuite?.id;
                        if (!suiteId) {
                            return { success: false, error: { message: 'No active suite' } };
                        }

                        try {
                            const result = await FirestoreService.assets.removeTestCasesFromSprint(
                                sprintId,
                                testCaseIds,
                                suiteId
                            );

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'remove-from-sprint-success',
                                    type: 'success',
                                    message: `${result.data.removed} test case(s) removed from sprint`,
                                    duration: 3000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('Error removing test cases from sprint:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    removeBugsFromSprint: async (sprintId, bugIds) => {
                        const suiteId = slices.suites.state.activeSuite?.id;
                        if (!suiteId) {
                            return { success: false, error: { message: 'No active suite' } };
                        }

                        try {
                            const result = await FirestoreService.assets.removeBugsFromSprint(
                                sprintId,
                                bugIds,
                                suiteId
                            );

                            if (result.success) {
                                slices.ui.actions.showNotification?.({
                                    id: 'remove-bugs-from-sprint-success',
                                    type: 'success',
                                    message: `${result.data.removed} bug(s) removed from sprint`,
                                    duration: 3000,
                                });
                            }

                            return result;
                        } catch (error) {
                            console.error('Error removing bugs from sprint:', error);
                            return { success: false, error: { message: error.message } };
                        }
                    },

                    // Advanced linking methods (existing)
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
            bulkDelete,
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
            enhancedArchiveTestCase,
            enhancedArchiveBug,
            enhancedArchiveRecording,
            enhancedArchiveSprint,
            enhancedArchiveRecommendation,
            enhancedArchiveDocument,
            enhancedArchiveTestData,
            getAssetCounts,
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