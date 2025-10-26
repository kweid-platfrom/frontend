// ============================================
// app/api/docs/update/route.js
// Updates Google Doc content AND Firestore metadata
// ============================================
import { NextResponse } from 'next/server';
import firestoreService from '@/services';
import googleDocsService from '@/lib/googleDocsService';

export async function PUT(request) {
    console.log('📝 Updating Google Doc...');
    
    try {
        const { documentId, suiteId, sprintId, updates, content } = await request.json();

        if (!documentId || !suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Document ID and Suite ID required' } },
                { status: 400 }
            );
        }

        // Get existing doc to find Google Doc ID
        // Firebase Security Rules handle read permissions
        const existingDoc = await firestoreService.getDocument(documentId, suiteId, sprintId);
        
        if (!existingDoc.success) {
            return NextResponse.json(
                { success: false, error: { message: 'Document not found' } },
                { status: 404 }
            );
        }

        // Update Google Doc content if provided
        if (content && existingDoc.data.googleDoc?.docId) {
            console.log('Updating Google Doc content...');
            await googleDocsService.updateDocument(
                existingDoc.data.googleDoc.docId,
                content
            );
            console.log('✅ Google Doc content updated');
        }

        // Update Firestore metadata
        // Firebase Security Rules handle write permissions
        const result = await firestoreService.updateDocument(
            documentId,
            {
                ...updates,
                metadata: {
                    ...(existingDoc.data.metadata || {}),
                    ...(updates.metadata || {}),
                    lastModified: new Date().toISOString()
                }
            },
            suiteId,
            sprintId
        );

        if (result.success) {
            console.log('✅ Firestore metadata updated');
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Google Doc update failed:', error);
        
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500 }
        );
    }
}