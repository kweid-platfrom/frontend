'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    Edit3,
    Copy,
    Trash2,
    Play,
    Eye,
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bot,
    User,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';

const TestCaseTable = ({
    testCases = [],
    bugs = [],
    relationships = { testCaseToBugs: {} },
    loading,
    onEdit,
    onDelete,
    onDuplicate,
    onBulkAction,
    onView,
    onRun,
    selectedTestCases,
    onSelectTestCases,
    onLinkBug,
}) => {
    const { actions: { ui: { showNotification } } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

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
    }, []);

    const sortedTestCases = useMemo(() => {
        return [...testCases].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (sortConfig.key === 'updated_at') {
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

    const handleDelete = useCallback((testCaseId, testCaseTitle) => {
        showNotification({
            id: `delete-test-case-${testCaseId}`,
            type: 'custom',
            title: 'Delete Test Case',
            message: (
                <div className="flex flex-col gap-2 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900">Delete Test Case</span>
                    </div>
                    <p className="text-sm text-gray-600">Are you sure you want to delete `{testCaseTitle}`?</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => {
                                if (onDelete) onDelete(testCaseId);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => showNotification(null)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            duration: 0,
        });
    }, [onDelete, showNotification]);

    const handleDuplicate = useCallback((testCase) => {
        if (onDuplicate) onDuplicate(testCase);
    }, [onDuplicate]);

    const handleBulkActionClick = useCallback((action) => {
        if (onBulkAction) {
            const mappedAction = action === 'activate' ? 'active' : action === 'archive' ? 'archived' : action;
            onBulkAction(mappedAction, selectedTestCases);
        }
    }, [onBulkAction, selectedTestCases]);

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

    const getAutomationBadge = useCallback((isAutomated) => {
        if (isAutomated) {
            return (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <Bot className="w-3 h-3" />
                    <span>Automated</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                <User className="w-3 h-3" />
                <span>Manual</span>
            </div>
        );
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
            {selectedTestCases.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedTestCases.length} test case{selectedTestCases.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkActionClick('activate')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Activate
                            </button>
                            <button
                                onClick={() => handleBulkActionClick('archive')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Archive
                            </button>
                            <button
                                onClick={() => handleBulkActionClick('delete')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 text-left border-r border-gray-200 w-12">
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
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-48"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Test Case
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('automation_status')}
                            >
                                <div className="flex items-center gap-1">
                                    Automation
                                    {getSortIcon('automation_status')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('assignee')}
                            >
                                <div className="flex items-center gap-1">
                                    Assignee
                                    {getSortIcon('assignee')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-48">
                                Linked Bugs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading test cases...
                                </td>
                            </tr>
                        ) : sortedTestCases.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No test cases found
                                </td>
                            </tr>
                        ) : (
                            sortedTestCases.map((testCase) => {
                                const updatedAt = testCase.updated_at instanceof Date ? testCase.updated_at : new Date(testCase.updated_at);
                                const linkedBugs = relationships.testCaseToBugs[testCase.id] || [];

                                return (
                                    <tr key={testCase.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-12">
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
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-48">
                                            <div className="text-sm text-gray-900 truncate max-w-[180px]" title={testCase.title}>
                                                {testCase.title || 'Untitled Test Case'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                                                    testCase.status
                                                )}`}
                                            >
                                                {testCase.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(
                                                    testCase.priority
                                                )}`}
                                            >
                                                {testCase.priority || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            {getAutomationBadge(testCase.is_automated || testCase.automation_status === 'automated')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-900 truncate max-w-[120px]" title={testCase.assignee}>
                                                {testCase.assignee || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-32">
                                            <div className="text-sm text-gray-500">
                                                {isValidDate(updatedAt)
                                                    ? formatDistanceToNow(updatedAt, { addSuffix: true })
                                                    : 'Invalid Date'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 w-48 relative">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => onView && onView(testCase)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit && onEdit(testCase)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(testCase)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(testCase.id, testCase.title)}
                                                    className="text-gray-400 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onRun && onRun(testCase)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="Run"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TestCaseTable;