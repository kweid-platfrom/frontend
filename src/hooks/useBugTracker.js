import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useApp } from "../contexts/AppProvider";
import firestoreService from "../services/firestoreService";
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

const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

export const useBugTracker = ({ enabled = true, suite = null, user = null } = {}) => {
    const { activeSuite: contextSuite, user: contextUser, userCapabilities, isAuthenticated } = useApp();
    const activeSuite = suite || contextSuite;
    const currentUser = user || contextUser;

    const [bugs, setBugs] = useState([]);
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [environments] = useState(VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
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

    // Helper to get collection paths
    const getBugsCollectionPath = useCallback(() => {
        if (!activeSuite?.suite_id || !currentUser) {
            console.warn("Missing suite or user:", { activeSuite, currentUser });
            return null;
        }
        if (activeSuite.accountType === 'individual') {
            return `individualAccounts/${currentUser.uid}/testSuites/${activeSuite.suite_id}/bugs`;
        } else if (activeSuite.accountType === 'organization' && activeSuite.orgId) {
            return `organizations/${activeSuite.orgId}/testSuites/${activeSuite.suite_id}/bugs`;
        }
        console.error("Invalid account type or missing orgId:", activeSuite);
        return null;
    }, [activeSuite, currentUser]);

    const getTeamMembersCollectionPath = useCallback(() => {
        if (activeSuite?.accountType !== 'organization' || !activeSuite.orgId) return null;
        return `organizations/${activeSuite.orgId}/members`;
    }, [activeSuite]);

    const getSprintsCollectionPath = useCallback(() => {
        if (!activeSuite?.suite_id || !currentUser) return null;
        if (activeSuite.accountType === 'individual') {
            return `individualAccounts/${currentUser.uid}/testSuites/${activeSuite.suite_id}/sprints`;
        } else if (activeSuite.accountType === 'organization' && activeSuite.orgId) {
            return `organizations/${activeSuite.orgId}/testSuites/${activeSuite.suite_id}/sprints`;
        }
        return null;
    }, [activeSuite, currentUser]);

    // Validate suite access
    const validateSuiteAccess = useCallback(() => {
        if (!activeSuite || !currentUser || !isAuthenticated) return false;
        if (!userCapabilities.canAccessBugs) {
            console.log("User lacks bug access permissions:", currentUser.uid);
            return false;
        }
        return true;
    }, [activeSuite, currentUser, isAuthenticated, userCapabilities]);

    // Format date
    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

    // Update bug in Firestore
    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        if (isUpdating.has(bugId) || !bugId || !updates || !activeSuite || !userCapabilities.canCreateBugs) {
            toast.error("Cannot update bug: Invalid parameters or insufficient permissions");
            return;
        }

        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            toast.error("Invalid suite configuration");
            return;
        }

        const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (updates[key] !== undefined && updates[key] !== null) acc[key] = updates[key];
            return acc;
        }, {});

        if (Object.keys(cleanUpdates).length === 0) return;

        setIsUpdating(prev => new Set(prev).add(bugId));

        try {
            const updateData = {
                ...cleanUpdates,
                updated_at: new Date(),
                updated_by: currentUser.uid
            };

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
            if (updateData.environment && !environments.includes(updateData.environment)) {
                throw new Error(`Invalid environment: ${updateData.environment}`);
            }

            // Optimistic update
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === bugId ? { ...bug, ...updateData } : bug
                )
            );

            await firestoreService.updateDocument(`${bugsCollectionPath}/${bugId}`, updateData);
            toast.success("Bug updated successfully");
        } catch (error) {
            console.error("Error updating bug:", error);
            setBugs(prevBugs =>
                prevBugs.map(bug => {
                    if (bug.id === bugId) {
                        const revertedBug = { ...bug };
                        Object.keys(cleanUpdates).forEach(key => {
                            if (key !== 'updated_at' && key !== 'updated_by' && !(key in bug)) {
                                delete revertedBug[key];
                            }
                        });
                        return revertedBug;
                    }
                    return bug;
                })
            );
            if (error.code === 'permission-denied') {
                toast.error("You don't have permission to update this bug");
            } else {
                toast.error(`Failed to update bug: ${error.message}`);
            }
            throw error;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set(prev);
                newSet.delete(bugId);
                return newSet;
            });
        }
    }, [isUpdating, activeSuite, currentUser, userCapabilities, getBugsCollectionPath, environments]);

    // Bug management functions
    const updateBugStatus = useCallback(async (bugId, newStatus) => {
        if (!VALID_BUG_STATUSES.includes(newStatus)) {
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }
        try {
            const updates = {
                status: newStatus.trim(),
                ...(newStatus === 'Resolved' || newStatus === 'Closed' || newStatus === 'Done'
                    ? { resolved_at: new Date(), resolved_by: currentUser.uid }
                    : {})
            };
            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating bug status:", error);
        }
    }, [updateBugInFirestore, currentUser]);

    const updateBugSeverity = useCallback(async (bugId, newSeverity, newPriority = null) => {
        if (!VALID_BUG_SEVERITIES.includes(newSeverity)) {
            toast.error(`Invalid severity: ${newSeverity}`);
            return;
        }
        try {
            const updates = {
                severity: newSeverity.trim(),
                ...(newPriority && VALID_BUG_PRIORITIES.includes(newPriority)
                    ? { priority: newPriority.trim() }
                    : { priority: getPriorityFromSeverity(newSeverity).trim() })
            };
            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug severity updated to ${newSeverity}`);
        } catch (error) {
            console.error("Error updating bug severity:", error);
        }
    }, [updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, assignedTo) => {
        try {
            await updateBugInFirestore(bugId, { assigned_to: assignedTo });
            const assigneeName = assignedTo ? getTeamMemberName(assignedTo, teamMembers) : 'Unassigned';
            toast.success(`Bug assigned to ${assigneeName}`);
        } catch (error) {
            console.error("Error updating bug assignment:", error);
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
            console.error("Error updating bug environment:", error);
        }
    }, [updateBugInFirestore, environments]);

    const updateBug = useCallback(async (updatedBug) => {
        try {
            const { id, ...updateData } = updatedBug;
            await updateBugInFirestore(id, updateData);
            toast.success("Bug updated successfully");
        } catch (error) {
            console.error("Error updating bug:", error);
        }
    }, [updateBugInFirestore]);

    const updateBugTitle = useCallback(async (bugId, newTitle) => {
        try {
            await updateBugInFirestore(bugId, { title: newTitle });
            toast.success("Bug title updated successfully");
        } catch (error) {
            console.error("Error updating bug title:", error);
        }
    }, [updateBugInFirestore]);

    // Create sprint
    const createSprint = useCallback(async (sprintData) => {
        if (!activeSuite || !currentUser || !userCapabilities.canCreateBugs) {
            toast.error("No active suite selected or insufficient permissions");
            return;
        }

        const sprintCollectionPath = getSprintsCollectionPath();
        if (!sprintCollectionPath) {
            toast.error("Invalid suite configuration");
            return;
        }

        try {
            const newSprint = {
                ...sprintData,
                suite_id: activeSuite.suite_id,
                account_type: activeSuite.accountType,
                ...(activeSuite.accountType === 'organization' && { org_id: activeSuite.orgId }),
                ...(activeSuite.accountType === 'individual' && { user_id: currentUser.uid }),
                created_by: currentUser.uid,
                created_at: new Date(),
                updated_at: new Date()
            };
            const docRef = await firestoreService.createDocument(sprintCollectionPath, newSprint);
            toast.success("Sprint created successfully");
            return docRef.id;
        } catch (error) {
            console.error("Error creating sprint:", error);
            if (error.code === 'permission-denied') {
                toast.error("You don't have permission to create sprints");
            } else {
                toast.error(`Failed to create sprint: ${error.message}`);
            }
            throw error;
        }
    }, [activeSuite, currentUser, userCapabilities, getSprintsCollectionPath]);

    // Refetch bugs
    const refetchBugs = useCallback(async () => {
        if (!validateSuiteAccess()) {
            setError("You don't have permission to access this suite");
            return;
        }

        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            setError("Invalid suite configuration");
            return;
        }

        setLoading(true);
        try {
            const bugsData = await firestoreService.queryDocuments(bugsCollectionPath, [
                { field: 'created_at', direction: 'desc' }
            ]);
            setBugs(bugsData.map(doc => ({
                id: doc.id,
                ...doc,
                created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
            })));
            setError(null);
        } catch (error) {
            console.error("Error refetching bugs:", error);
            setError(error.code === 'permission-denied'
                ? "You don't have permission to access bugs in this suite"
                : `Failed to refresh bugs: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [getBugsCollectionPath, validateSuiteAccess]);

    // Real-time listeners
    useEffect(() => {
        if (!enabled || !validateSuiteAccess()) {
            setError("Bug tracking disabled or you lack permission to access this suite");
            setBugs([]);
            setTeamMembers([]);
            setSprints([]);
            return;
        }

        setLoading(true);
        const unsubscribers = [];

        // Bugs subscription
        const bugsCollectionPath = getBugsCollectionPath();
        if (bugsCollectionPath) {
            const unsubscribeBugs = firestoreService.subscribeDocuments(
                bugsCollectionPath,
                [{ field: 'created_at', direction: 'desc' }],
                (snapshot) => {
                    const bugsData = snapshot.map(doc => ({
                        id: doc.id,
                        ...doc,
                        created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                        updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                    }));
                    console.log(`Loaded ${bugsData.length} bugs from Firestore`);
                    setBugs(bugsData);
                    setError(null);
                    setLoading(false);
                },
                (err) => {
                    console.error("Firestore subscription error (bugs):", err);
                    setError(err.code === 'permission-denied'
                        ? "You don't have permission to access bugs in this suite"
                        : "Failed to load bugs. Please check your internet connection.");
                    setBugs([]);
                    setLoading(false);
                }
            );
            unsubscribers.push(unsubscribeBugs);
        }

        // Team members subscription
        if (activeSuite?.accountType === 'organization') {
            const membersCollectionPath = getTeamMembersCollectionPath();
            if (membersCollectionPath) {
                const unsubscribeMembers = firestoreService.subscribeDocuments(
                    membersCollectionPath,
                    [],
                    (snapshot) => {
                        setTeamMembers(snapshot.map(doc => ({ id: doc.id, ...doc })));
                    },
                    (err) => {
                        console.error("Firestore subscription error (teamMembers):", err);
                        setTeamMembers([]);
                    }
                );
                unsubscribers.push(unsubscribeMembers);
            }
        } else {
            setTeamMembers([{
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email || 'You',
                email: currentUser.email,
                role: 'Owner'
            }]);
        }

        // Sprints subscription
        const sprintsCollectionPath = getSprintsCollectionPath();
        if (sprintsCollectionPath) {
            const unsubscribeSprints = firestoreService.subscribeDocuments(
                sprintsCollectionPath,
                [{ field: 'created_at', direction: 'desc' }],
                (snapshot) => {
                    setSprints(snapshot.map(doc => ({
                        id: doc.id,
                        ...doc,
                        created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                        updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                    })));
                },
                (err) => {
                    console.error("Firestore subscription error (sprints):", err);
                    setSprints([]);
                }
            );
            unsubscribers.push(unsubscribeSprints);
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
    }, [enabled, activeSuite, currentUser, validateSuiteAccess, getBugsCollectionPath, getTeamMembersCollectionPath, getSprintsCollectionPath]);

    // Client-side filtering
    useEffect(() => {
        let filtered = [...bugs];

        if (filters.status !== "all") {
            filtered = filtered.filter(bug => bug.status === filters.status);
        }
        if (filters.severity !== "all") {
            filtered = filtered.filter(bug => bug.severity === filters.severity);
        }
        if (filters.assignedTo !== "all") {
            filtered = filtered.filter(bug => filters.assignedTo === "unassigned" ? !bug.assigned_to : bug.assigned_to === filters.assignedTo);
        }
        if (filters.category !== "all") {
            filtered = filtered.filter(bug => bug.category === filters.category);
        }
        if (filters.sprint !== "all") {
            filtered = filtered.filter(bug => bug.sprint_id === filters.sprint);
        }
        if (filters.environment !== "all") {
            filtered = filtered.filter(bug => bug.environment === filters.environment);
        }
        if (filters.dueDate !== "all") {
            const now = new Date();
            switch (filters.dueDate) {
                case "overdue":
                    filtered = filtered.filter(bug => bug.due_date && isPastDue(bug.due_date));
                    break;
                case "today":
                    filtered = filtered.filter(bug => {
                        if (!bug.due_date) return false;
                        const dueDate = new Date(bug.due_date);
                        return dueDate.toDateString() === now.toDateString();
                    });
                    break;
                case "week":
                    filtered = filtered.filter(bug => {
                        if (!bug.due_date) return false;
                        const dueDate = new Date(bug.due_date);
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
                bug.steps_to_reproduce?.toLowerCase().includes(searchTerm) ||
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
        error,
        loading,
        isUpdating,
        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBug,
        updateBugTitle,
        createSprint,
        formatDate,
        refetchBugs,
        validateSuiteAccess
    };
};