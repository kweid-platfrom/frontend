/* eslint-disable @typescript-eslint/no-unused-vars */
// Main BugTracker Component - Fixed
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "sonner";
import { useProject } from "../../context/ProjectContext";
import BugList from "../bug-report/BugList";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import { Filter, X } from "lucide-react";

const BugTracker = () => {
    const { activeProject, user, userProfile } = useProject();
    const [bugs, setBugs] = useState([]);
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: "all",
        severity: "all",
        assignedTo: "all",
        category: "all",
        sprint: "all",
        dueDate: "all",
        searchTerm: ""
    });

    // Real-time listeners setup
    useEffect(() => {
        if (!user || !activeProject) return;

        const unsubscribers = [];
        setLoading(true);

        const bugsRef = collection(db, "bugs");

        const isOrgUser = !!activeProject.organizationId;

        // Query bugs depending on account type
        const bugsQuery = isOrgUser
            ? query(
                bugsRef,
                where("organizationId", "==", activeProject.organizationId),
                where("projectId", "==", activeProject.id),
                orderBy("createdAt", "desc")
            )
            : query(
                bugsRef,
                where("createdBy", "==", user.uid),
                where("projectId", "==", activeProject.id),
                orderBy("createdAt", "desc")
            );

        const unsubscribeBugs = onSnapshot(
            bugsQuery,
            (snapshot) => {
                const bugsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setBugs(bugsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching bugs:", error);
                toast.error("Error loading bugs: " + error.message);
                setLoading(false);
            }
        );

        unsubscribers.push(unsubscribeBugs);

        // Other listeners (unchanged)
        const unsubscribeTeam = onSnapshot(collection(db, "teamMembers"), (snapshot) => {
            const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeamMembers(teamData);
        }, (error) => {
            console.error("Error fetching team members:", error);
            toast.error("Error loading team members");
        });
        unsubscribers.push(unsubscribeTeam);

        const unsubscribeSprints = onSnapshot(collection(db, "sprints"), (snapshot) => {
            const sprintsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSprints(sprintsData);
        }, (error) => {
            console.error("Error fetching sprints:", error);
            toast.error("Error loading sprints");
        });
        unsubscribers.push(unsubscribeSprints);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [activeProject, user]);


    // Apply filters whenever bugs or filters change
    useEffect(() => {
        let filtered = [...bugs];

        // Search filter
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(bug =>
                bug.title?.toLowerCase().includes(searchLower) ||
                bug.description?.toLowerCase().includes(searchLower) ||
                bug.id?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status !== "all") {
            filtered = filtered.filter(bug => bug.status === filters.status);
        }

        // Severity filter
        if (filters.severity !== "all") {
            filtered = filtered.filter(bug => bug.severity === filters.severity);
        }

        // Assigned to filter
        if (filters.assignedTo !== "all") {
            if (filters.assignedTo === "unassigned") {
                filtered = filtered.filter(bug => !bug.assignedTo);
            } else {
                filtered = filtered.filter(bug => bug.assignedTo === filters.assignedTo);
            }
        }

        // Category filter
        if (filters.category !== "all") {
            filtered = filtered.filter(bug => bug.category === filters.category);
        }

        // Sprint filter
        if (filters.sprint !== "all") {
            filtered = filtered.filter(bug => bug.sprintId === filters.sprint);
        }

        // Due date filter
        if (filters.dueDate !== "all") {
            const now = new Date();
            filtered = filtered.filter(bug => {
                if (!bug.dueDate) return filters.dueDate === "no-due-date";

                const dueDate = bug.dueDate.seconds ?
                    new Date(bug.dueDate.seconds * 1000) :
                    new Date(bug.dueDate);

                switch (filters.dueDate) {
                    case "overdue":
                        return dueDate < now;
                    case "today":
                        return dueDate.toDateString() === now.toDateString();
                    case "this-week":
                        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return dueDate >= now && dueDate <= weekFromNow;
                    case "no-due-date":
                        return false;
                    default:
                        return true;
                }
            });
        }

        setFilteredBugs(filtered);
    }, [bugs, filters]);

    const handleBugSelect = (bug) => {
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    };

    const handleBugUpdate = (updatedBug) => {
        setBugs(prevBugs =>
            prevBugs.map(bug =>
                bug.id === updatedBug.id ? { ...bug, ...updatedBug } : bug
            )
        );
        toast.success("Bug updated successfully");
    };

    const clearFilters = () => {
        setFilters({
            status: "all",
            severity: "all",
            assignedTo: "all",
            category: "all",
            sprint: "all",
            dueDate: "all",
            searchTerm: ""
        });
        toast.success("Filters cleared");
    };

    const getActiveFilterCount = () => {
        return Object.values(filters).filter(value => value !== "all" && value !== "").length;
    };

    // Helper functions for styling
    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case "critical": return "bg-red-100 text-red-800";
            case "high": return "bg-orange-100 text-orange-800";
            case "medium": return "bg-yellow-100 text-yellow-800";
            case "low": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "new": return "bg-blue-100 text-blue-800";
            case "in progress": return "bg-purple-100 text-purple-800";
            case "blocked": return "bg-red-100 text-red-800";
            case "resolved": return "bg-green-100 text-green-800";
            case "closed": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityFromSeverity = (severity) => {
        switch (severity?.toLowerCase()) {
            case "critical": return { level: "P1", color: "bg-red-100 text-red-800" };
            case "high": return { level: "P2", color: "bg-orange-100 text-orange-800" };
            case "medium": return { level: "P3", color: "bg-yellow-100 text-yellow-800" };
            case "low": return { level: "P4", color: "bg-green-100 text-green-800" };
            default: return { level: "P4", color: "bg-gray-100 text-gray-800" };
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        return dateObj.toLocaleDateString();
    };

    // Show loading or no project message
    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-gray-600">No active project selected</p>
                    <p className="text-sm text-gray-500">Please select or create a project to view bugs</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B]"></div>
                <span className="ml-2 text-gray-600">Loading bugs...</span>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* Main Content */}
            <div className={`flex-1 flex flex-col ${showDetailsPanel ? 'mr-96' : ''} transition-all duration-300`}>
                {/* Header with Filter Toggle */}
                <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Bug Tracker ({filteredBugs.length})
                        </h1>
                        {getActiveFilterCount() > 0 && (
                            <span className="px-2 py-1 bg-[#00897B] text-white text-xs rounded-full">
                                {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        {getActiveFilterCount() > 0 && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Clear filters
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${showFilters
                                    ? 'bg-[#00897B] text-white border-[#00897B]'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <BugFilters
                        filters={filters}
                        setFilters={setFilters}
                        teamMembers={teamMembers}
                        sprints={sprints}
                        onClose={() => setShowFilters(false)}
                    />
                )}

                {/* Bug List */}
                <div className="flex-1 overflow-auto">
                    <BugList
                        bugs={filteredBugs}
                        onBugSelect={handleBugSelect}
                        selectedBug={selectedBug}
                        getSeverityColor={getSeverityColor}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        teamMembers={teamMembers}
                        sprints={sprints}
                    />
                </div>
            </div>

            {/* Right Panel for Bug Details */}
            {showDetailsPanel && selectedBug && (
                <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 overflow-auto">
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Bug Details</h2>
                        <button
                            onClick={() => setShowDetailsPanel(false)}
                            className="p-2 hover:bg-gray-200 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <BugDetailsPanel
                        bug={selectedBug}
                        teamMembers={teamMembers}
                        sprints={sprints}
                        onBugUpdate={handleBugUpdate}
                        getSeverityColor={getSeverityColor}
                        getStatusColor={getStatusColor}
                        getPriorityFromSeverity={getPriorityFromSeverity}
                        formatDate={formatDate}
                    />
                </div>
            )}
        </div>
    );
};

export default BugTracker;