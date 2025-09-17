// lib/firebase/recordingService.js
import { uploadBytes, getDownloadURL, ref as storageRef, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase'; // Your existing Firebase config
import youTubeService from '../lib/YoutubeService';

class RecordingService {
    constructor() {
        this.storage = storage;
    }

    // Upload blob to Firebase Storage (fallback if YouTube fails)
    async uploadToFirebaseStorage(blob, filename) {
        try {
            const storageReference = storageRef(this.storage, `recordings/${filename}`);
            const snapshot = await uploadBytes(storageReference, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return {
                success: true,
                data: {
                    url: downloadURL,
                    path: snapshot.ref.fullPath,
                    size: blob.size
                }
            };
        } catch (error) {
            console.error('Firebase storage upload failed:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Delete from Firebase Storage
    async deleteFromFirebaseStorage(path) {
        try {
            const fileRef = storageRef(this.storage, path);
            await deleteObject(fileRef);
            return { success: true };
        } catch (error) {
            console.error('Firebase storage delete failed:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Main upload method with YouTube primary, Firebase fallback
    async uploadRecording(blob, metadata = {}, onProgress = null) {
        const filename = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
        
        try {
            // Try YouTube first
            const youtubeResult = await youTubeService.uploadVideoWithProgress(
                blob, 
                {
                    title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording from QA testing',
                    privacy: 'private',
                    tags: ['qa-testing', 'screen-recording', ...(metadata.tags || [])]
                },
                onProgress
            );

            if (youtubeResult.success) {
                return {
                    success: true,
                    data: {
                        ...youtubeResult.data,
                        provider: 'youtube',
                        filename
                    }
                };
            } else {
                console.warn('YouTube upload failed, falling back to Firebase Storage:', youtubeResult.error);
            }
        } catch (error) {
            console.warn('YouTube upload error, falling back to Firebase Storage:', error);
        }

        // Fallback to Firebase Storage
        if (onProgress) onProgress(0);
        
        const firebaseResult = await this.uploadToFirebaseStorage(blob, filename);
        
        if (onProgress) onProgress(100);

        if (firebaseResult.success) {
            return {
                success: true,
                data: {
                    url: firebaseResult.data.url,
                    provider: 'firebase',
                    filename,
                    storagePath: firebaseResult.data.path,
                    size: firebaseResult.data.size
                }
            };
        }

        return {
            success: false,
            error: { message: 'Both YouTube and Firebase Storage uploads failed' }
        };
    }

    // Delete recording from storage
    async deleteRecording(recordingData) {
        if (recordingData.provider === 'youtube' && recordingData.videoId) {
            return await youTubeService.deleteVideo(recordingData.videoId);
        } else if (recordingData.provider === 'firebase' && recordingData.storagePath) {
            return await this.deleteFromFirebaseStorage(recordingData.storagePath);
        }
        
        return { success: false, error: { message: 'Unknown recording provider or missing data' } };
    }

    // Get playback URL (for embedded players if needed)
    getPlaybackUrl(recordingData) {
        if (recordingData.provider === 'youtube' && recordingData.videoId) {
            return `https://www.youtube.com/embed/${recordingData.videoId}`;
        }
        return recordingData.url;
    }

    // Check if YouTube is available
    async isYouTubeAvailable() {
        try {
            await youTubeService.initialize();
            return await youTubeService.isAuthenticated();
        } catch (error) {
            return false;
        }
    }
}

// Extended AssetService methods for recordings
export const RecordingExtensions = {
    // Override the createRecording method to handle video upload
    async createRecording(suiteId, recordingData, sprintId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'write');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to create recording in this test suite' } };
        }

        // Prepare recording data for Firestore (without the actual video blob)
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/recordings`
            : `testSuites/${suiteId}/recordings`;

        const data = this.addCommonFields({
            suite_id: suiteId,
            ...(sprintId && { sprint_id: sprintId }),
            title: recordingData.title || `Recording - ${new Date().toLocaleDateString()}`,
            description: recordingData.description || '',
            videoUrl: recordingData.videoUrl, // URL from YouTube or Firebase
            youtubeId: recordingData.youtubeId || null,
            provider: recordingData.provider || 'youtube',
            filename: recordingData.filename,
            duration: recordingData.duration,
            consoleLogs: recordingData.consoleLogs || [],
            networkLogs: recordingData.networkLogs || [],
            comments: recordingData.comments || [],
            detectedIssues: recordingData.detectedIssues || [],
            platform: recordingData.platform || navigator.userAgent,
            status: 'active',
            // Metadata
            metadata: {
                recordingStartTime: recordingData.recordingStartTime || new Date().toISOString(),
                recordingEndTime: recordingData.recordingEndTime || new Date().toISOString(),
                browserInfo: {
                    userAgent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                },
                totalLogs: (recordingData.consoleLogs?.length || 0) + (recordingData.networkLogs?.length || 0),
                issuesDetected: recordingData.detectedIssues?.length || 0
            }
        });

        return await this.createDocument(collectionPath, data);
    },

    // Get recordings with enhanced filtering
    async getRecordings(suiteId, sprintId = null, options = {}) {
        const userId = this.getCurrentUserId();
        if (!userId) {
            return { success: false, error: { message: 'User not authenticated' } };
        }

        const hasAccess = await this.testSuiteService.validateTestSuiteAccess(suiteId, 'read');
        if (!hasAccess) {
            return { success: false, error: { message: 'Insufficient permissions to access recordings in this test suite' } };
        }

        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/recordings`
            : `testSuites/${suiteId}/recordings`;

        // Build constraints based on options
        const constraints = [];

        if (options.includeStatus && options.includeStatus.length > 0) {
            constraints.push(['status', 'in', options.includeStatus]);
        } else if (options.excludeStatus && options.excludeStatus.length > 0) {
            // Default to active recordings if no specific status requested
            const activeStatuses = ['active', 'archived'].filter(s => !options.excludeStatus.includes(s));
            if (activeStatuses.length > 0) {
                constraints.push(['status', 'in', activeStatuses]);
            }
        } else {
            // Default to active recordings only
            constraints.push(['status', '==', 'active']);
        }

        // Date range filtering
        if (options.dateFrom) {
            constraints.push(['created_at', '>=', new Date(options.dateFrom)]);
        }
        if (options.dateTo) {
            constraints.push(['created_at', '<=', new Date(options.dateTo)]);
        }

        const result = await this.queryDocuments(
            collectionPath, 
            constraints, 
            options.orderBy || 'created_at',
            options.orderDirection || 'desc'
        );

        // Post-process recordings to include playback URLs
        if (result.success && result.data) {
            const recordingService = new RecordingService();
            result.data = result.data.map(recording => ({
                ...recording,
                playbackUrl: recordingService.getPlaybackUrl(recording),
                embedUrl: recording.provider === 'youtube' && recording.youtubeId 
                    ? `https://www.youtube.com/embed/${recording.youtubeId}`
                    : recording.videoUrl
            }));
        }

        return result;
    },

    // Enhanced update recording with video management
    async updateRecording(recordingId, updates, suiteId, sprintId = null) {
        console.log('AssetService.updateRecording called with:', {
            recordingId,
            updates: typeof updates === 'object' ? Object.keys(updates) : updates,
            suiteId,
            sprintId
        });

        // Validate parameters
        if (!recordingId || typeof recordingId !== 'string') {
            return { success: false, error: { message: 'Invalid recording ID provided' } };
        }

        if (!updates || typeof updates !== 'object' || updates === null) {
            return { success: false, error: { message: 'Invalid updates provided' } };
        }

        if (!suiteId || typeof suiteId !== 'string') {
            return { success: false, error: { message: 'Invalid suite ID provided' } };
        }

        // Handle video URL updates if new video is being uploaded
        if (updates.newVideoBlob) {
            const recordingService = new RecordingService();
            const uploadResult = await recordingService.uploadRecording(
                updates.newVideoBlob,
                {
                    title: updates.title,
                    description: updates.description
                }
            );

            if (uploadResult.success) {
                updates.videoUrl = uploadResult.data.url;
                updates.youtubeId = uploadResult.data.videoId;
                updates.provider = uploadResult.data.provider;
                updates.filename = uploadResult.data.filename;
            }

            // Remove the blob from updates as it shouldn't go to Firestore
            delete updates.newVideoBlob;
        }

        return await this.updateSuiteAsset(suiteId, 'recordings', recordingId, updates, sprintId);
    },

    // Enhanced delete recording with storage cleanup
    async deleteRecording(recordingId, suiteId, sprintId = null) {
        // Get the recording first to access storage info
        const recordingResult = await this.getSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
        
        if (recordingResult.success && recordingResult.data) {
            const recordingService = new RecordingService();
            
            // Try to delete from storage (YouTube or Firebase)
            const deleteResult = await recordingService.deleteRecording(recordingResult.data);
            if (!deleteResult.success) {
                console.warn('Failed to delete video from storage:', deleteResult.error);
                // Continue with Firestore deletion even if storage deletion fails
            }
        }

        // Delete from Firestore
        return await this.deleteSuiteAsset(suiteId, 'recordings', recordingId, sprintId);
    }
};

// Export the recording service for direct use
const recordingService = new RecordingService();
export default recordingService;
export { RecordingService };