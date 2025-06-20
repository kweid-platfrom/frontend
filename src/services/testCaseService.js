// services/testCaseService.js

class TestCaseService {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        this.mockData = this.generateMockData();
    }

    // Generate mock data for development
    generateMockData() {
        const statuses = ['active', 'draft', 'archived', 'review'];
        const priorities = ['low', 'medium', 'high', 'critical'];
        const assignees = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'];
        const tags = ['smoke', 'regression', 'api', 'ui', 'integration', 'performance', 'security'];

        const testCases = [];
        for (let i = 1; i <= 50; i++) {
            testCases.push({
                id: i,
                title: `Test Case ${i} - ${this.getRandomFeature()}`,
                description: `This is a comprehensive test case that verifies the functionality of ${this.getRandomFeature()}. It includes multiple scenarios and edge cases to ensure robust testing coverage.`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                assignee: assignees[Math.floor(Math.random() * assignees.length)],
                tags: this.getRandomTags(tags),
                preconditions: 'User must be logged in with appropriate permissions',
                steps: [
                    'Navigate to the application homepage',
                    'Click on the target feature/module',
                    'Enter valid test data in required fields',
                    'Click submit or save button',
                    'Verify the expected outcome occurs'
                ],
                expectedResult: 'The feature should work as expected and display appropriate success messages',
                actualResult: '',
                testData: 'username: testuser@example.com, password: Test123!',
                environment: 'QA Environment',
                browser: 'Chrome 120.0',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                createdBy: assignees[Math.floor(Math.random() * assignees.length)],
                executionHistory: this.generateExecutionHistory(),
                requirements: [`REQ-${1000 + i}`, `REQ-${2000 + Math.floor(Math.random() * 100)}`],
                automationStatus: Math.random() > 0.7 ? 'automated' : 'manual',
                estimatedTime: Math.floor(Math.random() * 60) + 5 // 5-65 minutes
            });
        }
        return testCases;
    }

    getRandomFeature() {
        const features = [
            'User Registration', 'Login Authentication', 'Password Reset', 'Profile Management',
            'Shopping Cart', 'Payment Processing', 'Order Management', 'Inventory Tracking',
            'Search Functionality', 'Filter Options', 'Data Export', 'File Upload',
            'Notification System', 'User Permissions', 'Report Generation', 'API Integration'
        ];
        return features[Math.floor(Math.random() * features.length)];
    }

    getRandomTags(tags) {
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...tags].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    generateExecutionHistory() {
        const history = [];
        const executionCount = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < executionCount; i++) {
            history.push({
                id: Date.now() + i,
                executedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                executedBy: 'John Doe',
                result: Math.random() > 0.3 ? 'passed' : 'failed',
                notes: Math.random() > 0.3 ? 'Test executed successfully' : 'Minor issue found, needs investigation',
                duration: Math.floor(Math.random() * 30) + 5 // 5-35 minutes
            });
        }
        
        return history.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
    }

    // Simulate API delay
    async delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get all test cases
    async getTestCases() {
        await this.delay();
        
        try {
            // In a real application, this would be an API call
            // const response = await fetch(`${this.baseUrl}/test-cases`, {
            //     method: 'GET',
            //     headers: { 'Content-Type': 'application/json' }
            // });
            // return await response.json();
            
            return this.mockData;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Get single test case
    async getTestCase(id) {
        await this.delay();
        
        try {
            const testCase = this.mockData.find(tc => tc.id === parseInt(id));
            if (!testCase) {
                throw new Error('Test case not found');
            }
            return testCase;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Create new test case
    async createTestCase(testCaseData) {
        await this.delay();
        
        try {
            const newTestCase = {
                id: Math.max(...this.mockData.map(tc => tc.id)) + 1,
                ...testCaseData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Current User',
                executionHistory: [],
                automationStatus: testCaseData.automationStatus || 'manual'
            };
            
            this.mockData.push(newTestCase);
            return newTestCase;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Update test case
    async updateTestCase(id, testCaseData) {
        await this.delay();
        
        try {
            const index = this.mockData.findIndex(tc => tc.id === parseInt(id));
            if (index === -1) {
                throw new Error('Test case not found');
            }
            
            this.mockData[index] = {
                ...this.mockData[index],
                ...testCaseData,
                updatedAt: new Date().toISOString()
            };
            
            return this.mockData[index];
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Delete test case
    async deleteTestCase(id) {
        await this.delay();
        
        try {
            const index = this.mockData.findIndex(tc => tc.id === parseInt(id));
            if (index === -1) {
                throw new Error('Test case not found');
            }
            
            this.mockData.splice(index, 1);
            return { success: true };
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Bulk operations
    async bulkDelete(ids) {
        await this.delay();
        
        try {
            const idsToDelete = ids.map(id => parseInt(id));
            this.mockData = this.mockData.filter(tc => !idsToDelete.includes(tc.id));
            return { success: true, deletedCount: ids.length };
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    async bulkUpdateStatus(ids, status) {
        await this.delay();
        
        try {
            const idsToUpdate = ids.map(id => parseInt(id));
            this.mockData.forEach(tc => {
                if (idsToUpdate.includes(tc.id)) {
                    tc.status = status;
                    tc.updatedAt = new Date().toISOString();
                }
            });
            return { success: true, updatedCount: ids.length };
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    async bulkCreate(testCases) {
        await this.delay();
        
        try {
            const maxId = Math.max(...this.mockData.map(tc => tc.id));
            const newTestCases = testCases.map((tc, index) => ({
                ...tc,
                id: maxId + index + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'Current User',
                executionHistory: [],
                automationStatus: tc.automationStatus || 'manual'
            }));
            
            this.mockData.push(...newTestCases);
            return newTestCases;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Execute test case
    async executeTestCase(id, executionData) {
        await this.delay();
        
        try {
            const testCase = this.mockData.find(tc => tc.id === parseInt(id));
            if (!testCase) {
                throw new Error('Test case not found');
            }
            
            const execution = {
                id: Date.now(),
                executedAt: new Date().toISOString(),
                executedBy: 'Current User',
                result: executionData.result,
                notes: executionData.notes || '',
                duration: executionData.duration || 0,
                actualResult: executionData.actualResult || ''
            };
            
            testCase.executionHistory = testCase.executionHistory || [];
            testCase.executionHistory.unshift(execution);
            testCase.updatedAt = new Date().toISOString();
            
            return execution;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Get traceability matrix data
    async getTraceabilityMatrix() {
        await this.delay();
        
        try {
            const matrix = this.mockData.map(tc => ({
                testCaseId: tc.id,
                testCaseTitle: tc.title,
                requirements: tc.requirements || [],
                status: tc.status,
                priority: tc.priority,
                lastExecution: tc.executionHistory?.[0] || null,
                coverage: tc.requirements?.length > 0 ? 'covered' : 'not_covered'
            }));
            
            return matrix;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Get requirements for traceability
    async getRequirements() {
        await this.delay();
        
        try {
            // Mock requirements data
            const requirements = [];
            for (let i = 1001; i <= 1050; i++) {
                requirements.push({
                    id: `REQ-${i}`,
                    title: `Requirement ${i} - ${this.getRandomFeature()}`,
                    description: `This requirement defines the expected behavior for ${this.getRandomFeature()}`,
                    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                    status: ['draft', 'approved', 'implemented'][Math.floor(Math.random() * 3)],
                    testCases: this.mockData
                        .filter(tc => tc.requirements?.includes(`REQ-${i}`))
                        .map(tc => ({ id: tc.id, title: tc.title }))
                });
            }
            
            return requirements;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Link test case to requirement
    async linkRequirement(testCaseId, requirementId) {
        await this.delay();
        
        try {
            const testCase = this.mockData.find(tc => tc.id === parseInt(testCaseId));
            if (!testCase) {
                throw new Error('Test case not found');
            }
            
            testCase.requirements = testCase.requirements || [];
            if (!testCase.requirements.includes(requirementId)) {
                testCase.requirements.push(requirementId);
                testCase.updatedAt = new Date().toISOString();
            }
            
            return testCase;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Unlink requirement from test case
    async unlinkRequirement(testCaseId, requirementId) {
        await this.delay();
        
        try {
            const testCase = this.mockData.find(tc => tc.id === parseInt(testCaseId));
            if (!testCase) {
                throw new Error('Test case not found');
            }
            
            testCase.requirements = testCase.requirements?.filter(req => req !== requirementId) || [];
            testCase.updatedAt = new Date().toISOString();
            
            return testCase;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }

    // Get test execution statistics
    async getExecutionStats() {
        await this.delay();
        
        try {
            const stats = {
                total: this.mockData.length,
                passed: 0,
                failed: 0,
                notExecuted: 0,
                automated: 0,
                manual: 0,
                byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
                byStatus: { active: 0, draft: 0, archived: 0, review: 0 }
            };
            
            this.mockData.forEach(tc => {
                // Execution status
                const lastExecution = tc.executionHistory?.[0];
                if (!lastExecution) {
                    stats.notExecuted++;
                } else if (lastExecution.result === 'passed') {
                    stats.passed++;
                } else {
                    stats.failed++;
                }
                
                // Automation
                if (tc.automationStatus === 'automated') {
                    stats.automated++;
                } else {
                    stats.manual++;
                }
                
                // Priority
                stats.byPriority[tc.priority]++;
                
                // Status
                stats.byStatus[tc.status]++;
            });
            
            return stats;
        } catch {
            throw new Error('Failed to fetch execution statistics');
        }
    }
}

// Export singleton instance
export const testCaseService = new TestCaseService();