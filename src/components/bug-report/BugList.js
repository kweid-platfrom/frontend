'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
    CheckSquare,
    Square,
    Bug,
    Clock,
    MessageSquare,
    Edit3,
    Copy,
    Trash2,
    Link,
    AlertTriangle,
    User,
    Calendar,
    Tag,
    ChevronDown,
    ChevronUp,
    Filter,
    SortAsc,
    SortDesc,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import InlineEditCell from './InlineEditCell';
import BulkActionsBar from './BulkActionsBar';

const BugList = ({
    bugs = [],
    testCases = [],
    relationships = { bugToTestCases: {} },
    loading,
    onBulkAction,
    onView,
    selectedBugs,
    onSelectBugs,
    onEdit,
    onDelete,
    onDuplicate,
    onLinkTestCase,
    onUpdateBug,
}) => {
    const [expandedBugs, setExpandedBugs] = useState(new Set());
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

    const handleToggleExpand = useCallback((bugId) => {
        setExpandedBugs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(bugId)) {
                newSet.delete(bugId);
            } else {
                newSet.add(bugId);
            }
            return newSet;
        });
    }, []);

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

    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            open: 'bg-red-100 text-red-800 border-red-200',
            'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            resolved: 'bg-green-100 text-green-800 border-green-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200',
            duplicate: 'bg-purple-100 text-purple-800 border-purple-200',
            "won't-fix": 'bg-orange-100 text-orange-800 border-orange-200',
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

    const getSeverityIndicator = useCallback((severity) => {
        const severityColors = {
            critical: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-blue-500',
            trivial: 'bg-gray-400',
        };
        const color = severityColors[severity?.toLowerCase()] || 'bg-gray-400';
        return <div className={`w-3 h-3 rounded-full ${color}`} />;
    }, []);

    const formatEvidence = useCallback((evidence) => {
        if (!evidence) return 'None';

        if (typeof evidence === 'string') {
            return evidence.length > 100 ? evidence.slice(0, 100) + '...' : evidence;
        }

        if (Array.isArray(evidence)) {
            return evidence.length ? `${evidence.length} item(s)` : 'None';
        }

        if (typeof evidence === 'object' && evidence !== null) {
            try {
                const parts = [];
                if (evidence.browser) parts.push(`Browser: ${evidence.browser}`);
                if (evidence.browserVersion || evidence.version) {
                    parts.push(`Version: ${evidence.browserVersion || evidence.version}`);
                }
                if (evidence.os) parts.push(`OS: ${evidence.os}`);
                if (evidence.device) parts.push(`Device: ${evidence.device}`);
                if (evidence.url) {
                    try {
                        const hostname = new URL(evidence.url).hostname;
                        parts.push(`URL: ${hostname}`);
                    } catch {
                        parts.push(`URL: ${evidence.url}`);
                    }
                }

                if (parts.length > 0) {
                    const result = parts.join(' | ');
                    return result.length > 100 ? result.slice(0, 100) + '...' : result;
                }

                const allKeys = Object.keys(evidence);
                if (allKeys.length > 0) {
                    const summary = allKeys.map((key) => {
                        const value = evidence[key];
                        if (typeof value === 'string' && value.length > 0) {
                            return `${key}: ${value.length > 30 ? value.slice(0, 30) + '...' : value}`;
                        }
                        return `${key}: ${String(value)}`;
                    }).join(' | ');

                    return summary.length > 100 ? summary.slice(0, 100) + '...' : summary;
                }

                return 'Evidence data';
            } catch (error) {
                console.error('Error formatting evidence object:', error);
                return 'Evidence data (format error)';
            }
        }

        try {
            const stringValue = String(evidence);
            return stringValue.length > 100 ? stringValue.slice(0, 100) + '...' : stringValue;
        } catch (error) {
            console.error('Error converting evidence to string:', error);
            return 'Invalid evidence';
        }
    }, []);

    const formatReporter = useCallback((bug) => {
        return (
            bug.reportedBy ||
            bug.reportedByName ||
            bug.reporter ||
            bug.created_by_name ||
            bug.updatedByName ||
            'Unknown'
        );
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
        { value: "won't-fix", label: "Won't Fix" },
    ], []);

    const severityOptions = useMemo(() => [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
        { value: 'trivial', label: 'Trivial' },
    ], []);

    const assigneeOptions = useMemo(() => [
        { value: '', label: 'Unassigned' },
        { value: 'user1', label: 'User 1' },
        { value: 'user2', label: 'User 2' },
    ], []);

    const isAllSelected = selectedBugs.length === bugs.length && bugs.length > 0;

    const handleLinkTestCase = useCallback(
        (bugId, testCaseIds) => {
            if (onLinkTestCase) {
                onLinkTestCase(bugId, testCaseIds);
            }
        },
        [onLinkTestCase]
    );

    const handleUpdateBug = useCallback(
        async (bugId, updates) => {
            if (typeof onUpdateBug === 'function') {
                try {
                    const result = await onUpdateBug(bugId, updates);
                    return result;
                } catch (error) {
                    console.error('Error in BugList handleUpdateBug:', error);
                    return { success: false, error: { message: error.message } };
                }
            } else {
                console.warn('onUpdateBug is not a function', { bugId, updates });
                return { success: false, error: { message: 'Update function not available' } };
            }
        },
        [onUpdateBug]
    );

    const isValidDate = useCallback((date) => {
        return date instanceof Date && !isNaN(date.getTime());
    }, []);

    if (loading) {
        return (
            <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
            <BulkActionsBar selectedBugs={selectedBugs} onBulkAction={onBulkAction} />

            {/* Sort Controls */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                        <span className="ml-2 text-sm text-gray-600">
                            {selectedBugs.length > 0 ? `${selectedBugs.length} selected` : 'Select all'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <select
                        value={sortConfig.key}
                        onChange={(e) => handleSort(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="updated_at">Last Updated</option>
                        <option value="created_at">Created Date</option>
                        <option value="title">Title</option>
                        <option value="status">Status</option>
                        <option value="severity">Severity</option>
                        <option value="priority">Priority</option>
                        <option value="due_date">Due Date</option>
                    </select>
                    <button
                        onClick={() => setSortConfig((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                    >
                        {sortConfig.direction === 'asc' ? (
                            <SortAsc className="w-4 h-4" />
                        ) : (
                            <SortDesc className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {sortedBugs.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Bug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No bugs found</p>
                        <p className="text-xs text-gray-400 mt-1">Create your first bug report to get started</p>
                    </div>
                ) : (
                    sortedBugs.map((bug) => {
                        const linkedTestCases = relationships?.bugToTestCases?.[bug.id] || [];
                        const isSelected = selectedBugs.includes(bug.id);
                        const isExpanded = expandedBugs.has(bug.id);

                        return (
                            <div
                                key={bug.id}
                                className={`p-6 hover:bg-gray-50 transition-colors ${
                                    isSelected ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                                }`}
                            >
                                {/* Bug Header */}
                                <div className="flex items-start gap-4">
                                    {/* Selection Checkbox */}
                                    <div className="flex items-center pt-1">
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

                                    {/* Severity Indicator */}
                                    <div className="flex items-center pt-1">{getSeverityIndicator(bug.severity)}</div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Title and ID */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {bug.title || 'Untitled Bug'}
                                            </h3>
                                            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                                #{bug.id?.slice(-8) || 'Unknown'}
                                            </span>
                                        </div>

                                        {/* Status and Priority Badges */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <InlineEditCell
                                                value={bug.status}
                                                options={statusOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { status: value })}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                                                    bug.status
                                                )}`}
                                                noSearch
                                            />
                                            <InlineEditCell
                                                value={bug.severity}
                                                options={severityOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { severity: value })}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(
                                                    bug.severity
                                                )}`}
                                                noSearch
                                            />
                                            {bug.priority && (
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(
                                                        bug.priority
                                                    )}`}
                                                >
                                                    {bug.priority}
                                                </span>
                                            )}
                                            {bug.tags && bug.tags.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3 text-gray-400" />
                                                    {bug.tags.slice(0, 3).map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {bug.tags.length > 3 && (
                                                        <span className="text-xs text-gray-500">
                                                            +{bug.tags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {bug.description && (
                                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{bug.description}</p>
                                        )}

                                        {/* Meta Information */}
                                        <div className="flex items-center gap-6 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                <span>Reporter: {formatReporter(bug)}</span>
                                            </div>
                                            {bug.assignee && (
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    <span>Assigned to: {bug.assignee}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    Created:{' '}
                                                    {bug.created_at && isValidDate(new Date(bug.created_at))
                                                        ? format(new Date(bug.created_at), 'MMM d, yyyy')
                                                        : 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    Updated:{' '}
                                                    {bug.updated_at && isValidDate(new Date(bug.updated_at))
                                                        ? formatDistanceToNow(new Date(bug.updated_at), {
                                                              addSuffix: true,
                                                          })
                                                        : 'Unknown'}
                                                </span>
                                            </div>
                                            {bug.due_date && isValidDate(new Date(bug.due_date)) && (
                                                <div className="flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Due: {format(new Date(bug.due_date), 'MMM d, yyyy')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-start gap-2 pt-1">
                                        <button
                                            onClick={() => onView(bug)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="View details"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(bug)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                            title="Edit bug"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDuplicate(bug)}
                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                            title="Duplicate bug"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(bug.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete bug"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleExpand(bug.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="mt-4 pl-8 border-l-2 border-gray-200 space-y-4">
                                    {/* Steps to Reproduce */}
                                    {bug.steps_to_reproduce && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Steps to Reproduce:</h4>
                                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                                {bug.steps_to_reproduce.split('\n').map((step, index) => (
                                                    <div key={index} className="mb-1">
                                                        {step.trim() && (
                                                            <>
                                                                <span className="font-medium text-gray-600">{index + 1}.</span>{' '}
                                                                {step.trim()}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expected vs Actual Results */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {bug.expected_result && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Result:</h4>
                                                <p className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                                                    {bug.expected_result}
                                                </p>
                                            </div>
                                        )}
                                        {bug.actual_result && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Actual Result:</h4>
                                                <p className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                                                    {bug.actual_result}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Evidence */}
                                    {bug.evidence && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Evidence:</h4>
                                            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                                                {formatEvidence(bug.evidence)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Environment and Frequency */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Environment:</h4>
                                            <p className="text-sm text-gray-700">{bug.environment || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Frequency:</h4>
                                            <p className="text-sm text-gray-700">{bug.frequency || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Assignee:</h4>
                                            <InlineEditCell
                                                value={bug.assignee}
                                                options={assigneeOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { assignee: value })}
                                                className="text-sm text-gray-700"
                                                placeholder="Unassigned"
                                                noSearch
                                            />
                                        </div>
                                    </div>

                                    {/* Test Cases Linking */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                                            <Link className="w-4 h-4" />
                                            Linked Test Cases:
                                        </h4>
                                        <div className="w-full max-w-md">
                                            <MultiSelectDropdown
                                                options={testCaseOptions}
                                                value={linkedTestCases}
                                                onChange={(newTestCases) => handleLinkTestCase(bug.id, newTestCases)}
                                                placeholder="Link test cases..."
                                                type="testCases"
                                            />
                                        </div>
                                        {linkedTestCases.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {linkedTestCases.map((tcId) => {
                                                    const testCase = testCases.find((tc) => tc.id === tcId);
                                                    return (
                                                        <span
                                                            key={tcId}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {testCase?.title || `TC-${tcId.slice(-6)}`}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Notes */}
                                    {bug.notes && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes:</h4>
                                            <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                                                {bug.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default BugList;