// app/api/recordings/playlist/route.js
import { NextRequest, NextResponse } from 'next/server';

class PlaylistService {
    constructor() {
        this.clientId = process.env.YOUTUBE_CLIENT_ID;
        this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        this.refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        
        // Cache for playlists to avoid recreating
        this.playlistCache = new Map();
    }

    async initialize() {
        if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
            return;
        }
        await this.refreshAccessToken();
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
        if (!this.accessToken || !this.tokenExpiresAt || new Date() >= this.tokenExpiresAt) {
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
            console.log('Creating new YouTube playlist:', { title, suiteId });

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
                            description: description || `Test recordings for ${title}`
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
                createdAt: new Date().toISOString(),
                suiteId: suiteId
            };

            // Cache the playlist
            this.playlistCache.set(cacheKey, playlistData);

            console.log('Playlist created successfully:', playlistData.id);

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
            console.warn('Error verifying playlist:', error);
            return false;
        }
    }

    // Get playlist info
    async getPlaylist(suiteId) {
        const cacheKey = `suite_${suiteId}`;
        
        // Check cache first
        if (this.playlistCache.has(cacheKey)) {
            const cached = this.playlistCache.get(cacheKey);
            const exists = await this.verifyPlaylistExists(cached.id);
            if (exists) {
                return { success: true, data: cached };
            } else {
                this.playlistCache.delete(cacheKey);
            }
        }

        return {
            success: false,
            error: { message: 'Playlist not found' }
        };
    }

    // Delete playlist (if needed)
    async deletePlaylist(playlistId) {
        try {
            await this.ensureValidToken();

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.deletePlaylist(playlistId);
                }
                
                const error = await response.json().catch(() => ({}));
                throw new Error(`Playlist deletion failed: ${error.error?.message || response.statusText}`);
            }

            // Remove from cache
            for (const [key, value] of this.playlistCache.entries()) {
                if (value.id === playlistId) {
                    this.playlistCache.delete(key);
                    break;
                }
            }

            return {
                success: true,
                data: { message: 'Playlist deleted successfully' }
            };

        } catch (error) {
            console.error('Playlist deletion error:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }

    // List all playlists (for debugging/management)
    async listPlaylists() {
        try {
            await this.ensureValidToken();

            const response = await fetch(
                'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshAccessToken();
                    return this.listPlaylists();
                }
                
                const error = await response.json().catch(() => ({}));
                throw new Error(`Failed to list playlists: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const playlists = data.items.map(item => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                url: `https://www.youtube.com/playlist?list=${item.id}`,
                createdAt: item.snippet.publishedAt
            }));

            return {
                success: true,
                data: playlists
            };

        } catch (error) {
            console.error('List playlists error:', error);
            return {
                success: false,
                error: { message: error.message }
            };
        }
    }
}

const playlistService = new PlaylistService();

// POST - Create or get playlist
export async function POST(request) {
    try {
        const body = await request.json();
        const { suiteId, title, description } = body;

        if (!suiteId || !title) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID and title are required' } },
                { status: 400 }
            );
        }

        console.log('Playlist creation request:', { suiteId, title });

        const result = await playlistService.createOrGetPlaylist(suiteId, title, description);

        if (result.success) {
            return NextResponse.json({
                success: true,
                data: {
                    playlistId: result.data.id,
                    playlistUrl: result.data.url,
                    ...result.data
                }
            });
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error) {
        console.error('Playlist API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Failed to create playlist' } 
            },
            { status: 500 }
        );
    }
}

// GET - Get playlist info
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const suiteId = searchParams.get('suiteId');
        const action = searchParams.get('action');

        // List all playlists for debugging
        if (action === 'list') {
            const result = await playlistService.listPlaylists();
            return NextResponse.json(result);
        }

        // Get specific playlist
        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID is required' } },
                { status: 400 }
            );
        }

        const result = await playlistService.getPlaylist(suiteId);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Playlist GET API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Failed to get playlist' } 
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete playlist
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const playlistId = searchParams.get('playlistId');

        if (!playlistId) {
            return NextResponse.json(
                { success: false, error: { message: 'Playlist ID is required' } },
                { status: 400 }
            );
        }

        console.log('Playlist deletion request:', { playlistId });

        const result = await playlistService.deletePlaylist(playlistId);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Playlist DELETE API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Failed to delete playlist' } 
            },
            { status: 500 }
        );
    }
}