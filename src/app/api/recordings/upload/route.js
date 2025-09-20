// app/api/recordings/upload/route.js - Enhanced with playlist support
import { NextRequest, NextResponse } from 'next/server';

class EnhancedYouTubeService {
    constructor() {
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.initialized = false;
        
        // Cache for playlists to avoid recreating
        this.playlistCache = new Map();
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
            const error = await response.json().catch(() => ({}));
            throw new Error(`Token refresh failed: ${error.error_description || response.statusText}`);
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

    // Create or get playlist for test suite
    async createOrGetPlaylist(suiteId, title, description = '') {
        const cacheKey = `suite_${suiteId}`;
        
        // Check cache first
        if (this.playlistCache.has(cacheKey)) {
            const cached = this.playlistCache.get(cacheKey);
            // Verify playlist still exists
            const exists = await this.verifyPlaylistExists(cached.id);
            if (exists) {
                return { success: true, data: cached };
            } else {
                this.playlistCache.delete(cacheKey);
            }
        }

        await this.ensureValidToken();

        try {
            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        snippet: {
                            title: title,
                            description: description
                        },
                        status: {
                            privacyStatus: 'private'
                        }
                    })
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.createOrGetPlaylist(suiteId, title, description);
                }
                
                const error = await response.json().catch(() => ({}));
                throw new Error(`Playlist creation failed: ${error.error?.message || response.statusText}`);
            }

            const playlist = await response.json();
            const playlistData = {
                id: playlist.id,
                title: playlist.snippet.title,
                description: playlist.snippet.description,
                url: `https://www.youtube.com/playlist?list=${playlist.id}`,
                createdAt: new Date().toISOString()
            };

            // Cache the playlist
            this.playlistCache.set(cacheKey, playlistData);

            return {
                success: true,
                data: playlistData
            };

        } catch (error) {
            console.error('Playlist creation error:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Verify playlist exists
    async verifyPlaylistExists(playlistId) {
        try {
            await this.ensureValidToken();
            
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?part=id&id=${playlistId}`,
                {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data.items && data.items.length > 0;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    // Add video to playlist
    async addVideoToPlaylist(videoId, playlistId) {
        if (!playlistId) return { success: true }; // Skip if no playlist

        try {
            await this.ensureValidToken();

            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        snippet: {
                            playlistId: playlistId,
                            resourceId: {
                                kind: 'youtube#video',
                                videoId: videoId
                            }
                        }
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`Failed to add video to playlist: ${error.error?.message || response.statusText}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Error adding video to playlist:', error);
            // Don't fail the entire upload if playlist addition fails
            return { success: false, error: error.message };
        }
    }

    // Enhanced upload with playlist support
    async uploadVideoWithProgress(videoBlob, metadata = {}) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            console.log('Starting YouTube upload with metadata:', {
                title: metadata.title,
                suiteId: metadata.suiteId,
                playlistId: metadata.playlistId,
                fileSize: videoBlob.size
            });

            // Create playlist if needed
            let playlistData = null;
            if (metadata.suiteId && metadata.suiteName) {
                const playlistResult = await this.createOrGetPlaylist(
                    metadata.suiteId,
                    `${metadata.suiteName} - Test Recordings`,
                    `Automated test recordings for test suite: ${metadata.suiteName}`
                );
                
                if (playlistResult.success) {
                    playlistData = playlistResult.data;
                } else {
                    console.warn('Failed to create/get playlist:', playlistResult.error);
                }
            }

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

            // Upload video
            const uploadResult = await this.performResumableUpload(videoBlob, finalMetadata);
            
            if (!uploadResult.success) {
                return uploadResult;
            }

            const videoId = uploadResult.data.videoId;

            // Add to playlist if available
            if (playlistData) {
                const playlistResult = await this.addVideoToPlaylist(videoId, playlistData.id);
                if (!playlistResult.success) {
                    console.warn('Failed to add video to playlist:', playlistResult.error);
                }
            }

            // Return enhanced result
            return {
                success: true,
                data: {
                    ...uploadResult.data,
                    playlistId: playlistData?.id || null,
                    playlistUrl: playlistData?.url || null
                }
            };

        } catch (error) {
            console.error('YouTube upload failed:', error);
            return {
                success: false,
                error: { 
                    message: error.message || "Upload failed",
                    code: error.code || 'UPLOAD_ERROR'
                }
            };
        }
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
                        uploadedAt: new Date().toISOString()
                    }
                };
            } else if (response.status === 401) {
                await this.refreshAccessToken();
                throw new Error('Token expired during upload, please retry');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Upload failed at byte ${uploadedBytes}: ${response.status} - ${errorData.error?.message || response.statusText}`);
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to initiate upload: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const uploadUrl = response.headers.get('location');
        if (!uploadUrl) {
            throw new Error('No upload URL received');
        }

        return uploadUrl;
    }

    async getServiceStatus() {
        return {
            initialized: this.initialized,
            hasValidToken: this.isTokenValid(),
            tokenExpiresAt: this.tokenExpiresAt,
            hasCredentials: !!(this.clientId && this.clientSecret && this.refreshToken),
            playlistsSupported: true
        };
    }
}

const youTubeService = new EnhancedYouTubeService();

export async function POST(request) {
    try {
        const formData = await request.formData();
        const videoFile = formData.get('video');
        const metadataString = formData.get('metadata');
        
        if (!videoFile || videoFile.size === 0) {
            return NextResponse.json(
                { success: false, error: { message: 'Invalid or empty video file' } },
                { status: 400 }
            );
        }

        let metadata = {};
        if (metadataString) {
            try {
                metadata = JSON.parse(metadataString);
            } catch (error) {
                console.warn('Invalid metadata JSON, using defaults');
            }
        }

        console.log('Processing upload:', {
            fileSize: videoFile.size,
            fileType: videoFile.type,
            suiteId: metadata.suiteId,
            suiteName: metadata.suiteName
        });

        const videoBlob = new Blob([await videoFile.arrayBuffer()], { 
            type: videoFile.type || 'video/webm' 
        });

        const uploadResult = await youTubeService.uploadVideoWithProgress(videoBlob, metadata);

        if (uploadResult.success) {
            console.log('Upload successful:', {
                videoId: uploadResult.data.videoId,
                playlistId: uploadResult.data.playlistId
            });
            
            return NextResponse.json(uploadResult);
        } else {
            console.error('Upload failed:', uploadResult.error);
            return NextResponse.json(uploadResult, { status: 500 });
        }

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { 
                    message: error.message || 'Internal server error',
                    code: 'API_ERROR'
                } 
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const status = await youTubeService.getServiceStatus();
        return NextResponse.json({
            success: true,
            data: {
                service: 'YouTube API',
                ...status,
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500 }
        );
    }
}