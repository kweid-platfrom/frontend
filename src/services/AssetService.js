// FIXED AssetService.js - Corrected updateDocument calls
import { BaseFirestoreService } from './firestoreService';
import { orderBy } from 'firebase/firestore';

export class AssetService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
    }

    // FIXED: updateSuiteAsset with correct updateDocument call
    async updateSuiteAsset(suiteId, assetType, assetId, updates, sprintId = null) {
        console.log('AssetService.updateSuiteAsset called with:', {
            suiteId,
            assetType,
            assetId,
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            sprintId
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate parameters
        if (!suiteId || typeof suiteId !== 'string') {
            console.error('AssetService.updateSuiteAsset: Invalid suiteId:', suiteId);
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        if (!assetId || typeof assetId !== 'string') {
            console.error('AssetService.updateSuiteAsset: Invalid assetId:', assetId);
            return { success: false, error: { message: 'Invalid asset ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            console.error('AssetService.updateSuiteAsset: Invalid updates:', updates);
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to update ${assetType} in this test suite` } };
        }

        // FIXED: Construct collection path and pass docId separately
        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        console.log('AssetService.updateSuiteAsset paths:', {
            collectionPath,
            assetId
        });

        const data = this.addCommonFields({
            ...updates,
            updated_at: new Date(),
            lastActivity: new Date()
        }, false); // false = update mode

        console.log('AssetService.updateSuiteAsset calling updateDocument with:', {
            collectionPath,
            assetId,
            dataKeys: Object.keys(data)
        });

        // FIXED: Call updateDocument with separate collectionPath and docId parameters
        return await this.updateDocument(collectionPath, assetId, data);
    }

    // FIXED: deleteSuiteAsset with correct deleteDocument call
    async deleteSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to delete ${assetType} in this test suite` } };
        }

        // FIXED: Construct collection path and pass docId separately
        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        // FIXED: Call deleteDocument with separate collectionPath and docId parameters
        return await this.deleteDocument(collectionPath, assetId);
    }

    // FIXED: getSuiteAsset with correct getDocument call
    async getSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType} in this test suite` } };
        }

        // FIXED: Construct collection path and pass docId separately
        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        // FIXED: Call getDocument with separate collectionPath and docId parameters
        return await this.getDocument(collectionPath, assetId);
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

        const data = this.addCommonFields({
            suite_id: suiteId,
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        return await this.createDocument(collectionPath, data);
    }

    async getSuiteAssets(suiteId, assetType, sprintId = null, options = {}) {
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

        // Build constraints based on options
        const constraints = [];

        if (options.includeStatus && options.includeStatus.length > 0) {
            constraints.push(['status', 'in', options.includeStatus]);
        }

        const result = await this.queryDocuments(collectionPath, constraints, 'created_at', null);

        // If we need to exclude certain statuses and couldn't do it in the query, filter here
        if (result.success && options.excludeStatus && options.excludeStatus.length > 0) {
            result.data = result.data.filter(item =>
                !options.excludeStatus.includes(item.status)
            );
        }

        return result;
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

    // Test Cases
    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    async getTestCases(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId);
    }

    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', callback, errorCallback, sprintId);
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

    // Bugs
    async createBug(suiteId, bugData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', callback, errorCallback, sprintId);
    }

    // FIXED: updateBug with correct parameter validation
    async updateBug(bugId, updates, suiteId, sprintId = null) {
        console.log('AssetService.updateBug called with:', {
            bugId,
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            suiteId,
            sprintId
        });

        // Validate parameters before passing to updateSuiteAsset
        if (!bugId || typeof bugId !== 'string') {
            return { success: false, error: { message: 'Invalid bug ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        return await this.updateSuiteAsset(suiteId, 'bugs', bugId, updates, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    // Recommendations
    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recommendations', recommendationData, sprintId);
    }

    async getRecommendations(suiteId, sprintId = null, options = {}) {
        return await this.getSuiteAssets(suiteId, 'recommendations', sprintId, options);
    }

    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recommendations', callback, errorCallback, sprintId);
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

    // Recordings
    async createRecording(suiteId, recordingData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recordings', recordingData, sprintId);
    }

    async getRecordings(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'recordings', sprintId);
    }

    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', callback, errorCallback, sprintId);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    // Sprints
    async createSprint(suiteId, sprintData) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData);
    }

    async getSprints(suiteId, options = {}) {
        return await this.getSuiteAssets(suiteId, 'sprints', null, options);
    }

    subscribeToSprints(suiteId, callback, errorCallback = null) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', callback, errorCallback);
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

    // Legacy batch methods (placeholder implementations)
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