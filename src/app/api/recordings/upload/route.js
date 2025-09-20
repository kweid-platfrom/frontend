// app/api/recordings/upload/route.js
import { NextRequest, NextResponse } from 'next/server';

// Server-side YouTube service for API routes
class ServerYouTubeService {
    constructor() {
        // Server-side environment variables (no REACT_APP_ prefix)
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.initialized = false;

        // Validate credentials on instantiation
        if (!this.clientId || !this.clientSecret || !this.refreshToken) {
            console.error('Missing YouTube API credentials in server environment');
        }
    }

    async initialize() {
        if (this.initialized && this.isTokenValid()) return;

        try {
            await this.refreshAccessToken();
            this.initialized = true;
            console.log('Server YouTube API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize server YouTube API:', error);
            throw new Error('YouTube API initialization failed: ' + error.message);
        }
    }

    isTokenValid() {
        return this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt;
    }

    async refreshAccessToken() {
        if (!this.clientId || !this.clientSecret || !this.refreshToken) {
            throw new Error('Missing required YouTube API credentials');
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
            this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
            
            console.log('Server YouTube access token refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh server YouTube access token:', error);
            throw error;
        }
    }

    async ensureValidToken() {
        if (!this.isTokenValid()) {
            await this.refreshAccessToken();
        }
    }

    async uploadVideoWithProgress(videoBlob, metadata = {}) {
        try {
            await this.initialize();
            await this.ensureValidToken();

            const finalMetadata = {
                snippet: {
                    title: metadata.title || `Recording - ${new Date().toLocaleDateString()}`,
                    description: metadata.description || 'Screen recording uploaded from QA testing tool',
                    tags: metadata.tags || ['qa', 'testing', 'screen-recording'],
                    categoryId: metadata.categoryId || '28'
                },
                status: {
                    privacyStatus: metadata.privacy || 'private',
                    selfDeclaredMadeForKids: false
                }
            };

            // For API routes, we'll use resumable upload
            return await this.performResumableUpload(videoBlob, finalMetadata);

        } catch (error) {
            console.error('Server YouTube upload failed:', error);
            return {
                success: false,
                error: { 
                    message: error.message || "Failed to upload video",
                    code: error.code || 'UPLOAD_ERROR'
                }
            };
        }
    }

    async performResumableUpload(videoBlob, metadata) {
        // Initiate resumable upload
        const uploadUrl = await this.initiateResumableUpload(videoBlob, metadata);
        
        // Upload the video in chunks
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalSize = videoBlob.size;
        let uploadedBytes = 0;

        // Convert blob to buffer for server-side processing
        const arrayBuffer = await videoBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        while (uploadedBytes < totalSize) {
            const chunkEnd = Math.min(uploadedBytes + chunkSize, totalSize);
            const chunk = buffer.slice(uploadedBytes, chunkEnd);
            const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${totalSize}`;

            try {
                const response = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Length': chunk.length.toString(),
                        'Content-Range': contentRange
                    },
                    body: chunk
                });

                if (response.status === 308) {
                    // Resume incomplete - continue with next chunk
                    uploadedBytes = chunkEnd;
                } else if (response.status === 200 || response.status === 201) {
                    // Upload complete
                    const result = await response.json();
                    
                    return {
                        success: true,
                        data: {
                            videoId: result.id,
                            youtubeId: result.id, // Alias for compatibility
                            url: `https://www.youtube.com/watch?v=${result.id}`,
                            videoUrl: `https://www.youtube.com/watch?v=${result.id}`,
                            embedUrl: `https://www.youtube.com/embed/${result.id}`,
                            title: result.snippet.title,
                            description: result.snippet.description,
                            thumbnailUrl: result.snippet.thumbnails?.default?.url,
                            privacyStatus: result.status.privacyStatus,
                            provider: 'youtube',
                            uploadedAt: new Date().toISOString()
                        }
                    };
                } else if (response.status === 401) {
                    // Token expired, refresh and retry
                    await this.refreshAccessToken();
                    return this.uploadVideoWithProgress(videoBlob, { title: 'Retrying upload' });
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Upload failed at byte ${uploadedBytes}: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.warn(`Network error at byte ${uploadedBytes}, retrying chunk...`);
                    continue;
                }
                throw error;
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
            throw new Error(`Failed to initiate resumable upload: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const uploadUrl = response.headers.get('location');
        if (!uploadUrl) {
            throw new Error('No upload URL received from YouTube API');
        }

        return uploadUrl;
    }

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
                    return this.deleteVideo(videoId);
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

    async getServiceStatus() {
        return {
            initialized: this.initialized,
            hasValidToken: this.isTokenValid(),
            tokenExpiresAt: this.tokenExpiresAt,
            hasCredentials: !!(this.clientId && this.clientSecret && this.refreshToken)
        };
    }
}

// Initialize server YouTube service
const serverYouTubeService = new ServerYouTubeService();

export async function POST(request) {
    try {
        console.log('Starting server-side YouTube upload...');

        // Parse form data
        const formData = await request.formData();
        const videoFile = formData.get('video');
        const metadataString = formData.get('metadata');
        
        if (!videoFile) {
            return NextResponse.json(
                { success: false, error: { message: 'No video file provided' } },
                { status: 400 }
            );
        }

        if (!videoFile.size || videoFile.size === 0) {
            return NextResponse.json(
                { success: false, error: { message: 'Empty video file provided' } },
                { status: 400 }
            );
        }

        // Parse metadata
        let metadata = {};
        if (metadataString) {
            try {
                metadata = JSON.parse(metadataString);
            } catch (error) {
                console.warn('Failed to parse metadata, using defaults:', error);
            }
        }

        console.log('Upload request details:', {
            fileSize: videoFile.size,
            fileType: videoFile.type,
            fileName: videoFile.name,
            metadataKeys: Object.keys(metadata)
        });

        // Convert File to Blob for compatibility
        const videoBlob = new Blob([await videoFile.arrayBuffer()], { 
            type: videoFile.type || 'video/webm' 
        });

        // Upload to YouTube
        const uploadResult = await serverYouTubeService.uploadVideoWithProgress(videoBlob, metadata);

        if (uploadResult.success) {
            console.log('Server-side YouTube upload successful');
            return NextResponse.json(uploadResult);
        } else {
            console.error('Server-side YouTube upload failed:', uploadResult.error);
            return NextResponse.json(
                uploadResult,
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('API route error:', error);
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

// GET endpoint for service status
export async function GET() {
    try {
        const status = await serverYouTubeService.getServiceStatus();
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
            { 
                success: false, 
                error: { message: error.message } 
            },
            { status: 500 }
        );
    }
}