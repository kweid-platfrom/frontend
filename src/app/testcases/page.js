/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useEntitySync } from '@/hooks/useEntitySync';
import PageLayout from '@/components/layout/PageLayout';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import AIGenerationModal from '@/components/testCase/AIGenerationModal';
import TraceabilityComponent from '@/components/testCase/TraceabilityMatrix';
import firestoreService from '@/services/firestoreService';
import { toast } from 'sonner';

function TestCasesPageContent() {
    const { user, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const [testCases, setTestCases] = useState([]);
    const [relationships, setRelationships] = useState({
        testCaseToBugs: {},
        bugToRecordings: {},
        requirementToTestCases: {},
    });
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

    const addNotification = useCallback((notification) => {
        toast[notification.type](notification.title, {
            description: notification.message,
            duration: notification.persistent ? 0 : 5000,
        });
    }, []);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        addNotification({
            type: 'error',
            title: 'Error',
            message: `Failed to ${context}: ${error.message}`,
            persistent: true,
        });
    }, [addNotification]);

    useEntitySync(
        !appLoading && !suiteLoading && !!activeSuite?.id && !!user?.uid,
        activeSuite?.id,
        setTestCases,
        () => {}, // No bugs needed
        () => {}, // No recordings needed
        setRelationships,
        handleError
    );

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
            const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
            let result;
            if (selectedTestCase) {
                result = await firestoreService.updateDocument(testCasesCollectionPath, selectedTestCase.id, {
                    ...testCaseData,
                    updated_at: new Date(),
                });
            } else {
                result = await firestoreService.createDocument(testCasesCollectionPath, {
                    ...testCaseData,
                    created_at: new Date(),
                    updated_at: new Date(),
                    suite_id: activeSuite.id,
                    created_by: user?.email || 'anonymous',
                });
            }
            addNotification({
                type: 'success',
                title: 'Success',
                message: selectedTestCase ? 'Test case updated successfully' : 'Test case created successfully'
            });
            setIsModalOpen(false);
            // Data is updated via useEntitySync
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to save test case: ${error.message}`
            });
        }
    }, [activeSuite, selectedTestCase, user, addNotification]);

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
                const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
                await firestoreService.deleteDocument(testCasesCollectionPath, id);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Test case deleted successfully'
                });
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: `Failed to delete test case: ${error.message}`
                });
            }
        }
    };

    const handleDuplicateTestCase = async (testCase) => {
        try {
            const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
            const duplicatedTestCase = {
                ...testCase,
                title: `${testCase.title} (Copy)`,
                created_at: new Date(),
                updated_at: new Date(),
                suite_id: activeSuite.id,
                created_by: user?.email || 'anonymous',
            };
            await firestoreService.createDocument(testCasesCollectionPath, duplicatedTestCase);
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Test case duplicated successfully'
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to duplicate test case: ${error.message}`
            });
        }
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
            if (action === 'delete') {
                await Promise.all(selectedIds.map(id => firestoreService.deleteDocument(testCasesCollectionPath, id)));
            } else {
                await Promise.all(selectedIds.map(id => firestoreService.updateDocument(testCasesCollectionPath, id, { status: action })));
            }
            addNotification({
                type: 'success',
                title: 'Success',
                message: `${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} ${action}d`
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to perform bulk action: ${error.message}`
            });
        }
    };

    const handleImportComplete = async (importedTestCases) => {
        setIsImportModalOpen(false);
        try {
            const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
            await Promise.all(
                importedTestCases.map(tc =>
                    firestoreService.createDocument(testCasesCollectionPath, {
                        ...tc,
                        created_at: new Date(),
                        updated_at: new Date(),
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    })
                )
            );
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Test cases imported successfully'
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to import test cases: ${error.message}`
            });
        }
    };

    const handleAIGenerationComplete = async (generatedTestCases) => {
        setIsAIModalOpen(false);
        try {
            const testCasesCollectionPath = `organizations/${activeSuite.org_id}/testSuites/${activeSuite.id}/testCases`;
            await Promise.all(
                generatedTestCases.map(tc =>
                    firestoreService.createDocument(testCasesCollectionPath, {
                        ...tc,
                        created_at: new Date(),
                        updated_at: new Date(),
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    })
                )
            );
            addNotification({
                type: 'success',
                title: 'Success',
                message: `${generatedTestCases.length} test cases generated and saved`
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to save generated test cases: ${error.message}`
            });
        }
    };

    useEffect(() => {
        setLoading(appLoading || suiteLoading);
    }, [appLoading, suiteLoading]);

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
                        relationships={relationships}
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
    return <TestCasesPageContent />;
}