// Enhanced AssetService.js - Fixed for corrected YouTube service
import { BaseFirestoreService } from './firestoreService';
import { orderBy } from 'firebase/firestore';
import recordingService from '../services/recordingService';

export class AssetService extends BaseFirestoreService {
    constructor(testSuiteService) {
        super();
        this.testSuiteService = testSuiteService;
        this.recordingService = recordingService;
    }

    // ========================
    // CORE ASSET METHODS (unchanged)
    // ========================
    
    async updateSuiteAsset(suiteId, assetType, assetId, updates, sprintId = null) {
        console.log('AssetService.updateSuiteAsset called with:', {
            suiteId, assetType, assetId, 
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            sprintId
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

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to update ${assetType}` } };
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

        return await this.updateDocument(collectionPath, assetId, data);
    }

    async deleteSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'admin');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to delete ${assetType}` } };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.deleteDocument(collectionPath, assetId);
    }

    async getSuiteAsset(suiteId, assetType, assetId, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
        }

        let collectionPath;
        if (sprintId && typeof sprintId === 'string') {
            collectionPath = `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`;
        } else {
            collectionPath = `testSuites/${suiteId}/${assetType}`;
        }

        return await this.getDocument(collectionPath, assetId);
    }

    async createSuiteAsset(suiteId, assetType, assetData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to create ${assetType}` } };
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

    async getSuiteAssets(suiteId, assetType, sprintId = null, options = {}) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: `Insufficient permissions to access ${assetType}` } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/${assetType}`
            : `testSuites/${suiteId}/${assetType}`;

        const constraints = [];

        if (options.includeStatus && options.includeStatus.length > 0) {
            constraints.push(['status', 'in', options.includeStatus]);
        }

        // Handle date filtering
        if (options.dateFrom) {
            constraints.push(['created_at', '>=', new Date(options.dateFrom)]);
        }
        if (options.dateTo) {
            constraints.push(['created_at', '<=', new Date(options.dateTo)]);
        }

        // Handle provider filtering for recordings
        if (assetType === 'recordings' && options.provider) {
            constraints.push(['provider', '==', options.provider]);
        }

        const result = await this.queryDocuments(
            collectionPath, 
            constraints, 
            options.orderBy || 'created_at',
            options.orderDirection || 'desc'
        );

        if (result.success && options.excludeStatus && options.excludeStatus.length > 0) {
            result.data = result.data.filter(item =>
                !options.excludeStatus.includes(item.status)
            );
        }

        return result;
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

    // ========================
    // FIXED RECORDING METHODS
    // ========================

    // FIXED: Upload recording blob and create Firestore record with proper error handling
    async uploadAndCreateRecording(suiteId, recordingBlob, metadata = {}, sprintId = null, onProgress = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        if (!suiteId) {
            return { success: false, error: { message: 'Suite ID is required' } };
        }

        if (!recordingBlob || !(recordingBlob instanceof Blob)) {
            return { success: false, error: { message: 'Valid recording blob is required' } };
        }

        if (recordingBlob.size === 0) {
            return { success: false, error: { message: 'Recording blob cannot be empty' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create recording' } };
        }

        try {
            console.log('Starting upload and create recording process...');
            
            // Step 1: Upload the recording blob with retry logic
            const uploadResult = await this.recordingService.uploadRecordingWithRetry(
                recordingBlob,
                {
                    title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording from QA testing',
                    tags: metadata.tags || ['qa-testing', 'screen-recording'],
                    privacy: metadata.privacy || 'private'
                },
                onProgress,
                2 // maxRetries
            );

            if (!uploadResult.success) {
                console.error('Upload failed:', uploadResult.error);
                return { 
                    success: false, 
                    error: { 
                        message: `Upload failed: ${uploadResult.error.message}`,
                        details: uploadResult.error 
                    } 
                };
            }

            console.log('Upload successful, creating Firestore record...');

            // Step 2: Prepare comprehensive recording data
            const recordingData = {
                title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || '',
                
                // Unified URL fields
                videoUrl: uploadResult.data.videoUrl || uploadResult.data.url,
                url: uploadResult.data.url || uploadResult.data.videoUrl,
                
                // YouTube-specific fields
                youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
                videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
                embedUrl: uploadResult.data.embedUrl,
                thumbnailUrl: uploadResult.data.thumbnailUrl,
                privacyStatus: uploadResult.data.privacyStatus,
                
                // Provider and file info
                provider: uploadResult.data.provider,
                filename: uploadResult.data.filename,
                duration: metadata.duration || 0,
                size: uploadResult.data.size,
                
                // Firebase-specific fields
                ...(uploadResult.data.provider === 'firebase' && {
                    storagePath: uploadResult.data.storagePath
                }),
                
                // Session data
                consoleLogs: metadata.consoleLogs || [],
                networkLogs: metadata.networkLogs || [],
                comments: metadata.comments || [],
                detectedIssues: metadata.detectedIssues || [],
                platform: metadata.platform || navigator.userAgent,
                status: 'active',
                
                // Enhanced metadata
                metadata: {
                    recordingStartTime: metadata.recordingStartTime || new Date().toISOString(),
                    recordingEndTime: metadata.recordingEndTime || new Date().toISOString(),
                    browserInfo: {
                        userAgent: navigator.userAgent,
                        viewport: {
                            width: window.innerWidth || 1920,
                            height: window.innerHeight || 1080
                        }
                    },
                    uploadInfo: {
                        uploadedAt: new Date().toISOString(),
                        provider: uploadResult.data.provider,
                        originalFilename: uploadResult.data.filename,
                        fileSize: uploadResult.data.size
                    },
                    statistics: {
                        totalLogs: (metadata.consoleLogs?.length || 0) + (metadata.networkLogs?.length || 0),
                        issuesDetected: metadata.detectedIssues?.length || 0,
                        commentsCount: metadata.comments?.length || 0
                    }
                }
            };

            // Step 3: Create Firestore record
            const createResult = await this.createRecording(suiteId, recordingData, sprintId);
            
            if (createResult.success) {
                console.log('Recording created successfully');
                return {
                    success: true,
                    data: {
                        id: createResult.data.id,
                        ...recordingData,
                        created_at: createResult.data.created_at,
                        updated_at: createResult.data.updated_at,
                        uploadInfo: uploadResult.data,
                        // Computed fields
                        playbackUrl: this.recordingService.getPlaybackUrl(recordingData),
                        directUrl: this.recordingService.getVideoUrl(recordingData)
                    }
                };
            } else {
                console.warn('Firestore creation failed, attempting cleanup...');
                // Cleanup uploaded video if Firestore creation fails
                try {
                    await this.recordingService.deleteRecording(uploadResult.data);
                    console.log('Cleanup successful');
                } catch (cleanupError) {
                    console.error('Failed to cleanup uploaded video:', cleanupError);
                }
                return createResult;
            }

        } catch (error) {
            console.error('Upload and create recording failed:', error);
            return { 
                success: false, 
                error: { 
                    message: `Operation failed: ${error.message}`,
                    stack: error.stack 
                } 
            };
        }
    }

    // FIXED: Create recording with comprehensive validation
    async createRecording(suiteId, recordingData, sprintId = null) {
        // Validate recording data structure
        const validation = this.recordingService.validateRecordingData(recordingData);
        if (!validation.valid) {
            return { 
                success: false, 
                error: { 
                    message: 'Invalid recording data structure', 
                    details: validation.errors 
                } 
            };
        }

        const data = {
            title: recordingData.title || `Recording - ${new Date().toLocaleDateString()}`,
            description: recordingData.description || '',
            
            // Ensure both URL fields exist
            videoUrl: recordingData.videoUrl || recordingData.url,
            url: recordingData.url || recordingData.videoUrl,
            
            // YouTube fields (ensure both aliases exist)
            youtubeId: recordingData.youtubeId || recordingData.videoId || null,
            videoId: recordingData.videoId || recordingData.youtubeId || null,
            embedUrl: recordingData.embedUrl,
            thumbnailUrl: recordingData.thumbnailUrl,
            privacyStatus: recordingData.privacyStatus,
            
            // Core fields
            provider: recordingData.provider || 'youtube',
            filename: recordingData.filename,
            duration: recordingData.duration || 0,
            size: recordingData.size,
            
            // Firebase-specific fields
            ...(recordingData.provider === 'firebase' && {
                storagePath: recordingData.storagePath
            }),
            
            // Session data
            consoleLogs: recordingData.consoleLogs || [],
            networkLogs: recordingData.networkLogs || [],
            comments: recordingData.comments || [],
            detectedIssues: recordingData.detectedIssues || [],
            platform: recordingData.platform || navigator.userAgent,
            status: recordingData.status || 'active',
            
            // Metadata with defaults
            metadata: recordingData.metadata || {
                recordingStartTime: new Date().toISOString(),
                recordingEndTime: new Date().toISOString(),
                browserInfo: {
                    userAgent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth || 1920,
                        height: window.innerHeight || 1080
                    }
                },
                statistics: {
                    totalLogs: (recordingData.consoleLogs?.length || 0) + (recordingData.networkLogs?.length || 0),
                    issuesDetected: recordingData.detectedIssues?.length || 0,
                    commentsCount: recordingData.comments?.length || 0
                }
            }
        };

        return await this.createSuiteAsset(suiteId, 'recordings', data, sprintId);
    }

    // FIXED: Get recordings with enhanced post-processing
    async getRecordings(suiteId, sprintId = null, options = {}) {
        // Set default options for recordings
        const recordingOptions = {
            excludeStatus: options.excludeStatus || ['deleted'],
            includeStatus: options.includeStatus,
            dateFrom: options.dateFrom,
            dateTo: options.dateTo,
            provider: options.provider,
            orderBy: options.orderBy || 'created_at',
            orderDirection: options.orderDirection || 'desc'
        };

        const result = await this.getSuiteAssets(suiteId, 'recordings', sprintId, recordingOptions);

        // Enhanced post-processing
        if (result.success && result.data) {
            result.data = result.data.map(recording => {
                // Ensure URL consistency
                const videoUrl = recording.videoUrl || recording.url;
                const playbackUrl = this.recordingService.getPlaybackUrl(recording);
                const directUrl = this.recordingService.getVideoUrl(recording);
                
                return {
                    ...recording,
                    // Standardized URL fields
                    videoUrl,
                    url: videoUrl,
                    playbackUrl,
                    directUrl,
                    
                    // Provider-specific URLs
                    embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                        ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                        : videoUrl,
                    
                    // Additional computed fields
                    recordingInfo: this.recordingService.getRecordingInfo(recording),
                    isYouTube: recording.provider === 'youtube',
                    isFirebase: recording.provider === 'firebase',
                    
                    // Format dates for display
                    createdAtFormatted: recording.created_at 
                        ? new Date(recording.created_at.toDate ? recording.created_at.toDate() : recording.created_at).toLocaleString()
                        : 'Unknown',
                    
                    // Statistics
                    stats: {
                        totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                        consoleLogs: recording.consoleLogs?.length || 0,
                        networkLogs: recording.networkLogs?.length || 0,
                        detectedIssues: recording.detectedIssues?.length || 0,
                        comments: recording.comments?.length || 0
                    }
                };
            });
        }

        return result;
    }

    // FIXED: Update recording with comprehensive blob and metadata handling
    async updateRecording(recordingId, updates, suiteId, sprintId = null) {
        if (!recordingId || typeof recordingId !== 'string') {
            return { success: false, error: { message: 'Invalid recording ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        console.log('AssetService.updateRecording called with:', {
            recordingId,
            updatesKeys: Object.keys(updates),
            suiteId,
            sprintId
        });

        // Handle new video upload if provided
        if (updates.newVideoBlob) {
            try {
                console.log('Processing new video blob upload...');
                
                const uploadResult = await this.recordingService.uploadRecordingWithRetry(
                    updates.newVideoBlob,
                    {
                        title: updates.title,
                        description: updates.description,
                        privacy: updates.privacy || 'private'
                    },
                    null, // onProgress - could be passed from updates if needed
                    2 // maxRetries
                );

                if (uploadResult.success) {
                    // Update with new video data
                    Object.assign(updates, {
                        videoUrl: uploadResult.data.videoUrl || uploadResult.data.url,
                        url: uploadResult.data.url || uploadResult.data.videoUrl,
                        youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
                        videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
                        provider: uploadResult.data.provider,
                        filename: uploadResult.data.filename,
                        embedUrl: uploadResult.data.embedUrl,
                        thumbnailUrl: uploadResult.data.thumbnailUrl,
                        privacyStatus: uploadResult.data.privacyStatus,
                        size: uploadResult.data.size
                    });
                    
                    // Add provider-specific fields
                    if (uploadResult.data.provider === 'firebase') {
                        updates.storagePath = uploadResult.data.storagePath;
                    }
                    
                    // Update metadata
                    updates.metadata = {
                        ...updates.metadata,
                        uploadInfo: {
                            reUploadedAt: new Date().toISOString(),
                            provider: uploadResult.data.provider,
                            originalFilename: uploadResult.data.filename,
                            fileSize: uploadResult.data.size
                        }
                    };

                    console.log('New video uploaded successfully');
                } else {
                    console.error('New video upload failed:', uploadResult.error);
                    return { success: false, error: uploadResult.error };
                }
            } catch (error) {
                console.error('Error during video upload:', error);
                return { 
                    success: false, 
                    error: { message: `Video upload failed: ${error.message}` } 
                };
            }

            // Remove the blob from updates as it shouldn't go to Firestore
            delete updates.newVideoBlob;
        }

        // Handle YouTube metadata updates
        if (updates.updateYouTubeMetadata && (updates.title || updates.description || updates.privacy)) {
            try {
                // Get current recording to check if it's a YouTube video
                const currentRecording = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
                
                if (currentRecording.success && currentRecording.data?.provider === 'youtube') {
                    console.log('Updating YouTube metadata...');
                    
                    const metadataUpdate = await this.recordingService.updateVideoMetadata(
                        currentRecording.data,
                        {
                            title: updates.title,
                            description: updates.description,
                            privacy: updates.privacy
                        }
                    );
                    
                    if (!metadataUpdate.success) {
                        console.warn('Failed to update YouTube metadata:', metadataUpdate.error);
                        // Continue with Firestore update anyway
                    } else {
                        console.log('YouTube metadata updated successfully');
                    }
                }
            } catch (error) {
                console.warn('Error updating YouTube metadata:', error);
                // Continue with Firestore update
            }
            
            delete updates.updateYouTubeMetadata;
        }

        // Add update timestamp
        updates.updated_at = new Date();

        return await this.updateSuiteAsset(suiteId, 'recordings', recordingId, updates, sprintId);
    }

    // FIXED: Subscribe to recordings with enhanced post-processing
    subscribeToRecordings(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recordings', (recordings) => {
            // Enhanced post-processing for real-time updates
            const processedRecordings = recordings.map(recording => {
                const videoUrl = recording.videoUrl || recording.url;
                return {
                    ...recording,
                    // Standardized fields
                    videoUrl,
                    url: videoUrl,
                    playbackUrl: this.recordingService.getPlaybackUrl(recording),
                    directUrl: this.recordingService.getVideoUrl(recording),
                    embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                        ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                        : videoUrl,
                    
                    // Computed fields
                    recordingInfo: this.recordingService.getRecordingInfo(recording),
                    isYouTube: recording.provider === 'youtube',
                    isFirebase: recording.provider === 'firebase',
                    
                    // Statistics
                    stats: {
                        totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                        consoleLogs: recording.consoleLogs?.length || 0,
                        networkLogs: recording.networkLogs?.length || 0,
                        detectedIssues: recording.detectedIssues?.length || 0,
                        comments: recording.comments?.length || 0
                    }
                };
            });
            callback(processedRecordings);
        }, errorCallback, sprintId);
    }

    // FIXED: Delete recording with enhanced cleanup
    async deleteRecording(recordingId, suiteId, sprintId = null) {
        if (!recordingId || !suiteId) {
            return { success: false, error: { message: 'Recording ID and Suite ID are required' } };
        }

        console.log('AssetService.deleteRecording called:', { recordingId, suiteId, sprintId });

        // Get recording data first for storage cleanup
        const recordingResult = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
        
        if (recordingResult.success && recordingResult.data) {
            // Try to delete from storage (YouTube or Firebase)
            try {
                console.log('Attempting to delete from storage...');
                const deleteResult = await this.recordingService.deleteRecording(recordingResult.data);
                if (deleteResult.success) {
                    console.log('Storage deletion successful');
                } else {
                    console.warn('Failed to delete video from storage:', deleteResult.error);
                    // Continue with Firestore deletion regardless
                }
            } catch (error) {
                console.warn('Error during storage deletion:', error);
                // Continue with Firestore deletion
            }
        }

        // Delete from Firestore
        console.log('Deleting from Firestore...');
        const firestoreResult = await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
        
        if (firestoreResult.success) {
            console.log('Recording deleted successfully');
        }
        
        return firestoreResult;
    }

    // FIXED: Get single recording with post-processing
    async getRecording(recordingId, suiteId, sprintId = null) {
        const result = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
        
        if (result.success && result.data) {
            const recording = result.data;
            const videoUrl = recording.videoUrl || recording.url;
            
            result.data = {
                ...recording,
                // Standardized URL fields
                videoUrl,
                url: videoUrl,
                playbackUrl: this.recordingService.getPlaybackUrl(recording),
                directUrl: this.recordingService.getVideoUrl(recording),
                embedUrl: recording.provider === 'youtube' && (recording.youtubeId || recording.videoId)
                    ? `https://www.youtube.com/embed/${recording.youtubeId || recording.videoId}`
                    : videoUrl,
                
                // Additional computed fields
                recordingInfo: this.recordingService.getRecordingInfo(recording),
                isYouTube: recording.provider === 'youtube',
                isFirebase: recording.provider === 'firebase',
                
                // Statistics
                stats: {
                    totalLogs: (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0),
                    consoleLogs: recording.consoleLogs?.length || 0,
                    networkLogs: recording.networkLogs?.length || 0,
                    detectedIssues: recording.detectedIssues?.length || 0,
                    comments: recording.comments?.length || 0
                }
            };
        }
        
        return result;
    }

    // NEW: Check recording service status
    async getRecordingServiceStatus() {
        return await this.recordingService.getServiceStatus();
    }

    // NEW: Test YouTube connection
    async testYouTubeConnection() {
        return await this.recordingService.testYouTubeConnection();
    }

    // NEW: Check YouTube availability (legacy method)
    async isYouTubeAvailable() {
        return await this.recordingService.isYouTubeAvailable();
    }

    // NEW: Get recording statistics
    async getRecordingStatistics(suiteId, sprintId = null) {
        const recordings = await this.getRecordings(suiteId, sprintId, {
            includeStatus: ['active', 'archived']
        });

        if (!recordings.success) {
            return recordings;
        }

        const stats = {
            total: recordings.data.length,
            byProvider: {},
            byStatus: {},
            totalSize: 0,
            totalDuration: 0,
            withIssues: 0,
            withComments: 0,
            averageLogs: 0
        };

        recordings.data.forEach(recording => {
            // Provider stats
            stats.byProvider[recording.provider] = (stats.byProvider[recording.provider] || 0) + 1;
            
            // Status stats
            stats.byStatus[recording.status] = (stats.byStatus[recording.status] || 0) + 1;
            
            // Size and duration
            stats.totalSize += recording.size || 0;
            stats.totalDuration += recording.duration || 0;
            
            // Issues and comments
            if (recording.detectedIssues?.length > 0) stats.withIssues++;
            if (recording.comments?.length > 0) stats.withComments++;
            
            // Logs
            stats.averageLogs += (recording.consoleLogs?.length || 0) + (recording.networkLogs?.length || 0);
        });

        if (recordings.data.length > 0) {
            stats.averageLogs = Math.round(stats.averageLogs / recordings.data.length);
        }

        return {
            success: true,
            data: stats
        };
    }

    // ========================
    // OTHER ASSET METHODS (unchanged)
    // ========================

    // Test Cases
    async createTestCase(suiteId, testCaseData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'testCases', testCaseData, sprintId);
    }

    async getTestCases(suiteId, sprintId = null, options = {}) {
        return await this.getSuiteAssets(suiteId, 'testCases', sprintId, options);
    }

    subscribeToTestCases(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'testCases', callback, errorCallback, sprintId);
    }

    async updateTestCase(testCaseId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'testCases', testCaseId, updates, sprintId);
    }

    async deleteTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    async getTestCase(testCaseId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'testCases', testCaseId, sprintId);
    }

    // Bugs
    async createBug(suiteId, bugData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'bugs', bugData, sprintId);
    }

    async getBugs(suiteId, sprintId = null, options = {}) {
        return await this.getSuiteAssets(suiteId, 'bugs', sprintId, options);
    }

    subscribeToBugs(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'bugs', callback, errorCallback, sprintId);
    }

    async updateBug(bugId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'bugs', bugId, updates, sprintId);
    }

    async deleteBug(bugId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    async getBug(bugId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'bugs', bugId, sprintId);
    }

    // Recommendations
    async createRecommendation(suiteId, recommendationData, sprintId = null) {
        return await this.createSuiteAsset(suiteId, 'recommendations', recommendationData, sprintId);
    }

    async getRecommendations(suiteId, sprintId = null, options = {}) {
        return await this.getSuiteAssets(suiteId, 'recommendations', sprintId, options);
    }

    subscribeToRecommendations(suiteId, callback, errorCallback = null, sprintId = null) {
        return this.subscribeToSuiteAssets(suiteId, 'recommendations', callback, errorCallback, sprintId);
    }

    async updateRecommendation(recommendationId, updates, suiteId, sprintId = null) {
        return await this.updateSuiteAsset(suiteId, 'recommendations', recommendationId, updates, sprintId);
    }

    async deleteRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.deleteSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    async getRecommendation(recommendationId, suiteId, sprintId = null) {
        return await this.getSuiteAsset(suiteId, 'recommendations', recommendationId, sprintId);
    }

    // Sprints
    async createSprint(suiteId, sprintData) {
        return await this.createSuiteAsset(suiteId, 'sprints', sprintData);
    }

    async getSprints(suiteId, options = {}) {
        return await this.getSuiteAssets(suiteId, 'sprints', null, options);
    }

    subscribeToSprints(suiteId, callback, errorCallback = null) {
        return this.subscribeToSuiteAssets(suiteId, 'sprints', callback, errorCallback);
    }

    async updateSprint(sprintId, updates, suiteId) {
        return await this.updateSuiteAsset(suiteId, 'sprints', sprintId, updates);
    }

    async deleteSprint(sprintId, suiteId) {
        return await this.deleteSuiteAsset(suiteId, 'sprints', sprintId);
    }

    async getSprint(sprintId, suiteId) {
        return await this.getSuiteAsset(suiteId, 'sprints', sprintId);
    }

    // Legacy batch methods (unchanged)
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