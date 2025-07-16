'use client';

import { useState, } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
    Edit3,
    Copy,
    Trash2,
    Play,
    Eye,
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

export default function TestCaseTable({
    testCases = [],
    loading,
    onEdit,
    onDelete,
    onDuplicate,
    onBulkAction,
    onView,
    onRun
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(testCases.map(tc => tc.id));
            toast.info(`Selected all ${testCases.length} test cases`);
        } else {
            setSelectedIds([]);
            toast.info('Cleared selection');
        }
    };

    const handleSelectItem = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => {
                const newSelection = [...prev, id];
                if (newSelection.length === 1) {
                    toast.info('1 test case selected');
                }
                return newSelection;
            });
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        toast.info(`Sorted by ${key} (${direction}ending)`);
    };

    const sortedTestCases = [...testCases].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });

    const handleDelete = (testCaseId, testCaseTitle) => {
        toast.custom((t) => (
            <div className="flex flex-col gap-2 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-gray-900">Delete Test Case</span>
                </div>
                <p className="text-sm text-gray-600">
                    Are you sure you want to delete `{testCaseTitle}`?
                </p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t);
                            if (onDelete) onDelete(testCaseId);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleDuplicate = (testCase) => {
        if (onDuplicate) onDuplicate(testCase);
    };

    const handleBulkActionClick = (action) => {
        if (onBulkAction) onBulkAction(action, selectedIds);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: 'bg-green-100 text-green-800 border-green-200',
            draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200',
            deprecated: 'bg-red-100 text-red-800 border-red-200'
        };
        return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPriorityBadge = (priority) => {
        const priorityConfig = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return priorityConfig[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="w-3 h-3 text-gray-600" /> :
            <ChevronDown className="w-3 h-3 text-gray-600" />;
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading test cases...</p>
            </div>
        );
    }

    if (testCases.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
                <p className="text-gray-600">Create a test case to get started</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200">
            {selectedIds.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} test case{selectedIds.length > 1 ? 's' : ''} selected
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

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left border-r border-gray-200">
                                <div className="flex items-center">
                                    {selectedIds.length === testCases.length ? (
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
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Test Case
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Tags
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Assignee
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('updatedAt')}
                            >
                                <div className="flex items-center gap-1">
                                    Updated
                                    {getSortIcon('updatedAt')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTestCases.map((testCase) => (
                            <tr key={testCase.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div className="flex items-center">
                                        {selectedIds.includes(testCase.id) ? (
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
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {testCase.title}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {testCase.description}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(testCase.status)}`}>
                                        {testCase.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(testCase.priority)}`}>
                                        {testCase.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div className="flex flex-wrap gap-1">
                                        {testCase.tags?.slice(0, 2).map((tag, index) => (
                                            <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded border border-gray-200">
                                                {tag}
                                            </span>
                                        ))}
                                        {testCase.tags?.length > 2 && (
                                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded border border-gray-200">
                                                +{testCase.tags.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    {testCase.assignee || 'Unassigned'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">
                                    {testCase.updatedAt ?
                                        formatDistanceToNow(testCase.updatedAt, { addSuffix: true }) :
                                        'Never'
                                    }
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (onView) {
                                                    onView(testCase);
                                                    toast.info(`Viewing "${testCase.title}"`);
                                                }
                                            }}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onRun) {
                                                    onRun(testCase);
                                                    toast.loading(`Running "${testCase.title}"...`);
                                                }
                                            }}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onEdit) {
                                                    onEdit(testCase);
                                                    toast.info(`Editing "${testCase.title}"`);
                                                }
                                            }}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(testCase)}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(testCase.id, testCase.title)}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}