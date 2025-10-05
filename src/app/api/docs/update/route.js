// app/api/docs/update/route.js - Update Google Doc content
async function updateDocHandler(request, { user }) {
    try {
        const { docId, content } = await request.json();

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const { docs } = getGoogleClients();

        // Get current document to determine end index
        const doc = await docs.documents.get({ documentId: docId });
        const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

        // Replace all content
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        deleteContentRange: {
                            range: {
                                startIndex: 1,
                                endIndex: endIndex - 1
                            }
                        }
                    },
                    {
                        insertText: {
                            location: { index: 1 },
                            text: content
                        }
                    }
                ]
            }
        });

        return NextResponse.json({
            success: true,
            docId,
            updatedBy: user.uid,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error updating Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to update document', message: error.message },
            { status: 500 }
        );
    }
}

export const PUT = withAuth(updateDocHandler);
