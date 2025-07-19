'use client';

import { useState } from 'react';
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

const MultiSelectDropdown = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const validOptions = Array.isArray(options) ? options.filter(opt => opt?.value && opt?.label) : [];

    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    console.log('MultiSelectDropdown options in TestCaseTable:', validOptions);

    return (
        <div className="relative w-full">
            <div
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {value.length > 0 && validOptions.length > 0
                        ? value.map(v => validOptions.find(o => o.value === v)?.label).filter(Boolean).join(', ')
                        : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {validOptions.length > 0 ? (
                        validOptions.map(option => (
                            <div
                                key={option.value}
                                className="flex items-center px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleToggle(option.value)}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={() => {}}
                                    className="mr-2"
                                />
                                <span className="truncate">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">
                            No bugs available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TestCaseTable = ({
    testCases = [],
    bugs = [],
    relationships = {}, // Added to initialize linkedBugs
    loading,
    onEdit,
    onDelete,
    onDuplicate,
    onBulkAction,
    onView,
    onRun,
    onLinkBug
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

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

    const bugOptions = Array.isArray(bugs)
        ? bugs.map(bug => ({
              value: bug.id || bug.bugId || `bug_${Math.random().toString(36).slice(2)}`,
              label: bug.title || `Bug ${bug.id?.slice(-6) || bug.bugId?.slice(-6) || 'Unknown'}`
          }))
        : [];

    console.log('TestCaseTable props:', { bugs, bugOptions, testCases, relationships });

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
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('assignee')}
                            >
                                <div className="flex items-center gap-1">
                                    Assignee
                                    {getSortIcon('assignee')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Linked Bugs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading test cases...
                                </td>
                            </tr>
                        ) : sortedTestCases.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No test cases found
                                </td>
                            </tr>
                        ) : (
                            sortedTestCases.map(testCase => (
                                <tr key={testCase.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(testCase.id)}
                                                onChange={(e) => handleSelectItem(testCase.id, e.target.checked)}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <div className="text-sm text-gray-900 truncate max-w-xs" title={testCase.title}>
                                            {testCase.title || 'Untitled Test Case'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(testCase.status)}`}>
                                            {testCase.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(testCase.priority)}`}>
                                            {testCase.priority || 'Low'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <div className="text-sm text-gray-900 truncate" title={testCase.assignee}>
                                            {testCase.assignee || 'Unassigned'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <div className="text-sm text-gray-500">
                                            {testCase.updatedAt ? formatDistanceToNow(testCase.updatedAt, { addSuffix: true }) : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <MultiSelectDropdown
                                            options={bugOptions}
                                            value={relationships[testCase.id] || testCase.linkedBugs || []} // Initialize with relationships
                                            onChange={(newBugs) => onLinkBug(testCase.id, newBugs)}
                                            placeholder="Link Bugs..."
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TestCaseTable;