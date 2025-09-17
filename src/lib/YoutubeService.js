// YouTubeService.js
class YouTubeService {
    constructor() {
        this.apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
        this.clientId = process.env.REACT_APP_YOUTUBE_CLIENT_ID;
        this.initialized = false;
    }

    // Initialize Google API
    async initialize() {
        if (this.initialized) return;

        try {
            // Load Google API script if not already loaded
            if (!window.gapi) {
                await this.loadGoogleAPI();
            }

            // Initialize gapi
            await new Promise((resolve, reject) => {
                window.gapi.load('client:auth2', {
                    callback: resolve,
                    onerror: reject
                });
            });

            // Initialize client
            await window.gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
                scope: 'https://www.googleapis.com/auth/youtube.upload'
            });

            this.initialized = true;
            console.log('YouTube API initialized');
        } catch (error) {
            console.error('Failed to initialize YouTube API:', error);
            throw new Error('YouTube API initialization failed');
        }
    }

    // Load Google API script
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Check if user is authenticated
    async isAuthenticated() {
        await this.initialize();
        const authInstance = window.gapi.auth2.getAuthInstance();
        return authInstance.isSignedIn.get();
    }

    // Authenticate user
    async authenticate() {
        await this.initialize();
        const authInstance = window.gapi.auth2.getAuthInstance();
        
        if (!authInstance.isSignedIn.get()) {
            try {
                await authInstance.signIn();
                console.log('User authenticated with YouTube');
            } catch (error) {
                console.error('Authentication failed:', error);
                throw new Error('YouTube authentication failed');
            }
        }
    }

    // Upload video to YouTube
    async uploadVideo(videoBlob, metadata = {}) {
        try {
            // Ensure authentication
            await this.authenticate();

            const defaultMetadata = {
                title: `Screen Recording - ${new Date().toLocaleDateString()}`,
                description: 'Screen recording uploaded from QA testing tool',
                tags: ['qa', 'testing', 'screen-recording'],
                privacy: 'private', // private, public, unlisted
                categoryId: '28' // Science & Technology
            };

            const finalMetadata = { ...defaultMetadata, ...metadata };

            // Create form data for multipart upload
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            // Metadata part
            const metadataObject = {
                snippet: {
                    title: finalMetadata.title,
                    description: finalMetadata.description,
                    tags: finalMetadata.tags,
                    categoryId: finalMetadata.categoryId
                },
                status: {
                    privacyStatus: finalMetadata.privacy,
                    selfDeclaredMadeForKids: false
                }
            };

            const metadata_part = delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadataObject) + delimiter;

            // Video part
            const video_part = 'Content-Type: video/webm\r\n\r\n';

            // Combine parts
            const body = new Uint8Array(
                metadata_part.length +
                video_part.length +
                videoBlob.size +
                close_delim.length
            );

            let offset = 0;
            
            // Add metadata part
            const metadataBytes = new TextEncoder().encode(metadata_part);
            body.set(metadataBytes, offset);
            offset += metadataBytes.length;

            // Add video part header
            const videoHeaderBytes = new TextEncoder().encode(video_part);
            body.set(videoHeaderBytes, offset);
            offset += videoHeaderBytes.length;

            // Add video data
            const videoBytes = new Uint8Array(await videoBlob.arrayBuffer());
            body.set(videoBytes, offset);
            offset += videoBytes.length;

            // Add closing delimiter
            const closeBytes = new TextEncoder().encode(close_delim);
            body.set(closeBytes, offset);

            // Make the upload request
            const response = await fetch(
                'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token,
                        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                    },
                    body: body
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
            }

            const result = await response.json();
            console.log('Video uploaded successfully:', result);

            return {
                success: true,
                data: {
                    videoId: result.id,
                    url: `https://www.youtube.com/watch?v=${result.id}`,
                    embedUrl: `https://www.youtube.com/embed/${result.id}`,
                    title: result.snippet.title,
                    thumbnailUrl: result.snippet.thumbnails?.default?.url
                }
            };

        } catch (error) {
            console.error('YouTube upload failed:', error);
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to upload video to YouTube'
                }
            };
        }
    }

    // Get user's YouTube channel info
    async getChannelInfo() {
        try {
            await this.authenticate();
            
            const response = await window.gapi.client.youtube.channels.list({
                part: 'snippet,statistics',
                mine: true
            });

            return {
                success: true,
                data: response.result.items?.[0] || null
            };
        } catch (error) {
            console.error('Failed to get channel info:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Create a private playlist for recordings
    async createRecordingsPlaylist(title = 'QA Screen Recordings') {
        try {
            await this.authenticate();

            const response = await window.gapi.client.youtube.playlists.insert({
                part: 'snippet,status',
                resource: {
                    snippet: {
                        title: title,
                        description: 'Private playlist for QA testing screen recordings'
                    },
                    status: {
                        privacyStatus: 'private'
                    }
                }
            });

            return {
                success: true,
                data: {
                    playlistId: response.result.id,
                    title: response.result.snippet.title,
                    url: `https://www.youtube.com/playlist?list=${response.result.id}`
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
            await this.authenticate();

            const response = await window.gapi.client.youtube.playlistItems.insert({
                part: 'snippet',
                resource: {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId
                        }
                    }
                }
            });

            return {
                success: true,
                data: response.result
            };
        } catch (error) {
            console.error('Failed to add video to playlist:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Sign out
    async signOut() {
        if (this.initialized && window.gapi.auth2) {
            const authInstance = window.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            console.log('User signed out from YouTube');
        }
    }

    // Upload with progress tracking
    async uploadVideoWithProgress(videoBlob, metadata = {}, onProgress = null) {
        try {
            await this.authenticate();

            // For progress tracking, we'll use resumable upload
            const uploadUrl = await this.initiateResumableUpload(metadata);
            return await this.performResumableUpload(uploadUrl, videoBlob, onProgress);

        } catch (error) {
            console.error('YouTube upload with progress failed:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // Initiate resumable upload
    async initiateResumableUpload(metadata) {
        const defaultMetadata = {
            title: `Screen Recording - ${new Date().toLocaleDateString()}`,
            description: 'Screen recording uploaded from QA testing tool',
            tags: ['qa', 'testing', 'screen-recording'],
            privacy: 'private',
            categoryId: '28'
        };

        const finalMetadata = { ...defaultMetadata, ...metadata };

        const metadataObject = {
            snippet: {
                title: finalMetadata.title,
                description: finalMetadata.description,
                tags: finalMetadata.tags,
                categoryId: finalMetadata.categoryId
            },
            status: {
                privacyStatus: finalMetadata.privacy,
                selfDeclaredMadeForKids: false
            }
        };

        const response = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Length': '0',
                    'X-Upload-Content-Type': 'video/webm'
                },
                body: JSON.stringify(metadataObject)
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to initiate upload: ${response.statusText}`);
        }

        return response.headers.get('location');
    }

    // Perform resumable upload with progress
    async performResumableUpload(uploadUrl, videoBlob, onProgress) {
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalSize = videoBlob.size;
        let uploadedBytes = 0;

        while (uploadedBytes < totalSize) {
            const chunk = videoBlob.slice(uploadedBytes, Math.min(uploadedBytes + chunkSize, totalSize));
            const contentRange = `bytes ${uploadedBytes}-${uploadedBytes + chunk.size - 1}/${totalSize}`;

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Length': chunk.size.toString(),
                    'Content-Range': contentRange
                },
                body: chunk
            });

            if (response.status === 308) {
                // Resume incomplete, continue
                uploadedBytes += chunk.size;
                if (onProgress) {
                    onProgress((uploadedBytes / totalSize) * 100);
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
                        thumbnailUrl: result.snippet.thumbnails?.default?.url
                    }
                };
            } else {
                throw new Error(`Upload failed with status: ${response.status}`);
            }
        }
    }

    // Delete video from YouTube
    async deleteVideo(videoId) {
        try {
            await this.authenticate();

            const response = await window.gapi.client.youtube.videos.delete({
                id: videoId
            });

            return {
                success: true,
                data: response.result
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
            await this.authenticate();

            const response = await window.gapi.client.youtube.videos.update({
                part: 'snippet,status',
                resource: {
                    id: videoId,
                    snippet: {
                        title: metadata.title,
                        description: metadata.description,
                        tags: metadata.tags,
                        categoryId: metadata.categoryId
                    },
                    status: {
                        privacyStatus: metadata.privacy || 'private'
                    }
                }
            });

            return {
                success: true,
                data: response.result
            };
        } catch (error) {
            console.error('Failed to update video:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }
}

// Create singleton instance
const youTubeService = new YouTubeService();
export default youTubeService;

// Alternative export for named imports
export { YouTubeService };