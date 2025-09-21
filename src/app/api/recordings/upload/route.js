// app/api/recordings/upload/route.js
import { NextResponse } from 'next/server';
import { youTubeService } from '../../../../lib/YoutubeService';

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
            } catch {
                console.warn('Invalid metadata JSON, using defaults');
            }
        }

        const videoBlob = new Blob([await videoFile.arrayBuffer()], { 
            type: videoFile.type || 'video/webm' 
        });

        const uploadResult = await youTubeService.uploadVideo(videoBlob, metadata);
        return NextResponse.json(uploadResult);

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Internal server error' } 
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