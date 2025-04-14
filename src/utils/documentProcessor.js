// utils/documentProcessor.js

/**
 * Process a document to extract requirements and generate test cases
 * @param {string} documentText - The text content of the document
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The type of the file
 * @returns {Object} - Object containing extracted requirements and test cases
 */
export async function processDocument(documentText, fileName, fileType = 'text/plain') {
    // Ensure documentText is a string
    if (typeof documentText !== 'string') {
        throw new Error('Document text must be a string');
    }

    try {
        // Extract requirements from the document text
        const requirements = extractRequirements(documentText);

        // Generate test cases based on requirements
        const testCases = await generateTestCases(requirements);

        return {
            fileName,
            fileType,
            requirements,
            testCases
        };
    } catch (error) {
        console.error('Error in document processing:', error);
        throw new Error(`Failed to process document: ${error.message}`);
    }
}

/**
 * Extract requirements from document text
 * @param {string} text - Document text
 * @returns {Array} - Array of requirement objects
 */
function extractRequirements(text) {
    // Split text into lines
    const lines = text.split('\n');

    // Initialize requirements array
    const requirements = [];

    // Basic regex patterns to identify requirements
    const requirementPatterns = [
        /requirement[s]?[:]\s*(.*)/i,
        /shall\s+(.*)/i,
        /must\s+(.*)/i,
        /should\s+(.*)/i,
        /R\d+[:.]\s*(.*)/i,
        /REQ-\d+[:.]\s*(.*)/i
    ];

    // Process each line
    lines.forEach((line, index) => {
        // Skip empty lines
        if (!line.trim()) return;

        // Check if the line contains a requirement based on patterns
        for (const pattern of requirementPatterns) {
            const match = line.match(pattern);
            if (match) {
                requirements.push({
                    id: `REQ-${requirements.length + 1}`,
                    text: line.trim(),
                    lineNumber: index + 1,
                    extracted: match[1].trim()
                });
                break;
            }
        }
    });

    // If no formal requirements found, try to extract meaningful sentences
    if (requirements.length === 0) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();
            if (trimmed.length > 20 && trimmed.length < 200) { // Reasonable sentence length
                requirements.push({
                    id: `REQ-${index + 1}`,
                    text: trimmed,
                    lineNumber: 0, // Line number unknown for extracted sentences
                    extracted: trimmed
                });
            }
        });
    }

    return requirements;
}

/**
 * Generate test cases based on requirements
 * @param {Array} requirements - Array of requirement objects
 * @returns {Array} - Array of test case objects
 */
async function generateTestCases(requirements) {
    // Generate basic test cases directly
    return requirements.map(req => {
        // Create a basic test case for each requirement
        return {
            id: `TC-${req.id.replace('REQ-', '')}`,
            requirementId: req.id,
            description: `Test for ${req.id}: ${req.extracted.substring(0, 100)}...`,
            steps: [
                {
                    number: 1,
                    description: "Setup test environment",
                    expectedResult: "Environment ready for testing"
                },
                {
                    number: 2,
                    description: `Verify the requirement: ${req.extracted.substring(0, 80)}...`,
                    expectedResult: "Requirement is met as specified"
                },
                {
                    number: 3,
                    description: "Clean up test environment",
                    expectedResult: "Environment restored to initial state"
                }
            ],
            priority: "Medium",
            status: "Proposed"
        };
    });

    // Note: For more sophisticated test case generation,
    // you can integrate with OpenAI API here.
}