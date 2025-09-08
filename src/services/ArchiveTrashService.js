import { BaseFirestoreService } from './firestoreService';
import { collection, doc, runTransaction, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export class ArchiveTrashService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
        
        // Default retention periods (in days)
        this.DEFAULT_ARCHIVE_RETENTION = 365; // 1 year
        this.DEFAULT_TRASH_RETENTION = 30;    // 30 days
    }

    // ========================
    // ARCHIVE OPERATIONS
    // ========================

    async archiveAsset(suiteId, assetType, assetId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive items' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                // Get the original asset data
                const assetPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}/${assetId}`
                    : `testSuites/${suiteId}/${assetType}/${assetId}`;

                const assetRef = doc(db, assetPath);
                const assetDoc = await transaction.get(assetRef);

                if (!assetDoc.exists()) {
                    throw new Error(`${assetType.slice(0, -1)} not found`);
                }

                const assetData = assetDoc.data();

                // Create archive record - following Firestore rules structure
                const archiveRef = doc(collection(db, `testSuites/${suiteId}/archive`));
                const archiveData = {
                    id: archiveRef.id,
                    original_id: assetId,
                    asset_type: assetType,
                    sprint_id: sprintId,
                    suite_id: suiteId, // Required by Firestore rules
                    asset_id: assetId,  // Required by Firestore rules
                    original_data: assetData,
                    archived_at: serverTimestamp(),
                    archived_by: userId,
                    archive_reason: reason || 'Manual archive',
                    archive_retention_until: new Date(Date.now() + (this.DEFAULT_ARCHIVE_RETENTION * 24 * 60 * 60 * 1000)),
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                transaction.set(archiveRef, archiveData);

                // Update original asset with archived status instead of deleting
                const archivedAssetData = {
                    ...assetData,
                    status: 'archived',
                    archived_at: serverTimestamp(),
                    archived_by: userId,
                    archive_reason: reason || 'Manual archive',
                    archive_record_id: archiveRef.id,
                    updated_at: serverTimestamp(),
                    updated_by: userId
                };

                transaction.set(assetRef, archivedAssetData);

                return {
                    success: true,
                    archivedId: assetId,
                    archiveRecordId: archiveRef.id,
                    archivedAt: new Date(),
                    retentionUntil: archiveData.archive_retention_until
                };
            });

            return {
                success: true,
                message: 'Item archived successfully',
                ...result
            };

        } catch (error) {
            console.error('archiveAsset error:', error);
            return { success: false, error: { message: error.message || 'Failed to archive item' } };
        }
    }

    async unarchiveAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore items' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                // Get the current archived asset
                const assetPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}/${assetId}`
                    : `testSuites/${suiteId}/${assetType}/${assetId}`;

                const assetRef = doc(db, assetPath);
                const assetDoc = await transaction.get(assetRef);

                if (!assetDoc.exists() || assetDoc.data().status !== 'archived') {
                    throw new Error('Archived item not found');
                }

                const assetData = assetDoc.data();
                const archiveRecordId = assetData.archive_record_id;

                // Remove archived status and metadata
                const {
                    status: _status,
                    archived_at: _archived_at,
                    archived_by: _archived_by,
                    archive_reason: _archive_reason,
                    archive_record_id: _archive_record_id,
                    ...restoredData
                } = assetData;

                const finalRestoredData = {
                    ...restoredData,
                    restored_at: serverTimestamp(),
                    restored_by: userId,
                    updated_at: serverTimestamp(),
                    updated_by: userId
                };

                transaction.set(assetRef, finalRestoredData);

                // Delete archive record if it exists
                if (archiveRecordId) {
                    const archiveRef = doc(db, `testSuites/${suiteId}/archive/${archiveRecordId}`);
                    transaction.delete(archiveRef);
                }

                return {
                    success: true,
                    restoredId: assetId
                };
            });

            return {
                success: true,
                message: 'Item restored from archive successfully',
                ...result
            };

        } catch (error) {
            console.error('unarchiveAsset error:', error);
            return { success: false, error: { message: error.message || 'Failed to restore item' } };
        }
    }

    // ========================
    // TRASH OPERATIONS (Soft Delete)
    // ========================

    async softDeleteAsset(suiteId, assetType, assetId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete items' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                // Get the original asset data
                const assetPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}/${assetId}`
                    : `testSuites/${suiteId}/${assetType}/${assetId}`;

                const assetRef = doc(db, assetPath);
                const assetDoc = await transaction.get(assetRef);

                if (!assetDoc.exists()) {
                    throw new Error(`${assetType.slice(0, -1)} not found`);
                }

                const assetData = assetDoc.data();
                const expiresAt = new Date(Date.now() + (this.DEFAULT_TRASH_RETENTION * 24 * 60 * 60 * 1000));

                // Create trash record - following Firestore rules structure
                const trashRef = doc(collection(db, `testSuites/${suiteId}/trash`));
                const trashData = {
                    id: trashRef.id,
                    original_id: assetId,
                    asset_type: assetType,
                    sprint_id: sprintId,
                    suite_id: suiteId,     // Required by Firestore rules
                    asset_id: assetId,     // Required by Firestore rules
                    original_data: assetData,
                    deleted_at: serverTimestamp(),
                    deleted_by: userId,
                    delete_reason: reason || 'Manual deletion',
                    expires_at: expiresAt, // Required by Firestore rules
                    delete_retention_until: expiresAt,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                };

                transaction.set(trashRef, trashData);

                // Update original asset with deleted status instead of deleting
                const deletedAssetData = {
                    ...assetData,
                    status: 'deleted',
                    deleted_at: serverTimestamp(),
                    deleted_by: userId,
                    delete_reason: reason || 'Manual deletion',
                    trash_record_id: trashRef.id,
                    expires_at: expiresAt,
                    updated_at: serverTimestamp(),
                    updated_by: userId
                };

                transaction.set(assetRef, deletedAssetData);

                return {
                    success: true,
                    deletedId: assetId,
                    trashRecordId: trashRef.id,
                    deletedAt: new Date(),
                    expiresAt: expiresAt
                };
            });

            return {
                success: true,
                message: 'Item moved to trash successfully',
                ...result
            };

        } catch (error) {
            console.error('softDeleteAsset error:', error);
            return { success: false, error: { message: error.message || 'Failed to delete item' } };
        }
    }

    async restoreFromTrash(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore items' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                // Get the current deleted asset
                const assetPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}/${assetId}`
                    : `testSuites/${suiteId}/${assetType}/${assetId}`;

                const assetRef = doc(db, assetPath);
                const assetDoc = await transaction.get(assetRef);

                if (!assetDoc.exists() || assetDoc.data().status !== 'deleted') {
                    throw new Error('Deleted item not found');
                }

                const assetData = assetDoc.data();
                const trashRecordId = assetData.trash_record_id;

                // Remove deleted status and metadata
                const restoredData = { ...assetData };
                delete restoredData.status;
                delete restoredData.deleted_at;
                delete restoredData.deleted_by;
                delete restoredData.delete_reason;
                delete restoredData.trash_record_id;
                delete restoredData.expires_at;

                const finalRestoredData = {
                    ...restoredData,
                    restored_at: serverTimestamp(),
                    restored_by: userId,
                    updated_at: serverTimestamp(),
                    updated_by: userId
                };

                transaction.set(assetRef, finalRestoredData);

                // Delete trash record if it exists
                if (trashRecordId) {
                    const trashRef = doc(db, `testSuites/${suiteId}/trash/${trashRecordId}`);
                    transaction.delete(trashRef);
                }

                return {
                    success: true,
                    restoredId: assetId
                };
            });

            return {
                success: true,
                message: 'Item restored from trash successfully',
                ...result
            };

        } catch (error) {
            console.error('restoreFromTrash error:', error);
            return { success: false, error: { message: error.message || 'Failed to restore item' } };
        }
    }

    async permanentlyDeleteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to permanently delete items' } };
        }

        try {
            const result = await runTransaction(db, async (transaction) => {
                // Delete the actual asset
                const assetPath = sprintId
                    ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}/${assetId}`
                    : `testSuites/${suiteId}/${assetType}/${assetId}`;

                const assetRef = doc(db, assetPath);
                const assetDoc = await transaction.get(assetRef);

                if (!assetDoc.exists()) {
                    throw new Error('Asset not found');
                }

                const assetData = assetDoc.data();
                
                // Delete the asset
                transaction.delete(assetRef);

                // Delete trash record if it exists
                if (assetData.trash_record_id) {
                    const trashRef = doc(db, `testSuites/${suiteId}/trash/${assetData.trash_record_id}`);
                    transaction.delete(trashRef);
                }

                return {
                    success: true,
                    deletedId: assetId
                };
            });

            return {
                success: true,
                message: 'Item permanently deleted',
                ...result
            };

        } catch (error) {
            console.error('permanentlyDeleteAsset error:', error);
            return { success: false, error: { message: error.message || 'Failed to permanently delete item' } };
        }
    }

    // ========================
    // BULK OPERATIONS
    // ========================

    async bulkArchive(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const assetId of assetIds) {
            try {
                const result = await this.archiveAsset(suiteId, assetType, assetId, sprintId, reason);
                results.push({ assetId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ assetId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: { successCount, failureCount, totalProcessed: assetIds.length }
        };
    }

    async bulkRestore(suiteId, assetType, assetIds, sprintId = null, fromTrash = false) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const assetId of assetIds) {
            try {
                const result = fromTrash 
                    ? await this.restoreFromTrash(suiteId, assetType, assetId, sprintId)
                    : await this.unarchiveAsset(suiteId, assetType, assetId, sprintId);
                results.push({ assetId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ assetId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: { successCount, failureCount, totalProcessed: assetIds.length }
        };
    }

    async bulkPermanentDelete(suiteId, assetType, assetIds, sprintId = null) {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const assetId of assetIds) {
            try {
                const result = await this.permanentlyDeleteAsset(suiteId, assetType, assetId, sprintId);
                results.push({ assetId, result });
                if (result.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({ assetId, result: { success: false, error: { message: error.message } } });
                failureCount++;
            }
        }

        return {
            success: successCount > 0,
            results,
            summary: { successCount, failureCount, totalProcessed: assetIds.length }
        };
    }

    // ========================
    // QUERY METHODS
    // ========================

    async getArchivedAssets(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to view archived items' } };
        }

        try {
            // Query assets with archived status
            const assetCollection = sprintId 
                ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
                : `testSuites/${suiteId}/${assetType}`;

            const archivedQuery = query(
                collection(db, assetCollection),
                where('status', '==', 'archived'),
                orderBy('archived_at', 'desc'),
                limit(100) // Prevent large queries
            );

            const snapshot = await getDocs(archivedQuery);
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    type: assetType,
                    name: docData.name || docData.title,
                    title: docData.title || docData.name,
                    archived_at: docData.archived_at,
                    archived_by: docData.archived_by,
                    archive_reason: docData.archive_reason,
                    archive_retention_until: docData.archive_retention_until,
                    sprint_id: sprintId,
                    original_data: docData
                };
            });

            return { success: true, data };

        } catch (error) {
            console.error('getArchivedAssets error:', error);
            return { success: false, error: { message: error.message || 'Failed to fetch archived items' } };
        }
    }

    async getTrashedAssets(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to view deleted items' } };
        }

        try {
            // Query assets with deleted status
            const assetCollection = sprintId 
                ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
                : `testSuites/${suiteId}/${assetType}`;

            const trashedQuery = query(
                collection(db, assetCollection),
                where('status', '==', 'deleted'),
                orderBy('deleted_at', 'desc'),
                limit(100) // Prevent large queries
            );

            const snapshot = await getDocs(trashedQuery);
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    type: assetType,
                    name: docData.name || docData.title,
                    title: docData.title || docData.name,
                    deleted_at: docData.deleted_at,
                    deleted_by: docData.deleted_by,
                    delete_reason: docData.delete_reason,
                    expires_at: docData.expires_at,
                    sprint_id: sprintId,
                    original_data: docData
                };
            });

            return { success: true, data };

        } catch (error) {
            console.error('getTrashedAssets error:', error);
            return { success: false, error: { message: error.message || 'Failed to fetch deleted items' } };
        }
    }

    async getExpiredItems(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to view expired items' } };
        }

        try {
            const now = new Date();
            
            // Query deleted items that have expired
            const assetCollection = sprintId 
                ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
                : `testSuites/${suiteId}/${assetType}`;

            const expiredQuery = query(
                collection(db, assetCollection),
                where('status', '==', 'deleted'),
                where('expires_at', '<', now),
                orderBy('expires_at', 'asc'),
                limit(50) // Limit for performance
            );

            const snapshot = await getDocs(expiredQuery);
            const expiredItems = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || doc.data().title,
                deleted_at: doc.data().deleted_at,
                expires_at: doc.data().expires_at
            }));

            return {
                success: true,
                data: {
                    expiredDeleted: expiredItems,
                    totalExpired: expiredItems.length
                }
            };

        } catch (error) {
            console.error('getExpiredItems error:', error);
            return { success: false, error: { message: error.message || 'Failed to fetch expired items' } };
        }
    }

    // ========================
    // CLEANUP OPERATIONS
    // ========================

    async cleanupExpiredItems(suiteId, assetType, sprintId = null, dryRun = false) {
        const expiredResult = await this.getExpiredItems(suiteId, assetType, sprintId);
        
        if (!expiredResult.success) {
            return expiredResult;
        }

        const { expiredDeleted } = expiredResult.data;
        let cleanupResults = [];

        if (dryRun) {
            return {
                success: true,
                dryRun: true,
                itemsToCleanup: {
                    expiredDeleted: expiredDeleted.map(item => ({ 
                        id: item.id, 
                        name: item.name, 
                        deleted_at: item.deleted_at,
                        expires_at: item.expires_at
                    }))
                },
                totalItemsToCleanup: expiredDeleted.length
            };
        }

        // Permanently delete expired items
        for (const item of expiredDeleted) {
            const result = await this.permanentlyDeleteAsset(suiteId, assetType, item.id, sprintId);
            cleanupResults.push({
                id: item.id,
                name: item.name,
                action: 'permanently_deleted',
                result
            });
        }

        const successCount = cleanupResults.filter(r => r.result.success).length;
        const failureCount = cleanupResults.length - successCount;

        return {
            success: successCount > 0,
            cleanupResults,
            summary: { successCount, failureCount, totalProcessed: cleanupResults.length }
        };
    }

    // ========================
    // UTILITY METHODS
    // ========================

    async getAssetCounts(suiteId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions' } };
        }

        try {
            const assetTypes = ['testCases', 'bugs', 'recommendations', 'recordings', 'sprints'];
            const counts = {
                active: {},
                archived: {},
                deleted: {},
                total: {}
            };

            for (const assetType of assetTypes) {
                const assetCollection = collection(db, `testSuites/${suiteId}/${assetType}`);
                
                // Count active assets
                const activeQuery = query(assetCollection, where('status', '!=', 'archived'), where('status', '!=', 'deleted'));
                const activeSnapshot = await getDocs(activeQuery);
                counts.active[assetType] = activeSnapshot.size;

                // Count archived assets
                const archivedQuery = query(assetCollection, where('status', '==', 'archived'));
                const archivedSnapshot = await getDocs(archivedQuery);
                counts.archived[assetType] = archivedSnapshot.size;

                // Count deleted assets
                const deletedQuery = query(assetCollection, where('status', '==', 'deleted'));
                const deletedSnapshot = await getDocs(deletedQuery);
                counts.deleted[assetType] = deletedSnapshot.size;

                counts.total[assetType] = counts.active[assetType] + counts.archived[assetType] + counts.deleted[assetType];
            }

            return { success: true, data: counts };

        } catch (error) {
            console.error('getAssetCounts error:', error);
            return { success: false, error: { message: error.message || 'Failed to get asset counts' } };
        }
    }
}

export default ArchiveTrashService;