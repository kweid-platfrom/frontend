import { NextResponse } from 'next/server';
import googleDocsService from '@/lib/googleDocsService';
import { auth } from '@/config/firebase-admin';

export async function PUT(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await auth.verifyIdToken(authHeader.substring(7));

        const { docId, content } = await request.json();
        const updateResult = await googleDocsService.updateDocument(docId, content);

        return NextResponse.json({ success: true, ...updateResult });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}