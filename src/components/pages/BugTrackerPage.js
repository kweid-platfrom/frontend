/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useProject } from "../../context/ProjectContext";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import BugTrackerHeader from "../bug-report/BugTrackerHeader";
import BugTable from "../bug-report/BugTable";
import BugTrackingMetrics from "../stats/BugTrackingMetrics";
import { X } from "lucide-react";
import { useBugTracker } from "../../hooks/useBugTracker";
import { calculateBugMetrics } from "../../utils/calculateBugMetrics";


const BugTracker = () => {
    const { activeProject, user } = useProject();
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);


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
        return calculateBugMetrics(bugs);
    }, [bugs]);
    // Expose metrics to parent components or global state
    React.useEffect(() => {
        // You can dispatch this to a global state manager or context
        // For now, we'll attach it to window for dashboard access
        if (typeof window !== 'undefined') {
            window.bugTrackerMetrics = comprehensiveMetrics;


            // Dispatch custom event for dashboard to listen to
            const metricsEvent = new CustomEvent('bugMetricsUpdated', {
                detail: comprehensiveMetrics
            });
            window.dispatchEvent(metricsEvent);
        }
    }, [comprehensiveMetrics]);
    const handleBugSelect = (bug) => {
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    };
    const toggleBugSelection = (bugId) => {
        setSelectedBugs(prev =>
            prev.includes(bugId)
                ? prev.filter(id => id !== bugId)
                : [...prev, bugId]
        );
    };


    const toggleGroupSelection = () => {
        if (selectedBugs.length === filteredBugs.length && filteredBugs.length > 0) { // Added filteredBugs.length > 0 check
            setSelectedBugs([]);
        } else if (filteredBugs.length > 0) { // Only select if there are bugs to select
            setSelectedBugs(filteredBugs.map(bug => bug.id));
        }
    };


    const handleBulkStatusUpdate = async (newStatus) => {
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
        e.dataTransfer.setData('text/plain', JSON.stringify(bug));
    };


    const allGroupSelected = selectedBugs.length === filteredBugs.length && filteredBugs.length > 0;
    const isGroupSelected = selectedBugs.length > 0;
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


    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-red-600 mb-4">
                        <X
                            className="w-12 h-12 mx-auto mb-2" />
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
                    // Pass comprehensive metrics to header if needed
                    comprehensiveMetrics={comprehensiveMetrics}
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
                <div className={`${showDetailsPanel ?
                    "flex-1" : "w-auto"} overflow-auto bg-white rounded-lg border border-gray-200`}>
                    <BugTable
                        bugs={filteredBugs}
                        selectedBugs={selectedBugs}
                        onBugSelect={handleBugSelect}

                        onToggleSelection={toggleBugSelection}
                        onToggleGroupSelection={toggleGroupSelection}
                        allGroupSelected={allGroupSelected}
                        isGroupSelected={isGroupSelected}

                        onUpdateBugStatus={updateBugStatus}
                        onUpdateBugSeverity={updateBugSeverity}
                        onUpdateBugAssignment={updateBugAssignment}
                        onUpdateBugEnvironment={updateBugEnvironment}

                        onDragStart={handleDragStart}
                        teamMembers={teamMembers}
                        environments={environments}
                        isUpdating={isUpdating}

                    />
                </div>


                {/* Details Panel */}
                {showDetailsPanel && selectedBug && ( // Ensure selectedBug exists before rendering
                    <div className="absolute top-0 right-0 w-auto h-full bg-white rounded border border-gray-200 shadow-xl z-50 overflow-x-auto">

                        <BugDetailsPanel
                            bug={selectedBug}
                            onClose={() => setShowDetailsPanel(false)}

                            onUpdateBug={updateBug}
                            onUpdateStatus={updateBugStatus}
                            onUpdateSeverity={updateBugSeverity}
                            onUpdateAssignment={updateBugAssignment}

                            teamMembers={teamMembers}
                            environments={environments}
                            sprints={sprints}

                            onCreateSprint={createSprint}
                            formatDate={formatDate}
                        />
                    </div>
                )}

            </div>
        </div>
    );
};


export default BugTracker;