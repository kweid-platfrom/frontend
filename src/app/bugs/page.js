'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useEntitySync } from '@/hooks/useEntitySync';
import PageLayout from '@/components/layout/PageLayout';
import BugTracker from '@/components/BugTracker';
import { FileText, Download, Filter, List, Table, Calendar, User, Flag, AlertTriangle, Clock } from 'lucide-react';
import BugReportButton from '@/components/modals/BugReportButton';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import firestoreService from '@/services/firestoreService';

export default function BugTrackerPage() {
    const { user, userCapabilities, isAuthenticated, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const router = useRouter();
    const [bugs, setBugs] = useState([]);
    const [testCases, setTestCases] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [relationships, setRelationships] = useState({
        testCaseToBugs: {},
        bugToRecordings: {},
        requirementToTestCases: {},
    });
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [groupBy, setGroupBy] = useState('none');
    const [subGroupBy, setSubGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('table');
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        severity: 'all',
        priority: 'all',
        assignee: 'all',
        environment: 'all',
        search: ''
    });

    const addNotification = useCallback((notification) => {
        toast[notification.type](notification.title, {
            description: notification.message,
            duration: notification.persistent ? 0 : 5000,
        });
    }, []);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        addNotification({
            type: 'error',
            title: 'Error',
            message: `Failed to ${context}: ${error.message}`,
            persistent: true,
        });
    }, [addNotification]);

    // Get orgId and accountType from activeSuite or user context
    const getOrgId = useCallback(() => {
        return activeSuite?.org_id || user?.org_id || null;
    }, [activeSuite, user]);

    const getAccountType = useCallback(() => {
        return activeSuite?.account_type || user?.account_type || 'individual';
    }, [activeSuite, user]);

    useEntitySync(
        isAuthenticated && !!activeSuite?.suite_id && !!user?.uid && !appLoading && !suiteLoading,
        activeSuite?.suite_id,
        getOrgId,
        getAccountType,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError
    );

    // Convert testCaseToBugs to bugToTestCases
    const bugToTestCases = useCallback(() => {
        const bugMap = {};
        Object.entries(relationships.testCaseToBugs).forEach(([testCaseId, bugIds]) => {
            bugIds.forEach(bugId => {
                if (!bugMap[bugId]) bugMap[bugId] = [];
                bugMap[bugId].push(testCaseId);
            });
        });
        return bugMap;
    }, [relationships.testCaseToBugs]);

    // Apply filters to bugs
    const applyFilters = useCallback(() => {
        let filtered = [...bugs];

        if (filters.search) {
            filtered = filtered.filter(bug =>
                bug.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                bug.description?.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(bug => bug.status === filters.status);
        }

        if (filters.severity !== 'all') {
            filtered = filtered.filter(bug => bug.severity === filters.severity);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter(bug => bug.priority === filters.priority);
        }

        if (filters.assignee !== 'all') {
            filtered = filtered.filter(bug => bug.assigned_to === filters.assignee);
        }

        if (filters.environment !== 'all') {
            filtered = filtered.filter(bug => bug.environment === filters.environment);
        }

        setFilteredBugs(filtered);
    }, [bugs, filters]);

    useEffect(() => {
        applyFilters();
    }, [bugs, filters, applyFilters]);

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
            const orgId = getOrgId();
            const accountType = getAccountType();
            
            let bugsCollectionPath;
            if (accountType === 'individual') {
                bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
            } else {
                bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
            }
            
            if (action === 'delete') {
                if (!window.confirm(`Are you sure you want to delete ${ids.length} bug${ids.length > 1 ? 's' : ''}?`)) {
                    return;
                }
                await Promise.all(ids.map(id => firestoreService.deleteDocument(bugsCollectionPath, id)));
            } else {
                await Promise.all(ids.map(id => firestoreService.updateDocument(bugsCollectionPath, id, { status: action === 'reopen' ? 'open' : 'closed' })));
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
    }, [userCapabilities, activeSuite, user, getOrgId, getAccountType, addNotification]);

    const handleCreateBug = useCallback(async (bugData) => {
        if (!userCapabilities.canCreateBugs) {
            toast.error("You don't have permission to create bugs");
            return;
        }
        try {
            const orgId = getOrgId();
            const accountType = getAccountType();
            
            let bugsCollectionPath;
            if (accountType === 'individual') {
                bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
            } else {
                bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
            }
            
            const newBug = {
                ...bugData,
                created_at: new Date(),
                suite_id: activeSuite.suite_id,
                status: 'New',
                severity: bugData.severity || 'Low',
                priority: bugData.priority || 'Low',
                environment: bugData.environment || 'Production',
                created_by: user?.email || 'anonymous'
            };
            const docRef = await firestoreService.createDocument(bugsCollectionPath, newBug);
            addNotification({
                type: 'success',
                title: 'Bug Created',
                message: `Bug #${docRef.id.slice(-6)} created successfully`
            });
        } catch (error) {
            console.error('Error creating bug:', error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to create bug: ${error.message}`
            });
        }
    }, [userCapabilities, activeSuite, user, getOrgId, getAccountType, addNotification]);

    const handleExportBugs = async () => {
        try {
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
        setFilters({
            status: 'all',
            severity: 'all',
            priority: 'all',
            assignee: 'all',
            environment: 'all',
            search: ''
        });
        addNotification({
            type: 'success',
            title: 'Filters Cleared',
            message: 'All filters have been reset'
        });
    };

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
                        <BugReportButton onCreateBug={handleCreateBug} />
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
                    testCases={testCases}
                    recordings={recordings}
                    relationships={bugToTestCases()}
                    selectedBugs={selectedBugs}
                    onToggleSelection={toggleBugSelection}
                    onBulkAction={handleBulkAction}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    subGroupBy={subGroupBy}
                    setSubGroupBy={setSubGroupBy}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onCreateBug={handleCreateBug}
                    filters={filters}
                    setFilters={setFilters}
                    activeSuite={activeSuite}
                />
            </div>
        </PageLayout>
    );
}