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
            return NextResponse.json(deleteResult, { status: 500 });
        }

    } catch (error) {
        console.error('API delete route error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Internal server error during deletion' } 
            },
            { status: 500 }
        );
    }
}