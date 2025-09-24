/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import { useApp } from '@/context/AppProvider';
import { useRouter } from 'next/navigation';

const TestCases = () => {
    const router = useRouter();
    
    // Use the app context instead of calling hooks directly
    const {
        state,
        actions,
        isAuthenticated,
        currentUser,
        activeSuite,
        isLoading
    } = useApp();

    // Extract test case specific data from state
    const {
        testCases: testCasesState = {},
        bugs: bugsState = {},
        relationships = { testCaseToBugs: {} },
        subscription = {}
    } = state;

    // Debug the state structure
    useEffect(() => {
        console.log('State structure debug:', {
            fullState: state,
            testCasesState,
            bugsState,
            stateKeys: Object.keys(state),
            testCasesType: typeof testCasesState,
            testCasesIsArray: Array.isArray(testCasesState)
        });
    }, [state, testCasesState, bugsState]);

    // Get the actual arrays from the state objects - try multiple possible paths
    let testCases = [];
    let bugs = [];

    // Try to extract testCases from various possible state structures
    if (Array.isArray(testCasesState)) {
        testCases = testCasesState;
    } else if (testCasesState?.testCases && Array.isArray(testCasesState.testCases)) {
        testCases = testCasesState.testCases;
    } else if (testCasesState?.items && Array.isArray(testCasesState.items)) {
        testCases = testCasesState.items;
    } else if (state.testCases && Array.isArray(state.testCases)) {
        testCases = state.testCases;
    }

    // Try to extract bugs from various possible state structures  
    if (Array.isArray(bugsState)) {
        bugs = bugsState;
    } else if (bugsState?.bugs && Array.isArray(bugsState.bugs)) {
        bugs = bugsState.bugs;
    } else if (bugsState?.items && Array.isArray(bugsState.items)) {
        bugs = bugsState.items;
    } else if (state.bugs && Array.isArray(state.bugs)) {
        bugs = state.bugs;
    }

    console.log('Final arrays:', { testCases: testCases.length, bugs: bugs.length });

    // Extract actions - fix the destructuring
    const {
        testCases: testCaseActions,
        ui: { showNotification },
        linking
    } = actions;

    // Debug the actions structure
    useEffect(() => {
        console.log('Actions structure debug:', {
            testCaseActions: testCaseActions ? Object.keys(testCaseActions) : 'undefined',
            testCaseActionsArray: Array.isArray(testCaseActions) ? testCaseActions : 'not array',
            actionsKeys: Object.keys(actions),
            updateTestCaseType: typeof testCaseActions?.updateTestCase,
            createTestCaseType: typeof testCaseActions?.createTestCase,
            deleteTestCaseType: typeof testCaseActions?.deleteTestCase,
            fullActions: actions
        });
    }, [actions, testCaseActions]);

    // Since testCaseActions appears to be an array, let's try to extract methods differently
    const actualTestCaseActions = useMemo(() => {
        // If it's an array, try to find the actual actions object
        if (Array.isArray(testCaseActions)) {
            console.log('testCaseActions is array:', testCaseActions);
            // Look for actions in the array or use direct actions
            return {
                createTestCase: actions.createTestCase,
                updateTestCase: actions.updateTestCase, 
                deleteTestCase: actions.deleteTestCase || testCaseActions.find(action => typeof action === 'function')
            };
        }
        return testCaseActions;
    }, [testCaseActions, actions]);

    console.log('Final actualTestCaseActions:', actualTestCaseActions);

    // Component state
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [selectedTestCases, setSelectedTestCases] = useState([]);
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

    // Check permissions
    const testCasesLocked = subscription?.testCasesLocked || false;
    const canCreateTestCases = subscription?.canCreateTestCases !== false;

    // Filter test cases based on current filters
    const applyFilters = useCallback((testCasesToFilter, currentFilters) => {
        if (!Array.isArray(testCasesToFilter)) return [];

        return testCasesToFilter.filter((testCase) => {
            // Search filter
            if (currentFilters.search) {
                const searchTerm = currentFilters.search.toLowerCase();
                const searchableText = [
                    testCase.title,
                    testCase.description,
                    testCase.id?.toString(),
                    testCase.component,
                    testCase.assignee,
                    ...(testCase.tags || [])
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            // Status filters
            if (currentFilters.status !== 'all' && testCase.status !== currentFilters.status) return false;
            if (currentFilters.priority !== 'all' && testCase.priority !== currentFilters.priority) return false;
            if (currentFilters.severity !== 'all' && testCase.severity !== currentFilters.severity) return false;
            if (currentFilters.executionStatus !== 'all' && testCase.executionStatus !== currentFilters.executionStatus) return false;
            if (currentFilters.assignee !== 'all' && testCase.assignee !== currentFilters.assignee) return false;
            if (currentFilters.component !== 'all' && testCase.component !== currentFilters.component) return false;
            if (currentFilters.testType !== 'all' && testCase.testType !== currentFilters.testType) return false;
            if (currentFilters.environment !== 'all' && testCase.environment !== currentFilters.environment) return false;
            if (currentFilters.automationStatus !== 'all' && testCase.automationStatus !== currentFilters.automationStatus) return false;

            // Tags filter
            if (currentFilters.tags?.length > 0) {
                const testCaseTags = testCase.tags || [];
                if (!currentFilters.tags.every(tag => testCaseTags.includes(tag))) return false;
            }

            // Date filter
            if (currentFilters.lastUpdated !== 'all') {
                const updatedDate = new Date(testCase.updated_at);
                const now = new Date();
                
                switch (currentFilters.lastUpdated) {
                    case 'today':
                        if (updatedDate.toDateString() !== now.toDateString()) return false;
                        break;
                    case 'week':
                        if (updatedDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
                        break;
                    case 'month':
                        if (updatedDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
                        break;
                    case 'quarter':
                        if (updatedDate < new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)) return false;
                        break;
                }
            }

            return true;
        });
    }, []);

    // Update filtered test cases when data or filters change
    useEffect(() => {
        const filtered = applyFilters(testCases, filters);
        setFilteredTestCases(filtered);
    }, [testCases, filters, applyFilters]);

    // Error notification helper
    const showError = useCallback((message, title = 'Error') => {
        showNotification?.({
            type: 'error',
            title,
            message,
            persistent: true
        });
    }, [showNotification]);

    // Success notification helper
    const showSuccess = useCallback((message, title = 'Success') => {
        showNotification?.({
            type: 'success',
            title,
            message
        });
    }, [showNotification]);

    // Check if operations are allowed
    const checkPermissions = useCallback(() => {
        if (testCasesLocked) {
            showError('Test cases are locked. Upgrade to access.', 'Upgrade Required');
            return false;
        }
        if (!canCreateTestCases) {
            showError('Upgrade to create test cases.', 'Upgrade Required');
            return false;
        }
        return true;
    }, [testCasesLocked, canCreateTestCases, showError]);

    // Handlers
    const handleCreateTestCase = useCallback(() => {
        if (!checkPermissions()) return;
        setSelectedTestCase(null);
        setIsModalOpen(true);
    }, [checkPermissions]);

    const handleEditTestCase = useCallback((testCase) => {
        if (testCasesLocked) {
            showError('Test cases are locked. Upgrade to access.');
            return;
        }
        setSelectedTestCase(testCase);
        setIsModalOpen(true);
    }, [testCasesLocked, showError]);

    const handleSaveTestCase = useCallback(async (testCaseData) => {
        try {
            if (!checkPermissions()) return;

            // Use the corrected actions
            const createFn = actualTestCaseActions?.createTestCase;
            const updateFn = actualTestCaseActions?.updateTestCase;

            // Check if the required methods exist
            if (!updateFn || !createFn) {
                console.error('Test case actions not available:', {
                    updateTestCase: typeof updateFn,
                    createTestCase: typeof createFn,
                    actualTestCaseActions
                });
                showError('Test case actions are not available. Please refresh the page.');
                return;
            }

            const timestamp = new Date();

            if (selectedTestCase?.id) {
                // Update existing test case
                await updateFn(selectedTestCase.id, {
                    ...testCaseData,
                    updated_at: timestamp
                });
                showSuccess('Test case updated successfully');
            } else {
                // Create new test case
                await createFn({
                    ...testCaseData,
                    created_at: timestamp,
                    updated_at: timestamp
                });
                showSuccess('Test case created successfully');
            }

            setIsModalOpen(false);
            setSelectedTestCase(null);
        } catch (error) {
            console.error('Error saving test case:', error);
            showError(error.message || 'Failed to save test case');
        }
    }, [selectedTestCase, actualTestCaseActions, checkPermissions, showSuccess, showError]);

    const handleDeleteTestCase = useCallback(async (id) => {
        try {
            if (testCasesLocked) {
                showError('Test cases are locked. Upgrade to access.');
                return;
            }

            const deleteFn = actualTestCaseActions?.deleteTestCase;
            if (!deleteFn) {
                showError('Delete function not available.');
                return;
            }

            await deleteFn(id);
            showSuccess('Test case deleted successfully');
        } catch (error) {
            console.error('Error deleting test case:', error);
            showError(error.message || 'Failed to delete test case');
        }
    }, [actualTestCaseActions, testCasesLocked, showSuccess, showError]);

    const handleUpdateExecutionStatus = useCallback(async (testCaseId, newStatus) => {
        try {
            if (testCasesLocked) {
                showError('Test cases are locked. Upgrade to access.');
                return;
            }

            const updateFn = actualTestCaseActions?.updateTestCase;
            if (!updateFn) {
                showError('Update function not available.');
                return;
            }

            const timestamp = new Date();
            await updateFn(testCaseId, {
                executionStatus: newStatus,
                lastExecuted: timestamp,
                updated_at: timestamp
            });

            showSuccess(`Test case marked as ${newStatus}`);
        } catch (error) {
            console.error('Error updating execution status:', error);
            showError(error.message || 'Failed to update execution status');
        }
    }, [actualTestCaseActions, testCasesLocked, showSuccess, showError]);

    const handleBulkAction = useCallback(async (action, selectedIds) => {
        try {
            if (testCasesLocked) {
                showError('Test cases are locked. Upgrade to access.');
                return;
            }

            const timestamp = new Date();
            const updates = [];

            switch (action) {
                case 'delete':
                    await Promise.all(selectedIds.map(id => testCaseActions.deleteTestCase(id)));
                    break;

                case 'run':
                    showNotification?.({
                        type: 'info',
                        title: 'Running Tests',
                        message: `Running ${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''}`
                    });
                    return;

                case 'pass':
                case 'fail':
                case 'block':
                    const statusMap = { pass: 'passed', fail: 'failed', block: 'blocked' };
                    selectedIds.forEach(id => {
                        updates.push(testCaseActions.updateTestCase(id, {
                            executionStatus: statusMap[action],
                            lastExecuted: timestamp,
                            updated_at: timestamp
                        }));
                    });
                    break;

                case 'reset':
                    selectedIds.forEach(id => {
                        updates.push(testCaseActions.updateTestCase(id, {
                            status: 'draft',
                            executionStatus: 'not_executed',
                            updated_at: timestamp
                        }));
                    });
                    break;

                case 'active':
                case 'archive':
                    selectedIds.forEach(id => {
                        updates.push(testCaseActions.updateTestCase(id, {
                            status: action === 'active' ? 'active' : 'archived',
                            updated_at: timestamp
                        }));
                    });
                    break;

                default:
                    selectedIds.forEach(id => {
                        updates.push(testCaseActions.updateTestCase(id, {
                            status: action,
                            updated_at: timestamp
                        }));
                    });
            }

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            showSuccess(`${selectedIds.length} test case${selectedIds.length > 1 ? 's' : ''} updated`);
        } catch (error) {
            console.error('Error in bulk action:', error);
            showError(error.message || 'Failed to perform bulk action');
        }
    }, [testCaseActions, testCasesLocked, showNotification, showSuccess, showError]);

    const handleLinkBug = useCallback(async (testCaseId, bugIds) => {
        try {
            if (testCasesLocked) {
                showError('Test cases are locked. Upgrade to access.');
                return;
            }

            if (actions.linking?.linkBugsToTestCase) {
                await actions.linking.linkBugsToTestCase(testCaseId, bugIds);
                showSuccess(`Linked ${bugIds.length} bug${bugIds.length > 1 ? 's' : ''} to test case`);
            } else {
                showError('Bug linking functionality is not available');
            }
        } catch (error) {
            console.error('Error linking bugs:', error);
            showError(error.message || 'Failed to link bugs');
        }
    }, [actions.linking, testCasesLocked, showSuccess, showError]);

    const handleAIGenerate = useCallback(() => {
        if (!checkPermissions()) return;
        router.push('/testcases/generate');
    }, [checkPermissions, router]);

    const handleImportComplete = useCallback(async (importedTestCases) => {
        setIsImportModalOpen(false);
        
        try {
            if (!checkPermissions()) return;

            const timestamp = new Date();
            const promises = importedTestCases.map(tc => testCaseActions.createTestCase({
                ...tc,
                created_at: timestamp,
                updated_at: timestamp
            }));

            await Promise.all(promises);
            showSuccess(`${importedTestCases.length} test cases imported successfully`);
        } catch (error) {
            console.error('Error importing test cases:', error);
            showError(error.message || 'Failed to import test cases');
        }
    }, [testCaseActions, checkPermissions, showSuccess, showError]);

    const handleRunNotification = useCallback(() => {
        showNotification?.({
            type: 'info',
            title: 'Run',
            message: 'Run functionality not implemented yet'
        });
    }, [showNotification]);

    // Memoized components
    const tableComponent = useMemo(() => (
        <TestCaseTable
            testCases={filteredTestCases}
            bugs={bugs}
            relationships={relationships}
            selectedTestCases={selectedTestCases}
            onSelectTestCases={setSelectedTestCases}
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
        bugs,
        relationships,
        selectedTestCases,
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
            bugs={bugs}
            relationships={relationships}
            selectedTestCases={selectedTestCases}
            onSelectTestCases={setSelectedTestCases}
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
        bugs,
        relationships,
        selectedTestCases,
        handleEditTestCase,
        handleDeleteTestCase,
        handleBulkAction,
        handleRunNotification,
        handleLinkBug,
        handleUpdateExecutionStatus
    ]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center font-poppins">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary mx-auto"></div>
                    <p className="mt-4 text-foreground dark:text-foreground">Loading test cases...</p>
                </div>
            </div>
        );
    }

    // Locked state
    if (testCasesLocked) {
        return (
            <div className="min-h-screen bg-background dark:bg-background font-poppins">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Test Cases</h1>
                    </div>
                    <div className="bg-card dark:bg-card shadow-theme-md rounded-lg p-6">
                        <p className="text-muted-foreground dark:text-muted-foreground">
                            Test cases are locked. Upgrade to access.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Main component render
    return (
        <div className="min-h-screen bg-background dark:bg-background font-poppins">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">
                            Test Cases
                        </h1>
                        <span className="ml-2 px-2 py-1 bg-muted dark:bg-muted rounded-full text-xs font-normal text-muted-foreground dark:text-muted-foreground">
                            {filteredTestCases.length} {filteredTestCases.length === 1 ? 'test case' : 'test cases'}
                        </span>
                    </div>

                    {/* Action Buttons */}
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

                {/* Filter Bar */}
                <div className="test-list-header">
                    <FilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        testCases={testCases}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                </div>

                {/* Test Cases View */}
                <div className="transition-opacity duration-300">
                    {viewMode === 'table' ? tableComponent : listComponent}
                </div>

                {/* Modals */}
                {isModalOpen && (
                    <TestCaseModal
                        testCase={selectedTestCase}
                        onClose={() => {
                            setIsModalOpen(false);
                            setSelectedTestCase(null);
                        }}
                        onSave={handleSaveTestCase}
                        activeSuite={activeSuite || { id: 'default', name: 'Default Suite' }}
                        currentUser={currentUser || { uid: 'anonymous', email: 'anonymous' }}
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
                        testCases={testCases}
                        relationships={relationships}
                        onClose={() => setIsTraceabilityOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default TestCases;