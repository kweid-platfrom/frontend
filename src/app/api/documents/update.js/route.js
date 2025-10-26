// ============================================
// app/api/documents/update/route.js (if needed)
// Updates Firestore document metadata ONLY
// NO Google Docs integration
// ============================================
import { NextResponse } from 'next/server';
import firestoreService from '@/services';

export async function PUT(request) {
    console.log('📝 Updating Firestore document...');
    
    try {
        const { documentId, suiteId, sprintId, updates } = await request.json();

        if (!documentId || !suiteId) {
            return NextResponse.json(
                { success: false, error: { message: 'Document ID and Suite ID required' } },
                { status: 400 }
            );
        }

        // Update Firestore only
        // Firebase Security Rules handle all auth & permissions
        const result = await firestoreService.updateDocument(
            documentId,
            {
                ...updates,
                metadata: {
                    ...(updates.metadata || {}),
                    lastModified: new Date().toISOString()
                }
            },
            suiteId,
            sprintId
        );

        if (result.success) {
            console.log('✅ Firestore document updated');
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Firestore document update failed:', error);
        
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500 }
        );
    }
}