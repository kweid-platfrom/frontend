/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import { TestManagementTooltips } from '@/components/ai/AppAITooltips';
import { useTestCases } from '@/hooks/useTestCases';
import { useUI } from '@/hooks/useUI';
import { useRouter } from 'next/navigation';

const TestCases = () => {
    const router = useRouter();
    const testCasesHook = useTestCases({ testCases: {}, bugs: {}, auth: {}, suites: {}, ui: {}, subscription: {} }); // Adjust slices as needed
    const uiHook = useUI();

    useEffect(() => {
        console.log('🔍 TestCases Hook Debug:', {
            hookData: {
                currentUser: testCasesHook.currentUser,
                activeSuite: testCasesHook.activeSuite,
                testCasesLocked: testCasesHook.testCasesLocked,
                canCreateTestCases: testCasesHook.canCreateTestCases,
                testCases: testCasesHook.testCases?.length || 0,
                loading: testCasesHook.loading,
            },
            hookMethods: {
                createTestCase: typeof testCasesHook.createTestCase,
                updateTestCase: typeof testCasesHook.updateTestCase,
                deleteTestCase: typeof testCasesHook.deleteTestCase,
                linkBugToTestCase: typeof testCasesHook.linkBugToTestCase,
                unlinkBugFromTestCase: typeof testCasesHook.unlinkBugFromTestCase,
            },
        });
    }, [
        testCasesHook.currentUser,
        testCasesHook.activeSuite,
        testCasesHook.testCasesLocked,
        testCasesHook.canCreateTestCases,
        testCasesHook.testCases?.length,
        testCasesHook.loading,
        testCasesHook.linkBugToTestCase,
        testCasesHook.unlinkBugFromTestCase,
    ]);

    const testCasesRef = useRef(testCasesHook.testCases || []);
    const bugsRef = useRef(testCasesHook.bugs || []);
    const relationshipsRef = useRef(testCasesHook.relationships || { testCaseToBugs: {} });

    useEffect(() => {
        testCasesRef.current = testCasesHook.testCases || [];
    }, [testCasesHook.testCases]);

    useEffect(() => {
        bugsRef.current = testCasesHook.bugs || [];
    }, [testCasesHook.bugs]);

    useEffect(() => {
        relationshipsRef.current = testCasesHook.relationships || { testCaseToBugs: {} };
    }, [testCasesHook.relationships]);

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
        severity: 'all',
        executionStatus: 'all',
        assignee: 'all',
        component: 'all',
        testType: 'all',
        environment: 'all',
        automationStatus: 'all',
        tags: [],
        lastUpdated: 'all',
    });

    useEffect(() => {
        console.log('🔍 Modal state changed:', {
            isModalOpen,
            selectedTestCase: selectedTestCase?.id || null,
            currentUser: testCasesHook.currentUser?.uid || null,
            activeSuite: testCasesHook.activeSuite?.id || null,
            canCreateTestCases: testCasesHook.canCreateTestCases,
            testCasesLocked: testCasesHook.testCasesLocked,
        });
    }, [isModalOpen, selectedTestCase, testCasesHook.currentUser, testCasesHook.activeSuite]);

    const aiMonitoredData = useMemo(() => {
        const requirements =
            testCasesHook.activeSuite?.description ||
            testCasesRef.current
                .map((tc) => tc.description)
                .filter((desc) => desc && desc.length > 50)
                .join(' ')
                .substring(0, 500) ||
            'Web application testing requirements';

        const recentlyUpdated = testCasesRef.current.filter((tc) => {
            if (!tc.updated_at) return false;
            const updatedAt = new Date(tc.updated_at);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return updatedAt > dayAgo;
        });

        const changedComponents = recentlyUpdated
            .map((tc) => tc.component)
            .filter((comp) => comp)
            .filter((comp, index, arr) => arr.indexOf(comp) === index);

        return {
            testCases: testCasesRef.current,
            requirements,
            changedComponents,
            recentActivity: recentlyUpdated.map((tc) => ({
                id: tc.id,
                type: 'test_case_update',
                timestamp: tc.updated_at,
                component: tc.component,
                status: tc.status,
            })),
            activeSuite: testCasesHook.activeSuite,
            currentUser: testCasesHook.currentUser,
            filters,
            viewMode,
            selectedCount: testCasesHook.selectedTestCases?.length || 0,
            metrics: {
                totalTestCases: testCasesRef.current.length,
                passedTests: testCasesRef.current.filter((tc) => tc.executionStatus === 'passed').length,
                failedTests: testCasesRef.current.filter((tc) => tc.executionStatus === 'failed').length,
                blockedTests: testCasesRef.current.filter((tc) => tc.executionStatus === 'blocked').length,
                notExecutedTests: testCasesRef.current.filter((tc) => tc.executionStatus === 'not_executed').length,
                automatedTests: testCasesRef.current.filter((tc) => tc.automationStatus === 'automated').length,
                criticalTests: testCasesRef.current.filter((tc) => tc.priority === 'critical').length,
                highTests: testCasesRef.current.filter((tc) => tc.priority === 'high').length,
                components: [...new Set(testCasesRef.current.map((tc) => tc.component).filter(Boolean))],
                lastUpdateTime:
                    testCasesRef.current.length > 0
                        ? Math.max(
                              ...testCasesRef.current
                                  .map((tc) => (tc.updated_at ? new Date(tc.updated_at).getTime() : 0))
                                  .filter((time) => !isNaN(time))
                          )
                        : Date.now(),
            },
        };
    }, [
        testCasesHook.testCases,
        testCasesHook.activeSuite,
        testCasesHook.currentUser,
        testCasesHook.selectedTestCases,
        filters,
        viewMode,
    ]);

    const applyFiltersStable = useCallback((currentTestCases, currentFilters) => {
        if (!Array.isArray(currentTestCases)) return [];

        let filtered = [...currentTestCases];

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

        if (currentFilters.status !== 'all') {
            filtered = filtered.filter((tc) => tc.status === currentFilters.status);
        }

        if (currentFilters.priority !== 'all') {
            filtered = filtered.filter((tc) => tc.priority === currentFilters.priority);
        }

        if (currentFilters.severity !== 'all') {
            filtered = filtered.filter((tc) => tc.severity === currentFilters.severity);
        }

        if (currentFilters.executionStatus !== 'all') {
            filtered = filtered.filter((tc) => tc.executionStatus === currentFilters.executionStatus);
        }

        if (currentFilters.assignee !== 'all') {
            filtered = filtered.filter((tc) =>
                tc.assignee === currentFilters.assignee || (!tc.assignee && currentFilters.assignee === '')
            );
        }

        if (currentFilters.component !== 'all') {
            filtered = filtered.filter((tc) => tc.component === currentFilters.component);
        }

        if (currentFilters.testType !== 'all') {
            filtered = filtered.filter((tc) => tc.testType === currentFilters.testType);
        }

        if (currentFilters.environment !== 'all') {
            filtered = filtered.filter((tc) => tc.environment === currentFilters.environment);
        }

        if (currentFilters.automationStatus !== 'all') {
            filtered = filtered.filter((tc) => tc.automationStatus === currentFilters.automationStatus);
        }

        if (currentFilters.tags?.length > 0) {
            filtered = filtered.filter((tc) =>
                tc.tags && currentFilters.tags.every((tag) => tc.tags.includes(tag))
            );
        }

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
    }, []);

    useEffect(() => {
        const newFilteredTestCases = applyFiltersStable(testCasesRef.current, filters);
        setFilteredTestCases(newFilteredTestCases);
    }, [testCasesHook.testCases, filters, applyFiltersStable]);

    const handleError = useCallback(
        (error, context) => {
            console.error(`Error in ${context}:`, error);
            if (uiHook.addNotification) {
                uiHook.addNotification({
                    type: 'error',
                    title: 'Error',
                    message: `Failed to ${context}: ${error.message}`,
                    persistent: true,
                });
            }
        },
        [uiHook.addNotification]
    );

    const handleSaveTestCase = useCallback(
        async (testCaseData) => {
            try {
                console.log('💾 Saving test case:', {
                    testCaseData: testCaseData.title,
                    isEdit: !!selectedTestCase,
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
        },
        [
            testCasesHook.testCasesLocked,
            testCasesHook.updateTestCase,
            testCasesHook.createTestCase,
            selectedTestCase,
            uiHook.addNotification,
            handleError,
        ]
    );

    const handleLinkBug = useCallback(
        async (testCaseId, newBugIds) => {
            try {
                if (testCasesHook.testCasesLocked) {
                    throw new Error('Test cases are locked. Upgrade to access.');
                }

                if (typeof testCasesHook.linkBugToTestCase !== 'function') {
                    throw new Error('Bug linking functionality is not available');
                }

                await testCasesHook.linkBugToTestCase(testCaseId, newBugIds);

                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: `Linked ${newBugIds.length} bug${newBugIds.length > 1 ? 's' : ''} to test case`,
                });
            } catch (error) {
                handleError(error, 'link bugs');
            }
        },
        [testCasesHook.testCasesLocked, testCasesHook.linkBugToTestCase, uiHook.addNotification, handleError]
    );

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
    }, [testCasesHook.testCasesLocked, testCasesHook.canCreateTestCases, uiHook.addNotification]);

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
    }, [testCasesHook.testCasesLocked, testCasesHook.canCreateTestCases, uiHook.addNotification, router]);

    const handleEditTestCase = useCallback(
        (testCase) => {
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
        },
        [testCasesHook.testCasesLocked, uiHook.addNotification]
    );

    const handleDeleteTestCase = useCallback(
        async (id) => {
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
        },
        [testCasesHook.testCasesLocked, testCasesHook.deleteTestCase, uiHook.addNotification, handleError]
    );

    const handleUpdateExecutionStatus = useCallback(
        async (testCaseId, newStatus) => {
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
        },
        [testCasesHook.testCasesLocked, testCasesHook.updateTestCase, uiHook.addNotification, handleError]
    );

    const handleBulkAction = useCallback(
        async (action, selectedIds) => {
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
        },
        [
            testCasesHook.testCasesLocked,
            testCasesHook.deleteTestCase,
            testCasesHook.updateTestCase,
            uiHook.addNotification,
            handleError,
        ]
    );

    const handleRunNotification = useCallback(() => {
        uiHook.addNotification?.({
            type: 'info',
            title: 'Run',
            message: 'Run functionality not implemented yet',
        });
    }, [uiHook.addNotification]);

    const handleImportComplete = useCallback(
        async (importedTestCases) => {
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
        },
        [testCasesHook.testCasesLocked, testCasesHook.createTestCase, uiHook.addNotification, handleError]
    );

    const handleCloseModal = useCallback(() => {
        console.log('🔒 Closing modal');
        setIsModalOpen(false);
        setSelectedTestCase(null);
    }, []);

    const tableComponent = useMemo(
        () => (
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
        ),
        [
            filteredTestCases,
            testCasesHook.selectedTestCases,
            testCasesHook.selectTestCases,
            handleEditTestCase,
            handleDeleteTestCase,
            handleBulkAction,
            handleRunNotification,
            handleLinkBug,
            handleUpdateExecutionStatus,
        ]
    );

    const listComponent = useMemo(
        () => (
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
                onUpdateExecutionStatus={handleUpdateExecutionStatus}
            />
        ),
        [
            filteredTestCases,
            testCasesHook.selectedTestCases,
            testCasesHook.selectTestCases,
            handleEditTestCase,
            handleDeleteTestCase,
            handleBulkAction,
            handleRunNotification,
            handleLinkBug,
            handleUpdateExecutionStatus,
        ]
    );

    if (testCasesHook.loading) {
        return (
            <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center font-poppins">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary mx-auto"></div>
                    <p className="mt-4 text-foreground dark:text-foreground">Loading test cases...</p>
                </div>
            </div>
        );
    }

    if (testCasesHook.testCasesLocked) {
        return (
            <div className="min-h-screen bg-background dark:bg-background font-poppins">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Test Cases</h1>
                    </div>
                    <div className="bg-card dark:bg-card shadow-theme-md rounded-lg p-6">
                        <p className="text-muted-foreground dark:text-muted-foreground">Test cases are locked. Upgrade to access.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark:bg-background font-poppins">
            <TestManagementTooltips
                testCases={aiMonitoredData.testCases}
                requirements={aiMonitoredData.requirements}
                changedComponents={aiMonitoredData.changedComponents}
            />

            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">Test Cases</h1>
                        <span className="ml-2 px-2 py-1 bg-muted dark:bg-muted rounded-full text-xs font-normal text-muted-foreground dark:text-muted-foreground">
                            {filteredTestCases.length} {filteredTestCases.length === 1 ? 'test case' : 'test cases'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            onClick={() => setIsTraceabilityOpen(true)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground dark:text-primary-foreground bg-primary dark:bg-primary border border-primary dark:border-primary rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring transition-colors whitespace-nowrap"
                        >
                            Traceability
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground dark:text-primary-foreground bg-primary dark:bg-primary border border-primary dark:border-primary rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring transition-colors whitespace-nowrap"
                        >
                            Import
                        </button>
                        <button
                            onClick={handleAIGenerate}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground dark:text-primary-foreground bg-primary dark:bg-primary border border-primary dark:border-primary rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring transition-colors whitespace-nowrap"
                        >
                            AI Generate
                        </button>
                        <button
                            onClick={handleCreateTestCase}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground dark:text-primary-foreground bg-primary dark:bg-primary border border-primary dark:border-primary rounded-lg hover:bg-primary/90 dark:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-ring transition-colors whitespace-nowrap test-creation-area"
                        >
                            Create Test Case
                        </button>
                    </div>
                </div>

                <div className="test-list-header">
                    <FilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        testCases={testCasesRef.current}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                </div>

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