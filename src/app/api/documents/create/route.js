// app/api/documents/create/route.js - Create document with Google Docs integration
import { NextResponse } from 'next/server';
import { verifyFirebaseAuth } from '@/lib/firebaseAuthMiddleware';
import firestoreService from '@/services';

export async function POST(request) {
    try {
        // Verify Firebase authentication
        const { user, error } = await verifyFirebaseAuth(request);
        
        if (error || !user) {
            return NextResponse.json(
                { success: false, error: { message: error || 'Unauthorized' } },
                { status: 401 }
            );
        }

        const { suiteId, sprintId, documentData } = await request.json();

        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID is required' } },
                { status: 400 }
            );
        }

        if (!documentData || !documentData.title) {
            return NextResponse.json(
                { success: false, error: { message: 'Document data with title is required' } },
                { status: 400 }
            );
        }

        // Pass user info to the service if needed
        const result = await firestoreService.createDocument(
            suiteId,
            documentData,
            sprintId,
            user.uid // Pass authenticated user ID
        );

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error) {
        console.error('Error in create document API:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: 'Internal server error',
                    details: error.message
                }
            },
            { status: 500 }
        );
    }
}