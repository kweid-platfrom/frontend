import React, { useState } from 'react';
import { Plus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIORITY_LEVELS, INITIAL_TEST_CASE } from '../constants';

const TestCaseForm = ({ initialTestCase = INITIAL_TEST_CASE, requirements = [], loading = false, onSubmit }) => {
    const [testCase, setTestCase] = useState(initialTestCase);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setTestCase(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(testCase);
        setTestCase({ ...INITIAL_TEST_CASE }); // Reset form after submission
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
                        <label htmlFor="title" className="text-sm font-medium text-gray-700">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="title"
                            value={testCase.title}
                            onChange={handleChange}
                            placeholder="Enter test case title"
                            required
                            className="focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={testCase.description}
                            onChange={handleChange}
                            placeholder="Enter test case description"
                            rows={3}
                            className="focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                                Priority
                            </label>
                            <select
                                id="priority"
                                value={testCase.priority}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {key.charAt(0) + key.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="requirementId" className="text-sm font-medium text-gray-700">
                                Requirement ID
                            </label>
                            <select
                                id="requirementId"
                                value={testCase.requirementId}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="">Select Requirement</option>
                                {requirements.map(req => (
                                    <option key={req.id} value={req.id}>{req.id} - {req.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="steps" className="text-sm font-medium text-gray-700">
                            Steps to Reproduce
                        </label>
                        <Textarea
                            id="steps"
                            value={testCase.steps}
                            onChange={handleChange}
                            placeholder="Enter steps to reproduce"
                            rows={4}
                            className="focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="expectedResult" className="text-sm font-medium text-gray-700">
                            Expected Result
                        </label>
                        <Textarea
                            id="expectedResult"
                            value={testCase.expectedResult}
                            onChange={handleChange}
                            placeholder="Enter expected result"
                            rows={2}
                            className="focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium text-gray-700">
                            Tags (comma separated)
                        </label>
                        <Input
                            id="tags"
                            value={testCase.tags}
                            onChange={handleChange}
                            placeholder="e.g. regression, login, critical"
                            className="focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </form>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
                <Button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 transition-colors"
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