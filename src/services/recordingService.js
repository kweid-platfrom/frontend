// lib/firebase/recordingService.js - YouTube Only Implementation
import youTubeService from '../lib/YoutubeService';

const recordingService = new class RecordingService {
    constructor() {
        // Debug environment variables
        console.log('Environment check:', {
            nodeEnv: process.env.NODE_ENV,
            allEnvVars: Object.keys(process.env).filter(key => key.includes('YOUTUBE')),
            reactAppClientId: process.env.REACT_APP_YOUTUBE_CLIENT_ID?.substring(0, 10) + '...',
            reactAppSecret: process.env.REACT_APP_YOUTUBE_CLIENT_SECRET?.substring(0, 10) + '...',
            reactAppRefresh: process.env.REACT_APP_YOUTUBE_REFRESH_TOKEN?.substring(0, 10) + '...',
            nodeClientId: process.env.YOUTUBE_CLIENT_ID?.substring(0, 10) + '...',
            nodeSecret: process.env.YOUTUBE_CLIENT_SECRET?.substring(0, 10) + '...',
            nodeRefresh: process.env.YOUTUBE_REFRESH_TOKEN?.substring(0, 10) + '...'
        });

        this.clientId = process.env.REACT_APP_YOUTUBE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.REACT_APP_YOUTUBE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.REACT_APP_YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN;

        console.log('Final credentials:', {
            hasClientId: !!this.clientId,
            hasClientSecret: !!this.clientSecret,
            hasRefreshToken: !!this.refreshToken,
            clientIdPrefix: this.clientId?.substring(0, 10) + '...'
        });

        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.initialized = false;
    }

    // Check YouTube service availability
    async checkYouTubeAvailability() {
        try {
            const status = youTubeService.getStatus();
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

    // Main upload method - YouTube only
    async uploadToYouTube(blob, metadata = {}, onProgress = null) {
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

        // Check YouTube availability
        const youtubeAvailable = await this.checkYouTubeAvailability();

        if (!youtubeAvailable) {
            return {
                success: false,
                error: { message: 'YouTube service is not available or not configured' }
            };
        }

        try {
            console.log('Uploading to YouTube...');

            // Upload to YouTube with progress tracking
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
                        videoId: youtubeResult.data.videoId,
                        url: youtubeResult.data.url,
                        embedUrl: youtubeResult.data.embedUrl,
                        thumbnailUrl: youtubeResult.data.thumbnailUrl,
                        privacyStatus: youtubeResult.data.privacyStatus,
                        uploadedAt: new Date().toISOString()
                    }
                };
            } else {
                console.error('YouTube upload failed:', youtubeResult.error);
                return {
                    success: false,
                    error: youtubeResult.error || { message: 'YouTube upload failed' }
                };
            }
        } catch (error) {
            console.error('YouTube upload error:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to upload to YouTube' }
            };
        }
    }

    // Upload with retry logic
    async uploadToYouTubeWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 3) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Upload attempt ${attempt}/${maxRetries}`);

                const result = await this.uploadToYouTube(blob, metadata, (progress) => {
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

    // Delete recording from YouTube
    async deleteRecording(recordingData) {
        if (!recordingData) {
            return { success: false, error: { message: 'No recording data provided' } };
        }

        try {
            const videoId = recordingData.youtubeId || recordingData.videoId;
            if (!videoId) {
                return {
                    success: false,
                    error: { message: 'No YouTube video ID found in recording data' }
                };
            }

            console.log(`Deleting YouTube video: ${videoId}`);
            return await youTubeService.deleteVideo(videoId);

        } catch (error) {
            console.error('Error deleting YouTube video:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to delete YouTube video' }
            };
        }
    }

    // Get YouTube embed URL
    getEmbedUrl(recordingData) {
        if (!recordingData) return null;

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    }

    // Get YouTube watch URL
    getWatchUrl(recordingData) {
        if (!recordingData) return null;

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
        }

        return recordingData.videoUrl;
    }

    // Get video URL (alias for compatibility)
    getVideoUrl(recordingData) {
        return this.getWatchUrl(recordingData);
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

    // Update video metadata on YouTube
    async updateVideoMetadata(recordingData, metadata) {
        if (!recordingData) {
            return {
                success: false,
                error: { message: 'No recording data provided' }
            };
        }

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (!videoId) {
            return {
                success: false,
                error: { message: 'No YouTube video ID found in recording data' }
            };
        }

        try {
            return await youTubeService.updateVideo(videoId, metadata);
        } catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to update video metadata' }
            };
        }
    }

    // Create a playlist for recordings
    async createRecordingsPlaylist(title) {
        try {
            return await youTubeService.createRecordingsPlaylist(title);
        } catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to create playlist' }
            };
        }
    }

    // Add video to playlist
    async addVideoToPlaylist(recordingData, playlistId) {
        if (!recordingData) {
            return {
                success: false,
                error: { message: 'No recording data provided' }
            };
        }

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (!videoId) {
            return {
                success: false,
                error: { message: 'No YouTube video ID found in recording data' }
            };
        }

        try {
            return await youTubeService.addVideoToPlaylist(videoId, playlistId);
        } catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to add video to playlist' }
            };
        }
    }

    // Get recording info
    getRecordingInfo(recordingData) {
        if (!recordingData) return null;

        const videoId = recordingData.youtubeId || recordingData.videoId;

        return {
            provider: 'youtube',
            videoId: videoId,
            url: this.getWatchUrl(recordingData),
            embedUrl: this.getEmbedUrl(recordingData),
            thumbnailUrl: recordingData.thumbnailUrl,
            privacyStatus: recordingData.privacyStatus || 'private',
            uploadedAt: recordingData.uploadedAt || recordingData.recordedAt,
            title: recordingData.title,
            description: recordingData.description
        };
    }

    // Validate recording data structure
    validateRecordingData(recordingData) {
        const errors = [];

        if (!recordingData) {
            errors.push('Recording data is required');
            return { valid: false, errors };
        }

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (!videoId) {
            errors.push('YouTube video ID is required');
        }

        if (!recordingData.videoUrl && !videoId) {
            errors.push('Either videoUrl or YouTube video ID is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Get video statistics from YouTube
    async getVideoStatistics(recordingData) {
        if (!recordingData) {
            return { success: false, error: { message: 'No recording data provided' } };
        }

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (!videoId) {
            return { success: false, error: { message: 'No YouTube video ID found' } };
        }

        try {
            return await youTubeService.getVideoStatistics(videoId);
        } catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to get video statistics' }
            };
        }
    }

    // Check if video exists on YouTube
    async checkVideoExists(recordingData) {
        if (!recordingData) {
            return { success: false, exists: false };
        }

        const videoId = recordingData.youtubeId || recordingData.videoId;
        if (!videoId) {
            return { success: false, exists: false };
        }

        try {
            const result = await youTubeService.getVideoDetails(videoId);
            return {
                success: true,
                exists: result.success,
                data: result.success ? result.data : null
            };
        } catch (error) {
            return {
                success: false,
                exists: false,
                error: { message: error.message }
            };
        }
    }
}();

export default recordingService;