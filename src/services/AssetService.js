import { FirestoreService } from './firestoreService';
import { orderBy } from 'firebase/firestore';

export class AssetService extends FirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
    }

    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to create ${assetType} in this test suite` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        // FIX: Keep suite_id in the data - required by Firestore rules
        const data = this.addCommonFields({
            suite_id: suiteId, // This must stay in the document
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        return await this.createDocument(collectionPath, data);
    }

    async getSuiteAssets(suiteId, assetType, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType} in this test suite` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return await this.queryDocuments(collectionPath, [], 'created_at', null);
    }

    subscribeToSuiteAssets(suiteId, assetType, callback, errorCallback = null, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;
        return this.subscribeToCollection(
            collectionPath,
            [orderBy('created_at', 'desc')],
            callback,
            errorCallback
        );
    }

    // Helper method to find asset by ID across possible locations
    async findAssetLocation() {
        try {
            throw new Error('Asset location lookup not implemented - requires suite/sprint context');
        } catch (error) {
            console.error('Error finding asset location:', error);
            return null;
        }
    }

    // Individual asset CRUD operations that require full path context
    async getAsset(collectionPath, assetId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.getDocument(collectionPath, assetId);
    }

    async updateAsset(collectionPath, assetId, updates) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Extract suite ID from collection path for permission validation
        const pathParts = collectionPath.split('/');
        if (pathParts[0] === 'testSuites' && pathParts[1]) {
            const suiteId = pathParts[1];
            const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
            if (!hasAccess) {
                return { success: false, error: { message: 'Insufficient permissions to update this asset' } };
            }
        }

        return await this.updateDocument(collectionPath, assetId, updates);
    }

    async deleteAsset(collectionPath, assetId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Extract suite ID from collection path for permission validation
        const pathParts = collectionPath.split('/');
        if (pathParts[0] === 'testSuites' && pathParts[1]) {
            const suiteId = pathParts[1];
            const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
            if (!hasAccess) {
                return { success: false, error: { message: 'Insufficient permissions to delete this asset' } };
            }
        }

        return await this.deleteDocument(collectionPath, assetId);
    }

    // Asset creation wrapper methods
    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    async createBug(suiteId, bugData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId);
    }

    async createRecording(suiteId, recordingData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recordings', recordingData, sprintId);
    }

    async createSprint(suiteId, sprintData) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData);
    }

    // Asset retrieval wrapper methods
    async getTestCases(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId);
    }

    // CRUD methods for individual assets
    // Note: These methods require knowledge of the asset's location context
    // The calling code needs to provide suite/sprint information

    async getBug(bugId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/bugs`
            : `testSuites/${suiteId}/bugs`;
        return await this.getAsset(collectionPath, bugId);
    }

    async updateBug(bugId, updates, suiteId = null, sprintId = null) {
        // FIXED: Better suiteId resolution and validation
        let resolvedSuiteId = suiteId;
        
        // If suite context is not provided, try to get it from updates
        if (!resolvedSuiteId) {
            if (updates.suite_id) {
                resolvedSuiteId = updates.suite_id;
            } else {
                return { success: false, error: { message: 'Suite context required for bug update' } };
            }
        }

        // FIXED: More robust suiteId validation and conversion
        if (typeof resolvedSuiteId === 'object') {
            // Handle object cases more carefully
            if (resolvedSuiteId && resolvedSuiteId.id) {
                resolvedSuiteId = resolvedSuiteId.id;
            } else if (resolvedSuiteId && resolvedSuiteId.suiteId) {
                resolvedSuiteId = resolvedSuiteId.suiteId;
            } else if (resolvedSuiteId && typeof resolvedSuiteId.toString === 'function') {
                resolvedSuiteId = resolvedSuiteId.toString();
            } else {
                console.error('Invalid suiteId object:', resolvedSuiteId);
                return { success: false, error: { message: 'Invalid suite ID format provided' } };
            }
        }

        // Ensure we have a valid string ID
        if (!resolvedSuiteId || typeof resolvedSuiteId !== 'string' || resolvedSuiteId.trim() === '') {
            console.error('Invalid suiteId after resolution:', {
                original: suiteId,
                resolved: resolvedSuiteId,
                type: typeof resolvedSuiteId
            });
            return { success: false, error: { message: 'Valid suite ID is required' } };
        }

        console.log('updateBug - suiteId validation passed:', {
            original: suiteId,
            resolved: resolvedSuiteId,
            type: typeof resolvedSuiteId
        });

        const collectionPath = sprintId
            ? `testSuites/${resolvedSuiteId}/sprints/${sprintId}/bugs`
            : `testSuites/${resolvedSuiteId}/bugs`;

        return await this.updateAsset(collectionPath, bugId, updates);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/bugs`
            : `testSuites/${suiteId}/bugs`;
        return await this.deleteAsset(collectionPath, bugId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;
        return await this.getAsset(collectionPath, testCaseId);
    }

    async updateTestCase(testCaseId, updates, suiteId = null, sprintId = null) {
        if (!suiteId) {
            if (updates.suite_id) {
                suiteId = updates.suite_id;
            } else {
                return { success: false, error: { message: 'Suite context required for test case update' } };
            }
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        return await this.updateAsset(collectionPath, testCaseId, updates);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;
        return await this.deleteAsset(collectionPath, testCaseId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/recordings`
            : `testSuites/${suiteId}/recordings`;
        return await this.getAsset(collectionPath, recordingId);
    }

    async updateRecording(recordingId, updates, suiteId = null, sprintId = null) {
        if (!suiteId) {
            if (updates.suite_id) {
                suiteId = updates.suite_id;
            } else {
                return { success: false, error: { message: 'Suite context required for recording update' } };
            }
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/recordings`
            : `testSuites/${suiteId}/recordings`;

        return await this.updateAsset(collectionPath, recordingId, updates);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/recordings`
            : `testSuites/${suiteId}/recordings`;
        return await this.deleteAsset(collectionPath, recordingId);
    }

    async getSprint(sprintId, suiteId) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.getAsset(collectionPath, sprintId);
    }

    async updateSprint(sprintId, updates, suiteId = null) {
        if (!suiteId) {
            if (updates.suite_id) {
                suiteId = updates.suite_id;
            } else {
                return { success: false, error: { message: 'Suite context required for sprint update' } };
            }
        }

        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.updateAsset(collectionPath, sprintId, updates);
    }

    async deleteSprint(sprintId, suiteId) {
        const collectionPath = `testSuites/${suiteId}/sprints`;
        return await this.deleteAsset(collectionPath, sprintId);
    }

    // Subscription methods
    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', callback, errorCallback, sprintId);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', callback, errorCallback, sprintId);
    }

    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', callback, errorCallback, sprintId);
    }

    subscribeToSprints(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', callback, errorCallback, sprintId);
    }

    // Batch operations
    async batchLinkTestCasesToBug(bugId, testCaseIds) {
        // Implementation would require batch operations with proper Firestore paths
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