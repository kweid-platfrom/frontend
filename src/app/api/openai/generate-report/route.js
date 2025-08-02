/* eslint-disable @typescript-eslint/no-unused-vars */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin only once
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        }),
    });
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
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
        } = await req.json();

        // Get Gemini model (default to gemini-pro)
        const geminiModel = genAI.getGenerativeModel({ 
            model: model || 'gemini-pro',
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
                    throw new Error('Invalid JSON response from Gemini AI');
                }
            } else {
                throw new Error('No valid JSON found in Gemini response');
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: parsedResult.summary,
                insights: parsedResult.insights,
                riskScores: parsedResult.riskScores,
                recommendations: parsedResult.recommendations,
            },
        });
    } catch (error) {
        console.error('Gemini AI API error:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to generate report with Gemini AI'
        }, { status: 500 });
    }
}

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
        // Test Gemini AI connection
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hello, please respond with "Connection successful"');
        const response = await result.response;
        const text = response.text();
        
        if (text) {
            return NextResponse.json({ success: true, message: 'Gemini AI is healthy' });
        } else {
            throw new Error('No response from Gemini AI');
        }
    } catch (error) {
        console.error('Gemini AI health check failed:', error);
        return NextResponse.json({ 
            error: 'Gemini AI API unavailable',
            details: error.message 
        }, { status: 500 });
    }
}