/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useProject } from "../../context/SuiteContext";
import { useAuth } from "../../context/AuthProvider";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import BugTrackerHeader from "../bug-report/BugTrackerHeader";
import BugTable from "../bug-report/BugTable";
import BugTrackingMetrics from "../stats/BugTrackingMetrics";
import { X, Lock } from "lucide-react";
import { useBugTracker } from "../../hooks/useBugTracker";
import { calculateBugMetrics } from "../../utils/calculateBugMetrics";

const BugTracker = () => {
    const { activeProject, user } = useProject();
    const { hasPermission } = useAuth();
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);

    // Check permissions
    const canReadBugs = hasPermission('read_bugs');
    const canUpdateBugs = hasPermission('update_bugs');
    const canDeleteBugs = hasPermission('delete_bugs');
    const canManageBugs = hasPermission('manage_bugs');

    const {
        bugs,
        filteredBugs,
        teamMembers,
        sprints,
        environments,
        filters,
        setFilters,
        currentMetrics,
        metricsWithTrends,
        isUpdating,
        error,

        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBug,
        createSprint,
        formatDate
    } = useBugTracker();

    // Calculate comprehensive metrics at the top level
    const comprehensiveMetrics = useMemo(() => {
        if (!canReadBugs || !bugs || bugs.length === 0) {
            return {
                totalBugs: 0,
                bugsFromScreenRecording: 0,
                bugsFromManualTesting: 0,
                bugsWithVideoEvidence: 0,
                bugsWithNetworkLogs: 0,
                bugsWithConsoleLogs: 0,
                criticalBugs: 0,
                highPriorityBugs: 0,
                mediumPriorityBugs: 0,
                lowPriorityBugs: 0,
                resolvedBugs: 0,
                avgResolutionTime: 0,
                bugResolutionRate: 0,
                avgBugReportCompleteness: 75,
                bugReportsWithAttachments: 0,
                bugReproductionRate: 0,
                weeklyReportsGenerated: 4,
                monthlyReportsGenerated: 1,
                avgBugsPerReport: 0,
                lastUpdated: new Date().toISOString(),
                permissions: {
                    canRead: canReadBugs,
                    canUpdate: canUpdateBugs,
                    canDelete: canDeleteBugs,
                    canManage: canManageBugs
                }
            };
        }
        
        const metrics = calculateBugMetrics(bugs);
        return {
            ...metrics,
            lastUpdated: new Date().toISOString(),
            permissions: {
                canRead: canReadBugs,
                canUpdate: canUpdateBugs,
                canDelete: canDeleteBugs,
                canManage: canManageBugs
            }
        };
    }, [bugs, canReadBugs, canUpdateBugs, canDeleteBugs, canManageBugs]);

    // Enhanced metrics exposure to dashboard
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            // Store metrics on window object for direct access
            window.bugTrackerMetrics = comprehensiveMetrics;

            // Dispatch custom event for dashboard listeners
            const metricsEvent = new CustomEvent('bugMetricsUpdated', {
                detail: {
                    metrics: comprehensiveMetrics,
                    timestamp: Date.now(),
                    projectId: activeProject?.id,
                    userId: user?.uid
                }
            });
            window.dispatchEvent(metricsEvent);

            // Also store in localStorage for persistence across page reloads
            try {
                localStorage.setItem('bugTrackerMetrics', JSON.stringify({
                    ...comprehensiveMetrics,
                    timestamp: Date.now(),
                    projectId: activeProject?.id
                }));
            } catch (err) {
                console.warn('Failed to store metrics in localStorage:', err);
            }
        }
    }, [comprehensiveMetrics, activeProject?.id, user?.uid]);

    // Permission-aware event handlers
    const handleBugSelect = (bug) => {
        if (!canReadBugs) {
            toast.error("You don't have permission to view bug details");
            return;
        }
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    };

    const toggleBugSelection = (bugId) => {
        if (!canReadBugs) {
            toast.error("You don't have permission to select bugs");
            return;
        }
        setSelectedBugs(prev =>
            prev.includes(bugId)
                ? prev.filter(id => id !== bugId)
                : [...prev, bugId]
        );
    };

    const toggleGroupSelection = () => {
        if (!canReadBugs) {
            toast.error("You don't have permission to select bugs");
            return;
        }
        
        if (selectedBugs.length === filteredBugs.length && filteredBugs.length > 0) {
            setSelectedBugs([]);
        } else if (filteredBugs.length > 0) {
            setSelectedBugs(filteredBugs.map(bug => bug.id));
        }
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (!canUpdateBugs) {
            toast.error("You don't have permission to update bug status");
            return;
        }
        
        if (selectedBugs.length === 0) return;
        
        try {
            await Promise.all(
                selectedBugs.map(bugId => updateBugStatus(bugId, newStatus))
            );
            setSelectedBugs([]);
            toast.success(`Updated ${selectedBugs.length} bugs to ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update bugs");
        }
    };

    const handleBulkAssignment = async (assignedTo) => {
        if (!canUpdateBugs) {
            toast.error("You don't have permission to assign bugs");
            return;
        }
        
        if (selectedBugs.length === 0) return;
        
        try {
            await Promise.all(
                selectedBugs.map(bugId => updateBugAssignment(bugId, assignedTo))
            );
            setSelectedBugs([]);
            toast.success(`Assigned ${selectedBugs.length} bugs`);
        } catch (error) {
            toast.error("Failed to assign bugs");
        }
    };

    const handleDragStart = (e, bug) => {
        if (!canUpdateBugs) {
            e.preventDefault();
            toast.error("You don't have permission to move bugs");
            return;
        }
        e.dataTransfer.setData('text/plain', JSON.stringify(bug));
    };

    const allGroupSelected = selectedBugs.length === filteredBugs.length && filteredBugs.length > 0;
    const isGroupSelected = selectedBugs.length > 0;

    // Loading state
    if (!user || !activeProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bug tracker...</p>
                </div>
            </div>
        );
    }

    // Permission denied state
    if (!canReadBugs) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-yellow-600 mb-4">
                        <Lock className="w-12 h-12 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold">Access Restricted</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">
                        You don&apos;t have permission to view the bug tracker.
                    </p>
                    <p className="text-sm text-yellow-600">
                        Contact your project administrator to request access.
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-red-600 mb-4">
                        <X className="w-12 h-12 mx-auto mb-2" />
                        <h3 className="text-lg font-semibold">Error Loading Bugs</h3>
                    </div>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex-shrink-0">
                <BugTrackerHeader
                    bugs={bugs}
                    filteredBugs={filteredBugs}
                    selectedBugs={selectedBugs}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    showMetrics={showMetrics}
                    setShowMetrics={setShowMetrics}
                    viewMode="table"
                    setViewMode={() => { }}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkAssignment={handleBulkAssignment}
                    teamMembers={teamMembers}
                    comprehensiveMetrics={comprehensiveMetrics}
                    permissions={{
                        canRead: canReadBugs,
                        canUpdate: canUpdateBugs,
                        canDelete: canDeleteBugs,
                        canManage: canManageBugs
                    }}
                />

                {/* Metrics Panel */}
                {showMetrics && (
                    <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                        <BugTrackingMetrics
                            bugs={bugs}
                            metrics={comprehensiveMetrics}
                        />
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white border-b border-gray-200 flex-shrink-0">
                        <BugFilters
                            filters={filters}
                            setFilters={setFilters}
                            teamMembers={teamMembers}
                            sprints={sprints}
                            environments={environments}
                            bugs={bugs}
                        />
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden pt-6">
                {/* Bug Table */}
                <div className={`${showDetailsPanel ? "flex-1" : "w-auto"} overflow-auto bg-white rounded-lg border border-gray-200`}>
                    <BugTable
                        bugs={filteredBugs}
                        selectedBugs={selectedBugs}
                        onBugSelect={handleBugSelect}
                        onToggleSelection={toggleBugSelection}
                        onToggleGroupSelection={toggleGroupSelection}
                        allGroupSelected={allGroupSelected}
                        isGroupSelected={isGroupSelected}
                        onUpdateBugStatus={canUpdateBugs ? updateBugStatus : null}
                        onUpdateBugSeverity={canUpdateBugs ? updateBugSeverity : null}
                        onUpdateBugAssignment={canUpdateBugs ? updateBugAssignment : null}
                        onUpdateBugEnvironment={canUpdateBugs ? updateBugEnvironment : null}
                        onDragStart={handleDragStart}
                        teamMembers={teamMembers}
                        environments={environments}
                        isUpdating={isUpdating}
                        permissions={{
                            canRead: canReadBugs,
                            canUpdate: canUpdateBugs,
                            canDelete: canDeleteBugs,
                            canManage: canManageBugs
                        }}
                    />
                </div>

                {/* Details Panel */}
                {showDetailsPanel && selectedBug && (
                    <div className="absolute top-0 right-0 w-auto h-full bg-white rounded border border-gray-200 shadow-xl z-50 overflow-x-auto">
                        <BugDetailsPanel
                            bug={selectedBug}
                            onClose={() => setShowDetailsPanel(false)}
                            onUpdateBug={canUpdateBugs ? updateBug : null}
                            onUpdateStatus={canUpdateBugs ? updateBugStatus : null}
                            onUpdateSeverity={canUpdateBugs ? updateBugSeverity : null}
                            onUpdateAssignment={canUpdateBugs ? updateBugAssignment : null}
                            teamMembers={teamMembers}
                            environments={environments}
                            sprints={sprints}
                            onCreateSprint={canManageBugs ? createSprint : null}
                            formatDate={formatDate}
                            permissions={{
                                canRead: canReadBugs,
                                canUpdate: canUpdateBugs,
                                canDelete: canDeleteBugs,
                                canManage: canManageBugs
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugTracker;