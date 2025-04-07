/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect } from 'react';
import { Plus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRIORITY_LEVELS, INITIAL_TEST_CASE } from '../constants';

const TestCaseForm = ({
    initialTestCase = INITIAL_TEST_CASE,
    requirements = [],
    loading = false,
    currentUser = {},
    onSubmit,
}) => {
    const [testCase, setTestCase] = useState({ 
        ...initialTestCase,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || '',
        updatedAt: new Date().toISOString(),
        organizationId: currentUser?.organizationId || '',
        status: 'draft',
        isAutomated: false,
    });

    // This effect will be triggered when initialTestCase changes
    useEffect(() => {
        if (initialTestCase) {
            setTestCase(_prev => ({ 
                ...initialTestCase,
                createdAt: initialTestCase.createdAt || new Date().toISOString(),
                createdBy: initialTestCase.createdBy || currentUser?.id || '',
                updatedAt: new Date().toISOString(),
                organizationId: initialTestCase.organizationId || currentUser?.organizationId || '',
                status: initialTestCase.status || 'draft',
                isAutomated: analyzeAutomationPotential(initialTestCase)
            }));
        }
    }, [initialTestCase, currentUser]);

    // Function to analyze if a test case can be automated
    const analyzeAutomationPotential = (tc) => {
        if (!tc) return false;
        
        // Keywords that suggest automation potential
        const automationKeywords = [
            'api', 'endpoint', 'request', 'response', 'json', 'data validation',
            'database', 'form validation', 'ui element', 'click', 'input',
            'select', 'dropdown', 'checkbox', 'radio', 'button', 'submit'
        ];
        
        // Check various fields for automation keywords
        const textToAnalyze = [
            tc.title,
            tc.description,
            tc.steps,
            tc.executionSteps,
            tc.expectedResult,
            tc.testType
        ].filter(Boolean).join(' ').toLowerCase();
        
        // If test type is explicitly set to automated
        if (tc.execution === 'automated' || tc.automationStatus === 'Automated') {
            return true;
        }
        
        // Check for automation keywords
        return automationKeywords.some(keyword => textToAnalyze.includes(keyword.toLowerCase()));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name) {
            setTestCase((prev) => ({ 
                ...prev, 
                [name]: value,
                updatedAt: new Date().toISOString()
            }));
        }
    };

    const handleSelectChange = (name, value) => {
        setTestCase((prev) => ({ 
            ...prev, 
            [name]: value,
            updatedAt: new Date().toISOString()
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Process test steps - convert from text to array if needed
        const processedTestCase = {
            ...testCase,
            testSteps: testCase.steps ? testCase.steps.split('\n').filter(step => step.trim()) : [],
            isAutomated: analyzeAutomationPotential(testCase)
        };
        
        console.log('Submitting test case:', processedTestCase);
        onSubmit(processedTestCase);
    };

    return (
        <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="text-xl text-blue-800">Create New Test Case</CardTitle>
                <CardDescription className="text-blue-600">
                    Fill in the details to create a new test case
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            value={testCase.title ?? ''}
                            onChange={handleChange}
                            placeholder="Enter test case title"
                            required
                            className="focus:ring-1 focus:ring-[#00695C] transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={testCase.description || ''}
                            onChange={handleChange}
                            placeholder="Enter test case description"
                            rows={3}
                            className="focus:ring-2 focus:ring-[#00695C] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                Priority
                            </Label>
                            <Select 
                                value={testCase.priority || ''} 
                                onValueChange={(value) => handleSelectChange('priority', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                                        <SelectItem key={key} value={value}>
                                            {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirementId" className="block text-sm font-medium text-gray-700">
                                Requirement ID
                            </Label>
                            <Select 
                                value={testCase.requirementId || ''} 
                                onValueChange={(value) => handleSelectChange('requirementId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select requirement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {requirements.map((req) => (
                                        <SelectItem key={req.id} value={req.id}>
                                            {req.id} - {req.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="testType" className="block text-sm font-medium text-gray-700">
                                Test Type
                            </Label>
                            <Input
                                id="testType"
                                name="testType"
                                value={testCase.testType || ''}
                                onChange={handleChange}
                                placeholder="Functional / Regression / Smoke etc."
                                className="focus:ring-2 focus:ring-[#00695C] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="testEnvironment" className="block text-sm font-medium text-gray-700">
                                Test Environment
                            </Label>
                            <Input
                                id="testEnvironment"
                                name="testEnvironment"
                                value={testCase.testEnvironment || ''}
                                onChange={handleChange}
                                placeholder="e.g., Staging / QA / Production"
                                className="focus:ring-2 focus:ring-[#00695C] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                                Assigned To
                            </Label>
                            <Input
                                id="assignedTo"
                                name="assignedTo"
                                value={testCase.assignedTo || currentUser?.id || ''}
                                onChange={handleChange}
                                placeholder="Enter name or email"
                                className="focus:ring-2 focus:ring-[#00695C] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="execution" className="block text-sm font-medium text-gray-700">
                                Execution Type
                            </Label>
                            <Select 
                                value={testCase.execution || 'manual'} 
                                onValueChange={(value) => handleSelectChange('execution', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select execution type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="automated">Automated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="module" className="block text-sm font-medium text-gray-700">
                                Module
                            </Label>
                            <Input
                                id="module"
                                name="module"
                                value={testCase.module || ''}
                                onChange={handleChange}
                                placeholder="Optional module name"
                                className="focus:ring-2 focus:ring-[#00695C] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Status
                            </Label>
                            <Select 
                                value={testCase.status || 'draft'} 
                                onValueChange={(value) => handleSelectChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="review">Under Review</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="steps" className="block text-sm font-medium text-gray-700">
                            Steps to Reproduce
                        </Label>
                        <Textarea
                            id="steps"
                            name="steps"
                            value={testCase.steps || ''}
                            onChange={handleChange}
                            placeholder="Enter steps to reproduce (one step per line)"
                            rows={4}
                            className="focus:ring-2 focus:ring-[#00695C] transition-all"
                        />
                        <p className="text-xs text-gray-500">Each line will be treated as a separate step</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expectedResult" className="block text-sm font-medium text-gray-700">
                            Expected Result
                        </Label>
                        <Textarea
                            id="expectedResult"
                            name="expectedResult"
                            value={testCase.expectedResult || ''}
                            onChange={handleChange}
                            placeholder="Enter expected result"
                            rows={2}
                            className="focus:ring-2 focus:ring-[#00695C] transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="executionSteps" className="block text-sm font-medium text-gray-700">
                            Execution Steps
                        </Label>
                        <Textarea
                            id="executionSteps"
                            name="executionSteps"
                            value={testCase.executionSteps || ''}
                            onChange={handleChange}
                            placeholder="Enter detailed execution steps"
                            rows={3}
                            className="focus:ring-2 focus:ring-[#00695C] transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                            Tags (comma separated)
                        </Label>
                        <Input
                            id="tags"
                            name="tags"
                            value={testCase.tags || ''}
                            onChange={handleChange}
                            placeholder="e.g., regression, login, critical"
                            className="focus:ring-2 focus:ring-[#00965C] transition-all"
                        />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-sm">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#00897B] hover:bg-[#00965C] transition-colors rounded"
                >
                    {loading ? (
                        <>
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Test Case
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default TestCaseForm;