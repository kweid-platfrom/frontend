/* eslint-disable react-hooks/exhaustive-deps */
// components/TestCases/TestCasesPage.js
'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import TestCaseTable from '../testCase/TestCaseTable';
import TestCaseModal from '../testCase/TestCaseModal';
import FilterBar from '../testCase/FilterBar';
import ImportModal from '../testCase/ImportModal';
import AIGenerationModal from '../testCase/AIGenerationModal';
import TraceabilityComponent from '../testCase/TraceabilityMatrix';
import { testCaseService } from '../../services/testCaseService';

export default function TestCasesPage() {
    const [testCases, setTestCases] = useState([]);
    const [filteredTestCases, setFilteredTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        search: ''
    });

    useEffect(() => {
        loadTestCases();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [testCases, filters]);

    const loadTestCases = async () => {
        try {
            setLoading(true);
            const data = await testCaseService.getTestCases();
            setTestCases(data);
        } catch {
            toast.error('Failed to load test cases');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...testCases];

        // Apply search filter
        if (filters.search) {
            filtered = filtered.filter(tc => 
                tc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                tc.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                tc.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
            );
        }

        // Apply status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(tc => tc.status === filters.status);
        }

        // Apply priority filter
        if (filters.priority !== 'all') {
            filtered = filtered.filter(tc => tc.priority === filters.priority);
        }

        // Apply assignee filter
        if (filters.assignee !== 'all') {
            filtered = filtered.filter(tc => tc.assignee === filters.assignee);
        }

        // Apply tags filter
        if (filters.tags.length > 0) {
            filtered = filtered.filter(tc => 
                filters.tags.some(tag => tc.tags.includes(tag))
            );
        }

        setFilteredTestCases(filtered);
    };

    const handleCreateTestCase = () => {
        setSelectedTestCase(null);
        setIsModalOpen(true);
    };

    const handleEditTestCase = (testCase) => {
        setSelectedTestCase(testCase);
        setIsModalOpen(true);
    };

    const handleDeleteTestCase = async (id) => {
        if (window.confirm('Are you sure you want to delete this test case?')) {
            try {
                await testCaseService.deleteTestCase(id);
                await loadTestCases();
                toast.success('Test case deleted successfully');
            } catch {
                toast.error('Failed to delete test case');
            }
        }
    };

    const handleSaveTestCase = async (testCaseData) => {
        try {
            if (selectedTestCase) {
                await testCaseService.updateTestCase(selectedTestCase.id, testCaseData);
                toast.success('Test case updated successfully');
            } else {
                await testCaseService.createTestCase(testCaseData);
                toast.success('Test case created successfully');
            }
            setIsModalOpen(false);
            await loadTestCases();
        } catch {
            toast.error('Failed to save test case');
        }
    };

    const handleDuplicateTestCase = async (testCase) => {
        try {
            const duplicatedTestCase = {
                ...testCase,
                title: `${testCase.title} (Copy)`,
                id: undefined,
                createdAt: undefined,
                updatedAt: undefined
            };
            await testCaseService.createTestCase(duplicatedTestCase);
            await loadTestCases();
            toast.success('Test case duplicated successfully');
        } catch {
            toast.error('Failed to duplicate test case');
        }
    };

    const handleBulkAction = async (action, selectedIds) => {
        try {
            switch (action) {
                case 'delete':
                    await testCaseService.bulkDelete(selectedIds);
                    toast.success(`${selectedIds.length} test cases deleted`);
                    break;
                case 'archive':
                    await testCaseService.bulkUpdateStatus(selectedIds, 'archived');
                    toast.success(`${selectedIds.length} test cases archived`);
                    break;
                case 'activate':
                    await testCaseService.bulkUpdateStatus(selectedIds, 'active');
                    toast.success(`${selectedIds.length} test cases activated`);
                    break;
                default:
                    break;
            }
            await loadTestCases();
        } catch {
            toast.error(`Failed to perform bulk action: ${action}`);
        }
    };

    const handleImportComplete = async () => {
        setIsImportModalOpen(false);
        await loadTestCases();
        toast.success('Test cases imported successfully');
    };

    const handleAIGenerationComplete = async (generatedTestCases) => {
        setIsAIModalOpen(false);
        try {
            await testCaseService.bulkCreate(generatedTestCases);
            await loadTestCases();
            toast.success(`${generatedTestCases.length} test cases generated and saved`);
        } catch {
            toast.error('Failed to save generated test cases');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
                    <p className="text-gray-600">Manage your test cases and test suites</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsTraceabilityOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Traceability
                    </button>
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Import
                    </button>
                    <button 
                        onClick={() => setIsAIModalOpen(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        AI Generate
                    </button>
                    <button 
                        onClick={handleCreateTestCase}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Create Test Case
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <FilterBar 
                filters={filters}
                onFiltersChange={setFilters}
                testCases={testCases}
            />

            {/* Test Cases Table */}
            <div className="bg-white rounded-lg shadow">
                <TestCaseTable
                    testCases={filteredTestCases}
                    loading={loading}
                    onEdit={handleEditTestCase}
                    onDelete={handleDeleteTestCase}
                    onDuplicate={handleDuplicateTestCase}
                    onBulkAction={handleBulkAction}
                />
            </div>

            {/* Modals */}
            {isModalOpen && (
                <TestCaseModal
                    testCase={selectedTestCase}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTestCase}
                />
            )}

            {isImportModalOpen && (
                <ImportModal
                    onClose={() => setIsImportModalOpen(false)}
                    onImportComplete={handleImportComplete}
                />
            )}

            {isAIModalOpen && (
                <AIGenerationModal
                    onClose={() => setIsAIModalOpen(false)}
                    onGenerationComplete={handleAIGenerationComplete}
                />
            )}

            {isTraceabilityOpen && (
                <TraceabilityComponent
                    testCases={testCases}
                    onClose={() => setIsTraceabilityOpen(false)}
                />
            )}
        </div>
    );
}