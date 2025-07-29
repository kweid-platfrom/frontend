import { UserService } from './userService';
import { OrganizationService } from './OrganizationService';
import { TestSuiteService } from './TestSuiteService';
import { AssetService } from './AssetService';

class FirestoreService {
    constructor() {
        this.organization = new OrganizationService();
        this.user = new UserService();
        this.testSuite = new TestSuiteService(this.organization);
        this.assets = new AssetService(this.testSuite);
    }

    getCurrentUserId() {
        return this.user.getCurrentUserId();
    }

    getCurrentUser() {
        return this.user.getCurrentUser();
    }

    getUserProfile(userId) {
        return this.user.getUserProfile(userId);
    }

    createOrUpdateUserProfile(userData) {
        return this.user.createOrUpdateUserProfile(userData);
    }

    subscribeToUserTestSuites(onSuccess, onError) {
        return this.testSuite.subscribeToUserTestSuites(onSuccess, onError);
    }

    createTestSuite(suiteData) {
        return this.testSuite.createTestSuite(suiteData);
    }

    createBug(suiteId, bugData, sprintId = null) {
        return this.assets.createBug(suiteId, bugData, sprintId);
    }

    batchLinkTestCasesToBug(bugId, testCaseIds) {
        return this.assets.batchLinkTestCasesToBug(bugId, testCaseIds);
    }

    batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        return this.assets.batchUnlinkTestCaseFromBug(bugId, testCaseId);
    }

    batchLinkBugsToTestCase(testCaseId, bugIds) {
        return this.assets.batchLinkBugsToTestCase(testCaseId, bugIds);
    }

    batchUnlinkBugFromTestCase(testCaseId, bugId) {
        return this.assets.batchUnlinkBugFromTestCase(testCaseId, bugId);
    }

    addTestCasesToSprint(sprintId, testCaseIds) {
        return this.assets.addTestCasesToSprint(sprintId, testCaseIds);
    }

    addBugsToSprint(sprintId, bugIds) {
        return this.assets.addBugsToSprint(sprintId, bugIds);
    }

    subscribeToTestCases(suiteId, onSuccess, onError) {
        return this.assets.subscribeToTestCases(suiteId, onSuccess, onError);
    }

    subscribeToBugs(suiteId, onSuccess, onError) {
        return this.assets.subscribeToBugs(suiteId, onSuccess, onError);
    }

    subscribeToRecordings(suiteId, onSuccess, onError) {
        return this.assets.subscribeToRecordings(suiteId, onSuccess, onError);
    }

    subscribeToSprints(suiteId, onSuccess, onError) {
        return this.assets.subscribeToSprints(suiteId, onSuccess, onError);
    }

    cleanup() {
        this.user.cleanup();
        this.organization.cleanup();
        this.testSuite.cleanup();
        this.assets.cleanup();
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };