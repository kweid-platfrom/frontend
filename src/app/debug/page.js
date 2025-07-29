'use client'

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Bug, Users, Database, Lock } from 'lucide-react';

const TestCaseDebugTool = () => {
    const [debugInfo] = useState({
        // Simulate your app state for debugging
        auth: {
            isAuthenticated: true,
            currentUser: { uid: 'user123', email: 'test@example.com' },
            isInitialized: true,
            loading: false
        },
        suites: {
            testSuites: [{ id: 'suite1', name: 'Test Suite 1' }],
            activeSuite: { id: 'suite1', name: 'Test Suite 1' },
            hasCreatedSuite: true,
            loading: false
        },
        subscription: {
            isTrialActive: true,
            isSubscriptionActive: false,
            planLimits: {
                maxTestCasesPerSuite: 50,
                canCreateTestCases: true
            },
            loading: false
        },
        testCases: {
            testCases: [],
            loading: false
        }
    });

    const [testFormData, setTestFormData] = useState({
        title: 'Sample Test Case',
        description: 'This is a test description',
        testSteps: [{ action: 'Click login button', expectedResult: 'Login form appears' }],
        priority: 'medium',
        status: 'draft'
    });

    const [] = useState({});

    // Simulate the validation logic from your TestCaseModal
    const validateForm = () => {
        const newErrors = {};

        if (!testFormData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        const validTestSteps = testFormData.testSteps.filter(
            (step) => step.action.trim() || step.expectedResult.trim()
        );

        if (validTestSteps.length === 0) {
            newErrors.testSteps = 'At least one test step with action or expected result is required';
        }

        return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
    };

    const checkConditions = () => {
        const conditions = [
            {
                name: 'Authentication',
                status: debugInfo.auth.isAuthenticated && debugInfo.auth.currentUser?.uid,
                message: debugInfo.auth.isAuthenticated
                    ? '✅ User is authenticated'
                    : '❌ User not authenticated',
                severity: debugInfo.auth.isAuthenticated ? 'success' : 'error',
                icon: debugInfo.auth.isAuthenticated ? CheckCircle : XCircle
            },
            {
                name: 'Active Suite',
                status: debugInfo.suites.activeSuite?.id,
                message: debugInfo.suites.activeSuite?.id
                    ? `✅ Active suite: ${debugInfo.suites.activeSuite.name}`
                    : '❌ No active suite selected',
                severity: debugInfo.suites.activeSuite?.id ? 'success' : 'error',
                icon: debugInfo.suites.activeSuite?.id ? CheckCircle : XCircle
            },
            {
                name: 'Subscription Access',
                status: debugInfo.subscription.planLimits?.canCreateTestCases,
                message: debugInfo.subscription.planLimits?.canCreateTestCases
                    ? '✅ Can create test cases per plan'
                    : '❌ Plan does not allow test case creation',
                severity: debugInfo.subscription.planLimits?.canCreateTestCases ? 'success' : 'error',
                icon: debugInfo.subscription.planLimits?.canCreateTestCases ? CheckCircle : Lock
            },
            {
                name: 'Test Case Limit',
                status: debugInfo.testCases.testCases.length < (debugInfo.subscription.planLimits?.maxTestCasesPerSuite || 999),
                message: `${debugInfo.testCases.testCases.length}/${debugInfo.subscription.planLimits?.maxTestCasesPerSuite || '∞'} test cases used`,
                severity: debugInfo.testCases.testCases.length < (debugInfo.subscription.planLimits?.maxTestCasesPerSuite || 999) ? 'success' : 'warning',
                icon: debugInfo.testCases.testCases.length < (debugInfo.subscription.planLimits?.maxTestCasesPerSuite || 999) ? CheckCircle : AlertTriangle
            },
            {
                name: 'Loading States',
                status: !debugInfo.auth.loading && !debugInfo.suites.loading && !debugInfo.subscription.loading,
                message: debugInfo.auth.loading || debugInfo.suites.loading || debugInfo.subscription.loading
                    ? '⏳ Still loading...'
                    : '✅ All data loaded',
                severity: debugInfo.auth.loading || debugInfo.suites.loading || debugInfo.subscription.loading ? 'warning' : 'success',
                icon: debugInfo.auth.loading || debugInfo.suites.loading || debugInfo.subscription.loading ? AlertTriangle : CheckCircle
            }
        ];

        return conditions;
    };

    const { isValid, errors: validationErrors } = validateForm();

    const conditions = checkConditions();
    const allConditionsMet = conditions.every(c => c.status);

    const getIconColor = (severity) => {
        switch (severity) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            case 'warning': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const getBgColor = (severity) => {
        switch (severity) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'error': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bug className="w-6 h-6 text-blue-500" />
                        Test Case Creation Debug Tool
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Diagnose issues preventing test case creation
                    </p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Status */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                System Status
                            </h2>

                            <div className="space-y-3">
                                {conditions.map((condition, index) => {
                                    const Icon = condition.icon;
                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border ${getBgColor(condition.severity)}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-5 h-5 ${getIconColor(condition.severity)}`} />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{condition.name}</div>
                                                    <div className="text-sm text-gray-600">{condition.message}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`p-4 rounded-lg border-2 ${allConditionsMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                <div className="flex items-center gap-2">
                                    {allConditionsMet ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <span className="font-semibold">
                                        {allConditionsMet ? 'All conditions met!' : 'Issues detected'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form Validation */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Form Validation Test
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={testFormData.title}
                                        onChange={(e) => setTestFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {validationErrors.title && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Test Steps
                                    </label>
                                    <div className="space-y-2">
                                        {testFormData.testSteps.map((step, index) => (
                                            <div key={index} className="border border-gray-200 rounded p-3">
                                                <input
                                                    type="text"
                                                    placeholder="Action"
                                                    value={step.action}
                                                    onChange={(e) => {
                                                        const newSteps = [...testFormData.testSteps];
                                                        newSteps[index].action = e.target.value;
                                                        setTestFormData(prev => ({ ...prev, testSteps: newSteps }));
                                                    }}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Expected Result"
                                                    value={step.expectedResult}
                                                    onChange={(e) => {
                                                        const newSteps = [...testFormData.testSteps];
                                                        newSteps[index].expectedResult = e.target.value;
                                                        setTestFormData(prev => ({ ...prev, testSteps: newSteps }));
                                                    }}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {validationErrors.testSteps && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.testSteps}</p>
                                    )}
                                </div>

                                <div className={`p-3 rounded-lg border ${isValid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                    <div className="flex items-center gap-2">
                                        {isValid ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium">
                                            {isValid ? 'Form is valid' : 'Form has validation errors'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Troubleshooting Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Common Issues & Solutions
                </h2>

                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <span className="font-medium text-blue-900 min-w-[120px]">No Active Suite:</span>
                        <span className="text-blue-800">Ensure a test suite is selected before creating test cases</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-medium text-blue-900 min-w-[120px]">Authentication:</span>
                        <span className="text-blue-800">User must be logged in and profile loaded</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-medium text-blue-900 min-w-[120px]">Plan Limits:</span>
                        <span className="text-blue-800">Check if subscription allows test case creation</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-medium text-blue-900 min-w-[120px]">Form Validation:</span>
                        <span className="text-blue-800">Title and at least one test step are required</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="font-medium text-blue-900 min-w-[120px]">Loading States:</span>
                        <span className="text-blue-800">Wait for all data to finish loading before creating test cases</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCaseDebugTool;