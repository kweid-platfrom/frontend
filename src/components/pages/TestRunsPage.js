/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useCallback } from 'react';
import { useTestRuns } from '@/hooks/useTestRuns';
import { useTestCases } from '@/hooks/useTestCases';
import { useUI } from '@/hooks/useUI';
import { useApp } from '@/context/AppProvider';
import CreateTestRunModal from '@/components/testRuns/CreateTestRunModal';
import TestRunExecutionView from '@/components/testRuns/TestRunExecutionView';
import TestRunsListView from '@/components/testRuns/TestRunsListView';
import TestRunDetailsView from '@/components/testRuns/TestRunDetailsView';

const TestRuns = () => {
    const { state } = useApp();
    const testRunsHook = useTestRuns();
    const testCasesHook = useTestCases();
    const uiHook = useUI();

    // View state - now includes 'execution'
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'details' | 'execution'
    const [selectedRun, setSelectedRun] = useState(null);
    const [previousView, setPreviousView] = useState('list'); // Track where execution was triggered from
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Get sprints from global state
    const sprints = state?.sprints?.sprints || [];

    // Handlers
    const handleCreateRun = useCallback(async (runData) => {
        try {
            await testRunsHook.createTestRun(runData);
            setIsCreateModalOpen(false);
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test run created successfully',
            });
        } catch (error) {
            console.error('Error creating test run:', error);
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: `Failed to create test run: ${error.message}`,
            });
        }
    }, [testRunsHook, uiHook]);

    const handleStartRun = useCallback(async (runId) => {
        try {
            await testRunsHook.updateTestRun(runId, {
                status: 'in_progress',
                started_at: new Date(),
            });
            
            // Refresh the selected run if viewing details
            if (selectedRun?.id === runId) {
                const updatedRun = testRunsHook.testRuns?.find(r => r.id === runId);
                if (updatedRun) {
                    setSelectedRun(updatedRun);
                }
            }
            
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test run started',
            });
        } catch (error) {
            console.error('Error starting test run:', error);
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: `Failed to start test run: ${error.message}`,
            });
        }
    }, [testRunsHook, uiHook, selectedRun]);

    const handleCompleteRun = useCallback(async (runId) => {
        try {
            await testRunsHook.updateTestRun(runId, {
                status: 'completed',
                completed_at: new Date(),
            });
            
            // Refresh the selected run
            const updatedRun = testRunsHook.testRuns?.find(r => r.id === runId);
            if (updatedRun) {
                setSelectedRun(updatedRun);
            }
            
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test run completed',
            });
        } catch (error) {
            console.error('Error completing test run:', error);
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: `Failed to complete test run: ${error.message}`,
            });
        }
    }, [testRunsHook, uiHook]);

    const handleDeleteRun = useCallback(async (runId) => {
        if (!window.confirm('Are you sure you want to delete this test run?')) return;

        try {
            await testRunsHook.deleteTestRun(runId);
            // If we're viewing details of the deleted run, go back to list
            if (selectedRun?.id === runId) {
                setViewMode('list');
                setSelectedRun(null);
            }
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Test run deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting test run:', error);
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: `Failed to delete test run: ${error.message}`,
            });
        }
    }, [testRunsHook, uiHook, selectedRun]);

    const handleViewDetails = useCallback((run) => {
        setSelectedRun(run);
        setViewMode('details');
    }, []);

    const handleBackToList = useCallback(() => {
        setViewMode('list');
        setSelectedRun(null);
    }, []);

    const handleExecuteRun = useCallback((run, fromView = 'list') => {
        setSelectedRun(run);
        setPreviousView(fromView); // Remember where execution was triggered from
        setViewMode('execution');
    }, []);

    const handleBackFromExecution = useCallback(() => {
        // Return to the view that triggered execution
        setViewMode(previousView);
        
        // Refresh the selected run to show updated results
        if (selectedRun) {
            const updatedRun = testRunsHook.testRuns?.find(r => r.id === selectedRun.id);
            if (updatedRun) {
                setSelectedRun(updatedRun);
            }
        }
    }, [previousView, selectedRun, testRunsHook.testRuns]);

    const handleUpdateTestResult = useCallback(async (testCaseId, result) => {
        if (!selectedRun) return;
        
        try {
            await testRunsHook.updateTestRunResult(selectedRun.id, testCaseId, result);
            
            // Refresh the selected run
            const updatedRun = testRunsHook.testRuns?.find(r => r.id === selectedRun.id);
            if (updatedRun) {
                setSelectedRun(updatedRun);
            }
        } catch (error) {
            console.error('Error updating test result:', error);
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: `Failed to update test result: ${error.message}`,
            });
        }
    }, [selectedRun, testRunsHook, uiHook]);

    const handleExportReport = useCallback((run) => {
        const runTestCases = run.test_cases
            .map(tcId => {
                const tc = testCasesHook.testCases?.find(t => t.id === tcId);
                if (!tc) return null;
                return {
                    ...tc,
                    result: run.results?.[tcId] || { status: 'not_executed' }
                };
            })
            .filter(Boolean);

        // Create HTML content for PDF
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Test Run Report - ${run.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
                .info { margin: 20px 0; }
                .info-item { margin: 5px 0; }
                .stats { display: flex; gap: 20px; margin: 20px 0; }
                .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .status-passed { color: #059669; font-weight: bold; }
                .status-failed { color: #dc2626; font-weight: bold; }
                .status-blocked { color: #f59e0b; font-weight: bold; }
                .status-skipped { color: #6b7280; }
            </style>
        </head>
        <body>
            <h1>Test Run Report: ${run.name}</h1>
            
            <div class="info">
                <div class="info-item"><strong>Build Version:</strong> ${run.build_version || 'N/A'}</div>
                <div class="info-item"><strong>Environment:</strong> ${run.environment || 'N/A'}</div>
                <div class="info-item"><strong>Created:</strong> ${new Date(run.created_at).toLocaleString()}</div>
                <div class="info-item"><strong>Status:</strong> ${run.status?.replace('_', ' ').toUpperCase()}</div>
            </div>

            <h2>Summary</h2>
            <div class="stats">
                <div class="stat-card">
                    <div style="font-size: 24px; font-weight: bold; color: #059669;">${run.summary.passed}</div>
                    <div>Passed</div>
                </div>
                <div class="stat-card">
                    <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${run.summary.failed}</div>
                    <div>Failed</div>
                </div>
                <div class="stat-card">
                    <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${run.summary.blocked}</div>
                    <div>Blocked</div>
                </div>
                <div class="stat-card">
                    <div style="font-size: 24px; font-weight: bold;">${run.summary.total}</div>
                    <div>Total Tests</div>
                </div>
            </div>

            <h2>Test Cases</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Case</th>
                        <th>Component</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Executed By</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${runTestCases.map(tc => `
                        <tr>
                            <td>${tc.title}</td>
                            <td>${tc.component || 'N/A'}</td>
                            <td class="status-${tc.result.status}">${tc.result.status?.replace('_', ' ').toUpperCase()}</td>
                            <td>${tc.result.duration ? tc.result.duration + ' min' : '-'}</td>
                            <td>${tc.result.executed_by || '-'}</td>
                            <td>${tc.result.notes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

        // Create a new window and print to PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then trigger print dialog
        printWindow.onload = function () {
            printWindow.print();
        };
    }, [testCasesHook.testCases]);

    if (testRunsHook.loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-foreground">Loading test runs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Main Content with Transitions */}
            <div className="relative overflow-hidden">
                {/* List View */}
                <div
                    className={`transition-all duration-300 ${
                        viewMode === 'list'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
                    }`}
                >
                    <TestRunsListView
                        testRuns={testRunsHook.testRuns || []}
                        sprints={sprints}
                        onViewDetails={handleViewDetails}
                        onStartRun={handleStartRun}
                        onCompleteRun={handleCompleteRun}
                        onDeleteRun={handleDeleteRun}
                        onExecuteRun={(run) => handleExecuteRun(run, 'list')}
                        onCreateRun={() => setIsCreateModalOpen(true)}
                        selectedRunId={selectedRun?.id}
                    />
                </div>

                {/* Details View */}
                <div
                    className={`transition-all duration-300 ${
                        viewMode === 'details'
                            ? 'opacity-100 translate-x-0'
                            : viewMode === 'list'
                            ? 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
                            : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
                    }`}
                >
                    {selectedRun && (
                        <TestRunDetailsView
                            run={selectedRun}
                            testCases={testCasesHook.testCases || []}
                            onBack={handleBackToList}
                            onDelete={handleDeleteRun}
                            onExecute={(run) => handleExecuteRun(run, 'details')}
                            onExport={handleExportReport}
                            onStartRun={handleStartRun}
                            onCompleteRun={handleCompleteRun}
                        />
                    )}
                </div>

                {/* Execution View */}
                <div
                    className={`transition-all duration-300 ${
                        viewMode === 'execution'
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
                    }`}
                >
                    {selectedRun && viewMode === 'execution' && (
                        <TestRunExecutionView
                            run={selectedRun}
                            onBack={handleBackFromExecution}
                            onUpdateResult={handleUpdateTestResult}
                            onCompleteRun={handleCompleteRun}
                            testCases={testCasesHook.testCases || []}
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateTestRunModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleCreateRun}
                    sprints={sprints}
                    testCases={testCasesHook.testCases || []}
                />
            )}
        </div>
    );
};

export default TestRuns;