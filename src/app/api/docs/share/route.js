import { NextResponse } from 'next/server';
import googleDocsService from '@/lib/googleDocsService';
import { auth } from '@/config/firebase-admin';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await auth.verifyIdToken(authHeader.substring(7));

        const { docId, emails, role = 'reader' } = await request.json();
        const shareResult = await googleDocsService.shareDocument(docId, emails, role);

        return NextResponse.json(shareResult);
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}