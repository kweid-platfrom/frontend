'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CreateTestRunModal = ({
    onClose,
    onSave,
    sprints = [],
    testCases = [],
    preSelectedTestCases = []
}) => {
    const [formData, setFormData] = useState({
        name: '',
        sprint_id: '',
        build_version: '',
        environment: 'testing',
        description: '',
        test_cases: preSelectedTestCases || []
    });

    const [includePassedTests, setIncludePassedTests] = useState(false);
    const [passedTestsAnalysis, setPassedTestsAnalysis] = useState({
        passedTests: [],
        eligibleTests: [],
        analyzed: false
    });

    // Analyze test cases for passed status
    useEffect(() => {
        if (formData.test_cases.length === 0) {
            setPassedTestsAnalysis({ passedTests: [], eligibleTests: [], analyzed: false });
            return;
        }

        const passedTests = [];
        const eligibleTests = [];

        formData.test_cases.forEach(id => {
            const testCase = testCases.find(tc => tc.id === id);
            if (!testCase) return;

            // Find the most recent run
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

            // Check if test was modified since last run
            const wasModifiedSinceLastRun = lastRun?.executed_at && testCase.updated_at
                ? new Date(testCase.updated_at) > new Date(lastRun.executed_at)
                : true;

            // Determine if should retest
            const shouldRetest =
                !wasPassedRecently ||
                wasModifiedSinceLastRun ||
                (daysSinceLastRun && daysSinceLastRun > 30);

            if (wasPassedRecently && !shouldRetest) {
                passedTests.push({
                    id: testCase.id,
                    title: testCase.title,
                    lastRunDate: lastRun.executed_at,
                    daysSinceLastRun,
                    runName: lastRun.runName
                });
            } else {
                eligibleTests.push(id);
            }
        });

        setPassedTestsAnalysis({ passedTests, eligibleTests, analyzed: true });
    }, [formData.test_cases, testCases]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTestCaseSelection = (testCaseIds) => {
        setFormData(prev => ({ ...prev, test_cases: testCaseIds }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare data based on includePassedTests toggle
        const finalTestCases = includePassedTests
            ? formData.test_cases
            : passedTestsAnalysis.eligibleTests;

        if (finalTestCases.length === 0) {
            alert('No test cases selected for the run.');
            return;
        }

        onSave({
            ...formData,
            test_cases: finalTestCases
        });
    };

    const selectedTestCaseObjects = useMemo(() => {
        return formData.test_cases
            .map(id => testCases.find(tc => tc.id === id))
            .filter(Boolean);
    }, [formData.test_cases, testCases]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">Create Test Run</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Run Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Run Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                placeholder="e.g., Sprint 5 Regression"
                            />
                        </div>

                        {/* Sprint Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Sprint
                            </label>
                            <select
                                name="sprint_id"
                                value={formData.sprint_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                            >
                                <option value="">No Sprint</option>
                                {sprints.map(sprint => (
                                    <option key={sprint.id} value={sprint.id}>
                                        {sprint.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Build Version */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Build Version
                                </label>
                                <input
                                    type="text"
                                    name="build_version"
                                    value={formData.build_version}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                    placeholder="e.g., v1.2.3"
                                />
                            </div>

                            {/* Environment */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Environment
                                </label>
                                <select
                                    name="environment"
                                    value={formData.environment}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                >
                                    <option value="testing">Testing</option>
                                    <option value="staging">Staging</option>
                                    <option value="production">Production</option>
                                    <option value="development">Development</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                placeholder="Describe the purpose of this test run..."
                            />
                        </div>

                        {/* Test Cases Selection */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Test Cases <span className="text-destructive">*</span>
                            </label>
                            <div className="text-sm text-muted-foreground mb-2">
                                {formData.test_cases.length} test case(s) selected
                            </div>

                            {/* Selected Test Cases */}
                            {selectedTestCaseObjects.length > 0 && (
                                <div className="border border-border rounded-md p-3 mb-3 max-h-40 overflow-y-auto">
                                    <div className="space-y-2">
                                        {selectedTestCaseObjects.map(tc => (
                                            <div key={tc.id} className="flex items-center justify-between text-sm">
                                                <span className="text-foreground truncate">{tc.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestCaseSelection(
                                                        formData.test_cases.filter(id => id !== tc.id)
                                                    )}
                                                    className="text-destructive hover:text-destructive/80 ml-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Passed Tests Warning */}
                        {passedTestsAnalysis.analyzed && passedTestsAnalysis.passedTests.length > 0 && (
                            <div className="border border-warning/50 bg-warning/10 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-foreground mb-2">
                                            Recently Passed Test Cases Detected
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {passedTestsAnalysis.passedTests.length} test case(s) passed in recent runs and may not need re-testing:
                                        </p>

                                        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                                            {passedTestsAnalysis.passedTests.slice(0, 5).map(test => (
                                                <div key={test.id} className="text-sm bg-card/50 rounded px-3 py-2">
                                                    <div className="font-medium text-foreground">{test.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Passed {test.daysSinceLastRun} days ago in &quot;{test.runName}&quot;
                                                    </div>
                                                </div>
                                            ))}
                                            {passedTestsAnalysis.passedTests.length > 5 && (
                                                <div className="text-xs text-muted-foreground italic">
                                                    ...and {passedTestsAnalysis.passedTests.length - 5} more
                                                </div>
                                            )}
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includePassedTests}
                                                onChange={(e) => setIncludePassedTests(e.target.checked)}
                                                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                                            />
                                            <span className="text-sm font-medium text-foreground">
                                                Include these passed tests anyway
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {passedTestsAnalysis.analyzed && (
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-5 h-5 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">Run Summary</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Total Selected:</div>
                                        <div className="text-lg font-semibold text-foreground">
                                            {formData.test_cases.length}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Will be Executed:</div>
                                        <div className="text-lg font-semibold text-primary">
                                            {includePassedTests
                                                ? formData.test_cases.length
                                                : passedTestsAnalysis.eligibleTests.length}
                                        </div>
                                    </div>
                                    {!includePassedTests && passedTestsAnalysis.passedTests.length > 0 && (
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2 text-success">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>
                                                    {passedTestsAnalysis.passedTests.length} recently passed test(s) will be excluded
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={formData.test_cases.length === 0 || !formData.name}
                        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Run
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTestRunModal;