// app/api/recordings/delete/route.js
import { NextRequest, NextResponse } from 'next/server';
import { ServerYouTubeService } from '../upload/route.js';

// Reuse the server YouTube service
const serverYouTubeService = new ServerYouTubeService();

export async function DELETE(request) {
    try {
        console.log('Starting server-side YouTube video deletion...');

        // Parse request body
        const body = await request.json();
        const { videoId, youtubeId, recordingData } = body;

        // Determine video ID from various possible fields
        const videoIdToDelete = videoId || youtubeId || recordingData?.videoId || recordingData?.youtubeId;

        if (!videoIdToDelete) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: { message: 'No video ID provided for deletion' } 
                },
                { status: 400 }
            );
        }

        console.log('Deleting YouTube video:', videoIdToDelete);

        // Delete from YouTube
        const deleteResult = await serverYouTubeService.deleteVideo(videoIdToDelete);

        if (deleteResult.success) {
            console.log('Server-side YouTube video deletion successful');
            return NextResponse.json({
                success: true,
                data: {
                    videoId: videoIdToDelete,
                    deletedAt: new Date().toISOString(),
                    message: 'Video deleted successfully from YouTube'
                }
            });
        } else {
            console.error('Server-side YouTube video deletion failed:', deleteResult.error);
            return NextResponse.json(
                deleteResult,
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('API delete route error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { 
                    message: error.message || 'Internal server error during deletion',
                    code: 'DELETE_API_ERROR'
                } 
            },
            { status: 500 }
        );
    }
}