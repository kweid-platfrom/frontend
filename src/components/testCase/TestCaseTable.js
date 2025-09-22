/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bot,
    User,
    MessageSquare,
    CheckCircle,
    XCircle,
    Shield,
    Clock,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';
import TestCaseSideModal from '../testCase/TestCaseSideModal';

const TestCaseTable = ({
    testCases = [],
    bugs = [],
    relationships = { testCaseToBugs: {} },
    loading,
    onEdit,
    onBulkAction,
    selectedTestCases,
    onSelectTestCases,
    onLinkBug,
    onUpdateExecutionStatus,
}) => {
    const { actions: { ui: { showNotification } } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
    const [sideModalOpen, setSideModalOpen] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            onSelectTestCases(testCases.map((tc) => tc.id));
        } else {
            onSelectTestCases([]);
        }
    }, [testCases, onSelectTestCases]);

    const handleSelectItem = useCallback((id, checked) => {
        if (checked) {
            onSelectTestCases([...selectedTestCases, id]);
        } else {
            onSelectTestCases(selectedTestCases.filter((selectedId) => selectedId !== id));
        }
    }, [selectedTestCases, onSelectTestCases]);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
        setCurrentPage(1); // Reset to first page when sorting
    }, []);

    const sortedTestCases = useMemo(() => {
        return [...testCases].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (sortConfig.key === 'updated_at' || sortConfig.key === 'lastExecuted') {
                    const aDate = aValue instanceof Date ? aValue : new Date(aValue);
                    const bDate = bValue instanceof Date ? bValue : new Date(bValue);
                    if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
                    if (isNaN(aDate.getTime())) return 1;
                    if (isNaN(bDate.getTime())) return -1;
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });
    }, [testCases, sortConfig]);

    // Pagination calculations
    const totalItems = sortedTestCases.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTestCases = sortedTestCases.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    const handleChatClick = useCallback((testCase) => {
        setSelectedTestCase(testCase);
        setSideModalOpen(true);
    }, []);

    const handleSideModalClose = useCallback(() => {
        setSideModalOpen(false);
        setSelectedTestCase(null);
    }, []);

    const handleSideModalSave = useCallback((updatedTestCase) => {
        if (onEdit) {
            onEdit(updatedTestCase);
        }
        setSideModalOpen(false);
        setSelectedTestCase(null);
    }, [onEdit]);

    const handleExecutionStatusChange = useCallback((testCaseId, status) => {
        if (onUpdateExecutionStatus) {
            onUpdateExecutionStatus(testCaseId, status);
        }
    }, [onUpdateExecutionStatus]);

    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            active: 'bg-green-100 text-green-800 border-green-200',
            draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200',
            deprecated: 'bg-red-100 text-red-800 border-red-200',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getPriorityBadge = useCallback((priority) => {
        const priorityConfig = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return priorityConfig[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getExecutionStatusBadge = useCallback((status) => {
        const statusConfig = {
            passed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            blocked: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Shield },
            not_executed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
        };
        const config = statusConfig[status] || statusConfig.not_executed;
        const IconComponent = config.icon;

        return (
            <div className={`flex items-center gap-1 px-2 py-2 ${config.bg} ${config.text} rounded text-xs font-medium whitespace-nowrap w-28 justify-center`}>
                <IconComponent className="w-3 h-3" />
                <span>{status?.replace('_', ' ') || 'Not Executed'}</span>
            </div>
        );
    }, []);

    const getAutomationBadge = useCallback((isAutomated) => {
        if (isAutomated) {
            return (
                <div className="flex items-center gap-1 px-2 py-2 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap">
                    <Bot className="w-3 h-3" />
                    <span>Automated</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 px-2 py-2 bg-gray-100 text-gray-800 rounded text-xs font-medium whitespace-nowrap">
                <User className="w-3 h-3" />
                <span>Manual</span>
            </div>
        );
    }, []);

    const getSeverityBadge = useCallback((severity) => {
        const severityConfig = {
            critical: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return severityConfig[severity?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-600" />
        );
    }, [sortConfig]);

    const isValidDate = useCallback((date) => {
        return date instanceof Date && !isNaN(date.getTime());
    }, []);

    const bugOptions = useMemo(() =>
        Array.isArray(bugs)
            ? bugs.map((bug) => ({
                value: bug.id || `bug_${Math.random().toString(36).slice(2)}`,
                label: bug.title || `Bug ${bug.id?.slice(-6) || 'Unknown'}`,
            }))
            : [],
        [bugs]
    );

    const isAllSelected = selectedTestCases.length === testCases.length && testCases.length > 0;

    return (
        <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
            <EnhancedBulkActionsBar
                selectedItems={selectedTestCases}
                onClearSelection={() => onSelectTestCases([])}
                assetType="testCases"
                pageTitle="test case"
                onAction={onBulkAction}
                loadingActions={[]}
            />

            <div className="relative overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                            <th className="px-4 py-3 text-left border-r border-gray-200 w-12 sticky left-0 bg-gray-50 z-30">
                                <div className="flex items-center">
                                    {isAllSelected ? (
                                        <CheckSquare
                                            className="w-4 h-4 text-teal-600 cursor-pointer"
                                            onClick={() => handleSelectAll(false)}
                                        />
                                    ) : (
                                        <Square
                                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                                            onClick={() => handleSelectAll(true)}
                                        />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-64 sticky left-12 bg-gray-50 z-30"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Test Cases
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('severity')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Severity
                                    {getSortIcon('severity')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-48"
                                onClick={() => handleSort('executionStatus')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Execution Status
                                    {getSortIcon('executionStatus')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('automation_status')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Automation
                                    {getSortIcon('automation_status')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('assignee')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Assignee
                                    {getSortIcon('assignee')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('component')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Component
                                    {getSortIcon('component')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('testType')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Test Type
                                    {getSortIcon('testType')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('environment')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Environment
                                    {getSortIcon('environment')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('estimatedTime')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Est. Time
                                    {getSortIcon('estimatedTime')}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-48">
                                <span className="whitespace-nowrap">Linked Bugs</span>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('lastExecuted')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Last Run
                                    {getSortIcon('lastExecuted')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedTestCases.length === 0 ? (
                            <tr>
                                <td colSpan={15} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No test cases found
                                </td>
                            </tr>
                        ) : (
                            paginatedTestCases.map((testCase) => {
                                const updatedAt = testCase.updated_at instanceof Date ? testCase.updated_at : new Date(testCase.updated_at);
                                const lastExecuted = testCase.lastExecuted instanceof Date ? testCase.lastExecuted : new Date(testCase.lastExecuted);
                                const linkedBugs = relationships.testCaseToBugs[testCase.id] || [];

                                return (
                                    <tr key={testCase.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-12 sticky left-0 bg-white z-20">
                                            <div className="flex items-center">
                                                {selectedTestCases.includes(testCase.id) ? (
                                                    <CheckSquare
                                                        className="w-4 h-4 text-teal-600 cursor-pointer"
                                                        onClick={() => handleSelectItem(testCase.id, false)}
                                                    />
                                                ) : (
                                                    <Square
                                                        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                                                        onClick={() => handleSelectItem(testCase.id, true)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-64 sticky left-12 bg-white z-20">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-900 truncate max-w-[200px]" title={testCase.title}>
                                                    {testCase.title || 'Untitled Test Case'}
                                                </div>
                                                <div className="flex-shrink-0 border-l border-gray-200 pl-2">
                                                    <button
                                                        onClick={() => handleChatClick(testCase)}
                                                        className="ml-1 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        title="View/Edit Test Case"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <span
                                                className={`px-2.5 py-1.5 inline-flex text-xs w-16 leading-5 font-semibold rounded whitespace-nowrap ${getStatusBadge(
                                                    testCase.status
                                                )}`}
                                            >
                                                {testCase.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <span
                                                className={`px-2.5 py-1.5 w-20 inline-flex text-xs leading-5 font-semibold rounded whitespace-nowrap ${getPriorityBadge(
                                                    testCase.priority
                                                )}`}
                                            >
                                                {testCase.priority || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <span
                                                className={`px-2.5 py-1.5 w-20 inline-flex text-xs leading-5 font-semibold rounded whitespace-nowrap ${getSeverityBadge(
                                                    testCase.severity
                                                )}`}
                                            >
                                                {testCase.severity || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-48">
                                            <div className="flex items-center gap-2">
                                                <div className="w-28 flex justify-start">
                                                    {getExecutionStatusBadge(testCase.executionStatus)}
                                                </div>
                                                <div className="w-px h-6 bg-gray-300"></div>
                                                <div className="w-24 flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'passed')}
                                                        className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                        title="Mark as Passed"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'failed')}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                        title="Mark as Failed"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'blocked')}
                                                        className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                                                        title="Mark as Blocked"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            {getAutomationBadge(testCase.is_automated || testCase.automation_status === 'automated')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 truncate max-w-[120px]" title={testCase.assignee}>
                                                {testCase.assignee || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 truncate max-w-[120px]" title={testCase.component}>
                                                {testCase.component || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 truncate max-w-[120px]" title={testCase.testType}>
                                                {testCase.testType || 'Functional'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 truncate max-w-[120px]" title={testCase.environment}>
                                                {testCase.environment || 'Testing'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 whitespace-nowrap">
                                                {testCase.estimatedTime ? `${testCase.estimatedTime} min` : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-48 relative">
                                            <div className="w-48">
                                                <MultiSelectDropdown
                                                    options={bugOptions}
                                                    value={linkedBugs}
                                                    onChange={(newBugs) => onLinkBug(testCase.id, newBugs)}
                                                    placeholder="Link Bugs..."
                                                    type="bugs"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                {isValidDate(lastExecuted) && testCase.lastExecuted
                                                    ? formatDistanceToNow(lastExecuted, { addSuffix: true })
                                                    : 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap w-32">
                                            <div className="text-sm text-gray-500 whitespace-nowrap">
                                                {isValidDate(updatedAt)
                                                    ? formatDistanceToNow(updatedAt, { addSuffix: true })
                                                    : 'Invalid Date'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Global Pagination Component */}
            {!loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            )}

            <TestCaseSideModal
                isOpen={sideModalOpen}
                testCase={selectedTestCase}
                onClose={handleSideModalClose}
                onSave={handleSideModalSave}
            />
        </div>
    );
};

export default TestCaseTable;