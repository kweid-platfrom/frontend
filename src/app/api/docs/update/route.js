// app/api/docs/update/route.js - Update Google Doc content
import { NextResponse } from 'next/server';
import googleDocsService from '../../../../lib/goggleDocsService';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
    try {
        const { docId, content } = await request.json();

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Update the Google Doc
        const result = await googleDocsService.updateDocument(docId, content);

        return NextResponse.json({
            success: true,
            docId: result.docId,
            updatedAt: result.updatedAt
        });

    } catch (error) {
        console.error('Error updating Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to update document', message: error.message },
            { status: 500 }
        );
    }
}