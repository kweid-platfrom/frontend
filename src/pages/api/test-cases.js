// pages/api/test-cases.js
import { PrismaClient } from '@prisma/client'; // Assuming Prisma is used for database operations

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { testCases } = req.body;

        if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
            return res.status(400).json({ error: 'No valid test cases provided' });
        }

        // Prepare test cases for database insertion
        const formattedTestCases = testCases.map(testCase => ({
            title: testCase.title,
            description: testCase.description,
            priority: testCase.priority,
            steps: testCase.steps,
            expectedResult: testCase.expectedResult,
            requirementId: testCase.requirementId,
            automationRecommendation: testCase.automationRecommendation,
            status: 'Draft', // Default status
            createdBy: req.session?.userId || 'system', // Get user from session if available
            createdAt: new Date()
        }));

        // Save test cases to database
        // Note: In a real application, you might want to use a transaction here
        const savedTestCases = await prisma.testCase.createMany({
            data: formattedTestCases,
        });

        return res.status(201).json({
            message: 'Test cases saved successfully',
            count: savedTestCases.count,
        });
    } catch (error) {
        console.error('Error saving test cases:', error);
        return res.status(500).json({ error: 'Error saving test cases' });
    }
}