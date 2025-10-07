// app/api/docs/share/route.js - Share Google Doc
import { NextResponse } from 'next/server';
import googleDocsService from '../../../../lib/goggleDocsService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { docId, emails, role } = await request.json();

        if (!docId || !emails || !Array.isArray(emails)) {
            return NextResponse.json(
                { error: 'Document ID and emails array are required' },
                { status: 400 }
            );
        }

        if (emails.length === 0) {
            return NextResponse.json(
                { error: 'At least one email is required' },
                { status: 400 }
            );
        }

        // Valid roles: reader, writer, commenter
        const validRoles = ['reader', 'writer', 'commenter'];
        const shareRole = role && validRoles.includes(role) ? role : 'reader';

        // Share the document
        const result = await googleDocsService.shareDocument(docId, emails, shareRole);

        return NextResponse.json({
            success: true,
            docId: result.docId,
            permissions: result.permissions,
            sharedAt: result.sharedAt
        });

    } catch (error) {
        console.error('Error sharing Google Doc:', error);
        return NextResponse.json(
            { 
                error: 'Failed to share document',
                message: error.message 
            },
            { status: 500 }
        );
    }
}