"use client"
import React, { useState, useEffect, useMemo } from 'react';
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
    // Normalize initialTestCase to avoid undefined values
    const normalizedInitialTestCase = useMemo(() => {
        return { ...INITIAL_TEST_CASE, ...initialTestCase };
    }, [initialTestCase]);

    const [testCase, setTestCase] = useState({ 
        ...normalizedInitialTestCase,
        createdAt: normalizedInitialTestCase.createdAt || new Date().toISOString(),
        createdBy: normalizedInitialTestCase.createdBy || currentUser?.id || '',
        updatedAt: new Date().toISOString(),
        organizationId: normalizedInitialTestCase.organizationId || currentUser?.organizationId || '',
        status: normalizedInitialTestCase.status || 'draft',
        isAutomated: false,
        // Keep assignedTo as is since rules now expect this field
        assignedTo: normalizedInitialTestCase.assignedTo || currentUser?.id || '',
    });

    // This effect now has proper dependencies
    useEffect(() => {
        // Skip the effect if initialTestCase is empty or undefined
        if (!initialTestCase || Object.keys(initialTestCase).length === 0) return;
        
        // Create a stable reference to prevent continuous updates
        const updatedTestCase = { 
            ...normalizedInitialTestCase,
            createdAt: normalizedInitialTestCase.createdAt || new Date().toISOString(),
            createdBy: normalizedInitialTestCase.createdBy || currentUser?.id || '',
            updatedAt: new Date().toISOString(),
            organizationId: normalizedInitialTestCase.organizationId || currentUser?.organizationId || '',
            status: normalizedInitialTestCase.status || 'draft',
            assignedTo: normalizedInitialTestCase.assignedTo || currentUser?.id || '',
            isAutomated: analyzeAutomationPotential(normalizedInitialTestCase)
        };
        
        setTestCase(updatedTestCase);
    }, [initialTestCase.id, normalizedInitialTestCase, currentUser?.id, currentUser?.organizationId, initialTestCase]); 


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
        // Handle special case for "null" value
        const finalValue = value === "null" ? "" : value;
        
        setTestCase((prev) => ({ 
            ...prev, 
            [name]: finalValue,
            updatedAt: new Date().toISOString()
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Ensure tags is always an array before submitting
        let formattedTags = [];
        if (typeof testCase.tags === 'string') {
            formattedTags = testCase.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (Array.isArray(testCase.tags)) {
            formattedTags = testCase.tags;
        }
        
        // Process test steps - convert from text to array if needed
        const processedTestCase = {
            ...testCase,
            // Ensure we have valid values for key fields
            title: testCase.title || '',
            description: testCase.description || '',
            steps: testCase.steps || '',
            expectedResult: testCase.expectedResult || '',
            testSteps: testCase.steps ? testCase.steps.split('\n').filter(step => step.trim()) : [],
            isAutomated: analyzeAutomationPotential(testCase),
            tags: formattedTags,
            
            // Ensure all required fields are present according to Firestore rules
            assignedTo: testCase.assignedTo || currentUser?.id || '',
            createdAt: testCase.createdAt || new Date().toISOString(),
            createdBy: testCase.createdBy || currentUser?.id || '',
            updatedAt: new Date().toISOString(),
            organizationId: testCase.organizationId || currentUser?.organizationId || '',
            
            // Ensure priority is valid according to rules
            priority: ['P0', 'P1', 'P2', 'P3'].includes(testCase.priority) ? testCase.priority : 'P2',
            
            // Ensure status is valid according to rules
            status: ['draft', 'active', 'passed', 'failed', 'blocked'].includes(testCase.status) ? 
                    testCase.status : 'draft',
                    
            // Ensure module is present even if empty
            module: testCase.module || '',
            
            // Ensure execution is present
            execution: testCase.execution || 'manual'
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
                            value={testCase.title || ''}
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
                                defaultValue={testCase.priority || 'P2'}
                                onValueChange={(value) => handleSelectChange('priority', value)}
                            >
                                <SelectTrigger id="priority">
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
                                defaultValue={testCase.requirementId || ''}
                                onValueChange={(value) => handleSelectChange('requirementId', value)}
                            >
                                <SelectTrigger id="requirementId">
                                    <SelectValue placeholder="Select requirement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">None</SelectItem>
                                    {requirements.map((req) => (
                                        <SelectItem key={req.id} value={req.id}>
                                            {req.id.substring(0, 6)}... - {req.title.substring(0, 20)}{req.title.length > 20 ? '...' : ''}
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
                                defaultValue={testCase.execution || 'manual'}
                                onValueChange={(value) => handleSelectChange('execution', value)}
                            >
                                <SelectTrigger id="execution">
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
                                defaultValue={testCase.status || 'draft'}
                                onValueChange={(value) => handleSelectChange('status', value)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
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
                            value={typeof testCase.tags === 'string' ? testCase.tags : (Array.isArray(testCase.tags) ? testCase.tags.join(', ') : '')}
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