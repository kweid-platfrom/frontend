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
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import firestoreService from '@/services/firestoreService';
import { where, orderBy, Timestamp } from 'firebase/firestore';
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
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        search: '',
    });

    const handleError = useCallback(
        (error, context) => {
            console.error(`Error in ${context}:`, error);
            notify('error', 'Error', `Failed to ${context}: ${error.message}`, true);
        },
        []
    );

    // Get orgId and accountType - use actual values, not functions
    const orgId = activeSuite?.organizationId || user?.organizationId || null;
    const accountType = activeSuite?.accountType || user?.accountType || 'individual';

    // Use the hook with proper parameters
    useEntitySync(
        !appLoading && !suiteLoading && !!activeSuite?.id && !!user?.uid, // isAuthenticated
        activeSuite?.id, // activeSuiteId
        orgId, // orgId (actual value, not function)
        accountType, // accountType (actual value, not function)
        setTestCases, // setTestCases
        setBugs, // setBugs
        setRecordings, // setRecordings
        setRelationships, // setRelationships
        handleError // handleError
    );

    const applyFilters = useCallback(() => {
        console.log('Applying filters to testCases:', testCases);
        let filtered = [...testCases];

        if (filters.search) {
            filtered = filtered.filter(
                (tc) =>
                    tc.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    tc.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
                    tc.tags?.some((tag) => tag.toLowerCase().includes(filters.search.toLowerCase()))
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter((tc) => tc.status === filters.status);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter((tc) => tc.priority === filters.priority);
        }

        if (filters.assignee !== 'all') {
            filtered = filtered.filter((tc) => tc.assignee === filters.assignee);
        }

        if (filters.tags.length > 0) {
            filtered = filtered.filter((tc) => filters.tags.some((tag) => tc.tags?.includes(tag)));
        }

        console.log('Filtered testCases:', filtered);
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
                
                let result;
                if (selectedTestCase) {
                    result = await firestoreService.updateDocument(testCasesCollectionPath, selectedTestCase.id, {
                        ...testCaseData,
                        updated_at: timestamp,
                        created_by: user?.email || 'anonymous',
                        suite_id: activeSuite.id,
                    });
                } else {
                    result = await firestoreService.createDocument(testCasesCollectionPath, {
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
            notify('error', 'Error', 'Please select a suite first');
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

    // Update loading state based on testCases length and loading states
    useEffect(() => {
        const isLoading = appLoading || suiteLoading;
        console.log('TestCasesPage: Loading state updated', { 
            appLoading, 
            suiteLoading, 
            testCasesLength: testCases.length,
            isLoading 
        });
        setLoading(isLoading);
    }, [appLoading, suiteLoading, testCases.length]);

    useEffect(() => {
        applyFilters();
    }, [testCases, filters, applyFilters]);

    // Add debug logging for testCases changes
    useEffect(() => {
        console.log('TestCases state updated:', {
            length: testCases.length,
            testCases: testCases.slice(0, 3), // Log first 3 for debugging
            activeSuiteId: activeSuite?.id,
            userId: user?.uid,
            orgId,
            accountType
        });
    }, [testCases, activeSuite?.id, user?.uid, orgId, accountType]);

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

                <FilterBar filters={filters} onFiltersChange={setFilters} testCases={testCases} />

                <div className="bg-white rounded-lg shadow">
                    <TestCaseTable
                        testCases={filteredTestCases}
                        bugs={bugs}
                        relationships={relationships.testCaseToBugs}
                        loading={loading}
                        onEdit={handleEditTestCase}
                        onDelete={handleDeleteTestCase}
                        onDuplicate={handleDuplicateTestCase}
                        onBulkAction={handleBulkAction}
                        onLinkBug={handleLinkBug}
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