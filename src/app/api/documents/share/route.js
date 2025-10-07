// app/api/documents/share/route.js - Share document
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized' } },
                { status: 401 }
            );
        }

        const { documentId, suiteId, sprintId, shareConfig } = await request.json();

        if (!documentId || !suiteId || !shareConfig) {
            return NextResponse.json(
                { success: false, error: { message: 'Document ID, Suite ID, and share config are required' } },
                { status: 400 }
            );
        }

        // Get document to retrieve Google Docs ID
        const docResult = await firestoreService.getDocument(documentId, suiteId, sprintId);
        
        if (!docResult.success) {
            return NextResponse.json(docResult, { status: 404 });
        }

        // Call Google Docs share API
        const shareResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/docs/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                docId: docResult.data.docId,
                emails: shareConfig.emails,
                role: shareConfig.role,
                userId: session.user.id
            })
        });

        if (!shareResponse.ok) {
            throw new Error('Failed to share document');
        }

        const shareResult = await shareResponse.json();

        return NextResponse.json({
            success: true,
            data: shareResult
        });

    } catch (error) {
        console.error('Error in share document API:', error);
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