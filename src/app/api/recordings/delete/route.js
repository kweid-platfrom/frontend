import { NextResponse } from 'next/server';
import { youTubeService } from '../../../../lib/YoutubeService';

export async function DELETE(request) {
    try {
        const body = await request.json();
        const { videoId, youtubeId, recordingData } = body;

        const videoIdToDelete = videoId || youtubeId || recordingData?.videoId || recordingData?.youtubeId;

        if (!videoIdToDelete) {
            return NextResponse.json(
                { success: false, error: { message: 'No video ID provided for deletion' } },
                { status: 400 }
            );
        }

        const deleteResult = await youTubeService.deleteVideo(videoIdToDelete);
        
        if (deleteResult.success) {
            return NextResponse.json({
                success: true,
                data: {
                    videoId: videoIdToDelete,
                    deletedAt: new Date().toISOString(),
                    message: 'Video deleted successfully from YouTube'
                }
            });
        } else {
            // Check if it's a permission error
            if (deleteResult.error?.code === 403 || 
                deleteResult.error?.message?.includes('insufficient authentication scopes')) {
                return NextResponse.json({
                    success: false,
                    error: {
                        message: 'Insufficient permissions to delete video. OAuth token needs youtube.force-ssl scope.',
                        code: 'INSUFFICIENT_SCOPE',
                        videoId: videoIdToDelete,
                        requiresManualDeletion: true
                    }
                }, { status: 403 });
            }
            
            return NextResponse.json(deleteResult, { status: 500 });
        }

    } catch (error) {
        console.error('API delete route error:', error);
        
        // Handle permission errors gracefully
        if (error.message?.includes('403') || error.message?.includes('insufficient')) {
            return NextResponse.json({
                success: false,
                error: {
                    message: 'Cannot delete video: Insufficient YouTube API permissions',
                    code: 'INSUFFICIENT_SCOPE',
                    requiresManualDeletion: true
                }
            }, { status: 403 });
        }
        
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Internal server error during deletion' } 
            },
            { status: 500 }
        );
    }
}