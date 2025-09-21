// lib/youtube-service.js - Shared YouTube service
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
        await this.refreshAccessToken();
        this.initialized = true;
    }

    isTokenValid() {
        return this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt;
    }

    async refreshAccessToken() {
        if (!this.clientId || !this.clientSecret || !this.refreshToken) {
            throw new Error('Missing YouTube API credentials');
        }

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

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
    }

    async ensureValidToken() {
        if (!this.isTokenValid()) {
            await this.refreshAccessToken();
        }
    }

    async uploadVideo(videoBlob, metadata = {}) {
        await this.initialize();
        await this.ensureValidToken();

        console.log('Starting YouTube upload with metadata:', {
            title: metadata.title,
            fileSize: videoBlob.size
        });

        const finalMetadata = {
            snippet: {
                title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                description: metadata.description || 'Screen recording from QA testing tool',
                tags: metadata.tags || ['qa', 'testing', 'screen-recording'],
                categoryId: metadata.categoryId || '28'
            },
            status: {
                privacyStatus: metadata.privacy || 'private',
                selfDeclaredMadeForKids: false
            }
        };

        const uploadResult = await this.performResumableUpload(videoBlob, finalMetadata);
        return uploadResult;
    }

    async performResumableUpload(videoBlob, metadata) {
        const uploadUrl = await this.initiateResumableUpload(videoBlob, metadata);
        
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalSize = videoBlob.size;
        let uploadedBytes = 0;

        const arrayBuffer = await videoBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        while (uploadedBytes < totalSize) {
            const chunkEnd = Math.min(uploadedBytes + chunkSize, totalSize);
            const chunk = buffer.slice(uploadedBytes, chunkEnd);
            const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${totalSize}`;

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
            } else if (response.status === 200 || response.status === 201) {
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
                        privacyStatus: result.status.privacyStatus,
                        uploadedAt: new Date().toISOString(),
                        provider: 'youtube'
                    }
                };
            } else if (response.status === 401) {
                await this.refreshAccessToken();
                throw new Error('Token expired during upload, please retry');
            } else {
                throw new Error(`Upload failed at byte ${uploadedBytes}: ${response.status}`);
            }
        }
    }

    async initiateResumableUpload(videoBlob, metadata) {
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
            throw new Error(`Failed to initiate upload: ${response.status}`);
        }

        const uploadUrl = response.headers.get('location');
        if (!uploadUrl) {
            throw new Error('No upload URL received');
        }

        return uploadUrl;
    }

    async deleteVideo(videoId) {
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
                throw new Error('Token expired during deletion, please retry');
            }
            
            if (response.status === 404) {
                return {
                    success: false,
                    error: { message: 'Video not found or already deleted' }
                };
            }

            throw new Error(`Failed to delete video: ${response.status}`);
        }

        return {
            success: true,
            data: { message: 'Video deleted successfully' }
        };
    }

    async getServiceStatus() {
        return {
            initialized: this.initialized,
            hasValidToken: this.isTokenValid(),
            tokenExpiresAt: this.tokenExpiresAt,
            hasCredentials: !!(this.clientId && this.clientSecret && this.refreshToken),
            playlistsSupported: false
        };
    }
}

// Export singleton instance
export const youTubeService = new SimplifiedYouTubeService();