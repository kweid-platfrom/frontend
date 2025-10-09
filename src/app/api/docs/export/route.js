import { NextResponse } from 'next/server';
import googleDocsService from '@/lib/googleDocsService';
import { auth } from '@/config/firebase-admin';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await auth.verifyIdToken(authHeader.substring(7));

        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('docId');
        const format = searchParams.get('format') || 'pdf';

        const mimeTypes = {
            pdf: 'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain'
        };

        const exportBuffer = await googleDocsService.exportDocument(docId, mimeTypes[format]);

        return new NextResponse(exportBuffer, {
            headers: {
                'Content-Type': mimeTypes[format],
                'Content-Disposition': `attachment; filename="document.${format}"`
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}