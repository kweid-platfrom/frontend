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
    User,
    Calendar,
    AlertCircle,
    Settings,
    ExternalLink,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import InlineEditCell from './InlineEditCell';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';

const BugList = ({
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
    const handleBulkAction = useCallback(async (actionId, selectedItems, actionConfig, selectedOption) => {
        setLoadingActions(prev => [...prev, actionId]);
        
        try {
            // Call the original onBulkAction
            await onBulkAction(actionId, selectedItems, actionConfig, selectedOption);
            
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
                console.error('Error in BugList handleUpdateBug:', error);

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
            open: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            resolved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            closed: 'bg-muted text-muted-foreground border-border',
            duplicate: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            'won\'t-fix': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
    }, []);

    const getSeverityBadge = useCallback((severity) => {
        const severityConfig = {
            critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            trivial: 'bg-muted text-muted-foreground border-border',
        };
        return severityConfig[severity?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
    }, []);

    const getPriorityBadge = useCallback((priority) => {
        const priorityConfig = {
            urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
        };
        return priorityConfig[priority?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
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
            trivial: 'bg-muted-foreground',
        };
        const color = severityColors[severity?.toLowerCase()] || 'bg-muted-foreground';
        return <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />;
    }, []);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-4 h-4 text-muted-foreground" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-foreground" />
        ) : (
            <ChevronDown className="w-4 h-4 text-foreground" />
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
            return evidence.length > 100 ? evidence.slice(0, 100) + '...' : evidence;
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
                    return result.length > 100 ? result.slice(0, 100) + '...' : result;
                }

                // If no standard properties, try to create a summary from all properties
                const allKeys = Object.keys(evidence);
                if (allKeys.length > 0) {
                    const summary = allKeys.map(key => {
                        const value = evidence[key];
                        if (typeof value === 'string' && value.length > 0) {
                            return `${key}: ${value.length > 30 ? value.slice(0, 30) + '...' : value}`;
                        }
                        return `${key}: ${String(value)}`;
                    }).join(' | ');

                    return summary.length > 100 ? summary.slice(0, 100) + '...' : summary;
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
            return stringValue.length > 100 ? stringValue.slice(0, 100) + '...' : stringValue;
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

    const sortOptions = useMemo(() => [
        { value: 'updated_at', label: 'Last Updated' },
        { value: 'created_at', label: 'Created Date' },
        { value: 'title', label: 'Title' },
        { value: 'status', label: 'Status' },
        { value: 'severity', label: 'Severity' },
        { value: 'priority', label: 'Priority' },
        { value: 'due_date', label: 'Due Date' },
    ], []);

    const isAllSelected = selectedBugs.length === bugs.length && bugs.length > 0;

    if (loading) {
        return (
            <div className="relative bg-card shadow-theme-sm rounded-lg border border-border">
                <div className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading bugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-card shadow-theme-sm rounded-lg border border-border">

            {/* Enhanced Bulk Actions Bar */}
            <EnhancedBulkActionsBar 
                selectedItems={selectedBugs}
                onClearSelection={() => onSelectBugs([])}
                assetType="bugs" // Uses predefined bug configuration
                pageTitle="bug"
                onAction={handleBulkAction}
                loadingActions={loadingActions}
            />
            
            {/* Header Controls */}
            <div className="px-6 py-4 border-b border-border bg-muted">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left side - Select all and count */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isAllSelected ? (
                                <CheckSquare
                                    className="w-4 h-4 text-primary cursor-pointer"
                                    onClick={() => handleSelectAll(false)}
                                />
                            ) : (
                                <Square
                                    className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                    onClick={() => handleSelectAll(true)}
                                />
                            )}
                            <span className="text-sm text-foreground">
                                {selectedBugs.length > 0 ? `${selectedBugs.length} selected` : 'Select all'}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {totalItems} {totalItems === 1 ? 'bug' : 'bugs'}
                        </div>
                    </div>

                    {/* Right side - Sort controls */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-foreground whitespace-nowrap">Sort by:</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => handleSort(e.target.value)}
                                className="border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                className="p-1.5 rounded hover:bg-accent border border-border"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                            >
                                {getSortIcon(sortConfig.key)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bug List */}
            <div className="divide-y divide-border">
                {paginatedBugs.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center">
                            <Bug className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <p>No bugs found</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Create your first bug report to get started</p>
                        </div>
                    </div>
                ) : (
                    paginatedBugs.map((bug) => {
                        const linkedTestCases = relationships?.bugToTestCases?.[bug.id] || [];
                        const isSelected = selectedBugs.includes(bug.id);

                        return (
                            <div key={bug.id} className={`p-6 hover:bg-accent transition-colors ${isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                                {/* Main content */}
                                <div className="flex items-start gap-4">
                                    {/* Checkbox and severity indicator */}
                                    <div className="flex items-center gap-3 pt-1">
                                        {isSelected ? (
                                            <CheckSquare
                                                className="w-4 h-4 text-primary cursor-pointer flex-shrink-0"
                                                onClick={() => handleSelectItem(bug.id, false)}
                                            />
                                        ) : (
                                            <Square
                                                className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary flex-shrink-0"
                                                onClick={() => handleSelectItem(bug.id, true)}
                                            />
                                        )}
                                        {getSeverityIndicator(bug.severity)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header - Title and ID */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-medium text-foreground mb-1 line-clamp-2">
                                                    {bug.title || 'Untitled Bug'}
                                                </h3>
                                                <div className="text-sm text-muted-foreground">
                                                    #{bug.id?.slice(-8) || 'Unknown'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onView(bug)}
                                                className="p-2 rounded-lg hover:bg-accent border border-border flex-shrink-0 transition-colors"
                                                title="View bug details"
                                            >
                                                <MessageSquare className="w-4 h-4 text-foreground" />
                                            </button>
                                        </div>

                                        {/* Status badges */}
                                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                                            <InlineEditCell
                                                value={bug.status}
                                                options={statusOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { status: value })}
                                                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge(bug.status)}`}
                                                noSearch
                                            />
                                            <InlineEditCell
                                                value={bug.severity}
                                                options={severityOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, {
                                                    severity: value,
                                                    priority: getDerivedPriority(value)
                                                })}
                                                className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getSeverityBadge(bug.severity)}`}
                                                noSearch
                                            />
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getPriorityBadge(bug.priority)}`}>
                                                {bug.priority || 'Medium'}
                                            </span>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                            {/* Assignee */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    <span>Assigned To</span>
                                                </div>
                                                <InlineEditCell
                                                    value={bug.assignee}
                                                    options={assigneeOptions}
                                                    onChange={(value) => handleUpdateBug(bug.id, { assignee: value })}
                                                    className="text-sm text-foreground"
                                                    noSearch
                                                />
                                            </div>

                                            {/* Environment */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Settings className="w-3 h-3" />
                                                    <span>Environment</span>
                                                </div>
                                                <InlineEditCell
                                                    value={bug.environment}
                                                    options={environmentOptions}
                                                    onChange={(value) => handleUpdateBug(bug.id, { environment: value })}
                                                    className="text-sm text-foreground"
                                                    noSearch
                                                />
                                            </div>

                                            {/* Frequency */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span>Frequency</span>
                                                </div>
                                                <InlineEditCell
                                                    value={bug.frequency}
                                                    options={frequencyOptions}
                                                    onChange={(value) => handleUpdateBug(bug.id, { frequency: value })}
                                                    className="text-sm text-foreground"
                                                    noSearch
                                                />
                                            </div>

                                            {/* Reporter */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    <span>Reporter</span>
                                                </div>
                                                <div className="text-sm text-foreground">
                                                    {formatReporter(bug)}
                                                </div>
                                            </div>

                                            {/* Created Date */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Created</span>
                                                </div>
                                                <div className="text-sm text-foreground">
                                                    {bug.due_date && isValidDate(new Date(bug.due_date))
                                                        ? format(new Date(bug.due_date), 'MMM d, yyyy')
                                                        : 'Not set'}
                                                </div>
                                            </div>

                                            {/* Last Updated */}
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Updated</span>
                                                </div>
                                                <div className="text-sm text-foreground">
                                                    {bug.updated_at && isValidDate(new Date(bug.updated_at))
                                                        ? formatDistanceToNow(new Date(bug.updated_at), { addSuffix: true })
                                                        : 'Unknown'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Evidence */}
                                        {bug.evidence && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>Evidence</span>
                                                </div>
                                                <div className="text-sm text-foreground bg-muted p-2 rounded border border-border">
                                                    {formatEvidence(bug.evidence)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Test Cases */}
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">Linked Test Cases</div>
                                            <div className="max-w-md">
                                                <MultiSelectDropdown
                                                    options={testCaseOptions}
                                                    value={linkedTestCases}
                                                    onChange={(newTestCases) => handleLinkTestCase(bug.id, newTestCases)}
                                                    placeholder="Link test cases..."
                                                    type="testCases"
                                                />
                                            </div>
                                                
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
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
        </div>
    );
};

export default BugList;