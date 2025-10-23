// app/api/recordings/upload/route.js
import { NextResponse } from 'next/server';
import { youTubeService } from '@/lib/YoutubeService';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const videoFile = formData.get('video');
        const metadataString = formData.get('metadata');
        
        if (!videoFile || videoFile.size === 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: { message: 'Invalid or empty video file' } 
                },
                { status: 400, headers: corsHeaders }
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
        return NextResponse.json(uploadResult, { headers: corsHeaders });

    } catch (error) {
        console.error('API error:', error);
        
        // ✅ FIXED: User-friendly error messages
        if (error.message === 'YOUTUBE_REAUTH_REQUIRED') {
            return NextResponse.json(
                { 
                    success: false, 
                    error: { 
                        code: 'REAUTH_REQUIRED',
                        message: 'YouTube connection expired. Please reconnect.'
                    } 
                },
                { status: 401, headers: corsHeaders }
            );
        }

        return NextResponse.json(
            { 
                success: false, 
                error: { message: 'Failed to upload video' } 
            },
            { status: 500, headers: corsHeaders }
        );
    }
}