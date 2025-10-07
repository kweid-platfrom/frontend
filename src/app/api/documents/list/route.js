// app/api/documents/list/route.js - List documents
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized' } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const suiteId = searchParams.get('suiteId');
        const sprintId = searchParams.get('sprintId');
        const type = searchParams.get('type');
        const includeAll = searchParams.get('includeAll') === 'true';

        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID is required' } },
                { status: 400 }
            );
        }

        const options = {
            ...(type && { type }),
            includeAll
        };

        const result = await firestoreService.getDocuments(
            suiteId,
            sprintId,
            options
        );

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error) {
        console.error('Error in list documents API:', error);
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
