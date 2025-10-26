// ============================================
// app/api/docs/create/route.js
// Creates Google Doc AND saves metadata to Firestore
// Handles folder structure in Google Drive
// ============================================
import { NextResponse } from 'next/server';
import firestoreService from '@/services';
import googleDocsService from '@/lib/googleDocsService';

export async function POST(request) {
    console.log('📄 Creating Google Doc with Firestore metadata...');
    
    try {
        const { suiteId, sprintId, documentData, content, suiteName } = await request.json();

        // Validation
        if (!suiteId || !documentData?.title) {
            return NextResponse.json(
                { success: false, error: { message: 'Suite ID and title required' } },
                { status: 400 }
            );
        }

        console.log('Creating Google Doc:', documentData.title);

        // Step 1: Setup folder structure in Google Drive
        let targetFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
        
        if (targetFolderId) {
            try {
                // Create suite folder
                const suiteFolderName = suiteName || `Suite_${suiteId}`;
                targetFolderId = await googleDocsService.getOrCreateFolder(
                    suiteFolderName,
                    targetFolderId
                );
                
                // Create sprint subfolder if needed
                if (sprintId) {
                    targetFolderId = await googleDocsService.getOrCreateFolder(
                        `Sprint_${sprintId}`,
                        targetFolderId
                    );
                }
                
                console.log('✅ Folder structure ready:', targetFolderId);
            } catch (folderError) {
                console.warn('⚠️ Folder creation failed, using root:', folderError.message);
            }
        }

        // Step 2: Create Google Doc
        const googleDoc = await googleDocsService.createDocument(
            documentData.title,
            content || '',
            targetFolderId
        );

        console.log('✅ Google Doc created:', googleDoc.docId);

        // Step 3: Save metadata to Firestore (NO CONTENT STORED)
        const firestoreData = {
            title: documentData.title,
            type: documentData.type || 'general',
            tags: documentData.tags || [],
            metadata: {
                ...(documentData.metadata || {}),
                status: documentData.metadata?.status || 'draft',
                version: documentData.metadata?.version || '1.0'
            },
            googleDoc: {
                docId: googleDoc.docId,
                url: googleDoc.url,
                folderId: targetFolderId
            },
            url: googleDoc.url
        };

        // Firebase Security Rules handle all auth & permissions
        const result = await firestoreService.createDocument(
            suiteId,
            firestoreData,
            sprintId
        );

        if (!result.success) {
            // Cleanup: delete Google Doc if Firestore fails
            console.log('🗑️ Cleaning up Google Doc after Firestore error');
            try {
                await googleDocsService.deleteDocument(googleDoc.docId);
            } catch (cleanupErr) {
                console.error('Cleanup failed:', cleanupErr);
            }
            
            throw new Error(result.error?.message || 'Firestore save failed');
        }

        console.log('✅ Google Doc + Firestore metadata created successfully');

        return NextResponse.json({
            success: true,
            data: {
                id: result.data?.id,
                ...firestoreData,
                createdAt: new Date().toISOString()
            }
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Google Doc creation failed:', error);
        
        return NextResponse.json(
            { 
                success: false, 
                error: { 
                    message: error.message || 'Failed to create Google Doc' 
                } 
            },
            { status: 500 }
        );
    }
}