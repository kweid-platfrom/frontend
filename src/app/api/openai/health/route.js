import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin only once
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        }),
    });
}

const openAIClient = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export async function GET(req) {
    // Authenticate request
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        await getAuth().verifyIdToken(token);
    } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        await openAIClient.models.list();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('OpenAI health check failed:', error);
        return NextResponse.json({ error: 'OpenAI API unavailable' }, { status: 500 });
    }
}
