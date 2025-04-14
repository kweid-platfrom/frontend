// pages/api/test-cases.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    // Handle GET request - fetch test cases
    if (req.method === 'GET') {
        try {
            const query = {};
            
            // Add filters from query params if provided
            if (req.query.status) query.status = req.query.status;
            if (req.query.priority) query.priority = req.query.priority;
            if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
            if (req.query.organizationId) query.organizationId = req.query.organizationId;
            
            const testCases = await prisma.testCase.findMany({
                where: query,
                orderBy: { createdAt: 'desc' },
            });
            
            return res.status(200).json({ testCases });
        } catch (error) {
            console.error('Error fetching test cases:', error);
            return res.status(500).json({ error: 'Error fetching test cases' });
        }
    }
    
    // Handle POST request - create test cases
    if (req.method === 'POST') {
        try {
            const { testCases } = req.body;

            if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
                return res.status(400).json({ error: 'No valid test cases provided' });
            }

            // Process tags to ensure they're stored correctly
            const formattedTestCases = testCases.map(testCase => {
                // Convert tags array to string for storage if needed
                const tagsValue = Array.isArray(testCase.tags) 
                    ? testCase.tags.join(',') 
                    : testCase.tags;
                
                // Convert testSteps array to string if needed
                const stepsValue = Array.isArray(testCase.testSteps) 
                    ? testCase.testSteps 
                    : (testCase.steps ? testCase.steps.split('\n').filter(step => step.trim()) : []);
                
                return {
                    title: testCase.title,
                    description: testCase.description || '',
                    priority: testCase.priority || 'P2',
                    steps: testCase.steps || '',
                    expectedResult: testCase.expectedResult || '',
                    requirementId: testCase.requirementId || null,
                    status: testCase.status || 'draft',
                    testType: testCase.testType || '',
                    testEnvironment: testCase.testEnvironment || '',
                    execution: testCase.execution || 'manual',
                    module: testCase.module || '',
                    assignedTo: testCase.assignedTo || '',
                    organizationId: testCase.organizationId || '',
                    testSteps: stepsValue,
                    isAutomated: testCase.isAutomated || false,
                    executionSteps: testCase.executionSteps || '',
                    tags: tagsValue,
                    createdBy: testCase.createdBy || '',
                    createdAt: new Date(testCase.createdAt) || new Date(),
                    updatedAt: new Date()
                };
            });

            // Save test cases to database
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

    // Handle PUT request - update a test case
    if (req.method === 'PUT') {
        try {
            const id = req.query.id;
            const { testCase } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Test case ID is required' });
            }

            // Process tags
            const tagsValue = Array.isArray(testCase.tags) 
                ? testCase.tags.join(',') 
                : testCase.tags;
            
            // Process test steps
            const stepsValue = Array.isArray(testCase.testSteps) 
                ? testCase.testSteps 
                : (testCase.steps ? testCase.steps.split('\n').filter(step => step.trim()) : []);

            const updatedTestCase = await prisma.testCase.update({
                where: { id },
                data: {
                    title: testCase.title,
                    description: testCase.description || '',
                    priority: testCase.priority || 'P2',
                    steps: testCase.steps || '',
                    expectedResult: testCase.expectedResult || '',
                    requirementId: testCase.requirementId || null,
                    status: testCase.status || 'draft',
                    testType: testCase.testType || '',
                    testEnvironment: testCase.testEnvironment || '',
                    execution: testCase.execution || 'manual',
                    module: testCase.module || '',
                    assignedTo: testCase.assignedTo || '',
                    testSteps: stepsValue,
                    isAutomated: testCase.isAutomated || false,
                    executionSteps: testCase.executionSteps || '',
                    tags: tagsValue,
                    updatedAt: new Date()
                }
            });

            return res.status(200).json({
                message: 'Test case updated successfully',
                testCase: updatedTestCase
            });
        } catch (error) {
            console.error('Error updating test case:', error);
            return res.status(500).json({ error: 'Error updating test case' });
        }
    }

    // Handle DELETE request - delete a test case
    if (req.method === 'DELETE') {
        try {
            const id = req.query.id;

            if (!id) {
                return res.status(400).json({ error: 'Test case ID is required' });
            }

            await prisma.testCase.delete({
                where: { id }
            });

            return res.status(200).json({
                message: 'Test case deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting test case:', error);
            return res.status(500).json({ error: 'Error deleting test case' });
        }
    }

    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
}