'use client';

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

const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

export const useBugTracker = ({ enabled = true, suite = null, user = null } = {}) => {
    const { activeSuite: contextSuite, user: contextUser, isAuthenticated, addNotification } = useApp();
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
        frequency: 'all',
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
        return true;
    }, [activeSuite, currentUser, isAuthenticated, hasLoggedAccessError]);

    const refetchBugs = useCallback(async () => {
        if (!validateSuiteAccess()) {
            setError('Invalid suite configuration');
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
                const bugsData = result.data.map(doc => ({
                    id: doc.id,
                    ...doc,
                    created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                    updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                }));
                setBugs(bugsData);
                setFilteredBugs(bugsData);
                setError(null);
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            setError(`Failed to refresh bugs: ${error.message}`);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to refresh bugs: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    }, [getBugsCollectionPath, validateSuiteAccess, addNotification]);

    const syncBugFromFirestore = useCallback(async (bugId) => {
        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) return null;

        try {
            const result = await firestoreService.getDocument(bugsCollectionPath, bugId);
            if (result.success && result.data) {
                const bugData = {
                    id: result.data.id,
                    ...result.data,
                    created_at: result.data.created_at?.toDate?.() || new Date(result.data.created_at),
                    updated_at: result.data.updated_at?.toDate?.() || new Date(result.data.updated_at)
                };
                
                // Update local state
                setBugs(prev => prev.map(bug => 
                    bug.id === bugId ? bugData : bug
                ));
                setFilteredBugs(prev => prev.map(bug => 
                    bug.id === bugId ? bugData : bug
                ));
                
                return bugData;
            }
            return null;
        } catch (error) {
            console.error('Error syncing bug from Firestore:', error);
            return null;
        }
    }, [getBugsCollectionPath]);

    const removeBugFromLocalState = useCallback((bugId) => {
        setBugs(prev => prev.filter(bug => bug.id !== bugId));
        setFilteredBugs(prev => prev.filter(bug => bug.id !== bugId));
    }, []);

    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            toast.error('Invalid suite configuration');
            return false;
        }

        if (isUpdating.has(bugId)) {
            toast.warning('Update already in progress for this bug');
            return false;
        }

        setIsUpdating(prev => new Set([...prev, bugId]));

        try {
            // First, verify the document exists in Firestore
            const docResult = await firestoreService.getDocument(bugsCollectionPath, bugId);
            if (!docResult.success || !docResult.data) {
                console.warn(`Bug ${bugId} not found in Firestore, removing from local state`);
                removeBugFromLocalState(bugId);
                toast.warning(`Bug ${getShortBugId(bugId)} was not found and has been removed from the list`);
                return false;
            }

            // Attempt the update
            const result = await firestoreService.updateDocument(bugsCollectionPath, bugId, {
                ...updates,
                updated_at: new Date()
            });

            if (result.success) {
                // Update local state optimistically
                const updatedBug = {
                    ...docResult.data,
                    ...updates,
                    updated_at: new Date()
                };

                setBugs(prev => prev.map(bug =>
                    bug.id === bugId ? updatedBug : bug
                ));
                setFilteredBugs(prev => prev.map(bug =>
                    bug.id === bugId ? updatedBug : bug
                ));

                toast.success(`Bug ${getShortBugId(bugId)} updated successfully`);
                return true;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to update bug:', error);
            
            // Handle specific error cases
            if (error.message.includes('Document not found') || error.code === 'not-found') {
                console.warn(`Bug ${bugId} not found during update, removing from local state`);
                removeBugFromLocalState(bugId);
                toast.warning(`Bug ${getShortBugId(bugId)} was not found and has been removed from the list`);
                
                // Try to refresh the entire bugs list to ensure consistency
                setTimeout(refetchBugs, 1000);
            } else if (error.code === 'permission-denied') {
                toast.error('Permission denied. You may not have access to update this bug.');
            } else {
                toast.error(`Failed to update bug: ${error.message}`);
                
                // Try to sync the bug from Firestore to get the latest state
                const syncedBug = await syncBugFromFirestore(bugId);
                if (!syncedBug) {
                    // Bug doesn't exist in Firestore, remove from local state
                    removeBugFromLocalState(bugId);
                }
            }
            
            return false;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                newSet.delete(bugId);
                return newSet;
            });
        }
    }, [getBugsCollectionPath, isUpdating, removeBugFromLocalState, syncBugFromFirestore, refetchBugs]);

    useEffect(() => {
        if (!enabled || !validateSuiteAccess()) {
            setError('Invalid suite configuration');
            setBugs([]);
            setFilteredBugs([]);
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
                    const bugsData = docs.map(doc => ({
                        id: doc.id,
                        ...doc,
                        created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                        updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                    }));
                    setBugs(bugsData);
                    setFilteredBugs(bugsData);
                    setError(null);
                    setLoading(false);
                },
                (err) => {
                    const message = 'Failed to load bugs. Please check your internet connection.';
                    setError(message);
                    setBugs([]);
                    setFilteredBugs([]);
                    setLoading(false);
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load bugs:', err);
                        addNotification({
                            type: 'error',
                            title: 'Error',
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
            setFilteredBugs([]);
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
                    const message = 'Failed to load team members. Please check your internet connection.';
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load team members:', err);
                        addNotification({
                            type: 'error',
                            title: 'Error',
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
                    const message = 'Failed to load sprints. Please check your internet connection.';
                    if (!hasLoggedAccessError) {
                        console.error('Failed to load sprints:', err);
                        addNotification({
                            type: 'error',
                            title: 'Error',
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
        if (filters.frequency !== 'all') {
            filtered = filtered.filter(bug => bug.frequency === filters.frequency);
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
    }, [activeSuite, getBugsCollectionPath]);

    const updateBugStatus = useCallback(async (bugId, status) => {
        if (!VALID_BUG_STATUSES.includes(status)) {
            toast.error('Invalid bug status');
            return;
        }
        await updateBugInFirestore(bugId, { status });
    }, [updateBugInFirestore]);

    const updateBugSeverity = useCallback(async (bugId, severity) => {
        if (!VALID_BUG_SEVERITIES.includes(severity)) {
            toast.error('Invalid bug severity');
            return;
        }
        const priority = getPriorityFromSeverity(severity);
        await updateBugInFirestore(bugId, { severity, priority });
    }, [updateBugInFirestore]);

    const updateBugPriority = useCallback(async (bugId, priority) => {
        await updateBugInFirestore(bugId, { priority });
    }, [updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, userId) => {
        await updateBugInFirestore(bugId, { assigned_to: userId || null });
    }, [updateBugInFirestore]);

    const updateBugEnvironment = useCallback(async (bugId, environment) => {
        if (!VALID_ENVIRONMENTS.includes(environment)) {
            toast.error('Invalid environment');
            return;
        }
        await updateBugInFirestore(bugId, { environment });
    }, [updateBugInFirestore]);

    const updateBugFrequency = useCallback(async (bugId, frequency) => {
        if (!VALID_FREQUENCIES.includes(frequency)) {
            toast.error('Invalid bug frequency');
            return;
        }
        await updateBugInFirestore(bugId, { frequency });
    }, [updateBugInFirestore]);

    const updateBug = useCallback(async (bugId, updates) => {
        if (isUpdating.has(bugId) || !bugId || !updates || !activeSuite) {
            toast.error('Cannot update bug: Invalid parameters or update in progress');
            return;
        }
        await updateBugInFirestore(bugId, updates);
    }, [isUpdating, activeSuite, updateBugInFirestore]);

    const updateBugTitle = useCallback(async (bugId, title) => {
        if (isUpdating.has(bugId) || !bugId || !title) {
            toast.error('Cannot update bug title: Invalid parameters or update in progress');
            return;
        }
        await updateBugInFirestore(bugId, { title });
    }, [isUpdating, updateBugInFirestore]);

    const createSprint = useCallback(async (sprintData) => {
        const sprintsCollectionPath = getSprintsCollectionPath();
        if (!sprintsCollectionPath) {
            toast.error('Invalid suite configuration');
            return;
        }
        try {
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
    }, [getSprintsCollectionPath]);

    const exportBugs = useCallback(async () => {
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
    }, [activeSuite, getBugsCollectionPath]);

    const deleteBugs = useCallback(async (suiteId, bugIds) => {
        const bugsCollectionPath = getBugsCollectionPath();
        if (!bugsCollectionPath) {
            toast.error('Invalid suite configuration');
            return;
        }
        try {
            setIsUpdating(prev => new Set([...prev, ...bugIds]));

            const deletePromises = bugIds.map(async (id) => {
                try {
                    const result = await firestoreService.deleteDocument(bugsCollectionPath, id);
                    if (!result.success) {
                        console.warn(`Failed to delete bug ${id}:`, result.error);
                    }
                    return result;
                } catch (error) {
                    console.warn(`Error deleting bug ${id}:`, error);
                    return { success: false, error };
                }
            });

            const results = await Promise.all(deletePromises);
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;

            // Update local state regardless of individual failures
            setBugs(prev => prev.filter(bug => !bugIds.includes(bug.id)));
            setFilteredBugs(prev => prev.filter(bug => !bugIds.includes(bug.id)));
            
            if (successCount > 0) {
                toast.success(`Successfully deleted ${successCount} bug${successCount > 1 ? 's' : ''}`);
            }
            if (failCount > 0) {
                toast.warning(`Failed to delete ${failCount} bug${failCount > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error('Failed to delete bugs:', error);
            toast.error(`Failed to delete bugs: ${error.message}`);
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                bugIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    }, [getBugsCollectionPath]);

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
        updateBugPriority,
        updateBugAssignment,
        updateBugEnvironment,
        updateBugFrequency,
        updateBug,
        updateBugTitle,
        createSprint,
        exportBugs,
        deleteBugs,
        formatDate,
        refetchBugs
    };
};