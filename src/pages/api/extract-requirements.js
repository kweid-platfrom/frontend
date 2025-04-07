// pages/api/extract-requirements.js
import { extractRequirements, generateTestCases } from '../../utils/testAnalysis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileContent, fileName } = req.body;

        if (!fileContent) {
            return res.status(400).json({ error: 'No file content provided' });
        }

        // Step 1: Extract requirements using NLP
        const requirements = extractRequirements(fileContent);

        if (requirements.length === 0) {
            return res.status(404).json({
                error: 'No requirements found in the document',
                requirements: [],
                testCases: []
            });
        }

        // Step 2: Generate test cases from requirements
        const testCases = generateTestCases(requirements);

        // Return the structured data
        return res.status(200).json({
            fileName,
            requirements,
            testCases,
            stats: {
                requirementsCount: requirements.length,
                testCasesCount: testCases.length,
                highPriorityRequirements: requirements.filter(req => req.priority === 'High').length,
                mediumPriorityRequirements: requirements.filter(req => req.priority === 'Medium').length,
                lowPriorityRequirements: requirements.filter(req => req.priority === 'Low').length
            }
        });
    } catch (error) {
        console.error('Error processing document:', error);
        return res.status(500).json({ error: 'Error processing document' });
    }
}