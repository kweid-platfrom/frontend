/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Main BugTracker Component - Enhanced with comprehensive grouping support
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "sonner";
import { useProject } from "../../context/ProjectContext";
import BugList from "../bug-report/BugList";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import { Filter, X, List, Table, Grid, Calendar, User, Flag, AlertTriangle, Clock, Users } from "lucide-react";
import { BugAntIcon } from "@heroicons/react/24/outline";

const BugTracker = () => {
    const { activeProject, user, userProfile } = useProject();
    const [bugs, setBugs] = useState([]);
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    
    // Grouping states
    const [groupBy, setGroupBy] = useState('none');
    const [subGroupBy, setSubGroupBy] = useState('none');

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

    // Debug function to log query details
    const debugQuery = (queryType, conditions) => {
        console.log(`[DEBUG] ${queryType} Query Conditions:`, conditions);
    };

    // Fallback query function with better error handling
    const fallbackFetchBugs = async () => {
        try {
            console.log("[DEBUG] Attempting fallback fetch for bugs...");

            // Try simpler query first
            const bugsRef = collection(db, "bugs");
            let bugsQuery;

            if (activeProject.organizationId) {
                // For organization users
                bugsQuery = query(
                    bugsRef,
                    where("organizationId", "==", activeProject.organizationId),
                    where("projectId", "==", activeProject.id)
                );
                debugQuery("Organization Bugs", {
                    organizationId: activeProject.organizationId,
                    projectId: activeProject.id
                });
            } else {
                // For individual users
                bugsQuery = query(
                    bugsRef,
                    where("createdBy", "==", user.uid),
                    where("projectId", "==", activeProject.id)
                );
                debugQuery("Individual Bugs", {
                    createdBy: user.uid,
                    projectId: activeProject.id
                });
            }

            const snapshot = await getDocs(bugsQuery);
            const bugsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("[DEBUG] Fallback fetch successful. Bugs found:", bugsData.length);
            setBugs(bugsData);
            setError(null);
            return bugsData;
        } catch (error) {
            console.error("[DEBUG] Fallback fetch failed:", error);

            // Try even simpler query - just by projectId
            try {
                const bugsRef = collection(db, "bugs");
                const simpleQuery = query(bugsRef, where("projectId", "==", activeProject.id));
                const snapshot = await getDocs(simpleQuery);
                const bugsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log("[DEBUG] Simple query successful. Bugs found:", bugsData.length);
                setBugs(bugsData);
                setError(null);
                return bugsData;
            } catch (simpleError) {
                console.error("[DEBUG] Simple query also failed:", simpleError);
                throw simpleError;
            }
        }
    };

    // Function to update bug status
    const updateBugStatus = async (bugId, newStatus) => {
        try {
            const bugRef = doc(db, "bugs", bugId);
            await updateDoc(bugRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            
            // Update local state
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === bugId ? { ...bug, status: newStatus, updatedAt: new Date() } : bug
                )
            );
            
            toast.success(`Bug status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating bug status:", error);
            toast.error("Failed to update bug status");
        }
    };

    // Function to update bug (for drag and drop and other updates)
    const updateBug = async (updatedBug) => {
        try {
            const bugRef = doc(db, "bugs", updatedBug.id);
            const updateData = {
                ...updatedBug,
                updatedAt: new Date()
            };
            
            await updateDoc(bugRef, updateData);
            
            // Update local state
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === updatedBug.id ? { ...bug, ...updateData } : bug
                )
            );
            
            toast.success("Bug updated successfully");
        } catch (error) {
            console.error("Error updating bug:", error);
            toast.error("Failed to update bug");
        }
    };

    // Function to create sprint
    const createSprint = async (sprintData) => {
        try {
            const sprintRef = collection(db, "sprints");
            const newSprint = {
                ...sprintData,
                projectId: activeProject.id,
                organizationId: activeProject.organizationId || null,
                createdBy: user.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await addDoc(sprintRef, newSprint);
            toast.success("Sprint created successfully");
            return docRef.id;
        } catch (error) {
            console.error("Error creating sprint:", error);
            toast.error("Failed to create sprint");
            throw error;
        }
    };

    // Real-time listeners setup with enhanced error handling
    useEffect(() => {
        if (!user || !activeProject) {
            console.log("[DEBUG] Missing user or activeProject:", { user: !!user, activeProject: !!activeProject });
            return;
        }

        console.log("[DEBUG] Setting up real-time listeners for project:", activeProject.id);

        const unsubscribers = [];
        setError(null);

        const isOrgUser = !!activeProject.organizationId;
        console.log("[DEBUG] User type:", isOrgUser ? "Organization" : "Individual");

        // Query bugs with enhanced error handling
        const setupBugsListener = () => {
            try {
                const bugsRef = collection(db, "bugs");
                let bugsQuery;

                if (isOrgUser) {
                    bugsQuery = query(
                        bugsRef,
                        where("organizationId", "==", activeProject.organizationId),
                        where("projectId", "==", activeProject.id),
                        orderBy("createdAt", "desc")
                    );
                    debugQuery("Organization Bugs with Order", {
                        organizationId: activeProject.organizationId,
                        projectId: activeProject.id,
                        orderBy: "createdAt desc"
                    });
                } else {
                    bugsQuery = query(
                        bugsRef,
                        where("createdBy", "==", user.uid),
                        where("projectId", "==", activeProject.id),
                        orderBy("createdAt", "desc")
                    );
                    debugQuery("Individual Bugs with Order", {
                        createdBy: user.uid,
                        projectId: activeProject.id,
                        orderBy: "createdAt desc"
                    });
                }

                const unsubscribeBugs = onSnapshot(
                    bugsQuery,
                    (snapshot) => {
                        console.log("[DEBUG] Bugs snapshot received. Docs count:", snapshot.docs.length);
                        const bugsData = snapshot.docs.map(doc => {
                            const data = doc.data();
                            console.log("[DEBUG] Bug data:", { id: doc.id, title: data.title });
                            return {
                                id: doc.id,
                                ...data
                            };
                        });
                        setBugs(bugsData);
                        setError(null);
                        console.log("[DEBUG] Bugs state updated with", bugsData.length, "bugs");
                    },
                    (error) => {
                        console.error("[DEBUG] Bugs listener error:", error);
                        console.error("[DEBUG] Error code:", error.code);
                        console.error("[DEBUG] Error message:", error.message);

                        // If it's a missing index error, try fallback
                        if (error.code === 'failed-precondition' || error.message.includes('index')) {
                            console.log("[DEBUG] Attempting fallback due to index error...");
                            fallbackFetchBugs().catch(fallbackError => {
                                console.error("[DEBUG] Fallback also failed:", fallbackError);
                                setError(`Error loading bugs: ${fallbackError.message}`);
                                toast.error("Error loading bugs. Please check console for details.");
                            });
                        } else {
                            setError(`Error loading bugs: ${error.message}`);
                            toast.error("Error loading bugs: " + error.message);
                        }
                    }
                );
                unsubscribers.push(unsubscribeBugs);
            } catch (error) {
                console.error("[DEBUG] Error setting up bugs listener:", error);
                setError(`Error setting up bugs listener: ${error.message}`);
            }
        };

        // Query team members with proper error handling
        const setupTeamMembersListener = () => {
            try {
                const teamMembersRef = collection(db, "teamMembers");
                let teamMembersQuery;

                if (isOrgUser) {
                    teamMembersQuery = query(
                        teamMembersRef,
                        where("organizationId", "==", activeProject.organizationId),
                        where("projectId", "==", activeProject.id)
                    );
                } else {
                    teamMembersQuery = query(
                        teamMembersRef,
                        where("createdBy", "==", user.uid),
                        where("projectId", "==", activeProject.id)
                    );
                }

                const unsubscribeTeam = onSnapshot(
                    teamMembersQuery,
                    (snapshot) => {
                        const teamData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setTeamMembers(teamData);
                        console.log("[DEBUG] Team members loaded:", teamData.length);
                    },
                    (error) => {
                        console.error("[DEBUG] Team members error:", error);
                        setTeamMembers([]);
                        // Don't show error toast for team members as it's not critical
                    }
                );
                unsubscribers.push(unsubscribeTeam);
            } catch (error) {
                console.error("[DEBUG] Error setting up team members listener:", error);
                setTeamMembers([]);
            }
        };

        // Query sprints with proper error handling
        const setupSprintsListener = () => {
            try {
                const sprintsRef = collection(db, "sprints");
                let sprintsQuery;

                if (isOrgUser) {
                    sprintsQuery = query(
                        sprintsRef,
                        where("organizationId", "==", activeProject.organizationId),
                        where("projectId", "==", activeProject.id),
                        orderBy("createdAt", "desc")
                    );
                } else {
                    sprintsQuery = query(
                        sprintsRef,
                        where("createdBy", "==", user.uid),
                        where("projectId", "==", activeProject.id),
                        orderBy("createdAt", "desc")
                    );
                }

                const unsubscribeSprints = onSnapshot(
                    sprintsQuery,
                    (snapshot) => {
                        const sprintsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setSprints(sprintsData);
                        console.log("[DEBUG] Sprints loaded:", sprintsData.length);
                    },
                    (error) => {
                        console.error("[DEBUG] Sprints error:", error);
                        setSprints([]);
                        // Don't show error toast for sprints as it's not critical
                    }
                );
                unsubscribers.push(unsubscribeSprints);
            } catch (error) {
                console.error("[DEBUG] Error setting up sprints listener:", error);
                setSprints([]);
            }
        };

        // Set up all listeners
        setupBugsListener();
        setupTeamMembersListener();
        setupSprintsListener();

        return () => {
            console.log("[DEBUG] Cleaning up listeners...");
            unsubscribers.forEach(unsub => unsub());
        };
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

    // Retry function for manual retry
    const handleRetry = () => {
        setError(null);
        fallbackFetchBugs().catch(error => {
            setError(`Retry failed: ${error.message}`);
        });
    };

    // Grouping options
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

    // Show no project message
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

    // Show error with retry option
    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Error loading bugs</p>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-[#00897B] text-white rounded-md hover:bg-[#00695C] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className=" flex">
            {/* Main Content */}
            <div className={`flex-1 flex flex-col ${showDetailsPanel ? 'mr-96' : ''} transition-all duration-300`}>
                {/* Header with Controls */}
                <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div>
                        <h1 className="flex items-center text-3xl font-bold text-gray-900">
                            <BugAntIcon className="h-6 w-6 mr-2" />
                            Bug Tracker
                            <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                                {bugs.length} {bugs.length === 1 ? "bug" : "bugs"}
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Grouping Controls */}
                        <div className="flex items-center space-x-2">
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                >
                                    {subGroupingOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center px-3 py-2 text-sm transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-[#00897B] text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <List className="h-4 w-4 mr-1" />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center px-3 py-2 text-sm transition-colors border-l ${
                                    viewMode === 'table'
                                        ? 'bg-[#00897B] text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Table className="h-4 w-4 mr-1" />
                                Table
                            </button>
                        </div>

                        {/* Filter Controls */}
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
                            {getActiveFilterCount() > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-white text-[#00897B] rounded-full text-xs font-medium">
                                    {getActiveFilterCount()}
                                </span>
                            )}
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

                {/* Bug List with Grouping Support - Let BugList handle its own loading */}
                <BugList
                    bugs={filteredBugs}
                    viewMode={viewMode}
                    groupBy={groupBy}
                    subGroupBy={subGroupBy}
                    onBugSelect={handleBugSelect}
                    selectedBug={selectedBug}
                    getSeverityColor={getSeverityColor}
                    getStatusColor={getStatusColor}
                    getPriorityFromSeverity={getPriorityFromSeverity}
                    formatDate={formatDate}
                    teamMembers={teamMembers}
                    sprints={sprints}
                    updateBugStatus={updateBugStatus}
                    onUpdateBug={updateBug}
                    onCreateSprint={createSprint}
                />
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