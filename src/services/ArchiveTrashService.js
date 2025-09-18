// services/archiveTrashService.js - FIXED to match working patterns
import { BaseFirestoreService } from './firestoreService';
import { serverTimestamp } from 'firebase/firestore';

export class ArchiveTrashService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
    }

    // =================== CORE DELETE METHOD (matches working pattern) ===================
    
    async deleteAsset(suiteId, assetType, assetId, sprintId = null, reason = null) {
        console.log('ArchiveTrashService.deleteAsset called:', {
            suiteId, assetType, assetId, sprintId, reason
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate parameters
        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        if (!assetId || typeof assetId !== 'string') {
            return { success: false, error: { message: 'Invalid asset ID provided' } };
        }

        // Check access using the same method that works for updates
        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Insufficient permissions to delete ${assetType} in this test suite` }
            };
        }

        try {
            // Construct collection path exactly like AssetService does
            let collectionPath;
            if (sprintId && typeof sprintId === 'string') {
                collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
            } else {
                collectionPath = `testSuites/${suiteId}/${assetType}`;
            }

            console.log('Delete paths:', { collectionPath, assetId });

            // Use the same update pattern that works in AssetService
            const updateData = {
                status: 'deleted',
                deleted_at: serverTimestamp(),
                deleted_by: userId,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                ...(reason && { delete_reason: reason })
            };

            // Use the base class updateDocument method (same as working operations)
            const result = await this.updateDocument(collectionPath, assetId, updateData);
            
            if (result.success) {
                console.log('Asset deleted successfully');
                return { 
                    success: true, 
                    data: { 
                        id: assetId, 
                        status: 'deleted',
                        deleted_at: new Date(),
                        deleted_by: userId
                    }
                };
            } else {
                console.error('Failed to delete asset:', result.error);
                return result;
            }

        } catch (error) {
            console.error('ArchiveTrashService.deleteAsset error:', error);
            return this.handleFirestoreError(error, 'delete asset');
        }
    }

    // =================== ARCHIVE METHOD ===================
    
    async archiveAsset(suiteId, assetType, assetId, sprintId = null, reason = null) {
        console.log('ArchiveTrashService.archiveAsset called:', {
            suiteId, assetType, assetId, sprintId, reason
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Insufficient permissions to archive ${assetType} in this test suite` }
            };
        }

        try {
            let collectionPath;
            if (sprintId && typeof sprintId === 'string') {
                collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
            } else {
                collectionPath = `testSuites/${suiteId}/${assetType}`;
            }

            const updateData = {
                status: 'archived',
                archived_at: serverTimestamp(),
                archived_by: userId,
                ...(reason && { archive_reason: reason })
            };

            const result = await this.updateDocument(collectionPath, assetId, updateData);
            
            if (result.success) {
                console.log('Asset archived successfully');
                return { 
                    success: true, 
                    data: { 
                        id: assetId, 
                        status: 'archived',
                        archived_at: new Date(),
                        archived_by: userId
                    }
                };
            }
            return result;

        } catch (error) {
            console.error('ArchiveTrashService.archiveAsset error:', error);
            return this.handleFirestoreError(error, 'archive asset');
        }
    }

    // =================== RESTORE METHODS ===================
    
    async restoreFromTrash(suiteId, assetType, assetId, sprintId = null) {
        return await this.restoreAsset(suiteId, assetType, assetId, sprintId, 'active');
    }

    async unarchiveAsset(suiteId, assetType, assetId, sprintId = null) {
        return await this.restoreAsset(suiteId, assetType, assetId, sprintId, 'active');
    }

    async restoreAsset(suiteId, assetType, assetId, sprintId = null, newStatus = 'active') {
        console.log('ArchiveTrashService.restoreAsset called:', {
            suiteId, assetType, assetId, sprintId, newStatus
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Insufficient permissions to restore ${assetType} in this test suite` }
            };
        }

        try {
            let collectionPath;
            if (sprintId && typeof sprintId === 'string') {
                collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
            } else {
                collectionPath = `testSuites/${suiteId}/${assetType}`;
            }

            const updateData = {
                status: newStatus,
                restored_at: serverTimestamp(),
                restored_by: userId,
                // Clear previous state fields
                deleted_at: null,
                deleted_by: null,
                delete_reason: null,
                expires_at: null,
                archived_at: null,
                archived_by: null,
                archive_reason: null
            };

            const result = await this.updateDocument(collectionPath, assetId, updateData);
            
            if (result.success) {
                return { 
                    success: true, 
                    data: { 
                        id: assetId, 
                        status: newStatus,
                        restored_at: new Date(),
                        restored_by: userId
                    }
                };
            }
            return result;

        } catch (error) {
            console.error('ArchiveTrashService.restoreAsset error:', error);
            return this.handleFirestoreError(error, 'restore asset');
        }
    }

    // =================== PERMANENT DELETE ===================
    
    async permanentlyDeleteAsset(suiteId, assetType, assetId, sprintId = null) {
        console.log('ArchiveTrashService.permanentlyDeleteAsset called:', {
            suiteId, assetType, assetId, sprintId
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Admin permissions required to permanently delete ${assetType}` }
            };
        }

        try {
            let collectionPath;
            if (sprintId && typeof sprintId === 'string') {
                collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
            } else {
                collectionPath = `testSuites/${suiteId}/${assetType}`;
            }

            const result = await this.deleteDocument(collectionPath, assetId);
            return result;

        } catch (error) {
            console.error('ArchiveTrashService.permanentlyDeleteAsset error:', error);
            return this.handleFirestoreError(error, 'permanently delete asset');
        }
    }

    // =================== SPECIFIC ASSET METHODS ===================

    // Test Cases
    async deleteTestCase(suiteId, testCaseId, sprintId = null, reason = null) {
        return await this.deleteAsset(suiteId, 'testCases', testCaseId, sprintId, reason);
    }

    async archiveTestCase(suiteId, testCaseId, sprintId = null, reason = null) {
        return await this.archiveAsset(suiteId, 'testCases', testCaseId, sprintId, reason);
    }

    async restoreTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.restoreFromTrash(suiteId, 'testCases', testCaseId, sprintId);
    }

    async unarchiveTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.unarchiveAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async permanentlyDeleteTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.permanentlyDeleteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    // Bugs
    async deleteBug(suiteId, bugId, sprintId = null, reason = null) {
        return await this.deleteAsset(suiteId, 'bugs', bugId, sprintId, reason);
    }

    async archiveBug(suiteId, bugId, sprintId = null, reason = null) {
        return await this.archiveAsset(suiteId, 'bugs', bugId, sprintId, reason);
    }

    async restoreBug(suiteId, bugId, sprintId = null) {
        return await this.restoreFromTrash(suiteId, 'bugs', bugId, sprintId);
    }

    async unarchiveBug(suiteId, bugId, sprintId = null) {
        return await this.unarchiveAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async permanentlyDeleteBug(suiteId, bugId, sprintId = null) {
        return await this.permanentlyDeleteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    // Recommendations
    async deleteRecommendation(suiteId, recommendationId, sprintId = null, reason = null) {
        return await this.deleteAsset(suiteId, 'recommendations', recommendationId, sprintId, reason);
    }

    async archiveRecommendation(suiteId, recommendationId, sprintId = null, reason = null) {
        return await this.archiveAsset(suiteId, 'recommendations', recommendationId, sprintId, reason);
    }

    async restoreRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.restoreFromTrash(suiteId, 'recommendations', recommendationId, sprintId);
    }

    async unarchiveRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.unarchiveAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    async permanentlyDeleteRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.permanentlyDeleteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // Recordings
    async deleteRecording(suiteId, recordingId, sprintId = null, reason = null) {
        return await this.deleteAsset(suiteId, 'recordings', recordingId, sprintId, reason);
    }

    async archiveRecording(suiteId, recordingId, sprintId = null, reason = null) {
        return await this.archiveAsset(suiteId, 'recordings', recordingId, sprintId, reason);
    }

    async restoreRecording(suiteId, recordingId, sprintId = null) {
        return await this.restoreFromTrash(suiteId, 'recordings', recordingId, sprintId);
    }

    async unarchiveRecording(suiteId, recordingId, sprintId = null) {
        return await this.unarchiveAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async permanentlyDeleteRecording(suiteId, recordingId, sprintId = null) {
        return await this.permanentlyDeleteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    // Sprints
    async deleteSprint(suiteId, sprintId, reason = null) {
        return await this.deleteAsset(suiteId, 'sprints', sprintId, null, reason);
    }

    async archiveSprint(suiteId, sprintId, reason = null) {
        return await this.archiveAsset(suiteId, 'sprints', sprintId, null, reason);
    }

    async restoreSprint(suiteId, sprintId) {
        return await this.restoreFromTrash(suiteId, 'sprints', sprintId, null);
    }

    async unarchiveSprint(suiteId, sprintId) {
        return await this.unarchiveAsset(suiteId, 'sprints', sprintId, null);
    }

    async permanentlyDeleteSprint(suiteId, sprintId) {
        return await this.permanentlyDeleteAsset(suiteId, 'sprints', sprintId, null);
    }

    // =================== BULK OPERATIONS ===================
    
    async bulkDelete(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        const results = [];
        
        for (const assetId of assetIds) {
            const result = await this.deleteAsset(suiteId, assetType, assetId, sprintId, reason);
            results.push({ assetId, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: failed === 0,
            data: {
                total: assetIds.length,
                successful,
                failed,
                results
            }
        };
    }

    async bulkArchive(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        const results = [];
        
        for (const assetId of assetIds) {
            const result = await this.archiveAsset(suiteId, assetType, assetId, sprintId, reason);
            results.push({ assetId, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: failed === 0,
            data: {
                total: assetIds.length,
                successful,
                failed,
                results
            }
        };
    }

    async bulkRestore(suiteId, assetType, assetIds, sprintId = null, fromTrash = false) {
        const results = [];
        
        for (const assetId of assetIds) {
            const result = fromTrash 
                ? await this.restoreFromTrash(suiteId, assetType, assetId, sprintId)
                : await this.unarchiveAsset(suiteId, assetType, assetId, sprintId);
            results.push({ assetId, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: failed === 0,
            data: {
                total: assetIds.length,
                successful,
                failed,
                results
            }
        };
    }

    async bulkPermanentDelete(suiteId, assetType, assetIds, sprintId = null) {
        const results = [];
        
        for (const assetId of assetIds) {
            const result = await this.permanentlyDeleteAsset(suiteId, assetType, assetId, sprintId);
            results.push({ assetId, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
            success: failed === 0,
            data: {
                total: assetIds.length,
                successful,
                failed,
                results
            }
        };
    }

    // =================== QUERY METHODS ===================
    
    async getArchivedAssets(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Insufficient permissions to view archived ${assetType}` }
            };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        const constraints = [['status', '==', 'archived']];
        return await this.queryDocuments(collectionPath, constraints, 'archived_at');
    }

    async getTrashedAssets(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { 
                success: false, 
                error: { message: `Insufficient permissions to view deleted ${assetType}` }
            };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        const constraints = [['status', '==', 'deleted']];
        return await this.queryDocuments(collectionPath, constraints, 'deleted_at');
    }

    // =================== CLEANUP ===================
    
    cleanup() {
        this.unsubscribeAll();
    }
}