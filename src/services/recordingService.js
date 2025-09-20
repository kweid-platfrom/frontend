// lib/recordingService.js - Enhanced implementation with playlist support
const recordingService = new class RecordingService {
    constructor() {
        this.apiBaseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://your-domain.com/api' 
            : '/api';
    }

    // Create or get playlist for test suite
    async createPlaylistForSuite(suiteId, suiteName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/playlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    suiteId,
                    title: `${suiteName} - Test Recordings`,
                    description: `Automated test recordings for ${suiteName}`,
                    privacy: 'private'
                })
            });

            if (!response.ok) {
                throw new Error(`Playlist creation failed: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to create playlist:', error);
            return { success: false, error: { message: error.message } };
        }
    }

    // Upload to YouTube with playlist assignment
    async uploadToYouTube(blob, metadata = {}, onProgress = null) {
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

            // Create playlist for suite if needed
            let playlistResult = null;
            if (metadata.suiteId && metadata.suiteName) {
                playlistResult = await this.createPlaylistForSuite(metadata.suiteId, metadata.suiteName);
                if (!playlistResult.success) {
                    console.warn('Failed to create playlist, continuing without it:', playlistResult.error);
                }
            }

            // Create form data with enhanced metadata
            const formData = new FormData();
            formData.append('video', blob, `recording_${Date.now()}.webm`);
            formData.append('metadata', JSON.stringify({
                title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || 'Screen recording from QA testing',
                tags: metadata.tags || ['qa-testing', 'screen-recording'],
                privacy: metadata.privacy || 'private',
                categoryId: metadata.categoryId || '28',
                playlistId: playlistResult?.data?.playlistId || null,
                suiteId: metadata.suiteId,
                suiteName: metadata.suiteName
            }));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

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
                console.log('YouTube upload successful with video ID:', result.data.videoId);
                
                if (onProgress) {
                    onProgress(100);
                }

                return {
                    success: true,
                    data: {
                        videoId: result.data.videoId,
                        youtubeId: result.data.videoId,
                        url: result.data.url,
                        videoUrl: result.data.url,
                        embedUrl: result.data.embedUrl,
                        thumbnailUrl: result.data.thumbnailUrl,
                        privacyStatus: result.data.privacyStatus,
                        playlistId: result.data.playlistId,
                        provider: 'youtube',
                        uploadedAt: result.data.uploadedAt || new Date().toISOString()
                    }
                };
            } else {
                console.error('YouTube upload failed:', result.error);
                return {
                    success: false,
                    error: result.error || { message: 'Upload failed' }
                };
            }

        } catch (error) {
            console.error('YouTube upload error:', error);
            
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: { message: 'Upload timeout - please try again with a smaller file' }
                };
            }

            return {
                success: false,
                error: { message: error.message || 'Failed to upload to YouTube' }
            };
        }
    }

    // Get video duration properly
    async getVideoDuration(blob) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                const duration = video.duration;
                URL.revokeObjectURL(video.src);
                resolve(isFinite(duration) ? duration : 0);
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve(0);
            };
            
            video.src = URL.createObjectURL(blob);
        });
    }

    // Enhanced upload with retry and better error handling
    async uploadToYouTubeWithRetry(blob, metadata = {}, onProgress = null, maxRetries = 3) {
        let lastError = null;
        
        // Get actual video duration
        const videoDuration = await this.getVideoDuration(blob);
        metadata.duration = videoDuration;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Upload attempt ${attempt}/${maxRetries} - File size: ${blob.size} bytes, Duration: ${videoDuration}s`);
                
                const result = await this.uploadToYouTube(blob, metadata, (progress) => {
                    if (onProgress) {
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
                    console.log(`Upload attempt ${attempt} failed, retrying in ${Math.pow(2, attempt - 1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
                
            } catch (error) {
                lastError = { message: error.message };
                console.error(`Upload attempt ${attempt} error:`, error);
                
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

    // Get playlist info
    async getPlaylistForSuite(suiteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/playlist?suiteId=${suiteId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                return { success: false, error: { message: 'Failed to get playlist' } };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            return { success: false, error: { message: error.message } };
        }
    }

    // List recordings for suite
    async getRecordingsForSuite(suiteId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings?suiteId=${suiteId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                return { success: false, error: { message: 'Failed to get recordings' } };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            return { success: false, error: { message: error.message } };
        }
    }

    // Delete recording and remove from playlist
    async deleteRecording(recordingData) {
        if (!recordingData) {
            return { success: false, error: { message: 'No recording data provided' } };
        }

        try {
            const videoId = recordingData.youtubeId || recordingData.videoId;
            if (!videoId) {
                return { 
                    success: false, 
                    error: { message: 'No YouTube video ID found' } 
                };
            }

            console.log(`Deleting YouTube video: ${videoId}`);

            const response = await fetch(`${this.apiBaseUrl}/recordings/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId,
                    playlistId: recordingData.playlistId,
                    recordingData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Delete failed: ${response.status}`);
            }

            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Error deleting recording:', error);
            return {
                success: false,
                error: { message: error.message || 'Failed to delete recording' }
            };
        }
    }

    // Format duration properly
    formatDuration(seconds) {
        if (!isFinite(seconds) || seconds < 0) return "0:00";
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Validate video blob
    async validateVideoBlob(blob) {
        const errors = [];
        
        if (!blob) {
            errors.push('No video blob provided');
            return { valid: false, errors };
        }
        
        if (!(blob instanceof Blob)) {
            errors.push('Invalid blob object');
            return { valid: false, errors };
        }
        
        if (blob.size === 0) {
            errors.push('Empty video file');
            return { valid: false, errors };
        }
        
        if (blob.size > 128 * 1024 * 1024) { // 128MB limit
            errors.push('Video file too large (>128MB)');
            return { valid: false, errors };
        }
        
        // Get duration
        const duration = await this.getVideoDuration(blob);
        if (duration === 0) {
            errors.push('Invalid or corrupted video file');
            return { valid: false, errors, duration };
        }
        
        return { 
            valid: errors.length === 0, 
            errors, 
            duration,
            size: blob.size,
            type: blob.type 
        };
    }

    // Enhanced service status
    async getServiceStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/recordings/status`, {
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
                        environment: result.data?.environment,
                        playlistsSupported: result.data?.playlistsSupported || false
                    }
                };
            }
            
            return {
                youtube: {
                    available: false,
                    initialized: false,
                    hasValidToken: false,
                    hasCredentials: false,
                    playlistsSupported: false
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
                    playlistsSupported: false,
                    error: error.message
                }
            };
        }
    }
}();

export default recordingService;