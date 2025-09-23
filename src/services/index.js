// Fixed FirestoreService.js - Ensures deleted/archived items are properly filtered from main views
import { BaseFirestoreService } from './firestoreService';
import { UserService } from './userService';
import { OrganizationService } from './OrganizationService';
import { TestSuiteService } from './TestSuiteService';
import { AssetService } from './AssetService';
import { BugService } from './bugService';
import { ArchiveTrashService } from './ArchiveTrashService';

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

        // Enhanced recordings interface - properly delegates to AssetService
        this.recordings = {
            // Core creation methods
            create: async (suiteId, recordingData, sprintId = null) => {
                return await this.assets.createRecording(suiteId, recordingData, sprintId);
            },
            
            createRecording: async (suiteId, recordingData, sprintId = null) => {
                return await this.assets.createRecording(suiteId, recordingData, sprintId);
            },
            
            // Upload and create in one operation
            uploadAndCreate: async (suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) => {
                return await this.assets.uploadAndCreateRecording(suiteId, recordingBlob, metadata, sprintId, onProgress);
            },
            
            uploadAndCreateRecording: async (suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) => {
                return await this.assets.uploadAndCreateRecording(suiteId, recordingBlob, metadata, sprintId, onProgress);
            },
            
            // Read operations - FIXED: Always exclude deleted/archived by default
            get: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.getRecording(recordingId, suiteId, sprintId);
            },
            
            getRecording: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.getRecording(recordingId, suiteId, sprintId);
            },
            
            getAll: async (suiteId, sprintId = null, options = {}) => {
                // FIXED: Default to exclude deleted and archived
                const defaultOptions = { 
                    excludeStatus: ['deleted', 'archived'], 
                    ...options 
                };
                return await this.assets.getRecordings(suiteId, sprintId, defaultOptions);
            },
            
            getRecordings: async (suiteId, sprintId = null, options = {}) => {
                // FIXED: Default to exclude deleted and archived
                const defaultOptions = { 
                    excludeStatus: ['deleted', 'archived'], 
                    ...options 
                };
                return await this.assets.getRecordings(suiteId, sprintId, defaultOptions);
            },
            
            // Update operations
            update: async (recordingId, updates, suiteId, sprintId = null) => {
                return await this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
            },
            
            updateRecording: async (recordingId, updates, suiteId, sprintId = null) => {
                return await this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
            },
            
            // Delete operations
            delete: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.deleteRecording(recordingId, suiteId, sprintId);
            },
            
            deleteRecording: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.deleteRecording(recordingId, suiteId, sprintId);
            },
            
            // Subscribe to real-time updates - FIXED: Filter out deleted/archived
            subscribe: (suiteId, callback, errorCallback = null, sprintId = null) => {
                return this.assets.subscribeToRecordings(suiteId, (recordings) => {
                    // Filter out deleted and archived items from real-time updates
                    const activeRecordings = recordings.filter(recording => 
                        recording.status !== 'deleted' && recording.status !== 'archived'
                    );
                    callback(activeRecordings);
                }, errorCallback, sprintId);
            },
            
            subscribeToRecordings: (suiteId, callback, errorCallback = null, sprintId = null) => {
                return this.assets.subscribeToRecordings(suiteId, (recordings) => {
                    // Filter out deleted and archived items from real-time updates
                    const activeRecordings = recordings.filter(recording => 
                        recording.status !== 'deleted' && recording.status !== 'archived'
                    );
                    callback(activeRecordings);
                }, errorCallback, sprintId);
            },
            
            // Service status and utility methods
            getServiceStatus: async () => {
                return await this.assets.getRecordingServiceStatus();
            },
            
            testYouTubeConnection: async () => {
                return await this.assets.testYouTubeConnection();
            },
            
            isYouTubeAvailable: async () => {
                return await this.assets.isYouTubeAvailable();
            },
            
            getStatistics: async (suiteId, sprintId = null) => {
                return await this.assets.getRecordingStatistics(suiteId, sprintId);
            },
            
            // URL utility methods
            getPlaybackUrl: (recordingData) => {
                return this.assets.recordingService.getPlaybackUrl(recordingData);
            },
            
            getVideoUrl: (recordingData) => {
                return this.assets.recordingService.getVideoUrl(recordingData);
            },
            
            getRecordingInfo: (recordingData) => {
                return this.assets.recordingService.getRecordingInfo(recordingData);
            },
            
            validateRecordingData: (recordingData) => {
                return this.assets.recordingService.validateRecordingData(recordingData);
            }
        };

        // Reports interface (unchanged from original)
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
    // RECORDING METHODS - FIXED: Proper filtering
    // ========================

    async createRecording(suiteId, recordingData, sprintId = null) {
        return await this.assets.createRecording(suiteId, recordingData, sprintId);
    }

    async uploadAndCreateRecording(suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) {
        return await this.assets.uploadAndCreateRecording(suiteId, recordingBlob, metadata, sprintId, onProgress);
    }

    async updateRecording(recordingId, updates, suiteId, sprintId = null) {
        return await this.assets.updateRecording(recordingId, updates, suiteId, sprintId);
    }

    async getRecording(recordingId, suiteId, sprintId = null) {
        return await this.assets.getRecording(recordingId, suiteId, sprintId);
    }

    // FIXED: Default behavior excludes deleted and archived
    async getRecordings(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted', 'archived'], ...options };
        return await this.assets.getRecordings(suiteId, sprintId, defaultOptions);
    }

    async getAllRecordings(suiteId, sprintId = null, includeStatus = ['active']) {
        return await this.assets.getRecordings(suiteId, sprintId, { includeStatus });
    }

    // FIXED: Filter real-time updates
    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assets.subscribeToRecordings(suiteId, (recordings) => {
            // Filter out deleted and archived items from real-time updates
            const activeRecordings = recordings.filter(recording => 
                recording.status !== 'deleted' && recording.status !== 'archived'
            );
            callback(activeRecordings);
        }, errorCallback, sprintId);
    }

    async getRecordingServiceStatus() {
        return await this.assets.getRecordingServiceStatus();
    }

    async testYouTubeConnection() {
        return await this.assets.testYouTubeConnection();
    }

    async isYouTubeAvailable() {
        return await this.assets.isYouTubeAvailable();
    }

    async getRecordingStatistics(suiteId, sprintId = null) {
        return await this.assets.getRecordingStatistics(suiteId, sprintId);
    }

    // ========================
    // BUG METHODS - FIXED: Proper filtering
    // ========================

    async createBug(suiteId, bugData, sprintId = null) {
        return await this.bugs.createBug(suiteId, bugData, sprintId);
    }

    async updateBug(bugId, updates, suiteId, sprintId = null) {
        return await this.bugs.updateBug(bugId, updates, suiteId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.bugs.getBug(bugId, suiteId, sprintId);
    }

    // FIXED: Default behavior excludes deleted and archived
    async getBugs(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted', 'archived'], ...options };
        return await this.bugs.getBugs(suiteId, sprintId, defaultOptions);
    }

    async getAllBugs(suiteId, sprintId = null, includeStatus = ['active']) {
        return await this.bugs.getBugs(suiteId, sprintId, { includeStatus });
    }

    // FIXED: Filter real-time updates
    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.bugs.subscribeToBugs(suiteId, (bugs) => {
            // Filter out deleted and archived items from real-time updates
            const activeBugs = bugs.filter(bug => 
                bug.status !== 'deleted' && bug.status !== 'archived'
            );
            callback(activeBugs);
        }, errorCallback, sprintId);
    }

    // ========================
    // TEST CASE METHODS - FIXED: Proper filtering
    // ========================

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.assets.createTestCase(suiteId, testCaseData, sprintId);
    }

    async updateTestCase(testCaseId, updates, suiteId, sprintId = null) {
        return await this.assets.updateTestCase(testCaseId, updates, suiteId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.assets.getTestCase(testCaseId, suiteId, sprintId);
    }

    // FIXED: Default behavior excludes deleted and archived
    async getTestCases(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted', 'archived'], ...options };
        return await this.assets.getTestCases(suiteId, sprintId, defaultOptions);
    }

    async getAllTestCases(suiteId, sprintId = null, includeStatus = ['active']) {
        return await this.assets.getTestCases(suiteId, sprintId, { includeStatus });
    }

    // FIXED: Filter real-time updates
    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assets.subscribeToTestCases(suiteId, (testCases) => {
            // Filter out deleted and archived items from real-time updates
            const activeTestCases = testCases.filter(testCase => 
                testCase.status !== 'deleted' && testCase.status !== 'archived'
            );
            callback(activeTestCases);
        }, errorCallback, sprintId);
    }

    // ========================
    // RECOMMENDATION METHODS - FIXED: Proper filtering
    // ========================

    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        return await this.bugs.createRecommendation(suiteId, recommendationData, sprintId);
    }

    async updateRecommendation(recommendationId, updates, suiteId, sprintId = null) {
        return await this.bugs.updateRecommendation(recommendationId, updates, suiteId, sprintId);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.bugs.deleteRecommendation(recommendationId, suiteId, sprintId);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.bugs.getRecommendation(recommendationId, suiteId, sprintId);
    }

    // FIXED: Default behavior excludes deleted and archived
    async getRecommendations(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted', 'archived'], ...options };
        return await this.bugs.getRecommendations(suiteId, sprintId, defaultOptions);
    }

    // FIXED: Filter real-time updates
    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.bugs.subscribeToRecommendations(suiteId, (recommendations) => {
            // Filter out deleted and archived items from real-time updates
            const activeRecommendations = recommendations.filter(rec => 
                rec.status !== 'deleted' && rec.status !== 'archived'
            );
            callback(activeRecommendations);
        }, errorCallback, sprintId);
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

    // Enhanced recording-to-bug linking with proper error handling
    async linkRecordingToBug(recordingId, bugId, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!recordingId || !bugId || !suiteId) {
            return { 
                success: false, 
                error: { message: 'Recording ID, Bug ID, and Suite ID are all required' } 
            };
        }

        const hasAccess = await this.testSuite.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to unlink recording' } };
        }

        try {
            // Get current recording
            const recordingResult = await this.assets.getRecording(recordingId, suiteId, sprintId);
            if (!recordingResult.success) {
                return recordingResult;
            }

            // Get current bug
            const bugResult = await this.assets.getBug(bugId, suiteId, sprintId);
            if (!bugResult.success) {
                return bugResult;
            }

            const recording = recordingResult.data;
            const bug = bugResult.data;

            // Remove bug from recording's linked bugs
            const existingBugLinks = recording.linkedBugs || [];
            const updatedBugLinks = existingBugLinks.filter(id => id !== bugId);

            const recordingUpdate = await this.assets.updateRecording(recordingId, {
                linkedBugs: updatedBugLinks,
                lastUnlinkedAt: new Date()
            }, suiteId, sprintId);

            if (recordingUpdate.success) {
                // Remove recording from bug's linked recordings
                const existingRecordingLinks = bug.linkedRecordings || [];
                const updatedRecordingLinks = existingRecordingLinks.filter(id => id !== recordingId);

                const bugUpdate = await this.assets.updateBug(bugId, {
                    linkedRecordings: updatedRecordingLinks,
                    lastUnlinkedAt: new Date()
                }, suiteId, sprintId);

                if (bugUpdate.success) {
                    return { 
                        success: true, 
                        data: { 
                            recordingId, 
                            bugId,
                            unlinkedAt: new Date().toISOString()
                        } 
                    };
                } else {
                    // Rollback recording update if bug update fails
                    console.warn('Bug update failed, rolling back recording update...');
                    await this.assets.updateRecording(recordingId, {
                        linkedBugs: existingBugLinks,
                        lastUnlinkedAt: recording.lastUnlinkedAt || null
                    }, suiteId, sprintId);
                    return bugUpdate;
                }
            }

            return recordingUpdate;

        } catch (error) {
            console.error('Error unlinking recording from bug:', error);
            return { 
                success: false, 
                error: { 
                    message: `Failed to unlink recording from bug: ${error.message}`,
                    details: error.stack
                } 
            };
        }
    }

    // ========================
    // SPRINT METHODS - FIXED: Proper filtering
    // ========================

    async createSprint(suiteId, sprintData) {
        return await this.assets.createSprint(suiteId, sprintData);
    }

    async updateSprint(sprintId, updates, suiteId) {
        return await this.assets.updateSprint(sprintId, updates, suiteId);
    }

    async getSprint(sprintId, suiteId) {
        return await this.assets.getSprint(sprintId, suiteId);
    }

    // FIXED: Default behavior excludes deleted and archived
    async getSprints(suiteId, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted', 'archived'], ...options };
        return await this.assets.getSprints(suiteId, defaultOptions);
    }

    async getAllSprints(suiteId, includeStatus = ['active']) {
        return await this.assets.getSprints(suiteId, { includeStatus });
    }

    // FIXED: Filter real-time updates
    subscribeToSprints(suiteId, callback, errorCallback = null) {
        return this.assets.subscribeToSprints(suiteId, (sprints) => {
            // Filter out deleted and archived items from real-time updates
            const activeSprints = sprints.filter(sprint => 
                sprint.status !== 'deleted' && sprint.status !== 'archived'
            );
            callback(activeSprints);
        }, errorCallback);
    }

    // ========================
    // LEGACY BATCH METHODS (keep for compatibility)
    // ========================

    async batchLinkTestCasesToBug(bugId, testCaseIds) {
        return await this.assets.batchLinkTestCasesToBug(bugId, testCaseIds);
    }

    async batchUnlinkTestCaseFromBug(bugId, testCaseId) {
        return await this.assets.batchUnlinkTestCaseFromBug(bugId, testCaseId);
    }

    async batchLinkBugsToTestCase(testCaseId, bugIds) {
        return await this.assets.batchLinkBugsToTestCase(testCaseId, bugIds);
    }

    async batchUnlinkBugFromTestCase(testCaseId, bugId) {
        return await this.assets.batchUnlinkBugFromTestCase(testCaseId, bugId);
    }

    async addTestCasesToSprint(sprintId, testCaseIds) {
        return await this.assets.addTestCasesToSprint(sprintId, testCaseIds);
    }

    async addBugsToSprint(sprintId, bugIds) {
        return await this.assets.addBugsToSprint(sprintId, bugIds);
    }

    // ========================
    // ENHANCED DELETE OPERATIONS - Use ArchiveTrashService
    // ========================

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.archiveTrash.deleteTestCase(suiteId, testCaseId, sprintId, 'User deletion');
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.archiveTrash.deleteBug(suiteId, bugId, sprintId, 'User deletion');
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        return await this.archiveTrash.deleteRecording(suiteId, recordingId, sprintId, 'User deletion');
    }

    async deleteSprint(sprintId, suiteId) {
        return await this.archiveTrash.deleteSprint(suiteId, sprintId, 'User deletion');
    }

    // ========================
    // ENHANCED ARCHIVE OPERATIONS - Use ArchiveTrashService
    // ========================

    async archiveTestCase(suiteId, testCaseId, sprintId = null, reason = 'User archive') {
        return await this.archiveTrash.archiveTestCase(suiteId, testCaseId, sprintId, reason);
    }

    async archiveBug(suiteId, bugId, sprintId = null, reason = 'User archive') {
        return await this.archiveTrash.archiveBug(suiteId, bugId, sprintId, reason);
    }

    async archiveRecording(suiteId, recordingId, sprintId = null, reason = 'User archive') {
        return await this.archiveTrash.archiveRecording(suiteId, recordingId, sprintId, reason);
    }

    async archiveSprint(suiteId, sprintId, reason = 'User archive') {
        return await this.archiveTrash.archiveSprint(suiteId, sprintId, reason);
    }

    async archiveRecommendation(suiteId, recommendationId, sprintId = null, reason = 'User archive') {
        return await this.archiveTrash.archiveRecommendation(suiteId, recommendationId, sprintId, reason);
    }

    // ========================
    // ENHANCED UNARCHIVE OPERATIONS - Use ArchiveTrashService
    // ========================

    async unarchiveTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.unarchiveTestCase(suiteId, testCaseId, sprintId);
    }

    async unarchiveBug(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.unarchiveBug(suiteId, bugId, sprintId);
    }

    async unarchiveRecording(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.unarchiveRecording(suiteId, recordingId, sprintId);
    }

    async unarchiveSprint(suiteId, sprintId) {
        return await this.archiveTrash.unarchiveSprint(suiteId, sprintId);
    }

    async unarchiveRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.unarchiveRecommendation(suiteId, recommendationId, sprintId);
    }

    // ========================
    // ENHANCED RESTORE FROM TRASH OPERATIONS - Use ArchiveTrashService
    // ========================

    async restoreTestCaseFromTrash(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.restoreTestCase(suiteId, testCaseId, sprintId);
    }

    async restoreBugFromTrash(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.restoreBug(suiteId, bugId, sprintId);
    }

    async restoreRecordingFromTrash(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.restoreRecording(suiteId, recordingId, sprintId);
    }

    async restoreSprintFromTrash(suiteId, sprintId) {
        return await this.archiveTrash.restoreSprint(suiteId, sprintId);
    }

    async restoreRecommendationFromTrash(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.restoreRecommendation(suiteId, recommendationId, sprintId);
    }

    // ========================
    // ENHANCED PERMANENT DELETE OPERATIONS - Use ArchiveTrashService
    // ========================

    async permanentlyDeleteTestCase(suiteId, testCaseId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteTestCase(suiteId, testCaseId, sprintId);
    }

    async permanentlyDeleteBug(suiteId, bugId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteBug(suiteId, bugId, sprintId);
    }

    async permanentlyDeleteRecording(suiteId, recordingId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteRecording(suiteId, recordingId, sprintId);
    }

    async permanentlyDeleteSprint(suiteId, sprintId) {
        return await this.archiveTrash.permanentlyDeleteSprint(suiteId, sprintId);
    }

    async permanentlyDeleteRecommendation(suiteId, recommendationId, sprintId = null) {
        return await this.archiveTrash.permanentlyDeleteRecommendation(suiteId, recommendationId, sprintId);
    }

    // ========================
    // ENHANCED QUERY METHODS FOR ARCHIVED/DELETED ITEMS - Use ArchiveTrashService
    // ========================

    async getArchivedItems(suiteId, assetType, sprintId = null) {
        return await this.archiveTrash.getArchivedAssets(suiteId, assetType, sprintId);
    }

    async getTrashedItems(suiteId, assetType, sprintId = null) {
        return await this.archiveTrash.getTrashedAssets(suiteId, assetType, sprintId);
    }

    // ========================
    // ENHANCED BULK OPERATIONS - Use ArchiveTrashService
    // ========================

    async bulkDelete(suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk deletion') {
        return await this.archiveTrash.bulkDelete(suiteId, assetType, assetIds, sprintId, reason);
    }

    async bulkArchive(suiteId, assetType, assetIds, sprintId = null, reason = 'Bulk archive') {
        return await this.archiveTrash.bulkArchive(suiteId, assetType, assetIds, sprintId, reason);
    }

    async bulkRestore(suiteId, assetType, assetIds, sprintId = null, fromTrash = false) {
        return await this.archiveTrash.bulkRestore(suiteId, assetType, assetIds, sprintId, fromTrash);
    }

    async bulkPermanentDelete(suiteId, assetType, assetIds, sprintId = null) {
        return await this.archiveTrash.bulkPermanentDelete(suiteId, assetType, assetIds, sprintId);
    }

    // ========================
    // COMPATIBILITY ALIASES (keeping existing method names)
    // ========================

    async moveTestCaseToTrash(suiteId, testCaseId, sprintId = null) {
        return await this.deleteTestCase(testCaseId, suiteId, sprintId);
    }

    async moveBugToTrash(suiteId, bugId, sprintId = null) {
        return await this.deleteBug(bugId, suiteId, sprintId);
    }

    async moveRecordingToTrash(suiteId, recordingId, sprintId = null) {
        return await this.deleteRecording(recordingId, suiteId, sprintId);
    }

    async moveSprintToTrash(suiteId, sprintId) {
        return await this.deleteSprint(sprintId, suiteId);
    }

    async moveRecommendationToTrash(suiteId, recommendationId, sprintId = null) {
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