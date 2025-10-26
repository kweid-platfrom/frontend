// ============================================
// app/api/documents/create/route.js
// Creates document metadata in Firestore ONLY
// NO Google Docs integration
// ============================================
import { NextResponse } from 'next/server';
import firestoreService from '@/services';

export async function POST(request) {
    console.log('📄 Creating Firestore document...');
    
    try {
        const { suiteId, sprintId, documentData } = await request.json();

        // Validation
        if (!suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID is required' } },
                { status: 400 }
            );
        }

        if (!documentData || !documentData.title) {
            return NextResponse.json(
                { success: false, error: { message: 'Document data with title is required' } },
                { status: 400 }
            );
        }

        // Create document in Firestore only
        // Firebase Security Rules handle all auth & permissions
        const result = await firestoreService.createDocument(
            suiteId,
            documentData,
            sprintId
        );

        if (result.success) {
            console.log('✅ Firestore document created');
            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(result, { status: 500 });
        }

    } catch (error) {
        console.error('❌ Firestore document creation failed:', error);
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