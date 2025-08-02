/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import { useTestCases } from '@/hooks/useTestCases';
import { useUI } from '@/hooks/useUI';
import { useRouter } from 'next/navigation';

const TestCases = () => {
    const router = useRouter();

    // Get data from hooks - make sure these are stable
    const testCasesHook = useTestCases();
    const uiHook = useUI();

    // Debug logging for hook data
    useEffect(() => {
        console.log('🔍 TestCases Hook Debug:', {
            hookData: {
                currentUser: testCasesHook.currentUser,
                activeSuite: testCasesHook.activeSuite,
                testCasesLocked: testCasesHook.testCasesLocked,
                canCreateTestCases: testCasesHook.canCreateTestCases,
                testCases: testCasesHook.testCases?.length || 0,
                loading: testCasesHook.loading
            },
            hookMethods: {
                createTestCase: typeof testCasesHook.createTestCase,
                updateTestCase: typeof testCasesHook.updateTestCase,
                deleteTestCase: typeof testCasesHook.deleteTestCase
            }
        });
    }, [
        testCasesHook.currentUser,
        testCasesHook.activeSuite,
        testCasesHook.testCasesLocked,
        testCasesHook.canCreateTestCases,
        testCasesHook.testCases?.length,
        testCasesHook.loading
    ]);

    // Use refs to store stable references to prevent circular dependencies
    const testCasesRef = useRef(testCasesHook.testCases || []);
    const bugsRef = useRef(testCasesHook.bugs || []);
    const relationshipsRef = useRef(testCasesHook.relationships || { testCaseToBugs: {} });

    // Update refs when data changes
    useEffect(() => {
        testCasesRef.current = testCasesHook.testCases || [];
    }, [testCasesHook.testCases]);

    useEffect(() => {
        bugsRef.current = testCasesHook.bugs || [];
    }, [testCasesHook.bugs]);

    useEffect(() => {
        relationshipsRef.current = testCasesHook.relationships || { testCaseToBugs: {} };
    }, [testCasesHook.relationships]);

    // Local state - FIXED: Added missing filter properties
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        priority: 'all',
        severity: 'all',              // FIXED: Added missing filter
        executionStatus: 'all',       // FIXED: Renamed from executionType
        assignee: 'all',
        component: 'all',             // FIXED: Added missing filter
        testType: 'all',              // FIXED: Added missing filter
        environment: 'all',           // FIXED: Added missing filter
        automationStatus: 'all',
        tags: [],
        lastUpdated: 'all',
    });

    // Debug logging for modal state
    useEffect(() => {
        console.log('🔍 Modal state changed:', {
            isModalOpen,
            selectedTestCase: selectedTestCase?.id || null,
            currentUser: testCasesHook.currentUser?.uid || null,
            activeSuite: testCasesHook.activeSuite?.id || null,
            canCreateTestCases: testCasesHook.canCreateTestCases,
            testCasesLocked: testCasesHook.testCasesLocked
        });
    }, [isModalOpen, selectedTestCase, testCasesHook.currentUser, testCasesHook.activeSuite]);

    // Create stable function references - FIXED: Complete filter logic
    const applyFiltersStable = useCallback((currentTestCases, currentFilters) => {
        if (!Array.isArray(currentTestCases)) return [];

        let filtered = [...currentTestCases];

        // Search filter - Enhanced with more searchable fields
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filtered = filtered.filter((tc) => {
                const searchableFields = [
                    tc.title?.toLowerCase() || '',
                    tc.description?.toLowerCase() || '',
                    tc.id?.toString().toLowerCase() || '',
                    tc.component?.toLowerCase() || '',
                    tc.assignee?.toLowerCase() || '',
                    ...(tc.tags || []).map((tag) => tag.toLowerCase()),
                ];
                return searchableFields.some((field) => field.includes(searchTerm));
            });
        }

        // Status filter
        if (currentFilters.status !== 'all') {
            filtered = filtered.filter((tc) => tc.status === currentFilters.status);
        }

        // Priority filter
        if (currentFilters.priority !== 'all') {
            filtered = filtered.filter((tc) => tc.priority === currentFilters.priority);
        }

        // FIXED: Severity filter (was missing)
        if (currentFilters.severity !== 'all') {
            filtered = filtered.filter((tc) => tc.severity === currentFilters.severity);
        }

        // FIXED: Execution Status filter (was executionType)
        if (currentFilters.executionStatus !== 'all') {
            filtered = filtered.filter((tc) => tc.executionStatus === currentFilters.executionStatus);
        }

        // Assignee filter
        if (currentFilters.assignee !== 'all') {
            filtered = filtered.filter((tc) =>
                tc.assignee === currentFilters.assignee ||
                (!tc.assignee && currentFilters.assignee === '')
            );
        }

        // FIXED: Component filter (was missing)
        if (currentFilters.component !== 'all') {
            filtered = filtered.filter((tc) => tc.component === currentFilters.component);
        }

        // FIXED: Test Type filter (was missing)
        if (currentFilters.testType !== 'all') {
            filtered = filtered.filter((tc) => tc.testType === currentFilters.testType);
        }

        // FIXED: Environment filter (was missing)
        if (currentFilters.environment !== 'all') {
            filtered = filtered.filter((tc) => tc.environment === currentFilters.environment);
        }

        // Automation Status filter
        if (currentFilters.automationStatus !== 'all') {
            filtered = filtered.filter((tc) => tc.automationStatus === currentFilters.automationStatus);
        }

        // Tags filter
        if (currentFilters.tags?.length > 0) {
            filtered = filtered.filter((tc) =>
                tc.tags && currentFilters.tags.every((tag) => tc.tags.includes(tag))
            );
        }

        // Last Updated filter
        if (currentFilters.lastUpdated !== 'all') {
            const now = new Date();
            filtered = filtered.filter((tc) => {
                const updatedAt = tc.updated_at instanceof Date ? tc.updated_at : new Date(tc.updated_at);
                if (isNaN(updatedAt.getTime())) return false;

                switch (currentFilters.lastUpdated) {
                    case 'today':
                        return updatedAt.toDateString() === now.toDateString();
                    case 'week':
                        return updatedAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month':
                        return updatedAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    case 'quarter':
                        return updatedAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, []); // Empty deps - this function is pure

    // Apply filters effect - only depend on values that actually change
    useEffect(() => {
        const newFilteredTestCases = applyFiltersStable(testCasesRef.current, filters);
        setFilteredTestCases(newFilteredTestCases);
    }, [testCasesHook.testCases, filters, applyFiltersStable]);

    // Stable error handler
    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        if (uiHook.addNotification) {
            uiHook.addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to ${context}: ${error.message}`,
                persistent: true,
            });
        }
    }, [uiHook.addNotification]);

    // All handlers with stable dependencies
    const handleSaveTestCase = useCallback(async (testCaseData) => {
        try {
            console.log('💾 Saving test case:', {
                testCaseData: testCaseData.title,
                isEdit: !!selectedTestCase
            });

            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            if (selectedTestCase) {
                await testCasesHook.updateTestCase(selectedTestCase.id, {
                    ...testCaseData,
                    updated_at: timestamp,
                });
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Test case updated successfully',
                });
            } else {
                const result = await testCasesHook.createTestCase({
                    ...testCaseData,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
                console.log('✅ Test case created:', result);
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Test case created successfully',
                });
            }

            setIsModalOpen(false);
            setSelectedTestCase(null);
        } catch (error) {
            console.error('❌ Error saving test case:', error);
            handleError(error, 'save test case');
        }
    }, [
        testCasesHook.testCasesLocked,
        testCasesHook.updateTestCase,
        testCasesHook.createTestCase,
        selectedTestCase,
        uiHook.addNotification,
        handleError
    ]);

    const handleLinkBug = useCallback(async (testCaseId, newBugIds) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const existingBugs = relationshipsRef.current.testCaseToBugs[testCaseId] || [];
            const toAdd = newBugIds.filter((id) => !existingBugs.includes(id));
            const toRemove = existingBugs.filter((id) => !newBugIds.includes(id));

            await Promise.all([
                ...toAdd.map((bugId) => testCasesHook.linkBugToTestCase(testCaseId, bugId)),
                ...toRemove.map((bugId) => testCasesHook.unlinkBugFromTestCase(testCaseId, bugId)),
            ]);

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `Linked ${newBugIds.length} bug${newBugIds.length > 1 ? 's' : ''} to test case`,
            });
        } catch (error) {
            handleError(error, 'link bugs');
        }
    }, [
        testCasesHook.testCasesLocked,
        testCasesHook.linkBugToTestCase,
        testCasesHook.unlinkBugFromTestCase,
        uiHook.addNotification,
        handleError
    ]);

    const handleCreateTestCase = useCallback(() => {
        console.log('🚀 Create test case clicked - opening modal');

        if (testCasesHook.testCasesLocked) {
            console.warn('❌ Test cases locked due to subscription');
            uiHook.addNotification?.({
                type: 'error',
                title: 'Upgrade Required',
                message: 'Test cases are locked. Upgrade to access.',
            });
            return;
        }

        if (testCasesHook.canCreateTestCases === false) {
            console.warn('❌ Cannot create test cases due to plan limits');
            uiHook.addNotification?.({
                type: 'error',
                title: 'Upgrade Required',
                message: 'Upgrade to create test cases.',
            });
            return;
        }

        console.log('✅ Opening modal');
        setSelectedTestCase(null);
        setIsModalOpen(true);
    }, [
        testCasesHook.testCasesLocked,
        testCasesHook.canCreateTestCases,
        uiHook.addNotification
    ]);

    const handleAIGenerate = useCallback(() => {
        console.log('🚀 AI Generate clicked - navigating to generation page');

        if (testCasesHook.testCasesLocked) {
            console.warn('❌ Test cases locked due to subscription');
            uiHook.addNotification?.({
                type: 'error',
                title: 'Upgrade Required',
                message: 'Test cases are locked. Upgrade to access.',
            });
            return;
        }

        if (testCasesHook.canCreateTestCases === false) {
            console.warn('❌ Cannot create test cases due to plan limits');
            uiHook.addNotification?.({
                type: 'error',
                title: 'Upgrade Required',
                message: 'Upgrade to create test cases.',
            });
            return;
        }

        console.log('✅ Navigating to AI generation page');
        router.push('/testcases/generate');
    }, [
        testCasesHook.testCasesLocked,
        testCasesHook.canCreateTestCases,
        uiHook.addNotification,
        router
    ]);

    const handleEditTestCase = useCallback((testCase) => {
        if (testCasesHook.testCasesLocked) {
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: 'Test cases are locked. Upgrade to access.',
            });
            return;
        }

        setSelectedTestCase(testCase);
        setIsModalOpen(true);
    }, [testCasesHook.testCasesLocked, uiHook.addNotification]);

    const handleDeleteTestCase = useCallback(async (id) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            await testCasesHook.deleteTestCase(id);
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test case deleted successfully',
            });
        } catch (error) {
            handleError(error, 'delete test case');
        }
    }, [testCasesHook.testCasesLocked, testCasesHook.deleteTestCase, uiHook.addNotification, handleError]);

    const handleUpdateExecutionStatus = useCallback(async (testCaseId, newStatus) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const timestamp = new Date();
            await testCasesHook.updateTestCase(testCaseId, {
                executionStatus: newStatus,
                lastExecuted: timestamp,
                updated_at: timestamp,
            });

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `Test case marked as ${newStatus}`,
            });
        } catch (error) {
            handleError(error, 'update execution status');
        }
    }, [testCasesHook.testCasesLocked, testCasesHook.updateTestCase, uiHook.addNotification, handleError]);

    const handleBulkAction = useCallback(async (action, selectedIds) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            switch (action) {
                case 'delete':
                    await Promise.all(selectedIds.map((id) => testCasesHook.deleteTestCase(id)));
                    break;

                case 'run':
                    uiHook.addNotification?.({
                        type: 'info',
                        title: 'Running Tests',
                        message: `Running ${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''}`,
                    });
                    return;

                case 'pass':
                case 'fail':
                case 'block':
                    const statusMap = { pass: 'passed', fail: 'failed', block: 'blocked' };
                    await Promise.all(
                        selectedIds.map((id) =>
                            testCasesHook.updateTestCase(id, {
                                executionStatus: statusMap[action],
                                lastExecuted: timestamp,
                                updated_at: timestamp,
                            })
                        )
                    );
                    break;

                case 'reset':
                    await Promise.all(
                        selectedIds.map((id) =>
                            testCasesHook.updateTestCase(id, {
                                status: 'draft',
                                executionStatus: 'not_executed',
                                updated_at: timestamp,
                            })
                        )
                    );
                    break;

                case 'active':
                    await Promise.all(
                        selectedIds.map((id) =>
                            testCasesHook.updateTestCase(id, {
                                status: 'active',
                                updated_at: timestamp,
                            })
                        )
                    );
                    break;

                case 'archive':
                    await Promise.all(
                        selectedIds.map((id) =>
                            testCasesHook.updateTestCase(id, {
                                status: 'archived',
                                updated_at: timestamp,
                            })
                        )
                    );
                    break;

                default:
                    await Promise.all(
                        selectedIds.map((id) =>
                            testCasesHook.updateTestCase(id, {
                                status: action,
                                updated_at: timestamp,
                            })
                        )
                    );
                    break;
            }

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} updated`,
            });
        } catch (error) {
            handleError(error, 'bulk action');
        }
    }, [
        testCasesHook.testCasesLocked,
        testCasesHook.deleteTestCase,
        testCasesHook.updateTestCase,
        uiHook.addNotification,
        handleError
    ]);

    const handleRunNotification = useCallback(() => {
        uiHook.addNotification?.({
            type: 'info',
            title: 'Run',
            message: 'Run functionality not implemented yet',
        });
    }, [uiHook.addNotification]);

    const handleImportComplete = useCallback(async (importedTestCases) => {
        setIsImportModalOpen(false);

        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const timestamp = new Date();
            await Promise.all(
                importedTestCases.map((tc) =>
                    testCasesHook.createTestCase({
                        ...tc,
                        created_at: timestamp,
                        updated_at: timestamp,
                    })
                )
            );

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test cases imported successfully',
            });
        } catch (error) {
            handleError(error, 'import test cases');
        }
    }, [testCasesHook.testCasesLocked, testCasesHook.createTestCase, uiHook.addNotification, handleError]);

    const handleCloseModal = useCallback(() => {
        console.log('🔒 Closing modal');
        setIsModalOpen(false);
        setSelectedTestCase(null);
    }, []);

    // Memoize components with minimal, stable dependencies
    const tableComponent = useMemo(() => (
        <TestCaseTable
            testCases={filteredTestCases}
            bugs={bugsRef.current}
            relationships={relationshipsRef.current}
            selectedTestCases={testCasesHook.selectedTestCases}
            onSelectTestCases={testCasesHook.selectTestCases}
            onEdit={handleEditTestCase}
            onDelete={handleDeleteTestCase}
            onBulkAction={handleBulkAction}
            onView={handleEditTestCase}
            onRun={handleRunNotification}
            onLinkBug={handleLinkBug}
            onUpdateExecutionStatus={handleUpdateExecutionStatus}
        />
    ), [
        filteredTestCases,
        testCasesHook.selectedTestCases,
        testCasesHook.selectTestCases,
        handleEditTestCase,
        handleDeleteTestCase,
        handleBulkAction,
        handleRunNotification,
        handleLinkBug,
        handleUpdateExecutionStatus
    ]);

    const listComponent = useMemo(() => (
        <TestCaseList
            testCases={filteredTestCases}
            bugs={bugsRef.current}
            relationships={relationshipsRef.current}
            selectedTestCases={testCasesHook.selectedTestCases}
            onSelectTestCases={testCasesHook.selectTestCases}
            onEdit={handleEditTestCase}
            onDelete={handleDeleteTestCase}
            onBulkAction={handleBulkAction}
            onView={handleEditTestCase}
            onRun={handleRunNotification}
            onLinkBug={handleLinkBug}
        />
    ), [
        filteredTestCases,
        testCasesHook.selectedTestCases,
        testCasesHook.selectTestCases,
        handleEditTestCase,
        handleDeleteTestCase,
        handleBulkAction,
        handleRunNotification,
        handleLinkBug
    ]);

    // Loading state
    if (testCasesHook.loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-foreground">Loading test cases...</p>
                </div>
            </div>
        );
    }

    // Early return for locked state
    if (testCasesHook.testCasesLocked) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-foreground">Test Cases</h1>
                    </div>
                    <div className="bg-card shadow-theme-md rounded-lg p-6">
                        <p className="text-muted-foreground">Test cases are locked. Upgrade to access.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Test Cases</h1>
                        <span className="ml-2 px-2 py-1 bg-muted rounded-full text-xs font-normal text-muted-foreground">
                            {filteredTestCases.length} {filteredTestCases.length === 1 ? 'test case' : 'test cases'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            onClick={() => setIsTraceabilityOpen(true)}
                            className="btn-primary text-sm whitespace-nowrap"
                        >
                            Traceability
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="btn-primary text-sm whitespace-nowrap"
                        >
                            Import
                        </button>
                        <button
                            onClick={handleAIGenerate}
                            className="btn-primary text-sm whitespace-nowrap"
                        >
                            AI Generate
                        </button>
                        <button
                            onClick={handleCreateTestCase}
                            className="btn-primary text-sm whitespace-nowrap"
                        >
                            Create Test Case
                        </button>
                    </div>
                </div>

                <FilterBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    testCases={testCasesRef.current}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div className="transition-opacity duration-300">
                    {viewMode === 'table' ? tableComponent : listComponent}
                </div>

                {isModalOpen && (
                    <TestCaseModal
                        testCase={selectedTestCase}
                        onClose={handleCloseModal}
                        onSave={handleSaveTestCase}
                        activeSuite={testCasesHook.activeSuite || { id: 'default', name: 'Default Suite' }}
                        currentUser={testCasesHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                    />
                )}

                {isImportModalOpen && (
                    <ImportModal
                        onClose={() => setIsImportModalOpen(false)}
                        onImportComplete={handleImportComplete}
                    />
                )}

                {isTraceabilityOpen && (
                    <TraceabilityMatrix
                        testCases={testCasesRef.current}
                        relationships={relationshipsRef.current}
                        onClose={() => setIsTraceabilityOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default TestCases;