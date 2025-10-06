// app/api/docs/list/route.js - List documents
async function listDocsHandler() {
    try {
        const { drive } = getGoogleClients();

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.document' and trashed=false",
            fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
            orderBy: 'modifiedTime desc',
            pageSize: 100
        });

        return NextResponse.json({
            success: true,
            documents: response.data.files
        });

    } catch (error) {
        console.error('Error listing Google Docs:', error);
        return NextResponse.json(
            { error: 'Failed to list documents', message: error.message },
            { status: 500 }
        );
    }
}

export const GET = withAuth(listDocsHandler);