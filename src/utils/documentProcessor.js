// utils/documentProcessor.js
import { extractRequirements, generateTestCases, analyzeTestCaseForAutomation } from './testAnalysis';
import documentAnalyzer from './documentAnalyzer';

/**
 * Process a document and generate test cases
 * @param {string} documentContent - The text content of the document
 * @param {string} fileName - Name of the uploaded file
 * @returns {Object} - Extracted requirements and generated test cases
 */
export async function processDocument(documentContent, fileName) {
    try {
        // 🔒 Ensure the content is a string
        if (typeof documentContent !== 'string') {
            documentContent = String(documentContent);
        }

        let requirements;

        if (documentContent.length > 1000) {
            const analysisResult = await documentAnalyzer.analyzeDocument(documentContent);
            requirements = analysisResult.requirements.all;
        } else {
            requirements = extractRequirements(documentContent);
        }

        const testCases = generateTestCases(requirements);

        const testCasesWithAutomation = testCases.map(testCase => ({
            ...testCase,
            automationRecommendation: analyzeTestCaseForAutomation(testCase)
        }));

        return {
            requirements,
            testCases: testCasesWithAutomation,
            metadata: {
                fileName,
                processedDate: new Date().toISOString(),
                requirementsCount: requirements.length,
                testCasesCount: testCases.length
            }
        };
    } catch (error) {
        console.error('Error processing document:', error);
        throw new Error(`Failed to process document: ${error.message}`);
    }
}
