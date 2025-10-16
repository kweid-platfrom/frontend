// ActivityService.js - Comprehensive Activity Tracking System
import { BaseFirestoreService } from './firestoreService';

export class ActivityService extends BaseFirestoreService {
    constructor() {
        super();
        this.activityTypes = {
            // Test Cases
            TEST_CASE_CREATED: 'test_case_created',
            TEST_CASE_UPDATED: 'test_case_updated',
            TEST_CASE_DELETED: 'test_case_deleted',
            TEST_CASE_ARCHIVED: 'test_case_archived',
            TEST_CASE_RESTORED: 'test_case_restored',
            TEST_CASE_EXECUTED: 'test_case_executed',
            TEST_CASE_PASSED: 'test_case_passed',
            TEST_CASE_FAILED: 'test_case_failed',
            
            // Bugs
            BUG_CREATED: 'bug_created',
            BUG_UPDATED: 'bug_updated',
            BUG_DELETED: 'bug_deleted',
            BUG_ARCHIVED: 'bug_archived',
            BUG_RESTORED: 'bug_restored',
            BUG_RESOLVED: 'bug_resolved',
            BUG_REOPENED: 'bug_reopened',
            BUG_PRIORITY_CHANGED: 'bug_priority_changed',
            BUG_SEVERITY_CHANGED: 'bug_severity_changed',
            
            // Recordings
            RECORDING_CREATED: 'recording_created',
            RECORDING_UPLOADED: 'recording_uploaded',
            RECORDING_DELETED: 'recording_deleted',
            RECORDING_ARCHIVED: 'recording_archived',
            RECORDING_LINKED_TO_BUG: 'recording_linked_to_bug',
            RECORDING_LINKED_TO_TEST: 'recording_linked_to_test',
            
            // Documents
            DOCUMENT_CREATED: 'document_created',
            DOCUMENT_UPDATED: 'document_updated',
            DOCUMENT_DELETED: 'document_deleted',
            DOCUMENT_ARCHIVED: 'document_archived',
            DOCUMENT_SHARED: 'document_shared',
            DOCUMENT_EXPORTED: 'document_exported',
            
            // Test Data
            TEST_DATA_CREATED: 'test_data_created',
            TEST_DATA_UPDATED: 'test_data_updated',
            TEST_DATA_DELETED: 'test_data_deleted',
            TEST_DATA_IMPORTED: 'test_data_imported',
            TEST_DATA_EXPORTED: 'test_data_exported',
            
            // Sprints
            SPRINT_CREATED: 'sprint_created',
            SPRINT_UPDATED: 'sprint_updated',
            SPRINT_STARTED: 'sprint_started',
            SPRINT_COMPLETED: 'sprint_completed',
            SPRINT_DELETED: 'sprint_deleted',
            
            // Recommendations
            RECOMMENDATION_CREATED: 'recommendation_created',
            RECOMMENDATION_UPDATED: 'recommendation_updated',
            RECOMMENDATION_DELETED: 'recommendation_deleted',
            RECOMMENDATION_VOTED: 'recommendation_voted',
            RECOMMENDATION_COMMENTED: 'recommendation_commented',
            
            // AI Activities
            AI_GENERATION_STARTED: 'ai_generation_started',
            AI_GENERATION_COMPLETED: 'ai_generation_completed',
            AI_GENERATION_FAILED: 'ai_generation_failed',
            AI_TEST_CASE_GENERATED: 'ai_test_case_generated',
            
            // Automation
            AUTOMATION_CREATED: 'automation_created',
            AUTOMATION_EXECUTED: 'automation_executed',
            AUTOMATION_FAILED: 'automation_failed',
            
            // Suite Management
            SUITE_CREATED: 'suite_created',
            SUITE_UPDATED: 'suite_updated',
            SUITE_DELETED: 'suite_deleted',
            SUITE_SHARED: 'suite_shared',
            
            // Linking Activities
            ASSETS_LINKED: 'assets_linked',
            ASSETS_UNLINKED: 'assets_unlinked',
            BULK_OPERATION: 'bulk_operation',
            
            // User Activities
            USER_LOGIN: 'user_login',
            USER_LOGOUT: 'user_logout',
            USER_PROFILE_UPDATED: 'user_profile_updated',
            
            // Team Activities
            MEMBER_INVITED: 'member_invited',
            MEMBER_REMOVED: 'member_removed',
            MEMBER_ROLE_CHANGED: 'member_role_changed',
        };
    }

    /**
     * Log an activity to Firestore
     * @param {string} suiteId - Test suite ID
     * @param {object} activityData - Activity details
     * @returns {Promise<object>} Result with success status
     */
    async logActivity(suiteId, activityData) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.warn('Cannot log activity: User not authenticated');
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId) {
            console.warn('Cannot log activity: Suite ID required');
            return { success: false, error: { message: 'Suite ID required' } };
        }

        try {
            const activity = this.addCommonFields({
                action: activityData.action || activityData.type,
                type: activityData.action || activityData.type,
                description: activityData.description || '',
                details: activityData.details || '',
                user: activityData.user || userId,
                userName: activityData.userName || null,
                userEmail: activityData.userEmail || null,
                suiteId: suiteId,
                suiteName: activityData.suiteName || null,
                timestamp: new Date(),
                metadata: {
                    ...(activityData.metadata || {}),
                    assetType: activityData.assetType || null,
                    assetId: activityData.assetId || null,
                    assetName: activityData.assetName || null,
                    sprintId: activityData.sprintId || null,
                    module: activityData.module || activityData.feature || null,
                    feature: activityData.feature || activityData.module || null,
                    severity: activityData.severity || null,
                    priority: activityData.priority || null,
                    aiGenerated: activityData.aiGenerated || false,
                    isAIGenerated: activityData.aiGenerated || false,
                    hasRecording: activityData.hasRecording || false,
                    linkedRecordings: activityData.linkedRecordings || [],
                    linkedBugs: activityData.linkedBugs || [],
                    linkedTestCases: activityData.linkedTestCases || [],
                    changes: activityData.changes || null,
                    previousValue: activityData.previousValue || null,
                    newValue: activityData.newValue || null,
                    executionResult: activityData.executionResult || null,
                    executionTime: activityData.executionTime || null,
                }
            });

            const collectionPath = `testSuites/${suiteId}/activityLogs`;
            const result = await this.createDocument(collectionPath, activity);

            if (result.success) {
                console.log(`Activity logged: ${activity.action} in suite ${suiteId}`);
            }

            return result;
        } catch (error) {
            console.error('Error logging activity:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    /**
     * Log test case activity
     */
    async logTestCaseActivity(suiteId, action, testCase, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateTestCaseDescription(action, testCase),
            assetType: 'testCase',
            assetId: testCase.id,
            assetName: testCase.title || testCase.name,
            suiteName: additionalData.suiteName,
            sprintId: testCase.sprint_id || testCase.sprintId,
            metadata: {
                testCaseId: testCase.id,
                testCaseTitle: testCase.title || testCase.name,
                priority: testCase.priority,
                status: testCase.status,
                automated: testCase.isAutomated || testCase.automated,
                aiGenerated: testCase.isAIGenerated || testCase.aiGenerated,
                module: testCase.module || testCase.feature,
                ...additionalData
            }
        });
    }

    /**
     * Log bug activity
     */
    async logBugActivity(suiteId, action, bug, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateBugDescription(action, bug),
            assetType: 'bug',
            assetId: bug.id,
            assetName: bug.title || bug.summary,
            suiteName: additionalData.suiteName,
            sprintId: bug.sprint_id || bug.sprintId,
            severity: bug.severity,
            priority: bug.priority,
            hasRecording: bug.linkedRecordings && bug.linkedRecordings.length > 0,
            linkedRecordings: bug.linkedRecordings || [],
            metadata: {
                bugId: bug.id,
                bugTitle: bug.title || bug.summary,
                severity: bug.severity,
                priority: bug.priority,
                status: bug.status,
                module: bug.module || bug.feature,
                ...additionalData
            }
        });
    }

    /**
     * Log recording activity
     */
    async logRecordingActivity(suiteId, action, recording, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateRecordingDescription(action, recording),
            assetType: 'recording',
            assetId: recording.id,
            assetName: recording.title || 'Recording',
            suiteName: additionalData.suiteName,
            sprintId: recording.sprint_id || recording.sprintId,
            hasRecording: true,
            linkedBugs: recording.linkedBugs || [],
            linkedTestCases: recording.linkedTestCases || [],
            metadata: {
                recordingId: recording.id,
                recordingTitle: recording.title,
                duration: recording.duration,
                provider: recording.provider,
                issuesDetected: recording.detectedIssues?.length || 0,
                ...additionalData
            }
        });
    }

    /**
     * Log document activity
     */
    async logDocumentActivity(suiteId, action, document, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateDocumentDescription(action, document),
            assetType: 'document',
            assetId: document.id,
            assetName: document.title,
            suiteName: additionalData.suiteName,
            sprintId: document.sprint_id || document.sprintId,
            metadata: {
                documentId: document.id,
                documentTitle: document.title,
                documentType: document.type,
                googleDocId: document.docId,
                ...additionalData
            }
        });
    }

    /**
     * Log test data activity
     */
    async logTestDataActivity(suiteId, action, testData, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateTestDataDescription(action, testData),
            assetType: 'testData',
            assetId: testData.id,
            assetName: testData.name,
            suiteName: additionalData.suiteName,
            sprintId: testData.sprint_id || testData.sprintId,
            metadata: {
                testDataId: testData.id,
                testDataName: testData.name,
                testDataType: testData.type,
                environment: testData.environment,
                ...additionalData
            }
        });
    }

    /**
     * Log sprint activity
     */
    async logSprintActivity(suiteId, action, sprint, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateSprintDescription(action, sprint),
            assetType: 'sprint',
            assetId: sprint.id,
            assetName: sprint.name || sprint.title,
            suiteName: additionalData.suiteName,
            metadata: {
                sprintId: sprint.id,
                sprintName: sprint.name || sprint.title,
                status: sprint.status,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                ...additionalData
            }
        });
    }

    /**
     * Log recommendation activity
     */
    async logRecommendationActivity(suiteId, action, recommendation, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateRecommendationDescription(action, recommendation),
            assetType: 'recommendation',
            assetId: recommendation.id,
            assetName: recommendation.title || recommendation.suggestion,
            suiteName: additionalData.suiteName,
            aiGenerated: true,
            metadata: {
                recommendationId: recommendation.id,
                recommendationType: recommendation.type,
                category: recommendation.category,
                ...additionalData
            }
        });
    }

    /**
     * Log AI generation activity
     */
    async logAIActivity(suiteId, action, data, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateAIDescription(action, data),
            assetType: 'ai_generation',
            suiteName: additionalData.suiteName,
            aiGenerated: true,
            metadata: {
                generationId: data.id,
                prompt: data.prompt,
                generatedCount: data.generatedCount || 0,
                success: data.success,
                model: data.model || 'gemini',
                ...additionalData
            }
        });
    }

    /**
     * Log linking activity
     */
    async logLinkingActivity(suiteId, action, linkData, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action,
            type: action,
            description: this.generateLinkingDescription(action, linkData),
            assetType: 'linking',
            suiteName: additionalData.suiteName,
            metadata: {
                sourceType: linkData.sourceType,
                sourceId: linkData.sourceId,
                targetType: linkData.targetType,
                targetId: linkData.targetId,
                linkType: linkData.linkType,
                ...additionalData
            }
        });
    }

    /**
     * Log bulk operation
     */
    async logBulkOperation(suiteId, action, operation, additionalData = {}) {
        return await this.logActivity(suiteId, {
            action: this.activityTypes.BULK_OPERATION,
            type: this.activityTypes.BULK_OPERATION,
            description: this.generateBulkOperationDescription(action, operation),
            suiteName: additionalData.suiteName,
            metadata: {
                operationType: action,
                assetType: operation.assetType,
                assetIds: operation.assetIds,
                count: operation.count || operation.assetIds?.length || 0,
                successCount: operation.successCount || 0,
                failCount: operation.failCount || 0,
                ...additionalData
            }
        });
    }

    // Description generators
    generateTestCaseDescription(action, testCase) {
        const name = testCase.title || testCase.name || 'Untitled Test Case';
        switch (action) {
            case this.activityTypes.TEST_CASE_CREATED:
                return `Created test case: ${name}`;
            case this.activityTypes.TEST_CASE_UPDATED:
                return `Updated test case: ${name}`;
            case this.activityTypes.TEST_CASE_DELETED:
                return `Deleted test case: ${name}`;
            case this.activityTypes.TEST_CASE_ARCHIVED:
                return `Archived test case: ${name}`;
            case this.activityTypes.TEST_CASE_RESTORED:
                return `Restored test case: ${name}`;
            case this.activityTypes.TEST_CASE_EXECUTED:
                return `Executed test case: ${name}`;
            case this.activityTypes.TEST_CASE_PASSED:
                return `Test case passed: ${name}`;
            case this.activityTypes.TEST_CASE_FAILED:
                return `Test case failed: ${name}`;
            default:
                return `Test case activity: ${name}`;
        }
    }

    generateBugDescription(action, bug) {
        const title = bug.title || bug.summary || 'Untitled Bug';
        switch (action) {
            case this.activityTypes.BUG_CREATED:
                return `Reported new bug: ${title}`;
            case this.activityTypes.BUG_UPDATED:
                return `Updated bug: ${title}`;
            case this.activityTypes.BUG_DELETED:
                return `Deleted bug: ${title}`;
            case this.activityTypes.BUG_ARCHIVED:
                return `Archived bug: ${title}`;
            case this.activityTypes.BUG_RESTORED:
                return `Restored bug: ${title}`;
            case this.activityTypes.BUG_RESOLVED:
                return `Resolved bug: ${title}`;
            case this.activityTypes.BUG_REOPENED:
                return `Reopened bug: ${title}`;
            case this.activityTypes.BUG_PRIORITY_CHANGED:
                return `Changed priority of bug: ${title}`;
            case this.activityTypes.BUG_SEVERITY_CHANGED:
                return `Changed severity of bug: ${title}`;
            default:
                return `Bug activity: ${title}`;
        }
    }

    generateRecordingDescription(action, recording) {
        const title = recording.title || 'Recording';
        switch (action) {
            case this.activityTypes.RECORDING_CREATED:
                return `Created recording: ${title}`;
            case this.activityTypes.RECORDING_UPLOADED:
                return `Uploaded recording: ${title}`;
            case this.activityTypes.RECORDING_DELETED:
                return `Deleted recording: ${title}`;
            case this.activityTypes.RECORDING_ARCHIVED:
                return `Archived recording: ${title}`;
            case this.activityTypes.RECORDING_LINKED_TO_BUG:
                return `Linked recording to bug: ${title}`;
            case this.activityTypes.RECORDING_LINKED_TO_TEST:
                return `Linked recording to test case: ${title}`;
            default:
                return `Recording activity: ${title}`;
        }
    }

    generateDocumentDescription(action, document) {
        const title = document.title || 'Document';
        switch (action) {
            case this.activityTypes.DOCUMENT_CREATED:
                return `Created document: ${title}`;
            case this.activityTypes.DOCUMENT_UPDATED:
                return `Updated document: ${title}`;
            case this.activityTypes.DOCUMENT_DELETED:
                return `Deleted document: ${title}`;
            case this.activityTypes.DOCUMENT_ARCHIVED:
                return `Archived document: ${title}`;
            case this.activityTypes.DOCUMENT_SHARED:
                return `Shared document: ${title}`;
            case this.activityTypes.DOCUMENT_EXPORTED:
                return `Exported document: ${title}`;
            default:
                return `Document activity: ${title}`;
        }
    }

    generateTestDataDescription(action, testData) {
        const name = testData.name || 'Test Data';
        switch (action) {
            case this.activityTypes.TEST_DATA_CREATED:
                return `Created test data: ${name}`;
            case this.activityTypes.TEST_DATA_UPDATED:
                return `Updated test data: ${name}`;
            case this.activityTypes.TEST_DATA_DELETED:
                return `Deleted test data: ${name}`;
            case this.activityTypes.TEST_DATA_IMPORTED:
                return `Imported test data: ${name}`;
            case this.activityTypes.TEST_DATA_EXPORTED:
                return `Exported test data: ${name}`;
            default:
                return `Test data activity: ${name}`;
        }
    }

    generateSprintDescription(action, sprint) {
        const name = sprint.name || sprint.title || 'Sprint';
        switch (action) {
            case this.activityTypes.SPRINT_CREATED:
                return `Created sprint: ${name}`;
            case this.activityTypes.SPRINT_UPDATED:
                return `Updated sprint: ${name}`;
            case this.activityTypes.SPRINT_STARTED:
                return `Started sprint: ${name}`;
            case this.activityTypes.SPRINT_COMPLETED:
                return `Completed sprint: ${name}`;
            case this.activityTypes.SPRINT_DELETED:
                return `Deleted sprint: ${name}`;
            default:
                return `Sprint activity: ${name}`;
        }
    }

    generateRecommendationDescription(action, recommendation) {
        const title = recommendation.title || recommendation.suggestion || 'Recommendation';
        switch (action) {
            case this.activityTypes.RECOMMENDATION_CREATED:
                return `New recommendation: ${title}`;
            case this.activityTypes.RECOMMENDATION_UPDATED:
                return `Updated recommendation: ${title}`;
            case this.activityTypes.RECOMMENDATION_DELETED:
                return `Deleted recommendation: ${title}`;
            case this.activityTypes.RECOMMENDATION_VOTED:
                return `Voted on recommendation: ${title}`;
            case this.activityTypes.RECOMMENDATION_COMMENTED:
                return `Commented on recommendation: ${title}`;
            default:
                return `Recommendation activity: ${title}`;
        }
    }

    generateAIDescription(action, data) {
        switch (action) {
            case this.activityTypes.AI_GENERATION_STARTED:
                return `Started AI generation`;
            case this.activityTypes.AI_GENERATION_COMPLETED:
                return `AI generated ${data.generatedCount || 0} test cases`;
            case this.activityTypes.AI_GENERATION_FAILED:
                return `AI generation failed`;
            case this.activityTypes.AI_TEST_CASE_GENERATED:
                return `AI generated test case`;
            default:
                return `AI activity`;
        }
    }

    generateLinkingDescription(_action, linkData) {
        return `Linked ${linkData.sourceType} to ${linkData.targetType}`;
    }

    generateBulkOperationDescription(action, operation) {
        const count = operation.count || operation.assetIds?.length || 0;
        const assetType = operation.assetType || 'items';
        return `Bulk ${action} on ${count} ${assetType}`;
    }

    /**
     * Get activities for a suite
     */
    async getActivities(suiteId, options = {}) {
        const collectionPath = `testSuites/${suiteId}/activityLogs`;
        const constraints = [];

        if (options.startDate) {
            constraints.push(['timestamp', '>=', new Date(options.startDate)]);
        }

        if (options.endDate) {
            constraints.push(['timestamp', '<=', new Date(options.endDate)]);
        }

        if (options.actionType) {
            constraints.push(['action', '==', options.actionType]);
        }

        if (options.assetType) {
            constraints.push(['metadata.assetType', '==', options.assetType]);
        }

        return await this.queryDocuments(
            collectionPath,
            constraints,
            'timestamp',
            'desc',
            options.limit || 100
        );
    }

    /**
     * Subscribe to activities
     */
    subscribeToActivities(suiteId, callback, errorCallback = null) {
        const collectionPath = `testSuites/${suiteId}/activityLogs`;
        
        return this.subscribeToCollection(
            collectionPath,
            [], // No constraints for real-time
            callback,
            errorCallback
        );
    }

    /**
     * Clear old activities (for cleanup)
     */
    async clearOldActivities(suiteId, daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const collectionPath = `testSuites/${suiteId}/activityLogs`;
        const result = await this.queryDocuments(
            collectionPath,
            [['timestamp', '<', cutoffDate]],
            'timestamp',
            'asc'
        );

        if (result.success && result.data.length > 0) {
            const deletePromises = result.data.map(activity =>
                this.deleteDocument(collectionPath, activity.id)
            );

            await Promise.allSettled(deletePromises);
            console.log(`Cleared ${result.data.length} old activities from suite ${suiteId}`);
        }

        return result;
    }
}

// Export as named instance to avoid anonymous default export warning
const activityServiceInstance = new ActivityService();
export default activityServiceInstance;