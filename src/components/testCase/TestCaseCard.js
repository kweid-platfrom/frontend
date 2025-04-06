// components/TestCaseCard.js
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TEST_CASE_STATUSES } from '../constants';

const TestCaseCard = ({ testCase, onDelete, onStatusChange }) => {
    const statusStyles = {
        [TEST_CASE_STATUSES.PASSED]: 'bg-green-100 text-green-800',
        [TEST_CASE_STATUSES.FAILED]: 'bg-red-100 text-red-800',
        [TEST_CASE_STATUSES.BLOCKED]: 'bg-orange-100 text-orange-800',
        [TEST_CASE_STATUSES.ACTIVE]: 'bg-blue-100 text-blue-800',
        [TEST_CASE_STATUSES.DRAFT]: 'bg-gray-100 text-gray-800'
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <CardTitle>{testCase.title}</CardTitle>
                        <CardDescription>
                            Priority: {testCase.priority} | Requirement ID: {testCase.requirementId || 'N/A'}
                        </CardDescription>
                    </div>
                    <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[testCase.status]}`}>
                            {testCase.status.charAt(0).toUpperCase() + testCase.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {testCase.tags && (Array.isArray(testCase.tags) ? testCase.tags : testCase.tags.split(','))
                        .map((tag, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                                {typeof tag === 'string' ? tag.trim() : tag}
                            </span>
                        ))}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{testCase.description}</p>
                {testCase.steps && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-sm">Steps:</h4>
                        <p className="text-sm whitespace-pre-line">{testCase.steps}</p>
                    </div>
                )}
                {testCase.expectedResult && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-sm">Expected Results:</h4>
                        <p className="text-sm">{testCase.expectedResult}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                    <select
                        value={testCase.status}
                        onChange={(e) => onStatusChange(testCase.id, e.target.value)}
                        className="text-sm p-1 border rounded"
                    >
                        {Object.values(TEST_CASE_STATUSES).map(status => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(testCase.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default TestCaseCard;