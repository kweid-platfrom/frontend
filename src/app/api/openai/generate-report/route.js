import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin only once
if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        }),
    });
}

const openAIClient = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

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
            Provide a JSON response with the following structure:
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

        const response = await openAIClient.chat.completions.create({
            model: model || 'gpt-4o',
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 3000,
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI assistant generating QA reports based on provided data. Return a JSON object with summary, insights, riskScores, and recommendations.',
                },
                { role: 'user', content: prompt },
            ],
        });

        const result = JSON.parse(response.choices[0].message.content);
        return NextResponse.json({
            success: true,
            data: {
                summary: result.summary,
                insights: result.insights,
                riskScores: result.riskScores,
                recommendations: result.recommendations,
            },
        });
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}