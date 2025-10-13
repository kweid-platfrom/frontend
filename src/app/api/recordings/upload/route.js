// app/api/recordings/upload/route.js
import { NextResponse } from 'next/server';
import { youTubeService } from '../../../../lib/YoutubeService';

// CORS headers configuration
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
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
                { success: false, error: { message: 'Invalid or empty video file' } },
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
        return NextResponse.json(
            { 
                success: false, 
                error: { message: error.message || 'Internal server error' } 
            },
            { status: 500, headers: corsHeaders }
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
        }, { headers: corsHeaders });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500, headers: corsHeaders }
        );
    }
}