import { NextResponse } from 'next/server';
import googleDocsService from '@/lib/googleDocsService';
import { auth } from '@/config/firebase-admin';

export async function POST(request) {
    console.log('=== API /docs/create called ===');
    
    try {
        // Verify authentication
        const authHeader = request.headers.get('Authorization');
        console.log('Auth header present:', !!authHeader);
        
        if (!authHeader?.startsWith('Bearer ')) {
            console.error('Missing or invalid authorization header');
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Missing Bearer token' }, 
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('Verifying ID token...');
        
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(token);
            console.log('Token verified for user:', decodedToken.uid);
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Invalid token' }, 
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        console.log('Request body:', {
            hasTitle: !!body.title,
            hasSuiteId: !!body.suiteId,
            hasSuiteName: !!body.suiteName,
            hasSprintId: !!body.sprintId,
            hasContent: !!body.content
        });

        const { title, suiteId, suiteName, sprintId, content } = body;

        if (!title || !suiteId) {
            console.error('Missing required fields');
            return NextResponse.json(
                { success: false, error: 'Title and Suite ID are required' },
                { status: 400 }
            );
        }

        // Determine target folder
        let targetFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        
        // Create folder structure if no root folder specified
        if (!targetFolderId) {
            console.log('No root folder specified, creating folder structure...');
            try {
                const rootFolderId = await googleDocsService.getOrCreateFolder('QA Test Suites');
                console.log('Root folder ID:', rootFolderId);
                
                targetFolderId = await googleDocsService.getOrCreateFolder(
                    suiteName || suiteId, 
                    rootFolderId
                );
                console.log('Suite folder ID:', targetFolderId);
                
                if (sprintId) {
                    targetFolderId = await googleDocsService.getOrCreateFolder(
                        `Sprint ${sprintId}`, 
                        targetFolderId
                    );
                    console.log('Sprint folder ID:', targetFolderId);
                }
            } catch (folderError) {
                console.warn('Failed to create folder structure:', folderError);
                // Continue without folder organization
                targetFolderId = null;
            }
        } else {
            console.log('Using root folder from env:', targetFolderId);
        }

        // Create the Google Doc
        console.log('Creating Google Doc...');
        const docResult = await googleDocsService.createDocument(
            title, 
            content || '', 
            targetFolderId
        );
        console.log('Google Doc created:', {
            docId: docResult.docId,
            url: docResult.url
        });

        // Return success response
        const response = {
            success: true,
            docId: docResult.docId,
            url: docResult.url,
            title: docResult.title,
            folderId: targetFolderId,
            createdAt: docResult.createdAt
        };
        
        console.log('Returning success response:', response);
        return NextResponse.json(response);

    } catch (error) {
        console.error('=== API /docs/create error ===');
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        return NextResponse.json(
            { 
                success: false, 
                error: error.message,
                details: error.stack 
            }, 
            { status: 500 }
        );
    }
}