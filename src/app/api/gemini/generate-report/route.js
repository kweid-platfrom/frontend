
/* eslint-disable @typescript-eslint/no-unused-vars */
// api/gemini/generate-report/route.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin only when needed (lazy initialization)
let adminApp = null;

async function getFirebaseAdmin() {
    if (adminApp) {
        return adminApp;
    }

    try {
        const { initializeApp, getApps, cert } = await import('firebase-admin/app');
        const { getAuth } = await import('firebase-admin/auth');

        // Check if already initialized
        if (getApps().length > 0) {
            adminApp = getApps()[0];
            return adminApp;
        }

        // Validate required environment variables
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Missing Firebase configuration. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
        }

        // Process the private key - handle escaped newlines
        const processedPrivateKey = privateKey.replace(/\\n/g, '\n');

        adminApp = initializeApp({
            credential: cert({
                projectId,
                privateKey: processedPrivateKey,
                clientEmail,
            }),
        });

        return adminApp;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }
}

// Initialize Gemini AI only when needed
function getGeminiAI() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('Gemini API key not found. Please set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
    }

    return new GoogleGenerativeAI(apiKey);
}

export async function POST(req) {
    try {
        // Authenticate request
        const token = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
        }

        // Initialize Firebase Admin and verify token
        const adminApp = await getFirebaseAdmin();
        const { getAuth } = await import('firebase-admin/auth');
        
        try {
            await getAuth(adminApp).verifyIdToken(token);
        } catch (authError) {
            console.error('Token verification failed:', authError);
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Parse request body
        const body = await req.json();
        const {
            reportType,
            suiteData,
            sprintData,
            testCaseData,
            bugData,
            automationData,
            dateRange,
            created_by,
            organizationId,
            model,
            temperature,
            maxTokens,
        } = body;

        // Validate required fields
        if (!reportType) {
            return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
        }

        // Initialize Gemini AI
        const genAI = getGeminiAI();
        const geminiModel = genAI.getGenerativeModel({ 
            model: model || 'gemini-1.5-flash',
            generationConfig: {
                temperature: temperature || 0.7,
                maxOutputTokens: maxTokens || 3000,
            }
        });

        const prompt = `
            Generate a ${reportType} for the following QA data:
            - Suite: ${JSON.stringify(suiteData, null, 2)}
            - Sprint: ${sprintData ? JSON.stringify(sprintData, null, 2) : 'N/A'}
            - Test Cases: ${JSON.stringify(testCaseData, null, 2)}
            - Bugs: ${JSON.stringify(bugData, null, 2)}
            - Automation Logs: ${JSON.stringify(automationData, null, 2)}
            - Date Range: ${dateRange ? JSON.stringify(dateRange) : 'N/A'}
            - Created By: ${created_by}
            - Organization ID: ${organizationId}
            
            You are an AI assistant generating QA reports based on provided data. Return ONLY a valid JSON object with the following structure (no markdown formatting, no extra text):
            {
                "summary": "A concise summary of the report (2-3 sentences)",
                "insights": "Detailed insights based on the data analysis (3-5 sentences)",
                "riskScores": {
                    "overallRisk": "Low|Medium|High",
                    "criticalIssues": number,
                    "coverageGaps": number,
                    "automationStability": "Stable|Unstable|Critical"
                },
                "recommendations": [
                    { "action": "Specific actionable suggestion", "priority": "Low|Medium|High" }
                ]
            }
            
            Ensure recommendations are actionable and prioritized based on the analysis.
        `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        let parsedResult;
        try {
            // Clean up the response to remove any markdown formatting
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            parsedResult = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.error('Raw response:', text);
            
            // Fallback: try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    parsedResult = JSON.parse(jsonMatch[0]);
                } catch (fallbackError) {
                    console.error('Fallback parsing also failed:', fallbackError);
                    return NextResponse.json({ 
                        error: 'AI returned invalid response format',
                        details: 'Unable to parse AI response as JSON',
                        rawResponse: text.substring(0, 500) // First 500 chars for debugging
                    }, { status: 500 });
                }
            } else {
                return NextResponse.json({ 
                    error: 'AI response does not contain valid JSON',
                    rawResponse: text.substring(0, 500)
                }, { status: 500 });
            }
        }

        // Validate response structure
        if (!parsedResult.summary || !parsedResult.insights || !parsedResult.riskScores || !parsedResult.recommendations) {
            return NextResponse.json({ 
                error: 'AI response missing required fields',
                received: Object.keys(parsedResult)
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: parsedResult.summary,
                insights: parsedResult.insights,
                riskScores: parsedResult.riskScores,
                recommendations: parsedResult.recommendations,
            },
            metadata: {
                model: model || 'gemini-1.5-flash',
                timestamp: new Date().toISOString(),
                reportType
            }
        });
    } catch (error) {
        console.error('Gemini AI API error:', error);
        
        // Return different error messages based on error type
        if (error.message.includes('Firebase')) {
            return NextResponse.json({ 
                error: 'Authentication service unavailable',
                details: 'Please check Firebase configuration'
            }, { status: 503 });
        } else if (error.message.includes('Gemini')) {
            return NextResponse.json({ 
                error: 'AI service unavailable',
                details: 'Please check Gemini API configuration'
            }, { status: 503 });
        } else {
            return NextResponse.json({ 
                error: 'Internal server error',
                details: error.message
            }, { status: 500 });
        }
    }
}

export async function GET(req) {
    try {
        // Authenticate request
        const token = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 });
        }

        // Initialize Firebase Admin and verify token
        const adminApp = await getFirebaseAdmin();
        const { getAuth } = await import('firebase-admin/auth');
        
        try {
            await getAuth(adminApp).verifyIdToken(token);
        } catch (authError) {
            console.error('Token verification failed:', authError);
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Test Gemini AI connection
        const genAI = getGeminiAI();
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 50,
            }
        });
        
        const result = await model.generateContent('Hello, please respond with "Connection successful"');
        const response = await result.response;
        const text = response.text();
        
        if (text && text.toLowerCase().includes('connection successful')) {
            return NextResponse.json({ 
                success: true, 
                message: 'Gemini AI is healthy',
                model: 'gemini-1.5-flash',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Unexpected response from Gemini AI');
        }
    } catch (error) {
        console.error('Gemini AI health check failed:', error);
        
        if (error.message.includes('Firebase')) {
            return NextResponse.json({ 
                error: 'Authentication service unavailable',
                details: 'Firebase configuration issue'
            }, { status: 503 });
        } else if (error.message.includes('Gemini') || error.message.includes('API key')) {
            return NextResponse.json({ 
                error: 'Gemini AI service unavailable',
                details: 'Please check Gemini API configuration'
            }, { status: 503 });
        } else {
            return NextResponse.json({ 
                error: 'Health check failed',
                details: error.message
            }, { status: 500 });
        }
    }
}