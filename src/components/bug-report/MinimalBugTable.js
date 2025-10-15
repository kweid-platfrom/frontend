'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bug,
    Clock,
    Code,
    Terminal,
    FileText,
} from 'lucide-react';
import InlineEditCell from './InlineEditCell';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';

const MinimalBugTable = ({
    bugs = [],
    loading,
    onBulkAction,
    onView,
    selectedBugs,
    onSelectBugs,
    onUpdateBug,
}) => {
    const { actions: { ui: { showNotification } } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    const [expandedLogs, setExpandedLogs] = useState(new Set());

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

    const toggleLogExpansion = useCallback((bugId) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bugId)) {
                newSet.delete(bugId);
            } else {
                newSet.add(bugId);
            }
            return newSet;
        });
    }, []);

    const sortedBugs = useMemo(() => {
        return [...bugs].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (['updated_at', 'created_at'].includes(sortConfig.key)) {
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

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    }, []);

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
                console.error('Error in MinimalBugTable handleUpdateBug:', error);

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
            closed: 'bg-muted text-muted-foreground border-border',
            duplicate: 'bg-purple-100 text-purple-800 border-purple-200',
            'won\'t-fix': 'bg-orange-100 text-orange-800 border-orange-200',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
    }, []);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-muted-foreground" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-card-foreground" />
        ) : (
            <ChevronDown className="w-3 h-3 text-card-foreground" />
        );
    }, [sortConfig]);

    const isValidDate = useCallback((date) => {
        return date instanceof Date && !isNaN(date.getTime());
    }, []);

    const formatConsoleLog = useCallback((log) => {
        if (!log) return 'No console log available';
        
        if (typeof log === 'string') {
            return log;
        }
        
        if (typeof log === 'object') {
            try {
                return JSON.stringify(log, null, 2);
            } catch {
                return String(log);
            }
        }
        
        return String(log);
    }, []);

    const getModuleInfo = useCallback((bug) => {
        return bug.module || bug.feature || bug.component || 'General';
    }, []);

    const statusOptions = useMemo(() => [
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
        { value: 'duplicate', label: 'Duplicate' },
        { value: 'won\'t-fix', label: 'Won\'t Fix' },
    ], []);

    const isAllSelected = selectedBugs.length === bugs.length && bugs.length > 0;

    if (loading) {
        return (
            <div className="relative bg-card shadow-theme-sm rounded-lg border border-border">
                <div className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading minimal bug reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-card shadow-theme-sm rounded-lg border border-border">
            <EnhancedBulkActionsBar
                selectedItems={selectedBugs}
                onClearSelection={() => onSelectBugs([])}
                assetType="bugs"
                pageTitle="bug"
                onAction={onBulkAction}
                loadingActions={[]}
            />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium text-card-foreground">Minimal Bug Reports</h3>
                    <span className="text-sm text-muted-foreground">
                        - Focused view for quick developer action
                    </span>
                </div>
            </div>

            <div className="relative overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 text-left border-r border-border w-12 sticky left-0 bg-muted z-30">
                                <div className="flex items-center">
                                    {isAllSelected ? (
                                        <CheckSquare
                                            className="w-4 h-4 text-teal-600 cursor-pointer"
                                            onClick={() => handleSelectAll(false)}
                                        />
                                    ) : (
                                        <Square
                                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-teal-600 transition-colors"
                                            onClick={() => handleSelectAll(true)}
                                        />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors border-r border-border w-32"
                                onClick={() => handleSort('module')}
                            >
                                <div className="flex items-center gap-1">
                                    Module/Feature
                                    {getSortIcon('module')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors border-r border-border"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Title & Description
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors border-r border-border w-32"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                                Console Log
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors w-32"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {paginatedBugs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-sm text-muted-foreground">
                                    <div className="flex flex-col items-center">
                                        <Bug className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p>No bugs found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Create your first bug report to get started</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedBugs.map((bug) => {
                                const isSelected = selectedBugs.includes(bug.id);
                                const isLogExpanded = expandedLogs.has(bug.id);
                                const consoleLog = formatConsoleLog(bug.console_log || bug.log || bug.error_log);

                                return (
                                    <tr key={bug.id} className={`hover:bg-accent transition-colors ${isSelected ? 'bg-teal-50' : ''}`}>
                                        <td className="px-6 py-4 border-r border-border w-12 sticky left-0 bg-card z-30">
                                            <div className="flex items-center">
                                                {isSelected ? (
                                                    <CheckSquare
                                                        className="w-4 h-4 text-teal-600 cursor-pointer"
                                                        onClick={() => handleSelectItem(bug.id, false)}
                                                    />
                                                ) : (
                                                    <Square
                                                        className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-teal-600 transition-colors"
                                                        onClick={() => handleSelectItem(bug.id, true)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-border w-32">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-card-foreground">
                                                    {getModuleInfo(bug)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-border">
                                            <div className="max-w-md">
                                                <div className="text-sm font-medium text-card-foreground mb-1">
                                                    {bug.title || 'Untitled Bug'}
                                                </div>
                                                <div className="text-xs text-muted-foreground line-clamp-2">
                                                    {bug.description || 'No description provided'}
                                                </div>
                                                <button
                                                    onClick={() => onView(bug)}
                                                    className="mt-2 text-xs text-teal-600 hover:text-teal-800 hover:underline transition-colors"
                                                >
                                                    View full details →
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-border w-32">
                                            <InlineEditCell
                                                value={bug.status}
                                                options={statusOptions}
                                                onChange={(value) => handleUpdateBug(bug.id, { status: value })}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(bug.status)}`}
                                                noSearch
                                            />
                                        </td>
                                        <td className="px-6 py-4 border-r border-border">
                                            <div className="max-w-lg">
                                                <div className="flex items-start gap-2">
                                                    <Code className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-xs font-mono bg-gray-900 text-green-400 p-3 rounded border border-gray-700 ${isLogExpanded ? '' : 'max-h-20 overflow-hidden'}`}>
                                                            <pre className="whitespace-pre-wrap break-words">
                                                                {consoleLog}
                                                            </pre>
                                                        </div>
                                                        {consoleLog.length > 200 && (
                                                            <button
                                                                onClick={() => toggleLogExpansion(bug.id)}
                                                                className="mt-2 text-xs text-teal-600 hover:text-teal-800 hover:underline transition-colors"
                                                            >
                                                                {isLogExpanded ? 'Show less' : 'Show more'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-32">
                                            <div className="flex items-center text-xs text-muted-foreground">
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

export default MinimalBugTable;