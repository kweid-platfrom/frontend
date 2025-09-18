// Complete FirestoreService.js - Fixed Implementation with Proper Recording Integration
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
            
            // Read operations
            get: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.getRecording(recordingId, suiteId, sprintId);
            },
            
            getRecording: async (recordingId, suiteId, sprintId = null) => {
                return await this.assets.getRecording(recordingId, suiteId, sprintId);
            },
            
            getAll: async (suiteId, sprintId = null, options = {}) => {
                return await this.assets.getRecordings(suiteId, sprintId, options);
            },
            
            getRecordings: async (suiteId, sprintId = null, options = {}) => {
                return await this.assets.getRecordings(suiteId, sprintId, options);
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
            
            // Subscribe to real-time updates
            subscribe: (suiteId, callback, errorCallback = null, sprintId = null) => {
                return this.assets.subscribeToRecordings(suiteId, callback, errorCallback, sprintId);
            },
            
            subscribeToRecordings: (suiteId, callback, errorCallback = null, sprintId = null) => {
                return this.assets.subscribeToRecordings(suiteId, callback, errorCallback, sprintId);
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
    // RECORDING METHODS (properly delegated to AssetService)
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

    async getRecordings(suiteId, sprintId = null, options = {}) {
        // Set default options to exclude deleted by default
        const defaultOptions = { excludeStatus: ['deleted'], ...options };
        return await this.assets.getRecordings(suiteId, sprintId, defaultOptions);
    }

    async getAllRecordings(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        return await this.assets.getRecordings(suiteId, sprintId, { includeStatus });
    }

    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assets.subscribeToRecordings(suiteId, callback, errorCallback, sprintId);
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
    // BUG METHODS (delegated to BugService)
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

    async getBugs(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted'], ...options };
        return await this.bugs.getBugs(suiteId, sprintId, defaultOptions);
    }

    async getAllBugs(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        return await this.bugs.getBugs(suiteId, sprintId, { includeStatus });
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.bugs.subscribeToBugs(suiteId, callback, errorCallback, sprintId);
    }

    // ========================
    // TEST CASE METHODS (delegated to AssetService)
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

    async getTestCases(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted'], ...options };
        return await this.assets.getTestCases(suiteId, sprintId, defaultOptions);
    }

    async getAllTestCases(suiteId, sprintId = null, includeStatus = ['active', 'archived', 'deleted']) {
        return await this.assets.getTestCases(suiteId, sprintId, { includeStatus });
    }

    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.assets.subscribeToTestCases(suiteId, callback, errorCallback, sprintId);
    }

    // ========================
    // RECOMMENDATION METHODS (delegated to BugService)
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

    async getRecommendations(suiteId, sprintId = null, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted'], ...options };
        return await this.bugs.getRecommendations(suiteId, sprintId, defaultOptions);
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
            return { success: false, error: { message: 'Insufficient permissions to link recording' } };
        }

        try {
            // Get current recording to check existing links
            const recordingResult = await this.assets.getRecording(recordingId, suiteId, sprintId);
            if (!recordingResult.success) {
                return recordingResult;
            }

            // Get current bug to check existing links  
            const bugResult = await this.assets.getBug(bugId, suiteId, sprintId);
            if (!bugResult.success) {
                return bugResult;
            }

            const recording = recordingResult.data;
            const bug = bugResult.data;

            // Update recording with bug link (avoid duplicates)
            const existingBugLinks = recording.linkedBugs || [];
            const updatedBugLinks = existingBugLinks.includes(bugId) 
                ? existingBugLinks 
                : [...existingBugLinks, bugId];

            const recordingUpdate = await this.assets.updateRecording(recordingId, {
                linkedBugs: updatedBugLinks,
                lastLinkedAt: new Date()
            }, suiteId, sprintId);

            if (recordingUpdate.success) {
                // Update bug with recording link (avoid duplicates)
                const existingRecordingLinks = bug.linkedRecordings || [];
                const updatedRecordingLinks = existingRecordingLinks.includes(recordingId)
                    ? existingRecordingLinks
                    : [...existingRecordingLinks, recordingId];

                const bugUpdate = await this.assets.updateBug(bugId, {
                    linkedRecordings: updatedRecordingLinks,
                    lastLinkedAt: new Date()
                }, suiteId, sprintId);

                if (bugUpdate.success) {
                    return { 
                        success: true, 
                        data: { 
                            recordingId, 
                            bugId,
                            linkedAt: new Date().toISOString()
                        } 
                    };
                } else {
                    // Rollback recording update if bug update fails
                    console.warn('Bug update failed, rolling back recording update...');
                    await this.assets.updateRecording(recordingId, {
                        linkedBugs: existingBugLinks,
                        lastLinkedAt: recording.lastLinkedAt || null
                    }, suiteId, sprintId);
                    return bugUpdate;
                }
            }

            return recordingUpdate;

        } catch (error) {
            console.error('Error linking recording to bug:', error);
            return { 
                success: false, 
                error: { 
                    message: `Failed to link recording to bug: ${error.message}`,
                    details: error.stack
                } 
            };
        }
    }

    // Unlink recording from bug
    async unlinkRecordingFromBug(recordingId, bugId, suiteId, sprintId = null) {
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
    // SPRINT METHODS (delegated to AssetService)
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

    async getSprints(suiteId, options = {}) {
        const defaultOptions = { excludeStatus: ['deleted'], ...options };
        return await this.assets.getSprints(suiteId, defaultOptions);
    }

    async getAllSprints(suiteId, includeStatus = ['active', 'archived', 'deleted']) {
        return await this.assets.getSprints(suiteId, { includeStatus });
    }

    subscribeToSprints(suiteId, callback, errorCallback = null) {
        return this.assets.subscribeToSprints(suiteId, callback, errorCallback);
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
    // DELETE OPERATIONS (soft delete by default)
    // ========================

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.assets.updateTestCase(testCaseId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.assets.updateBug(bugId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.assets.updateRecording(recordingId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            delete_reason: 'User deletion'
        }, suiteId, sprintId);
    }

    async deleteSprint(sprintId, suiteId) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        return await this.assets.updateSprint(sprintId, {
            status: 'deleted',
            deleted_at: new Date(),
            deleted_by: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            delete_reason: 'User deletion'
        }, suiteId);
    }

    // ========================
    // ARCHIVE OPERATIONS
    // ========================

    async archiveTestCase(suiteId, testCaseId, sprintId = null, reason = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
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
        const options = { includeStatus: ['archived'] };
        
        switch (assetType) {
            case 'testCases':
                return await this.assets.getTestCases(suiteId, sprintId, options);
            case 'bugs':
                return await this.assets.getBugs(suiteId, sprintId, options);
            case 'recordings':
                return await this.assets.getRecordings(suiteId, sprintId, options);
            case 'sprints':
                return await this.assets.getSprints(suiteId, options);
            case 'recommendations':
                return await this.assets.getRecommendations(suiteId, sprintId, options);
            default:
                return { success: false, error: { message: `Unknown asset type: ${assetType}` } };
        }
    }

    async getTrashedItems(suiteId, assetType, sprintId = null) {
        const options = { includeStatus: ['deleted'] };
        
        switch (assetType) {
            case 'testCases':
                return await this.assets.getTestCases(suiteId, sprintId, options);
            case 'bugs':
                return await this.assets.getBugs(suiteId, sprintId, options);
            case 'recordings':
                return await this.assets.getRecordings(suiteId, sprintId, options);
            case 'sprints':
                return await this.assets.getSprints(suiteId, options);
            case 'recommendations':
                return await this.assets.getRecommendations(suiteId, sprintId, options);
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