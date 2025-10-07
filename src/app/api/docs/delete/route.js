// app/api/docs/delete/route.js - Delete Google Doc
import { NextResponse } from 'next/server';
import googleDocsService from '../../../../lib/goggleDocsService';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
    try {
        const { docId, permanent } = await request.json();

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        // Validate docId format (basic check)
        if (typeof docId !== 'string' || docId.trim().length === 0) {
            return NextResponse.json(
                { error: 'Invalid document ID format' },
                { status: 400 }
            );
        }

        try {
            // Check if document exists and user has access
            await googleDocsService.getDocument(docId);
        } catch (err) {
            const statusCode = err.message.includes('not found') ? 404 : 403;
            return NextResponse.json(
                { 
                    error: statusCode === 404 
                        ? 'Document not found or you do not have access' 
                        : 'Access denied',
                    message: err.message 
                },
                { status: statusCode }
            );
        }

        // Perform deletion
        const result = await googleDocsService.deleteDocument(docId);

        return NextResponse.json({
            ...result,
            permanent: permanent || false
        });

    } catch (error) {
        console.error('Error deleting Google Doc:', error);
        return NextResponse.json(
            { 
                error: 'Failed to delete document', 
                message: error.message
            },
            { status: 500 }
        );
    }
}