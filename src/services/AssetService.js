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
}