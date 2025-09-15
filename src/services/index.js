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
    // FIXED DELETE OPERATIONS - Using Direct Asset Updates
    // ========================

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        console.log('FirestoreService.deleteTestCase called:', { testCaseId, suiteId, sprintId });
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete test case' } };
        }

        // Use AssetService updateTestCase method directly with delete status
        return await this.assets.updateTestCase(testCaseId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        console.log('FirestoreService.deleteBug called:', { bugId, suiteId, sprintId });
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete bug' } };
        }

        // Use AssetService updateBug method directly with delete status
        return await this.assets.updateBug(bugId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        console.log('FirestoreService.deleteRecording called:', { recordingId, suiteId, sprintId });
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete recording' } };
        }

        // Use AssetService updateRecording method directly with delete status
        return await this.assets.updateRecording(recordingId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteSprint(sprintId, suiteId) {
        console.log('FirestoreService.deleteSprint called:', { sprintId, suiteId });
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete sprint' } };
        }

        // Use AssetService updateSprint method directly with delete status
        return await this.assets.updateSprint(sprintId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            delete_reason: 'User deletion'
        }, suiteId);
    }

    // FIXED: Delete recommendation using direct asset update
    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        console.log('FirestoreService.deleteRecommendation called:', { recommendationId, suiteId, sprintId });
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to delete recommendation' } };
        }

        // Use AssetService updateRecommendation method directly with delete status
        return await this.assets.updateRecommendation(recommendationId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    // ========================
    // FIXED ARCHIVE OPERATIONS - Using Direct Asset Updates
    // ========================

    async archiveTestCase(suiteId, testCaseId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive test case' } };
        }

        return await this.assets.updateTestCase(testCaseId, {
            status: 'archived',
            archived_at: new Date(),
            archived_by: userId,
            ...(reason && { archive_reason: reason })
        }, suiteId, sprintId);
    }

    async archiveBug(suiteId, bugId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive bug' } };
        }

        return await this.assets.updateBug(bugId, {
            status: 'archived',
            archived_at: new Date(),
            archived_by: userId,
            ...(reason && { archive_reason: reason })
        }, suiteId, sprintId);
    }

    async archiveRecording(suiteId, recordingId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive recording' } };
        }

        return await this.assets.updateRecording(recordingId, {
            status: 'archived',
            archived_at: new Date(),
            archived_by: userId,
            ...(reason && { archive_reason: reason })
        }, suiteId, sprintId);
    }

    async archiveSprint(suiteId, sprintId, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive sprint' } };
        }

        return await this.assets.updateSprint(sprintId, {
            status: 'archived',
            archived_at: new Date(),
            archived_by: userId,
            ...(reason && { archive_reason: reason })
        }, suiteId);
    }

    async archiveRecommendation(suiteId, recommendationId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to archive recommendation' } };
        }

        return await this.assets.updateRecommendation(recommendationId, {
            status: 'archived',
            archived_at: new Date(),
            archived_by: userId,
            ...(reason && { archive_reason: reason })
        }, suiteId, sprintId);
    }

    // ========================
    // UNARCHIVE OPERATIONS
    // ========================

    async unarchiveTestCase(suiteId, testCaseId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unarchive test case' } };
        }

        return await this.assets.updateTestCase(testCaseId, {
            status: 'active',
            unarchived_at: new Date(),
            unarchived_by: userId,
            archived_at: null,
            archived_by: null,
            archive_reason: null
        }, suiteId, sprintId);
    }

    async unarchiveBug(suiteId, bugId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unarchive bug' } };
        }

        return await this.assets.updateBug(bugId, {
            status: 'active',
            unarchived_at: new Date(),
            unarchived_by: userId,
            archived_at: null,
            archived_by: null,
            archive_reason: null
        }, suiteId, sprintId);
    }

    async unarchiveRecording(suiteId, recordingId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unarchive recording' } };
        }

        return await this.assets.updateRecording(recordingId, {
            status: 'active',
            unarchived_at: new Date(),
            unarchived_by: userId,
            archived_at: null,
            archived_by: null,
            archive_reason: null
        }, suiteId, sprintId);
    }

    async unarchiveSprint(suiteId, sprintId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unarchive sprint' } };
        }

        return await this.assets.updateSprint(sprintId, {
            status: 'active',
            unarchived_at: new Date(),
            unarchived_by: userId,
            archived_at: null,
            archived_by: null,
            archive_reason: null
        }, suiteId);
    }

    async unarchiveRecommendation(suiteId, recommendationId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unarchive recommendation' } };
        }

        return await this.assets.updateRecommendation(recommendationId, {
            status: 'active',
            unarchived_at: new Date(),
            unarchived_by: userId,
            archived_at: null,
            archived_by: null,
            archive_reason: null
        }, suiteId, sprintId);
    }

    // ========================
    // RESTORE FROM TRASH OPERATIONS
    // ========================

    async restoreTestCaseFromTrash(suiteId, testCaseId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore test case' } };
        }

        return await this.assets.updateTestCase(testCaseId, {
            status: 'active',
            restored_at: new Date(),
            restored_by: userId,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            expires_at: null
        }, suiteId, sprintId);
    }

    async restoreBugFromTrash(suiteId, bugId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore bug' } };
        }

        return await this.assets.updateBug(bugId, {
            status: 'active',
            restored_at: new Date(),
            restored_by: userId,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            expires_at: null
        }, suiteId, sprintId);
    }

    async restoreRecordingFromTrash(suiteId, recordingId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore recording' } };
        }

        return await this.assets.updateRecording(recordingId, {
            status: 'active',
            restored_at: new Date(),
            restored_by: userId,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            expires_at: null
        }, suiteId, sprintId);
    }

    async restoreSprintFromTrash(suiteId, sprintId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore sprint' } };
        }

        return await this.assets.updateSprint(sprintId, {
            status: 'active',
            restored_at: new Date(),
            restored_by: userId,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            expires_at: null
        }, suiteId);
    }

    async restoreRecommendationFromTrash(suiteId, recommendationId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to restore recommendation' } };
        }

        return await this.assets.updateRecommendation(recommendationId, {
            status: 'active',
            restored_at: new Date(),
            restored_by: userId,
            deleted_at: null,
            deleted_by: null,
            delete_reason: null,
            expires_at: null
        }, suiteId, sprintId);
    }

    // ========================
    // PERMANENT DELETE OPERATIONS (Admin only)
    // ========================

    async permanentlyDeleteTestCase(suiteId, testCaseId, sprintId = null) {
        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Admin permissions required for permanent deletion' } };
        }
        return await this.assets.deleteTestCase(testCaseId, suiteId, sprintId);
    }

    async permanentlyDeleteBug(suiteId, bugId, sprintId = null) {
        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Admin permissions required for permanent deletion' } };
        }
        return await this.assets.deleteBug(bugId, suiteId, sprintId);
    }

    async permanentlyDeleteRecording(suiteId, recordingId, sprintId = null) {
        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Admin permissions required for permanent deletion' } };
        }
        return await this.assets.deleteRecording(recordingId, suiteId, sprintId);
    }

    async permanentlyDeleteSprint(suiteId, sprintId) {
        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Admin permissions required for permanent deletion' } };
        }
        return await this.assets.deleteSprint(sprintId, suiteId);
    }

    async permanentlyDeleteRecommendation(suiteId, recommendationId, sprintId = null) {
        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: 'Admin permissions required for permanent deletion' } };
        }
        return await this.assets.deleteRecommendation(recommendationId, suiteId, sprintId);
    }

    // ========================
    // QUERY METHODS FOR ARCHIVED/DELETED ITEMS
    // ========================

    async getArchivedItems(suiteId, assetType, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;

        const options = { includeStatus: ['archived'] };
        
        switch (assetType) {
            case 'testCases':
                return await this.assets.getSuiteAssets(suiteId, 'testCases', sprintId, options);
            case 'bugs':
                return await this.assets.getSuiteAssets(suiteId, 'bugs', sprintId, options);
            case 'recordings':
                return await this.assets.getSuiteAssets(suiteId, 'recordings', sprintId, options);
            case 'sprints':
                return await this.assets.getSuiteAssets(suiteId, 'sprints', null, options);
            case 'recommendations':
                return await this.assets.getSuiteAssets(suiteId, 'recommendations', sprintId, options);
            default:
                return { success: false, error: { message: `Unknown asset type: ${assetType}` } };
        }
    }

    async getTrashedItems(suiteId, assetType, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;

        const options = { includeStatus: ['deleted'] };
        
        switch (assetType) {
            case 'testCases':
                return await this.assets.getSuiteAssets(suiteId, 'testCases', sprintId, options);
            case 'bugs':
                return await this.assets.getSuiteAssets(suiteId, 'bugs', sprintId, options);
            case 'recordings':
                return await this.assets.getSuiteAssets(suiteId, 'recordings', sprintId, options);
            case 'sprints':
                return await this.assets.getSuiteAssets(suiteId, 'sprints', null, options);
            case 'recommendations':
                return await this.assets.getSuiteAssets(suiteId, 'recommendations', sprintId, options);
            default:
                return { success: false, error: { message: `Unknown asset type: ${assetType}` } };
        }
    }

    // ========================
    // BULK OPERATIONS
    // ========================

    async bulkDelete(suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk deletion') {
        const results = [];
        
        for (const assetId of assetIds) {
            let result;
            switch (assetType) {
                case 'testCases':
                    result = await this.deleteTestCase(assetId, suiteId, sprintId);
                    break;
                case 'bugs':
                    result = await this.deleteBug(assetId, suiteId, sprintId);
                    break;
                case 'recordings':
                    result = await this.deleteRecording(assetId, suiteId, sprintId);
                    break;
                case 'sprints':
                    result = await this.deleteSprint(assetId, suiteId);
                    break;
                case 'recommendations':
                    result = await this.deleteRecommendation(assetId, suiteId, sprintId);
                    break;
                default:
                    result = { success: false, error: { message: `Unknown asset type: ${assetType}` } };
            }
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

    async bulkArchive(suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk archive') {
        const results = [];
        
        for (const assetId of assetIds) {
            let result;
            switch (assetType) {
                case 'testCases':
                    result = await this.archiveTestCase(suiteId, assetId, sprintId, reason);
                    break;
                case 'bugs':
                    result = await this.archiveBug(suiteId, assetId, sprintId, reason);
                    break;
                case 'recordings':
                    result = await this.archiveRecording(suiteId, assetId, sprintId, reason);
                    break;
                case 'sprints':
                    result = await this.archiveSprint(suiteId, assetId, reason);
                    break;
                case 'recommendations':
                    result = await this.archiveRecommendation(suiteId, assetId, sprintId, reason);
                    break;
                default:
                    result = { success: false, error: { message: `Unknown asset type: ${assetType}` } };
            }
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
            let result;
            if (fromTrash) {
                switch (assetType) {
                    case 'testCases':
                        result = await this.restoreTestCaseFromTrash(suiteId, assetId, sprintId);
                        break;
                    case 'bugs':
                        result = await this.restoreBugFromTrash(suiteId, assetId, sprintId);
                        break;
                    case 'recordings':
                        result = await this.restoreRecordingFromTrash(suiteId, assetId, sprintId);
                        break;
                    case 'sprints':
                        result = await this.restoreSprintFromTrash(suiteId, assetId);
                        break;
                    case 'recommendations':
                        result = await this.restoreRecommendationFromTrash(suiteId, assetId, sprintId);
                        break;
                    default:
                        result = { success: false, error: { message: `Unknown asset type: ${assetType}` } };
                }
            } else {
                switch (assetType) {
                    case 'testCases':
                        result = await this.unarchiveTestCase(suiteId, assetId, sprintId);
                        break;
                    case 'bugs':
                        result = await this.unarchiveBug(suiteId, assetId, sprintId);
                        break;
                    case 'recordings':
                        result = await this.unarchiveRecording(suiteId, assetId, sprintId);
                        break;
                    case 'sprints':
                        result = await this.unarchiveSprint(suiteId, assetId);
                        break;
                    case 'recommendations':
                        result = await this.unarchiveRecommendation(suiteId, assetId, sprintId);
                        break;
                    default:
                        result = { success: false, error: { message: `Unknown asset type: ${assetType}` } };
                }
            }
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
            let result;
            switch (assetType) {
                case 'testCases':
                    result = await this.permanentlyDeleteTestCase(suiteId, assetId, sprintId);
                    break;
                case 'bugs':
                    result = await this.permanentlyDeleteBug(suiteId, assetId, sprintId);
                    break;
                case 'recordings':
                    result = await this.permanentlyDeleteRecording(suiteId, assetId, sprintId);
                    break;
                case 'sprints':
                    result = await this.permanentlyDeleteSprint(suiteId, assetId);
                    break;
                case 'recommendations':
                    result = await this.permanentlyDeleteRecommendation(suiteId, assetId, sprintId);
                    break;
                default:
                    result = { success: false, error: { message: `Unknown asset type: ${assetType}` } };
            }
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

    // ========================
    // COMPATIBILITY ALIASES (keeping existing method names)
    // ========================

    async moveTestCaseToTrash(suiteId, testCaseId, sprintId = null, reason = null) {
        return await this.deleteTestCase(testCaseId, suiteId, sprintId);
    }

    async moveBugToTrash(suiteId, bugId, sprintId = null, reason = null) {
        return await this.deleteBug(bugId, suiteId, sprintId);
    }

    async moveRecordingToTrash(suiteId, recordingId, sprintId = null, reason = null) {
        return await this.deleteRecording(recordingId, suiteId, sprintId);
    }

    async moveSprintToTrash(suiteId, sprintId, reason = null) {
        return await this.deleteSprint(sprintId, suiteId);
    }

    async moveRecommendationToTrash(suiteId, recommendationId, sprintId = null, reason = null) {
        return await this.deleteRecommendation(recommendationId, suiteId, sprintId);
    }

    // Batch operation aliases
    async batchArchiveAssets(suiteId, assetType, assetIds, sprintId = null, reason = null) {
        return await this.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
    }

    async batchRestoreFromArchive(suiteId, assetType, assetIds, sprintId = null) {
        return await this.bulkRestore(suiteId, assetType, assetIds, sprintId, false);
    }

    async batchRestoreFromTrash(suiteId, assetType, assetIds, sprintId = null) {
        return await this.bulkRestore(suiteId, assetType, assetIds, sprintId, true);
    }

    async batchPermanentDeleteAssets(suiteId, assetType, assetIds, sprintId = null) {
        return await this.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
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