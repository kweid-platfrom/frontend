// app/api/docs/delete/route.js - Delete Google Doc
async function deleteDocHandler(request, { user }) {
    try {
        const { docId } = await request.json();

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const { drive } = getGoogleClients();

        // Move to trash (soft delete)
        await drive.files.update({
            fileId: docId,
            requestBody: { trashed: true }
        });

        return NextResponse.json({
            success: true,
            docId,
            deletedBy: user.uid,
            deletedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error deleting Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to delete document', message: error.message },
            { status: 500 }
        );
    }
}

export const DELETE = withAuth(deleteDocHandler);

// app/api/docs/share/route.js - Share Google Doc
async function shareDocHandler(request, { user }) {
    try {
        const { docId, emails, role } = await request.json();

        if (!docId || !emails || !Array.isArray(emails)) {
            return NextResponse.json(
                { error: 'Document ID and emails array are required' },
                { status: 400 }
            );
        }

        const { drive } = getGoogleClients();
        const permissions = [];

        // Add permissions for each email
        for (const email of emails) {
            const permission = await drive.permissions.create({
                fileId: docId,
                requestBody: {
                    type: 'user',
                    role: role || 'reader',
                    emailAddress: email
                },
                sendNotificationEmail: true
            });

            permissions.push({
                email,
                role: role || 'reader',
                permissionId: permission.data.id
            });
        }

        return NextResponse.json({
            success: true,
            docId,
            permissions,
            sharedBy: user.uid,
            sharedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error sharing Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to share document', message: error.message },
            { status: 500 }
        );
    }
}

export const POST = withAuth(shareDocHandler);