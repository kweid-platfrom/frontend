// YouTubeService.js - Fixed for server-side authentication
class YouTubeService {
    constructor() {
        this.clientId = process.env.REACT_APP_YOUTUBE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.REACT_APP_YOUTUBE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.REACT_APP_YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.initialized = false;
    }

    // Initialize service and get initial access token
    async initialize() {
        if (this.initialized && this.isTokenValid()) return;

        try {
            await this.refreshAccessToken();
            this.initialized = true;
            console.log('YouTube API initialized with server-side authentication');
        } catch (error) {
            console.error('Failed to initialize YouTube API:', error);
            throw new Error('YouTube API initialization failed: ' + error.message);
        }
    }

    // Check if current access token is valid
    isTokenValid() {
        return this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt;
    }

    // Refresh access token using refresh token
    async refreshAccessToken() {
        if (!this.clientId || !this.clientSecret || !this.refreshToken) {
            throw new Error('Missing required YouTube API credentials. Please check environment variables.');
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Token refresh failed: ${response.status} - ${errorData.error_description || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            // Set expiration time (usually 3600 seconds, but we'll be conservative)
            this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
            
            console.log('YouTube access token refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh YouTube access token:', error);
            throw error;
        }
    }

    // Ensure we have a valid access token
    async ensureValidToken() {
        if (!this.isTokenValid()) {
            await this.refreshAccessToken();
        }
    }

    // Upload video to YouTube with direct API calls
    async uploadVideo(videoBlob, metadata = {}) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const finalMetadata = {
                snippet: {
                    title: metadata.title || `Screen Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording uploaded from QA testing tool',
                    tags: metadata.tags || ['qa', 'testing', 'screen-recording'],
                    categoryId: metadata.categoryId || '28' // Science & Technology
                },
                status: {
                    privacyStatus: metadata.privacy || 'private',
                    selfDeclaredMadeForKids: false
                }
            };

            // Create form data for multipart upload
            const form = new FormData();
            form.append(
                "metadata",
                new Blob([JSON.stringify(finalMetadata)], { type: "application/json" })
            );
            form.append("video", videoBlob, `recording_${Date.now()}.webm`);

            const response = await fetch(
                "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    body: form,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle token expiration
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    // Retry once with new token
                    return this.uploadVideo(videoBlob, metadata);
                }
                
                throw new Error(errorData.error?.message || `Upload failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                data: {
                    videoId: result.id,
                    url: `https://www.youtube.com/watch?v=${result.id}`,
                    embedUrl: `https://www.youtube.com/embed/${result.id}`,
                    title: result.snippet.title,
                    description: result.snippet.description,
                    thumbnailUrl: result.snippet.thumbnails?.default?.url,
                    privacyStatus: result.status.privacyStatus
                }
            };
        } catch (error) {
            console.error("YouTube upload failed:", error);
            return {
                success: false,
                error: { 
                    message: error.message || "Failed to upload video",
                    code: error.code || 'UPLOAD_ERROR'
                },
            };
        }
    }

    // Upload with progress tracking using resumable upload
    async uploadVideoWithProgress(videoBlob, metadata = {}, onProgress = null) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            // Initiate resumable upload
            const uploadUrl = await this.initiateResumableUpload(videoBlob, metadata);
            
            // Perform chunked upload with progress tracking
            return await this.performResumableUpload(uploadUrl, videoBlob, onProgress);

        } catch (error) {
            console.error('YouTube upload with progress failed:', error);
            return {
                success: false,
                error: { 
                    message: error.message || "Failed to upload video with progress",
                    code: error.code || 'UPLOAD_PROGRESS_ERROR'
                }
            };
        }
    }

    // Initiate resumable upload session
    async initiateResumableUpload(videoBlob, metadata) {
        const finalMetadata = {
            snippet: {
                title: metadata.title || `Screen Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || 'Screen recording uploaded from QA testing tool',
                tags: metadata.tags || ['qa', 'testing', 'screen-recording'],
                categoryId: metadata.categoryId || '28'
            },
            status: {
                privacyStatus: metadata.privacy || 'private',
                selfDeclaredMadeForKids: false
            }
        };

        const response = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Length': videoBlob.size.toString(),
                    'X-Upload-Content-Type': videoBlob.type || 'video/webm'
                },
                body: JSON.stringify(finalMetadata)
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to initiate resumable upload: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const uploadUrl = response.headers.get('location');
        if (!uploadUrl) {
            throw new Error('No upload URL received from YouTube API');
        }

        return uploadUrl;
    }

    // Perform resumable upload with progress tracking
    async performResumableUpload(uploadUrl, videoBlob, onProgress) {
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalSize = videoBlob.size;
        let uploadedBytes = 0;

        while (uploadedBytes < totalSize) {
            const chunkEnd = Math.min(uploadedBytes + chunkSize, totalSize);
            const chunk = videoBlob.slice(uploadedBytes, chunkEnd);
            const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${totalSize}`;

            try {
                const response = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Length': chunk.size.toString(),
                        'Content-Range': contentRange
                    },
                    body: chunk
                });

                if (response.status === 308) {
                    // Resume incomplete - continue with next chunk
                    uploadedBytes = chunkEnd;
                    if (onProgress) {
                        onProgress(Math.round((uploadedBytes / totalSize) * 100));
                    }
                } else if (response.status === 200 || response.status === 201) {
                    // Upload complete
                    const result = await response.json();
                    if (onProgress) {
                        onProgress(100);
                    }

                    return {
                        success: true,
                        data: {
                            videoId: result.id,
                            url: `https://www.youtube.com/watch?v=${result.id}`,
                            embedUrl: `https://www.youtube.com/embed/${result.id}`,
                            title: result.snippet.title,
                            description: result.snippet.description,
                            thumbnailUrl: result.snippet.thumbnails?.default?.url,
                            privacyStatus: result.status.privacyStatus
                        }
                    };
                } else if (response.status === 401) {
                    // Token expired, refresh and retry
                    await this.refreshAccessToken();
                    return this.uploadVideoWithProgress(videoBlob, { title: 'Retrying upload' }, onProgress);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Upload failed at byte ${uploadedBytes}: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    // Network error, could retry chunk
                    console.warn(`Network error at byte ${uploadedBytes}, retrying chunk...`);
                    continue;
                }
                throw error;
            }
        }
    }

    // Get channel information
    async getChannelInfo() {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.getChannelInfo(); // Retry once
                }
                throw new Error(`Failed to get channel info: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data.items?.[0] || null
            };
        } catch (error) {
            console.error('Failed to get channel info:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Delete video
    async deleteVideo(videoId) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.deleteVideo(videoId); // Retry once
                }
                
                if (response.status === 404) {
                    return {
                        success: false,
                        error: { message: 'Video not found or already deleted' }
                    };
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to delete video: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            return {
                success: true,
                data: { message: 'Video deleted successfully' }
            };
        } catch (error) {
            console.error('Failed to delete video:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Update video metadata
    async updateVideo(videoId, metadata) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const updateData = {
                id: videoId,
                snippet: {
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags,
                    categoryId: metadata.categoryId || '28'
                }
            };

            if (metadata.privacy) {
                updateData.status = {
                    privacyStatus: metadata.privacy
                };
            }

            const parts = ['snippet'];
            if (metadata.privacy) parts.push('status');

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=${parts.join(',')}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.updateVideo(videoId, metadata); // Retry once
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update video: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Failed to update video:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Create playlist
    async createRecordingsPlaylist(title = 'QA Screen Recordings') {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const playlistData = {
                snippet: {
                    title: title,
                    description: 'Private playlist for QA testing screen recordings'
                },
                status: {
                    privacyStatus: 'private'
                }
            };

            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(playlistData)
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.createRecordingsPlaylist(title); // Retry once
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to create playlist: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                data: {
                    playlistId: result.id,
                    title: result.snippet.title,
                    url: `https://www.youtube.com/playlist?list=${result.id}`
                }
            };
        } catch (error) {
            console.error('Failed to create playlist:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Add video to playlist
    async addVideoToPlaylist(videoId, playlistId) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const playlistItemData = {
                snippet: {
                    playlistId: playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: videoId
                    }
                }
            };

            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(playlistItemData)
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.addVideoToPlaylist(videoId, playlistId); // Retry once
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to add video to playlist: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Failed to add video to playlist:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Check service availability
    async isAvailable() {
        try {
            await this.initialize();
            return true;
        } catch (error) {
            console.error('YouTube service not available:', error);
            return false;
        }
    }

    // Get service status
    getStatus() {
        return {
            initialized: this.initialized,
            hasValidToken: this.isTokenValid(),
            tokenExpiresAt: this.tokenExpiresAt,
            hasCredentials: !!(this.clientId && this.clientSecret && this.refreshToken)
        };
    }
}

// Create singleton instance
const youTubeService = new YouTubeService();
export default youTubeService;

// Alternative export for named imports
export { YouTubeService };