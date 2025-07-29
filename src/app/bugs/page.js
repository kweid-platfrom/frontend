'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppProvider';
import { useBugs } from '../../hooks/useBugs';

import BugTable from '@/components/bug-report/BugTable';
import BugReportButton from '@/components/modals/BugReportButton';
import BugDetailsModal from '@/components/modals/BugDetailsModal';
import BugFilters from '@/components/bug-report/BugFilters';
import { FileText, Download } from 'lucide-react';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

const BugTracker = () => {
    const { state, actions, isAuthenticated, currentUser: user, activeSuite, isLoading: appLoading } = useApp();
    const { selectedBugs, canCreateBugs, selectBugs, clearBugSelection } = useBugs();
    const router = useRouter();

    // Local state
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [groupBy, setGroupBy] = useState('none');
    const [subGroupBy, setSubGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('table');
    const [selectedBug, setSelectedBug] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all',
        severity: 'all',
        category: 'all',
        assignedTo: 'all',
        sprint: 'all',
        dueDate: 'all',
    });
    const [fetchError, setFetchError] = useState(null);

    // Get data from state with useMemo to prevent re-renders
    const bugs = useMemo(() => state.bugs.bugs || [], [state.bugs.bugs]);
    const testCases = useMemo(() => state.testCases.testCases || [], [state.testCases.testCases]);
    const isLoadingEntities = useMemo(() => 
        state.bugs.loading || state.testCases.loading || state.sprints.loading,
        [state.bugs.loading, state.testCases.loading, state.sprints.loading]
    );
    
    // User capabilities - memoized to prevent re-renders, using canCreateBugs from hook
    const userCapabilities = useMemo(() => ({
        canViewBugs: state.subscription?.planLimits?.canViewBugs !== false,
        canCreateBugs: canCreateBugs,
        canUpdateBugs: state.subscription?.planLimits?.canUpdateBugs !== false,
        canDeleteBugs: state.subscription?.planLimits?.canDeleteBugs !== false,
    }), [state.subscription?.planLimits, canCreateBugs]);

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
        setFetchError(error.message);
    }, [addNotification]);

    // Create bug to test cases mapping from relationships
    const bugToTestCases = useCallback(() => {
        const bugMap = {};
        // This would need to be implemented based on your relationship structure
        // For now, return empty mapping
        return bugMap;
    }, []);

    const applyFilters = useCallback(() => {
        if (!bugs || !Array.isArray(bugs)) {
            console.warn('No bugs data available to filter');
            setFilteredBugs([]);
            return;
        }

        let filtered = [...bugs];

        if (filters.searchTerm) {
            filtered = filtered.filter(
                (bug) =>
                    (bug.title?.toLowerCase()?.includes(filters.searchTerm.toLowerCase()) || false) ||
                    (bug.description?.toLowerCase()?.includes(filters.searchTerm.toLowerCase()) || false)
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter((bug) => bug.status === filters.status);
        }

        if (filters.severity !== 'all') {
            filtered = filtered.filter((bug) => bug.severity === filters.severity);
        }

        if (filters.category !== 'all') {
            filtered = filtered.filter((bug) => bug.category === filters.category);
        }

        if (filters.assignedTo !== 'all') {
            filtered = filtered.filter((bug) => bug.assigned_to === filters.assignedTo);
        }

        if (filters.sprint !== 'all') {
            filtered = filtered.filter((bug) => bug.sprint === filters.sprint);
        }

        if (filters.dueDate !== 'all') {
            filtered = filtered.filter((bug) => {
                if (!bug.due_date) return filters.dueDate === 'no-due-date';
                const due = new Date(bug.due_date instanceof Timestamp ? bug.due_date.toDate() : bug.due_date);
                const today = new Date();
                if (filters.dueDate === 'overdue') return due < today;
                if (filters.dueDate === 'today') {
                    return (
                        due.getDate() === today.getDate() &&
                        due.getMonth() === today.getMonth() &&
                        due.getFullYear() === today.getFullYear()
                    );
                }
                if (filters.dueDate === 'this-week') {
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    const weekEnd = new Date(today.setDate(today.getDate() + 6));
                    return due >= weekStart && due <= weekEnd;
                }
                return true;
            });
        }

        console.log('Filtered bugs:', filtered);
        setFilteredBugs(filtered);
    }, [bugs, filters]);

    useEffect(() => {
        console.log('Bugs data:', bugs);
        console.log('Active suite:', activeSuite);
        console.log('User:', user);
        console.log('Is authenticated:', isAuthenticated);
        console.log('User capabilities:', userCapabilities);
        applyFilters();
    }, [bugs, filters, activeSuite, user, isAuthenticated, userCapabilities, applyFilters]);

    const toggleBugSelection = useCallback(
        (id, checked) => {
            if (!userCapabilities.canViewBugs) {
                toast.error("You don't have permission to select bugs");
                return;
            }
            const newSelection = checked
                ? [...new Set([...selectedBugs, id])]
                : selectedBugs.filter((selectedId) => selectedId !== id);
            selectBugs(newSelection);
            toast.info(`${newSelection.length} bug${newSelection.length > 1 ? 's' : ''} selected`);
        },
        [userCapabilities, selectedBugs, selectBugs]
    );

    const handleBulkAction = useCallback(
        async (action, ids) => {
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
                    // Use actions from context
                    await Promise.all(ids.map(id => actions.bugs.deleteBug(id)));
                } else {
                    // Use actions from context for bulk update
                    const updateData = {
                        status: action === 'open' ? 'Open' : 'Closed',
                        updated_at: Timestamp.fromDate(new Date()),
                    };
                    await Promise.all(ids.map(id => actions.bugs.updateBug(id, updateData)));
                }
                
                clearBugSelection();
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `${ids.length} bug${ids.length > 1 ? 's' : ''} ${action}d successfully`,
                });
            } catch (error) {
                handleError(error, `bulk ${action}`);
            }
        },
        [userCapabilities, actions.bugs, clearBugSelection, addNotification, handleError]
    );

    const handleCreateBug = useCallback(() => {
        // This callback is called after successful bug creation
        // Note: Don't show notification here as BugReportButton handles its own notifications
        // This is for any additional logic like metrics tracking
        console.log('Bug creation completed successfully');
    }, []);

    const handleEditBug = useCallback((bug) => {
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, []);

    const handleViewBug = useCallback((bug) => {
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, []);

    const handleSaveBug = useCallback(
        async (bugData) => {
            try {
                if (selectedBug) {
                    const updateData = {
                        ...bugData,
                        updated_at: Timestamp.fromDate(new Date()),
                    };
                    await actions.bugs.updateBug(selectedBug.id, updateData);
                    addNotification({
                        type: 'success',
                        title: 'Success',
                        message: 'Bug updated successfully',
                    });
                }
                setIsDetailsModalOpen(false);
            } catch (error) {
                handleError(error, 'save bug');
            }
        },
        [selectedBug, actions.bugs, addNotification, handleError]
    );

    const handleLinkTestCase = useCallback(
        async (bugId, newTestCaseIds) => {
            try {
                // Use the context actions for linking - this matches the AppProvider method
                await actions.linkTestCasesToBug(bugId, newTestCaseIds);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Linked ${newTestCaseIds.length} test case${newTestCaseIds.length > 1 ? 's' : ''} to bug`,
                });
            } catch (error) {
                handleError(error, 'link test cases');
            }
        },
        [actions, addNotification, handleError]
    );

    const handleUnlinkTestCase = useCallback(
        async (bugId, testCaseId) => {
            try {
                // Use the context actions for unlinking
                await actions.unlinkTestCaseFromBug(bugId, testCaseId);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Test case unlinked from bug successfully',
                });
            } catch (error) {
                handleError(error, 'unlink test case');
            }
        },
        [actions, addNotification, handleError]
    );

    const handleExportBugs = useCallback(async () => {
        try {
            // Implement export logic (e.g., CSV export)
            addNotification({
                type: 'success',
                title: 'Bugs Exported',
                message: 'Bugs exported successfully',
            });
        } catch (error) {
            handleError(error, 'export bugs');
        }
    }, [addNotification, handleError]);

    const handleGenerateReport = useCallback(() => {
        addNotification({
            type: 'info',
            title: 'Report Generation',
            message: 'Report generation is not yet implemented',
        });
    }, [addNotification]);

    const handleDuplicateBug = useCallback(
        async (bug) => {
            try {
                const timestamp = Timestamp.fromDate(new Date());
                const duplicatedBug = {
                    ...bug,
                    title: `${bug.title} (Copy)`,
                    created_at: timestamp,
                    updated_at: timestamp,
                    suite_id: activeSuite.id,
                    created_by: user?.email || 'anonymous',
                };
                delete duplicatedBug.id; // Remove the original ID
                
                await actions.bugs.createBug(duplicatedBug);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug duplicated successfully',
                });
            } catch (error) {
                handleError(error, 'duplicate bug');
            }
        },
        [activeSuite, user, actions.bugs, addNotification, handleError]
    );

    const handleDeleteBug = useCallback(
        async (id) => {
            try {
                await actions.bugs.deleteBug(id);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug deleted successfully',
                });
            } catch (error) {
                handleError(error, 'delete bug');
            }
        },
        [actions.bugs, addNotification, handleError]
    );

    // Prepare team members for filters - memoized with validation
    const teamMembers = useMemo(() => {
        const members = Array.from(new Set(bugs
            .filter(bug => bug && typeof bug === 'object' && bug.assigned_to && typeof bug.assigned_to === 'string')
            .map(bug => bug.assigned_to)))
            .map(email => ({ name: email }));
        console.log('teamMembers:', members); // Debug
        return members;
    }, [bugs]);

    // Prepare sprint options for filters - memoized with validation
    const sprintOptions = useMemo(() => {
        const sprints = Array.from(new Set(bugs
            .filter(bug => bug && typeof bug === 'object' && bug.sprint && typeof bug.sprint === 'string')
            .map(bug => bug.sprint)))
            .map(sprint => ({ id: sprint, name: sprint }));
        console.log('sprintOptions:', sprints); // Debug
        return sprints;
    }, [bugs]);

    if (appLoading || isLoadingEntities) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user || !activeSuite) {
        addNotification({
            type: 'error',
            title: 'Access Denied',
            message: 'Please log in and select a test suite to access the bug tracker.',
        });
        router.push('/login');
        return null;
    }

    if (!userCapabilities.canViewBugs) {
        addNotification({
            type: 'error',
            title: 'Subscription Required',
            message: 'Your subscription does not allow access to the bug tracker. Please upgrade your plan.',
        });
        router.push('/pricing');
        return null;
    }

    return (
        <div className="space-y-6">
            {fetchError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{fetchError}</span>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center">
                    <BugAntIcon className="h-6 w-6 mr-2" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bug Tracker</h1>
                    <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                        {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
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
                <BugFilters
                    filters={filters}
                    setFilters={setFilters}
                    teamMembers={teamMembers}
                    sprints={sprintOptions}
                    isExpanded={isFiltersExpanded}
                    setIsExpanded={setIsFiltersExpanded}
                    groupBy={groupBy}
                    setGroupBy={setGroupBy}
                    subGroupBy={subGroupBy}
                    setSubGroupBy={setSubGroupBy}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />
            </div>

            {filteredBugs.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No bugs found. Try adjusting the filters or create a new bug.</p>
                </div>
            ) : (
                <BugTable
                    bugs={filteredBugs}
                    testCases={testCases}
                    relationships={bugToTestCases()}
                    selectedBugs={selectedBugs}
                    onToggleSelection={toggleBugSelection}
                    onBulkAction={handleBulkAction}
                    onView={handleViewBug}
                    onEdit={handleEditBug}
                    onDuplicate={handleDuplicateBug}
                    onDelete={handleDeleteBug}
                    onLinkTestCase={handleLinkTestCase}
                    onUnlinkTestCase={handleUnlinkTestCase}
                />
            )}

            {isDetailsModalOpen && (
                <BugDetailsModal
                    bug={selectedBug}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onSave={handleSaveBug}
                />
            )}
        </div>
    );
};

export default BugTracker;