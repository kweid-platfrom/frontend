// lib/firebase/recordingService.js - Updated for fixed YouTube service
import { uploadBytes, getDownloadURL, ref as storageRef, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import YouTubeService from '../lib/YoutubeService';

const recordingService = new class RecordingService {
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
                    size: blob.size,
                    filename: filename
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

    // Check YouTube service availability
    async checkYouTubeAvailability() {
        try {
            const status = YouTubeService.getStatus();
            if (!status.hasCredentials) {
                console.warn('YouTube credentials not configured');
                return false;
            }
            
            return await youTubeService.isAvailable();
        } catch (error) {
            console.warn('YouTube service not available:', error);
            return false;
        }
    }

    // Main upload method with YouTube primary, Firebase fallback
    async uploadRecording(blob, metadata = {}, onProgress = null) {
        const filename = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webm`;
        
        // Validate inputs
        if (!blob || !(blob instanceof Blob)) {
            return {
                success: false,
                error: { message: 'Invalid video blob provided' }
            };
        }

        if (blob.size === 0) {
            return {
                success: false,
                error: { message: 'Empty video blob provided' }
            };
        }

        // Check YouTube availability first
        const youtubeAvailable = await this.checkYouTubeAvailability();
        
        if (youtubeAvailable) {
            try {
                console.log('Attempting YouTube upload...');
                
                // Try YouTube upload with progress tracking
                const youtubeResult = await youTubeService.uploadVideoWithProgress(
                    blob, 
                    {
                        title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                        description: metadata.description || 'Screen recording from QA testing',
                        privacy: metadata.privacy || 'private',
                        tags: ['qa-testing', 'screen-recording', ...(metadata.tags || [])],
                        categoryId: '28' // Science & Technology
                    },
                    onProgress
                );

                if (youtubeResult.success) {
                    console.log('YouTube upload successful');
                    return {
                        success: true,
                        data: {
                            ...youtubeResult.data,
                            provider: 'youtube',
                            filename,
                            videoId: youtubeResult.data.videoId,
                            youtubeId: youtubeResult.data.videoId, // Alias for compatibility
                            videoUrl: youtubeResult.data.url,
                            embedUrl: youtubeResult.data.embedUrl,
                            thumbnailUrl: youtubeResult.data.thumbnailUrl,
                            privacyStatus: youtubeResult.data.privacyStatus
                        }
                    };
                } else {
                    console.warn('YouTube upload failed, falling back to Firebase Storage:', youtubeResult.error);
                }
            } catch (error) {
                console.warn('YouTube upload error, falling back to Firebase Storage:', error);
            }
        } else {
            console.log('YouTube service not available, using Firebase Storage');
        }

        // Fallback to Firebase Storage
        console.log('Uploading to Firebase Storage...');
        if (onProgress) onProgress(0);
        
        const firebaseResult = await this.uploadToFirebaseStorage(blob, filename);
        
        if (onProgress) onProgress(100);

        if (firebaseResult.success) {
            console.log('Firebase Storage upload successful');
            return {
                success: true,
                data: {
                    url: firebaseResult.data.url,
                    videoUrl: firebaseResult.data.url, // Alias for compatibility
                    provider: 'firebase',
                    filename: firebaseResult.data.filename,
                    storagePath: firebaseResult.data.path,
                    size: firebaseResult.data.size
                }
            };
        }

        // Both methods failed
        console.error('Both YouTube and Firebase Storage uploads failed');
        return {
            success: false,
            error: { 
                message: 'Both YouTube and Firebase Storage uploads failed',
                details: {
                    youtube: youtubeAvailable ? 'Upload failed' : 'Service unavailable',
                    firebase: firebaseResult.error?.message || 'Upload failed'
                }
            }
        };
    }

    // Upload with retry logic
    async uploadRecordingWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 2) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Upload attempt ${attempt}/${maxRetries}`);
                
                const result = await this.uploadRecording(blob, metadata, (progress) => {
                    if (onProgress) {
                        // Adjust progress to account for multiple attempts
                        const attemptProgress = progress / maxRetries;
                        const totalProgress = ((attempt - 1) / maxRetries) * 100 + attemptProgress;
                        onProgress(Math.min(totalProgress, 100));
                    }
                });

                if (result.success) {
                    if (onProgress) onProgress(100);
                    return result;
                }

                lastError = result.error;
                
                if (attempt < maxRetries) {
                    console.log(`Upload attempt ${attempt} failed, retrying...`);
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
                
            } catch (error) {
                lastError = { message: error.message };
                console.error(`Upload attempt ${attempt} threw error:`, error);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
            }
        }

        return {
            success: false,
            error: {
                message: `All ${maxRetries} upload attempts failed`,
                lastError: lastError
            }
        };
    }

    // Delete recording from storage
    async deleteRecording(recordingData) {
        if (!recordingData) {
            return { success: false, error: { message: 'No recording data provided' } };
        }

        try {
            if (recordingData.provider === 'youtube' && (recordingData.videoId || recordingData.youtubeId)) {
                const videoId = recordingData.videoId || recordingData.youtubeId;
                console.log(`Deleting YouTube video: ${videoId}`);
                return await youTubeService.deleteVideo(videoId);
            } 
            
            if (recordingData.provider === 'firebase' && recordingData.storagePath) {
                console.log(`Deleting Firebase Storage file: ${recordingData.storagePath}`);
                return await this.deleteFromFirebaseStorage(recordingData.storagePath);
            }
            
            // Try to infer provider from available data
            if (recordingData.youtubeId || recordingData.videoId) {
                const videoId = recordingData.youtubeId || recordingData.videoId;
                console.log(`Attempting YouTube deletion for video: ${videoId}`);
                return await youTubeService.deleteVideo(videoId);
            }
            
            if (recordingData.storagePath) {
                console.log(`Attempting Firebase deletion for path: ${recordingData.storagePath}`);
                return await this.deleteFromFirebaseStorage(recordingData.storagePath);
            }

            return { 
                success: false, 
                error: { message: 'Could not determine storage provider or missing required data' } 
            };
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to delete recording' }
            };
        }
    }

    // Get playback URL (for embedded players if needed)
    getPlaybackUrl(recordingData) {
        if (!recordingData) return null;

        if (recordingData.provider === 'youtube' && (recordingData.videoId || recordingData.youtubeId)) {
            return `https://www.youtube.com/embed/${recordingData.videoId || recordingData.youtubeId}`;
        }
        
        return recordingData.url || recordingData.videoUrl;
    }

    // Get direct video URL
    getVideoUrl(recordingData) {
        if (!recordingData) return null;

        if (recordingData.provider === 'youtube' && (recordingData.videoId || recordingData.youtubeId)) {
            return `https://www.youtube.com/watch?v=${recordingData.videoId || recordingData.youtubeId}`;
        }
        
        return recordingData.url || recordingData.videoUrl;
    }

    // Check if YouTube is available and authenticated
    async isYouTubeAvailable() {
        return await this.checkYouTubeAvailability();
    }

    // Get service status
    async getServiceStatus() {
        const youtubeStatus = youTubeService.getStatus();
        
        return {
            youtube: {
                available: youtubeStatus.hasCredentials && youtubeStatus.initialized,
                initialized: youtubeStatus.initialized,
                hasValidToken: youtubeStatus.hasValidToken,
                hasCredentials: youtubeStatus.hasCredentials,
                tokenExpiresAt: youtubeStatus.tokenExpiresAt
            },
            firebase: {
                available: !!this.storage,
                configured: !!this.storage
            }
        };
    }

    // Test YouTube connection
    async testYouTubeConnection() {
        try {
            const channelResult = await youTubeService.getChannelInfo();
            return {
                success: channelResult.success,
                data: channelResult.success ? {
                    connected: true,
                    channelId: channelResult.data?.id,
                    channelTitle: channelResult.data?.snippet?.title,
                    subscriberCount: channelResult.data?.statistics?.subscriberCount
                } : null,
                error: channelResult.success ? null : channelResult.error
            };
        } catch (error) {
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Update video metadata
    async updateVideoMetadata(recordingData, metadata) {
        if (!recordingData || recordingData.provider !== 'youtube') {
            return {
                success: false,
                error: { message: 'Can only update metadata for YouTube videos' }
            };
        }

        const videoId = recordingData.videoId || recordingData.youtubeId;
        if (!videoId) {
            return {
                success: false,
                error: { message: 'No video ID found in recording data' }
            };
        }

        return await youTubeService.updateVideo(videoId, metadata);
    }

    // Create a playlist for recordings
    async createRecordingsPlaylist(title) {
        return await youTubeService.createRecordingsPlaylist(title);
    }

    // Add video to playlist
    async addVideoToPlaylist(recordingData, playlistId) {
        if (!recordingData || recordingData.provider !== 'youtube') {
            return {
                success: false,
                error: { message: 'Can only add YouTube videos to playlists' }
            };
        }

        const videoId = recordingData.videoId || recordingData.youtubeId;
        if (!videoId) {
            return {
                success: false,
                error: { message: 'No video ID found in recording data' }
            };
        }

        return await youTubeService.addVideoToPlaylist(videoId, playlistId);
    }

    // Get recording statistics/info
    getRecordingInfo(recordingData) {
        if (!recordingData) return null;

        const info = {
            provider: recordingData.provider,
            filename: recordingData.filename,
            size: recordingData.size,
            created: recordingData.created_at || recordingData.createdAt
        };

        if (recordingData.provider === 'youtube') {
            info.videoId = recordingData.videoId || recordingData.youtubeId;
            info.url = this.getVideoUrl(recordingData);
            info.embedUrl = this.getPlaybackUrl(recordingData);
            info.thumbnailUrl = recordingData.thumbnailUrl;
            info.privacyStatus = recordingData.privacyStatus;
        } else if (recordingData.provider === 'firebase') {
            info.url = recordingData.url || recordingData.videoUrl;
            info.storagePath = recordingData.storagePath;
        }

        return info;
    }

    // Validate recording data structure
    validateRecordingData(recordingData) {
        const errors = [];

        if (!recordingData) {
            errors.push('Recording data is required');
            return { valid: false, errors };
        }

        if (!recordingData.provider) {
            errors.push('Provider is required');
        }

        if (recordingData.provider === 'youtube') {
            if (!recordingData.videoId && !recordingData.youtubeId) {
                errors.push('YouTube video ID is required');
            }
        } else if (recordingData.provider === 'firebase') {
            if (!recordingData.url && !recordingData.videoUrl) {
                errors.push('Firebase storage URL is required');
            }
            if (!recordingData.storagePath) {
                errors.push('Firebase storage path is required');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default recordingService;
