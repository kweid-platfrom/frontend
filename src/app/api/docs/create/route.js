// app/api/docs/create/route.js - Create Google Doc with Firebase Auth
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { withAuth } from '@/lib/firebaseAuthMiddleware';

export const dynamic = 'force-dynamic';

function getGoogleClients() {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
        scopes: [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive'
        ]
    });

    return {
        docs: google.docs({ version: 'v1', auth }),
        drive: google.drive({ version: 'v3', auth })
    };
}

async function createDocHandler(request, { user }) {
    try {
        const { title, content } = await request.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const { docs, drive } = getGoogleClients();

        // Create blank Google Doc
        const createResponse = await docs.documents.create({
            requestBody: { title }
        });

        const docId = createResponse.data.documentId;

        // Insert content if provided
        if (content && content.trim()) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: {
                    requests: [{
                        insertText: {
                            location: { index: 1 },
                            text: content
                        }
                    }]
                }
            });
        }

        // Set permissions
        await drive.permissions.create({
            fileId: docId,
            requestBody: {
                type: 'anyone',
                role: 'writer'
            }
        });

        const url = `https://docs.google.com/document/d/${docId}/edit`;

        return NextResponse.json({
            success: true,
            docId,
            url,
            title,
            createdBy: user.uid,
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error creating Google Doc:', error);
        return NextResponse.json(
            { error: 'Failed to create document', message: error.message },
            { status: 500 }
        );
    }
}

export const POST = withAuth(createDocHandler);