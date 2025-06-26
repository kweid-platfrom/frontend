/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "sonner";
import { useProject } from "../context/SuiteContext";
import {
    getTeamMemberName,
    getPriorityFromSeverity,
    getShortBugId,
    isPastDue,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
    VALID_BUG_PRIORITIES,
    VALID_ENVIRONMENTS
} from "../utils/bugUtils";
import { calculateBugMetrics, calculateBugMetricsWithTrends } from "../utils/calculateBugMetrics";

const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

export const useBugTracker = () => {
    const { activeProject, user } = useProject();
    const [bugs, setBugs] = useState([]);
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [environments] = useState(VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(new Set());
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
    const calculatingMetrics = useRef(false);

    const currentMetrics = useMemo(() => {
        if (calculatingMetrics.current || bugs.length === 0) return null;

        try {
            calculatingMetrics.current = true;
            return calculateBugMetrics(bugs);
        } catch (error) {
            console.error("Error calculating current metrics:", error);
            return null;
        } finally {
            calculatingMetrics.current = false;
        }
    }, [bugs]);

    const metricsWithTrends = useMemo(() => {
        if (calculatingMetrics.current || bugs.length === 0) return null;

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
            console.error("Error calculating metrics with trends:", error);
            return null;
        }
    }, [bugs]);

    const formatDate = useCallback((timestamp) => {
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
            console.error("Error formatting date:", timestamp, error);
            return 'Invalid Date';
        }
    }, []);

    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        if (isUpdating.has(bugId) || !bugId || !updates || !activeProject?.id) return;

        const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (updates[key] !== undefined && updates[key] !== null) {
                acc[key] = updates[key];
            }
            return acc;
        }, {});

        if (Object.keys(cleanUpdates).length === 0) return;

        setIsUpdating(prev => new Set(prev).add(bugId));

        try {
            // Update the bug in the subcollection: projects/{projectId}/bugs/{bugId}
            const bugRef = doc(db, "projects", activeProject.id, "bugs", bugId);
            const updateData = { ...cleanUpdates, updatedAt: new Date() };

            // Validate fields
            if (updateData.status && !VALID_BUG_STATUSES.includes(updateData.status)) {
                throw new Error(`Invalid status: ${updateData.status}`);
            }
            if (updateData.severity && !VALID_BUG_SEVERITIES.includes(updateData.severity)) {
                throw new Error(`Invalid severity: ${updateData.severity}`);
            }
            if (updateData.priority && !VALID_BUG_PRIORITIES.includes(updateData.priority)) {
                throw new Error(`Invalid priority: ${updateData.priority}`);
            }

            // Optimistic update
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === bugId ? { ...bug, ...updateData } : bug
                )
            );

            await updateDoc(bugRef, updateData);
        } catch (error) {
            // Revert on error
            setBugs(prevBugs =>
                prevBugs.map(bug => {
                    if (bug.id === bugId) {
                        const revertedBug = { ...bug };
                        Object.keys(cleanUpdates).forEach(key => {
                            if (key !== 'updatedAt') {
                                delete revertedBug[key];
                            }
                        });
                        return revertedBug;
                    }
                    return bug;
                })
            );
            toast.error(`Failed to update bug: ${error.message}`);
            throw error;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set(prev);
                newSet.delete(bugId);
                return newSet;
            });
        }
    }, [isUpdating, activeProject?.id]);

    const updateBugStatus = useCallback(async (bugId, newStatus) => {
        if (!VALID_BUG_STATUSES.includes(newStatus)) {
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }

        try {
            const updates = { status: newStatus.trim() };

            if (newStatus === 'Resolved' || newStatus === 'Closed' || newStatus === 'Done') {
                updates.resolvedAt = new Date();
                updates.resolvedBy = user.uid;
            }

            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug status updated to ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update bug status");
        }
    }, [updateBugInFirestore, user]);

    const updateBugSeverity = useCallback(async (bugId, newSeverity, newPriority = null) => {
        if (!VALID_BUG_SEVERITIES.includes(newSeverity)) {
            toast.error(`Invalid severity: ${newSeverity}`);
            return;
        }

        try {
            const updates = { severity: newSeverity.trim() };
            const calculatedPriority = newPriority || getPriorityFromSeverity(newSeverity);

            if (calculatedPriority && VALID_BUG_PRIORITIES.includes(calculatedPriority)) {
                updates.priority = calculatedPriority.trim();
            }

            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug severity updated to ${newSeverity}`);
        } catch (error) {
            toast.error("Failed to update bug severity");
        }
    }, [updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, assignedTo) => {
        try {
            await updateBugInFirestore(bugId, { assignedTo });
            const assigneeName = assignedTo ? getTeamMemberName(assignedTo, teamMembers) : 'Unassigned';
            toast.success(`Bug assigned to ${assigneeName}`);
        } catch (error) {
            toast.error("Failed to update assignment");
        }
    }, [updateBugInFirestore, teamMembers]);

    const updateBugEnvironment = useCallback(async (bugId, newEnvironment) => {
        if (!environments.includes(newEnvironment)) {
            toast.error(`Invalid environment: ${newEnvironment}`);
            return;
        }

        try {
            await updateBugInFirestore(bugId, { environment: newEnvironment });
            toast.success(`Bug environment updated to ${newEnvironment}`);
        } catch (error) {
            toast.error("Failed to update environment");
        }
    }, [updateBugInFirestore, environments]);

    const updateBug = useCallback(async (updatedBug) => {
        try {
            const { id, createdAt, ...updateData } = updatedBug;
            await updateBugInFirestore(id, updateData);
            toast.success("Bug updated successfully");
        } catch (error) {
            toast.error("Failed to update bug");
        }
    }, [updateBugInFirestore]);

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
            toast.error("Failed to create sprint");
            throw error;
        }
    }, [activeProject, user]);

    // Real-time listeners
    useEffect(() => {
        if (!user || !activeProject?.id) {
            setError("Project or user not loaded. Please ensure you are logged in and have an active project selected.");
            return;
        }

        const unsubscribers = [];
        setError(null);

        // Bugs listener - Updated to use subcollection
        try {
            const bugsRef = collection(db, "projects", activeProject.id, "bugs");
            const bugsQuery = query(bugsRef, orderBy("createdAt", "desc"));

            const unsubscribeBugs = onSnapshot(
                bugsQuery,
                (snapshot) => {
                    const bugsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate(),
                        updatedAt: doc.data().updatedAt?.toDate()
                    }));
                    setBugs(bugsData);
                    setError(null);
                },
                (err) => {
                    console.error("Firestore onSnapshot (bugs) error:", err);
                    setError("Failed to load bugs. Please check your internet connection and permissions.");
                }
            );

            unsubscribers.push(unsubscribeBugs);
        } catch (error) {
            console.error("Error setting up bug listener:", error);
            setError("Failed to initialize bug tracking. Ensure Firebase is configured correctly.");
        }

        // Team members listener - Only if organization exists
        if (activeProject.organizationId) {
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
                    },
                    (err) => {
                        console.error("Firestore onSnapshot (teamMembers) error:", err);
                        setTeamMembers([]);
                    }
                );
                unsubscribers.push(unsubscribeMembers);
            } catch (error) {
                console.error("Error setting up team members listener:", error);
                setTeamMembers([]);
            }
        } else {
            // For personal projects, set user as the only team member
            setTeamMembers([{
                id: user.uid,
                name: user.displayName || user.email,
                email: user.email
            }]);
        }

        // Sprints listener - Updated to use project-based query
        try {
            const sprintsRef = collection(db, "sprints");
            const sprintsQuery = query(
                sprintsRef,
                where("projectId", "==", activeProject.id),
                orderBy("createdAt", "desc")
            );

            const unsubscribeSprints = onSnapshot(
                sprintsQuery,
                (snapshot) => {
                    const sprintsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setSprints(sprintsData);
                },
                (err) => {
                    console.error("Firestore onSnapshot (sprints) error:", err);
                    setSprints([]);
                }
            );
            unsubscribers.push(unsubscribeSprints);
        } catch (error) {
            console.error("Error setting up sprints listener:", error);
            setSprints([]);
        }

        return () => {
            unsubscribers.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.warn("Error unsubscribing Firebase listener:", error);
                }
            });
        };
    }, [user, activeProject]);

    // Filter bugs
    useEffect(() => {
        let filtered = [...bugs];

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

    return {
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
    };
};