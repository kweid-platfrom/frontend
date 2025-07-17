'use client'

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { SuiteProvider, useSuite } from '@/contexts/SuiteContext';
import PageLayout from '@/components/layout/PageLayout';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import AIGenerationModal from '@/components/testCase/AIGenerationModal';
import TraceabilityComponent from '@/components/testCase/TraceabilityMatrix';
import testCaseService from '@/services/testCaseService';

function TestCasesPageContent() {
    const { addNotification, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const [testCases, setTestCases] = useState([]);
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        search: ''
    });

    const loadTestCases = useCallback(async () => {
        if (!activeSuite?.id) {
            setTestCases([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const result = await testCaseService.getTestCases(activeSuite.id);
            if (result.success) {
                setTestCases(result.data.map(tc => ({
                    ...tc,
                    createdAt: tc.created_at?.toDate ? tc.created_at.toDate() : null,
                    updatedAt: tc.updated_at?.toDate ? tc.updated_at.toDate() : null
                })));
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: result.error.message || 'Failed to load test cases'
                });
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to load test cases'
            });
        } finally {
            setLoading(false);
        }
    }, [activeSuite?.id, addNotification]);

    const applyFilters = useCallback(() => {
        let filtered = [...testCases];

        if (filters.search) {
            filtered = filtered.filter(tc =>
                tc.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                tc.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
                tc.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(tc => tc.status === filters.status);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter(tc => tc.priority === filters.priority);
        }

        if (filters.assignee !== 'all') {
            filtered = filtered.filter(tc => tc.assignee === filters.assignee);
        }

        if (filters.tags.length > 0) {
            filtered = filtered.filter(tc =>
                filters.tags.some(tag => tc.tags?.includes(tag))
            );
        }

        setFilteredTestCases(filtered);
    }, [testCases, filters]);

    const handleSaveTestCase = useCallback(async (testCaseData) => {
        try {
            const result = selectedTestCase
                ? await testCaseService.updateTestCase(activeSuite.id, selectedTestCase.id, testCaseData)
                : await testCaseService.createTestCase(activeSuite.id, testCaseData);
            if (result.success) {
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: selectedTestCase ? 'Test case updated successfully' : 'Test case created successfully'
                });
                setIsModalOpen(false);
                await loadTestCases();
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: result.error.message || 'Failed to save test case'
                });
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to save test case'
            });
        }
    }, [activeSuite?.id, selectedTestCase, addNotification, loadTestCases]);

    useEffect(() => {
        if (!appLoading && !suiteLoading) {
            loadTestCases();
        }
    }, [appLoading, suiteLoading, loadTestCases]);

    useEffect(() => {
        applyFilters();
    }, [testCases, filters, applyFilters]);

    const handleCreateTestCase = () => {
        if (!activeSuite?.id) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Please select a suite first'
            });
            return;
        }
        setSelectedTestCase(null);
        setIsModalOpen(true);
    };

    const handleEditTestCase = (testCase) => {
        setSelectedTestCase(testCase);
        setIsModalOpen(true);
    };

    const handleDeleteTestCase = async (id) => {
        if (window.confirm('Are you sure you want to delete this test case?')) {
            try {
                const result = await testCaseService.deleteTestCase(activeSuite.id, id);
                if (result.success) {
                    await loadTestCases();
                    addNotification({
                        type: 'success',
                        title: 'Success',
                        message: 'Test case deleted successfully'
                    });
                } else {
                    addNotification({
                        type: 'error',
                        title: 'Error',
                        message: result.error.message || 'Failed to delete test case'
                    });
                }
            } catch {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to delete test case'
                });
            }
        }
    };

    const handleDuplicateTestCase = async (testCase) => {
        try {
            const duplicatedTestCase = {
                ...testCase,
                title: `${testCase.title} (Copy)`,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined
            };
            const result = await testCaseService.createTestCase(activeSuite.id, duplicatedTestCase);
            if (result.success) {
                await loadTestCases();
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Test case duplicated successfully'
                });
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: result.error.message || 'Failed to duplicate test case'
                });
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to duplicate test case'
            });
        }
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            let result;
            if (action === 'delete') {
                result = await testCaseService.bulkDelete(activeSuite.id, selectedIds);
            } else {
                result = await testCaseService.bulkUpdateStatus(activeSuite.id, selectedIds, action);
            }
            if (result.success) {
                await loadTestCases();
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} ${action}d`
                });
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: result.error.message || `Failed to perform bulk action: ${action}`
                });
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to perform bulk action: ${action}`
            });
        }
    };

    const handleImportComplete = async () => {
        setIsImportModalOpen(false);
        await loadTestCases();
        addNotification({
            type: 'success',
            title: 'Success',
            message: 'Test cases imported successfully'
        });
    };

    const handleAIGenerationComplete = async (generatedTestCases) => {
        setIsAIModalOpen(false);
        try {
            const result = await testCaseService.bulkCreate(activeSuite.id, generatedTestCases);
            if (result.success) {
                await loadTestCases();
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `${generatedTestCases.length} test cases generated and saved`
                });
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: result.error.message || 'Failed to save generated test cases'
                });
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to save generated test cases'
            });
        }
    };

    if (appLoading || suiteLoading) {
        return null;
    }

    return (
        <PageLayout title="Test Cases" requiresTestSuite={true}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test Cases</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {testCases.length} {testCases.length === 1 ? 'test case' : 'test cases'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            onClick={() => setIsTraceabilityOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            Traceability
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            Import
                        </button>
                        <button
                            onClick={() => setIsAIModalOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            AI Generate
                        </button>
                        <button
                            onClick={handleCreateTestCase}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            Create Test Case
                        </button>
                    </div>
                </div>

                <FilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    testCases={testCases}
                />

                <div className="bg-white rounded-lg shadow">
                    <TestCaseTable
                        testCases={filteredTestCases}
                        loading={loading}
                        onEdit={handleEditTestCase}
                        onDelete={handleDeleteTestCase}
                        onDuplicate={handleDuplicateTestCase}
                        onBulkAction={handleBulkAction}
                    />
                </div>

                {/* Remove the SuiteProvider wrapper around TestCaseModal */}
                {isModalOpen && (
                    <TestCaseModal
                        testCase={selectedTestCase}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveTestCase}
                    />
                )}

                {isImportModalOpen && (
                    <ImportModal
                        onClose={() => setIsImportModalOpen(false)}
                        onImportComplete={handleImportComplete}
                    />
                )}

                {isAIModalOpen && (
                    <AIGenerationModal
                        onClose={() => setIsAIModalOpen(false)}
                        onGenerationComplete={handleAIGenerationComplete}
                    />
                )}

                {isTraceabilityOpen && (
                    <TraceabilityComponent
                        testCases={testCases}
                        onClose={() => setIsTraceabilityOpen(false)}
                    />
                )}
            </div>
        </PageLayout>
    );
}

export default function TestCasesPage() {
    const { user, isLoading: appLoading } = useApp();
    if (appLoading || !user) {
        return null;
    }
    return (
        <SuiteProvider user={user}>
            <TestCasesPageContent />
        </SuiteProvider>
    );
}