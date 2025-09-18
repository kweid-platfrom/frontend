/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSlices, getAppState } from './hooks/useSlices';
import { useAI } from './hooks/useAI';
import { useTestCases } from './hooks/useTestCases';
import { useTheme } from './hooks/useTheme';
import { useAssetLinking } from './hooks/useAssetLinking';
import { useRecording } from './hooks/useRecording';
import { useRecommendations } from '../hooks/useRecommendations';
import { useArchiveTrash } from '../hooks/useArchiveTrash';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import FirestoreService from '../services';

// Import bulk actions components and utilities
import { 
  PAGE_CONFIGS, 
  COLOR_CLASSES, 
  BulkActionsPortal, 
  createBulkActionHandlers 
} from './BulkActionsProvider';

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

    // Enhanced recording hook integration
    const recordingHook = useRecording(slices);
    
    // Enhanced recording methods that use the new FirestoreService recordings interface
    const enhancedRecordingActions = useMemo(() => ({
        // Core recording operations using the new interface
        createRecording: async (suiteId, recordingData, sprintId = null) => {
            try {
                const result = await FirestoreService.recordings.createRecording(suiteId, recordingData, sprintId);
                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-create-success',
                        type: 'success',
                        message: 'Recording created successfully',
                        duration: 3000,
                    });
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-create-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        uploadAndCreateRecording: async (suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) => {
            try {
                slices.ui.actions.showNotification?.({
                    id: 'recording-upload-start',
                    type: 'info',
                    message: 'Uploading recording...',
                    duration: 3000,
                });

                const result = await FirestoreService.recordings.uploadAndCreateRecording(
                    suiteId, 
                    recordingBlob, 
                    metadata, 
                    sprintId, 
                    onProgress
                );

                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-upload-success',
                        type: 'success',
                        message: 'Recording uploaded and saved successfully',
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error?.message || 'Upload failed');
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-upload-error',
                    type: 'error',
                    message: `Upload failed: ${errorMessage}`,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        updateRecording: async (recordingId, updates, suiteId, sprintId = null) => {
            try {
                const result = await FirestoreService.recordings.updateRecording(recordingId, updates, suiteId, sprintId);
                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-update-success',
                        type: 'success',
                        message: 'Recording updated successfully',
                        duration: 3000,
                    });
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-update-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        getRecording: async (recordingId, suiteId, sprintId = null) => {
            try {
                return await FirestoreService.recordings.getRecording(recordingId, suiteId, sprintId);
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-get-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        getRecordings: async (suiteId, sprintId = null, options = {}) => {
            try {
                return await FirestoreService.recordings.getRecordings(suiteId, sprintId, options);
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recordings-get-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        deleteRecording: async (recordingId, suiteId, sprintId = null) => {
            try {
                const result = await FirestoreService.recordings.deleteRecording(recordingId, suiteId, sprintId);
                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-delete-success',
                        type: 'success',
                        message: 'Recording deleted successfully',
                        duration: 3000,
                    });
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-delete-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        // Service status and utility methods
        getRecordingServiceStatus: async () => {
            try {
                return await FirestoreService.recordings.getServiceStatus();
            } catch (error) {
                console.error('Error getting recording service status:', error);
                return { success: false, error: { message: getFirebaseErrorMessage(error) } };
            }
        },

        testYouTubeConnection: async () => {
            try {
                return await FirestoreService.recordings.testYouTubeConnection();
            } catch (error) {
                console.error('Error testing YouTube connection:', error);
                return { success: false, error: { message: getFirebaseErrorMessage(error) } };
            }
        },

        isYouTubeAvailable: async () => {
            try {
                return await FirestoreService.recordings.isYouTubeAvailable();
            } catch (error) {
                console.error('Error checking YouTube availability:', error);
                return false;
            }
        },

        getRecordingStatistics: async (suiteId, sprintId = null) => {
            try {
                return await FirestoreService.recordings.getStatistics(suiteId, sprintId);
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-stats-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        // URL utility methods
        getPlaybackUrl: (recordingData) => {
            try {
                return FirestoreService.recordings.getPlaybackUrl(recordingData);
            } catch (error) {
                console.error('Error getting playback URL:', error);
                return null;
            }
        },

        getVideoUrl: (recordingData) => {
            try {
                return FirestoreService.recordings.getVideoUrl(recordingData);
            } catch (error) {
                console.error('Error getting video URL:', error);
                return null;
            }
        },

        getRecordingInfo: (recordingData) => {
            try {
                return FirestoreService.recordings.getRecordingInfo(recordingData);
            } catch (error) {
                console.error('Error getting recording info:', error);
                return null;
            }
        },

        validateRecordingData: (recordingData) => {
            try {
                return FirestoreService.recordings.validateRecordingData(recordingData);
            } catch (error) {
                console.error('Error validating recording data:', error);
                return { valid: false, errors: [error.message] };
            }
        },

        // Enhanced linking with recordings
        linkRecordingToBug: async (recordingId, bugId, suiteId, sprintId = null) => {
            try {
                const result = await FirestoreService.linkRecordingToBug(recordingId, bugId, suiteId, sprintId);
                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-bug-link-success',
                        type: 'success',
                        message: 'Recording linked to bug successfully',
                        duration: 3000,
                    });
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-bug-link-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        unlinkRecordingFromBug: async (recordingId, bugId, suiteId, sprintId = null) => {
            try {
                const result = await FirestoreService.unlinkRecordingFromBug(recordingId, bugId, suiteId, sprintId);
                if (result.success) {
                    slices.ui.actions.showNotification?.({
                        id: 'recording-bug-unlink-success',
                        type: 'success',
                        message: 'Recording unlinked from bug successfully',
                        duration: 3000,
                    });
                }
                return result;
            } catch (error) {
                const errorMessage = getFirebaseErrorMessage(error);
                slices.ui.actions.showNotification?.({
                    id: 'recording-bug-unlink-error',
                    type: 'error',
                    message: errorMessage,
                    duration: 5000,
                });
                return { success: false, error: { message: errorMessage } };
            }
        },

        // Legacy compatibility - use the enhanced version but keep the old interface
        saveRecording: async (recordingData, suiteId, sprintId = null) => {
            return await enhancedRecordingActions.createRecording(suiteId, recordingData, sprintId);
        }

    }), [slices.ui.actions]);

    // Initialize recommendations hook only if slice exists
    const recommendationsHook = hasRecommendationsSlice 
        ? useRecommendations(slices.recommendations, slices.auth, slices.suites, slices.ui)
        : null;

    // Safe recommendations actions with fallbacks
    const {
        createRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        updateRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        deleteRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        voteOnRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        addComment = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        removeComment = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        setFilters = () => {},
        setSortConfig = () => {},
        setViewMode = () => {},
        openModal = () => {},
        closeModal = () => {},
        resetFilters = () => {},
        cleanup: cleanupRecommendations = () => {}
    } = recommendationsHook || {};

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

    // Wrapped archive operations
    const archiveItem = createArchiveOperation((suiteId, assetType, assetId, sprintId = null, reason = null) => {
        const methodMap = {
            testCases: 'archiveTestCase',
            bugs: 'archiveBug',
            recordings: 'archiveRecording',
            sprints: 'archiveSprint',
            recommendations: 'archiveRecommendation'
        };
        const method = methodMap[assetType];
        if (!method) throw new Error(`Unknown asset type: ${assetType}`);
        return FirestoreService[method](suiteId, assetId, sprintId, reason);
    });

    const unarchiveItem = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        const methodMap = {
            testCases: 'unarchiveTestCase',
            bugs: 'unarchiveBug',
            recordings: 'unarchiveRecording',
            sprints: 'unarchiveSprint',
            recommendations: 'unarchiveRecommendation'
        };
        const method = methodMap[assetType];
        if (!method) throw new Error(`Unknown asset type: ${assetType}`);
        return FirestoreService[method](suiteId, assetId, sprintId);
    });

    const moveToTrash = createArchiveOperation((suiteId, assetType, assetId, sprintId = null, reason = null) => {
        const methodMap = {
            testCases: 'moveTestCaseToTrash',
            bugs: 'moveBugToTrash',
            recordings: 'moveRecordingToTrash',
            sprints: 'moveSprintToTrash',
            recommendations: 'moveRecommendationToTrash'
        };
        const method = methodMap[assetType];
        if (!method) throw new Error(`Unknown asset type: ${assetType}`);
        return FirestoreService[method](suiteId, assetId, sprintId, reason);
    });

    const restoreFromTrash = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        const methodMap = {
            testCases: 'restoreTestCaseFromTrash',
            bugs: 'restoreBugFromTrash',
            recordings: 'restoreRecordingFromTrash',
            sprints: 'restoreSprintFromTrash',
            recommendations: 'restoreRecommendationFromTrash'
        };
        const method = methodMap[assetType];
        if (!method) throw new Error(`Unknown asset type: ${assetType}`);
        return FirestoreService[method](suiteId, assetId, sprintId);
    });

    const permanentlyDelete = createArchiveOperation((suiteId, assetType, assetId, sprintId = null) => {
        const methodMap = {
            testCases: 'permanentlyDeleteTestCase',
            bugs: 'permanentlyDeleteBug',
            recordings: 'permanentlyDeleteRecording',
            sprints: 'permanentlyDeleteSprint',
            recommendations: 'permanentlyDeleteRecommendation'
        };
        const method = methodMap[assetType];
        if (!method) throw new Error(`Unknown asset type: ${assetType}`);
        return FirestoreService[method](suiteId, assetId, sprintId);
    });

    const bulkArchive = createArchiveOperation((suiteId, assetType, assetIds, sprintId = null, reason = null) => {
        return FirestoreService.batchArchiveAssets(suiteId, assetType, assetIds, sprintId, reason);
    });

    const bulkRestore = createArchiveOperation((suiteId, assetType, assetIds, sprintId = null, fromTrash = false) => {
        return fromTrash 
            ? FirestoreService.batchRestoreFromTrash(suiteId, assetType, assetIds, sprintId)
            : FirestoreService.batchRestoreFromArchive(suiteId, assetType, assetIds, sprintId);
    });

    const bulkPermanentDelete = createArchiveOperation((suiteId, assetType, assetIds, sprintId = null) => {
        return FirestoreService.batchPermanentDeleteAssets(suiteId, assetType, assetIds, sprintId);
    });

    const loadArchivedItems = async (suiteId, assetType, sprintId = null) => {
        try {
            const result = await FirestoreService.getArchivedItems(suiteId, assetType, sprintId);
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
            const result = await FirestoreService.getTrashedItems(suiteId, assetType, sprintId);
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

    // Auth state management effect (unchanged from your original)
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

    // Asset subscriptions effect - Enhanced for recordings
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
            
            if (hasRecommendationsSlice) {
                try {
                    if (slices.recommendations.actions.loadRecommendationsSuccess) {
                        slices.recommendations.actions.loadRecommendationsSuccess([]);
                    }
                } catch (e) { console.warn('Recommendations clear error:', e.message); }
            }
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
            try {
                const methodName = `subscribeTo${type}`;
                if (typeof FirestoreService[methodName] !== 'function') {
                    console.error(`FirestoreService.${methodName} is not a function`);
                    loadSuccess([]);
                    return;
                }

                assetUnsubscribersRef.current[type] = FirestoreService[methodName](
                    suiteId,
                    (assets) => {
                        const safeAssets = Array.isArray(assets) ? assets : [];
                        console.log(`${type} loaded:`, safeAssets.length);
                        loadSuccess(safeAssets);
                    },
                    (error) => {
                        let actualError = error;
                        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
                            actualError = new Error(`Unknown error in ${type} subscription`);
                        }

                        const errorMessage = getFirebaseErrorMessage(actualError);

                        if (actualError?.code !== 'permission-denied') {
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

        // Subscribe to existing assets
        if (slices.testCases.actions.loadTestCasesSuccess) {
            subscribeAsset('TestCases', slices.testCases.actions.loadTestCasesSuccess);
        }
        if (slices.bugs.actions.loadBugsSuccess) {
            subscribeAsset('Bugs', slices.bugs.actions.loadBugsSuccess);
        }
        
        // Enhanced recordings subscription using the new interface
        if (slices.recordings.actions.loadRecordingsSuccess) {
            try {
                console.log('Setting up enhanced recordings subscription...');
                assetUnsubscribersRef.current['Recordings'] = FirestoreService.recordings.subscribeToRecordings(
                    suiteId,
                    (recordings) => {
                        const safeRecordings = Array.isArray(recordings) ? recordings : [];
                        console.log('Recordings loaded with enhanced data:', {
                            count: safeRecordings.length,
                            sampleRecording: safeRecordings[0] ? {
                                id: safeRecordings[0].id,
                                title: safeRecordings[0].title,
                                provider: safeRecordings[0].provider,
                                hasPlaybackUrl: !!safeRecordings[0].playbackUrl,
                                hasDirectUrl: !!safeRecordings[0].directUrl,
                                isYouTube: safeRecordings[0].isYouTube,
                                isFirebase: safeRecordings[0].isFirebase,
                                stats: safeRecordings[0].stats
                            } : null
                        });
                        slices.recordings.actions.loadRecordingsSuccess(safeRecordings);
                    },
                    (error) => {
                        let actualError = error;
                        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
                            actualError = new Error('Unknown error in Recordings subscription');
                        }

                        const errorMessage = getFirebaseErrorMessage(actualError);
                        console.error('Enhanced recordings subscription error:', actualError);

                        if (actualError?.code !== 'permission-denied') {
                            slices.ui.actions.showNotification?.({
                                id: 'recordings-subscription-error',
                                type: 'error',
                                message: `Failed to load recordings: ${errorMessage}`,
                                duration: 5000,
                            });
                        }

                        slices.recordings.actions.loadRecordingsSuccess([]);
                    }
                );
            } catch (error) {
                console.error('Error setting up enhanced recordings subscription:', error);
                slices.recordings.actions.loadRecordingsSuccess([]);
            }
        }

        // For sprints subscription
        try {
            const methodName = 'subscribeToSprints';
            if (typeof FirestoreService[methodName] === 'function') {
                assetUnsubscribersRef.current['Sprints'] = FirestoreService[methodName](
                    suiteId,
                    (sprints) => {
                        const safeSprints = Array.isArray(sprints) ? sprints : [];
                        console.log('Sprints loaded:', safeSprints.length);
                    },
                    (error) => {
                        let actualError = error;
                        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
                            actualError = new Error('Unknown error in Sprints subscription');
                        }

                        const errorMessage = getFirebaseErrorMessage(actualError);

                        if (actualError?.code !== 'permission-denied') {
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

        // Subscribe to recommendations if slice exists
        if (hasRecommendationsSlice && slices.recommendations.actions.loadRecommendationsSuccess) {
            subscribeAsset('Recommendations', slices.recommendations.actions.loadRecommendationsSuccess);
        }

        return () => {
            console.log('Cleaning up asset subscriptions');
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

    // Enhanced delete methods that use the FirestoreService's soft delete (move to trash)
    const enhancedDeleteTestCase = async (testCaseId, suiteId, sprintId = null) => {
        return await moveToTrash(suiteId, 'testCases', testCaseId, sprintId, 'User deletion');
    };

    const enhancedDeleteBug = async (bugId, suiteId, sprintId = null) => {
        return await moveToTrash(suiteId, 'bugs', bugId, sprintId, 'User deletion');
    };

    const enhancedDeleteRecording = async (recordingId, suiteId, sprintId = null) => {
        return await moveToTrash(suiteId, 'recordings', recordingId, sprintId, 'User deletion');
    };

    const enhancedDeleteSprint = async (sprintId, suiteId) => {
        return await moveToTrash(suiteId, 'sprints', sprintId, null, 'User deletion');
    };

    const enhancedDeleteRecommendation = async (recommendationId, suiteId, sprintId = null) => {
        return await moveToTrash(suiteId, 'recommendations', recommendationId, sprintId, 'User deletion');
    };

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

    // Bulk actions methods
    const bulkActionMethods = useMemo(() => {
        // Create a reference object for the current app actions
        const appActionsRef = {
            get current() {
                return {
                    testCases: {
                        ...slices.testCases.actions,
                        createTestCase: wrappedCreateTestCase,
                        updateTestCase: wrappedUpdateTestCase,
                        deleteTestCase: enhancedDeleteTestCase
                    },
                    bugs: {
                        ...slices.bugs.actions,
                        deleteBug: enhancedDeleteBug
                    },
                    recordings: { 
                        ...slices.recordings.actions, 
                        ...enhancedRecordingActions,
                        deleteRecording: enhancedDeleteRecording
                    },
                    sprints: {
                        ...slices.sprints.actions,
                        deleteSprint: enhancedDeleteSprint
                    },
                    recommendations: {
                        createRecommendation,
                        updateRecommendation,
                        deleteRecommendation: enhancedDeleteRecommendation,
                        voteOnRecommendation,
                        addComment,
                        removeComment,
                    },
                    archive: {
                        archiveItem,
                        unarchiveItem,
                        moveToTrash,
                        restoreFromTrash,
                        permanentlyDelete,
                        bulkArchive,
                        bulkRestore,
                        bulkPermanentDelete,
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
                    },
                    reports: {
                        getReports,
                        saveReport,
                        deleteReport,
                        generatePDF,
                    },
                    ui: slices.ui.actions
                };
            }
        };

        return {
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
                const { currentPageType, onBulkAction } = bulkActions;
                
                // Use custom bulk action handler if provided
                if (onBulkAction) {
                    await onBulkAction(actionId, items);
                    return;
                }

                // Use default bulk action handlers
                const activeSuite = slices.suites.state.activeSuite;
                if (!activeSuite) {
                    slices.ui.actions.showNotification?.({
                        id: 'bulk-no-suite',
                        type: 'error',
                        message: 'No active suite selected',
                        duration: 3000,
                    });
                    return;
                }

                const bulkHandlers = createBulkActionHandlers(appActionsRef.current, activeSuite);
                const handler = bulkHandlers[currentPageType];
                
                if (handler) {
                    await handler(actionId, items);
                } else {
                    console.warn(`No bulk action handler for page type: ${currentPageType}`);
                    slices.ui.actions.showNotification?.({
                        id: 'bulk-unsupported',
                        type: 'warning',
                        message: `Bulk actions not supported for ${currentPageType}`,
                        duration: 3000,
                    });
                }
            }
        };
    }, [
        bulkActions,
        slices,
        wrappedCreateTestCase,
        wrappedUpdateTestCase,
        enhancedRecordingActions,
        createRecommendation,
        updateRecommendation,
        voteOnRecommendation,
        addComment,
        removeComment,
        archiveItem,
        unarchiveItem,
        moveToTrash,
        restoreFromTrash,
        permanentlyDelete,
        bulkArchive,
        bulkRestore,
        bulkPermanentDelete,
        getReports,
        saveReport,
        deleteReport,
        generatePDF
    ]);

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
                // Add recommendations state if available
                ...(hasRecommendationsSlice && { recommendations: slices.recommendations.state }),
                // Archive/trash state
                archivedItems,
                trashedItems,
                archiveLoading,
                // Bulk actions state
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
                    deleteBug: enhancedDeleteBug
                },
                // Enhanced recordings actions using the new interface
                recordings: { 
                    ...slices.recordings.actions, 
                    ...enhancedRecordingActions,
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
                
                // Organization actions
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

                // Reports actions
                reports: {
                    getReports,
                    saveReport,
                    deleteReport,
                    generatePDF,
                    toggleSchedule: FirestoreService.reports.toggleSchedule.bind(FirestoreService.reports),
                    subscribeToTriggers: FirestoreService.reports.subscribeToTriggers.bind(FirestoreService.reports),
                },
                
                // Recommendations actions (with fallbacks if slice doesn't exist)
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
                    // Enhanced recording linking
                    linkRecordingToBug: enhancedRecordingActions.linkRecordingToBug,
                    unlinkRecordingFromBug: enhancedRecordingActions.unlinkRecordingFromBug,
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

            // Enhanced recordings state
            recordingsServiceStatus: null, // Can be populated via getRecordingServiceStatus
            youTubeAvailable: null, // Can be populated via isYouTubeAvailable
            recordingStatistics: null, // Can be populated via getRecordingStatistics

            isLoading:
                slices.auth.state.loading ||
                slices.suites.state.loading ||
                slices.testCases.state.loading ||
                (slices.bugs.state.loading && slices.bugs.state.bugs.length === 0) ||
                slices.recordings.state.loading ||
                slices.sprints.state.loading ||
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
            enhancedRecordingActions,
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
            getAssetCounts,
            bulkActionMethods,
            bulkActions,
        ]
    );

    return (
        <AppContext.Provider value={value}>
          {children}
          {/* Render bulk actions portal if we have selections and a container */}
          {bulkActions.portalContainer && bulkActions.selectedItems.length > 0 && 
            createPortal(
              <BulkActionsPortal
                selectedItems={bulkActions.selectedItems}
                pageType={bulkActions.currentPageType}
                onAction={bulkActionMethods.executeBulkAction}
                onClear={bulkActionMethods.clearBulkSelection}
              />,
              bulkActions.portalContainer
            )
          }
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