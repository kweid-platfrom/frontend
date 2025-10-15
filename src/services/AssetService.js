// Fixed AssetService.js - Properly filters deleted/archived items from main views
import { BaseFirestoreService } from './firestoreService';
import { orderBy } from 'firebase/firestore';
import recordingService from '../services/recordingService';

export class AssetService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
        this.recordingService = recordingService;
    }

    // ========================
    // CORE ASSET METHODS (enhanced with proper filtering)
    // ========================

    async updateSuiteAsset(suiteId, assetType, assetId, updates, sprintId = null) {
        console.log('AssetService.updateSuiteAsset called with:', {
            suiteId, assetType, assetId,
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            sprintId
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        if (!assetId || typeof assetId !== 'string') {
            return { success: false, error: { message: 'Invalid asset ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to update ${assetType}` } };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        const data = this.addCommonFields({
            ...updates,
            updated_at: new Date(),
            lastActivity: new Date()
        }, true);

        return await super.updateDocument(collectionPath, assetId, data);
    }

    async deleteSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to delete ${assetType}` } };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.deleteDocument(collectionPath, assetId);
    }

    async getSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.getDocument(collectionPath, assetId);
    }

    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to create ${assetType}` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const data = this.addCommonFields({
            suite_id: suiteId,
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        try {
            // Use the base class createDocument method from BaseFirestoreService
            const result = await super.createDocument(collectionPath, data);

            if (result.success) {
                return {
                    success: true,
                    data: { id: result.docId || result.data?.id, ...result.data }
                };
            }

            return result;
        } catch (error) {
            console.error(`Error creating ${assetType}:`, error);
            return {
                success: false,
                error: {
                    message: `Failed to create ${assetType}: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    // FIXED: Enhanced getSuiteAssets with proper default filtering
    async getSuiteAssets(suiteId, assetType, sprintId = null, options = {}) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const constraints = [];

        // FIXED: Default filtering behavior
        if (options.includeStatus && options.includeStatus.length > 0) {
            // If includeStatus is specified, use it
            constraints.push(['status', 'in', options.includeStatus]);
        } else if (!options.includeAll) {
            // Default behavior: exclude deleted and archived unless explicitly requested
            const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
            if (excludeStatuses.length > 0) {
                // Use 'not-in' to exclude specific statuses, or filter results post-query
                // Since Firestore 'not-in' has limitations, we'll filter post-query
                // constraints.push(['status', 'not-in', excludeStatuses]); // Limited support
                // We'll handle this in post-processing instead
            }
        }

        // Handle date filtering
        if (options.dateFrom) {
            constraints.push(['created_at', '>=', new Date(options.dateFrom)]);
        }
        if (options.dateTo) {
            constraints.push(['created_at', '<=', new Date(options.dateTo)]);
        }

        // Handle provider filtering for recordings
        if (assetType === 'recordings' && options.provider) {
            constraints.push(['provider', '==', options.provider]);
        }

        // Handle priority filtering for bugs
        if (assetType === 'bugs' && options.priority) {
            constraints.push(['priority', '==', options.priority]);
        }

        // Handle severity filtering for bugs
        if (assetType === 'bugs' && options.severity) {
            constraints.push(['severity', '==', options.severity]);
        }

        const result = await this.queryDocuments(
            collectionPath,
            constraints,
            options.orderBy || 'created_at',
            options.orderDirection || 'desc'
        );

        // FIXED: Post-process filtering for excluded statuses
        if (result.success && result.data) {
            let filteredData = result.data;

            // Apply excludeStatus filtering if no includeStatus was specified
            if (!options.includeStatus && !options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                if (excludeStatuses.length > 0) {
                    filteredData = result.data.filter(item =>
                        !excludeStatuses.includes(item.status)
                    );
                }
            }

            // Apply additional filters if specified
            if (options.excludeStatus && options.includeStatus) {
                // If both are specified, includeStatus takes precedence, but still exclude
                filteredData = filteredData.filter(item =>
                    !options.excludeStatus.includes(item.status)
                );
            }

            result.data = filteredData;
        }

        return result;
    }

    // FIXED: Enhanced subscription with filtering
    subscribeToSuiteAssets(suiteId, assetType, callback, errorCallback = null, sprintId = null, options = {}) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return this.subscribeToCollection(
            collectionPath,
            [orderBy('created_at', 'desc')],
            (data) => {
                // FIXED: Filter real-time updates to exclude deleted and archived by default
                let filteredData = data;

                if (!options.includeAll) {
                    const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                    if (excludeStatuses.length > 0) {
                        filteredData = data.filter(item =>
                            !excludeStatuses.includes(item.status)
                        );
                    }
                }

                callback(filteredData);
            },
            errorCallback
        );
    }

    // ========================
    // DOCUMENTS METHODS (INJECTED FROM PASTE-2)
    // ========================

    async createDocument(suiteId, documentData, sprintId = null) {
        console.log('AssetService.createDocument called:', { suiteId, documentData, sprintId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            console.error('User not authenticated');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId) {
            console.error('Suite ID is required');
            return { success: false, error: { message: 'Suite ID is required' } };
        }

        try {
            // Validate access first
            console.log('Validating test suite access...');
            const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
            if (!hasAccess) {
                console.error('Access validation failed');
                return { success: false, error: { message: 'Insufficient permissions to create document' } };
            }
            console.log('Access validation passed');

            // Get suite name for folder organization
            console.log('Fetching suite details...');
            const suiteName = suiteId;
            console.log('Suite name:', suiteName);

            // Get Firebase token for API authentication
            console.log('Getting Firebase token...');
            const token = await this.getFirebaseToken();
            if (!token) {
                console.error('Failed to get Firebase token');
                return { success: false, error: { message: 'Authentication token not available' } };
            }
            console.log('Firebase token obtained');

            // Create Google Doc in Drive folder
            console.log('Calling Google Docs API...');
            const response = await fetch('/api/docs/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: documentData.title || 'Untitled Document',
                    suiteId,
                    suiteName,
                    sprintId,
                    content: documentData.content || ''
                })
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API request failed:', errorText);
                throw new Error(`Failed to create Google Doc: ${response.status} ${errorText}`);
            }

            const googleDocData = await response.json();
            console.log('Google Doc API response:', googleDocData);

            if (!googleDocData.success) {
                console.error('Google Doc creation failed:', googleDocData.error);
                throw new Error(googleDocData.error || 'Google Doc creation failed');
            }

            // Store ONLY metadata in Firestore
            console.log('Preparing Firestore metadata...');
            const metadata = {
                title: documentData.title || 'Untitled Document',
                type: documentData.type || 'general',
                tags: documentData.tags || [],

                // Google Docs/Drive references
                docId: googleDocData.docId,
                url: googleDocData.url,
                folderId: googleDocData.folderId,

                // Metadata
                status: 'active',
                suite_id: suiteId,
                suiteId: suiteId, // Keep both for compatibility
                ...(sprintId && {
                    sprint_id: sprintId,
                    sprintId: sprintId
                })
            };

            console.log('Creating Firestore record with metadata:', {
                hasSuiteId: !!metadata.suite_id,
                suite_id: metadata.suite_id,
                hasDocId: !!metadata.docId,
                title: metadata.title
            });

            // Create in Firestore using createSuiteAsset
            const firestoreResult = await this.createSuiteAsset(suiteId, 'documents', metadata, sprintId);

            console.log('Firestore creation result:', {
                success: firestoreResult.success,
                hasData: !!firestoreResult.data,
                error: firestoreResult.error
            });

            if (!firestoreResult.success) {
                // If Firestore creation fails, try to clean up the Google Doc
                console.warn('Firestore creation failed, attempting to cleanup Google Doc...');
                try {
                    await fetch('/api/docs/delete', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ docId: googleDocData.docId })
                    });
                    console.log('Google Doc cleanup successful');
                } catch (cleanupError) {
                    console.error('Failed to cleanup Google Doc:', cleanupError);
                }

                return firestoreResult;
            }

            console.log('Document created successfully:', firestoreResult.data.id);

            return {
                success: true,
                data: {
                    ...firestoreResult.data,
                    googleDoc: googleDocData
                }
            };

        } catch (error) {
            console.error('Error in createDocument:', {
                message: error.message,
                stack: error.stack,
                suiteId,
                documentData
            });

            return {
                success: false,
                error: {
                    message: `Failed to create document: ${error.message}`,
                    code: error.code,
                    details: error.stack
                }
            };
        }
    }

    async getFirebaseToken() {
        try {
            // Dynamic import to avoid issues
            const { auth } = await import('../config/firebase');
            const user = auth.currentUser;

            if (!user) {
                console.error('No current user for token generation');
                return null;
            }

            const token = await user.getIdToken();
            console.log('Firebase token generated successfully');
            return token;
        } catch (error) {
            console.error('Error getting Firebase token:', error);
            return null;
        }
    }


    async getDocuments(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            type: options.type,
            dateFrom: options.dateFrom,
            dateTo: options.dateTo,
            orderBy: options.orderBy || 'created_at',
            orderDirection: options.orderDirection || 'desc',
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'documents', sprintId, defaultOptions);
    }

    async getDocument(documentId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'documents', documentId, sprintId);
    }


    async updateDocument(documentId, updates, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to update document' } };
        }

        try {
            // If content is being updated, sync to Google Docs
            if (updates.content) {
                const currentDoc = await this.getDocument(documentId, suiteId, sprintId);

                if (currentDoc.success && currentDoc.data?.docId) {
                    const token = await this.getFirebaseToken();
                    const response = await fetch('/api/docs/update', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            docId: currentDoc.data.docId,
                            content: updates.content
                        })
                    });

                    if (!response.ok) {
                        console.warn('Failed to update Google Doc content');
                    }
                }

                // Don't store content in Firestore
                delete updates.content;
            }

            // Only update metadata in Firestore
            const metadataUpdates = {
                ...(updates.title && { title: updates.title }),
                ...(updates.type && { type: updates.type }),
                ...(updates.tags && { tags: updates.tags }),
                ...(updates.status && { status: updates.status })
            };

            return await this.updateSuiteAsset(suiteId, 'documents', documentId, metadataUpdates, sprintId);

        } catch (error) {
            console.error('Error updating document:', error);
            return {
                success: false,
                error: {
                    message: `Failed to update document: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async deleteDocument(documentId, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete document' } };
        }

        try {
            // Get document to retrieve Google Docs ID
            const docResult = await this.getDocument(documentId, suiteId, sprintId);

            if (docResult.success && docResult.data?.docId) {
                const token = await this.getFirebaseToken();

                // Delete from Google Drive (move to trash)
                await fetch('/api/docs/delete', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        docId: docResult.data.docId
                    })
                }).catch(err => console.warn('Failed to delete Google Doc:', err));
            }

            // Delete metadata from Firestore
            return await this.deleteSuiteAsset(suiteId, 'documents', documentId, sprintId);

        } catch (error) {
            console.error('Error deleting document:', error);
            return {
                success: false,
                error: {
                    message: `Failed to delete document: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    subscribeToDocuments(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'documents', (documents) => {
            let filteredDocuments = documents;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredDocuments = documents.filter(doc =>
                    !excludeStatuses.includes(doc.status)
                );
            }

            if (options.type) {
                filteredDocuments = filteredDocuments.filter(doc => doc.type === options.type);
            }

            callback(filteredDocuments);
        }, errorCallback, sprintId, options);
    }

    async duplicateDocument(suiteId, documentId, newTitle = null, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to duplicate document' } };
        }

        try {
            // Get original document metadata
            const docResult = await this.getDocument(documentId, suiteId, sprintId);
            if (!docResult.success) {
                return docResult;
            }

            const originalDoc = docResult.data;

            // Create duplicate with new title
            const duplicateData = {
                title: newTitle || `${originalDoc.title} (Copy)`,
                type: originalDoc.type,
                tags: originalDoc.tags
            };

            // This will create a new Google Doc and Firestore metadata
            return await this.createDocument(suiteId, duplicateData, sprintId);

        } catch (error) {
            console.error('Error duplicating document:', error);
            return {
                success: false,
                error: {
                    message: `Failed to duplicate document: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async shareDocument(suiteId, documentId, shareConfig, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to share document' } };
        }

        try {
            const docResult = await this.getDocument(documentId, suiteId, sprintId);
            if (!docResult.success) {
                return docResult;
            }

            const document = docResult.data;

            if (!document.docId) {
                return {
                    success: false,
                    error: { message: 'Document not linked to Google Docs' }
                };
            }

            const token = await this.getFirebaseToken();

            // Share via Google Docs API
            const shareResponse = await fetch('/api/docs/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    docId: document.docId,
                    emails: shareConfig.emails,
                    role: shareConfig.role || 'reader'
                })
            });

            if (!shareResponse.ok) {
                throw new Error('Failed to share document');
            }

            const shareResult = await shareResponse.json();

            // Update metadata with sharing info
            await this.updateDocument(documentId, {
                lastShared: {
                    at: new Date(),
                    with: shareConfig.emails,
                    by: userId
                }
            }, suiteId, sprintId);

            return shareResult;

        } catch (error) {
            console.error('Error sharing document:', error);
            return {
                success: false,
                error: {
                    message: `Failed to share document: ${error.message}`
                }
            };
        }
    }


    async exportDocument(suiteId, documentId, format = 'pdf', sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to export document' } };
        }

        try {
            const docResult = await this.getDocument(documentId, suiteId, sprintId);
            if (!docResult.success) {
                return docResult;
            }

            const document = docResult.data;

            if (!document.docId) {
                return {
                    success: false,
                    error: { message: 'Document not linked to Google Docs for export' }
                };
            }

            const exportUrl = `/api/docs/export?docId=${document.docId}&format=${format}`;

            return {
                success: true,
                data: {
                    exportUrl,
                    format,
                    title: document.title
                }
            };

        } catch (error) {
            console.error('Error exporting document:', error);
            return {
                success: false,
                error: {
                    message: `Failed to export document: ${error.message}`
                }
            };
        }
    }

    async getDocumentStatistics(suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions' } };
        }

        try {
            const documents = await this.getDocuments(suiteId, sprintId, {
                includeStatus: ['active', 'archived']
            });

            if (!documents.success) {
                return documents;
            }

            const stats = {
                total: documents.data.length,
                byType: {},
                byStatus: {},
                withTags: 0,
                totalTags: 0,
                recentlyCreated: 0,
                recentlyUpdated: 0
            };

            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            documents.data.forEach(doc => {
                stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
                stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

                if (doc.tags && doc.tags.length > 0) {
                    stats.withTags++;
                    stats.totalTags += doc.tags.length;
                }

                const createdAt = doc.created_at?.toDate ? doc.created_at.toDate() : new Date(doc.created_at);
                const updatedAt = doc.updated_at?.toDate ? doc.updated_at.toDate() : new Date(doc.updated_at);

                if (createdAt > oneDayAgo) stats.recentlyCreated++;
                if (updatedAt > oneDayAgo) stats.recentlyUpdated++;
            });

            return {
                success: true,
                data: stats
            };

        } catch (error) {
            console.error('Error getting document statistics:', error);
            return {
                success: false,
                error: {
                    message: `Failed to get statistics: ${error.message}`
                }
            };
        }
    }

    // Bulk operations
    async bulkArchiveDocuments(suiteId, documentIds, sprintId = null, reason = 'Bulk archive') {
        const results = [];
        const errors = [];

        for (const docId of documentIds) {
            try {
                const result = await this.updateDocument(docId, {
                    status: 'archived',
                    archivedAt: new Date(),
                    archiveReason: reason
                }, suiteId, sprintId);

                if (result.success) {
                    results.push({ id: docId, success: true });
                } else {
                    errors.push({ id: docId, error: result.error });
                }
            } catch (error) {
                errors.push({ id: docId, error: { message: error.message } });
            }
        }

        return {
            success: errors.length === 0,
            data: {
                archived: results.length,
                failed: errors.length,
                results,
                errors
            }
        };
    }

    async bulkDeleteDocuments(suiteId, documentIds, sprintId = null) {
        const results = [];
        const errors = [];

        for (const docId of documentIds) {
            try {
                const result = await this.deleteDocument(docId, suiteId, sprintId);

                if (result.success) {
                    results.push({ id: docId, success: true });
                } else {
                    errors.push({ id: docId, error: result.error });
                }
            } catch (error) {
                errors.push({ id: docId, error: { message: error.message } });
            }
        }

        return {
            success: errors.length === 0,
            data: {
                deleted: results.length,
                failed: errors.length,
                results,
                errors
            }
        };
    }

    // ========================
    // TEST DATA METHODS (INJECTED FROM PASTE-2)
    // ========================

    async createTestData(suiteId, testData, sprintId = null) {
        const data = {
            name: testData.name || 'Test Data',
            type: testData.type || 'json', // 'json', 'csv', 'xml', 'sql', 'custom'
            data: testData.data || {},
            schema: testData.schema || null,
            description: testData.description || '',
            tags: testData.tags || [],
            environment: testData.environment || 'development', // 'development', 'staging', 'production'
            isActive: testData.isActive !== undefined ? testData.isActive : true,
            version: testData.version || '1.0',
            status: testData.status || 'active',
            metadata: testData.metadata || {},
            ...testData
        };
        return await this.createSuiteAsset(suiteId, 'testData', data, sprintId);
    }

    async getTestData(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            environment: options.environment, // Filter by environment
            type: options.type, // Filter by type
            ...options
        };

        const result = await this.getSuiteAssets(suiteId, 'testData', sprintId, defaultOptions);

        // Apply additional filters
        if (result.success && result.data) {
            let filteredData = result.data;

            if (options.environment) {
                filteredData = filteredData.filter(item => item.environment === options.environment);
            }

            if (options.type) {
                filteredData = filteredData.filter(item => item.type === options.type);
            }

            if (options.isActive !== undefined) {
                filteredData = filteredData.filter(item => item.isActive === options.isActive);
            }

            result.data = filteredData;
        }

        return result;
    }

    async getTestDataById(dataId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'testData', dataId, sprintId);
    }

    async updateTestData(dataId, updates, suiteId, sprintId = null) {
        // Increment version if data changed
        if (updates.data) {
            const currentData = await this.getTestDataById(dataId, suiteId, sprintId);
            if (currentData.success && currentData.data) {
                const currentVersion = parseFloat(currentData.data.version || '1.0');
                updates.version = (currentVersion + 0.1).toFixed(1);
                updates.previousVersion = currentData.data.version;
            }
        }
        return await this.updateSuiteAsset(suiteId, 'testData', dataId, updates, sprintId);
    }

    async deleteTestData(dataId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'testData', dataId, sprintId);
    }

    subscribeToTestData(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'testData', (testDataItems) => {
            let filteredData = testDataItems;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredData = testDataItems.filter(item =>
                    !excludeStatuses.includes(item.status)
                );
            }

            // Apply additional filters
            if (options.environment) {
                filteredData = filteredData.filter(item => item.environment === options.environment);
            }

            if (options.type) {
                filteredData = filteredData.filter(item => item.type === options.type);
            }

            if (options.isActive !== undefined) {
                filteredData = filteredData.filter(item => item.isActive === options.isActive);
            }

            callback(filteredData);
        }, errorCallback, sprintId, options);
    }

    // Bulk import test data
    async bulkImportTestData(suiteId, testDataArray, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to import test data' } };
        }

        const results = [];
        const errors = [];

        for (const testData of testDataArray) {
            try {
                const result = await this.createTestData(suiteId, testData, sprintId);
                if (result.success) {
                    results.push(result.data);
                } else {
                    errors.push({ data: testData, error: result.error });
                }
            } catch (error) {
                errors.push({ data: testData, error: { message: error.message } });
            }
        }

        return {
            success: errors.length === 0,
            data: {
                imported: results.length,
                failed: errors.length,
                results,
                errors
            }
        };
    }

    // Export test data
    async exportTestData(suiteId, sprintId = null, options = {}) {
        const result = await this.getTestData(suiteId, sprintId, options);

        if (!result.success) {
            return result;
        }

        const exportFormat = options.format || 'json';
        let exportData;

        switch (exportFormat) {
            case 'json':
                exportData = JSON.stringify(result.data, null, 2);
                break;
            case 'csv':
                // Simple CSV conversion
                if (result.data.length > 0) {
                    const headers = Object.keys(result.data[0]).join(',');
                    const rows = result.data.map(item =>
                        Object.values(item).map(val =>
                            typeof val === 'object' ? JSON.stringify(val) : val
                        ).join(',')
                    ).join('\n');
                    exportData = `${headers}\n${rows}`;
                } else {
                    exportData = '';
                }
                break;
            default:
                exportData = JSON.stringify(result.data, null, 2);
        }

        return {
            success: true,
            data: {
                format: exportFormat,
                content: exportData,
                count: result.data.length,
                exportedAt: new Date().toISOString()
            }
        };
    }

    // ========================
    // FIXED RECORDING METHODS
    // ========================

    // FIXED: Upload recording blob and create Firestore record with proper error handling
    async uploadAndCreateRecording(suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId) {
            return { success: false, error: { message: 'Suite ID is required' } };
        }

        if (!recordingBlob || !(recordingBlob instanceof Blob)) {
            return { success: false, error: { message: 'Valid recording blob is required' } };
        }

        if (recordingBlob.size === 0) {
            return { success: false, error: { message: 'Recording blob cannot be empty' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create recording' } };
        }

        try {
            console.log('Starting upload and create recording process...');

            // Step 1: Upload the recording blob with retry logic
            const uploadResult = await this.recordingService.uploadRecordingWithRetry(
                recordingBlob,
                {
                    title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording from QA testing',
                    tags: metadata.tags || ['qa-testing', 'screen-recording'],
                    privacy: metadata.privacy || 'unlisted'
                },
                onProgress,
                2 // maxRetries
            );

            if (!uploadResult.success) {
                console.error('Upload failed:', uploadResult.error);
                return {
                    success: false,
                    error: {
                        message: `Upload failed: ${uploadResult.error.message}`,
                        details: uploadResult.error
                    }
                };
            }

            console.log('Upload successful, creating Firestore record...');

            // Step 2: Prepare comprehensive recording data
            const recordingData = {
                title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || '',

                // Unified URL fields
                videoUrl: uploadResult.data.videoUrl || uploadResult.data.url,
                url: uploadResult.data.url || uploadResult.data.videoUrl,

                // YouTube-specific fields
                youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
                videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
                embedUrl: uploadResult.data.embedUrl,
                thumbnailUrl: uploadResult.data.thumbnailUrl,
                privacyStatus: uploadResult.data.privacyStatus,

                // Provider and file info
                provider: uploadResult.data.provider,
                filename: uploadResult.data.filename,
                duration: metadata.duration || 0,
                size: uploadResult.data.size,

                // Firebase-specific fields
                ...(uploadResult.data.provider === 'firebase' && {
                    storagePath: uploadResult.data.storagePath
                }),

                // Session data
                consoleLogs: metadata.consoleLogs || [],
                networkLogs: metadata.networkLogs || [],
                comments: metadata.comments || [],
                detectedIssues: metadata.detectedIssues || [],
                platform: metadata.platform || navigator.userAgent,
                status: 'active',

                // Enhanced metadata
                metadata: {
                    recordingStartTime: metadata.recordingStartTime || new Date().toISOString(),
                    recordingEndTime: metadata.recordingEndTime || new Date().toISOString(),
                    browserInfo: {
                        userAgent: navigator.userAgent,
                        viewport: {
                            width: window.innerWidth || 1920,
                            height: window.innerHeight || 1080
                        }
                    },
                    uploadInfo: {
                        uploadedAt: new Date().toISOString(),
                        provider: uploadResult.data.provider,
                        originalFilename: uploadResult.data.filename,
                        fileSize: uploadResult.data.size
                    },
                    statistics: {
                        totalLogs: (metadata.consoleLogs?.length || 0) + (metadata.networkLogs?.length || 0),
                        issuesDetected: metadata.detectedIssues?.length || 0,
                        commentsCount: metadata.comments?.length || 0
                    }
                }
            };

            // Step 3: Create Firestore record
            const createResult = await this.createRecording(suiteId, recordingData, sprintId);

            if (createResult.success) {
                console.log('Recording created successfully');
                return {
                    success: true,
                    data: {
                        id: createResult.data.id,
                        ...recordingData,
                        created_at: createResult.data.created_at,
                        updated_at: createResult.data.updated_at,
                        uploadInfo: uploadResult.data,
                        // Computed fields
                        playbackUrl: this.recordingService.getPlaybackUrl(recordingData),
                        directUrl: this.recordingService.getVideoUrl(recordingData)
                    }
                };
            } else {
                console.warn('Firestore creation failed, attempting cleanup...');
                // Cleanup uploaded video if Firestore creation fails
                try {
                    await this.recordingService.deleteRecording(uploadResult.data);
                    console.log('Cleanup successful');
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded video:', cleanupError);
                }
                return createResult;
            }

        } catch (error) {
            console.error('Upload and create recording failed:', error);
            return {
                success: false,
                error: {
                    message: `Operation failed: ${error.message}`,
                    stack: error.stack
                }
            };
        }
    }

    // FIXED: Create recording with comprehensive validation
    async createRecording(suiteId, recordingData, sprintId = null) {
        // Validate recording data structure
        const validation = this.recordingService.validateRecordingData(recordingData);
        if (!validation.valid) {
            return {
                success: false,
                error: {
                    message: 'Invalid recording data structure',
                    details: validation.errors
                }
            };
        }

        const data = {
            title: recordingData.title || `Recording - ${new Date().toLocaleDateString()}`,
            description: recordingData.description || '',

            // Ensure both URL fields exist
            videoUrl: recordingData.videoUrl || recordingData.url,
            url: recordingData.url || recordingData.videoUrl,

            // YouTube fields (ensure both aliases exist)
            youtubeId: recordingData.youtubeId || recordingData.videoId || null,
            videoId: recordingData.videoId || recordingData.youtubeId || null,
            embedUrl: recordingData.embedUrl,
            thumbnailUrl: recordingData.thumbnailUrl,
            privacyStatus: recordingData.privacyStatus,

            // Core fields
            provider: recordingData.provider || 'youtube',
            filename: recordingData.filename,
            duration: recordingData.duration || 0,
            size: recordingData.size,

            // Firebase-specific fields
            ...(recordingData.provider === 'firebase' && {
                storagePath: recordingData.storagePath
            }),

            // Session data
            consoleLogs: recordingData.consoleLogs || [],
            networkLogs: recordingData.networkLogs || [],
            comments: recordingData.comments || [],
            detectedIssues: recordingData.detectedIssues || [],
            platform: recordingData.platform || navigator.userAgent,
            status: recordingData.status || 'active',

            // Metadata with defaults
            metadata: recordingData.metadata || {
                recordingStartTime: new Date().toISOString(),
                recordingEndTime: new Date().toISOString(),
                browserInfo: {
                    userAgent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth || 1920,
                        height: window.innerHeight || 1080
                    }
                },
                statistics: {
                    totalLogs: (recordingData.consoleLogs?.length || 0) + (recordingData.networkLogs?.length || 0),
                    issuesDetected: recordingData.detectedIssues?.length || 0,
                    commentsCount: recordingData.comments?.length || 0
                }
            }
        };

        return await this.createSuiteAsset(suiteId, 'recordings', data, sprintId);
    }

    // FIXED: Get recordings with enhanced post-processing and default filtering
    async getRecordings(suiteId, sprintId = null, options = {}) {
        // FIXED: Set default options for recordings to exclude deleted and archived
        const recordingOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            dateFrom: options.dateFrom,
            dateTo: options.dateTo,
            provider: options.provider,
            orderBy: options.orderBy || 'created_at',
            orderDirection: options.orderDirection || 'desc'
        };

        const result = await this.getSuiteAssets(suiteId, 'recordings', sprintId, recordingOptions);

        // Enhanced post-processing
        if (result.success && result.data) {
            result.data = result.data.map(recording => {
                // Ensure URL consistency
                const videoUrl = recording.videoUrl || recording.url;
                const playbackUrl = this.recordingService.getPlaybackUrl(recording);
                const directUrl = this.recordingService.getVideoUrl(recording);

                return {
                    ...recording,
                    // Standardized URL fields
                    videoUrl,
                    url: videoUrl,
                    playbackUrl,
                    directUrl,

                    // Provider-specific URLs
                    embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                        ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                        : videoUrl,

                    // Additional computed fields
                    recordingInfo: this.recordingService.getRecordingInfo(recording),

                    // Format dates for display
                    createdAtFormatted: recording.created_at
                        ? new Date(recording.created_at.toDate ? recording.created_at.toDate() : recording.created_at).toLocaleString()
                        : 'Unknown',

                    // Statistics
                    stats: {
                        totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                        consoleLogs: recording.consoleLogs?.length || 0,
                        networkLogs: recording.networkLogs?.length || 0,
                        detectedIssues: recording.detectedIssues?.length || 0,
                        comments: recording.comments?.length || 0
                    }
                };
            });
        }

        return result;
    }

    // FIXED: Update recording with comprehensive blob and metadata handling
    async updateRecording(recordingId, updates, suiteId, sprintId = null) {
        if (!recordingId || typeof recordingId !== 'string') {
            return { success: false, error: { message: 'Invalid recording ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        console.log('AssetService.updateRecording called with:', {
            recordingId,
            updatesKeys: Object.keys(updates),
            suiteId,
            sprintId
        });

        // Handle new video upload if provided
        if (updates.newVideoBlob) {
            try {
                console.log('Processing new video blob upload...');

                const uploadResult = await this.recordingService.uploadRecordingWithRetry(
                    updates.newVideoBlob,
                    {
                        title: updates.title,
                        description: updates.description,
                        privacy: updates.privacy || 'unlisted'
                    },
                    null, // onProgress - could be passed from updates if needed
                    2 // maxRetries
                );

                if (uploadResult.success) {
                    // Update with new video data
                    Object.assign(updates, {
                        videoUrl: uploadResult.data.videoUrl || uploadResult.data.url,
                        url: uploadResult.data.url || uploadResult.data.videoUrl,
                        youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
                        videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
                        provider: uploadResult.data.provider,
                        filename: uploadResult.data.filename,
                        embedUrl: uploadResult.data.embedUrl,
                        thumbnailUrl: uploadResult.data.thumbnailUrl,
                        privacyStatus: uploadResult.data.privacyStatus,
                        size: uploadResult.data.size
                    });

                    // Add provider-specific fields
                    if (uploadResult.data.provider === 'firebase') {
                        updates.storagePath = uploadResult.data.storagePath;
                    }

                    // Update metadata
                    updates.metadata = {
                        ...updates.metadata,
                        uploadInfo: {
                            reUploadedAt: new Date().toISOString(),
                            provider: uploadResult.data.provider,
                            originalFilename: uploadResult.data.filename,
                            fileSize: uploadResult.data.size
                        }
                    };

                    console.log('New video uploaded successfully');
                } else {
                    console.error('New video upload failed:', uploadResult.error);
                    return { success: false, error: uploadResult.error };
                }
            } catch (error) {
                console.error('Error during video upload:', error);
                return {
                    success: false,
                    error: { message: `Video upload failed: ${error.message}` }
                };
            }

            // Remove the blob from updates as it shouldn't go to Firestore
            delete updates.newVideoBlob;
        }

        // Handle YouTube metadata updates
        if (updates.updateYouTubeMetadata && (updates.title || updates.description || updates.privacy)) {
            try {
                // Get current recording to check if it's a YouTube video
                const currentRecording = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);

                if (currentRecording.success && currentRecording.data?.provider === 'youtube') {
                    console.log('Updating YouTube metadata...');

                    const metadataUpdate = await this.recordingService.updateVideoMetadata(
                        currentRecording.data,
                        {
                            title: updates.title,
                            description: updates.description,
                            privacy: updates.privacy
                        }
                    );

                    if (!metadataUpdate.success) {
                        console.warn('Failed to update YouTube metadata:', metadataUpdate.error);
                        // Continue with Firestore update anyway
                    } else {
                        console.log('YouTube metadata updated successfully');
                    }
                }
            } catch (error) {
                console.warn('Error updating YouTube metadata:', error);
                // Continue with Firestore update
            }

            delete updates.updateYouTubeMetadata;
        }

        // Add update timestamp
        updates.updated_at = new Date();

        return await this.updateSuiteAsset(suiteId, 'recordings', recordingId, updates, sprintId);
    }

    // FIXED: Subscribe to recordings with enhanced post-processing and filtering
    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', (recordings) => {
            // FIXED: Filter out deleted and archived items from real-time updates by default
            let filteredRecordings = recordings;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredRecordings = recordings.filter(recording =>
                    !excludeStatuses.includes(recording.status)
                );
            }

            // Enhanced post-processing for real-time updates
            const processedRecordings = filteredRecordings.map(recording => {
                const videoUrl = recording.videoUrl || recording.url;
                return {
                    ...recording,
                    // Standardized fields
                    videoUrl,
                    url: videoUrl,
                    playbackUrl: this.recordingService.getPlaybackUrl(recording),
                    directUrl: this.recordingService.getVideoUrl(recording),
                    embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                        ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                        : videoUrl,

                    // Computed fields
                    recordingInfo: this.recordingService.getRecordingInfo(recording),
                    isYouTube: recording.provider === 'youtube',
                    isFirebase: recording.provider === 'firebase',

                    // Statistics
                    stats: {
                        totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                        consoleLogs: recording.consoleLogs?.length || 0,
                        networkLogs: recording.networkLogs?.length || 0,
                        detectedIssues: recording.detectedIssues?.length || 0,
                        comments: recording.comments?.length || 0
                    }
                };
            });
            callback(processedRecordings);
        }, errorCallback, sprintId, options);
    }

    // FIXED: Delete recording with enhanced cleanup
    async deleteRecording(recordingId, suiteId, sprintId = null) {
        if (!recordingId || !suiteId) {
            return { success: false, error: { message: 'Recording ID and Suite ID are required' } };
        }

        console.log('AssetService.deleteRecording called:', { recordingId, suiteId, sprintId });

        // Get recording data first for storage cleanup
        const recordingResult = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);

        if (recordingResult.success && recordingResult.data) {
            // Try to delete from storage (YouTube or Firebase)
            try {
                console.log('Attempting to delete from storage...');
                const deleteResult = await this.recordingService.deleteRecording(recordingResult.data);
                if (deleteResult.success) {
                    console.log('Storage deletion successful');
                } else {
                    console.warn('Failed to delete video from storage:', deleteResult.error);
                    // Continue with Firestore deletion regardless
                }
            } catch (error) {
                console.warn('Error during storage deletion:', error);
                // Continue with Firestore deletion
            }
        }

        // Delete from Firestore
        console.log('Deleting from Firestore...');
        const firestoreResult = await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId);

        if (firestoreResult.success) {
            console.log('Recording deleted successfully');
        }

        return firestoreResult;
    }

    // FIXED: Get single recording with post-processing
    async getRecording(recordingId, suiteId, sprintId = null) {
        const result = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);

        if (result.success && result.data) {
            const recording = result.data;
            const videoUrl = recording.videoUrl || recording.url;

            result.data = {
                ...recording,
                // Standardized URL fields
                videoUrl,
                url: videoUrl,
                playbackUrl: this.recordingService.getPlaybackUrl(recording),
                directUrl: this.recordingService.getVideoUrl(recording),
                embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                    ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                    : videoUrl,

                // Additional computed fields
                recordingInfo: this.recordingService.getRecordingInfo(recording),
                isYouTube: recording.provider === 'youtube',
                isFirebase: recording.provider === 'firebase',

                // Statistics
                stats: {
                    totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                    consoleLogs: recording.consoleLogs?.length || 0,
                    networkLogs: recording.networkLogs?.length || 0,
                    detectedIssues: recording.detectedIssues?.length || 0,
                    comments: recording.comments?.length || 0
                }
            };
        }

        return result;
    }

    // Recording service status methods
    async getRecordingServiceStatus() {
        return await this.recordingService.getServiceStatus();
    }

    async testYouTubeConnection() {
        return await this.recordingService.testYouTubeConnection();
    }

    async isYouTubeAvailable() {
        return await this.recordingService.isYouTubeAvailable();
    }

    async getRecordingStatistics(suiteId, sprintId = null) {
        const recordings = await this.getRecordings(suiteId, sprintId, {
            includeStatus: ['active', 'archived']
        });

        if (!recordings.success) {
            return recordings;
        }

        const stats = {
            total: recordings.data.length,
            byProvider: {},
            byStatus: {},
            totalSize: 0,
            totalDuration: 0,
            withIssues: 0,
            withComments: 0,
            averageLogs: 0
        };

        recordings.data.forEach(recording => {
            // Provider stats
            stats.byProvider[recording.provider] = (stats.byProvider[recording.provider] || 0) + 1;

            // Status stats
            stats.byStatus[recording.status] = (stats.byStatus[recording.status] || 0) + 1;

            // Size and duration
            stats.totalSize += recording.size || 0;
            stats.totalDuration += recording.duration || 0;

            // Issues and comments
            if (recording.detectedIssues?.length > 0) stats.withIssues++;
            if (recording.comments?.length > 0) stats.withComments++;

            // Logs
            stats.averageLogs += (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0);
        });

        if (recordings.data.length > 0) {
            stats.averageLogs = Math.round(stats.averageLogs / recordings.data.length);
        }

        return {
            success: true,
            data: stats
        };
    }

    // ========================
    // TEST CASES METHODS - FIXED: Default filtering
    // ========================

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    // FIXED: Default filtering for test cases
    async getTestCases(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId, defaultOptions);
    }

    // FIXED: Filter real-time updates for test cases
    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', (testCases) => {
            // Filter out deleted and archived items from real-time updates by default
            let filteredTestCases = testCases;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredTestCases = testCases.filter(testCase =>
                    !excludeStatuses.includes(testCase.status)
                );
            }

            callback(filteredTestCases);
        }, errorCallback, sprintId, options);
    }

    async updateTestCase(testCaseId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'testCases', testCaseId, updates, sprintId);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    // ========================
    // BUGS METHODS - FIXED: Default filtering
    // ========================

    async createBug(suiteId, bugData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId);
    }

    // FIXED: Default filtering for bugs
    async getBugs(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId, defaultOptions);
    }

    // FIXED: Filter real-time updates for bugs
    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', (bugs) => {
            // Filter out deleted and archived items from real-time updates by default
            let filteredBugs = bugs;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredBugs = bugs.filter(bug =>
                    !excludeStatuses.includes(bug.status)
                );
            }

            callback(filteredBugs);
        }, errorCallback, sprintId, options);
    }

    async updateBug(bugId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'bugs', bugId, updates, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    // ========================
    // RECOMMENDATIONS METHODS - FIXED: Default filtering
    // ========================

    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recommendations', recommendationData, sprintId);
    }

    // FIXED: Default filtering for recommendations
    async getRecommendations(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'recommendations', sprintId, defaultOptions);
    }

    // FIXED: Filter real-time updates for recommendations
    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'recommendations', (recommendations) => {
            // Filter out deleted and archived items from real-time updates by default
            let filteredRecommendations = recommendations;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredRecommendations = recommendations.filter(rec =>
                    !excludeStatuses.includes(rec.status)
                );
            }

            callback(filteredRecommendations);
        }, errorCallback, sprintId, options);
    }

    async updateRecommendation(recommendationId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'recommendations', recommendationId, updates, sprintId);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // ========================
    // SPRINTS METHODS - FIXED: Default filtering
    // ========================

    async createSprint(suiteId, sprintData) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData);
    }

    // FIXED: Default filtering for sprints
    async getSprints(suiteId, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'sprints', null, defaultOptions);
    }

    // FIXED: Filter real-time updates for sprints
    subscribeToSprints(suiteId, callback, errorCallback = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', (sprints) => {
            // Filter out deleted and archived items from real-time updates by default
            let filteredSprints = sprints;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredSprints = sprints.filter(sprint =>
                    !excludeStatuses.includes(sprint.status)
                );
            }

            callback(filteredSprints);
        }, errorCallback, null, options);
    }

    async updateSprint(sprintId, updates, suiteId) {
        return await this.updateSuiteAsset(suiteId, 'sprints', sprintId, updates);
    }

    async deleteSprint(sprintId, suiteId) {
        return await this.deleteSuiteAsset(suiteId, 'sprints', sprintId);
    }

    async getSprint(sprintId, suiteId) {
        return await this.getSuiteAsset(suiteId, 'sprints', sprintId);
    }

    // Legacy batch methods (unchanged)
    async batchLinkTestCasesToBug(bugId, testCaseIds) {
        return { success: true, data: { bugId, testCaseIds } };
    }

    async batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        return { success: true, data: { bugId, testCaseId } };
    }

    async batchLinkBugsToTestCase(testCaseId, bugIds) {
        return { success: true, data: { testCaseId, bugIds } };
    }

    async batchUnlinkBugFromTestCase(testCaseId, bugId) {
        return { success: true, data: { testCaseId, bugId } };
    }

    async addTestCasesToSprint(sprintId, testCaseIds) {
        return { success: true, data: { sprintId, testCaseIds } };
    }

    async addBugsToSprint(sprintId, bugIds) {
        return { success: true, data: { sprintId, bugIds } };
    }
}