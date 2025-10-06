// app/api/docs/export/route.js - Export Google Doc
async function exportDocHandler(request, { }) {
    try {
        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('docId');
        const format = searchParams.get('format') || 'pdf';

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const mimeTypes = {
            pdf: 'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
            html: 'text/html',
            rtf: 'application/rtf'
        };

        const mimeType = mimeTypes[format] || mimeTypes.pdf;
        const { drive } = getGoogleClients();

        // Export the document
        const response = await drive.files.export({
            fileId: docId,
            mimeType: mimeType
        }, {
            responseType: 'arraybuffer'
        });

        // Get document metadata
        const fileMetadata = await drive.files.get({
            fileId: docId,
            fields: 'name'
        });

        const filename = `${fileMetadata.data.name}.${format}`;

        return new NextResponse(Buffer.from(response.data), {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': response.data.byteLength.toString()
            }
        });

    } catch (error) {
        console.error('Error exporting Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to export document', message: error.message },
            { status: 500 }
        );
    }
}

export const GET = withAuth(exportDocHandler);