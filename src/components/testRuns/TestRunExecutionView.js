// components/testRuns/TestRunExecutionView.js
'use client';

import React, { useState, useMemo } from 'react';
import {
    CheckCircle, XCircle, Shield, Clock, Bug,
    ChevronRight, ChevronDown, Play, Pause, Save,
    FileText, AlertCircle, Timer, User, ArrowLeft
} from 'lucide-react';
import BugReportButton from '../modals/BugReportButton';
import { useApp } from '../../context/AppProvider';

const TestRunExecutionView = ({ run, onBack, onUpdateResult, onCompleteRun, testCases }) => {
    const { actions } = useApp();
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [expandedSteps, setExpandedSteps] = useState({});
    const [executionData, setExecutionData] = useState({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStartTime, setExecutionStartTime] = useState(null);

    // Get test cases for this run
    const runTestCases = useMemo(() => {
        return run.test_cases
            .map(tcId => testCases.find(tc => tc.id === tcId))
            .filter(Boolean);
    }, [run.test_cases, testCases]);

    const currentTestCase = runTestCases[currentTestIndex];
    const currentResult = run.results?.[currentTestCase?.id] || {};
    const currentExecution = executionData[currentTestCase?.id] || {
        status: currentResult.status || 'not_executed',
        notes: currentResult.notes || '',
        duration: currentResult.duration || null,
        bugs_to_create: []
    };

    // Calculate progress
    const progress = useMemo(() => {
        const total = run.summary.total;
        const executed = total - run.summary.not_executed;
        const percentage = total > 0 ? Math.round((executed / total) * 100) : 0;
        return { executed, total, percentage };
    }, [run.summary]);

    // Calculate completion status
    const completionStatus = useMemo(() => {
        const allExecuted = runTestCases.every(tc => {
            const result = run.results?.[tc.id];
            const execution = executionData[tc.id];
            const status = execution?.status || result?.status || 'not_executed';
            return status !== 'not_executed';
        });
        
        const hasAnyExecution = runTestCases.some(tc => {
            const result = run.results?.[tc.id];
            const execution = executionData[tc.id];
            const status = execution?.status || result?.status || 'not_executed';
            return status !== 'not_executed';
        });
        
        const currentStatus = executionData[currentTestCase?.id]?.status || 
                            run.results?.[currentTestCase?.id]?.status || 
                            'not_executed';
        const hasCurrentExecution = currentStatus !== 'not_executed';
        
        return {
            allExecuted,
            hasAnyExecution,
            hasCurrentExecution,
            buttonLabel: allExecuted ? 'Complete Run' : 
                        hasCurrentExecution ? 'Save & Continue' : 
                        'Save Draft'
        };
    }, [runTestCases, run.results, executionData, currentTestCase]);

    const handleStartExecution = () => {
        setIsExecuting(true);
        setExecutionStartTime(Date.now());
    };

    const handlePauseExecution = () => {
        setIsExecuting(false);
        if (executionStartTime && currentTestCase) {
            const duration = Math.round((Date.now() - executionStartTime) / 1000 / 60);
            setExecutionData({
                ...executionData,
                [currentTestCase.id]: {
                    ...currentExecution,
                    duration
                }
            });
        }
        setExecutionStartTime(null);
    };

    const handleUpdateStatus = (status) => {
        if (!currentTestCase) return;

        const duration = executionStartTime
            ? Math.round((Date.now() - executionStartTime) / 1000 / 60)
            : currentExecution.duration;

        const updated = {
            ...currentExecution,
            status,
            duration: duration || null
        };

        setExecutionData({
            ...executionData,
            [currentTestCase.id]: updated
        });
    };

    // Handler for when a bug is created from the failed test
    const handleBugCreated = async (bugResult) => {
        console.log('handleBugCreated called with:', bugResult);
        
        if (!bugResult?.success || !bugResult?.data?.id) {
            console.error('Bug creation failed or missing bug ID:', bugResult);
            return;
        }

        const bugId = bugResult.data.id;
        const suiteId = actions.state?.suites?.activeSuite?.id || run.suite_id;
        
        console.log('Bug created successfully, preparing to link:', {
            bugId,
            testCaseId: currentTestCase.id,
            testCaseTitle: currentTestCase.title,
            suiteId,
            availableLinkingMethods: Object.keys(actions.linking || {})
        });

        try {
            // Update execution data to track the bug immediately
            setExecutionData({
                ...executionData,
                [currentTestCase.id]: {
                    ...currentExecution,
                    bugs_created: [...(currentExecution.bugs_created || []), bugId]
                }
            });

            // Try multiple linking approaches
            let linkResult = null;
            
            // Approach 1: Use linkBugsToTestCase if available
            if (actions.linking?.linkBugsToTestCase) {
                console.log('Attempting linkBugsToTestCase...');
                linkResult = await actions.linking.linkBugsToTestCase(
                    currentTestCase.id,
                    [bugId],
                    suiteId
                );
            }
            // Approach 2: Use linkTestCasesToBug (reverse operation) if available
            else if (actions.linking?.linkTestCasesToBug) {
                console.log('Attempting linkTestCasesToBug...');
                linkResult = await actions.linking.linkTestCasesToBug(
                    bugId,
                    [currentTestCase.id],
                    suiteId
                );
            }
            // Approach 3: Use advanced linking method if available
            else if (actions.linking?.linkBugsToTestCaseAdvanced) {
                console.log('Attempting linkBugsToTestCaseAdvanced...');
                linkResult = await actions.linking.linkBugsToTestCaseAdvanced(
                    currentTestCase.id,
                    [bugId],
                    suiteId
                );
            }
            // Approach 4: Direct FirestoreService call as fallback
            else {
                console.log('No linking method available in actions, showing manual instruction');
                actions.ui?.showNotification({
                    type: 'info',
                    title: 'Bug Created Successfully',
                    message: `Bug has been created. Please link it to test case "${currentTestCase.title}" manually from the test case details.`
                });
                return;
            }

            console.log('Link result:', linkResult);

            if (linkResult?.success) {
                actions.ui?.showNotification({
                    type: 'success',
                    title: 'Bug Linked Successfully',
                    message: `Bug has been created and linked to test case "${currentTestCase.title}"`
                });
            } else {
                throw new Error(linkResult?.error?.message || 'Failed to link bug to test case');
            }
        } catch (error) {
            console.error('Error linking bug to test case:', error);
            actions.ui?.showNotification({
                type: 'warning',
                title: 'Bug Created',
                message: `Bug was created successfully but could not be automatically linked. You can link it to "${currentTestCase.title}" manually from the bug or test case details.`
            });
        }
    };

    const handleSaveResult = async () => {
        if (!currentTestCase) return;

        const duration = executionStartTime
            ? Math.round((Date.now() - executionStartTime) / 1000 / 60)
            : currentExecution.duration;

        const result = {
            status: currentExecution.status,
            executed_at: new Date(),
            executed_by: run.created_by,
            duration: duration || null,
            notes: currentExecution.notes || '',
            bugs_created: currentExecution.bugs_created || [],
            create_bug: currentExecution.create_bug || false
        };

        await onUpdateResult(currentTestCase.id, result);

        // Recheck completion status after save
        const allNowExecuted = runTestCases.every(tc => {
            if (tc.id === currentTestCase.id) {
                return currentExecution.status !== 'not_executed';
            }
            const result = run.results?.[tc.id];
            const execution = executionData[tc.id];
            const status = execution?.status || result?.status || 'not_executed';
            return status !== 'not_executed';
        });

        if (allNowExecuted) {
            if (onCompleteRun) {
                await onCompleteRun(run.id);
            }
            onBack();
        } else {
            // Navigate to next not-executed test or next test
            const nextUnexecutedIndex = runTestCases.findIndex((tc, idx) => {
                if (idx <= currentTestIndex) return false;
                const result = run.results?.[tc.id];
                const execution = executionData[tc.id];
                const status = execution?.status || result?.status || 'not_executed';
                return status === 'not_executed';
            });

            if (nextUnexecutedIndex !== -1) {
                setCurrentTestIndex(nextUnexecutedIndex);
            } else if (currentTestIndex < runTestCases.length - 1) {
                setCurrentTestIndex(currentTestIndex + 1);
            }
            
            setIsExecuting(false);
            setExecutionStartTime(null);
        }
    };

    const handleNavigate = (index) => {
        if (currentTestCase && executionData[currentTestCase.id]?.status !== 'not_executed') {
            const duration = executionStartTime
                ? Math.round((Date.now() - executionStartTime) / 1000 / 60)
                : currentExecution.duration;

            const result = {
                status: currentExecution.status,
                executed_at: new Date(),
                executed_by: run.created_by,
                duration: duration || null,
                notes: currentExecution.notes || '',
                bugs_created: currentExecution.bugs_created || [],
                create_bug: currentExecution.create_bug || false
            };

            onUpdateResult(currentTestCase.id, result);
        }
        
        setCurrentTestIndex(index);
        setIsExecuting(false);
        setExecutionStartTime(null);
    };

    const toggleStep = (index) => {
        setExpandedSteps({
            ...expandedSteps,
            [index]: !expandedSteps[index]
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            passed: 'bg-teal-50 text-teal-800 border-teal-300',
            failed: 'bg-destructive/20 text-destructive border-destructive',
            blocked: 'bg-warning/20 text-warning border-warning',
            skipped: 'bg-muted text-muted-foreground border-border',
            not_executed: 'bg-muted text-muted-foreground border-border',
            in_progress: 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return colors[status] || colors.not_executed;
    };

    const getStatusIcon = (status) => {
        const icons = {
            passed: CheckCircle,
            failed: XCircle,
            blocked: Shield,
            skipped: Clock,
            not_executed: Clock,
            in_progress: Play
        };
        return icons[status] || Clock;
    };

    const formatExecutionDate = (dateValue) => {
        if (!dateValue) return null;
        
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return null;
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return null;
        }
    };

    if (!currentTestCase) {
        return (
            <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                </div>
                <div className="bg-card rounded-lg shadow-xl max-w-md mx-auto p-6 border border-border">
                    <p className="text-foreground text-center">No test cases to execute</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-full mx-auto">
                <div className="flex h-screen">
                    {/* Left Sidebar - Test Cases List */}
                    <div className="w-80 border-r border-border flex flex-col bg-card">
                        <div className="p-4 border-b border-border">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                            <h3 className="font-semibold text-foreground mb-2">Test Cases</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Progress</span>
                                    <span className="font-medium text-foreground">
                                        {progress.executed}/{progress.total}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {runTestCases.map((tc, index) => {
                                const result = run.results?.[tc.id] || {};
                                const execution = executionData[tc.id];
                                const displayStatus = execution?.status || result.status || 'not_executed';
                                const StatusIcon = getStatusIcon(displayStatus);
                                const isActive = index === currentTestIndex;

                                return (
                                    <button
                                        key={tc.id}
                                        onClick={() => handleNavigate(index)}
                                        className={`w-full p-3 text-left border-b border-border hover:bg-accent transition-colors ${isActive ? 'bg-accent' : ''}`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                                displayStatus === 'passed' ? 'text-teal-600' :
                                                displayStatus === 'failed' ? 'text-destructive' :
                                                displayStatus === 'blocked' ? 'text-warning' :
                                                'text-muted-foreground'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {tc.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {tc.component || 'No component'}
                                                </p>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content - Test Execution */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-border bg-card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        {currentTestCase.title}
                                    </h2>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {currentTestIndex + 1} of {runTestCases.length}
                                        </span>
                                        {currentTestCase.component && (
                                            <span>Component: {currentTestCase.component}</span>
                                        )}
                                        {currentTestCase.estimatedTime && (
                                            <span className="flex items-center gap-1">
                                                <Timer className="w-4 h-4" />
                                                Est: {currentTestCase.estimatedTime}min
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Completion Status Banner */}
                            {completionStatus.allExecuted && (
                                <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium">All tests executed!</p>
                                        <p className="text-xs text-teal-700 mt-0.5">
                                            Click &quot;Complete Run&quot; to finish and return to test run details.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Execution Controls */}
                            <div className="flex items-center gap-3">
                                {!isExecuting ? (
                                    <button
                                        onClick={handleStartExecution}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start Execution
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePauseExecution}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors"
                                    >
                                        <Pause className="w-4 h-4" />
                                        Pause
                                    </button>
                                )}

                                {isExecuting && executionStartTime && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {Math.round((Date.now() - executionStartTime) / 1000 / 60)}min elapsed
                                        </span>
                                    </div>
                                )}

                                <div className="flex-1" />

                                {/* Status Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus('passed')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            currentExecution.status === 'passed'
                                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                                : 'border-border hover:bg-accent'
                                        }`}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Pass
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('failed')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            currentExecution.status === 'failed'
                                                ? 'bg-destructive/20 text-destructive border-destructive'
                                                : 'border-border hover:bg-accent'
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Fail
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('blocked')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            currentExecution.status === 'blocked'
                                                ? 'bg-warning/20 text-warning border-warning'
                                                : 'border-border hover:bg-accent'
                                        }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        Block
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('skipped')}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                            currentExecution.status === 'skipped'
                                                ? 'bg-muted text-muted-foreground border-border'
                                                : 'border-border hover:bg-accent'
                                        }`}
                                    >
                                        <Clock className="w-4 h-4" />
                                        Skip
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
                            {/* Description */}
                            {currentTestCase.description && (
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h3 className="font-semibold text-foreground mb-2">Description</h3>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                        {currentTestCase.description}
                                    </p>
                                </div>
                            )}

                            {/* Preconditions */}
                            {currentTestCase.preconditions && (
                                <div className="bg-accent border border-border rounded-lg p-4">
                                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                        Preconditions
                                    </h3>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">
                                        {currentTestCase.preconditions}
                                    </p>
                                </div>
                            )}

                            {/* Test Steps */}
                            <div>
                                <h3 className="font-semibold text-foreground mb-3">Test Steps</h3>
                                <div className="space-y-2">
                                    {currentTestCase.steps?.map((step, index) => (
                                        <div key={index} className="border border-border rounded-lg overflow-hidden bg-card">
                                            <button
                                                onClick={() => toggleStep(index)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-foreground text-left">
                                                        {step.action || 'No action specified'}
                                                    </span>
                                                </div>
                                                {expandedSteps[index] ? (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </button>
                                            {expandedSteps[index] && (
                                                <div className="p-4 bg-muted border-t border-border">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                                                Expected Result:
                                                            </p>
                                                            <p className="text-sm text-foreground">
                                                                {step.expectedResult || 'No expected result specified'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Execution Notes */}
                            <div>
                                <label className="block font-semibold text-foreground mb-2">
                                    Execution Notes
                                </label>
                                <textarea
                                    value={currentExecution.notes}
                                    onChange={(e) => setExecutionData({
                                        ...executionData,
                                        [currentTestCase.id]: {
                                            ...currentExecution,
                                            notes: e.target.value
                                        }
                                    })}
                                    placeholder="Add any observations, issues, or additional notes..."
                                    rows={4}
                                    className="w-full px-3 py-2 bg-card text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                            </div>

                            {/* Bug Creation Banner (if failed) */}
                            {currentExecution.status === 'failed' && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Bug className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-foreground mb-2">
                                                Test Failed - Report Bug
                                            </h4>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                This test case failed. Create a bug report to track the issue. The bug will be automatically linked to this test case.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <BugReportButton
                                                    className="inline-flex"
                                                    onCreateBug={handleBugCreated}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {currentExecution.bugs_created?.length > 0 && (
                                                        <span className="text-foreground font-medium">
                                                            {currentExecution.bugs_created.length} bug{currentExecution.bugs_created.length > 1 ? 's' : ''} created
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Previous Execution History */}
                            {currentResult.executed_at && (
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-semibold text-foreground mb-3">Previous Execution</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentResult.status)}`}>
                                                {currentResult.status?.replace('_', ' ').charAt(0).toUpperCase() + currentResult.status?.replace('_', ' ').slice(1)}
                                            </span>
                                        </div>
                                        {currentResult.executed_by && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Executed by:</span>
                                                <span className="text-foreground flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {currentResult.executed_by}
                                                </span>
                                            </div>
                                        )}
                                        {currentResult.executed_at && (() => {
                                            const formattedDate = formatExecutionDate(currentResult.executed_at);
                                            if (!formattedDate) return null;
                                            return (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Executed:</span>
                                                    <span className="text-foreground">
                                                        {formattedDate}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                        {currentResult.duration && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Duration:</span>
                                                <span className="text-foreground">{currentResult.duration} min</span>
                                            </div>
                                        )}
                                        {currentResult.notes && (
                                            <div>
                                                <p className="text-muted-foreground mb-1">Notes:</p>
                                                <p className="text-foreground bg-background p-2 rounded border border-border">
                                                    {currentResult.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-card">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => handleNavigate(Math.max(0, currentTestIndex - 1))}
                                    disabled={currentTestIndex === 0}
                                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSaveResult}
                                        className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                                            completionStatus.allExecuted
                                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                        }`}
                                    >
                                        <Save className="w-4 h-4" />
                                        {completionStatus.buttonLabel}
                                    </button>
                                    
                                    {!completionStatus.allExecuted && (
                                        <p className="text-xs text-muted-foreground">
                                            {progress.executed} of {progress.total} executed
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleNavigate(Math.min(runTestCases.length - 1, currentTestIndex + 1))}
                                    disabled={currentTestIndex === runTestCases.length - 1}
                                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestRunExecutionView;