// services/testCaseService.js
/**
 * Service for managing test cases with Prisma API
 */
export const addTestCase = async (testCase) => {
    try {
        // Prepare the test case data for the API
        const formattedTestCase = {
            title: testCase.title,
            description: testCase.description,
            priority: testCase.priority,
            steps: testCase.steps,
            expectedResult: testCase.expectedResult,
            requirementId: testCase.requirementId || null,
            status: testCase.status || 'draft',
            testType: testCase.testType || '',
            testEnvironment: testCase.testEnvironment || '',
            execution: testCase.execution || 'manual',
            module: testCase.module || '',
            assignedTo: testCase.assignedTo || '',
            organizationId: testCase.organizationId || '',
            testSteps: Array.isArray(testCase.testSteps) ? testCase.testSteps :
                (testCase.steps ? testCase.steps.split('\n').filter(step => step.trim()) : []),
            isAutomated: testCase.isAutomated || false,
            executionSteps: testCase.executionSteps || '',
            tags: Array.isArray(testCase.tags) ? testCase.tags :
                (typeof testCase.tags === 'string' ? testCase.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []),
            createdBy: testCase.createdBy || '',
            createdAt: testCase.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Call the API endpoint
        const response = await fetch('/api/test-cases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ testCases: [formattedTestCase] }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add test case');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding test case:', error);
        throw error;
    }
};

export const getTestCases = async (filters = {}) => {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const response = await fetch(`/api/test-cases?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch test cases');
        }

        const data = await response.json();
        return data.testCases;
    } catch (error) {
        console.error('Error fetching test cases:', error);
        throw error;
    }
};

export const updateTestCase = async (id, testCase) => {
    try {
        const response = await fetch(`/api/test-cases/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ testCase }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update test case');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating test case:', error);
        throw error;
    }
};

export const deleteTestCase = async (id) => {
    try {
        const response = await fetch(`/api/test-cases/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete test case');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting test case:', error);
        throw error;
    }
};