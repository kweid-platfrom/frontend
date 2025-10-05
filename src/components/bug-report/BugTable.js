'use client';

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bug,
    MessageSquare,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import InlineEditCell from './InlineEditCell';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';

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
    const [loadingActions, setLoadingActions] = useState([]);
    const [hoveredTitle, setHoveredTitle] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
        setCurrentPage(1);
    }, []);

    // Enhanced bulk action handler with bulk updates for selected bugs
    const handleBulkAction = useCallback(async (actionId, selectedIds, actionConfig, selectedOption) => {
        setLoadingActions(prev => [...prev, actionId]);
        
        try {
            await onBulkAction(actionId, selectedIds, actionConfig, selectedOption);
            
            const itemCount = selectedIds.length;
            const itemLabel = itemCount === 1 ? 'bug' : 'bugs';
            
            let successMessage = '';
            switch (actionId) {
                case 'resolve':
                case 'Resolved':
                    successMessage = `Successfully resolved ${itemCount} ${itemLabel}`;
                    break;
                case 'close':
                    successMessage = `Successfully closed ${itemCount} ${itemLabel}`;
                    break;
                case 'open':
                    successMessage = `Successfully reopened ${itemCount} ${itemLabel}`;
                    break;
                case 'assign':
                    successMessage = `Successfully assigned ${itemCount} ${itemLabel}`;
                    break;
                case 'priority':
                    successMessage = `Successfully updated priority for ${itemCount} ${itemLabel}`;
                    break;
                case 'severity':
                    successMessage = `Successfully updated severity for ${itemCount} ${itemLabel}`;
                    break;
                case 'add-to-sprint':
                    successMessage = `Successfully added ${itemCount} ${itemLabel} to sprint`;
                    break;
                case 'tag':
                    successMessage = `Successfully tagged ${itemCount} ${itemLabel}`;
                    break;
                case 'group':
                    successMessage = `Successfully grouped ${itemCount} ${itemLabel}`;
                    break;
                case 'archive':
                    successMessage = `Successfully archived ${itemCount} ${itemLabel}`;
                    break;
                case 'delete':
                    successMessage = `Successfully deleted ${itemCount} ${itemLabel}`;
                    break;
                default:
                    successMessage = `Successfully processed ${itemCount} ${itemLabel}`;
            }
            
            showNotification({
                type: 'success',
                title: 'Bulk Action Complete',
                message: successMessage,
                duration: 3000,
            });
            
        } catch (error) {
            console.error('Bulk action failed:', error);
            showNotification({
                type: 'error',
                title: 'Bulk Action Failed',
                message: error.message || `Failed to ${actionId} selected bugs. Please try again.`,
                duration: 5000,
            });
        } finally {
            setLoadingActions(prev => prev.filter(id => id !== actionId));
        }
    }, [onBulkAction, showNotification]);

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

    const totalItems = sortedBugs.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBugs = sortedBugs.slice(startIndex, endIndex);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    }, []);

    const handleLinkTestCase = useCallback((bugId, testCaseIds) => {
        if (onLinkTestCase) {
            onLinkTestCase(bugId, testCaseIds);
        }
    }, [onLinkTestCase]);

    // Bulk update handler for inline edits on selected bugs
    const handleUpdateBug = useCallback(async (bugId, updates) => {
        if (typeof onUpdateBug === 'function') {
            try {
                // If multiple bugs are selected and this bug is one of them, update all selected bugs
                if (selectedBugs.length > 1 && selectedBugs.includes(bugId)) {
                    const updatePromises = selectedBugs.map(id => onUpdateBug(id, updates));
                    await Promise.all(updatePromises);
                    
                    showNotification({
                        type: 'success',
                        title: 'Bulk Update Complete',
                        message: `Successfully updated ${selectedBugs.length} bugs`,
                        duration: 3000,
                    });
                } else {
                    const result = await onUpdateBug(bugId, updates);

                    if (result && !result.success) {
                        console.warn('Update failed:', result.error?.message || 'Unknown error');
                        return result;
                    }
                }

                return { success: true };
            } catch (error) {
                console.error('Error in BugTable handleUpdateBug:', error);

                showNotification({
                    type: 'error',
                    title: 'Update Failed',
                    message: error.message || 'Failed to update bug. Please try again.',
                });

                return { success: false, error: { message: error.message } };
            }
        } else {
            console.warn('onUpdateBug is not a function', { bugId, updates });
            showNotification({
                type: 'error',
                title: 'Configuration Error',
                message: 'Update function not available. Please refresh the page.',
                persistent: true,
            });
            return { success: false, error: { message: 'Update function not available' } };
        }
    }, [onUpdateBug, selectedBugs, showNotification]);

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

    const getSeverityIndicator = useCallback((severity) => {
        const severityColors = {
            critical: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-blue-500',
            trivial: 'bg-gray-400',
        };
        const color = severityColors[severity?.toLowerCase()] || 'bg-gray-400';
        return <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />;
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
                    return result.length > 50 ? result.slice(0, 50) + '...' : result;
                }

                const allKeys = Object.keys(evidence);
                if (allKeys.length > 0) {
                    const summary = allKeys.map(key => {
                        const value = evidence[key];
                        if (typeof value === 'string' && value.length > 0) {
                            return `${key}: ${value.length > 20 ? value.slice(0, 20) + '...' : value}`;
                        }
                        return `${key}: ${String(value)}`;
                    }).join(' | ');

                    return summary.length > 50 ? summary.slice(0, 50) + '...' : summary;
                }

                return 'Evidence data';

            } catch (error) {
                console.error('Error formatting evidence object:', error);
                return 'Evidence data (format error)';
            }
        }

        try {
            const stringValue = String(evidence);
            return stringValue.length > 50 ? stringValue.slice(0, 50) + '...' : stringValue;
        } catch (error) {
            console.error('Error converting evidence to string:', error);
            return 'Invalid evidence';
        }
    }, []);

    const formatReporter = useCallback((bug) => {
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
                    <div className="inline-block animate-spin rounded h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
            <EnhancedBulkActionsBar 
                selectedItems={selectedBugs}
                onClearSelection={() => onSelectBugs([])}
                assetType="bugs"
                pageTitle="bug"
                onAction={handleBulkAction}
                loadingActions={loadingActions}
            />
            
            <div className="relative overflow-x-auto">
                {/* Desktop Table */}
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-96 sticky left-12 bg-gray-50 z-30 whitespace-nowrap">
                                Title
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32 whitespace-nowrap"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">
                                Test Cases
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedBugs.length === 0 ? (
                            <tr>
                                <td colSpan="12" className="px-6 py-12 text-center text-sm text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <Bug className="w-12 h-12 text-gray-300 mb-4" />
                                        <p>No bugs found</p>
                                        <p className="text-xs text-gray-400 mt-1">Create your first bug report to get started</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedBugs.map((bug) => {
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
                                        <td className="px-6 py-4 border-r border-gray-200 w-96 sticky left-12 bg-white z-30">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="flex-1 text-sm font-medium text-gray-900 truncate max-w-[320px] relative"
                                                    onMouseEnter={() => setHoveredTitle(bug.id)}
                                                    onMouseLeave={() => setHoveredTitle(null)}
                                                >
                                                    {bug.title || 'Untitled Bug'}
                                                    {hoveredTitle === bug.id && bug.title && bug.title.length > 40 && (
                                                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-xs z-50 whitespace-normal">
                                                            {bug.title}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 border-l border-gray-200 pl-2">
                                                    <button
                                                        onClick={() => onView(bug)}
                                                        className="ml-1 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        title="View bug details"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="text-xs text-gray-400 truncate">
                                                #{bug.id?.slice(-8) || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <InlineEditCell
                                                value={bug.status}
                                                options={statusOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { status: value })}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(bug.status)}`}
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 flex justify-center">
                                                    {getSeverityIndicator(bug.severity)}
                                                </div>
                                                <InlineEditCell
                                                    value={bug.severity}
                                                    options={severityOptions}
                                                    onChange={(value) => handleUpdateBug(bug.id, {
                                                        severity: value,
                                                        priority: getDerivedPriority(value)
                                                    })}
                                                    className={`inline-flex items-center rounded text-xs font-medium border ${getSeverityBadge(bug.severity)}`}
                                                    noSearch
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-200 w-32">
                                            <span className={`inline-flex items-center w-16 px-2.5 py-1.5 rounded text-xs font-medium border ${getPriorityBadge(bug.priority)}`}>
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
                                            <div className="text-xs text-gray-600 truncate max-w-[120px]" title={formatEvidence(bug.evidence)}>
                                                {formatEvidence(bug.evidence)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-48 relative">
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
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Mobile Table - Only Checkbox, Title, and Chat Icon */}
                <div className="md:hidden">
                    {paginatedBugs.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center">
                                <Bug className="w-12 h-12 text-gray-300 mb-4" />
                                <p>No bugs found</p>
                                <p className="text-xs text-gray-400 mt-1">Create your first bug report to get started</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {paginatedBugs.map((bug) => {
                                const isSelected = selectedBugs.includes(bug.id);
                                return (
                                    <div 
                                        key={bug.id} 
                                        className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-teal-50' : 'bg-white'} hover:bg-gray-50`}
                                    >
                                        {/* Checkbox */}
                                        <div className="flex-shrink-0">
                                            {isSelected ? (
                                                <CheckSquare
                                                    className="w-5 h-5 text-teal-600 cursor-pointer"
                                                    onClick={() => handleSelectItem(bug.id, false)}
                                                />
                                            ) : (
                                                <Square
                                                    className="w-5 h-5 text-gray-400 cursor-pointer hover:text-teal-600"
                                                    onClick={() => handleSelectItem(bug.id, true)}
                                                />
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {bug.title || 'Untitled Bug'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(bug.status)}`}>
                                                    {bug.status || 'open'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    #{bug.id?.slice(-6) || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chat Icon */}
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => onView(bug)}
                                                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                title="View bug details"
                                            >
                                                <MessageSquare className="w-5 h-5 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            )}
        </div>
    );
};

export default BugTable;