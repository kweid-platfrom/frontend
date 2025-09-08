import { BaseFirestoreService } from './firestoreService';
import { UserService } from './userService';
import { OrganizationService } from './OrganizationService';
import { TestSuiteService } from './TestSuiteService';
import { AssetService } from './AssetService';
import { BugService } from './bugService';
import { ArchiveTrashService } from './archiveTrashService';

class FirestoreService extends BaseFirestoreService {
    constructor() {
        super();

        // Initialize services in dependency order
        this.organization = new OrganizationService();
        this.testSuite = new TestSuiteService(this.organization);
        this.assets = new AssetService(this.testSuite);
        this.user = new UserService();

        // Initialize BugService after AssetService is ready
        this.bugs = new BugService(this.assets, this.testSuite);

        // Initialize ArchiveTrashService
        this.archiveTrash = new ArchiveTrashService(this.testSuite);

        this.recordings = {
            createRecording: (recordingData) => {
                return this.assets.createRecording(recordingData.suiteId, recordingData);
            },
            linkRecordingToBug: async (recordingId, bugId) => {
                return { success: true, data: { recordingId, bugId } };
            },
            subscribeToRecordings: (suiteId, callback, errorCallback) => {
                return this.assets.subscribeToRecordings(suiteId, callback, errorCallback);
            }
        };

        this.reports = {
            getReports: async (orgId) => {
                try {
                    const hasAccess = await this.organization.validateOrganizationAccess(orgId, 'member');
                    if (!hasAccess) {
                        return {
                            success: false,
                            error: { message: 'Access denied. You are not a member of this organization.' }
                        };
                    }
                    return await this.organization.getReports?.(orgId) || { success: true, data: [] };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            saveReport: async (reportData) => {
                try {
                    if (reportData.organizationId) {
                        const hasAccess = await this.organization.validateOrganizationAccess(
                            reportData.organizationId,
                            'manager'
                        );
                        if (!hasAccess) {
                            return {
                                success: false,
                                error: { message: 'Access denied. Manager role required to save reports.' }
                            };
                        }
                    }
                    return await this.organization.saveReport?.(reportData) || { success: true, data: reportData };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            deleteReport: async (reportId, organizationId) => {
                try {
                    if (organizationId) {
                        const hasAccess = await this.organization.validateOrganizationAccess(
                            organizationId,
                            'admin'
                        );
                        if (!hasAccess) {
                            return {
                                success: false,
                                error: { message: 'Access denied. Admin role required to delete reports.' }
                            };
                        }
                    }
                    return await this.organization.deleteReport?.(reportId) || { success: true };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            toggleSchedule: async ({ organizationId, enabled }) => {
                try {
                    const hasAccess = await this.organization.validateOrganizationAccess(
                        organizationId,
                        'admin'
                    );
                    if (!hasAccess) {
                        return {
                            success: false,
                            error: { message: 'Access denied. Admin role required to manage report schedules.' }
                        };
                    }
                    return await this.organization.toggleSchedule?.({ organizationId, enabled }) ||
                        { success: true, data: { enabled } };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            },
            subscribeToTriggers: (orgId, callback) => {
                try {
                    return this.organization.subscribeToTriggers?.(orgId, callback) || (() => { });
                } catch (error) {
                    console.error('Error subscribing to triggers:', error);
                    return () => { };
                }
            },
            generatePDF: async (report) => {
                try {
                    if (report.organizationId) {
                        const hasAccess = await this.organization.validateOrganizationAccess(
                            report.organizationId,
                            'member'
                        );
                        if (!hasAccess) {
                            return {
                                success: false,
                                error: { message: 'Access denied. Organization membership required to generate PDFs.' }
                            };
                        }
                    }
                    return await this.organization.generatePDF?.(report) ||
                        { success: true, data: { url: `/pdf/${report.id}` } };
                } catch (error) {
                    return { success: false, error: { message: error.message } };
                }
            }
        };
    }

    // ========================
    // ORGANIZATION METHODS
    // ========================

    async createOrganization(orgData, userId = null) {
        const currentUserId = userId || this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }
        return await this.organization.createOrganization(orgData, currentUserId);
    }

    async getOrganization(orgId) {
        if (!orgId) {
            return { success: false, error: { message: 'Organization ID is required' } };
        }
        return await this.organization.getOrganization(orgId);
    }

    async updateOrganization(orgId, updateData) {
        if (!orgId) {
            return { success: false, error: { message: 'Organization ID is required' } };
        }
        return await this.organization.updateOrganization(orgId, updateData);
    }

    async deleteOrganization(orgId) {
        if (!orgId) {
            return { success: false, error: { message: 'Organization ID is required' } };
        }
        return await this.organization.deleteOrganization(orgId);
    }

    async getUserOrganizations(userId = null) {
        return await this.organization.getUserOrganizations(userId);
    }

    async addOrganizationMember(orgId, memberData) {
        if (!orgId || !memberData) {
            return { success: false, error: { message: 'Organization ID and member data are required' } };
        }
        return await this.organization.addOrganizationMember(orgId, memberData);
    }

    async removeOrganizationMember(orgId, memberId) {
        if (!orgId || !memberId) {
            return { success: false, error: { message: 'Organization ID and member ID are required' } };
        }
        return await this.organization.removeOrganizationMember(orgId, memberId);
    }

    async getOrganizationMembers(orgId) {
        if (!orgId) {
            return { success: false, error: { message: 'Organization ID is required' } };
        }
        return await this.organization.getOrganizationMembers(orgId);
    }

    // ========================
    // USER METHODS
    // ========================

    getUserProfile(userId) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }
        return this.user.getUserProfile(userId);
    }

    createOrUpdateUserProfile(userData) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }
        if (userData.user_id && userData.user_id !== currentUserId) {
            return { success: false, error: { message: 'Cannot update another user\'s profile' } };
        }
        return this.user.createOrUpdateUserProfile({
            ...userData,
            user_id: currentUserId
        });
    }

    async updateOrganizationMembership(userId, organizationId, role) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }
        const hasAccess = await this.organization.validateOrganizationAccess(organizationId, 'admin');
        if (!hasAccess) {
            return {
                success: false,
                error: { message: 'Access denied. Admin role required to update memberships.' }
            };
        }
        return this.user.updateOrganizationMembership(userId, organizationId, role);
    }

    async hasOrganizationRole(userId, organizationId, requiredRole) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return false;
        }
        if (userId === currentUserId) {
            return this.user.hasOrganizationRole(userId, organizationId, requiredRole);
        }
        const hasAccess = await this.organization.validateOrganizationAccess(organizationId, 'admin');
        if (!hasAccess) {
            return false;
        }
        return this.user.hasOrganizationRole(userId, organizationId, requiredRole);
    }

    // ========================
    // TEST SUITE METHODS
    // ========================

    async getUserTestSuites() {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }
        return await this.testSuite.getUserTestSuites();
    }

    subscribeToUserTestSuites(onSuccess, onError) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            onError?.({ success: false, error: { message: 'Authentication required' } });
            return () => { };
        }
        return this.testSuite.subscribeToUserTestSuites(onSuccess, onError);
    }

    async createTestSuite(suiteData) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        // Basic validation
        if (!suiteData.name || suiteData.name.trim().length < 2 || suiteData.name.trim().length > 100) {
            return {
                success: false,
                error: { message: 'Test suite name must be between 2 and 100 characters' }
            };
        }
        if (!suiteData.ownerType || !['individual', 'organization'].includes(suiteData.ownerType)) {
            return {
                success: false,
                error: { message: 'Owner type must be either "individual" or "organization"' }
            };
        }

        // Organization-specific validation
        if (suiteData.ownerType === 'organization') {
            if (!suiteData.ownerId) {
                return {
                    success: false,
                    error: { message: 'Organization ID is required for organization test suites' }
                };
            }
            const hasAccess = await this.organization.validateOrganizationAccess(
                suiteData.ownerId,
                'manager'
            );
            if (!hasAccess) {
                return {
                    success: false,
                    error: { message: 'Access denied. Manager role required to create organization test suites.' }
                };
            }
        } else if (suiteData.ownerType === 'individual') {
            if (suiteData.ownerId !== currentUserId) {
                return {
                    success: false,
                    error: { message: 'Cannot create test suite for another user' }
                };
            }
        }

        // Prepare suite data and delegate to TestSuiteService
        const preparedSuiteData = {
            ...suiteData,
            name: suiteData.name.trim(),
            // Ensure these fields are set for TestSuiteService
            access_control: {
                ownerType: suiteData.ownerType,
                ownerId: suiteData.ownerId,
                admins: suiteData.access_control?.admins || [currentUserId],
                members: suiteData.access_control?.members || [currentUserId],
                permissions_matrix: suiteData.access_control?.permissions_matrix || {}
            },
            admins: suiteData.admins?.includes(currentUserId) ? suiteData.admins : [...(suiteData.admins || []), currentUserId],
            members: suiteData.members?.includes(currentUserId) ? suiteData.members : [...(suiteData.members || []), currentUserId]
        };

        return await this.testSuite.createTestSuite(preparedSuiteData);
    }

    async validateSuiteAccess(suiteId, requiredPermission = 'read') {
        if (!suiteId) {
            return { success: false, error: { message: 'Suite ID is required' } };
        }

        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return { success: false, error: { message: 'Authentication required' } };
        }

        try {
            const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, requiredPermission);
            if (hasAccess) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: { message: 'Access denied. You do not have permission to access this test suite.' }
                };
            }
        } catch (error) {
            return { success: false, error: { message: `Failed to validate suite access: ${error.message}` } };
        }
    }

    // ========================
    // BUG METHODS (delegated to BugService)
    // ========================

    async createBug(suiteId, bugData, sprintId = null) {
        return await this.bugs.createBug(suiteId, bugData, sprintId);
    }

    async updateBug(bugId, updates, suiteId = null, sprintId = null) {
        return await this.bugs.updateBug(bugId, updates, suiteId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.bugs.getBug(bugId, suiteId, sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        // Only return active (non-archived, non-deleted) bugs by default
        return await this.bugs.getBugs(suiteId, sprintId, { excludeStatus: ['archived', 'deleted'] });
    }

    async getAllBugs(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        return await this.bugs.getBugs(suiteId, sprintId, { includeStatus });
    }

    subscribeToBugs(suiteId, onSuccess, onError) {
        return this.bugs.subscribeToBugs(suiteId, onSuccess, onError);
    }

    // ========================
    // RECOMMENDATION METHODS (delegated to BugService)
    // ========================

    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        return await this.bugs.createRecommendation(suiteId, recommendationData, sprintId);
    }

    async updateRecommendation(recommendationId, updates, suiteId = null, sprintId = null) {
        return await this.bugs.updateRecommendation(recommendationId, updates, suiteId, sprintId);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.bugs.deleteRecommendation(recommendationId, suiteId, sprintId);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.bugs.getRecommendation(recommendationId, suiteId, sprintId);
    }

    async getRecommendations(suiteId, sprintId = null) {
        return await this.bugs.getRecommendations(suiteId, sprintId);
    }

    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.bugs.subscribeToRecommendations(suiteId, callback, errorCallback, sprintId);
    }

    // ========================
    // LINKING METHODS (delegated to BugService)
    // ========================

    async linkTestCasesToBug(suiteId, bugId, testCaseIds, sprintId = null) {
        return await this.bugs.linkTestCasesToBug(suiteId, bugId, testCaseIds, sprintId);
    }

    async unlinkTestCasesFromBug(suiteId, bugId, testCaseIds, sprintId = null) {
        return await this.bugs.unlinkTestCasesFromBug(suiteId, bugId, testCaseIds, sprintId);
    }

    async linkBugsToTestCase(suiteId, testCaseId, bugIds, sprintId = null) {
        return await this.bugs.linkBugsToTestCase(suiteId, testCaseId, bugIds, sprintId);
    }

    async getLinkedTestCasesForBug(suiteId, bugId, sprintId = null) {
        return await this.bugs.getLinkedTestCasesForBug(suiteId, bugId, sprintId);
    }

    async getLinkedBugsForTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.bugs.getLinkedBugsForTestCase(suiteId, testCaseId, sprintId);
    }

    async getAvailableTestCasesForLinking(suiteId, bugId, sprintId = null) {
        return await this.bugs.getAvailableTestCasesForLinking(suiteId, bugId, sprintId);
    }

    async getAvailableBugsForLinking(suiteId, testCaseId, sprintId = null) {
        return await this.bugs.getAvailableBugsForLinking(suiteId, testCaseId, sprintId);
    }

    async bulkLinkTestCasesToBugs(suiteId, bugIds, testCaseIds, sprintId = null) {
        return await this.bugs.bulkLinkTestCasesToBugs(suiteId, bugIds, testCaseIds, sprintId);
    }

    async bulkLinkBugsToTestCases(suiteId, testCaseIds, bugIds, sprintId = null) {
        return await this.bugs.bulkLinkBugsToTestCases(suiteId, testCaseIds, bugIds, sprintId);
    }

    // ========================
    // TEST CASE METHODS (delegated to AssetService)
    // ========================

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createTestCase(suiteId, testCaseData, sprintId);
    }

    async updateTestCase(testCaseId, updates, suiteId = null, sprintId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateTestCase(testCaseId, updates, suiteId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getTestCase(testCaseId, suiteId, sprintId);
    }

    async getTestCases(suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        // Only return active (non-archived, non-deleted) test cases by default
        return this.assets.getTestCases(suiteId, sprintId, { excludeStatus: ['archived', 'deleted'] });
    }

    async getAllTestCases(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getTestCases(suiteId, sprintId, { includeStatus });
    }

    subscribeToTestCases(suiteId, onSuccess, onError) {
        return this.assets.subscribeToTestCases(suiteId, onSuccess, onError);
    }

    // ========================
    // RECORDING METHODS (delegated to AssetService)
    // ========================

    async createRecording(suiteId, recordingData, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createRecording(suiteId, recordingData, sprintId);
    }

    async updateRecording(recordingId, updates, suiteId = null, sprintId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getRecording(recordingId, suiteId, sprintId);
    }

    async getRecordings(suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        // Only return active (non-archived, non-deleted) recordings by default
        return this.assets.getRecordings(suiteId, sprintId, { excludeStatus: ['archived', 'deleted'] });
    }

    async getAllRecordings(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getRecordings(suiteId, sprintId, { includeStatus });
    }

    subscribeToRecordings(suiteId, onSuccess, onError) {
        return this.assets.subscribeToRecordings(suiteId, onSuccess, onError);
    }

    // ========================
    // SPRINT METHODS (delegated to AssetService)
    // ========================

    async createSprint(suiteId, sprintData) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createSprint(suiteId, sprintData);
    }

    async updateSprint(sprintId, updates, suiteId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateSprint(sprintId, updates, suiteId);
    }

    async getSprint(sprintId, suiteId) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getSprint(sprintId, suiteId);
    }

    async getSprints(suiteId) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        // Only return active (non-archived, non-deleted) sprints by default
        return this.assets.getSprints(suiteId, { excludeStatus: ['archived', 'deleted'] });
    }

    async getAllSprints(suiteId, includeStatus = ['active', 'archived', 'deleted']) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getSprints(suiteId, { includeStatus });
    }

    subscribeToSprints(suiteId, onSuccess, onError) {
        return this.assets.subscribeToSprints(suiteId, onSuccess, onError);
    }

    // ========================
    // LEGACY BATCH METHODS (keep for compatibility)
    // ========================

    async batchLinkTestCasesToBug(bugId, testCaseIds) {
        return this.assets.batchLinkTestCasesToBug(bugId, testCaseIds);
    }

    async batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        return this.assets.batchUnlinkTestCaseFromBug(bugId, testCaseId);
    }

    async batchLinkBugsToTestCase(testCaseId, bugIds) {
        return this.assets.batchLinkBugsToTestCase(testCaseId, bugIds);
    }

    async batchUnlinkBugFromTestCase(testCaseId, bugId) {
        return this.assets.batchUnlinkBugFromTestCase(testCaseId, bugId);
    }

    async addTestCasesToSprint(sprintId, testCaseIds) {
        return this.assets.addTestCasesToSprint(sprintId, testCaseIds);
    }

    async addBugsToSprint(sprintId, bugIds) {
        return this.assets.addBugsToSprint(sprintId, bugIds);
    }

    // ========================
    // ARCHIVE OPERATIONS
    // ========================

    async archiveTestCase(suiteId, testCaseId, sprintId = null, reason = null) {
        return await this.archiveTrash.archiveAsset(suiteId, 'testCases', testCaseId, sprintId, reason);
    }

    async archiveBug(suiteId, bugId, sprintId = null, reason = null) {
        return await this.archiveTrash.archiveAsset(suiteId, 'bugs', bugId, sprintId, reason);
    }

    async archiveRecording(suiteId, recordingId, sprintId = null, reason = null) {
        return await this.archiveTrash.archiveAsset(suiteId, 'recordings', recordingId, sprintId, reason);
    }

    async archiveSprint(suiteId, sprintId, reason = null) {
        return await this.archiveTrash.archiveAsset(suiteId, 'sprints', sprintId, null, reason);
    }

    async archiveRecommendation(suiteId, recommendationId, sprintId = null, reason = null) {
        return await this.archiveTrash.archiveAsset(suiteId, 'recommendations', recommendationId, sprintId, reason);
    }

    // ========================
    // UNARCHIVE OPERATIONS
    // ========================

    async unarchiveTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.unarchiveAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async unarchiveBug(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.unarchiveAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async unarchiveRecording(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.unarchiveAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async unarchiveSprint(suiteId, sprintId) {
        return await this.archiveTrash.unarchiveAsset(suiteId, 'sprints', sprintId, null);
    }

    async unarchiveRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.unarchiveAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // ========================
    // TRASH OPERATIONS (Soft Delete)
    // ========================

    async moveTestCaseToTrash(suiteId, testCaseId, sprintId = null, reason = null) {
        return await this.archiveTrash.softDeleteAsset(suiteId, 'testCases', testCaseId, sprintId, reason);
    }

    async moveBugToTrash(suiteId, bugId, sprintId = null, reason = null) {
        return await this.archiveTrash.softDeleteAsset(suiteId, 'bugs', bugId, sprintId, reason);
    }

    async moveRecordingToTrash(suiteId, recordingId, sprintId = null, reason = null) {
        return await this.archiveTrash.softDeleteAsset(suiteId, 'recordings', recordingId, sprintId, reason);
    }

    async moveSprintToTrash(suiteId, sprintId, reason = null) {
        return await this.archiveTrash.softDeleteAsset(suiteId, 'sprints', sprintId, null, reason);
    }

    async moveRecommendationToTrash(suiteId, recommendationId, sprintId = null, reason = null) {
        return await this.archiveTrash.softDeleteAsset(suiteId, 'recommendations', recommendationId, sprintId, reason);
    }

    // ========================
    // RESTORE FROM TRASH OPERATIONS
    // ========================

    async restoreTestCaseFromTrash(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.restoreFromTrash(suiteId, 'testCases', testCaseId, sprintId);
    }

    async restoreBugFromTrash(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.restoreFromTrash(suiteId, 'bugs', bugId, sprintId);
    }

    async restoreRecordingFromTrash(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.restoreFromTrash(suiteId, 'recordings', recordingId, sprintId);
    }

    async restoreSprintFromTrash(suiteId, sprintId) {
        return await this.archiveTrash.restoreFromTrash(suiteId, 'sprints', sprintId, null);
    }

    async restoreRecommendationFromTrash(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.restoreFromTrash(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // ========================
    // PERMANENT DELETE OPERATIONS
    // ========================

    async permanentlyDeleteTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async permanentlyDeleteBug(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async permanentlyDeleteRecording(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteAsset(suiteId, 'recordings', recordingId, sprintId);
    }

    async permanentlyDeleteSprint(suiteId, sprintId) {
        return await this.archiveTrash.permanentlyDeleteAsset(suiteId, 'sprints', sprintId, null);
    }

    async permanentlyDeleteRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // ========================
    // BULK OPERATIONS
    // ========================

    async bulkArchive(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        return await this.archiveTrash.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
    }

    async bulkRestore(suiteId, assetType, assetIds, sprintId = null, fromTrash = false) {
        return await this.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, fromTrash);
    }

    async bulkPermanentDelete(suiteId, assetType, assetIds, sprintId = null) {
        return await this.archiveTrash.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
    }

    // ========================
    // QUERY METHODS
    // ========================

    async getArchivedItems(suiteId, assetType, sprintId = null) {
        return await this.archiveTrash.getArchivedAssets(suiteId, assetType, sprintId);
    }

    async getTrashedItems(suiteId, assetType, sprintId = null) {
        return await this.archiveTrash.getTrashedAssets(suiteId, assetType, sprintId);
    }

    async getExpiredItems(suiteId, assetType, sprintId = null) {
        return await this.archiveTrash.getExpiredItems(suiteId, assetType, sprintId);
    }

    // ========================
    // CLEANUP OPERATIONS
    // ========================

    async cleanupExpiredItems(suiteId, assetType, sprintId = null, dryRun = false) {
        return await this.archiveTrash.cleanupExpiredItems(suiteId, assetType, sprintId, dryRun);
    }

    // ========================
    // ARCHIVE AND TRASH MANAGEMENT
    // ========================

    async getAssetCounts(suiteId) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.getAssetCounts(suiteId);
    }

    async cleanupExpiredAssets(suiteId, assetType, sprintId = null, dryRun = true) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.cleanupExpiredItems(suiteId, assetType, sprintId, dryRun);
    }

    // ========================
    // BATCH ARCHIVE/RESTORE OPERATIONS
    // ========================

    async batchArchiveAssets(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
    }

    async batchRestoreFromArchive(suiteId, assetType, assetIds, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, false);
    }

    async batchRestoreFromTrash(suiteId, assetType, assetIds, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, true);
    }

    async batchPermanentDeleteAssets(suiteId, assetType, assetIds, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return await this.archiveTrash.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
    }

    // ========================
    // MODIFIED EXISTING DELETE METHODS TO USE SOFT DELETE
    // ========================

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        // Use soft delete (move to trash) instead of permanent delete
        return await this.moveTestCaseToTrash(suiteId, testCaseId, sprintId, 'User deletion');
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        // Use soft delete (move to trash) instead of permanent delete
        return await this.moveBugToTrash(suiteId, bugId, sprintId, 'User deletion');
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        // Use soft delete (move to trash) instead of permanent delete
        return await this.moveRecordingToTrash(suiteId, recordingId, sprintId, 'User deletion');
    }

    async deleteSprint(sprintId, suiteId) {
        // Use soft delete (move to trash) instead of permanent delete
        return await this.moveSprintToTrash(suiteId, sprintId, 'User deletion');
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        // Use soft delete (move to trash) instead of permanent delete
        return await this.moveRecommendationToTrash(suiteId, recommendationId, sprintId, 'User deletion');
    }

    // ========================
    // CLEANUP
    // ========================

    cleanup() {
        super.cleanup();
        this.user?.cleanup?.();
        this.organization?.cleanup?.();
        this.testSuite?.cleanup?.();
        this.assets?.cleanup?.();
        this.bugs?.cleanup?.();
        this.archiveTrash?.cleanup?.();
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };