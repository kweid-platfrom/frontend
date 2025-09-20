// lib/recordingService.js - API-based implementation
const recordingService = new class RecordingService {
    constructor() {
        this.apiBaseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com/api' 
            : '/api';
    }

    // Upload to YouTube via backend API
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

        try {
            console.log('Uploading to YouTube via API...');

            // Create form data
            const formData = new FormData();
            formData.append('video', blob, `recording_${Date.now()}.webm`);
            formData.append('metadata', JSON.stringify({
                title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || 'Screen recording from QA testing',
                tags: metadata.tags || ['qa-testing', 'screen-recording'],
                privacy: metadata.privacy || 'private',
                categoryId: metadata.categoryId || '28'
            }));

            // Create AbortController for request cancellation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

            const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('API YouTube upload successful');
                
                // Simulate progress completion if callback provided
                if (onProgress) {
                    onProgress(100);
                }

                return {
                    success: true,
                    data: {
                        videoId: result.data.videoId,
                        youtubeId: result.data.youtubeId,
                        url: result.data.url,
                        videoUrl: result.data.videoUrl,
                        embedUrl: result.data.embedUrl,
                        thumbnailUrl: result.data.thumbnailUrl,
                        privacyStatus: result.data.privacyStatus,
                        provider: 'youtube',
                        uploadedAt: result.data.uploadedAt || new Date().toISOString()
                    }
                };
            } else {
                console.error('API YouTube upload failed:', result.error);
                return {
                    success: false,
                    error: result.error || { message: 'API upload failed' }
                };
            }

        } catch (error) {
            console.error('YouTube API upload error:', error);
            
            // Handle specific error types
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: { message: 'Upload timeout - please try again with a smaller file' }
                };
            }

            return {
                success: false,
                error: { message: error.message || 'Failed to upload to YouTube via API' }
            };
        }
    }

    // Upload with retry logic
    async uploadToYouTubeWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`API upload attempt ${attempt}/${maxRetries}`);
                
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
                    console.log(`API upload attempt ${attempt} failed, retrying...`);
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
                
            } catch (error) {
                lastError = { message: error.message };
                console.error(`API upload attempt ${attempt} threw error:`, error);
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
            }
        }

        return {
            success: false,
            error: {
                message: `All ${maxRetries} API upload attempts failed`,
                lastError: lastError
            }
        };
    }

    // Delete recording from YouTube via API
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

            console.log(`Deleting YouTube video via API: ${videoId}`);

            const response = await fetch(`${this.apiBaseUrl}/recordings/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId,
                    recordingData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Delete failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('API YouTube deletion successful');
                return result;
            } else {
                console.error('API YouTube deletion failed:', result.error);
                return result;
            }
            
        } catch (error) {
            console.error('Error deleting YouTube video via API:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to delete YouTube video via API' }
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

    // Get playback URL for embedded players
    getPlaybackUrl(recordingData) {
        return this.getEmbedUrl(recordingData) || this.getVideoUrl(recordingData);
    }

    // Check if YouTube API is available via backend
    async isYouTubeAvailable() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.success && result.data?.hasCredentials;
            }
            
            return false;
        } catch (error) {
            console.warn('Error checking YouTube API availability:', error);
            return false;
        }
    }

    // Get service status from backend
    async getServiceStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
                method: 'GET'
            });
            
            if (response.ok) {
                const result = await response.json();
                return {
                    youtube: {
                        available: result.success && result.data?.hasCredentials,
                        initialized: result.data?.initialized || false,
                        hasValidToken: result.data?.hasValidToken || false,
                        hasCredentials: result.data?.hasCredentials || false,
                        tokenExpiresAt: result.data?.tokenExpiresAt,
                        environment: result.data?.environment
                    }
                };
            }
            
            return {
                youtube: {
                    available: false,
                    initialized: false,
                    hasValidToken: false,
                    hasCredentials: false
                }
            };
        } catch (error) {
            console.error('Error getting service status:', error);
            return {
                youtube: {
                    available: false,
                    initialized: false,
                    hasValidToken: false,
                    hasCredentials: false,
                    error: error.message
                }
            };
        }
    }

    // Test connection to backend API
    async testConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
                method: 'GET'
            });
            
            const result = await response.json();
            return {
                success: response.ok,
                data: result.success ? {
                    connected: true,
                    service: result.data?.service,
                    environment: result.data?.environment,
                    hasCredentials: result.data?.hasCredentials,
                    timestamp: result.data?.timestamp
                } : null,
                error: result.success ? null : result.error
            };
        } catch (error) {
            return {
                success: false,
                error: { message: error.message }
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
            playbackUrl: this.getPlaybackUrl(recordingData),
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

    // Check if video exists (would require additional API endpoint)
    async checkVideoExists(recordingData) {
        // This would require implementing a backend endpoint to check video existence
        // For now, return a basic validation
        const validation = this.validateRecordingData(recordingData);
        return { 
            success: validation.valid, 
            exists: validation.valid,
            data: validation.valid ? recordingData : null
        };
    }

    // API health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/upload`, {
                method: 'GET'
            });
            
            return {
                success: response.ok,
                status: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}();

export default recordingService;