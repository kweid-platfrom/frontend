// lib/youtube-service.js - Fixed version with better error handling
export class SimplifiedYouTubeService {
    constructor() {
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized && this.isTokenValid()) return;

        // Validate credentials first
        this.validateCredentials();

        await this.refreshAccessToken();
        this.initialized = true;
    }

    validateCredentials() {
        const missing = [];
        if (!this.clientId) missing.push('YOUTUBE_CLIENT_ID');
        if (!this.clientSecret) missing.push('YOUTUBE_CLIENT_SECRET');
        if (!this.refreshToken) missing.push('YOUTUBE_REFRESH_TOKEN');

        if (missing.length > 0) {
            throw new Error(
                `Missing YouTube API credentials: ${missing.join(', ')}. ` +
                `Please add these to your .env.local file. ` +
                `Visit http://localhost:3000/api/auth/youtube to set up authentication.`
            );
        }

        // Basic validation of refresh token format
        if (!this.refreshToken.startsWith('1//')) {
            console.warn('⚠️ Refresh token format looks suspicious. Make sure you copied the entire token.');
        }
    }

    isTokenValid() {
        return this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt;
    }

    async refreshAccessToken() {
        console.log('🔄 Refreshing YouTube access token...');

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error('❌ Token refresh failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText
                });

                let errorMessage = `Token refresh failed: ${response.statusText}`;

                try {
                    const errorData = JSON.parse(responseText);

                    if (errorData?.error_description) {
                        errorMessage = errorData.error_description;
                    } else if (errorData?.error) {
                        errorMessage = errorData.error;
                    } else {
                        errorMessage = 'An unknown error occurred while processing your request.';
                    }
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError, responseText);
                    // Fallback to the message from the outer scope if available
                    if (!errorMessage) {
                        errorMessage = message || 'An unexpected error occurred.';
                    }
                }

                // Provide specific guidance based on error
                if (response.status === 400) {
                    if (responseText.includes('invalid_grant')) {
                        throw new Error(
                            'Invalid refresh token. Your token may have expired or been revoked. ' +
                            'Please re-authenticate: Visit http://localhost:3000/api/auth/youtube to get a new token.'
                        );
                    }
                    throw new Error(
                        `Bad Request: ${errorMessage}. ` +
                        'Check your CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN in .env.local'
                    );
                }

                throw new Error(errorMessage);
            }

            const data = JSON.parse(responseText);

            if (!data.access_token) {
                throw new Error('No access token in response');
            }

            this.accessToken = data.access_token;
            // Set expiry 60 seconds before actual expiry for safety
            this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);

            console.log('✅ Access token refreshed successfully. Expires at:', this.tokenExpiresAt);

        } catch (error) {
            console.error('❌ Token refresh error:', error);
            throw error;
        }
    }

    async ensureValidToken() {
        if (!this.isTokenValid()) {
            await this.refreshAccessToken();
        }
    }

    async uploadVideo(videoBlob, metadata = {}) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            console.log('📤 Starting YouTube upload:', {
                title: metadata.title,
                fileSize: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
                type: videoBlob.type
            });

            const finalMetadata = {
                snippet: {
                    title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording from QA testing tool',
                    tags: metadata.tags || ['qa', 'testing', 'screen-recording'],
                    categoryId: metadata.categoryId || '28'
                },
                status: {
                    privacyStatus: metadata.privacy || 'unlisted',
                    selfDeclaredMadeForKids: false
                }
            };

            const uploadResult = await this.performResumableUpload(videoBlob, finalMetadata);
            console.log('✅ Upload completed successfully');
            return uploadResult;

        } catch (error) {
            console.error('❌ Upload failed:', error);
            throw error;
        }
    }

    async performResumableUpload(videoBlob, metadata) {
        const uploadUrl = await this.initiateResumableUpload(videoBlob, metadata);

        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const totalSize = videoBlob.size;
        let uploadedBytes = 0;

        const arrayBuffer = await videoBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('📊 Upload progress: Starting chunked upload...');

        while (uploadedBytes < totalSize) {
            const chunkEnd = Math.min(uploadedBytes + chunkSize, totalSize);
            const chunk = buffer.slice(uploadedBytes, chunkEnd);
            const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${totalSize}`;

            console.log(`📊 Uploading chunk: ${contentRange}`);

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Length': chunk.length.toString(),
                    'Content-Range': contentRange
                },
                body: chunk
            });

            if (response.status === 308) {
                uploadedBytes = chunkEnd;
                const progress = ((uploadedBytes / totalSize) * 100).toFixed(1);
                console.log(`📊 Progress: ${progress}%`);
            } else if (response.status === 200 || response.status === 201) {
                const result = await response.json();

                console.log('✅ Upload complete. Video ID:', result.id);

                return {
                    success: true,
                    data: {
                        videoId: result.id,
                        youtubeId: result.id,
                        url: `https://www.youtube.com/watch?v=${result.id}`,
                        videoUrl: `https://www.youtube.com/watch?v=${result.id}`,
                        embedUrl: `https://www.youtube.com/embed/${result.id}`,
                        title: result.snippet.title,
                        description: result.snippet.description,
                        thumbnailUrl: result.snippet.thumbnails?.default?.url || result.snippet.thumbnails?.medium?.url,
                        privacyStatus: result.status.privacyStatus,
                        uploadedAt: new Date().toISOString(),
                        provider: 'youtube'
                    }
                };
            } else if (response.status === 401) {
                console.log('⚠️ Token expired during upload, refreshing...');
                await this.refreshAccessToken();
                throw new Error('Token expired during upload. Please retry the upload.');
            } else {
                const errorText = await response.text();
                console.error(`❌ Upload failed at byte ${uploadedBytes}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Upload failed at byte ${uploadedBytes}: ${response.status} - ${errorText}`);
            }
        }
    }

    async initiateResumableUpload(videoBlob, metadata) {
        console.log('🔄 Initiating resumable upload...');

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
                body: JSON.stringify(metadata)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to initiate upload:', {
                status: response.status,
                body: errorText
            });
            throw new Error(`Failed to initiate upload: ${response.status} - ${errorText}`);
        }

        const uploadUrl = response.headers.get('location');
        if (!uploadUrl) {
            throw new Error('No upload URL received from YouTube');
        }

        console.log('✅ Resumable upload initiated');
        return uploadUrl;
    }

    async deleteVideo(videoId) {
        await this.initialize();
        await this.ensureValidToken();

        console.log('🗑️ Deleting video:', videoId);

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
                throw new Error('Token expired during deletion, please retry');
            }

            if (response.status === 404) {
                console.warn('⚠️ Video not found or already deleted');
                return {
                    success: false,
                    error: { message: 'Video not found or already deleted' }
                };
            }

            const errorText = await response.text();
            throw new Error(`Failed to delete video: ${response.status} - ${errorText}`);
        }

        console.log('✅ Video deleted successfully');
        return {
            success: true,
            data: { message: 'Video deleted successfully' }
        };
    }

    async getServiceStatus() {
        try {
            this.validateCredentials();
            const hasCredentials = true;

            if (!this.isTokenValid()) {
                try {
                    await this.refreshAccessToken();
                } catch (error) {
                    return {
                        initialized: false,
                        hasValidToken: false,
                        tokenExpiresAt: null,
                        hasCredentials: true,
                        playlistsSupported: false,
                        error: error.message
                    };
                }
            }

            return {
                initialized: this.initialized,
                hasValidToken: this.isTokenValid(),
                tokenExpiresAt: this.tokenExpiresAt,
                hasCredentials,
                playlistsSupported: false
            };
        } catch (error) {
            return {
                initialized: false,
                hasValidToken: false,
                tokenExpiresAt: null,
                hasCredentials: false,
                playlistsSupported: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
export const youTubeService = new SimplifiedYouTubeService();