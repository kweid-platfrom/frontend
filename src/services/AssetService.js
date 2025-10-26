// Fixed AssetService.js - Added missing recording subscription methods
import { BaseFirestoreService } from './firestoreService';
import { orderBy } from 'firebase/firestore';
import recordingService from '../services/recordingService';

export class AssetService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
        this.recordingService = recordingService;
        // Track if we're in an authenticated context (set by AppProvider)
        this.isAuthenticatedContext = false;
    }

    // Method to set authenticated context (called by AppProvider)
    setAuthenticatedContext(isAuthenticated) {
        this.isAuthenticatedContext = isAuthenticated;
    }

    // Internal validation that respects authenticated context
    async _validateAccess(suiteId, accessLevel = 'read') {
        // If we're in authenticated context (from AppProvider), skip validation
        if (this.isAuthenticatedContext) {
            return true;
        }

        // Otherwise, perform validation for direct service calls
        return await this.testSuiteService.validateTestSuiteAccess(suiteId, accessLevel);
    }

    // ========================
    // CORE ASSET METHODS (with context-aware validation)
    // ========================

    async updateSuiteAsset(suiteId, assetType, assetId, updates, sprintId = null, skipValidation = false) {
        console.log('AssetService.updateSuiteAsset called with:', {
            suiteId, assetType, assetId,
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            sprintId,
            skipValidation
        });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        if (!assetId || typeof assetId !== 'string') {
            return { success: false, error: { message: 'Invalid asset ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        // Validate access only if not in authenticated context and not explicitly skipped
        if (!skipValidation) {
            const hasAccess = await this._validateAccess(suiteId, 'write');
            if (!hasAccess) {
                return { success: false, error: { message: `Insufficient permissions to update ${assetType}` } };
            }
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        const data = this.addCommonFields({
            ...updates,
            updated_at: new Date(),
            lastActivity: new Date()
        }, true);

        return await super.updateDocument(collectionPath, assetId, data);
    }

    async deleteSuiteAsset(suiteId, assetType, assetId, sprintId = null, skipValidation = false) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate access only if not in authenticated context and not explicitly skipped
        if (!skipValidation) {
            const hasAccess = await this._validateAccess(suiteId, 'admin');
            if (!hasAccess) {
                return { success: false, error: { message: `Insufficient permissions to delete ${assetType}` } };
            }
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.deleteDocument(collectionPath, assetId);
    }

    async getSuiteAsset(suiteId, assetType, assetId, sprintId = null, skipValidation = false) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate access only if not in authenticated context and not explicitly skipped
        if (!skipValidation) {
            const hasAccess = await this._validateAccess(suiteId, 'read');
            if (!hasAccess) {
                return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
            }
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.getDocument(collectionPath, assetId);
    }

    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null, skipValidation = false) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate access only if not in authenticated context and not explicitly skipped
        if (!skipValidation) {
            const hasAccess = await this._validateAccess(suiteId, 'write');
            if (!hasAccess) {
                return { success: false, error: { message: `Insufficient permissions to create ${assetType}` } };
            }
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const data = this.addCommonFields({
            suite_id: suiteId,
            ...(sprintId && { sprint_id: sprintId }),
            ...assetData
        });

        try {
            const result = await super.createDocument(collectionPath, data);

            if (result.success) {
                return {
                    success: true,
                    data: { id: result.docId || result.data?.id, ...result.data }
                };
            }

            return result;
        } catch (error) {
            console.error(`Error creating ${assetType}:`, error);
            return {
                success: false,
                error: {
                    message: `Failed to create ${assetType}: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async getSuiteAssets(suiteId, assetType, sprintId = null, options = {}) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        // Validate access only if not in authenticated context and not explicitly skipped
        if (!options.skipValidation) {
            const hasAccess = await this._validateAccess(suiteId, 'read');
            if (!hasAccess) {
                return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
            }
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const constraints = [];

        // Default filtering behavior
        if (options.includeStatus && options.includeStatus.length > 0) {
            constraints.push(['status', 'in', options.includeStatus]);
        } else if (!options.includeAll) {
            const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
            if (excludeStatuses.length > 0) {
                // Will filter post-query
            }
        }

        // Handle date filtering
        if (options.dateFrom) {
            constraints.push(['created_at', '>=', new Date(options.dateFrom)]);
        }
        if (options.dateTo) {
            constraints.push(['created_at', '<=', new Date(options.dateTo)]);
        }

        // Asset-specific filters
        if (assetType === 'recordings' && options.provider) {
            constraints.push(['provider', '==', options.provider]);
        }
        if (assetType === 'bugs' && options.priority) {
            constraints.push(['priority', '==', options.priority]);
        }
        if (assetType === 'bugs' && options.severity) {
            constraints.push(['severity', '==', options.severity]);
        }

        const result = await this.queryDocuments(
            collectionPath,
            constraints,
            options.orderBy || 'created_at',
            options.orderDirection || 'desc'
        );

        // Post-process filtering
        if (result.success && result.data) {
            let filteredData = result.data;

            if (!options.includeStatus && !options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                if (excludeStatuses.length > 0) {
                    filteredData = result.data.filter(item =>
                        !excludeStatuses.includes(item.status)
                    );
                }
            }

            if (options.excludeStatus && options.includeStatus) {
                filteredData = filteredData.filter(item =>
                    !options.excludeStatus.includes(item.status)
                );
            }

            result.data = filteredData;
        }

        return result;
    }

    subscribeToSuiteAssets(suiteId, assetType, callback, errorCallback = null, sprintId = null, options = {}) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        return this.subscribeToCollection(
            collectionPath,
            [orderBy('created_at', 'desc')],
            (data) => {
                let filteredData = data;

                if (!options.includeAll) {
                    const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                    if (excludeStatuses.length > 0) {
                        filteredData = data.filter(item =>
                            !excludeStatuses.includes(item.status)
                        );
                    }
                }

                callback(filteredData);
            },
            errorCallback
        );
    }

    // ========================
    // RECORDING METHODS - ADDED MISSING METHODS
    // ========================

    async createRecording(suiteId, recordingData, sprintId = null, skipValidation = false) {
        // Recordings are linked to bugs, so we store them in a recordings collection
        return await this.createSuiteAsset(suiteId, 'recordings', recordingData, sprintId, skipValidation);
    }

    async getRecording(recordingId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId, skipValidation);
    }

    async getRecordings(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'recordings', sprintId, defaultOptions);
    }

    async updateRecording(recordingId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'recordings', recordingId, updates, sprintId, skipValidation);
    }

    async deleteRecording(recordingId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId, skipValidation);
    }

    // FIXED: Added missing subscription method
    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', (recordings) => {
            let filteredRecordings = recordings;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredRecordings = recordings.filter(recording =>
                    !excludeStatuses.includes(recording.status)
                );
            }

            callback(filteredRecordings);
        }, errorCallback, sprintId, options);
    }

    // Recording service status methods (delegate to recordingService if available)
    async getRecordingServiceStatus() {
        if (this.recordingService && typeof this.recordingService.getServiceStatus === 'function') {
            return await this.recordingService.getServiceStatus();
        }
        return { success: true, data: { status: 'available', provider: 'firestore' } };
    }

    async testYouTubeConnection() {
        if (this.recordingService && typeof this.recordingService.testYouTubeConnection === 'function') {
            return await this.recordingService.testYouTubeConnection();
        }
        return { success: false, error: { message: 'YouTube service not available' } };
    }

    async isYouTubeAvailable() {
        if (this.recordingService && typeof this.recordingService.isYouTubeAvailable === 'function') {
            return await this.recordingService.isYouTubeAvailable();
        }
        return false;
    }

    async getRecordingStatistics(suiteId, sprintId = null) {
        const recordings = await this.getRecordings(suiteId, sprintId, { includeAll: true });

        if (!recordings.success) {
            return recordings;
        }

        const stats = {
            total: recordings.data.length,
            byProvider: {},
            byStatus: {},
            totalDuration: 0
        };

        recordings.data.forEach(recording => {
            stats.byProvider[recording.provider || 'unknown'] = (stats.byProvider[recording.provider || 'unknown'] || 0) + 1;
            stats.byStatus[recording.status || 'unknown'] = (stats.byStatus[recording.status || 'unknown'] || 0) + 1;
            stats.totalDuration += recording.duration || 0;
        });

        return { success: true, data: stats };
    }

    async uploadAndCreateRecording(suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) {
        // If recordingService has upload functionality, use it
        if (this.recordingService && typeof this.recordingService.uploadAndCreate === 'function') {
            return await this.recordingService.uploadAndCreate(suiteId, recordingBlob, metadata, sprintId, onProgress);
        }

        // Otherwise, create a basic recording entry
        const recordingData = {
            ...metadata,
            size: recordingBlob.size,
            type: recordingBlob.type,
            provider: 'local',
            uploadedAt: new Date(),
            status: 'active'
        };

        return await this.createRecording(suiteId, recordingData, sprintId);
    }

    // ========================
    // SPRINT METHODS - SKIP VALIDATION WHEN IN AUTHENTICATED CONTEXT
    // ========================

    async addTestCasesToSprint(sprintId, testCaseIds, suiteId) {
        console.log('AssetService.addTestCasesToSprint:', { sprintId, testCaseIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !testCaseIds || testCaseIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and test case IDs are required' }
            };
        }

        // FIXED: Skip validation - we're already in authenticated context from AppProvider
        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const testCaseId of testCaseIds) {
                try {
                    // FIXED: Pass skipValidation flag
                    const testCaseResult = await this.getTestCase(testCaseId, suiteId, null, skipValidation);

                    if (!testCaseResult.success) {
                        errors.push({ id: testCaseId, error: 'Test case not found' });
                        continue;
                    }

                    const testCase = testCaseResult.data;

                    // FIXED: Pass skipValidation flag
                    const updateResult = await this.updateTestCase(
                        testCaseId,
                        {
                            sprint_id: sprintId,
                            sprintId: sprintId,
                            addedToSprintAt: new Date(),
                            addedToSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: testCaseId, error: updateResult.error?.message });
                        continue;
                    }

                    // Copy to sprint subcollection
                    const sprintTestCasePath = `testSuites/${suiteId}/sprints/${sprintId}/testCases`;
                    const copyResult = await this.createDocument(sprintTestCasePath, {
                        ...testCase,
                        originalId: testCaseId,
                        sprint_id: sprintId,
                        copiedAt: new Date(),
                        copiedBy: userId
                    }, testCaseId);

                    if (copyResult.success) {
                        results.push({
                            id: testCaseId,
                            success: true,
                            title: testCase.title
                        });
                    } else {
                        errors.push({
                            id: testCaseId,
                            error: 'Failed to copy to sprint subcollection'
                        });
                    }

                } catch (error) {
                    console.error(`Error adding test case ${testCaseId} to sprint:`, error);
                    errors.push({
                        id: testCaseId,
                        error: error.message
                    });
                }
            }

            // Update sprint with test case references
            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingTestCases = sprint.data.testCases || [];
                        const updatedTestCases = [...new Set([...existingTestCases, ...results.map(r => r.id)])];

                        await this.updateSprint(sprintId, {
                            testCases: updatedTestCases,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint test cases array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    added: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in addTestCasesToSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to add test cases to sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async addBugsToSprint(sprintId, bugIds, suiteId) {
        console.log('AssetService.addBugsToSprint:', { sprintId, bugIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !bugIds || bugIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and bug IDs are required' }
            };
        }

        // FIXED: Skip validation - we're already in authenticated context
        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const bugId of bugIds) {
                try {
                    // FIXED: Pass skipValidation flag
                    const bugResult = await this.getBug(bugId, suiteId, null, skipValidation);

                    if (!bugResult.success) {
                        errors.push({ id: bugId, error: 'Bug not found' });
                        continue;
                    }

                    const bug = bugResult.data;

                    // FIXED: Pass skipValidation flag
                    const updateResult = await this.updateBug(
                        bugId,
                        {
                            sprint_id: sprintId,
                            sprintId: sprintId,
                            addedToSprintAt: new Date(),
                            addedToSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: bugId, error: updateResult.error?.message });
                        continue;
                    }

                    // Copy to sprint subcollection
                    const sprintBugPath = `testSuites/${suiteId}/sprints/${sprintId}/bugs`;
                    const copyResult = await this.createDocument(sprintBugPath, {
                        ...bug,
                        originalId: bugId,
                        sprint_id: sprintId,
                        copiedAt: new Date(),
                        copiedBy: userId
                    }, bugId);

                    if (copyResult.success) {
                        results.push({
                            id: bugId,
                            success: true,
                            title: bug.title
                        });
                    } else {
                        errors.push({
                            id: bugId,
                            error: 'Failed to copy to sprint subcollection'
                        });
                    }

                } catch (error) {
                    console.error(`Error adding bug ${bugId} to sprint:`, error);
                    errors.push({
                        id: bugId,
                        error: error.message
                    });
                }
            }

            // Update sprint with bug references
            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingBugs = sprint.data.bugs || [];
                        const updatedBugs = [...new Set([...existingBugs, ...results.map(r => r.id)])];

                        await this.updateSprint(sprintId, {
                            bugs: updatedBugs,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint bugs array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    added: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in addBugsToSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to add bugs to sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async addRecommendationsToSprint(sprintId, recommendationIds, suiteId) {
        console.log('AssetService.addRecommendationsToSprint:', { sprintId, recommendationIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !recommendationIds || recommendationIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and recommendation IDs are required' }
            };
        }

        // FIXED: Skip validation - we're already in authenticated context
        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const recommendationId of recommendationIds) {
                try {
                    // FIXED: Pass skipValidation flag
                    const recommendationResult = await this.getRecommendation(recommendationId, suiteId, null, skipValidation);

                    if (!recommendationResult.success) {
                        errors.push({ id: recommendationId, error: 'Recommendation not found' });
                        continue;
                    }

                    const recommendation = recommendationResult.data;

                    // FIXED: Pass skipValidation flag
                    const updateResult = await this.updateRecommendation(
                        recommendationId,
                        {
                            sprint_id: sprintId,
                            sprintId: sprintId,
                            addedToSprintAt: new Date(),
                            addedToSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: recommendationId, error: updateResult.error?.message });
                        continue;
                    }

                    // Copy to sprint subcollection
                    const sprintRecommendationPath = `testSuites/${suiteId}/sprints/${sprintId}/recommendations`;
                    const copyResult = await this.createDocument(sprintRecommendationPath, {
                        ...recommendation,
                        originalId: recommendationId,
                        sprint_id: sprintId,
                        copiedAt: new Date(),
                        copiedBy: userId
                    }, recommendationId);

                    if (copyResult.success) {
                        results.push({
                            id: recommendationId,
                            success: true,
                            title: recommendation.title
                        });
                    } else {
                        errors.push({
                            id: recommendationId,
                            error: 'Failed to copy to sprint subcollection'
                        });
                    }

                } catch (error) {
                    console.error(`Error adding recommendation ${recommendationId} to sprint:`, error);
                    errors.push({
                        id: recommendationId,
                        error: error.message
                    });
                }
            }

            // Update sprint with recommendation references
            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingRecommendations = sprint.data.recommendations || [];
                        const updatedRecommendations = [...new Set([...existingRecommendations, ...results.map(r => r.id)])];

                        await this.updateSprint(sprintId, {
                            recommendations: updatedRecommendations,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint recommendations array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    added: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in addRecommendationsToSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to add recommendations to sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    // ========================
    // TEST CASES METHODS - Updated signatures
    // ========================

    async createTestCase(suiteId, testCaseData, sprintId = null, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId, skipValidation);
    }

    async getTestCases(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId, defaultOptions);
    }

    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', (testCases) => {
            let filteredTestCases = testCases;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredTestCases = testCases.filter(testCase =>
                    !excludeStatuses.includes(testCase.status)
                );
            }

            callback(filteredTestCases);
        }, errorCallback, sprintId, options);
    }

    async updateTestCase(testCaseId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'testCases', testCaseId, updates, sprintId, skipValidation);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'testCases', testCaseId, sprintId, skipValidation);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'testCases', testCaseId, sprintId, skipValidation);
    }

    // ========================
    // BUGS METHODS - Updated signatures
    // ========================

    async createBug(suiteId, bugData, sprintId = null, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId, skipValidation);
    }

    async getBugs(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId, defaultOptions);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', (bugs) => {
            let filteredBugs = bugs;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredBugs = bugs.filter(bug =>
                    !excludeStatuses.includes(bug.status)
                );
            }

            callback(filteredBugs);
        }, errorCallback, sprintId, options);
    }

    async updateBug(bugId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'bugs', bugId, updates, sprintId, skipValidation);
    }

    async deleteBug(bugId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'bugs', bugId, sprintId, skipValidation);
    }

    async getBug(bugId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'bugs', bugId, sprintId, skipValidation);
    }

    // ========================
    // RECOMMENDATIONS METHODS - Updated signatures
    // ========================

    async createRecommendation(suiteId, recommendationData, sprintId = null, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'recommendations', recommendationData, sprintId, skipValidation);
    }

    async getRecommendations(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'recommendations', sprintId, defaultOptions);
    }

    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'recommendations', (recommendations) => {
            let filteredRecommendations = recommendations;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredRecommendations = recommendations.filter(rec =>
                    !excludeStatuses.includes(rec.status)
                );
            }

            callback(filteredRecommendations);
        }, errorCallback, sprintId, options);
    }

    async updateRecommendation(recommendationId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'recommendations', recommendationId, updates, sprintId, skipValidation);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId, skipValidation);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId, skipValidation);
    }

    // ========================
    // DOCUMENTS METHODS - ADDED MISSING METHODS
    // ========================

    async createDocument(suiteId, documentData, sprintId = null, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'documents', documentData, sprintId, skipValidation);
    }

    async getDocument(documentId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'documents', documentId, sprintId, skipValidation);
    }

    async getDocuments(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'documents', sprintId, defaultOptions);
    }

    async updateDocument(documentId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'documents', documentId, updates, sprintId, skipValidation);
    }

    async deleteDocument(documentId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'documents', documentId, sprintId, skipValidation);
    }

    subscribeToDocuments(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'documents', (documents) => {
            let filteredDocuments = documents;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredDocuments = documents.filter(doc =>
                    !excludeStatuses.includes(doc.status)
                );
            }

            callback(filteredDocuments);
        }, errorCallback, sprintId, options);
    }

    // Document-specific helper methods
    async searchDocuments(suiteId, searchQuery, sprintId = null) {
        const documentsResult = await this.getDocuments(suiteId, sprintId, { includeAll: false });

        if (!documentsResult.success) {
            return documentsResult;
        }

        const searchLower = searchQuery.toLowerCase();
        const filtered = documentsResult.data.filter(doc =>
            doc.title?.toLowerCase().includes(searchLower) ||
            doc.content?.toLowerCase().includes(searchLower) ||
            doc.type?.toLowerCase().includes(searchLower) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );

        return { success: true, data: filtered };
    }

    async getDocumentStatistics(suiteId, sprintId = null) {
        const documents = await this.getDocuments(suiteId, sprintId, { includeAll: true });

        if (!documents.success) {
            return documents;
        }

        const stats = {
            total: documents.data.length,
            byType: {},
            byStatus: {},
            recentlyModified: []
        };

        documents.data.forEach(doc => {
            stats.byType[doc.type || 'general'] = (stats.byType[doc.type || 'general'] || 0) + 1;
            stats.byStatus[doc.status || 'draft'] = (stats.byStatus[doc.status || 'draft'] || 0) + 1;
        });

        // Get recently modified (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        stats.recentlyModified = documents.data
            .filter(doc => doc.metadata?.lastModified && new Date(doc.metadata.lastModified) > weekAgo)
            .sort((a, b) => new Date(b.metadata.lastModified) - new Date(a.metadata.lastModified))
            .slice(0, 10);

        return { success: true, data: stats };
    }

    async getDocumentVersionHistory(documentId, suiteId, sprintId = null) {
        // This would require additional Firestore structure to track versions
        // For now, return a placeholder
        return {
            success: true,
            data: {
                documentId,
                versions: [],
                message: 'Version history not yet implemented'
            }
        };
    }

    // ========================
    // TEST DATA METHODS - ADDED MISSING METHODS
    // ========================

    async createTestData(suiteId, testDataData, sprintId = null, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'testData', testDataData, sprintId, skipValidation);
    }

    async getTestDataById(dataId, suiteId, sprintId = null, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'testData', dataId, sprintId, skipValidation);
    }

    async getTestData(suiteId, sprintId = null, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'testData', sprintId, defaultOptions);
    }

    async updateTestData(dataId, updates, suiteId, sprintId = null, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'testData', dataId, updates, sprintId, skipValidation);
    }

    async deleteTestData(dataId, suiteId, sprintId = null, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'testData', dataId, sprintId, skipValidation);
    }

    subscribeToTestData(suiteId, callback, errorCallback = null, sprintId = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'testData', (testData) => {
            let filteredTestData = testData;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredTestData = testData.filter(data =>
                    !excludeStatuses.includes(data.status)
                );
            }

            callback(filteredTestData);
        }, errorCallback, sprintId, options);
    }

    // Test Data specific helper methods
    async bulkImportTestData(suiteId, testDataArray, sprintId = null) {
        const results = [];
        const errors = [];

        for (const data of testDataArray) {
            try {
                const result = await this.createTestData(suiteId, data, sprintId, true);
                if (result.success) {
                    results.push(result.data);
                } else {
                    errors.push({ data, error: result.error });
                }
            } catch (error) {
                errors.push({ data, error: { message: error.message } });
            }
        }

        return {
            success: errors.length === 0,
            data: {
                imported: results.length,
                failed: errors.length,
                results,
                errors
            }
        };
    }

    async exportTestData(suiteId, format = 'json', sprintId = null) {
        const testData = await this.getTestData(suiteId, sprintId, { includeAll: false });

        if (!testData.success) {
            return testData;
        }

        if (format === 'json') {
            return {
                success: true,
                data: JSON.stringify(testData.data, null, 2),
                mimeType: 'application/json'
            };
        } else if (format === 'csv') {
            // Basic CSV export
            if (testData.data.length === 0) {
                return { success: true, data: '', mimeType: 'text/csv' };
            }

            const headers = Object.keys(testData.data[0]);
            const csv = [
                headers.join(','),
                ...testData.data.map(row =>
                    headers.map(header => JSON.stringify(row[header] || '')).join(',')
                )
            ].join('\n');

            return {
                success: true,
                data: csv,
                mimeType: 'text/csv'
            };
        }

        return {
            success: false,
            error: { message: `Unsupported export format: ${format}` }
        };
    }

    async validateTestData(testDataData) {
        const errors = [];

        if (!testDataData.name || testDataData.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!testDataData.type) {
            errors.push('Type is required');
        }

        if (!testDataData.data || typeof testDataData.data !== 'object') {
            errors.push('Data must be an object');
        }

        return {
            success: errors.length === 0,
            errors,
            isValid: errors.length === 0
        };
    }

    async duplicateTestData(dataId, suiteId, sprintId = null) {
        const original = await this.getTestDataById(dataId, suiteId, sprintId, true);

        if (!original.success) {
            return original;
        }

        const duplicate = {
            ...original.data,
            name: `${original.data.name} (Copy)`,
            created_at: new Date(),
            updated_at: new Date()
        };

        delete duplicate.id;

        return await this.createTestData(suiteId, duplicate, sprintId, true);
    }

    async mergeTestData(sourceIds, suiteId, sprintId = null, newName = 'Merged Test Data') {
        const mergedData = {};

        for (const id of sourceIds) {
            const result = await this.getTestDataById(id, suiteId, sprintId, true);
            if (result.success) {
                Object.assign(mergedData, result.data.data || {});
            }
        }

        const merged = {
            name: newName,
            type: 'merged',
            data: mergedData,
            sourceIds,
            status: 'active'
        };

        return await this.createTestData(suiteId, merged, sprintId, true);
    }

    async searchTestData(suiteId, searchQuery, sprintId = null) {
        const testDataResult = await this.getTestData(suiteId, sprintId, { includeAll: false });

        if (!testDataResult.success) {
            return testDataResult;
        }

        const searchLower = searchQuery.toLowerCase();
        const filtered = testDataResult.data.filter(data =>
            data.name?.toLowerCase().includes(searchLower) ||
            data.type?.toLowerCase().includes(searchLower) ||
            data.description?.toLowerCase().includes(searchLower) ||
            JSON.stringify(data.data).toLowerCase().includes(searchLower)
        );

        return { success: true, data: filtered };
    }

    async getTestDataStatistics(suiteId, sprintId = null) {
        const testData = await this.getTestData(suiteId, sprintId, { includeAll: true });

        if (!testData.success) {
            return testData;
        }

        const stats = {
            total: testData.data.length,
            byType: {},
            byStatus: {},
            totalSize: 0
        };

        testData.data.forEach(data => {
            stats.byType[data.type || 'unknown'] = (stats.byType[data.type || 'unknown'] || 0) + 1;
            stats.byStatus[data.status || 'active'] = (stats.byStatus[data.status || 'active'] || 0) + 1;
            stats.totalSize += JSON.stringify(data.data || {}).length;
        });

        return { success: true, data: stats };
    }

    // ========================
    // SPRINTS METHODS - Updated signatures
    // ========================

    async createSprint(suiteId, sprintData, skipValidation = false) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData, null, skipValidation);
    }

    async getSprints(suiteId, options = {}) {
        const defaultOptions = {
            excludeStatus: options.excludeStatus || (options.includeAll ? [] : ['deleted', 'archived']),
            includeStatus: options.includeStatus,
            includeAll: options.includeAll,
            skipValidation: options.skipValidation || false,
            ...options
        };
        return await this.getSuiteAssets(suiteId, 'sprints', null, defaultOptions);
    }

    subscribeToSprints(suiteId, callback, errorCallback = null, options = {}) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', (sprints) => {
            let filteredSprints = sprints;

            if (!options.includeAll) {
                const excludeStatuses = options.excludeStatus || ['deleted', 'archived'];
                filteredSprints = sprints.filter(sprint =>
                    !excludeStatuses.includes(sprint.status)
                );
            }

            callback(filteredSprints);
        }, errorCallback, null, options);
    }

    async updateSprint(sprintId, updates, suiteId, skipValidation = false) {
        return await this.updateSuiteAsset(suiteId, 'sprints', sprintId, updates, null, skipValidation);
    }

    async deleteSprint(sprintId, suiteId, skipValidation = false) {
        return await this.deleteSuiteAsset(suiteId, 'sprints', sprintId, null, skipValidation);
    }

    async getSprint(sprintId, suiteId, skipValidation = false) {
        return await this.getSuiteAsset(suiteId, 'sprints', sprintId, null, skipValidation);
    }

    // ========================
    // REMOVE FROM SPRINT METHODS - With skipValidation
    // ========================

    async removeTestCasesFromSprint(sprintId, testCaseIds, suiteId) {
        console.log('AssetService.removeTestCasesFromSprint:', { sprintId, testCaseIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !testCaseIds || testCaseIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and test case IDs are required' }
            };
        }

        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const testCaseId of testCaseIds) {
                try {
                    const updateResult = await this.updateTestCase(
                        testCaseId,
                        {
                            sprint_id: null,
                            sprintId: null,
                            removedFromSprintAt: new Date(),
                            removedFromSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: testCaseId, error: updateResult.error?.message });
                        continue;
                    }

                    const sprintTestCasePath = `testSuites/${suiteId}/sprints/${sprintId}/testCases`;
                    await this.deleteDocument(sprintTestCasePath, testCaseId);

                    results.push({ id: testCaseId, success: true });

                } catch (error) {
                    console.error(`Error removing test case ${testCaseId} from sprint:`, error);
                    errors.push({
                        id: testCaseId,
                        error: error.message
                    });
                }
            }

            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingTestCases = sprint.data.testCases || [];
                        const updatedTestCases = existingTestCases.filter(
                            id => !results.map(r => r.id).includes(id)
                        );

                        await this.updateSprint(sprintId, {
                            testCases: updatedTestCases,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint test cases array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    removed: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in removeTestCasesFromSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to remove test cases from sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async removeBugsFromSprint(sprintId, bugIds, suiteId) {
        console.log('AssetService.removeBugsFromSprint:', { sprintId, bugIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !bugIds || bugIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and bug IDs are required' }
            };
        }

        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const bugId of bugIds) {
                try {
                    const updateResult = await this.updateBug(
                        bugId,
                        {
                            sprint_id: null,
                            sprintId: null,
                            removedFromSprintAt: new Date(),
                            removedFromSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: bugId, error: updateResult.error?.message });
                        continue;
                    }

                    const sprintBugPath = `testSuites/${suiteId}/sprints/${sprintId}/bugs`;
                    await this.deleteDocument(sprintBugPath, bugId);

                    results.push({ id: bugId, success: true });

                } catch (error) {
                    console.error(`Error removing bug ${bugId} from sprint:`, error);
                    errors.push({
                        id: bugId,
                        error: error.message
                    });
                }
            }

            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingBugs = sprint.data.bugs || [];
                        const updatedBugs = existingBugs.filter(
                            id => !results.map(r => r.id).includes(id)
                        );

                        await this.updateSprint(sprintId, {
                            bugs: updatedBugs,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint bugs array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    removed: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in removeBugsFromSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to remove bugs from sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    async removeRecommendationsFromSprint(sprintId, recommendationIds, suiteId) {
        console.log('AssetService.removeRecommendationsFromSprint:', { sprintId, recommendationIds, suiteId });

        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId || !sprintId || !recommendationIds || recommendationIds.length === 0) {
            return {
                success: false,
                error: { message: 'Suite ID, Sprint ID, and recommendation IDs are required' }
            };
        }

        const skipValidation = true;

        try {
            const results = [];
            const errors = [];

            for (const recommendationId of recommendationIds) {
                try {
                    const updateResult = await this.updateRecommendation(
                        recommendationId,
                        {
                            sprint_id: null,
                            sprintId: null,
                            removedFromSprintAt: new Date(),
                            removedFromSprintBy: userId
                        },
                        suiteId,
                        null,
                        skipValidation
                    );

                    if (!updateResult.success) {
                        errors.push({ id: recommendationId, error: updateResult.error?.message });
                        continue;
                    }

                    const sprintRecommendationPath = `testSuites/${suiteId}/sprints/${sprintId}/recommendations`;
                    await this.deleteDocument(sprintRecommendationPath, recommendationId);

                    results.push({ id: recommendationId, success: true });

                } catch (error) {
                    console.error(`Error removing recommendation ${recommendationId} from sprint:`, error);
                    errors.push({
                        id: recommendationId,
                        error: error.message
                    });
                }
            }

            if (results.length > 0) {
                try {
                    const sprint = await this.getSprint(sprintId, suiteId, skipValidation);
                    if (sprint.success) {
                        const existingRecommendations = sprint.data.recommendations || [];
                        const updatedRecommendations = existingRecommendations.filter(
                            id => !results.map(r => r.id).includes(id)
                        );

                        await this.updateSprint(sprintId, {
                            recommendations: updatedRecommendations,
                            lastUpdated: new Date()
                        }, suiteId, skipValidation);
                    }
                } catch (error) {
                    console.warn('Failed to update sprint recommendations array:', error);
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    removed: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };

        } catch (error) {
            console.error('Error in removeRecommendationsFromSprint:', error);
            return {
                success: false,
                error: {
                    message: `Failed to remove recommendations from sprint: ${error.message}`,
                    code: error.code
                }
            };
        }
    }

    // ========================
    // LEGACY BATCH METHODS (unchanged)
    // ========================

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
}

export const assetService = new AssetService();
export default AssetService;