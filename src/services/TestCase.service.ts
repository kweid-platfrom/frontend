// services/testCase.service.ts

import {
    TestCase,
    TestCaseFilters,
    TestCaseBulkAction,
    TestCaseFormData,
    TestCaseMetrics,
    TestCaseStatus,
} from '../types/TestCase.types';

export class TestCaseService {
    private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    // CRUD Operations
    async createTestCase(data: TestCaseFormData): Promise<TestCase> {
        const response = await fetch(`${this.baseUrl}/test-cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to create test case');
        }

        return response.json();
    }

    async getTestCases(filters?: TestCaseFilters): Promise<{
        data: TestCase[];
        total: number;
        page: number;
        limit: number;
    }> {
        const queryParams = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        queryParams.append(key, value.join(','));
                    } else if (typeof value === 'object' && 'start' in value) {
                        queryParams.append(`${key}_start`, value.start.toISOString());
                        queryParams.append(`${key}_end`, value.end.toISOString());
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }

        const response = await fetch(`${this.baseUrl}/test-cases?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch test cases');
        }

        return response.json();
    }

    async getTestCaseById(id: string): Promise<TestCase> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch test case');
        }

        return response.json();
    }

    async updateTestCase(id: string, data: Partial<TestCaseFormData>): Promise<TestCase> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update test case');
        }

        return response.json();
    }

    async deleteTestCase(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete test case');
        }
    }

    // Bulk Operations
    async bulkAction(action: TestCaseBulkAction): Promise<{ success: number; failed: number }> {
        const response = await fetch(`${this.baseUrl}/test-cases/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(action)
        });

        if (!response.ok) {
            throw new Error('Failed to perform bulk action');
        }

        return response.json();
    }

    // Execution Operations
    async executeTestCase(id: string, results: {
        status: TestCaseStatus;
        actualResult?: string;
        executionTime?: number;
        steps?: Array<{ id: string; status: string; actualResult?: string }>;
    }): Promise<TestCase> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error('Failed to update test case execution');
        }

        return response.json();
    }

    // AI Operations
    async generateTestCases(prompt: string, options?: {
        category?: string;
        count?: number;
        includeEdgeCases?: boolean;
    }): Promise<TestCase[]> {
        const response = await fetch(`${this.baseUrl}/test-cases/ai-generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({ prompt, ...options })
        });

        if (!response.ok) {
            throw new Error('Failed to generate test cases');
        }

        return response.json();
    }

    async generateCypressScript(id: string): Promise<{ script: string }> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}/cypress`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate Cypress script');
        }

        return response.json();
    }

    // Import/Export Operations
    async importTestCases(file: File): Promise<{ imported: number; failed: number; errors?: string[] }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/test-cases/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to import test cases');
        }

        return response.json();
    }

    async exportTestCases(filters?: TestCaseFilters, format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
        const queryParams = new URLSearchParams({ format });

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`${this.baseUrl}/test-cases/export?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export test cases');
        }

        return response.blob();
    }

    // Metrics for Dashboard
    async getTestCaseMetrics(filters?: {
        dateRange?: { start: Date; end: Date };
        category?: string;
        assignee?: string;
    }): Promise<TestCaseMetrics> {
        const queryParams = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object' && 'start' in value) {
                        queryParams.append(`${key}_start`, value.start.toISOString());
                        queryParams.append(`${key}_end`, value.end.toISOString());
                    } else {
                        queryParams.append(key, value.toString());
                    }
                }
            });
        }

        const response = await fetch(`${this.baseUrl}/test-cases/metrics?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch test case metrics');
        }

        return response.json();
    }

    // Utility Methods
    private getAuthToken(): string {
        // This would typically come from your auth context or localStorage
        return localStorage.getItem('authToken') || '';
    }

    async duplicateTestCase(id: string): Promise<TestCase> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}/duplicate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to duplicate test case');
        }

        return response.json();
    }

    async getTestCaseHistory(id: string): Promise<Array<{
        id: string;
        action: string;
        user: string;
        timestamp: Date;
        changes: Record<string, unknown>;
    }>> {
        const response = await fetch(`${this.baseUrl}/test-cases/${id}/history`, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch test case history');
        }

        return response.json();
    }
}