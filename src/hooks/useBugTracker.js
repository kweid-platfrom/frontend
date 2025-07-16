import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppProvider';
import firestoreService from '../services/firestoreService';
import { orderBy } from 'firebase/firestore';
import {
    getTeamMemberName,
    getPriorityFromSeverity,
    getShortBugId,
    isPastDue,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
    VALID_ENVIRONMENTS
} from '../utils/bugUtils';

const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

export const useBugTracker = ({ enabled = true, suite = null, user = null } = {}) => {
    const { activeSuite: contextSuite, user: contextUser, userCapabilities, isAuthenticated, addNotification } = useApp();
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
        status: 'all',
        severity: 'all',
        assignedTo: 'all',
        category: 'all',
        sprint: 'all',
        dueDate: 'all',
        environment: 'all',
        searchTerm: ''
    });
    const [hasLoggedAccessError, setHasLoggedAccessError] = useState(false);

    const getBugsCollectionPath = useCallback(() => {
        if (!activeSuite?.suite_id || !currentUser?.uid) return null;
        if (activeSuite.accountType === 'individual') {
            return `individualAccounts/${currentUser.uid}/testSuites/${activeSuite.suite_id}/bugs`;
        }
        return `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/bugs`;
    }, [activeSuite, currentUser]);

    const getTeamMembersCollectionPath = useCallback(() => {
        if (!activeSuite?.org_id || !currentUser?.uid) return null;
        return `organizations/${activeSuite.org_id}/members`;
    }, [activeSuite, currentUser]);

    const getSprintsCollectionPath = useCallback(() => {
        if (!activeSuite?.suite_id || !currentUser?.uid) return null;
        return `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/sprints`;
    }, [activeSuite, currentUser]);

    const validateSuiteAccess = useCallback(() => {
        if (!activeSuite || !currentUser || !isAuthenticated) {
            if (!hasLoggedAccessError) {
                console.log('Invalid suite access: missing suite, user, or authentication', {
                    activeSuite: !!activeSuite,
                    currentUser: !!currentUser,
                    isAuthenticated
                });
                setHasLoggedAccessError(true);
            }
            return false;
        }
        if (!userCapabilities.canViewBugs) {
            if (!hasLoggedAccessError) {
                console.log('Access denied: user lacks bug view permissions', currentUser.uid);
                setHasLoggedAccessError(true);
            }
            return false;
        }
        return true;
    }, [activeSuite, currentUser, isAuthenticated, userCapabilities, hasLoggedAccessError]);

    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            toast.error('Invalid suite configuration');
            return;
        }
        setIsUpdating(prev => new Set([...prev, bugId]));
        try {
            const result = await firestoreService.updateDocument(bugsCollectionPath, bugId, {
                ...updates,
                updated_at: new Date()
            });
            if (result.success) {
                toast.success('Bug updated successfully');
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to update bug:', error);
            toast.error(`Failed to update bug: ${error.message}`);
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                newSet.delete(bugId);
                return newSet;
            });
        }
    }, [getBugsCollectionPath]);

    const refetchBugs = useCallback(async () => {
        if (!validateSuiteAccess()) {
            setError('Invalid suite configuration or insufficient permissions');
            return;
        }

        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            setError('Invalid suite configuration');
            return;
        }

        setLoading(true);
        try {
            const result = await firestoreService.queryDocuments(bugsCollectionPath, [
                orderBy('created_at', 'desc')
            ]);
            if (result.success) {
                setBugs(result.data.map(doc => ({
                    id: doc.id,
                    ...doc,
                    created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                    updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                })));
                setError(null);
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            setError(error.code === 'permission-denied'
                ? 'You don’t have permission to access bugs in this suite. Please contact your organization admin.'
                : `Failed to refresh bugs: ${error.message}`);
            addNotification({
                type: 'error',
                title: 'Permission Error',
                message: 'You don’t have permission to access bugs in this suite. Please contact your organization admin.'
            });
        } finally {
            setLoading(false);
        }
    }, [getBugsCollectionPath, validateSuiteAccess, addNotification]);

    useEffect(() => {
        if (!enabled || !validateSuiteAccess()) {
            setError('Invalid suite configuration or insufficient permissions');
            setBugs([]);
            setTeamMembers([]);
            setSprints([]);
            return;
        }

        setLoading(true);
        const unsubscribers = [];

        const bugsCollectionPath = getBugsCollectionPath();
        if (bugsCollectionPath) {
            const unsubscribeBugs = firestoreService.subscribeToCollection(
                bugsCollectionPath,
                [orderBy('created_at', 'desc')],
                (docs) => {
                    if (docs.length === 0) {
                        setBugs([]);
                        setError(null); // Empty collection is valid, no error
                    } else {
                        const bugsData = docs.map(doc => ({
                            id: doc.id,
                            ...doc,
                            created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                            updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                        }));
                        setBugs(bugsData);
                        setError(null);
                    }
                    setLoading(false);
                },
                (err) => {
                    const message = err.error?.code === 'permission-denied'
                        ? 'You don’t have permission to access bugs in this suite. Please contact your organization admin.'
                        : 'Failed to load bugs. Please check your internet connection.';
                    setError(message);
                    setBugs([]);
                    setLoading(false);
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load bugs:', err);
                        addNotification({
                            type: 'error',
                            title: 'Permission Error',
                            message: message
                        });
                        setHasLoggedAccessError(true);
                    }
                }
            );
            unsubscribers.push(unsubscribeBugs);
        } else {
            setError('Invalid suite configuration');
            setBugs([]);
            setLoading(false);
        }

        const teamMembersCollectionPath = getTeamMembersCollectionPath();
        if (teamMembersCollectionPath) {
            const unsubscribeTeamMembers = firestoreService.subscribeToCollection(
                teamMembersCollectionPath,
                [],
                (docs) => {
                    setTeamMembers(docs.map(doc => ({
                        id: doc.id,
                        name: getTeamMemberName(doc),
                        ...doc
                    })));
                },
                (err) => {
                    const message = err.error?.code === 'permission-denied'
                        ? 'You don’t have permission to access team members. Please contact your organization admin.'
                        : 'Failed to load team members. Please check your internet connection.';
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load team members:', err);
                        addNotification({
                            type: 'error',
                            title: 'Permission Error',
                            message: message
                        });
                        setHasLoggedAccessError(true);
                    }
                }
            );
            unsubscribers.push(unsubscribeTeamMembers);
        }

        const sprintsCollectionPath = getSprintsCollectionPath();
        if (sprintsCollectionPath) {
            const unsubscribeSprints = firestoreService.subscribeToCollection(
                sprintsCollectionPath,
                [],
                (docs) => {
                    setSprints(docs.map(doc => ({
                        id: doc.id,
                        ...doc
                    })));
                },
                (err) => {
                    const message = err.error?.code === 'permission-denied'
                        ? 'You don’t have permission to access sprints. Please contact your organization admin.'
                        : 'Failed to load sprints. Please check your internet connection.';
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load sprints:', err);
                        addNotification({
                            type: 'error',
                            title: 'Permission Error',
                            message: message
                        });
                        setHasLoggedAccessError(true);
                    }
                }
            );
            unsubscribers.push(unsubscribeSprints);
        }

        return () => {
            unsubscribers.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.warn('Error unsubscribing Firebase listener:', error);
                }
            });
            setHasLoggedAccessError(false);
        };
    }, [enabled, activeSuite, currentUser, getBugsCollectionPath, getTeamMembersCollectionPath, getSprintsCollectionPath, validateSuiteAccess, addNotification, hasLoggedAccessError]);

    useEffect(() => {
        let filtered = [...bugs];
        if (filters.status !== 'all') {
            filtered = filtered.filter(bug => bug.status === filters.status);
        }
        if (filters.severity !== 'all') {
            filtered = filtered.filter(bug => bug.severity === filters.severity);
        }
        if (filters.assignedTo !== 'all') {
            filtered = filtered.filter(bug => bug.assigned_to === filters.assignedTo);
        }
        if (filters.category !== 'all') {
            filtered = filtered.filter(bug => bug.category === filters.category);
        }
        if (filters.sprint !== 'all') {
            filtered = filtered.filter(bug => bug.sprint_id === filters.sprint);
        }
        if (filters.dueDate !== 'all') {
            filtered = filtered.filter(bug => isPastDue(bug.due_date, filters.dueDate));
        }
        if (filters.environment !== 'all') {
            filtered = filtered.filter(bug => bug.environment === filters.environment);
        }
        if (filters.searchTerm) {
            filtered = filtered.filter(bug =>
                bug.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                bug.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                getShortBugId(bug.id)?.toLowerCase().includes(filters.searchTerm.toLowerCase())
            );
        }
        setFilteredBugs(filtered);
    }, [bugs, filters]);

    const createBug = useCallback(async (bugData) => {
        if (!userCapabilities.canCreateBugs) {
            toast.error('You don’t have permission to create bugs');
            return;
        }
        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            toast.error('Invalid suite configuration');
            return;
        }
        try {
            setIsUpdating(prev => new Set([...prev, 'createBug']));
            const result = await firestoreService.createDocument(bugsCollectionPath, {
                ...bugData,
                created_at: new Date(),
                updated_at: new Date(),
                suite_id: activeSuite.suite_id
            });
            if (result.success) {
                toast.success('Bug created successfully');
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to create bug:', error);
            toast.error(`Failed to create bug: ${error.message}`);
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                newSet.delete('createBug');
                return newSet;
            });
        }
    }, [activeSuite, getBugsCollectionPath, userCapabilities]);

    const updateBugStatus = useCallback(async (bugId, status) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        if (!VALID_BUG_STATUSES.includes(status)) {
            toast.error('Invalid bug status');
            return;
        }
        await updateBugInFirestore(bugId, { status });
    }, [userCapabilities, updateBugInFirestore]);

    const updateBugSeverity = useCallback(async (bugId, severity) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        if (!VALID_BUG_SEVERITIES.includes(severity)) {
            toast.error('Invalid bug severity');
            return;
        }
        const priority = getPriorityFromSeverity(severity);
        await updateBugInFirestore(bugId, { severity, priority });
    }, [userCapabilities, updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, userId) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        await updateBugInFirestore(bugId, { assigned_to: userId || null });
    }, [userCapabilities, updateBugInFirestore]);

    const updateBugEnvironment = useCallback(async (bugId, environment) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        if (!VALID_ENVIRONMENTS.includes(environment)) {
            toast.error('Invalid environment');
            return;
        }
        await updateBugInFirestore(bugId, { environment });
    }, [userCapabilities, updateBugInFirestore]);

    const updateBug = useCallback(async (bugId, updates) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        if (isUpdating.has(bugId) || !bugId || !updates || !activeSuite) {
            toast.error('Cannot update bug: Invalid parameters or update in progress');
            return;
        }
        await updateBugInFirestore(bugId, updates);
    }, [isUpdating, activeSuite, userCapabilities, updateBugInFirestore]);

    const updateBugTitle = useCallback(async (bugId, title) => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to update bugs');
            return;
        }
        if (isUpdating.has(bugId) || !bugId || !title) {
            toast.error('Cannot update bug title: Invalid parameters or update in progress');
            return;
        }
        await updateBugInFirestore(bugId, { title });
    }, [isUpdating, userCapabilities, updateBugInFirestore]);

    const createSprint = useCallback(async (sprintData) => {
        if (!userCapabilities.canManageBugs) {
            toast.error('You don’t have permission to create sprints');
            return;
        }
        try {
            const sprintsCollectionPath = getSprintsCollectionPath();
            if (!sprintsCollectionPath) {
                toast.error('Invalid suite configuration');
                return;
            }
            setIsUpdating(prev => new Set([...prev, 'createSprint']));
            const result = await firestoreService.createDocument(sprintsCollectionPath, sprintData);
            if (result.success) {
                toast.success('Sprint created successfully');
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to create sprint:', error);
            toast.error(`Failed to create sprint: ${error.message}`);
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                newSet.delete('createSprint');
                return newSet;
            });
        }
    }, [getSprintsCollectionPath, userCapabilities]);

    const exportBugs = useCallback(async () => {
        if (!userCapabilities.canUpdateBugs) {
            toast.error('You don’t have permission to export bugs');
            return;
        }
        try {
            const result = await firestoreService.queryDocuments(getBugsCollectionPath(), [
                orderBy('created_at', 'desc')
            ]);
            if (result.success) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bugs-${activeSuite.suite_id}-${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to export bugs:', error);
            toast.error(`Failed to export bugs: ${error.message}`);
        }
    }, [activeSuite, getBugsCollectionPath, userCapabilities]);

    const formatDate = useCallback((date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

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
        createBug,
        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBug,
        updateBugTitle,
        createSprint,
        exportBugs,
        formatDate,
        refetchBugs
    };
};