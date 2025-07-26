
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp, useAppEntityData } from '@/context/AppProvider';
import PageLayout from '@/components/layout/PageLayout';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import AIGenerationModal from '@/components/testCase/AIGenerationModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';

function TestCasesPageContent() {
    const { user, isLoading: appLoading, addNotification } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const {
        testCases,
        bugs,
        recordings,
        relationships,
        createTestCase,
        updateTestCase,
        deleteTestCase,
        linkBugToTestCase,
        unlinkBugFromTestCase,
        isLoadingEntities,
        entityError,
    } = useAppEntityData();
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        executionType: 'all',
        automationStatus: 'all',
        lastUpdated: 'all',
    });

    console.log('TestCasesPage Data:', {
        testCasesLength: testCases?.length,
        bugsLength: bugs?.length,
        recordingsLength: recordings?.length,
        relationships,
        isLoadingEntities,
        entityError,
        activeSuiteId: activeSuite?.id,
        userId: user?.uid,
    });

    const handleError = useCallback(
        (error, context) => {
            console.error(`Error in ${context}:`, error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to ${context}: ${error.message}`,
                persistent: true,
            });
        },
        [addNotification]
    );

    const applyFilters = useCallback(() => {
        let filtered = [...(testCases || [])];

        if (filters.search) {
            filtered = filtered.filter((tc) =>
                [
                    tc.title?.toLowerCase(),
                    tc.description?.toLowerCase(),
                    ...(tc.tags || []).map((tag) => tag.toLowerCase()),
                ].some((field) => field?.includes(filters.search.toLowerCase()))
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter((tc) => tc.status === filters.status);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter((tc) => tc.priority === filters.priority);
        }

        if (filters.assignee !== 'all') {
            filtered = filtered.filter((tc) => tc.assignee === filters.assignee || (!tc.assignee && filters.assignee === ''));
        }

        if (filters.tags?.length > 0) {
            filtered = filtered.filter((tc) => tc.tags && filters.tags.every((tag) => tc.tags.includes(tag)));
        }

        if (filters.executionType !== 'all') {
            filtered = filtered.filter((tc) => tc.executionType === filters.executionType);
        }

        if (filters.automationStatus !== 'all') {
            filtered = filtered.filter((tc) => tc.automationStatus === filters.automationStatus);
        }

        if (filters.lastUpdated !== 'all') {
            filtered = filtered.filter((tc) => {
                const updatedAt = tc.updated_at instanceof Date ? tc.updated_at : new Date(tc.updated_at);
                const now = new Date();
                if (filters.lastUpdated === 'today') return updatedAt.toDateString() === now.toDateString();
                if (filters.lastUpdated === 'week') return updatedAt >= new Date(now.setDate(now.getDate() - 7));
                if (filters.lastUpdated === 'month') return updatedAt >= new Date(now.setDate(now.getDate() - 30));
                if (filters.lastUpdated === 'quarter') return updatedAt >= new Date(now.setDate(now.getDate() - 90));
                return true;
            });
        }

        setFilteredTestCases(filtered);
    }, [testCases, filters]);

    const handleSaveTestCase = useCallback(
        async (testCaseData) => {
            try {
                if (!activeSuite?.id) {
                    throw new Error('No active test suite selected');
                }
                const timestamp = new Date();
                if (selectedTestCase) {
                    console.log('Updating test case:', selectedTestCase.id, testCaseData);
                    await updateTestCase(selectedTestCase.id, {
                        ...testCaseData,
                        updated_at: timestamp,
                        created_by: user?.email || 'anonymous',
                        suite_id: activeSuite.id,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Success',
                        message: 'Test case updated successfully',
                    });
                } else {
                    console.log('Creating test case:', testCaseData);
                    await createTestCase({
                        ...testCaseData,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    });
                    addNotification({
                        type: 'success',
                        title: 'Success',
                        message: 'Test case created successfully',
                    });
                }
                setIsModalOpen(false);
            } catch (error) {
                handleError(error, 'save test case');
            }
        },
        [activeSuite, selectedTestCase, user, handleError, createTestCase, updateTestCase, addNotification]
    );

    const handleLinkBug = useCallback(
        async (testCaseId, newBugIds) => {
            try {
                if (!activeSuite?.id) {
                    throw new Error('No active test suite selected');
                }
                const existingBugs = relationships.testCaseToBugs[testCaseId] || [];
                const toAdd = newBugIds.filter((id) => !existingBugs.includes(id));
                const toRemove = existingBugs.filter((id) => !newBugIds.includes(id));

                console.log('Linking bugs:', { testCaseId, toAdd, toRemove });

                await Promise.all([
                    ...toAdd.map((bugId) => linkBugToTestCase(testCaseId, bugId)),
                    ...toRemove.map((bugId) => unlinkBugFromTestCase(testCaseId, bugId)),
                ]);

                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Linked ${newBugIds.length} bug${newBugIds.length > 1 ? 's' : ''} to test case`,
                });
            } catch (error) {
                handleError(error, 'link bugs');
            }
        },
        [activeSuite, relationships, handleError, linkBugToTestCase, unlinkBugFromTestCase, addNotification]
    );

    const handleCreateTestCase = () => {
        if (!activeSuite?.id) {
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Please select a test suite first',
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
        try {
            if (!activeSuite?.id) {
                throw new Error('No active test suite selected');
            }
            console.log('Deleting test case:', id);
            await deleteTestCase(id);
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Test case deleted successfully',
            });
        } catch (error) {
            handleError(error, 'delete test case');
        }
    };

    const handleDuplicateTestCase = async (testCase) => {
        try {
            if (!activeSuite?.id) {
                throw new Error('No active test suite selected');
            }
            const timestamp = new Date();
            console.log('Duplicating test case:', testCase.id);
            await createTestCase({
                ...testCase,
                title: `${testCase.title} (Copy)`,
                created_at: timestamp,
                updated_at: timestamp,
                suite_id: activeSuite.id,
                created_by: user?.email || 'anonymous',
            });
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Test case duplicated successfully',
            });
        } catch (error) {
            handleError(error, 'duplicate test case');
        }
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            if (!activeSuite?.id) {
                throw new Error('No active test suite selected');
            }
            console.log('Performing bulk action:', action, selectedIds);
            if (action === 'delete') {
                await Promise.all(selectedIds.map((id) => deleteTestCase(id)));
            } else {
                const timestamp = new Date();
                await Promise.all(
                    selectedIds.map((id) =>
                        updateTestCase(id, {
                            status: action,
                            updated_at: timestamp,
                            created_by: user?.email || 'anonymous',
                        })
                    )
                );
            }
            addNotification({
                type: 'success',
                title: 'Success',
                message: `${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} ${action}d`,
            });
        } catch (error) {
            handleError(error, 'bulk action');
        }
    };

    const handleImportComplete = async (importedTestCases) => {
        setIsImportModalOpen(false);
        try {
            if (!activeSuite?.id) {
                throw new Error('No active test suite selected');
            }
            console.log('Importing test cases:', importedTestCases.length);
            const timestamp = new Date();
            await Promise.all(
                importedTestCases.map((tc) =>
                    createTestCase({
                        ...tc,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    })
                )
            );
            addNotification({
                type: 'success',
                title: 'Success',
                message: 'Test cases imported successfully',
            });
        } catch (error) {
            handleError(error, 'import test cases');
        }
    };

    const handleAIGenerationComplete = async (generatedTestCases) => {
        setIsAIModalOpen(false);
        try {
            if (!activeSuite?.id) {
                throw new Error('No active test suite selected');
            }
            console.log('Generating test cases:', generatedTestCases.length);
            const timestamp = new Date();
            await Promise.all(
                generatedTestCases.map((tc) =>
                    createTestCase({
                        ...tc,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    })
                )
            );
            addNotification({
                type: 'success',
                title: 'Success',
                message: `${generatedTestCases.length} test cases generated and saved`,
            });
        } catch (error) {
            handleError(error, 'save generated test cases');
        }
    };

    useEffect(() => {
        const isStillLoading = appLoading || suiteLoading || isLoadingEntities;
        setLoading(isStillLoading);
    }, [appLoading, suiteLoading, isLoadingEntities]);

    useEffect(() => {
        applyFilters();
    }, [testCases, filters, applyFilters]);

    useEffect(() => {
        console.log('TestCasesPage: State updated', {
            testCasesLength: testCases?.length,
            filteredTestCasesLength: filteredTestCases?.length,
            activeSuiteId: activeSuite?.id,
            userId: user?.uid,
            viewMode,
            isLoadingEntities,
            entityError,
        });
    }, [testCases, filteredTestCases, activeSuite?.id, user?.uid, viewMode, isLoadingEntities, entityError]);

    if (appLoading || suiteLoading || isLoadingEntities) {
        return <div>Loading...</div>;
    }

    if (entityError) {
        console.warn('TestCasesPage: Entity error:', entityError);
        return (
            <PageLayout title="Test Cases" requiresTestSuite={true}>
                <div className="text-center py-8">
                    <p className="text-red-500">Error: {entityError}</p>
                </div>
            </PageLayout>
        );
    }

    if (!activeSuite?.id) {
        console.warn('TestCasesPage: No active suite ID');
        return (
            <PageLayout title="Test Cases" requiresTestSuite={true}>
                <div className="text-center py-8">
                    <p className="text-gray-500">Please select a test suite to view test cases.</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Test Cases" requiresTestSuite={true}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test Cases</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {filteredTestCases.length} {filteredTestCases.length === 1 ? 'test case' : 'test cases'}
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
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div key={viewMode} className="transition-opacity duration-300">
                    {viewMode === 'table' ? (
                        <TestCaseTable
                            testCases={filteredTestCases}
                            bugs={bugs}
                            relationships={relationships}
                            loading={loading}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                            onDuplicate={handleDuplicateTestCase}
                            onBulkAction={handleBulkAction}
                            onView={handleEditTestCase}
                            onRun={() => addNotification({
                                type: 'info',
                                title: 'Run',
                                message: 'Run functionality not implemented yet',
                            })}
                            onLinkBug={handleLinkBug}
                        />
                    ) : (
                        <TestCaseList
                            testCases={filteredTestCases}
                            bugs={bugs}
                            relationships={relationships}
                            loading={loading}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                            onDuplicate={handleDuplicateTestCase}
                            onBulkAction={handleBulkAction}
                            onView={handleEditTestCase}
                            onRun={() => addNotification({
                                type: 'info',
                                title: 'Run',
                                message: 'Run functionality not implemented yet',
                            })}
                            onLinkBug={handleLinkBug}
                        />
                    )}
                </div>

                {isModalOpen && (
                    <TestCaseModal
                        testCase={selectedTestCase}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveTestCase}
                    />
                )}

                {isImportModalOpen && (
                    <ImportModal onClose={() => setIsImportModalOpen(false)} onImportComplete={handleImportComplete} />
                )}

                {isAIModalOpen && (
                    <AIGenerationModal onClose={() => setIsAIModalOpen(false)} onGenerationComplete={handleAIGenerationComplete} />
                )}

                {isTraceabilityOpen && (
                    <TraceabilityMatrix
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
        return <div>Loading...</div>;
    }
    return <TestCasesPageContent />;
}