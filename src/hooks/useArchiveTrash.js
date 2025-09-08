import { useState, useCallback } from 'react';
import { handleFirebaseOperation, getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';
import FirestoreService from '../services';

export const useArchiveTrash = (uiActions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [archivedItems, setArchivedItems] = useState([]);
    const [trashedItems, setTrashedItems] = useState([]);

    // ========================
    // ARCHIVE OPERATIONS
    // ========================

    const archiveItem = useCallback(async (suiteId, assetType, assetId, sprintId = null, reason = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const methodMap = {
                    testCases: 'archiveTestCase',
                    bugs: 'archiveBug',
                    recordings: 'archiveRecording',
                    sprints: 'archiveSprint'
                };

                const methodName = methodMap[assetType];
                if (!methodName) {
                    throw new Error(`Unsupported asset type: ${assetType}`);
                }

                const result = await FirestoreService[methodName](suiteId, assetId, sprintId, reason);
                
                if (result.success) {
                    uiActions?.showNotification({
                        id: `archive-${assetId}`,
                        type: 'success',
                        message: `Item archived successfully`,
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to archive item'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const unarchiveItem = useCallback(async (suiteId, assetType, assetId, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const methodMap = {
                    testCases: 'unarchiveTestCase',
                    bugs: 'unarchiveBug',
                    recordings: 'unarchiveRecording',
                    sprints: 'unarchiveSprint'
                };

                const methodName = methodMap[assetType];
                if (!methodName) {
                    throw new Error(`Unsupported asset type: ${assetType}`);
                }

                const result = await FirestoreService[methodName](suiteId, assetId, sprintId);
                
                if (result.success) {
                    uiActions?.showNotification({
                        id: `unarchive-${assetId}`,
                        type: 'success',
                        message: `Item restored from archive`,
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to restore item from archive'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    // ========================
    // TRASH OPERATIONS
    // ========================

    const moveToTrash = useCallback(async (suiteId, assetType, assetId, sprintId = null, reason = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const methodMap = {
                    testCases: 'moveTestCaseToTrash',
                    bugs: 'moveBugToTrash',
                    recordings: 'moveRecordingToTrash',
                    sprints: 'moveSprintToTrash'
                };

                const methodName = methodMap[assetType];
                if (!methodName) {
                    throw new Error(`Unsupported asset type: ${assetType}`);
                }

                const result = await FirestoreService[methodName](suiteId, assetId, sprintId, reason);
                
                if (result.success) {
                    uiActions?.showNotification({
                        id: `trash-${assetId}`,
                        type: 'success',
                        message: `Item moved to trash`,
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to move item to trash'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const restoreFromTrash = useCallback(async (suiteId, assetType, assetId, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const methodMap = {
                    testCases: 'restoreTestCaseFromTrash',
                    bugs: 'restoreBugFromTrash',
                    recordings: 'restoreRecordingFromTrash',
                    sprints: 'restoreSprintFromTrash'
                };

                const methodName = methodMap[assetType];
                if (!methodName) {
                    throw new Error(`Unsupported asset type: ${assetType}`);
                }

                const result = await FirestoreService[methodName](suiteId, assetId, sprintId);
                
                if (result.success) {
                    uiActions?.showNotification({
                        id: `restore-${assetId}`,
                        type: 'success',
                        message: `Item restored from trash`,
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to restore item from trash'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const permanentlyDelete = useCallback(async (suiteId, assetType, assetId, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const methodMap = {
                    testCases: 'permanentlyDeleteTestCase',
                    bugs: 'permanentlyDeleteBug',
                    recordings: 'permanentlyDeleteRecording',
                    sprints: 'permanentlyDeleteSprint'
                };

                const methodName = methodMap[assetType];
                if (!methodName) {
                    throw new Error(`Unsupported asset type: ${assetType}`);
                }

                const result = await FirestoreService[methodName](suiteId, assetId, sprintId);
                
                if (result.success) {
                    uiActions?.showNotification({
                        id: `permanent-delete-${assetId}`,
                        type: 'success',
                        message: `Item permanently deleted`,
                        duration: 3000,
                    });
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to permanently delete item'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    // ========================
    // BULK OPERATIONS
    // ========================

    const bulkArchive = useCallback(async (suiteId, assetType, assetIds, sprintId = null, reason = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
                
                if (result.success) {
                    const { successCount, failureCount } = result.summary;
                    uiActions?.showNotification({
                        id: 'bulk-archive',
                        type: successCount > 0 ? 'success' : 'error',
                        message: `Archived ${successCount} items${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                        duration: 5000,
                    });
                } else {
                    throw new Error('Bulk archive operation failed');
                }

                return result;
            },
            uiActions,
            'Failed to archive items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const bulkRestore = useCallback(async (suiteId, assetType, assetIds, sprintId = null, fromTrash = false) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.bulkRestore(suiteId, assetType, assetIds, sprintId, fromTrash);
                
                if (result.success) {
                    const { successCount, failureCount } = result.summary;
                    const action = fromTrash ? 'Restored from trash' : 'Restored from archive';
                    uiActions?.showNotification({
                        id: 'bulk-restore',
                        type: successCount > 0 ? 'success' : 'error',
                        message: `${action} ${successCount} items${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                        duration: 5000,
                    });
                } else {
                    throw new Error('Bulk restore operation failed');
                }

                return result;
            },
            uiActions,
            'Failed to restore items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const bulkPermanentDelete = useCallback(async (suiteId, assetType, assetIds, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
                
                if (result.success) {
                    const { successCount, failureCount } = result.summary;
                    uiActions?.showNotification({
                        id: 'bulk-permanent-delete',
                        type: successCount > 0 ? 'success' : 'error',
                        message: `Permanently deleted ${successCount} items${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                        duration: 5000,
                    });
                } else {
                    throw new Error('Bulk permanent delete operation failed');
                }

                return result;
            },
            uiActions,
            'Failed to permanently delete items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    // ========================
    // QUERY OPERATIONS
    // ========================

    const loadArchivedItems = useCallback(async (suiteId, assetType, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.getArchivedItems(suiteId, assetType, sprintId);
                
                if (result.success) {
                    setArchivedItems(result.data);
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to load archived items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const loadTrashedItems = useCallback(async (suiteId, assetType, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.getTrashedItems(suiteId, assetType, sprintId);
                
                if (result.success) {
                    setTrashedItems(result.data);
                } else {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to load trashed items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    const loadExpiredItems = useCallback(async (suiteId, assetType, sprintId = null) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.getExpiredItems(suiteId, assetType, sprintId);
                
                if (!result.success) {
                    throw new Error(result.error.message);
                }

                return result;
            },
            uiActions,
            'Failed to load expired items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    // ========================
    // CLEANUP OPERATIONS
    // ========================

    const cleanupExpiredItems = useCallback(async (suiteId, assetType, sprintId = null, dryRun = false) => {
        return await handleFirebaseOperation(
            async () => {
                setIsLoading(true);
                
                const result = await FirestoreService.cleanupExpiredItems(suiteId, assetType, sprintId, dryRun);
                
                if (result.success) {
                    if (dryRun) {
                        uiActions?.showNotification({
                            id: 'cleanup-preview',
                            type: 'info',
                            message: `${result.totalItemsToCleanup} expired items found that can be cleaned up`,
                            duration: 5000,
                        });
                    } else {
                        const { successCount, failureCount } = result.summary;
                        uiActions?.showNotification({
                            id: 'cleanup-complete',
                            type: successCount > 0 ? 'success' : 'warning',
                            message: `Cleaned up ${successCount} expired items${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
                            duration: 5000,
                        });
                    }
                } else {
                    throw new Error('Cleanup operation failed');
                }

                return result;
            },
            uiActions,
            'Failed to cleanup expired items'
        ).finally(() => setIsLoading(false));
    }, [uiActions]);

    return {
        // State
        isLoading,
        archivedItems,
        trashedItems,

        // Archive operations
        archiveItem,
        unarchiveItem,

        // Trash operations
        moveToTrash,
        restoreFromTrash,
        permanentlyDelete,

        // Bulk operations
        bulkArchive,
        bulkRestore,
        bulkPermanentDelete,

        // Query operations
        loadArchivedItems,
        loadTrashedItems,
        loadExpiredItems,

        // Cleanup operations
        cleanupExpiredItems,
    };
};

export default useArchiveTrash;