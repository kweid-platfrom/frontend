import React, { useState, useEffect } from 'react';
import TestCaseList from "../components/test-case/TestCaseList"
import TestCaseForm from "../components/test-case/TestCaseForm";
import ImportDocument from "../components/test-case/ImportDocument";
import FilterSection from '../components/test-case/FilterSection';
import AIProcessingModal from '../components/test-case/AIProcessingModal';
import ReportExportModal from '../components/test-case/ReportExportModal';
import { ArrowDownCircle, FileUp, Plus } from 'lucide-react';

const TestCaseManagement = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAIProcessingModal, setShowAIProcessingModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [filters, setFilters] = useState({
        priority: [],
        module: [],
        status: [],
        searchTerm: '',
    });

    // Fetch test cases on component mount
    useEffect(() => {
        fetchTestCases();
    }, []);

    const fetchTestCases = async () => {
        setLoading(true);
        try {
            // Simulated API call
            setTimeout(() => {
                const mockTestCases = [
                    {
                        id: 1,
                        title: 'User Login Functionality',
                        description: 'Verify user can login with valid credentials',
                        priority: 'High',
                        module: 'Authentication',
                        status: 'Active',
                        createdBy: 'John Doe',
                        createdAt: '2025-03-15',
                        steps: [
                            { id: 1, description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
                            { id: 2, description: 'Enter valid username and password', expectedResult: 'Credentials are accepted' },
                            { id: 3, description: 'Click login button', expectedResult: 'User is redirected to dashboard' }
                        ],
                        executionStatus: 'Not Run',
                        version: '1.0',
                    },
                    {
                        id: 2,
                        title: 'Password Reset',
                        description: 'Verify user can reset password',
                        priority: 'Medium',
                        module: 'Authentication',
                        status: 'Active',
                        createdBy: 'Jane Smith',
                        createdAt: '2025-03-14',
                        steps: [
                            { id: 1, description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
                            { id: 2, description: 'Click "Forgot Password"', expectedResult: 'Password reset page is displayed' },
                            { id: 3, description: 'Enter email address', expectedResult: 'Email is accepted' },
                            { id: 4, description: 'Click reset button', expectedResult: 'Password reset email is sent' }
                        ],
                        executionStatus: 'Passed',
                        version: '1.0',
                    }
                ];
                setTestCases(mockTestCases);
                setLoading(false);
            }, 1500);
        } catch (error) {
            console.error('Error fetching test cases:', error);
            setLoading(false);
        }
    };

    const handleCreateTestCase = () => {
        setSelectedTestCase(null);
        setShowForm(true);
    };

    const handleImportDocument = () => {
        setShowImportModal(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleDocumentImported = (_document) => {
        setShowImportModal(false);
        setShowAIProcessingModal(true);

        // Simulate AI processing
        setTimeout(() => {
            const newTestCases = [
                {
                    id: testCases.length + 1,
                    title: 'Document Upload Functionality',
                    description: 'Verify user can upload documents',
                    priority: 'Medium',
                    module: 'Document Management',
                    status: 'Draft',
                    createdBy: 'AI Generator',
                    createdAt: new Date().toISOString().split('T')[0],
                    steps: [
                        { id: 1, description: 'Navigate to document upload page', expectedResult: 'Upload page is displayed' },
                        { id: 2, description: 'Select document from file system', expectedResult: 'Document is selected' },
                        { id: 3, description: 'Click upload button', expectedResult: 'Document is uploaded successfully' }
                    ],
                    executionStatus: 'Not Run',
                    version: '1.0',
                },
                {
                    id: testCases.length + 2,
                    title: 'Document Validation',
                    description: 'Verify document validation works correctly',
                    priority: 'High',
                    module: 'Document Management',
                    status: 'Draft',
                    createdBy: 'AI Generator',
                    createdAt: new Date().toISOString().split('T')[0],
                    steps: [
                        { id: 1, description: 'Try to upload invalid document format', expectedResult: 'Error message is displayed' },
                        { id: 2, description: 'Try to upload document exceeding size limit', expectedResult: 'Error message is displayed' }
                    ],
                    executionStatus: 'Not Run',
                    version: '1.0',
                }
            ];

            setTestCases([...testCases, ...newTestCases]);
            setShowAIProcessingModal(false);
        }, 3000);
    };

    const handleSaveTestCase = (testCase) => {
        if (testCase.id) {
            // Update existing test case
            setTestCases(testCases.map(tc => tc.id === testCase.id ? testCase : tc));
        } else {
            // Add new test case
            const newTestCase = {
                ...testCase,
                id: testCases.length + 1,
                createdAt: new Date().toISOString().split('T')[0],
                executionStatus: 'Not Run',
                version: '1.0',
            };
            setTestCases([...testCases, newTestCase]);
        }
        setShowForm(false);
    };

    const handleEditTestCase = (testCase) => {
        setSelectedTestCase(testCase);
        setShowForm(true);
    };

    const handleDeleteTestCase = (id) => {
        setTestCases(testCases.filter(tc => tc.id !== id));
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleExportReport = () => {
        setShowExportModal(true);
    };

    const filteredTestCases = testCases.filter(tc => {
        const matchesPriority = filters.priority.length === 0 || filters.priority.includes(tc.priority);
        const matchesModule = filters.module.length === 0 || filters.module.includes(tc.module);
        const matchesStatus = filters.status.length === 0 || filters.status.includes(tc.status);
        const matchesSearch = !filters.searchTerm ||
            tc.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            tc.description.toLowerCase().includes(filters.searchTerm.toLowerCase());

        return matchesPriority && matchesModule && matchesStatus && matchesSearch;
    });

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-grow p-6 shadow">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Test Cases</h1>
                    
                    {/* Action Buttons in the header section */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleImportDocument}
                            className="px-4 py-2 bg-[#2D3142] text-white rounded hover:bg-[#1d1f27] flex items-center"
                        >
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Import
                        </button>
                        <button
                            onClick={handleExportReport}
                            className="px-4 py-2 bg-[#FF64BD] text-white rounded hover:bg-[#834468] flex items-center"
                        >
                            <FileUp className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button
                            onClick={handleCreateTestCase}
                            className="px-4 py-2 bg-[#00897B] text-white rounded hover:bg-[#195952] flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New
                        </button>
                    </div>
                </div>

                {/* Filter Section without action buttons */}
                <FilterSection
                    testCases={testCases}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                <div className="grid grid-cols-1 gap-6">
                    <div className="col-span-1">
                        <TestCaseList
                            testCases={filteredTestCases}
                            loading={loading}
                            onEdit={handleEditTestCase}
                            onDelete={handleDeleteTestCase}
                        />
                    </div>
                </div>
            </div>

            {showForm && (
                <TestCaseForm
                    testCase={selectedTestCase}
                    onSave={handleSaveTestCase}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {showImportModal && (
                <ImportDocument
                    onImport={handleDocumentImported}
                    onCancel={() => setShowImportModal(false)}
                />
            )}

            {showAIProcessingModal && (
                <AIProcessingModal />
            )}

            {showExportModal && (
                <ReportExportModal
                    testCases={filteredTestCases}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
};

export default TestCaseManagement;