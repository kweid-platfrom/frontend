'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bug,
    Clock,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import InlineEditCell from './InlineEditCell';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';

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
        setCurrentPage(1); // Reset to first page when sorting
    }, []);

    // Enhanced bulk action handler with loading states
    const handleBulkAction = useCallback(async (actionId, selectedItems) => {
        setLoadingActions(prev => [...prev, actionId]);
        
        try {
            // Call the original onBulkAction
            await onBulkAction(actionId, selectedItems);
            
            // Show success notification based on action
            const itemCount = selectedItems.length;
            const itemLabel = itemCount === 1 ? 'bug' : 'bugs';
            
            let successMessage = '';
            switch (actionId) {
                case 'resolve':
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

    // Pagination calculations
    const totalItems = sortedBugs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBugs = sortedBugs.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    // Generate page numbers for pagination
    const getPageNumbers = useMemo(() => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    const handleLinkTestCase = useCallback((bugId, testCaseIds) => {
        if (onLinkTestCase) {
            onLinkTestCase(bugId, testCaseIds);
        }
    }, [onLinkTestCase]);

    const handleUpdateBug = useCallback(async (bugId, updates) => {
        if (typeof onUpdateBug === 'function') {
            try {
                const result = await onUpdateBug(bugId, updates);

                if (result && !result.success) {
                    console.warn('Update failed:', result.error?.message || 'Unknown error');
                    return result;
                }

                return result;
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

    // Fixed severity indicator with consistent sizing
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
        // Handle null, undefined, or empty values
        if (!evidence) return 'None';

        // Handle string values
        if (typeof evidence === 'string') {
            return evidence.length > 50 ? evidence.slice(0, 50) + '...' : evidence;
        }

        // Handle array values
        if (Array.isArray(evidence)) {
            return evidence.length ? `${evidence.length} item(s)` : 'None';
        }

        // Handle object values (this is the critical part for AI-generated bugs)
        if (typeof evidence === 'object' && evidence !== null) {
            try {
                const parts = [];

                // Check for common evidence properties
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
                        // If URL parsing fails, just use the raw URL
                        parts.push(`URL: ${evidence.url}`);
                    }
                }

                // If we found standard properties, format them nicely
                if (parts.length > 0) {
                    const result = parts.join(' | ');
                    return result.length > 50 ? result.slice(0, 50) + '...' : result;
                }

                // If no standard properties, try to create a summary from all properties
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

                // Fallback if object exists but has no meaningful properties
                return 'Evidence data';

            } catch (error) {
                console.error('Error formatting evidence object:', error);
                return 'Evidence data (format error)';
            }
        }

        // Handle any other data types by converting to string safely
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
                    <div className="inline-block animate-spin rounded h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white shadow-sm rounded-lg border border-gray-200">
            {/* Enhanced Bulk Actions Bar */}
            <EnhancedBulkActionsBar 
                selectedItems={selectedBugs}
                onClearSelection={() => onSelectBugs([])}
                assetType="bugs" // Uses predefined bug configuration
                pageTitle="bug"
                onAction={handleBulkAction}
                loadingActions={loadingActions}
            />
            
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
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32 whitespace-nowrap"
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
                        {paginatedBugs.length === 0 ? (
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
                                                <div className="flex-1 text-sm font-medium text-gray-900 truncate max-w-[320px]">
                                                    {bug.title || 'Untitled Bug'}
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
                                            <div className="text-xs text-gray-600 truncate max-w-[120px]" title={formatEvidence(bug.evidence)}>
                                                {formatEvidence(bug.evidence)}
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
                                        <td className="px-6 py-4 w-32">
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

            {/* Pagination Component */}
            {!loading && totalItems > 0 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
                    {/* Left side - Results info and items per page */}
                    <div className="flex items-center gap-6">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{startIndex + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                            <span className="font-medium">{totalItems}</span> results
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="itemsPerPage" className="text-sm text-gray-600 whitespace-nowrap">
                                Rows per page:
                            </label>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="border border-gray-300 rounded pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1.25em 1.25em'
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Right side - Pagination controls */}
                    <div className="flex items-center gap-3">
                        {/* First page button */}
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            title="First page"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>

                        {/* Previous page button */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            title="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-2">
                            {getPageNumbers.map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`w-9 h-9 flex items-center justify-center rounded border text-sm font-medium transition-all duration-200 ${currentPage === pageNumber
                                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900'
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                        </div>

                        {/* Show ellipsis and last page if needed */}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                                {currentPage < totalPages - 3 && (
                                    <span className="px-2 text-gray-500 text-sm">...</span>
                                )}
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    className="w-9 h-9 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 text-sm font-medium transition-all duration-200"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}

                        {/* Next page button */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === totalPages
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            title="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>

                        {/* Last page button */}
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`w-9 h-9 flex items-center justify-center rounded border transition-colors ${currentPage === totalPages
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                            title="Last page"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugTable;