// utils/testAnalysis.js

/**
 * Analyzes a test case to determine if it's suitable for automation
 * @param {Object} testCase - The test case to analyze
 * @returns {string} - Automation recommendation
 */
export function analyzeTestCaseForAutomation(testCase) {
    // Track complexity factors
    const complexityFactors = {
        stepsCount: 0,
        hasConditionalLogic: false,
        hasUserInteraction: false,
        hasVisualVerification: false,
        isDataDriven: false
    };

    // Analyze steps
    if (testCase.steps) {
        const steps = testCase.steps.split('\n').filter(step => step.trim().length > 0);
        complexityFactors.stepsCount = steps.length;

        // Look for conditional logic keywords
        const conditionalKeywords = ['if', 'when', 'case', 'depending', 'based on', 'condition'];
        complexityFactors.hasConditionalLogic = conditionalKeywords.some(keyword =>
            testCase.steps.toLowerCase().includes(keyword)
        );

        // Look for user interaction keywords
        const userInteractionKeywords = ['click', 'select', 'enter', 'input', 'type', 'drag', 'drop'];
        complexityFactors.hasUserInteraction = userInteractionKeywords.some(keyword =>
            testCase.steps.toLowerCase().includes(keyword)
        );

        // Look for visual verification indicators
        const visualVerificationKeywords = ['appears', 'visual', 'layout', 'look', 'style', 'color', 'position'];
        complexityFactors.hasVisualVerification = visualVerificationKeywords.some(keyword =>
            testCase.steps.toLowerCase().includes(keyword) ||
            (testCase.expectedResult && testCase.expectedResult.toLowerCase().includes(keyword))
        );

        // Check for data-driven indicators
        const dataDrivenKeywords = ['for each', 'multiple', 'various', 'different', 'data set'];
        complexityFactors.isDataDriven = dataDrivenKeywords.some(keyword =>
            testCase.steps.toLowerCase().includes(keyword) ||
            (testCase.description && testCase.description.toLowerCase().includes(keyword))
        );
    }

    // Make recommendation based on analysis
    if (complexityFactors.hasVisualVerification && complexityFactors.hasConditionalLogic) {
        return "Manual Testing Recommended: Test requires visual verification and complex conditional logic";
    }
    else if (complexityFactors.hasVisualVerification) {
        return "Visual Automation Recommended: Test requires visual verification, consider tools with image comparison";
    }
    else if (complexityFactors.stepsCount <= 3 && !complexityFactors.hasConditionalLogic) {
        return "Automation Recommended: Simple test case suitable for automation";
    }
    else if (complexityFactors.hasUserInteraction && !complexityFactors.hasConditionalLogic) {
        return "UI Automation Recommended: Test involves user interaction with straightforward flow";
    }
    else if (complexityFactors.isDataDriven) {
        return "Data-Driven Automation Recommended: Test involves multiple data scenarios";
    }
    else if (complexityFactors.stepsCount > 10) {
        return "Complex Automation Required: Test has many steps, consider breaking down or automating in sections";
    }

    return "Automation Candidate: Standard complexity, suitable for automation";
}

/**
 * Extracts requirements from document text using NLP techniques
 * @param {string} documentText - The raw text content of the document
 * @returns {Array} - Array of extracted requirements
 */
export function extractRequirements(documentText) {
    const requirements = [];
    const requirementId = 1;

    // Split document into sections/paragraphs
    const paragraphs = documentText.split(/\n\s*\n/);

    // Look for requirement patterns in each paragraph
    paragraphs.forEach((paragraph) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return;

        // Check if paragraph contains requirement indicators
        const hasRequirementKeywords = /must|shall|should|will|needs to|required to|ability to/i.test(paragraph);
        const hasNumberedPoint = /^\s*(\d+\.|\[\d+\]|\(\d+\))/m.test(paragraph);
        const hasBulletPoint = /^\s*[\-\*•]/m.test(paragraph);

        if (hasRequirementKeywords || hasNumberedPoint || hasBulletPoint) {
            const title = extractRequirementTitle(paragraph);
            const description = paragraph.trim();
            const priority = determinePriority(paragraph);

            requirements.push({
                id: `REQ-${requirementId++}`,
                title,
                description,
                priority,
            });
        }
    });

    return requirements;
}

/**
 * Extracts a title from a requirement paragraph
 * @param {string} paragraph - The requirement paragraph
 * @returns {string} - Extracted title
 */
function extractRequirementTitle(paragraph) {
    // Try to extract the first sentence or line for the title
    const firstSentenceMatch = paragraph.match(/^[^.!?]+[.!?]/);
    if (firstSentenceMatch) {
        let title = firstSentenceMatch[0].trim();
        // Limit title length
        return title.length > 70 ? title.substring(0, 67) + '...' : title;
    }

    // Fall back to first line if no sentence found
    const firstLine = paragraph.split('\n')[0].trim();
    return firstLine.length > 70 ? firstLine.substring(0, 67) + '...' : firstLine;
}

/**
 * Determines the priority of a requirement based on keyword analysis
 * @param {string} text - The requirement text
 * @returns {string} - Priority level
 */
function determinePriority(text) {
    const lowercaseText = text.toLowerCase();

    // Critical/High priority indicators
    if (/critical|highest|must|essential|mandatory|required|crucial|necessary/i.test(lowercaseText)) {
        return "High";
    }

    // Medium priority indicators
    if (/should|important|significant|moderate|recommended/i.test(lowercaseText)) {
        return "Medium";
    }

    // Low priority indicators
    if (/may|could|nice to have|optional|if possible|consider|future|enhancement/i.test(lowercaseText)) {
        return "Low";
    }

    // Default priority
    return "Medium";
}

/**
 * Generates test cases from requirements
 * @param {Array} requirements - Array of requirement objects
 * @returns {Array} - Array of generated test cases
 */
export function generateTestCases(requirements) {
    const testCases = [];

    requirements.forEach(requirement => {
        // Generate functional verification test
        const functionalTest = generateFunctionalTest(requirement);
        if (functionalTest) testCases.push(functionalTest);

        // Generate edge case test if applicable
        const edgeCaseTest = generateEdgeCaseTest(requirement);
        if (edgeCaseTest) testCases.push(edgeCaseTest);

        // Generate negative test if applicable
        const negativeTest = generateNegativeTest(requirement);
        if (negativeTest) testCases.push(negativeTest);
    });

    return testCases;
}

/**
 * Generates a functional verification test case from a requirement
 * @param {Object} requirement - The requirement object
 * @returns {Object} - Generated test case
 */
function generateFunctionalTest(requirement) {
    return {
        title: `Verify ${requirement.title}`,
        description: `Test to verify that the system correctly implements: ${requirement.description}`,
        priority: requirement.priority,
        steps: generateTestSteps(requirement),
        expectedResult: generateExpectedResult(requirement),
        requirementId: requirement.id
    };
}

/**
 * Generates an edge case test from a requirement if applicable
 * @param {Object} requirement - The requirement object
 * @returns {Object|null} - Generated test case or null if not applicable
 */
function generateEdgeCaseTest(requirement) {
    // Only generate edge case tests for certain types of requirements
    const hasInputs = /input|enter|field|form|value|data|upload|select/i.test(requirement.description);
    const hasLimits = /maximum|minimum|limit|threshold|capacity|boundary|at least|at most/i.test(requirement.description);

    if (hasInputs || hasLimits) {
        return {
            title: `Edge Case Test: ${requirement.title}`,
            description: `Test to verify system behavior at boundary conditions for: ${requirement.description}`,
            priority: adjustPriority(requirement.priority, -1), // Lower priority than functional test
            steps: generateEdgeCaseSteps(requirement),
            expectedResult: "System handles edge cases gracefully without errors or unexpected behavior",
            requirementId: requirement.id
        };
    }

    return null;
}

/**
 * Generates a negative test from a requirement if applicable
 * @param {Object} requirement - The requirement object
 * @returns {Object|null} - Generated test case or null if not applicable
 */
function generateNegativeTest(requirement) {
    // Only generate negative tests for certain types of requirements
    const hasValidation = /valid|invalid|check|verif|confirm|authent|authoriz|permiss|access/i.test(requirement.description);
    const hasInputs = /input|enter|field|form|value|data|upload|select/i.test(requirement.description);

    if (hasValidation || hasInputs) {
        return {
            title: `Negative Test: ${requirement.title}`,
            description: `Test to verify system behavior with invalid inputs or unauthorized actions for: ${requirement.description}`,
            priority: adjustPriority(requirement.priority, -1), // Lower priority than functional test
            steps: generateNegativeTestSteps(requirement),
            expectedResult: "System rejects invalid input or unauthorized actions with appropriate error messages",
            requirementId: requirement.id
        };
    }

    return null;
}

/**
 * Adjusts a priority level up or down
 * @param {string} priority - Original priority
 * @param {number} adjustment - Adjustment factor (-1 to lower, 1 to increase)
 * @returns {string} - Adjusted priority
 */
function adjustPriority(priority, adjustment) {
    const priorityLevels = ["Low", "Medium", "High"];
    const currentIndex = priorityLevels.indexOf(priority);

    if (currentIndex === -1) return priority;

    const newIndex = Math.max(0, Math.min(priorityLevels.length - 1, currentIndex + adjustment));
    return priorityLevels[newIndex];
}

/**
 * Generates test steps for a functional test
 * @param {Object} requirement - The requirement object
 * @returns {string} - Generated test steps
 */
function generateTestSteps(requirement) {
    // Extract key verbs and nouns from requirement
    const description = requirement.description.toLowerCase();

    let steps = "1. Set up test environment and prerequisites\n";

    // Add steps based on common actions in the requirement
    if (/login|authenticate|sign in/i.test(description)) {
        steps += "2. Login to the system with valid credentials\n";
    }

    if (/create|add|new|insert/i.test(description)) {
        steps += "3. Navigate to the relevant section\n";
        steps += "4. Create a new item with required information\n";
        steps += "5. Submit or save the information\n";
    } else if (/edit|update|modify|change/i.test(description)) {
        steps += "3. Navigate to the relevant section\n";
        steps += "4. Select an existing item to modify\n";
        steps += "5. Update the information\n";
        steps += "6. Save the changes\n";
    } else if (/delete|remove/i.test(description)) {
        steps += "3. Navigate to the relevant section\n";
        steps += "4. Select an existing item to delete\n";
        steps += "5. Confirm deletion\n";
    } else if (/search|find|filter/i.test(description)) {
        steps += "3. Navigate to the search function\n";
        steps += "4. Enter search criteria\n";
        steps += "5. Execute the search\n";
    } else if (/display|show|view|present/i.test(description)) {
        steps += "3. Navigate to the relevant section\n";
        steps += "4. Verify the information is displayed correctly\n";
    } else if (/export|download|report/i.test(description)) {
        steps += "3. Navigate to the export/report section\n";
        steps += "4. Select export parameters or report type\n";
        steps += "5. Execute the export/report generation\n";
    } else if (/upload|import/i.test(description)) {
        steps += "3. Navigate to the upload/import function\n";
        steps += "4. Select a valid file to upload/import\n";
        steps += "5. Execute the upload/import process\n";
    } else {
        steps += "3. Navigate to the relevant section\n";
        steps += "4. Perform the required action\n";
        steps += "5. Verify the results\n";
    }

    steps += "6. Verify that the action is completed successfully\n";
    steps += "7. Verify that all related data is updated correctly";

    return steps;
}

/**
 * Generates test steps for an edge case test
 * @param {Object} requirement - The requirement object
 * @returns {string} - Generated edge case test steps
 */
function generateEdgeCaseSteps(requirement) {
    const description = requirement.description.toLowerCase();

    let steps = "1. Set up test environment and prerequisites\n";

    if (/maximum|limit|capacity|threshold/i.test(description)) {
        steps += "2. Identify the maximum limit specified in the requirement\n";
        steps += "3. Prepare test data at exactly the maximum limit\n";
        steps += "4. Execute the operation with maximum limit data\n";
        steps += "5. Verify system behavior\n";
        steps += "6. Prepare test data slightly exceeding the maximum limit\n";
        steps += "7. Execute the operation with data exceeding the limit\n";
    } else if (/minimum/i.test(description)) {
        steps += "2. Identify the minimum value specified in the requirement\n";
        steps += "3. Prepare test data at exactly the minimum value\n";
        steps += "4. Execute the operation with minimum value data\n";
        steps += "5. Verify system behavior\n";
        steps += "6. Prepare test data slightly below the minimum value\n";
        steps += "7. Execute the operation with data below the minimum\n";
    } else {
        steps += "2. Identify boundary conditions in the requirement\n";
        steps += "3. Prepare test data at the boundary condition\n";
        steps += "4. Execute the operation with boundary condition data\n";
        steps += "5. Verify system behavior\n";
        steps += "6. Prepare test data beyond the boundary condition\n";
        steps += "7. Execute the operation with data beyond the boundary\n";
    }

    steps += "8. Verify system response at edge cases";

    return steps;
}

/**
 * Generates test steps for a negative test
 * @param {Object} requirement - The requirement object
 * @returns {string} - Generated negative test steps
 */
function generateNegativeTestSteps(requirement) {
    const description = requirement.description.toLowerCase();

    let steps = "1. Set up test environment and prerequisites\n";

    steps += "2. Identify expected valid input or action\n";
    steps += "3. Prepare invalid or unauthorized input/action\n";
    steps += "4. Attempt to execute the action with invalid data\n";
    steps += "5. Verify the system rejects the input and shows appropriate error messages";

    return steps;

    if (/login|authenticate|sign in|authoriz|permiss|access/i.test(description)) {
        steps += "2. Attempt to access the function with invalid credentials or insufficient permissions\n";
        steps += "3. Verify that access is denied with appropriate error message\n";
    } else if (/input|enter|field|form|value|data/i.test(description)) {
        steps += "2. Navigate to the relevant section\n";
        steps += "3. Prepare invalid data (e.g., wrong format, out of range values)\n";
        steps += "4. Attempt to submit the invalid data\n";
        steps += "5. Verify that the system rejects the invalid data with appropriate error message\n";
    } else if (/upload|import/i.test(description)) {
        steps += "2. Navigate to the upload/import function\n";
        steps += "3. Prepare invalid file (wrong format, corrupted, or oversized)\n";
        steps += "4. Attempt to upload/import the invalid file\n";
        steps += "5. Verify that the system rejects the file with appropriate error message\n";
    } else {
        steps += "2. Identify potential negative scenarios for the requirement\n";
        steps += "3. Attempt to perform operation with invalid inputs or preconditions\n";
        steps += "4. Verify that the system handles the negative scenario appropriately\n";
    }

    steps += "6. Verify that the system remains in a stable state after rejected operations";

    return steps;
}

/**
 * Generates expected result for a test case
 * @param {Object} requirement - The requirement object
 * @returns {string} - Generated expected result
 */
function generateExpectedResult(requirement) {
    const description = requirement.description.toLowerCase();

    if (/create|add|new|insert/i.test(description)) {
        return "New item is created successfully and appears in the system with all information correctly saved";
    } else if (/edit|update|modify|change/i.test(description)) {
        return "Information is updated successfully and changes are correctly saved in the system";
    } else if (/delete|remove/i.test(description)) {
        return "Item is successfully deleted and no longer appears in the system";
    } else if (/search|find|filter/i.test(description)) {
        return "Search results are displayed correctly and match the search criteria";
    } else if (/display|show|view|present/i.test(description)) {
        return "Information is displayed correctly and completely according to requirements";
    } else if (/export|download|report/i.test(description)) {
        return "File is exported/downloaded successfully and contains the correct information";
    } else if (/upload|import/i.test(description)) {
        return "File is uploaded/imported successfully and data is correctly processed";
    } else if (/login|authenticate|sign in/i.test(description)) {
        return "User is successfully authenticated and granted appropriate access to the system";
    }

    return "System performs the required action successfully and meets the specified requirement";
}