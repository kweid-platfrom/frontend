'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import PageLayout from '@/components/layout/PageLayout';
import BugTracker from '@/components/BugTracker';
import { FileText, Download, Filter, List, Table, Calendar, User, Flag, AlertTriangle, Clock } from 'lucide-react';
import BugReportButton from '@/components/modals/BugReportButton';
import { useBugTracker } from '@/hooks/useBugTracker';
import { BugAntIcon } from "@heroicons/react/24/outline";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export default function BugTrackerPage() {
    const { addNotification, user, userCapabilities, isAuthenticated, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const router = useRouter();
    const { bugs, filteredBugs, setFilters, exportBugs, updateBugStatus, updateBugSeverity, updateBugPriority, updateBugAssignment, updateBugEnvironment, deleteBugs } = useBugTracker({
        enabled: isAuthenticated && !!activeSuite?.suite_id && !!user?.uid && !appLoading && !suiteLoading,
        suite: activeSuite,
        user
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [groupBy, setGroupBy] = useState('none');
    const [subGroupBy, setSubGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('table');
    const [selectedBugs, setSelectedBugs] = useState([]);

    const groupingOptions = [
        { value: 'none', label: 'No Grouping', icon: List },
        { value: 'status', label: 'Status', icon: Clock },
        { value: 'severity', label: 'Severity', icon: AlertTriangle },
        { value: 'assignee', label: 'Assignee', icon: User },
        { value: 'sprint', label: 'Sprint', icon: Flag },
        { value: 'month', label: 'Month', icon: Calendar }
    ];

    const subGroupingOptions = [
        { value: 'none', label: 'No Sub-grouping' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' }
    ];

    const toggleBugSelection = useCallback((id, checked) => {
        if (!userCapabilities.canViewBugs) {
            toast.error("You don't have permission to select bugs");
            return;
        }
        setSelectedBugs(prev => {
            const newSelection = checked
                ? [...new Set([...prev, id])]
                : prev.filter(selectedId => selectedId !== id);
            console.log('BugTrackerPage toggleBugSelection:', { id, checked, newSelection });
            toast.info(`${newSelection.length} bug${newSelection.length > 1 ? 's' : ''} selected`);
            return newSelection;
        });
    }, [userCapabilities]);

    const handleBulkAction = useCallback(async (action, ids) => {
        if (!userCapabilities.canUpdateBugs && action !== 'delete') {
            toast.error("You don't have permission to update bugs");
            return;
        }
        if (!userCapabilities.canDeleteBugs && action === 'delete') {
            toast.error("You don't have permission to delete bugs");
            return;
        }
        if (!ids || ids.length === 0) {
            toast.error("No bugs selected");
            return;
        }
        try {
            if (action === 'delete') {
                if (!window.confirm(`Are you sure you want to delete ${ids.length} bug${ids.length > 1 ? 's' : ''}?`)) {
                    return;
                }
                await deleteBugs(activeSuite.suite_id, ids);
            } else {
                await Promise.all(ids.map(id => updateBugStatus(id, action === 'reopen' ? 'open' : 'closed')));
            }
            setSelectedBugs([]);
            addNotification({
                type: 'success',
                title: 'Success',
                message: `${ids.length} bug${ids.length > 1 ? 's' : ''} ${action}d successfully`
            });
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to ${action} bugs: ${error.message}`
            });
        }
    }, [userCapabilities, activeSuite, updateBugStatus, deleteBugs, addNotification]);

    if (appLoading || suiteLoading) {
        return null;
    }

    if (!isAuthenticated || !user || !activeSuite) {
        addNotification({
            type: 'error',
            title: 'Access Denied',
            message: 'Please log in and select a test suite to access the bug tracker.'
        });
        router.push('/login');
        return null;
    }

    if (!userCapabilities.canViewBugs) {
        addNotification({
            type: 'error',
            title: 'Subscription Required',
            message: 'Your subscription does not allow access to the bug tracker. Please upgrade your plan.'
        });
        router.push('/pricing');
        return null;
    }

    const handleExportBugs = async () => {
        try {
            await exportBugs();
            addNotification({
                type: 'success',
                title: 'Bugs Exported',
                message: 'Bugs exported successfully'
            });
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Export Failed',
                message: `Failed to export bugs: ${error.message}`
            });
        }
    };

    const handleGenerateReport = () => {
        addNotification({
            type: 'info',
            title: 'Report Generation',
            message: 'Report generation is not yet implemented'
        });
    };

    const clearFilters = () => {
        setFilters({});
        addNotification({
            type: 'success',
            title: 'Filters Cleared',
            message: 'All filters have been reset'
        });
    };

    return (
        <PageLayout requiresTestSuite={true}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <BugAntIcon className="h-6 w-6 mr-2" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bug Tracker</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {bugs.length} {bugs.length === 1 ? 'bug' : 'bugs'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                            onClick={handleExportBugs}
                            disabled={!userCapabilities.canUpdateBugs}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                            onClick={handleGenerateReport}
                            disabled={!userCapabilities.canUpdateBugs}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Generate Report</span>
                        </button>
                        <BugReportButton />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Group by:</span>
                                <select
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-0"
                                >
                                    {groupingOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {(groupBy === 'sprint' || groupBy === 'month') && (
                                    <select
                                        value={subGroupBy}
                                        onChange={(e) => setSubGroupBy(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent min-w-0"
                                    >
                                        {subGroupingOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex items-center border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center px-3 py-2 text-sm transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <List className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">List</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center px-3 py-2 text-sm transition-colors border-l ${
                                        viewMode === 'table'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Table className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Table</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
                            >
                                Clear filters
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-3 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                                    showFilters
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </button>
                        </div>
                    </div>
                </div>
                <BugTracker
                    bugs={bugs || []}
                    filteredBugs={filteredBugs || []}
                    selectedBugs={selectedBugs}
                    onToggleSelection={toggleBugSelection}
                    onBulkAction={handleBulkAction}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    showMetrics={showMetrics}
                    setShowMetrics={setShowMetrics}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    subGroupBy={subGroupBy}
                    setSubGroupBy={setSubGroupBy}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onUpdateBugStatus={updateBugStatus}
                    onUpdateBugSeverity={updateBugSeverity}
                    onUpdateBugPriority={updateBugPriority}
                    onUpdateBugAssignment={updateBugAssignment}
                    onUpdateBugEnvironment={updateBugEnvironment}
                />
            </div>
        </PageLayout>
    );
}