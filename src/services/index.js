import { BaseFirestoreService } from './firestoreService';
import { UserService } from './userService';
import { OrganizationService } from './OrganizationService';
import { TestSuiteService } from './TestSuiteService';
import { AssetService } from './AssetService';

class FirestoreService extends BaseFirestoreService {
    constructor() {
        super();

        this.organization = new OrganizationService();
        this.testSuite = new TestSuiteService(this.organization);
        this.assets = new AssetService(this.testSuite);
        this.user = new UserService();

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
        const alignedSuiteData = {
            ...suiteData,
            name: suiteData.name.trim(),
            created_by: currentUserId,
            access_control: {
                ownerType: suiteData.ownerType,
                ownerId: suiteData.ownerId
            },
            admins: [currentUserId],
            members: [currentUserId]
        };
        return this.testSuite.createTestSuite(alignedSuiteData);
    }

    async validateSuiteAccess(suiteId, requiredPermission = 'read') {
        if (!suiteId) {
            return { success: false, error: { message: 'Suite ID is required' } };
        }
        try {
            const suiteDoc = await this.getDocument('testSuites', suiteId);
            if (!suiteDoc.success) {
                return { success: false, error: { message: 'Test suite not found' } };
            }
            const suiteData = suiteDoc.data;
            const currentUserId = this.getCurrentUserId();
            if (suiteData.ownerType === 'individual' && suiteData.ownerId === currentUserId) {
                return { success: true };
            }
            if (suiteData.ownerType === 'organization') {
                const requiredRole = requiredPermission === 'write' ? 'manager' : 'member';
                const hasAccess = await this.organization.validateOrganizationAccess(
                    suiteData.ownerId,
                    requiredRole
                );
                if (hasAccess) {
                    return { success: true };
                }
            }
            if (suiteData.members && suiteData.members.includes(currentUserId)) {
                return { success: true };
            }
            if (suiteData.admins && suiteData.admins.includes(currentUserId)) {
                return { success: true };
            }
            return {
                success: false,
                error: { message: 'Access denied. You do not have permission to access this test suite.' }
            };
        } catch (error) {
            return { success: false, error: { message: `Failed to validate suite access: ${error.message}` } };
        }
    }

    async createBug(suiteId, bugData, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createBug(suiteId, bugData, sprintId);
    }

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createTestCase(suiteId, testCaseData, sprintId);
    }

    async createRecording(suiteId, recordingData, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createRecording(suiteId, recordingData, sprintId);
    }

    async createSprint(suiteId, sprintData) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
        if (!accessCheck.success) return accessCheck;
        return this.assets.createSprint(suiteId, sprintData);
    }

    async updateBug(bugId, updates, suiteId = null, sprintId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateBug(bugId, updates, suiteId, sprintId);
    }

    async updateTestCase(testCaseId, updates, suiteId = null, sprintId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateTestCase(testCaseId, updates, suiteId, sprintId);
    }

    async updateRecording(recordingId, updates, suiteId = null, sprintId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
    }

    async updateSprint(sprintId, updates, suiteId = null) {
        if (suiteId) {
            const accessCheck = await this.validateSuiteAccess(suiteId, 'write');
            if (!accessCheck.success) return accessCheck;
        }
        return this.assets.updateSprint(sprintId, updates, suiteId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return this.assets.deleteBug(bugId, suiteId, sprintId);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return this.assets.deleteTestCase(testCaseId, suiteId, sprintId);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return this.assets.deleteRecording(recordingId, suiteId, sprintId);
    }

    async deleteSprint(sprintId, suiteId) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'admin');
        if (!accessCheck.success) return accessCheck;
        return this.assets.deleteSprint(sprintId, suiteId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getBug(bugId, suiteId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getTestCase(testCaseId, suiteId, sprintId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getRecording(recordingId, suiteId, sprintId);
    }

    async getSprint(sprintId, suiteId) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getSprint(sprintId, suiteId);
    }

    async getTestCases(suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getTestCases(suiteId, sprintId);
    }

    async getBugs(suiteId, sprintId = null) {
        const accessCheck = await this.validateSuiteAccess(suiteId, 'read');
        if (!accessCheck.success) return accessCheck;
        return this.assets.getBugs(suiteId, sprintId);
    }

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
        super.cleanup();
        this.user?.cleanup?.();
        this.organization?.cleanup?.();
        this.testSuite?.cleanup?.();
        this.assets?.cleanup?.();
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;
export { FirestoreService };