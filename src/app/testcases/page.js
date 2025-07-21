/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useEntitySync } from '@/hooks/useEntitySync';
import PageLayout from '@/components/layout/PageLayout';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import AIGenerationModal from '@/components/testCase/AIGenerationModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import firestoreService from '@/services/firestoreService';
import { where, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const notify = (type, title, message, persistent = false) => {
    toast[type](title, {
        description: message,
        duration: persistent ? 0 : 5000,
    });
};

function TestCasesPageContent() {
    const { user, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const [testCases, setTestCases] = useState([]);
    const [bugs, setBugs] = useState([]);
    const [recordings, setRecordings] = useState([]);
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
    const [viewMode, setViewMode] = useState('table'); // Default to table view
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        search: '',
        executionType: 'all',
        automationStatus: 'all',
        lastUpdated: 'all',
    });

    const handleError = useCallback(
        (error, context) => {
            console.error(`Error in ${context}:`, error);
            notify('error', 'Error', `Failed to ${context}: ${error.message}`, true);
        },
        []
    );

    // Get orgId and accountType
    const orgId = activeSuite?.organizationId || user?.organizationId || null;
    const accountType = activeSuite?.accountType || user?.accountType || 'individual';

    // Use the hook with proper parameters
    useEntitySync(
        !appLoading && !suiteLoading && !!activeSuite?.id && !!user?.uid,
        activeSuite?.id,
        orgId,
        accountType,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError
    );

    const applyFilters = useCallback(() => {
        console.log('Applying filters to testCases:', { testCases, filters });
        let filtered = [...testCases];

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

        console.log('Filtered testCases:', { filtered, count: filtered.length });
        setFilteredTestCases(filtered);
    }, [testCases, filters]);

    const handleSaveTestCase = useCallback(
        async (testCaseData) => {
            try {
                let testCasesCollectionPath;
                if (accountType === 'individual') {
                    testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
                } else {
                    testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
                }

                const timestamp = Timestamp.fromDate(new Date());
                console.log('Saving test case:', { ...testCaseData, updated_at: timestamp });

                if (selectedTestCase) {
                    await firestoreService.updateDocument(testCasesCollectionPath, selectedTestCase.id, {
                        ...testCaseData,
                        updated_at: timestamp,
                        created_by: user?.email || 'anonymous',
                        suite_id: activeSuite.id,
                    });
                } else {
                    await firestoreService.createDocument(testCasesCollectionPath, {
                        ...testCaseData,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    });
                }
                notify(
                    'success',
                    'Success',
                    selectedTestCase ? 'Test case updated successfully' : 'Test case created successfully'
                );
                setIsModalOpen(false);
            } catch (error) {
                handleError(error, 'save test case');
            }
        },
        [activeSuite, selectedTestCase, user, handleError, accountType, orgId]
    );

    const handleLinkBug = useCallback(
        async (testCaseId, newBugIds) => {
            try {
                let relationshipsCollectionPath;
                if (accountType === 'individual') {
                    relationshipsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/relationships`;
                } else {
                    relationshipsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/relationships`;
                }

                const existingBugs = relationships.testCaseToBugs[testCaseId] || [];
                const toAdd = newBugIds.filter((id) => !existingBugs.includes(id));
                const toRemove = existingBugs.filter((id) => !newBugIds.includes(id));
                const promises = [];

                toAdd.forEach((bugId) => {
                    promises.push(
                        firestoreService.createDocument(relationshipsCollectionPath, {
                            suiteId: activeSuite.id,
                            sourceType: 'testCase',
                            sourceId: testCaseId,
                            targetType: 'bug',
                            targetId: bugId,
                            created_at: Timestamp.fromDate(new Date()),
                            created_by: user?.email || 'anonymous',
                        })
                    );
                });

                toRemove.forEach((bugId) => {
                    promises.push(
                        firestoreService.deleteDocumentByQuery(relationshipsCollectionPath, [
                            where('suiteId', '==', activeSuite.id),
                            where('sourceType', '==', 'testCase'),
                            where('sourceId', '==', testCaseId),
                            where('targetType', '==', 'bug'),
                            where('targetId', '==', bugId),
                        ])
                    );
                });

                await Promise.all(promises);
                notify('success', 'Success', `Linked ${newBugIds.length} bug${newBugIds.length > 1 ? 's' : ''} to test case`);
            } catch (error) {
                handleError(error, 'link bugs');
            }
        },
        [activeSuite, relationships, user, handleError, accountType, orgId]
    );

    const handleCreateTestCase = () => {
        if (!activeSuite?.id) {
            notify('error', 'Error', 'Please select a test suite first');
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
            let testCasesCollectionPath;
            if (accountType === 'individual') {
                testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
            } else {
                testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
            }

            await firestoreService.deleteDocument(testCasesCollectionPath, id);
            notify('success', 'Success', 'Test case deleted successfully');
        } catch (error) {
            handleError(error, 'delete test case');
        }
    };

    const handleDuplicateTestCase = async (testCase) => {
        try {
            let testCasesCollectionPath;
            if (accountType === 'individual') {
                testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
            } else {
                testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
            }

            const timestamp = Timestamp.fromDate(new Date());
            const duplicatedTestCase = {
                ...testCase,
                title: `${testCase.title} (Copy)`,
                created_at: timestamp,
                updated_at: timestamp,
                suite_id: activeSuite.id,
                created_by: user?.email || 'anonymous',
            };
            console.log('Duplicating test case:', duplicatedTestCase);
            await firestoreService.createDocument(testCasesCollectionPath, duplicatedTestCase);
            notify('success', 'Success', 'Test case duplicated successfully');
        } catch (error) {
            handleError(error, 'duplicate test case');
        }
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            let testCasesCollectionPath;
            if (accountType === 'individual') {
                testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
            } else {
                testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
            }

            const timestamp = Timestamp.fromDate(new Date());
            if (action === 'delete') {
                await Promise.all(selectedIds.map((id) => firestoreService.deleteDocument(testCasesCollectionPath, id)));
            } else {
                await Promise.all(
                    selectedIds.map((id) =>
                        firestoreService.updateDocument(testCasesCollectionPath, id, {
                            status: action,
                            updated_at: timestamp,
                            created_by: user?.email || 'anonymous',
                        })
                    )
                );
            }
            notify('success', 'Success', `${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} ${action}d`);
        } catch (error) {
            handleError(error, 'bulk action');
        }
    };

    const handleImportComplete = async (importedTestCases) => {
        setIsImportModalOpen(false);
        try {
            let testCasesCollectionPath;
            if (accountType === 'individual') {
                testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
            } else {
                testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
            }

            const timestamp = Timestamp.fromDate(new Date());
            await Promise.all(
                importedTestCases.map((tc) => {
                    const testCaseData = {
                        ...tc,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    };
                    console.log('Importing test case:', testCaseData);
                    return firestoreService.createDocument(testCasesCollectionPath, testCaseData);
                })
            );
            notify('success', 'Success', 'Test cases imported successfully');
        } catch (error) {
            handleError(error, 'import test cases');
        }
    };

    const handleAIGenerationComplete = async (generatedTestCases) => {
        setIsAIModalOpen(false);
        try {
            let testCasesCollectionPath;
            if (accountType === 'individual') {
                testCasesCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.id}/testCases`;
            } else {
                testCasesCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.id}/testCases`;
            }

            const timestamp = Timestamp.fromDate(new Date());
            await Promise.all(
                generatedTestCases.map((tc) => {
                    const testCaseData = {
                        ...tc,
                        created_at: timestamp,
                        updated_at: timestamp,
                        suite_id: activeSuite.id,
                        created_by: user?.email || 'anonymous',
                    };
                    console.log('Generating test case:', testCaseData);
                    return firestoreService.createDocument(testCasesCollectionPath, testCaseData);
                })
            );
            notify('success', 'Success', `${generatedTestCases.length} test cases generated and saved`);
        } catch (error) {
            handleError(error, 'save generated test cases');
        }
    };

    // Update loading state and track initial load
    useEffect(() => {
        const isLoading = appLoading || suiteLoading || !initialLoadComplete;
        console.log('TestCasesPage: Loading state updated', { 
            appLoading, 
            suiteLoading, 
            initialLoadComplete,
            testCasesLength: testCases.length,
            filteredTestCasesLength: filteredTestCases.length,
            isLoading 
        });
        setLoading(isLoading);
        if (!appLoading && !suiteLoading && testCases.length > 0 && !initialLoadComplete) {
            setInitialLoadComplete(true);
        }
    }, [appLoading, suiteLoading, testCases.length, initialLoadComplete, filteredTestCases.length]);

    // Apply filters when testCases or filters change
    useEffect(() => {
        applyFilters();
    }, [testCases, filters, applyFilters]);

    // Debug viewMode changes
    useEffect(() => {
        console.log('View mode changed:', { viewMode });
        notify('info', 'View Changed', `Switched to ${viewMode} view`);
    }, [viewMode]);

    // Debug testCases and filteredTestCases
    useEffect(() => {
        console.log('TestCases state updated:', {
            testCasesLength: testCases.length,
            testCases: testCases.slice(0, 3),
            filteredTestCasesLength: filteredTestCases.length,
            filteredTestCases: filteredTestCases.slice(0, 3),
            activeSuiteId: activeSuite?.id,
            userId: user?.uid,
            orgId,
            accountType,
            viewMode
        });
    }, [testCases, filteredTestCases, activeSuite?.id, user?.uid, orgId, accountType, viewMode]);

    if (appLoading || suiteLoading) {
        return <div>Loading...</div>;
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
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading test cases...</div>
                    ) : filteredTestCases.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No test cases found. Try adjusting the filters or creating a new test case.
                        </div>
                    ) : viewMode === 'table' ? (
                        <TestCaseTable
                            testCases={filteredTestCases}
                            bugs={bugs}
                            relationships={relationships.testCaseToBugs}
                            filters={filters}
                            loading={loading}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                            onDuplicate={handleDuplicateTestCase}
                            onBulkAction={handleBulkAction}
                            onView={handleEditTestCase}
                            onRun={() => notify('info', 'Run', 'Run functionality not implemented yet')}
                            onLinkBug={handleLinkBug}
                        />
                    ) : (
                        <TestCaseList
                            testCases={filteredTestCases}
                            bugs={bugs}
                            relationships={relationships.testCaseToBugs}
                            filters={filters}
                            loading={loading}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                            onDuplicate={handleDuplicateTestCase}
                            onBulkAction={handleBulkAction}
                            onView={handleEditTestCase}
                            onRun={() => notify('info', 'Run', 'Run functionality not implemented yet')}
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