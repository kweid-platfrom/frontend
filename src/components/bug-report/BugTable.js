'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    AlertTriangle,
    Bug,
    Clock,
    MessageSquare,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import InlineEditCell from './InlineEditCell';
import BulkActionsBar from './BulkActionsBar';

const BugTable = ({
    bugs = [],
    testCases = [],
    relationships = { bugToTestCases: {} },
    loading,
    onBulkAction,
    onView,
    selectedBugs,
    onSelectBugs,
    onLinkTestCase,
    onUpdateBug,
}) => {
    const { actions: { ui: { showNotification } } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            onSelectBugs(bugs.map((bug) => bug.id));
        } else {
            onSelectBugs([]);
        }
    }, [bugs, onSelectBugs]);

    const handleSelectItem = useCallback((id, checked) => {
        if (checked) {
            onSelectBugs([...selectedBugs, id]);
        } else {
            onSelectBugs(selectedBugs.filter((selectedId) => selectedId !== id));
        }
    }, [selectedBugs, onSelectBugs]);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    const sortedBugs = useMemo(() => {
        return [...bugs].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
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
    }, [bugs, sortConfig]);

    const handleLinkTestCase = useCallback((bugId, testCaseIds) => {
        if (onLinkTestCase) {
            onLinkTestCase(bugId, testCaseIds);
        }
    }, [onLinkTestCase]);

    const handleUpdateBug = useCallback((bugId, updates) => {
        if (typeof onUpdateBug === 'function') {
            onUpdateBug(bugId, updates);
        } else {
            console.warn('onUpdateBug is not a function', { bugId, updates });
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'Cannot update bug: Update function not available',
            });
        }
    }, [onUpdateBug, showNotification]);

    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            open: 'bg-red-100 text-red-800 border-red-200',
            'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            resolved: 'bg-green-100 text-green-800 border-green-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200',
            duplicate: 'bg-purple-100 text-purple-800 border-purple-200',
            'won\'t-fix': 'bg-orange-100 text-orange-800 border-orange-200',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getSeverityBadge = useCallback((severity) => {
        const severityConfig = {
            critical: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200',
            trivial: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return severityConfig[severity?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getPriorityBadge = useCallback((priority) => {
        const priorityConfig = {
            urgent: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return priorityConfig[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getDerivedPriority = useCallback((severity) => {
        const priorityMap = {
            critical: 'urgent',
            high: 'high',
            medium: 'medium',
            low: 'low',
            trivial: 'low'
        };
        return priorityMap[severity?.toLowerCase()] || 'medium';
    }, []);

    const getSeverityIcon = useCallback((severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return <AlertTriangle className="w-3 h-3 text-red-600" />;
            case 'high':
                return <AlertTriangle className="w-3 h-3 text-orange-600" />;
            case 'medium':
                return <Bug className="w-3 h-3 text-yellow-600" />;
            case 'low':
                return <Bug className="w-3 h-3 text-blue-600" />;
            case 'trivial':
                return <Bug className="w-3 h-3 text-gray-600" />;
            default:
                return <Bug className="w-3 h-3 text-gray-600" />;
        }
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

    const formatEvidence = useCallback((evidence) => {
        if (!evidence) return 'None';

        if (typeof evidence === 'string') {
            return evidence.length > 50 ? evidence.slice(0, 50) + '...' : evidence;
        }

        if (Array.isArray(evidence)) {
            return evidence.length ? `${evidence.length} item(s)` : 'None';
        }

        if (typeof evidence === 'object') {
            try {
                const parts = [];
                if (evidence.browser) parts.push(`Browser: ${evidence.browser}`);
                if (evidence.browserVersion || evidence.version) parts.push(`Version: ${evidence.browserVersion || evidence.version}`);
                if (evidence.os) parts.push(`OS: ${evidence.os}`);
                if (evidence.device) parts.push(`Device: ${evidence.device}`);
                if (evidence.url) parts.push(`URL: ${new URL(evidence.url).hostname}`);

                return parts.length ? parts.join(' | ') : 'Evidence data';
            } catch {
                return 'Evidence data';
            }
        }

        return String(evidence);
    }, []);

    // Helper function to format reporter name
    const formatReporter = useCallback((bug) => {
        // Try different possible reporter field names
        return bug.reportedBy ||
            bug.reportedByName ||
            bug.reporter ||
            bug.created_by_name ||
            bug.updatedByName ||
            'Unknown';
    }, []);

    const testCaseOptions = useMemo(() =>
        Array.isArray(testCases)
            ? testCases.map((testCase) => ({
                value: testCase.id || `tc_${Math.random().toString(36).slice(2)}`,
                label: testCase.title || `Test Case ${testCase.id?.slice(-6) || 'Unknown'}`,
            }))
            : [],
        [testCases]
    );

    const statusOptions = useMemo(() => [
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'won\'t-fix', label: 'Won\'t Fix' },
    ], []);

    const severityOptions = useMemo(() => [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
        { value: 'trivial', label: 'Trivial' },
    ], []);

    const environmentOptions = useMemo(() => [
        { value: 'production', label: 'Production' },
        { value: 'staging', label: 'Staging' },
        { value: 'development', label: 'Development' },
        { value: 'testing', label: 'Testing' },
    ], []);

    const frequencyOptions = useMemo(() => [
        { value: 'always', label: 'Always' },
        { value: 'often', label: 'Often' },
        { value: 'sometimes', label: 'Sometimes' },
        { value: 'rarely', label: 'Rarely' },
    ], []);

    const assigneeOptions = useMemo(() => [
        { value: '', label: 'Unassigned' },
        { value: 'user1', label: 'User 1' },
        { value: 'user2', label: 'User 2' },
    ], []);

    const isAllSelected = selectedBugs.length === bugs.length && bugs.length > 0;

    if (loading) {
        return (
            <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
            <BulkActionsBar selectedBugs={selectedBugs} onBulkAction={onBulkAction} />
            <div className="relative overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 text-left border-r border-gray-200 w-12 sticky left-0 bg-gray-50 z-30 whitespace-nowrap">
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
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-48 sticky left-12 bg-gray-50 z-30 whitespace-nowrap"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Bug Title
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 sticky left-60 bg-gray-50 z-30 whitespace-nowrap"
                                onClick={() => handleSort('id')}
                            >
                                <div className="flex items-center gap-1">
                                    Bug ID
                                    {getSortIcon('id')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('severity')}
                            >
                                <div className="flex items-center gap-1">
                                    Severity
                                    {getSortIcon('severity')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('assignee')}
                            >
                                <div className="flex items-center gap-1">
                                    Assigned To
                                    {getSortIcon('assignee')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('environment')}
                            >
                                <div className="flex items-center gap-1">
                                    Environment
                                    {getSortIcon('environment')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('frequency')}
                            >
                                <div className="flex items-center gap-1">
                                    Frequency
                                    {getSortIcon('frequency')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('created_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Created Date
                                    {getSortIcon('created_at')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('due_date')}
                            >
                                <div className="flex items-center gap-1">
                                    Due Date
                                    {getSortIcon('due_date')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('reporter')}
                            >
                                <div className="flex items-center gap-1">
                                    Reporter
                                    {getSortIcon('reporter')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('evidence')}
                            >
                                <div className="flex items-center gap-1">
                                    Evidence
                                    {getSortIcon('evidence')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-48 whitespace-nowrap">
                                Test Cases
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedBugs.length === 0 ? (
                            <tr>
                                <td colSpan="15" className="px-6 py-12 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <Bug className="w-12 h-12 text-gray-300 mb-4" />
                                        <p>No bugs found</p>
                                        <p className="text-xs text-gray-400 mt-1">Create your first bug report to get started</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sortedBugs.map((bug) => {
                                const linkedTestCases = relationships?.bugToTestCases?.[bug.id] || [];
                                const isSelected = selectedBugs.includes(bug.id);

                                return (
                                    <tr key={bug.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-teal-50' : ''}`}>
                                        <td className="px-6 py-4 border-r border-gray-200 w-12 sticky left-0 bg-white z-30">
                                            <div className="flex items-center">
                                                {isSelected ? (
                                                    <CheckSquare
                                                        className="w-4 h-4 text-teal-600 cursor-pointer"
                                                        onClick={() => handleSelectItem(bug.id, false)}
                                                    />
                                                ) : (
                                                    <Square
                                                        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                                                        onClick={() => handleSelectItem(bug.id, true)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-48 sticky left-12 bg-white z-30">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                                    {bug.title || 'Untitled Bug'}
                                                </div>
                                                <div className="flex-shrink-0 border-l border-gray-200 pl-2">
                                                    <button
                                                        onClick={() => onView(bug)}
                                                        className="text-teal-600 hover:text-teal-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        title="View bug details"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32 sticky left-60 bg-white z-30">
                                            <div className="text-xs text-gray-400 truncate">
                                                #{bug.id?.slice(-8) || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <InlineEditCell
                                                value={bug.status}
                                                options={statusOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { status: value })}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(bug.status)}`}
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="flex items-center gap-2">
                                                {getSeverityIcon(bug.severity)}
                                                <InlineEditCell
                                                    value={bug.severity}
                                                    options={severityOptions}
                                                    onChange={(value) => handleUpdateBug(bug.id, {
                                                        severity: value,
                                                        priority: getDerivedPriority(value)
                                                    })}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(bug.severity)}`}
                                                    noSearch
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(bug.priority)}`}>
                                                {bug.priority || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <InlineEditCell
                                                value={bug.assignee}
                                                options={assigneeOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { assignee: value })}
                                                className="text-xs text-gray-600"
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <InlineEditCell
                                                value={bug.environment}
                                                options={environmentOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { environment: value })}
                                                className="text-xs text-gray-600"
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <InlineEditCell
                                                value={bug.frequency}
                                                options={frequencyOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { frequency: value })}
                                                className="text-xs text-gray-600"
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="text-xs text-gray-500 truncate">
                                                {bug.created_at && isValidDate(new Date(bug.created_at))
                                                    ? format(new Date(bug.created_at), 'MMM d, yyyy')
                                                    : 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="text-xs text-gray-500 truncate">
                                                {bug.due_date && isValidDate(new Date(bug.due_date))
                                                    ? format(new Date(bug.due_date), 'MMM d, yyyy')
                                                    : 'Not set'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="text-xs text-gray-600 truncate max-w-[120px]">
                                                {formatReporter(bug)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="text-xs text-gray-600 truncate max-w-[120px]">
                                                {String(formatEvidence(bug.evidence))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-48 relative">
                                            <div className="w-48">
                                                <MultiSelectDropdown
                                                    options={testCaseOptions}
                                                    value={linkedTestCases}
                                                    onChange={(newTestCases) => handleLinkTestCase(bug.id, newTestCases)}
                                                    placeholder="Link test cases..."
                                                    type="testCases"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="flex items-center text-xs text-gray-500 truncate">
                                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                                {bug.updated_at && isValidDate(new Date(bug.updated_at))
                                                    ? formatDistanceToNow(new Date(bug.updated_at), { addSuffix: true })
                                                    : 'Unknown'}
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