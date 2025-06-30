/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { toast } from "sonner";
import { useSuite } from "../context/SuiteContext";
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

// FIXED: Hook now accepts parameters with proper defaults
export const useBugTracker = ({ enabled = true, suite = null, user = null } = {}) => {
    // FIXED: Use parameters if provided, otherwise fall back to context
    const suiteContext = useSuite();
    const activeSuite = suite || suiteContext.activeSuite;
    const contextUser = user || suiteContext.user;
    
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
    const calculatingMetrics = useRef(false);

    // FIXED: Helper function to get the correct bugs collection path based on account type
    const getBugsCollectionPath = useCallback((suiteData) => {
        if (!suiteData || !suiteData.suite_id || !contextUser) {
            console.warn("Suite, suite_id, or user missing:", { suiteData, contextUser });
            return null;
        }
        
        if (suiteData.accountType === 'individual') {
            // FIXED: For individual accounts, always use the authenticated user's UID
            // The path structure in Firestore rules expects: /individualAccounts/{userId}/testSuites/{suiteId}/bugs
            return `individualAccounts/${contextUser.uid}/testSuites/${suiteData.suite_id}/bugs`;
        } else if (suiteData.accountType === 'organization') {
            // For organization accounts, orgId is required
            if (!suiteData.orgId) {
                console.error("Organization account missing orgId:", suiteData);
                return null;
            }
            return `organizations/${suiteData.orgId}/testSuites/${suiteData.suite_id}/bugs`;
        }
        
        console.error("Invalid or unsupported account type:", suiteData.accountType);
        return null;
    }, [contextUser]);

    // FIXED: Helper function to get the correct team members collection path
    const getTeamMembersCollectionPath = useCallback((suiteData) => {
        if (!suiteData || !contextUser) return null;
        
        // Only organizations have a members collection according to Firestore rules
        if (suiteData.accountType === 'organization' && suiteData.orgId) {
            return `organizations/${suiteData.orgId}/members`;
        }
        
        return null; // Individual accounts don't have a separate members collection
    }, [contextUser]);

    // FIXED: Helper function to get sprints collection path
    const getSprintsCollectionPath = useCallback((suiteData) => {
        if (!suiteData || !suiteData.suite_id || !contextUser) return null;
        
        if (suiteData.accountType === 'individual') {
            // FIXED: Use authenticated user's UID directly
            return `individualAccounts/${contextUser.uid}/testSuites/${suiteData.suite_id}/sprints`;
        } else if (suiteData.accountType === 'organization') {
            if (!suiteData.orgId) return null;
            return `organizations/${suiteData.orgId}/testSuites/${suiteData.suite_id}/sprints`;
        }
        
        return null;
    }, [contextUser]);

    // FIXED: Validation function to ensure user has access to the suite
    const validateSuiteAccess = useCallback((suiteData) => {
        if (!suiteData || !contextUser) {
            console.log("Missing suite or user for validation:", { suiteData, contextUser });
            return false;
        }
        
        if (suiteData.accountType === 'individual') {
            // FIXED: For individual accounts, the authenticated user must match the path
            // Since we're using contextUser.uid in the path, this should always be true for individual accounts
            return true;
        } else if (suiteData.accountType === 'organization') {
            // For organization accounts, user must be a member (this will be validated by Firestore rules)
            return suiteData.orgId && contextUser.uid;
        }
        
        return false;
    }, [contextUser]);

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
        if (isUpdating.has(bugId) || !bugId || !updates || !activeSuite) return;

        // Validate suite access before attempting update
        if (!validateSuiteAccess(activeSuite)) {
            toast.error("You don't have permission to access this suite");
            return;
        }

        const bugsCollectionPath = getBugsCollectionPath(activeSuite);
        if (!bugsCollectionPath) {
            toast.error("Invalid suite configuration");
            return;
        }

        const cleanUpdates = Object.keys(updates).reduce((acc, key) => {
            if (updates[key] !== undefined && updates[key] !== null) {
                acc[key] = updates[key];
            }
            return acc;
        }, {});

        if (Object.keys(cleanUpdates).length === 0) return;

        setIsUpdating(prev => new Set(prev).add(bugId));

        try {
            const bugRef = doc(db, bugsCollectionPath, bugId);
            const updateData = { 
                ...cleanUpdates, 
                updated_at: new Date(),
                // Ensure we track who made the update
                updated_by: contextUser.uid
            };

            // Validate fields against allowed values
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

            // Optimistic update for better UX
            setBugs(prevBugs =>
                prevBugs.map(bug =>
                    bug.id === bugId ? { ...bug, ...updateData } : bug
                )
            );

            await updateDoc(bugRef, updateData);
        } catch (error) {
            console.error("Error updating bug:", error);
            
            // Revert optimistic update on error
            setBugs(prevBugs =>
                prevBugs.map(bug => {
                    if (bug.id === bugId) {
                        const revertedBug = { ...bug };
                        Object.keys(cleanUpdates).forEach(key => {
                            if (key !== 'updated_at' && key !== 'updated_by') {
                                // Only revert if this was a new field, not an existing one being updated
                                if (!(key in bug)) {
                                    delete revertedBug[key];
                                }
                            }
                        });
                        return revertedBug;
                    }
                    return bug;
                })
            );
            
            // Handle permission errors specifically
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
    }, [isUpdating, activeSuite, getBugsCollectionPath, validateSuiteAccess, environments, contextUser]);

    const updateBugStatus = useCallback(async (bugId, newStatus) => {
        if (!VALID_BUG_STATUSES.includes(newStatus)) {
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }

        try {
            const updates = { status: newStatus.trim() };

            // Add resolution tracking for completed statuses
            if (['Resolved', 'Closed', 'Done'].includes(newStatus)) {
                updates.resolved_at = new Date();
                updates.resolved_by = contextUser.uid;
            }

            await updateBugInFirestore(bugId, updates);
            toast.success(`Bug status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating bug status:", error);
            // Error toast is handled by updateBugInFirestore
        }
    }, [updateBugInFirestore, contextUser]);

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
            console.error("Error updating bug severity:", error);
            // Error toast is handled by updateBugInFirestore
        }
    }, [updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, assignedTo) => {
        try {
            await updateBugInFirestore(bugId, { assigned_to: assignedTo });
            const assigneeName = assignedTo ? getTeamMemberName(assignedTo, teamMembers) : 'Unassigned';
            toast.success(`Bug assigned to ${assigneeName}`);
        } catch (error) {
            console.error("Error updating bug assignment:", error);
            // Error toast is handled by updateBugInFirestore
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
            // Error toast is handled by updateBugInFirestore
        }
    }, [updateBugInFirestore, environments]);

    const updateBug = useCallback(async (updatedBug) => {
        try {
            const { id, created_at, created_by, ...updateData } = updatedBug;
            
            // Don't allow updating creation metadata
            await updateBugInFirestore(id, updateData);
            toast.success("Bug updated successfully");
        } catch (error) {
            console.error("Error updating bug:", error);
            // Error toast is handled by updateBugInFirestore
        }
    }, [updateBugInFirestore]);

    const updateBugTitle = useCallback(async (bugId, newTitle) => {
        try {
            await updateBugInFirestore(bugId, { title: newTitle });
            toast.success("Bug title updated successfully");
        } catch (error) {
            console.error("Error updating bug title:", error);
            // Error toast is handled by updateBugInFirestore
        }
    }, [updateBugInFirestore]);

    const createSprint = useCallback(async (sprintData) => {
        if (!activeSuite || !contextUser) {
            toast.error("No active suite selected or user not authenticated");
            return;
        }

        if (!validateSuiteAccess(activeSuite)) {
            toast.error("You don't have permission to create sprints in this suite");
            return;
        }

        try {
            const sprintCollectionPath = getSprintsCollectionPath(activeSuite);
            if (!sprintCollectionPath) {
                throw new Error("Invalid suite configuration for sprints");
            }

            const sprintRef = collection(db, sprintCollectionPath);
            const newSprint = {
                ...sprintData,
                suite_id: activeSuite.suite_id,
                account_type: activeSuite.accountType,
                // FIXED: Add correct context based on account type
                ...(activeSuite.accountType === 'organization' && { org_id: activeSuite.orgId }),
                ...(activeSuite.accountType === 'individual' && { user_id: contextUser.uid }),
                created_by: contextUser.uid,
                created_at: new Date(),
                updated_at: new Date()
            };

            const docRef = await addDoc(sprintRef, newSprint);
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
    }, [activeSuite, contextUser, validateSuiteAccess, getSprintsCollectionPath]);

    // Refetch function with proper error handling
    const refetchBugs = useCallback(async () => {
        if (!activeSuite || !contextUser) {
            console.warn("Cannot refetch bugs: missing activeSuite or user");
            return;
        }

        if (!validateSuiteAccess(activeSuite)) {
            setError("You don't have permission to access this suite");
            return;
        }

        const bugsCollectionPath = getBugsCollectionPath(activeSuite);
        if (!bugsCollectionPath) {
            setError("Invalid suite configuration");
            return;
        }

        setLoading(true);
        try {
            const bugsRef = collection(db, bugsCollectionPath);
            const bugsQuery = query(bugsRef, orderBy("created_at", "desc"));
            const snapshot = await getDocs(bugsQuery);
            
            const bugsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate(),
                updated_at: doc.data().updated_at?.toDate()
            }));
            
            setBugs(bugsData);
            setError(null);
        } catch (error) {
            console.error("Error refetching bugs:", error);
            if (error.code === 'permission-denied') {
                setError("You don't have permission to access bugs in this suite");
            } else {
                setError(`Failed to refresh bugs: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [activeSuite, contextUser, getBugsCollectionPath, validateSuiteAccess]);

    // FIXED: Real-time listeners with proper enabled check and parameter validation
    useEffect(() => {
        // FIXED: Check enabled flag first
        if (!enabled) {
            console.log("BugTracker hook disabled");
            return;
        }

        // FIXED: Better validation with more detailed logging
        if (!contextUser || !activeSuite) {
            console.log("BugTracker prerequisites not met:", {
                user: !!contextUser,
                userUid: contextUser?.uid,
                activeSuite: !!activeSuite,
                suiteId: activeSuite?.suite_id,
                accountType: activeSuite?.accountType
            });
            setError("Suite or user not loaded. Please ensure you are logged in and have an active suite selected.");
            setBugs([]);
            setTeamMembers([]);
            setSprints([]);
            return;
        }

        if (!validateSuiteAccess(activeSuite)) {
            console.log("Suite access validation failed:", {
                suite: activeSuite,
                user: contextUser
            });
            setError("You don't have permission to access this suite");
            setBugs([]);
            setTeamMembers([]);
            setSprints([]);
            return;
        }

        const unsubscribers = [];
        setError(null);
        setLoading(true);

        console.log("Setting up BugTracker listeners for:", {
            suiteId: activeSuite.suite_id,
            accountType: activeSuite.accountType,
            userUid: contextUser.uid
        });

        // FIXED: Bugs listener with better error handling
        try {
            const bugsCollectionPath = getBugsCollectionPath(activeSuite);
            if (!bugsCollectionPath) {
                throw new Error("Invalid suite configuration for bugs");
            }

            console.log("Bugs collection path:", bugsCollectionPath);

            const bugsRef = collection(db, bugsCollectionPath);
            const bugsQuery = query(bugsRef, orderBy("created_at", "desc"));

            const unsubscribeBugs = onSnapshot(
                bugsQuery,
                (snapshot) => {
                    const bugsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        created_at: doc.data().created_at?.toDate(),
                        updated_at: doc.data().updated_at?.toDate()
                    }));
                    console.log(`Loaded ${bugsData.length} bugs from Firestore`);
                    setBugs(bugsData);
                    setError(null);
                    setLoading(false);
                },
                (err) => {
                    console.error("Firestore onSnapshot (bugs) error:", err);
                    console.error("Error details:", {
                        code: err.code,
                        message: err.message,
                        path: bugsCollectionPath
                    });
                    setLoading(false);
                    if (err.code === 'permission-denied') {
                        setError("You don't have permission to access bugs in this suite");
                    } else {
                        setError("Failed to load bugs. Please check your internet connection and try again.");
                    }
                    setBugs([]);
                }
            );

            unsubscribers.push(unsubscribeBugs);
        } catch (error) {
            console.error("Error setting up bug listener:", error);
            setLoading(false);
            setError("Failed to initialize bug tracking. Please try refreshing the page.");
        }

        // Team members listener
        try {
            if (activeSuite.accountType === 'organization') {
                const membersCollectionPath = getTeamMembersCollectionPath(activeSuite);
                if (membersCollectionPath) {
                    const membersRef = collection(db, membersCollectionPath);
                    const unsubscribeMembers = onSnapshot(
                        membersRef,
                        (snapshot) => {
                            const membersData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setTeamMembers(membersData);
                        },
                        (err) => {
                            console.error("Firestore onSnapshot (teamMembers) error:", err);
                            // Don't show error for team members as it's not critical
                            setTeamMembers([]);
                        }
                    );
                    unsubscribers.push(unsubscribeMembers);
                }
            } else {
                // For individual accounts, set user as the only team member
                setTeamMembers([{
                    id: contextUser.uid,
                    name: contextUser.displayName || contextUser.email || 'You',
                    email: contextUser.email,
                    role: 'Owner'
                }]);
            }
        } catch (error) {
            console.error("Error setting up team members listener:", error);
            setTeamMembers([]);
        }

        // Sprints listener
        try {
            const sprintsCollectionPath = getSprintsCollectionPath(activeSuite);
            if (sprintsCollectionPath) {
                const sprintsRef = collection(db, sprintsCollectionPath);
                const sprintsQuery = query(sprintsRef, orderBy("created_at", "desc"));

                const unsubscribeSprints = onSnapshot(
                    sprintsQuery,
                    (snapshot) => {
                        const sprintsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            created_at: doc.data().created_at?.toDate(),
                            updated_at: doc.data().updated_at?.toDate()
                        }));
                        setSprints(sprintsData);
                    },
                    (err) => {
                        console.error("Firestore onSnapshot (sprints) error:", err);
                        setSprints([]);
                    }
                );
                unsubscribers.push(unsubscribeSprints);
            }
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
    }, [enabled, contextUser, activeSuite, getBugsCollectionPath, getTeamMembersCollectionPath, getSprintsCollectionPath, validateSuiteAccess]);

    // Filter bugs based on current filters
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
                filtered = filtered.filter(bug => !bug.assigned_to);
            } else {
                filtered = filtered.filter(bug => bug.assigned_to === filters.assignedTo);
            }
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
        currentMetrics,
        metricsWithTrends,
        isUpdating,
        error,
        loading,
        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBug,
        updateBugTitle,
        createSprint,
        formatDate,
        refetchBugs,
        // Additional utilities that can be helpful
        validateSuiteAccess
    };
};