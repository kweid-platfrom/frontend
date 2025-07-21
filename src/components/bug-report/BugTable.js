'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    Edit3,
    Copy,
    Trash2,
    Eye,
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    GripVertical,
    Paperclip,
    Video,
    Terminal,
    Network,
    User,
    Calendar,
    AlertTriangle,
    Clock,
    Tag,
    MessageSquare,
    Monitor,
    Globe,
} from 'lucide-react';
import {
    getStatusColor,
    getPriorityColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    formatDate,
    getTeamMemberName,
    getEvidenceCount,
} from '@/utils/bugUtils';

const VALID_BUG_STATUSES = ['New', 'Open', 'In Progress', 'Resolved', 'Closed'];
const VALID_BUG_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];

const MultiSelectDropdown = ({ options = [], value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const validOptions = Array.isArray(options) ? options.filter((opt) => opt?.value && opt?.label) : [];

    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleDropdownClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (e, optionValue) => {
        e.stopPropagation();
        e.preventDefault();
        handleToggle(optionValue);
    };

    const handleCheckboxChange = (e, optionValue) => {
        e.stopPropagation();
        e.preventDefault();
        handleToggle(optionValue);
    };

    return (
        <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <div
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white flex items-center justify-between"
                onClick={handleDropdownClick}
            >
                <span className="truncate">
                    {value.length > 0 && validOptions.length > 0
                        ? value.map((v) => validOptions.find((o) => o.value === v)?.label).filter(Boolean).join(', ')
                        : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {validOptions.length > 0 ? (
                        validOptions.map((option) => (
                            <div
                                key={option.value}
                                className="flex items-center px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => handleOptionClick(e, option.value)}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={(e) => handleCheckboxChange(e, option.value)}
                                    className="mr-2"
                                />
                                <span className="truncate">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">No test cases available</div>
                    )}
                </div>
            )}
        </div>
    );
};

const BugTable = ({
    bugs = [],
    testCases = [],
    relationships = {},
    teamMembers = [],
    environments = [],
    loading = false,
    onEdit,
    onDelete,
    onDuplicate,
    onBulkAction,
    onView,
    onLinkTestCase,
    onChatClick,
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(bugs.map((bug) => bug.id));
            toast.info(`Selected all ${bugs.length} bugs`);
        } else {
            setSelectedIds([]);
            toast.info('Cleared selection');
        }
    };

    const handleSelectItem = (id, checked) => {
        if (checked) {
            setSelectedIds((prev) => {
                const newSelection = [...prev, id];
                if (newSelection.length === 1) {
                    toast.info('1 bug selected');
                }
                return newSelection;
            });
        } else {
            setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
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

    const sortedBugs = [...bugs].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
            if (['updated_at', 'created_at', 'due_date'].includes(sortConfig.key)) {
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

    const handleDelete = (bugId, bugTitle) => {
        toast.custom(
            (t) => (
                <div className="flex flex-col gap-2 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900">Delete Bug</span>
                    </div>
                    <p className="text-sm text-gray-600">Are you sure you want to delete `{bugTitle}`?</p>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                if (onDelete) onDelete(bugId);
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
            ),
            { duration: Infinity }
        );
    };

    const handleDuplicate = (bug) => {
        if (onDuplicate) onDuplicate(bug);
    };

    const handleBulkActionClick = (action) => {
        if (onBulkAction) onBulkAction(action, selectedIds);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-600" />
        );
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'manual':
                return <User className="h-3 w-3" />;
            case 'automated':
                return <Terminal className="h-3 w-3" />;
            default:
                return <Globe className="h-3 w-3" />;
        }
    };

    const getUserFriendlyBugId = (bugId) => {
        if (!bugId) return 'Unknown';
        return `BUG-${bugId.slice(-6).toUpperCase()}`;
    };

    const formatDateSafe = (date) => {
        if (!date) return 'Not set';
        try {
            if (date.toDate) return formatDate(date.toDate());
            if (date instanceof Date) return formatDate(date);
            if (typeof date === 'string') return formatDate(new Date(date));
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const handleSeverityChange = async (bugId, newSeverity) => {
        if (onEdit) {
            try {
                await onEdit(bugId, { severity: newSeverity, priority: getPriorityFromSeverity(newSeverity) });
                toast.success('Severity updated');
            } catch (error) {
                console.error('Failed to update severity:', error);
                toast.error('Failed to update severity');
            }
        }
    };

    const handleStatusChange = async (bugId, newStatus) => {
        if (onEdit) {
            try {
                await onEdit(bugId, { status: newStatus });
                toast.success('Status updated');
            } catch (error) {
                console.error('Failed to update status:', error);
                toast.error('Failed to update status');
            }
        }
    };

    const handleAssignmentChange = async (bugId, newAssignee) => {
        if (onEdit) {
            try {
                await onEdit(bugId, { assigned_to: newAssignee });
                toast.success('Assignee updated');
            } catch (error) {
                console.error('Failed to update assignee:', error);
                toast.error('Failed to update assignee');
            }
        }
    };

    const handleEnvironmentChange = async (bugId, newEnvironment) => {
        if (onEdit) {
            try {
                await onEdit(bugId, { environment: newEnvironment });
                toast.success('Environment updated');
            } catch (error) {
                console.error('Failed to update environment:', error);
                toast.error('Failed to update environment');
            }
        }
    };

    const handleFrequencyChange = async (bugId, newFrequency) => {
        if (onEdit) {
            try {
                await onEdit(bugId, { frequency: newFrequency });
                toast.success('Frequency updated');
            } catch (error) {
                console.error('Failed to update frequency:', error);
                toast.error('Failed to update frequency');
            }
        }
    };

    const testCaseOptions = Array.isArray(testCases)
        ? testCases.map((tc) => ({
            value: tc.id || tc.testCaseId || `tc_${Math.random().toString(36).slice(2)}`,
            label: tc.title || `Test Case ${tc.id?.slice(-6) || tc.testCaseId?.slice(-6) || 'Unknown'}`,
        }))
        : [];

    return (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200 relative">
            {selectedIds.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-200 px-6 py-3 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkActionClick('open')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Open
                            </button>
                            <button
                                onClick={() => handleBulkActionClick('close')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Close
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
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="w-10 px-2 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-20 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                    {selectedIds.length === bugs.length ? (
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
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-[300px] min-w-[300px] sticky left-10 bg-gray-50 z-20 whitespace-nowrap"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Bug Title
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-20 min-w-[80px] whitespace-nowrap"
                                onClick={() => handleSort('id')}
                            >
                                <div className="flex items-center gap-1">
                                    Bug ID
                                    {getSortIcon('id')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 min-w-[128px] whitespace-nowrap"
                                onClick={() => handleSort('tags')}
                            >
                                <div className="flex items-center gap-1">
                                    Tags
                                    {getSortIcon('tags')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 min-w-[128px] whitespace-nowrap"
                                onClick={() => handleSort('assigned_to')}
                            >
                                <div className="flex items-center gap-1">
                                    Assignee
                                    {getSortIcon('assigned_to')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-20 min-w-[80px] whitespace-nowrap"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('severity')}
                            >
                                <div className="flex items-center gap-1">
                                    Severity
                                    {getSortIcon('severity')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                            >
                                Evidence
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('created_by')}
                            >
                                <div className="flex items-center gap-1">
                                    Reporter
                                    {getSortIcon('created_by')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('source')}
                            >
                                <div className="flex items-center gap-1">
                                    Source
                                    {getSortIcon('source')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-28 min-w-[112px] whitespace-nowrap"
                                onClick={() => handleSort('environment')}
                            >
                                <div className="flex items-center gap-1">
                                    Environment
                                    {getSortIcon('environment')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-28 min-w-[112px] whitespace-nowrap"
                                onClick={() => handleSort('browserInfo')}
                            >
                                <div className="flex items-center gap-1">
                                    Browser/Device
                                    {getSortIcon('browserInfo')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-28 min-w-[112px] whitespace-nowrap"
                                onClick={() => handleSort('due_date')}
                            >
                                <div className="flex items-center gap-1">
                                    Due Date
                                    {getSortIcon('due_date')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('created_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Created At
                                    {getSortIcon('created_at')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24 min-w-[96px] whitespace-nowrap"
                                onClick={() => handleSort('frequency')}
                            >
                                <div className="flex items-center gap-1">
                                    Frequency
                                    {getSortIcon('frequency')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-28 min-w-[112px] whitespace-nowrap"
                            >
                                Linked Test Cases
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8 min-w-[32px] whitespace-nowrap"
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={17} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading bugs...
                                </td>
                            </tr>
                        ) : bugs.length === 0 ? (
                            <tr>
                                <td colSpan={17} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No bugs found
                                </td>
                            </tr>
                        ) : (
                            sortedBugs.map((bug) => {
                                const createdAt = bug.created_at instanceof Date ? bug.created_at : new Date(bug.created_at);
                                const dueDate = bug.due_date ? (bug.due_date instanceof Date ? bug.due_date : new Date(bug.due_date)) : null;
                                const linkedTestCaseIds =
                                    relationships[bug.id] ||
                                    (bug.linkedTestCases?.map((tc) => (typeof tc === 'string' ? tc : tc.id || tc.testCaseId)).filter(Boolean)) ||
                                    [];
                                const totalAttachments = bug?.attachments?.length || 0;
                                const evidenceCount = getEvidenceCount(bug);
                                const getAssignedUser = () => {
                                    if (bug.assigned_to) return bug.assigned_to;
                                    if (bug.created_by) return bug.created_by;
                                    if (bug.reportedByEmail) return bug.reportedByEmail;
                                    return '';
                                };
                                const assignedUser = getAssignedUser();
                                const reporterName = getTeamMemberName(bug.created_by || bug.reportedByEmail, teamMembers) || 'Unknown';
                                const isSelected = selectedIds.includes(bug.id);
                                return (
                                    <tr
                                        key={`bug-${bug.id}`}
                                        className={`h-12 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                        draggable={true}
                                        onDragStart={(e) => e.dataTransfer.setData('text/plain', bug.id)}
                                    >
                                        <td className={`w-10 px-2 py-4 border-r border-gray-200 sticky left-0 bg-white z-20 align-middle ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <div className="flex items-center justify-center h-full">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(bug.id)}
                                                    onChange={(e) => handleSelectItem(bug.id, e.target.checked)}
                                                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                />
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 sticky left-10 bg-white z-20 align-middle ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <div className="flex items-center space-x-2 h-full">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col justify-center space-y-1">
                                                        <div
                                                            className="font-medium text-gray-900 truncate text-sm leading-tight"
                                                            title={bug.title}
                                                        >
                                                            {bug.title || 'Untitled Bug'}
                                                        </div>
                                                        {bug.comments && bug.comments.length > 0 && (
                                                            <div className="flex items-center text-xs text-gray-400">
                                                                <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                <span className="flex-shrink-0">
                                                                    {bug.comments.length} comment{bug.comments.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => onChatClick && onChatClick(bug, e)}
                                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                    title="View bug details"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-20 min-w-[80px] align-middle">
                                            <div className="flex items-center justify-center h-full">
                                                <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                    {getUserFriendlyBugId(bug.id)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 min-w-[128px] align-middle">
                                            <div className="flex items-center justify-center h-full">
                                                {bug.tags && bug.tags.length > 0 ? (
                                                    <div className="flex items-center gap-1 overflow-hidden max-w-28">
                                                        {bug.tags.slice(0, 2).map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-teal-800 flex-shrink-0"
                                                            >
                                                                <Tag className="h-2 w-2 mr-1" />
                                                                <span className="truncate max-w-16">{tag}</span>
                                                            </span>
                                                        ))}
                                                        {bug.tags.length > 2 && (
                                                            <span className="text-xs text-gray-400 flex-shrink-0">+{bug.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center justify-center">
                                                <select
                                                    value={bug.status || 'New'}
                                                    onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                                                    className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug.status)}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {VALID_BUG_STATUSES.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 min-w-[128px] align-middle">
                                            <div className="flex items-center">
                                                <select
                                                    value={assignedUser}
                                                    onChange={(e) => handleAssignmentChange(bug.id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map((member) => (
                                                        <option key={member.id || member.email} value={member.email || member.id}>
                                                            {getTeamMemberName(member.id || member.email, teamMembers)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-20 min-w-[80px] align-middle">
                                            <div className="flex items-center">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                                                        getPriorityFromSeverity(bug.severity)
                                                    )}`}
                                                >
                                                    {getPriorityFromSeverity(bug.severity) || 'Low'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center">
                                                <select
                                                    value={bug.severity || 'Low'}
                                                    onChange={(e) => handleSeverityChange(bug.id, e.target.value)}
                                                    className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug.severity)}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {VALID_BUG_SEVERITIES.map((severity) => (
                                                        <option key={severity} value={severity}>
                                                            {severity}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center space-x-1">
                                                {bug.hasAttachments && totalAttachments > 0 && (
                                                    <div className="flex items-center bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-xs">
                                                        <Paperclip className="h-3 w-3 mr-1" />
                                                        {totalAttachments}
                                                    </div>
                                                )}
                                                {bug.hasVideoEvidence && (
                                                    <div className="bg-purple-100 text-purple-800 p-1 rounded">
                                                        <Video className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {bug.hasConsoleLogs && (
                                                    <div className="bg-green-100 text-green-800 p-1 rounded">
                                                        <Terminal className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {bug.hasNetworkLogs && (
                                                    <div className="bg-orange-100 text-orange-800 p-1 rounded">
                                                        <Network className="h-3 w-3" />
                                                    </div>
                                                )}
                                                {evidenceCount === 0 && <span className="text-xs text-gray-400">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center">
                                                <div className="truncate w-full text-center" title={bug.created_by || bug.reportedByEmail}>
                                                    {reporterName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center">
                                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                                                    {getSourceIcon(bug.source)}
                                                    <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 min-w-[112px] align-middle">
                                            <div className="flex items-center">
                                                <select
                                                    value={bug.environment || 'Production'}
                                                    onChange={(e) => handleEnvironmentChange(bug.id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {environments.map((env) => (
                                                        <option key={env} value={env}>
                                                            {env}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200 w-28 min-w-[112px] align-middle">
                                            <div className="flex items-center">
                                                <Monitor className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate text-xs">{bug.browserInfo || 'Unknown'}</div>
                                                    <div className="text-gray-500 truncate text-xs">{bug.deviceInfo?.split(',')[0] || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 w-28 min-w-[112px] align-middle">
                                            <div className="flex items-center">
                                                {bug.due_date ? (
                                                    <div className={`flex items-center ${isPastDue(bug.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                                                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                                        <span className="text-xs">{formatDateSafe(dueDate)}</span>
                                                        {isPastDue(bug.due_date) && (
                                                            <AlertTriangle className="h-3 w-3 ml-1 text-red-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No due date</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{formatDateSafe(createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                                            <div className="flex items-center">
                                                <select
                                                    value={bug.frequency || 'Sometimes'}
                                                    onChange={(e) => handleFrequencyChange(bug.id, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {VALID_FREQUENCIES.map((freq) => (
                                                        <option key={freq} value={freq}>
                                                            {freq}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 min-w-[112px] align-middle">
                                            <MultiSelectDropdown
                                                options={testCaseOptions}
                                                value={linkedTestCaseIds}
                                                onChange={(newTestCases) => onLinkTestCase && onLinkTestCase(bug.id, newTestCases)}
                                                placeholder="Link Test Cases..."
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap w-8 min-w-[32px] align-middle">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => onView && onView(bug)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit && onEdit(bug)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(bug)}
                                                    className="text-gray-400 hover:text-teal-600"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bug.id, bug.title)}
                                                    className="text-gray-400 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
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

export default BugTable;