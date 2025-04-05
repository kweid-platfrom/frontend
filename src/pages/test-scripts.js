import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, Plus, Search, Trash2, Download, Save } from 'lucide-react';

// Constants
const TEST_CASE_STATUSES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PASSED: 'passed',
    FAILED: 'failed',
    BLOCKED: 'blocked'
};

const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

const INITIAL_TEST_CASE = {
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    tags: '',
    priority: PRIORITY_LEVELS.MEDIUM,
    requirementId: '',
    status: TEST_CASE_STATUSES.DRAFT
};

// Component for Test Case Card
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
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[testCase.status]
                            }`}>
                            {testCase.status.charAt(0).toUpperCase() + testCase.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {testCase.tags && testCase.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                            {tag}
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

// Main component
const TestCaseManagement = () => {
    // State management
    const [testCases, setTestCases] = useState([]);
    const [requirements, setRequirements] = useState([]);
    const [newTestCase, setNewTestCase] = useState({ ...INITIAL_TEST_CASE });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatingTests, setGeneratingTests] = useState(false);

    // Data fetching
    useEffect(() => {
        fetchTestCases();
        fetchRequirements();
    }, []);

    const fetchTestCases = async () => {
        setLoading(true);
        try {
            const testCasesCollection = collection(db, 'testCases');
            const testCasesSnapshot = await getDocs(testCasesCollection);
            const testCasesList = testCasesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestCases(testCasesList);
            setError(null);
        } catch (err) {
            console.error("Error fetching test cases:", err);
            setError("Failed to load test cases. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRequirements = async () => {
        try {
            const requirementsCollection = collection(db, 'requirements');
            const requirementsSnapshot = await getDocs(requirementsCollection);
            const requirementsList = requirementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequirements(requirementsList);
        } catch (err) {
            console.error("Error fetching requirements:", err);
        }
    };

    // Add test case
    const handleAddTestCase = async () => {
        if (!newTestCase.title) {
            setError("Test case title is required");
            return;
        }

        setLoading(true);
        try {
            const formattedTestCase = {
                ...newTestCase,
                tags: newTestCase.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                created: new Date(),
                lastUpdated: new Date()
            };

            await addDoc(collection(db, 'testCases'), formattedTestCase);
            setNewTestCase({ ...INITIAL_TEST_CASE });
            fetchTestCases();
            setError(null);
        } catch (err) {
            console.error("Error adding test case:", err);
            setError("Failed to add test case. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Delete test case
    const handleDeleteTestCase = async (id) => {
        if (window.confirm("Are you sure you want to delete this test case?")) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, 'testCases', id));
                fetchTestCases();
            } catch (err) {
                console.error("Error deleting test case:", err);
                setError("Failed to delete test case. Please try again.");
            } finally {
                setLoading(false);
            }
        }
    };

    // Update test case status
    const updateTestCaseStatus = async (id, newStatus) => {
        setLoading(true);
        try {
            const testCaseRef = doc(db, 'testCases', id);
            await updateDoc(testCaseRef, {
                status: newStatus,
                lastUpdated: new Date()
            });
            fetchTestCases();
        } catch (err) {
            console.error("Error updating test case status:", err);
            setError("Failed to update test case status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Generate test cases using OpenAI
    const generateTestCases = async () => {
        if (!aiPrompt) {
            setError("Please enter a prompt for test case generation");
            return;
        }

        setGeneratingTests(true);
        try {
            // OpenAI API implementation
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are a QA expert who creates detailed test cases. Respond with JSON array of test cases including title, description, steps, expectedResult, tags, and priority (low, medium, high, critical)."
                        },
                        {
                            role: "user",
                            content: aiPrompt
                        }
                    ],
                    response_format: { type: "json_object" }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate test cases');
            }

            const data = await response.json();
            const generatedTestCases = JSON.parse(data.choices[0].message.content).testCases;

            // Add generated test cases to Firebase
            for (const testCase of generatedTestCases) {
                await addDoc(collection(db, 'testCases'), {
                    ...testCase,
                    created: new Date(),
                    lastUpdated: new Date(),
                    status: TEST_CASE_STATUSES.DRAFT,
                    source: 'ai-generated'
                });
            }

            setAiPrompt('');
            fetchTestCases();
            setError(null);
        } catch (err) {
            console.error("Error generating test cases:", err);
            setError(`Failed to generate test cases: ${err.message}`);
        } finally {
            setGeneratingTests(false);
        }
    };

    // Export test cases
    const exportTestCases = () => {
        const dataStr = JSON.stringify(testCases, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'test-cases.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Export matrix
    const exportMatrix = () => {
        const matrixData = requirements.map(req => {
            const relatedTests = testCases.filter(tc => tc.requirementId === req.id);
            return {
                requirementId: req.id,
                requirementTitle: req.title,
                testCaseCount: relatedTests.length,
                testCases: relatedTests.map(t => ({ id: t.id, title: t.title, status: t.status }))
            };
        });

        const dataStr = JSON.stringify(matrixData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'traceability-matrix.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Filter test cases
    const filteredTestCases = testCases.filter(testCase => {
        const matchesSearch = testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testCase.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || testCase.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    // Render loading state
    const renderLoading = () => (
        <div className="flex justify-center py-8">
            <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
    );

    // Render error state
    const renderError = () => (
        error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    );

    // Tab: All Test Cases
    const renderAllTestCasesTab = () => (
        <TabsContent value="all-tests" className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search test cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border rounded-md"
                >
                    <option value="all">All Statuses</option>
                    {Object.values(TEST_CASE_STATUSES).map(status => (
                        <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {renderError()}

            {loading ? renderLoading() : filteredTestCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No test cases found. Create new test cases or adjust your search filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTestCases.map((testCase) => (
                        <TestCaseCard
                            key={testCase.id}
                            testCase={testCase}
                            onDelete={handleDeleteTestCase}
                            onStatusChange={updateTestCaseStatus}
                        />
                    ))}
                </div>
            )}
        </TabsContent>
    );

    // Tab: Create Test Case
    const renderCreateTestCaseTab = () => (
        <TabsContent value="create-test" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Test Case</CardTitle>
                    <CardDescription>
                        Fill in the details to create a new test case
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderError()}

                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Title *
                        </label>
                        <Input
                            id="title"
                            value={newTestCase.title}
                            onChange={(e) => setNewTestCase({ ...newTestCase, title: e.target.value })}
                            placeholder="Enter test case title"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={newTestCase.description}
                            onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                            placeholder="Enter test case description"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="priority" className="text-sm font-medium">
                                Priority
                            </label>
                            <select
                                id="priority"
                                value={newTestCase.priority}
                                onChange={(e) => setNewTestCase({ ...newTestCase, priority: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            >
                                {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {key.charAt(0) + key.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="requirementId" className="text-sm font-medium">
                                Requirement ID
                            </label>
                            <select
                                id="requirementId"
                                value={newTestCase.requirementId}
                                onChange={(e) => setNewTestCase({ ...newTestCase, requirementId: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select Requirement</option>
                                {requirements.map(req => (
                                    <option key={req.id} value={req.id}>{req.id} - {req.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="steps" className="text-sm font-medium">
                            Steps to Reproduce
                        </label>
                        <Textarea
                            id="steps"
                            value={newTestCase.steps}
                            onChange={(e) => setNewTestCase({ ...newTestCase, steps: e.target.value })}
                            placeholder="Enter steps to reproduce"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="expectedResult" className="text-sm font-medium">
                            Expected Result
                        </label>
                        <Textarea
                            id="expectedResult"
                            value={newTestCase.expectedResult}
                            onChange={(e) => setNewTestCase({ ...newTestCase, expectedResult: e.target.value })}
                            placeholder="Enter expected result"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium">
                            Tags (comma separated)
                        </label>
                        <Input
                            id="tags"
                            value={newTestCase.tags}
                            onChange={(e) => setNewTestCase({ ...newTestCase, tags: e.target.value })}
                            placeholder="e.g. regression, login, critical"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddTestCase} disabled={loading}>
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
        </TabsContent>
    );

    // Tab: AI Generation
    const renderAIGenerationTab = () => (
        <TabsContent value="ai-generation" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Test Cases with OpenAI</CardTitle>
                    <CardDescription>
                        Describe your feature or provide requirements, and OpenAI will generate test cases
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderError()}

                    <div className="space-y-2">
                        <label htmlFor="aiPrompt" className="text-sm font-medium">
                            Prompt for OpenAI
                        </label>
                        <Textarea
                            id="aiPrompt"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe the feature or functionality to test. Example: Generate test cases for a login form with email and password fields, including validation, error states, and success scenarios."
                            rows={6}
                        />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                        <h4 className="font-medium text-blue-800 mb-2">Tips for effective prompts:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                            <li>Be specific about the feature or functionality</li>
                            <li>Include any business rules or constraints</li>
                            <li>Mention edge cases you want to cover</li>
                            <li>Specify test priorities (security, performance, etc.)</li>
                            <li>Reference specific requirements by ID if applicable</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={generateTestCases} disabled={generatingTests}>
                        {generatingTests ? (
                            <>
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Generate Test Cases
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
    );

    // Tab: Traceability Matrix
    const renderTraceabilityMatrixTab = () => (
        <TabsContent value="traceability" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Requirements Traceability Matrix</CardTitle>
                    <CardDescription>
                        Map test cases to requirements for complete coverage analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requirements.length === 0 || testCases.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {requirements.length === 0 ? 'No requirements found. ' : ''}
                            {testCases.length === 0 ? 'No test cases found. ' : ''}
                            Please add requirements and test cases first.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">Requirement ID</th>
                                        <th className="border p-2 text-left">Requirement Title</th>
                                        <th className="border p-2 text-left">Test Coverage</th>
                                        <th className="border p-2 text-left">Test Cases</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements.map(req => {
                                        const relatedTests = testCases.filter(tc => tc.requirementId === req.id);
                                        const coveragePercentage =
                                            requirements.length === 0 ? 0 : (relatedTests.length / requirements.length) * 100;

                                        return (
                                            <tr key={req.id}>
                                                <td className="border p-2">{req.id}</td>
                                                <td className="border p-2">{req.title}</td>
                                                <td className="border p-2">
                                                    <div className="flex items-center">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className="bg-blue-600 h-2.5 rounded-full"
                                                                style={{ width: `${coveragePercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="ml-2 text-sm">{coveragePercentage.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="border p-2">
                                                    {relatedTests.length === 0 ? (
                                                        <span className="text-red-500 text-sm">No test cases</span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {relatedTests.map(test => (
                                                                <span
                                                                    key={test.id}
                                                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                                                >
                                                                    {test.title}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={exportMatrix}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Matrix
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Test Case Management</h1>
                <div className="flex space-x-2">
                    <Button onClick={exportTestCases} size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Tests
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all-tests">
                <TabsList>
                    <TabsTrigger value="all-tests">All Test Cases</TabsTrigger>
                    <TabsTrigger value="create-test">Create Test Case</TabsTrigger>
                    <TabsTrigger value="ai-generation">AI Generation</TabsTrigger>
                    <TabsTrigger value="traceability">Traceability Matrix</TabsTrigger>
                </TabsList>

                {renderAllTestCasesTab()}
                {renderCreateTestCaseTab()}
                {renderAIGenerationTab()}
                {renderTraceabilityMatrixTab()}
            </Tabs>
        </div>
    );
};

export default TestCaseManagement;