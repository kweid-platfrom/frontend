/* eslint-disable @typescript-eslint/no-unused-vars */
// Main BugTracker Component - Enhanced with metrics calculation
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, onSnapshot, query, orderBy, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { toast } from "sonner";
import { useProject } from "../../context/ProjectContext";
import BugList from "../bug-report/BugList";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import BugTrackerHeader from "../bug-report/BugTrackerHeader";
import BugTable from "../bug-report/BugTable";
import BugTrackingMetrics from "../stats/BugTrackingMetrics";
import { X } from "lucide-react";

// Import utility functions
import {
    getStatusColor,
    getSeverityColor,
    getPriorityColor,
    getEnvironmentColor,
    getFrequencyColor,
    getSourceColor,
    getPriorityFromSeverity,
    formatDate,
    formatDateTime,
    getTeamMemberName,
    getAssignedUser,
    validateBugForm,
    getEvidenceCount,
    getShortBugId,
    isPastDue,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
    VALID_BUG_PRIORITIES,
    VALID_ENVIRONMENTS
} from "../../utils/bugUtils";

// Import metrics calculator
import { calculateBugMetrics, calculateBugMetricsWithTrends } from "../../utils/calculateBugMetrics";

// Default environments if not available in utils
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

const BugTracker = () => {
    const { activeProject, user, userProfile } = useProject();
    const [bugs, setBugs] = useState([]);
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [environments, setEnvironments] = useState(VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // Default to table view
    const [isUpdating, setIsUpdating] = useState(new Set()); // Track which bugs are being updated

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
        environment: "all",
        searchTerm: ""
    });

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        try {
            let date;
            if (timestamp?.toDate) {
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                date = new Date(timestamp);
            }

            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Use ref to track if metrics are being calculated to prevent loops
    const calculatingMetrics = useRef(false);

    // Calculate metrics whenever bugs change - with debouncing
    const currentMetrics = useMemo(() => {
        if (calculatingMetrics.current || bugs.length === 0) {
            return null;
        }

        try {
            calculatingMetrics.current = true;
            const metrics = calculateBugMetrics(bugs);
            return metrics;
        } catch (error) {
            console.error("Error calculating metrics:", error);
            return null;
        } finally {
            calculatingMetrics.current = false;
        }
    }, [bugs]);

    // Calculate historical metrics for trends (last 30 days vs previous 30 days)
    const metricsWithTrends = useMemo(() => {
        if (calculatingMetrics.current || bugs.length === 0) {
            return null;
        }

        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            const currentPeriodBugs = bugs.filter(bug => {
                const createdAt = bug.createdAt?.seconds ?
                    new Date(bug.createdAt.seconds * 1000) :
                    new Date(bug.createdAt);
                return createdAt >= thirtyDaysAgo;
            });

            const previousPeriodBugs = bugs.filter(bug => {
                const createdAt = bug.createdAt?.seconds ?
                    new Date(bug.createdAt.seconds * 1000) :
                    new Date(bug.createdAt);
                return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
            });

            return calculateBugMetricsWithTrends(currentPeriodBugs, previousPeriodBugs);
        } catch (error) {
            console.error("Error calculating trends:", error);
            return null;
        }
    }, [bugs]);

    // Debug function to log query details
    const debugQuery = useCallback((queryType, conditions) => {
        console.log(`[DEBUG] ${queryType} Query Conditions:`, conditions);
    }, []);

    // Fallback query function with better error handling
    const fallbackFetchBugs = useCallback(async () => {
        if (!user || !activeProject) return [];

        try {
            console.log("[DEBUG] Attempting fallback fetch for bugs...");

            const bugsRef = collection(db, "bugs");
            let bugsQuery;

            if (activeProject.organizationId) {
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
            throw error;
        }
    }, [user, activeProject, debugQuery]);

    const debugBugData = useCallback((bug) => {
        console.log('[DEBUG] Bug data structure:', {
            id: bug.id,
            title: bug.title,
            status: bug.status,
            severity: bug.severity,
            priority: bug.priority,
            environment: bug.environment,
            assignedTo: bug.assignedTo,
            createdAt: bug.createdAt,
            updatedAt: bug.updatedAt
        });

        console.log('[DEBUG] Valid values check:', {
            statusValid: VALID_BUG_STATUSES.includes(bug.status),
            severityValid: VALID_BUG_SEVERITIES.includes(bug.severity),
            priorityValid: VALID_BUG_PRIORITIES.includes(bug.priority || 'Medium')
        });
    }, []);

    // Enhanced update function with optimistic updates and error handling
    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        if (isUpdating.has(bugId)) {
            console.log(`[DEBUG] Update already in progress for bug ${bugId}`);
            return;
        }

        // Validate bugId
        if (!bugId || typeof bugId !== 'string') {
            throw new Error('Invalid bug ID provided');
        }

        // Validate updates object
        if (!updates || typeof updates !== 'object') {
            throw new Error('Invalid updates object provided');
        }

        // Remove any undefined or null values
        const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (updates[key] !== undefined && updates[key] !== null) {
                acc[key] = updates[key];
            }
            return acc;
        }, {});

        if (Object.keys(cleanUpdates).length === 0) {
            console.log(`[DEBUG] No valid updates provided for bug ${bugId}`);
            return;
        }

        setIsUpdating(prev => new Set(prev).add(bugId));

        try {
            console.log(`[DEBUG] Updating bug ${bugId} with:`, cleanUpdates);

            const bugRef = doc(db, "bugs", bugId);
            const updateData = {
                ...cleanUpdates,
                updatedAt: new Date()
            };

            // Validate specific fields before sending to Firestore
            if (updateData.status && !VALID_BUG_STATUSES.includes(updateData.status)) {
                throw new Error(`Invalid status: ${updateData.status}`);
            }
            if (updateData.severity && !VALID_BUG_SEVERITIES.includes(updateData.severity)) {
                throw new Error(`Invalid severity: ${updateData.severity}`);
            }
            if (updateData.priority && !VALID_BUG_PRIORITIES.includes(updateData.priority)) {
                throw new Error(`Invalid priority: ${updateData.priority}`);
            }

            // Optimistic update - update local state immediately
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === bugId
                        ? { ...bug, ...updateData }
                        : bug
                )
            );

            // Also update selectedBug if it's the one being updated
            setSelectedBug(prevSelected =>
                prevSelected && prevSelected.id === bugId
                    ? { ...prevSelected, ...updateData }
                    : prevSelected
            );

            // Update Firestore
            await updateDoc(bugRef, updateData);

            console.log(`[DEBUG] Bug ${bugId} updated successfully in Firestore`);

        } catch (error) {
            console.error(`[DEBUG] Error updating bug ${bugId}:`, error);
            console.error(`[DEBUG] Error details:`, {
                code: error.code,
                message: error.message,
                stack: error.stack
            });

            // Revert optimistic update on error
            setBugs(prevBugs => {
                // Refetch the original data or revert the changes
                return prevBugs.map(bug => {
                    if (bug.id === bugId) {
                        // Remove the failed updates by creating a clean copy without the failed fields
                        const revertedBug = { ...bug };
                        Object.keys(cleanUpdates).forEach(key => {
                            if (key !== 'updatedAt') {
                                // Try to revert to previous value or remove the field
                                delete revertedBug[key];
                            }
                        });
                        return revertedBug;
                    }
                    return bug;
                });
            });

            toast.error(`Failed to update bug: ${error.message}`);
            throw error;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set(prev);
                newSet.delete(bugId);
                return newSet;
            });
        }
    }, [isUpdating]);

    // Function to update bug status
    const updateBugStatus = useCallback(async (bugId, newStatus) => {
        // Validate status first
        if (!VALID_BUG_STATUSES.includes(newStatus)) {
            console.error(`[DEBUG] Invalid status attempted: ${newStatus}. Valid options:`, VALID_BUG_STATUSES);
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }

        try {
            console.log(`[DEBUG] Updating status for bug ${bugId} to:`, newStatus);

            const updates = {
                status: newStatus.trim() // Ensure no whitespace
            };

            // If resolving, add resolution timestamp
            if (newStatus === 'Resolved' || newStatus === 'Closed' || newStatus === 'Done') {
                updates.resolvedAt = new Date();
                updates.resolvedBy = user.uid;
            }

            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug status updated to ${newStatus}`);
        } catch (error) {
            console.error("[DEBUG] Error updating bug status:", error);
            toast.error("Failed to update bug status: " + error.message);
        }
    }, [updateBugInFirestore, user]);

    // Function to update bug severity
    const updateBugSeverity = useCallback(async (bugId, newSeverity, newPriority = null) => {
        // Validate severity first
        if (!VALID_BUG_SEVERITIES.includes(newSeverity)) {
            console.error(`[DEBUG] Invalid severity attempted: ${newSeverity}. Valid options:`, VALID_BUG_SEVERITIES);
            toast.error(`Invalid severity: ${newSeverity}`);
            return;
        }

        try {
            const updates = {
                severity: newSeverity.trim() // Ensure no whitespace
            };

            // Auto-determine priority if not provided
            const calculatedPriority = newPriority || getPriorityFromSeverity(newSeverity);

            // Validate the calculated priority
            if (calculatedPriority && VALID_BUG_PRIORITIES.includes(calculatedPriority)) {
                updates.priority = calculatedPriority.trim();
            } else {
                console.warn(`[DEBUG] Invalid priority calculated: ${calculatedPriority}. Valid options:`, VALID_BUG_PRIORITIES);
            }

            console.log(`[DEBUG] Updating severity for bug ${bugId}:`, updates);

            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug severity updated to ${newSeverity}`);
        } catch (error) {
            console.error("[DEBUG] Error updating bug severity:", error);
            toast.error("Failed to update bug severity: " + error.message);
        }
    }, [updateBugInFirestore]);

    // Function to update bug assignment
    const updateBugAssignment = useCallback(async (bugId, assignedTo) => {
        try {
            await updateBugInFirestore(bugId, { assignedTo });
            const assigneeName = assignedTo ? getTeamMemberName(assignedTo, teamMembers) : 'Unassigned';
            toast.success(`Bug assigned to ${assigneeName}`);
        } catch (error) {
            console.error("Error updating bug assignment:", error);
        }
    }, [updateBugInFirestore, teamMembers]);

    // Function to update bug environment
    const updateBugEnvironment = useCallback(async (bugId, newEnvironment) => {
        if (!environments.includes(newEnvironment)) {
            toast.error(`Invalid environment: ${newEnvironment}`);
            return;
        }

        try {
            await updateBugInFirestore(bugId, { environment: newEnvironment });
            toast.success(`Bug environment updated to ${newEnvironment}`);
        } catch (error) {
            console.error("Error updating bug environment:", error);
        }
    }, [updateBugInFirestore, environments]);

    // Function to update bug (for drag and drop and other updates)
    const updateBug = useCallback(async (updatedBug) => {
        try {
            const { id, createdAt, ...updateData } = updatedBug;
            await updateBugInFirestore(id, updateData);
            toast.success("Bug updated successfully");
        } catch (error) {
            console.error("Error updating bug:", error);
        }
    }, [updateBugInFirestore]);

    // Function to create sprint
    const createSprint = useCallback(async (sprintData) => {
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
    }, [activeProject, user]);

    // Bug selection functions for table view
    const toggleBugSelection = useCallback((bugId) => {
        setSelectedBugs(prev =>
            prev.includes(bugId)
                ? prev.filter(id => id !== bugId)
                : [...prev, bugId]
        );
    }, []);

    const toggleGroupSelection = useCallback(() => {
        if (selectedBugs.length === filteredBugs.length) {
            setSelectedBugs([]);
        } else {
            setSelectedBugs(filteredBugs.map(bug => bug.id));
        }
    }, [selectedBugs.length, filteredBugs]);

    const allGroupSelected = selectedBugs.length === filteredBugs.length && filteredBugs.length > 0;
    const isGroupSelected = selectedBugs.length > 0;

    // Drag and drop functions
    const handleDragStart = useCallback((e, bug) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(bug));
    }, []);

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
                            console.log("[DEBUG] Bug data:", { id: doc.id, title: data.title, status: data.status });
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
                        console.error("[DEBUG] Error in bugs listener:", error); // Fixed typo: was "onsole.error"
                        console.error("[DEBUG] Error code:", error.code);
                        console.error("[DEBUG] Error message:", error.message);

                        // Check if it's a compound query error
                        if (error.message?.includes('requires an index') ||
                            error.message?.includes('composite index')) {
                            console.log("[DEBUG] Compound query failed, falling back to basic query");

                            // Try without orderBy first
                            try {
                                const fallbackQuery = isOrgUser
                                    ? query(
                                        collection(db, "bugs"),
                                        where("organizationId", "==", activeProject.organizationId),
                                        where("projectId", "==", activeProject.id)
                                    )
                                    : query(
                                        collection(db, "bugs"),
                                        where("createdBy", "==", user.uid),
                                        where("projectId", "==", activeProject.id)
                                    );

                                const fallbackUnsubscribe = onSnapshot(
                                    fallbackQuery,
                                    (snapshot) => {
                                        console.log("[DEBUG] Fallback query successful. Docs:", snapshot.docs.length);
                                        const bugsData = snapshot.docs.map(doc => ({
                                            id: doc.id,
                                            ...doc.data()
                                        })).sort((a, b) => {
                                            // Manual client-side sorting by createdAt
                                            const aDate = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt);
                                            const bDate = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt);
                                            return bDate - aDate;
                                        });
                                        setBugs(bugsData);
                                        setError(null);
                                    },
                                    (fallbackError) => {
                                        console.error("[DEBUG] Fallback query also failed:", fallbackError);
                                        // Try manual fetch as last resort
                                        fallbackFetchBugs().catch(fetchError => {
                                            console.error("[DEBUG] All query methods failed:", fetchError);
                                            setError("Failed to load bugs. Please refresh the page.");
                                        });
                                    }
                                );

                                unsubscribers.push(fallbackUnsubscribe);
                                return;
                            } catch (fallbackError) {
                                console.error("[DEBUG] Fallback setup failed:", fallbackError);
                            }
                        }

                        // For other errors, try the manual fetch
                        fallbackFetchBugs().catch(fetchError => {
                            console.error("[DEBUG] Manual fetch also failed:", fetchError);
                            setError("Failed to load bugs. Please check your connection and refresh.");
                        });
                    }
                );

                unsubscribers.push(unsubscribeBugs);
            } catch (error) {
                console.error("[DEBUG] Error setting up bugs listener:", error);
                fallbackFetchBugs().catch(fetchError => {
                    console.error("[DEBUG] Fallback fetch failed:", fetchError);
                    setError("Failed to initialize bug tracking. Please refresh the page.");
                });
            }
        };

        // Setup team members listener
        const setupTeamMembersListener = () => {
            if (!isOrgUser) {
                console.log("[DEBUG] Skipping team members for individual user");
                return;
            }

            try {
                const membersRef = collection(db, "organizationMembers");
                const membersQuery = query(
                    membersRef,
                    where("organizationId", "==", activeProject.organizationId)
                );

                const unsubscribeMembers = onSnapshot(
                    membersQuery,
                    (snapshot) => {
                        const membersData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setTeamMembers(membersData);
                        console.log("[DEBUG] Team members loaded:", membersData.length);
                    },
                    (error) => {
                        console.error("[DEBUG] Error loading team members:", error);
                        setTeamMembers([]);
                    }
                );

                unsubscribers.push(unsubscribeMembers);
            } catch (error) {
                console.error("[DEBUG] Error setting up team members listener:", error);
            }
        };

        // Setup sprints listener
        const setupSprintsListener = () => {
            try {
                const sprintsRef = collection(db, "sprints");
                const sprintsQuery = isOrgUser
                    ? query(
                        sprintsRef,
                        where("organizationId", "==", activeProject.organizationId),
                        where("projectId", "==", activeProject.id)
                    )
                    : query(
                        sprintsRef,
                        where("createdBy", "==", user.uid),
                        where("projectId", "==", activeProject.id)
                    );

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
                        console.error("[DEBUG] Error loading sprints:", error);
                        setSprints([]);
                    }
                );

                unsubscribers.push(unsubscribeSprints);
            } catch (error) {
                console.error("[DEBUG] Error setting up sprints listener:", error);
            }
        };

        // Initialize all listeners
        setupBugsListener();
        setupTeamMembersListener();
        setupSprintsListener();

        // Cleanup function
        return () => {
            console.log("[DEBUG] Cleaning up listeners");
            unsubscribers.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error("[DEBUG] Error unsubscribing:", error);
                }
            });
        };
    }, [user, activeProject, debugQuery, fallbackFetchBugs]);

    // Filter bugs whenever bugs or filters change
    useEffect(() => {
        let filtered = [...bugs];

        // Apply filters
        if (filters.status !== "all") {
            filtered = filtered.filter(bug => bug.status === filters.status);
        }

        if (filters.severity !== "all") {
            filtered = filtered.filter(bug => bug.severity === filters.severity);
        }

        if (filters.assignedTo !== "all") {
            if (filters.assignedTo === "unassigned") {
                filtered = filtered.filter(bug => !bug.assignedTo);
            } else {
                filtered = filtered.filter(bug => bug.assignedTo === filters.assignedTo);
            }
        }

        if (filters.category !== "all") {
            filtered = filtered.filter(bug => bug.category === filters.category);
        }

        if (filters.sprint !== "all") {
            filtered = filtered.filter(bug => bug.sprintId === filters.sprint);
        }

        if (filters.environment !== "all") {
            filtered = filtered.filter(bug => bug.environment === filters.environment);
        }

        if (filters.dueDate !== "all") {
            const now = new Date();
            switch (filters.dueDate) {
                case "overdue":
                    filtered = filtered.filter(bug => isPastDue(bug.dueDate));
                    break;
                case "today":
                    filtered = filtered.filter(bug => {
                        if (!bug.dueDate) return false;
                        const dueDate = new Date(bug.dueDate);
                        return dueDate.toDateString() === now.toDateString();
                    });
                    break;
                case "week":
                    filtered = filtered.filter(bug => {
                        if (!bug.dueDate) return false;
                        const dueDate = new Date(bug.dueDate);
                        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return dueDate <= weekFromNow && dueDate >= now;
                    });
                    break;
                default:
                    break;
            }
        }

        if (filters.searchTerm.trim()) {
            const searchTerm = filters.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(bug =>
                bug.title?.toLowerCase().includes(searchTerm) ||
                bug.description?.toLowerCase().includes(searchTerm) ||
                bug.stepsToReproduce?.toLowerCase().includes(searchTerm) ||
                bug.category?.toLowerCase().includes(searchTerm) ||
                getShortBugId(bug.id).toLowerCase().includes(searchTerm)
            );
        }

        setFilteredBugs(filtered);
    }, [bugs, filters]);

    // Handle bug selection for details panel
    const handleBugSelect = useCallback((bug) => {
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    }, []);


    // Handle bulk actions
    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedBugs.length === 0) return;

        try {
            await Promise.all(
                selectedBugs.map(bugId => updateBugStatus(bugId, newStatus))
            );
            setSelectedBugs([]);
            toast.success(`Updated ${selectedBugs.length} bugs to ${newStatus}`);
        } catch (error) {
            console.error("Error updating bugs:", error);
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
            const assigneeName = assignedTo ? getTeamMemberName(assignedTo, teamMembers) : 'Unassigned';
            toast.success(`Assigned ${selectedBugs.length} bugs to ${assigneeName}`);
        } catch (error) {
            console.error("Error assigning bugs:", error);
            toast.error("Failed to assign bugs");
        }
    };

    if (!user || !activeProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex-shrink-0">
                <BugTrackerHeader
                    bugs={bugs}
                    filteredBugs={filteredBugs}
                    selectedBugs={selectedBugs}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    showMetrics={showMetrics}
                    setShowMetrics={setShowMetrics}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkAssignment={handleBulkAssignment}
                    teamMembers={teamMembers}
                />


                {/* Metrics Panel - part of sticky header */}
                {showMetrics && (
                    <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                        <BugTrackingMetrics
                            metrics={currentMetrics}
                            metricsWithTrends={metricsWithTrends}
                            bugs={bugs}
                            filteredBugs={filteredBugs}
                        />
                    </div>
                )}

                {/* Filters - part of sticky header */}
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

            {/* Main Content Area - scrollable */}
            <div className="flex-1 flex gap-6 overflow-hidden pt-6">
                {/* Bug List/Table - scrollable container */}
                <div className={`${showDetailsPanel ? "flex-1" : "w-auto"} overflow-auto bg-white rounded-lg border border-gray-200`}>
                    {viewMode === 'table' ? (
                        <BugTable
                            bugs={filteredBugs}
                            selectedBugs={selectedBugs}
                            onBugSelect={handleBugSelect}
                            onToggleSelection={toggleBugSelection}
                            onToggleGroupSelection={toggleGroupSelection}
                            allGroupSelected={allGroupSelected}
                            isGroupSelected={isGroupSelected}
                            // Fix: Update these prop names to match what BugTable expects
                            onUpdateBugStatus={updateBugStatus}       
                            onUpdateBugSeverity={updateBugSeverity}
                            onUpdateBugAssignment={updateBugAssignment}
                            onUpdateBugEnvironment={updateBugEnvironment} 
                            onDragStart={handleDragStart}
                            teamMembers={teamMembers}
                            environments={environments}
                            isUpdating={isUpdating}
                        />
                    ) : (
                        <BugList
                            bugs={filteredBugs}
                            selectedBug={selectedBug}
                            onBugSelect={handleBugSelect}
                            onUpdateBug={updateBug}
                            // Keep these as they are for BugList (assuming they work)
                            onUpdateStatus={updateBugStatus}
                            onUpdateSeverity={updateBugSeverity}
                            onUpdateAssignment={updateBugAssignment}
                            teamMembers={teamMembers}
                            environments={environments}
                            groupBy={groupBy}
                            subGroupBy={subGroupBy}
                            onDragStart={handleDragStart}
                        />
                    )}
                </div>

                {/* Details Panel - overlay on right side */}
                {showDetailsPanel && selectedBug && (
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