// app/api/documents/update/route.js - Update document
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized' } },
                { status: 401 }
            );
        }

        const { documentId, suiteId, sprintId, updates } = await request.json();

        if (!documentId || !suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Document ID and Suite ID are required' } },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { success: false, error: { message: 'Updates object is required' } },
                { status: 400 }
            );
        }

        const result = await firestoreService.updateDocument(
            documentId,
            updates,
            suiteId,
            sprintId
        );

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error) {
        console.error('Error in update document API:', error);
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