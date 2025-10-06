// app/api/docs/share/route.js - Share Google Doc
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

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
            sharedAt: new Date().toISOString()
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