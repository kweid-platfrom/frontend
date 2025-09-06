import { BaseFirestoreService } from './firestoreService'; // Fixed import
import { orderBy } from 'firebase/firestore';

export class AssetService extends BaseFirestoreService {
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

        const data = this.addCommonFields({
            suite_id: suiteId,
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

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    async createBug(suiteId, bugData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId);
    }

    async getTestCases(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId);
    }

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

    // Add these methods to your AssetService class

    async updateSuiteAsset(suiteId, assetType, assetId, updates, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to update ${assetType} in this test suite` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const data = this.addCommonFields({
            ...updates,
            updated_at: new Date(),
            lastActivity: new Date()
        }, false); // false = update mode

        return await this.updateDocument(`${collectionPath}/${assetId}`, data);
    }

    async deleteSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to delete ${assetType} in this test suite` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return await this.deleteDocument(`${collectionPath}/${assetId}`);
    }

    async getSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
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

        return await this.getDocument(`${collectionPath}/${assetId}`);
    }

    // Bug-specific methods
    async updateBug(bugId, updates, suiteId = null, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'bugs', bugId, updates, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    // Test case-specific methods
    async updateTestCase(testCaseId, updates, suiteId = null, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'testCases', testCaseId, updates, sprintId);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    // Recording-specific methods
    async createRecording(suiteId, recordingData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recordings', recordingData, sprintId);
    }

    async updateRecording(recordingId, updates, suiteId = null, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'recordings', recordingId, updates, sprintId);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async getRecordings(suiteId, sprintId = null) {
        return await this.getSuiteAssets(suiteId, 'recordings', sprintId);
    }

    // Sprint-specific methods
    async createSprint(suiteId, sprintData) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData);
    }

    async updateSprint(sprintId, updates, suiteId = null) {
        return await this.updateSuiteAsset(suiteId, 'sprints', sprintId, updates);
    }

    async deleteSprint(sprintId, suiteId) {
        return await this.deleteSuiteAsset(suiteId, 'sprints', sprintId);
    }

    async getSprint(sprintId, suiteId) {
        return await this.getSuiteAsset(suiteId, 'sprints', sprintId);
    }

    async getSprints(suiteId) {
        return await this.getSuiteAssets(suiteId, 'sprints');
    }
}