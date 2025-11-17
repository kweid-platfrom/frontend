/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TestCaseTable from '@/components/testCase/TestCaseTable';
import TestCaseList from '@/components/testCase/TestCaseList';
import TestCaseModal from '@/components/testCase/TestCaseModal';
import FilterBar from '@/components/testCase/FilterBar';
import ImportModal from '@/components/testCase/ImportModal';
import TraceabilityMatrix from '@/components/testCase/TraceabilityMatrix';
import CreateTestRunModal from '@/components/testRuns/CreateTestRunModal';
import { useTestCases } from '@/hooks/useTestCases';
import { useTestRuns } from '@/hooks/useTestRuns';
import { useUI } from '@/hooks/useUI';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppProvider';
import { ChevronRight, ChevronDown, Play } from 'lucide-react';

const TestCases = () => {
    const router = useRouter();
    const { actions, state } = useApp();
    const testCasesHook = useTestCases();
    const testRunsHook = useTestRuns();
    const uiHook = useUI();

    // FIX: Properly initialize state with useState
    const [loadingActions, setLoadingActions] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [isCreateRunModalOpen, setIsCreateRunModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const sprints = state?.sprints?.sprints || [];
    const activeSuite = state?.testSuites?.activeSuite;

    // Grouping state
    const [groupBy, setGroupBy] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});

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

    // Debug logging
    useEffect(() => {
        console.log('🔍 TestCasesPage state:', {
            hasSetLoadingActions: typeof setLoadingActions === 'function',
            hasSetSelectedItems: typeof setSelectedItems === 'function',
            loadingActionsCount: loadingActions.length,
            selectedItemsCount: selectedItems.length,
            testCasesCount: testCasesRef.current.length
        });
    }, [loadingActions, selectedItems]);

    // Unified notification function - FIX FOR TOAST ISSUE
    const showNotification = useCallback((type, title, message, persistent = false) => {
        const notification = { type, title, message, persistent };
        
        // Try both notification methods to ensure it works
        if (uiHook.addNotification) {
            uiHook.addNotification(notification);
        }
        if (actions?.ui?.showNotification) {
            actions.ui.showNotification(notification);
        }
        
        // Fallback to console if neither works
        if (!uiHook.addNotification && !actions?.ui?.showNotification) {
            console.warn(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }, [uiHook, actions]);

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
                tc.assignee === currentFilters.assignee ||
                (!tc.assignee && currentFilters.assignee === '')
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

    const groupedTestCases = useMemo(() => {
        if (!groupBy) return null;

        const groups = {};
        filteredTestCases.forEach(testCase => {
            const groupValue = testCase[groupBy] || 'unassigned';
            if (!groups[groupValue]) {
                groups[groupValue] = [];
            }
            groups[groupValue].push(testCase);
        });

        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const statusOrder = { 'open': 0, 'in-progress': 1, 'passed': 2, 'failed': 3, 'blocked': 4, 'closed': 5 };

        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (groupBy === 'priority' || groupBy === 'severity') {
                const orderA = priorityOrder[a?.toLowerCase()] ?? 999;
                const orderB = priorityOrder[b?.toLowerCase()] ?? 999;
                return orderA - orderB;
            }
            if (groupBy === 'status' || groupBy === 'executionStatus') {
                const orderA = statusOrder[a?.toLowerCase()] ?? 999;
                const orderB = statusOrder[b?.toLowerCase()] ?? 999;
                return orderA - orderB;
            }
            return (a || '').localeCompare(b || '');
        });

        const sortedGroups = {};
        sortedKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }, [filteredTestCases, groupBy]);

    const toggleGroup = useCallback((groupKey) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    }, []);

    useEffect(() => {
        if (groupBy && groupedTestCases) {
            const allGroups = {};
            Object.keys(groupedTestCases).forEach(key => {
                allGroups[key] = true;
            });
            setExpandedGroups(allGroups);
        }
    }, [groupBy, groupedTestCases]);

    const getGroupDisplayName = (groupValue) => {
        if (!groupValue || groupValue === 'unassigned') return 'Unassigned';
        return groupValue.charAt(0).toUpperCase() + groupValue.slice(1).replace('_', ' ').replace(/([A-Z])/g, ' $1');
    };

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        showNotification('error', 'Error', `Failed to ${context}: ${error.message}`, true);
    }, [showNotification]);

    const handleSaveTestCase = useCallback(async (testCaseData) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            if (selectedTestCase) {
                await testCasesHook.updateTestCase(selectedTestCase.id, {
                    ...testCaseData,
                    updated_at: timestamp,
                });
                showNotification('success', 'Success', 'Test case updated successfully');
            } else {
                await testCasesHook.createTestCase({
                    ...testCaseData,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
                showNotification('success', 'Success', 'Test case created successfully');
            }

            setIsModalOpen(false);
            setSelectedTestCase(null);
        } catch (error) {
            handleError(error, 'save test case');
        }
    }, [testCasesHook, selectedTestCase, showNotification, handleError]);

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

            showNotification('success', 'Success', `Linked ${newBugIds.length} bug${newBugIds.length > 1 ? 's' : ''} to test case`);
        } catch (error) {
            handleError(error, 'link bugs');
        }
    }, [testCasesHook, showNotification, handleError]);

    const handleCreateTestCase = useCallback(() => {
        if (testCasesHook.testCasesLocked) {
            showNotification('error', 'Upgrade Required', 'Test cases are locked. Upgrade to access.');
            return;
        }

        if (testCasesHook.canCreateTestCases === false) {
            showNotification('error', 'Upgrade Required', 'Upgrade to create test cases.');
            return;
        }

        setSelectedTestCase(null);
        setIsModalOpen(true);
    }, [testCasesHook, showNotification]);

    const handleAIGenerate = useCallback(() => {
        if (testCasesHook.testCasesLocked) {
            showNotification('error', 'Upgrade Required', 'Test cases are locked. Upgrade to access.');
            return;
        }

        if (testCasesHook.canCreateTestCases === false) {
            showNotification('error', 'Upgrade Required', 'Upgrade to create test cases.');
            return;
        }

        router.push('/testcases/generate');
    }, [testCasesHook, showNotification, router]);

    const handleEditTestCase = useCallback((testCase) => {
        if (testCasesHook.testCasesLocked) {
            showNotification('error', 'Cannot Edit', 'Test cases are locked. Upgrade to access.');
            return;
        }

        // FIXED: Check if test case is in a run with proper notification
        if (testCase.runs && testCase.runs.length > 0) {
            showNotification(
                'warning',
                'Cannot Edit',
                `This test case is part of ${testCase.runs.length} test run(s). Please edit via the test run.`,
                true
            );
            return;
        }

        setSelectedTestCase(testCase);
        setIsModalOpen(true);
    }, [testCasesHook.testCasesLocked, showNotification]);

    const handleDeleteTestCase = useCallback(async (id) => {
        console.log('🗑️ handleDeleteTestCase called for:', id);
        
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            // FIXED: Check if test case is in a run with proper notification
            const testCase = testCasesRef.current.find(tc => tc.id === id);
            
            if (!testCase) {
                throw new Error('Test case not found');
            }
            
            console.log('📋 Test case to delete:', { id, title: testCase.title, runs: testCase.runs });
            
            if (testCase?.runs && testCase.runs.length > 0) {
                showNotification(
                    'warning',
                    'Cannot Delete',
                    `This test case is part of ${testCase.runs.length} test run(s) and cannot be deleted.`,
                    true
                );
                throw new Error('Test case is part of active runs');
            }

            console.log('⚡ Calling deleteTestCase from hook...');
            const result = await testCasesHook.deleteTestCase(id);
            console.log('✅ Delete result:', result);
            
            showNotification('success', 'Success', 'Test case deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Delete error:', error);
            handleError(error, 'delete test case');
            return { success: false, error };
        }
    }, [testCasesHook, showNotification, handleError]);

    const handleUpdateExecutionStatus = useCallback(async (testCaseId, newStatus) => {
        try {
            if (testCasesHook.testCasesLocked) {
                throw new Error('Test cases are locked. Upgrade to access.');
            }

            // FIXED: Check if test case is in a run with proper notification
            const testCase = testCasesRef.current.find(tc => tc.id === testCaseId);
            if (testCase?.runs && testCase.runs.length > 0) {
                showNotification(
                    'warning',
                    'Cannot Update',
                    `This test case is part of ${testCase.runs.length} test run(s). Please update via the test run.`,
                    true
                );
                return;
            }

            const timestamp = new Date();
            await testCasesHook.updateTestCase(testCaseId, {
                executionStatus: newStatus,
                lastExecuted: timestamp,
                updated_at: timestamp,
            });

            showNotification('success', 'Success', `Test case marked as ${newStatus}`);
        } catch (error) {
            handleError(error, 'update execution status');
        }
    }, [testCasesHook, showNotification, handleError]);

    // NEW: Check if test cases should be prevented from re-adding
    const checkPassedTestCases = useCallback((selectedIds) => {
        const passedTests = [];
        const eligibleTests = [];
        
        selectedIds.forEach(id => {
            const testCase = testCasesRef.current.find(tc => tc.id === id);
            if (!testCase) return;
            
            // Check if test was passed in the last run
            const lastRun = testCase.runs && testCase.runs.length > 0
                ? testCase.runs.sort((a, b) => {
                    const dateA = a.executed_at instanceof Date ? a.executed_at : new Date(a.executed_at);
                    const dateB = b.executed_at instanceof Date ? b.executed_at : new Date(b.executed_at);
                    return dateB - dateA;
                })[0]
                : null;
            
            const wasPassedRecently = lastRun && lastRun.executionStatus === 'passed';
            const daysSinceLastRun = lastRun?.executed_at
                ? Math.floor((new Date() - new Date(lastRun.executed_at)) / (1000 * 60 * 60 * 24))
                : null;
            
            const wasModifiedSinceLastRun = lastRun?.executed_at && testCase.updated_at
                ? new Date(testCase.updated_at) > new Date(lastRun.executed_at)
                : true;
            
            const shouldRetest = 
                !wasPassedRecently || 
                wasModifiedSinceLastRun || 
                (daysSinceLastRun && daysSinceLastRun > 30);
            
            if (wasPassedRecently && !shouldRetest) {
                passedTests.push({
                    ...testCase,
                    lastRunDate: lastRun.executed_at,
                    daysSinceLastRun
                });
            } else {
                eligibleTests.push(id);
            }
        });
        
        return { passedTests, eligibleTests };
    }, []);

    const handleCreateTestRun = useCallback(async (runData) => {
        try {
            const runDataWithSuite = {
                ...runData,
                suite_id: testCasesHook.activeSuite?.id || activeSuite?.id
            };

            const { passedTests, eligibleTests } = checkPassedTestCases(
                runData.test_cases,
                runData.sprint_id
            );

            if (passedTests.length > 0) {
                const shouldContinue = window.confirm(
                    `Warning: ${passedTests.length} test case(s) passed in recent runs:\n\n` +
                    passedTests.slice(0, 5).map(tc => 
                        `• ${tc.title} (passed ${tc.daysSinceLastRun} days ago)`
                    ).join('\n') +
                    (passedTests.length > 5 ? `\n...and ${passedTests.length - 5} more` : '') +
                    `\n\nDo you want to include them anyway?`
                );

                if (!shouldContinue) {
                    if (eligibleTests.length === 0) {
                        showNotification(
                            'info',
                            'No Tests Selected',
                            'All selected tests passed recently. No test run created.'
                        );
                        return;
                    }
                    
                    runDataWithSuite.test_cases = eligibleTests;
                    showNotification(
                        'info',
                        'Tests Filtered',
                        `Creating run with ${eligibleTests.length} test(s). ${passedTests.length} recently passed test(s) excluded.`
                    );
                }
            }

            await testRunsHook.createTestRun(runDataWithSuite);
            setIsCreateRunModalOpen(false);
            showNotification('success', 'Success', 'Test run created successfully');
            router.push('/testruns');
        } catch (error) {
            handleError(error, 'create test run');
        }
    }, [testRunsHook, testCasesHook.activeSuite, activeSuite, showNotification, router, handleError, checkPassedTestCases]);

    const handleBulkAction = async (actionId, selectedIds, actionConfig, selectedOption) => {
        console.log('🎯 Bulk action triggered:', { 
            actionId, 
            selectedIds, 
            actionConfig, 
            selectedOption,
            hasSetLoadingActions: typeof setLoadingActions === 'function',
            hasSetSelectedItems: typeof setSelectedItems === 'function'
        });
        
        // Filter out test cases that are in runs for execution-related actions
        const executionActions = ['pass', 'fail', 'block', 'reset'];
        let validSelectedIds = selectedIds;
        
        if (executionActions.includes(actionId)) {
            const testCasesInRuns = selectedIds.filter(id => {
                const tc = testCasesRef.current.find(t => t.id === id);
                return tc?.runs && tc.runs.length > 0;
            });

            const validTestCases = selectedIds.filter(id => {
                const tc = testCasesRef.current.find(t => t.id === id);
                return !tc?.runs || tc.runs.length === 0;
            });

            if (testCasesInRuns.length > 0) {
                showNotification(
                    'warning',
                    'Cannot Update Test Cases',
                    `${testCasesInRuns.length} test case(s) are part of test runs and cannot be modified here. Please update them via their respective test runs.`,
                    true
                );
            }

            if (validTestCases.length === 0) {
                return;
            }

            validSelectedIds = validTestCases;
        }

        setLoadingActions(prev => {
            console.log('📝 Adding to loading actions:', actionId);
            return [...prev, actionId];
        });

        try {
            switch (actionId) {
                case 'pass':
                    await Promise.all(
                        validSelectedIds.map(id => handleUpdateExecutionStatus(id, 'passed'))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) marked as passed`);
                    break;

                case 'fail':
                    await Promise.all(
                        validSelectedIds.map(id => handleUpdateExecutionStatus(id, 'failed'))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) marked as failed`);
                    break;

                case 'block':
                    await Promise.all(
                        validSelectedIds.map(id => handleUpdateExecutionStatus(id, 'blocked'))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) marked as blocked`);
                    break;

                case 'reset':
                    await Promise.all(
                        validSelectedIds.map(id => testCasesHook.updateTestCase(id, {
                            executionStatus: 'pending',
                            lastExecuted: null,
                            updated_at: new Date()
                        }))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) reset to pending`);
                    break;

                case 'run':
                    testCasesHook.selectTestCases(validSelectedIds);
                    setIsCreateRunModalOpen(true);
                    break;

                case 'delete':
                    console.log('🗑️ Delete action triggered for:', validSelectedIds);
                    
                    const deletableIds = validSelectedIds.filter(id => {
                        const tc = testCasesRef.current.find(t => t.id === id);
                        return !tc?.runs || tc.runs.length === 0;
                    });

                    const inRunsCount = validSelectedIds.length - deletableIds.length;
                    
                    console.log('📊 Delete validation:', { 
                        total: validSelectedIds.length, 
                        deletable: deletableIds.length, 
                        inRuns: inRunsCount 
                    });
                    
                    if (inRunsCount > 0) {
                        showNotification(
                            'warning',
                            'Cannot Delete',
                            `${inRunsCount} test case(s) are part of test runs and cannot be deleted.`,
                            true
                        );
                    }

                    if (deletableIds.length > 0) {
                        console.log('🔄 Deleting test cases:', deletableIds);
                        
                        // Delete each test case individually and track results
                        let successCount = 0;
                        let failCount = 0;
                        
                        for (const id of deletableIds) {
                            try {
                                await testCasesHook.deleteTestCase(id);
                                successCount++;
                                console.log(`✅ Deleted test case: ${id}`);
                            } catch (error) {
                                failCount++;
                                console.error(`❌ Failed to delete test case ${id}:`, error);
                            }
                        }
                        
                        if (successCount > 0) {
                            showNotification(
                                'success', 
                                'Success', 
                                `${successCount} test case(s) deleted successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`
                            );
                        }
                        
                        if (failCount > 0 && successCount === 0) {
                            throw new Error(`Failed to delete ${failCount} test case(s)`);
                        }
                    } else if (inRunsCount === 0) {
                        showNotification('info', 'No Items', 'No test cases to delete');
                    }
                    break;

                case 'archive':
                    await Promise.all(
                        validSelectedIds.map(id => testCasesHook.updateTestCase(id, {
                            status: 'archived',
                            updated_at: new Date()
                        }))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) archived`);
                    break;

                case 'activate':
                    await Promise.all(
                        validSelectedIds.map(id => testCasesHook.updateTestCase(id, {
                            status: 'active',
                            updated_at: new Date()
                        }))
                    );
                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) activated`);
                    break;

                case 'add-to-sprint':
                    if (!selectedOption || !selectedOption.id) {
                        showNotification('error', 'Error', 'Please select a sprint');
                        return;
                    }

                    const testCaseResult = await actions.linking.addTestCasesToSprint(
                        selectedOption.id,
                        validSelectedIds
                    );

                    if (testCaseResult.success) {
                        showNotification('success', 'Success', `${testCaseResult.data.added} test case(s) added to ${selectedOption.label}`);
                    }
                    break;

                case 'add-to-module':
                    if (!selectedOption || !selectedOption.id) {
                        showNotification('error', 'Error', 'Please select a module');
                        return;
                    }

                    await Promise.all(
                        validSelectedIds.map(id => testCasesHook.updateTestCase(id, {
                            module: selectedOption.label,
                            updated_at: new Date()
                        }))
                    );

                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) added to ${selectedOption.label}`);
                    break;

                case 'assign':
                    if (!selectedOption || !selectedOption.id) {
                        showNotification('error', 'Error', 'Please select a user');
                        return;
                    }

                    await Promise.all(
                        validSelectedIds.map(id => testCasesHook.updateTestCase(id, {
                            assignee: selectedOption.label,
                            updated_at: new Date()
                        }))
                    );

                    showNotification('success', 'Success', `${validSelectedIds.length} test case(s) assigned to ${selectedOption.label}`);
                    break;

                case 'group':
                    if (!selectedOption || !selectedOption.id) {
                        showNotification('error', 'Error', 'Please select a grouping option');
                        return;
                    }

                    setGroupBy(selectedOption.id);
                    showNotification('success', 'Success', `Test cases grouped by ${selectedOption.label}`);
                    break;

                default:
                    console.warn('Unhandled action:', actionId);
                    showNotification('info', 'Info', `Action "${actionId}" is not yet implemented`);
            }

            testCasesHook.selectTestCases([]);
            setSelectedItems([]);
        } catch (error) {
            console.error('💥 Bulk action failed:', error);
            showNotification('error', 'Error', `Failed to ${actionId}: ${error.message}`);
        } finally {
            setLoadingActions(prev => {
                console.log('🧹 Removing from loading actions:', actionId);
                return prev.filter(id => id !== actionId);
            });
        }
    };

    const handleRunNotification = useCallback(() => {
        showNotification('info', 'Run', 'Run functionality not implemented yet');
    }, [showNotification]);

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

            showNotification('success', 'Success', 'Test cases imported successfully');
        } catch (error) {
            handleError(error, 'import test cases');
        }
    }, [testCasesHook, showNotification, handleError]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedTestCase(null);
    }, []);

    const renderTestCasesComponent = useCallback((testCases) => {
        const commonProps = {
            testCases,
            bugs: bugsRef.current,
            relationships: relationshipsRef.current,
            selectedTestCases: testCasesHook.selectedTestCases,
            onSelectTestCases: testCasesHook.selectTestCases,
            onEdit: handleEditTestCase,
            onDelete: handleDeleteTestCase,
            onBulkAction: handleBulkAction,
            onView: handleEditTestCase,
            onRun: handleRunNotification,
            onLinkBug: handleLinkBug,
            onUpdateExecutionStatus: handleUpdateExecutionStatus,
        };

        return viewMode === 'table' ? (
            <TestCaseTable {...commonProps} />
        ) : (
            <TestCaseList {...commonProps} />
        );
    }, [
        viewMode,
        testCasesHook.selectedTestCases,
        testCasesHook.selectTestCases,
        handleEditTestCase,
        handleDeleteTestCase,
        handleBulkAction,
        handleRunNotification,
        handleLinkBug,
        handleUpdateExecutionStatus
    ]);

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

    if (testCasesHook.testCasesLocked) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-foreground">Test Cases</h1>
                    </div>
                    <div className="bg-card shadow-md rounded-lg p-6">
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
                            onClick={() => router.push('/testruns')}
                            className="btn-secondary text-sm whitespace-nowrap inline-flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            View Test Runs
                        </button>
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
                    groupBy={groupBy}
                    onGroupByChange={setGroupBy}
                />

                <div className="transition-opacity duration-300">
                    {groupBy && groupedTestCases ? (
                        <div className="space-y-6">
                            {Object.entries(groupedTestCases).map(([groupKey, testCases]) => (
                                <div key={groupKey} className="bg-card rounded-lg border border-border overflow-hidden">
                                    <div
                                        className="flex items-center justify-between bg-muted/50 px-4 py-3 cursor-pointer hover:bg-muted transition-colors"
                                        onClick={() => toggleGroup(groupKey)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedGroups[groupKey] ? (
                                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                            )}
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {getGroupDisplayName(groupKey)}
                                            </h3>
                                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                {testCases.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleGroup(groupKey);
                                            }}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {expandedGroups[groupKey] ? 'Collapse' : 'Expand'}
                                        </button>
                                    </div>

                                    {expandedGroups[groupKey] && (
                                        <div className="p-0">
                                            {renderTestCasesComponent(testCases)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderTestCasesComponent(filteredTestCases)
                    )}
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

                {isCreateRunModalOpen && (
                    <CreateTestRunModal
                        onClose={() => setIsCreateRunModalOpen(false)}
                        onSave={handleCreateTestRun}
                        sprints={sprints}
                        testCases={testCasesRef.current}
                        preSelectedTestCases={testCasesHook.selectedTestCases}
                    />
                )}
            </div>
        </div>
    );
};

export default TestCases;