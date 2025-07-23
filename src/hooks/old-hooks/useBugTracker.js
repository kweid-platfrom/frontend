'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppProvider';
import firestoreService from '../../services/firestoreService';
import { orderBy } from 'firebase/firestore';
import {
    getTeamMemberName,
    getPriorityFromSeverity,
    getShortBugId,
    isPastDue,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES,
    VALID_ENVIRONMENTS
} from '../../utils/bugUtils';

const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

const INITIAL_FILTERS = {
    status: 'all',
    severity: 'all',
    assignedTo: 'all',
    category: 'all',
    sprint: 'all',
    dueDate: 'all',
    environment: 'all',
    frequency: 'all',
    searchTerm: ''
};

export const useBugTracker = ({ 
    enabled = true, 
    suite = null, 
    user = null, 
    bugs: externalBugs = [] 
} = {}) => {
    const { activeSuite: contextSuite, user: contextUser, isAuthenticated, addNotification } = useApp();
    const activeSuite = suite || contextSuite;
    const currentUser = user || contextUser;

    // Use external bugs if provided, otherwise manage internal state
    const [internalBugs, setInternalBugs] = useState([]);
    const bugs = externalBugs.length > 0 ? externalBugs : internalBugs;
    
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(new Set());
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    // Memoized values for performance
    const environments = useMemo(() => VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS, []);
    
    const collectionPaths = useMemo(() => {
        if (!activeSuite?.suite_id || !currentUser?.uid) return {};
        
        const basePath = activeSuite.accountType === 'individual'
            ? `individualAccounts/${currentUser.uid}/testSuites/${activeSuite.suite_id}`
            : `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}`;
            
        return {
            bugs: `${basePath}/bugs`,
            teamMembers: activeSuite.accountType !== 'individual' ? `organizations/${activeSuite.org_id}/members` : null,
            sprints: `${basePath}/sprints`
        };
    }, [activeSuite, currentUser]);

    const validateSuiteAccess = useCallback(() => {
        return !!(activeSuite && currentUser && isAuthenticated);
    }, [activeSuite, currentUser, isAuthenticated]);

    // Optimized filter application using useMemo
    const applyFilters = useCallback((bugsToFilter, currentFilters) => {
        return bugsToFilter.filter(bug => {
            // Status filter
            if (currentFilters.status !== 'all' && bug.status !== currentFilters.status) {
                return false;
            }
            
            // Severity filter
            if (currentFilters.severity !== 'all' && bug.severity !== currentFilters.severity) {
                return false;
            }
            
            // Assigned to filter
            if (currentFilters.assignedTo !== 'all' && bug.assigned_to !== currentFilters.assignedTo) {
                return false;
            }
            
            // Category filter
            if (currentFilters.category !== 'all' && bug.category !== currentFilters.category) {
                return false;
            }
            
            // Sprint filter
            if (currentFilters.sprint !== 'all' && bug.sprint_id !== currentFilters.sprint) {
                return false;
            }
            
            // Due date filter
            if (currentFilters.dueDate !== 'all' && !isPastDue(bug.due_date, currentFilters.dueDate)) {
                return false;
            }
            
            // Environment filter
            if (currentFilters.environment !== 'all' && bug.environment !== currentFilters.environment) {
                return false;
            }
            
            // Frequency filter
            if (currentFilters.frequency !== 'all' && bug.frequency !== currentFilters.frequency) {
                return false;
            }
            
            // Search term filter
            if (currentFilters.searchTerm) {
                const searchLower = currentFilters.searchTerm.toLowerCase();
                return (
                    bug.title?.toLowerCase().includes(searchLower) ||
                    bug.description?.toLowerCase().includes(searchLower) ||
                    getShortBugId(bug.id)?.toLowerCase().includes(searchLower)
                );
            }
            
            return true;
        });
    }, []);

    // Apply filters with memoization
    useEffect(() => {
        const filtered = applyFilters(bugs, filters);
        setFilteredBugs(filtered);
    }, [bugs, filters, applyFilters]);

    // Generic update function for Firestore operations
    const updateBugInFirestore = useCallback(async (bugId, updates) => {
        if (!collectionPaths.bugs) {
            toast.error('Invalid suite configuration');
            return false;
        }

        if (isUpdating.has(bugId)) {
            toast.error('Update already in progress');
            return false;
        }

        setIsUpdating(prev => new Set([...prev, bugId]));
        
        try {
            // Check if document exists first
            const docResult = await firestoreService.getDocument(collectionPaths.bugs, bugId);
            if (!docResult.success || !docResult.data) {
                throw new Error('Bug not found');
            }

            const result = await firestoreService.updateDocument(collectionPaths.bugs, bugId, {
                ...updates,
                updated_at: new Date()
            });

            if (result.success) {
                // Only update internal state if we're managing bugs internally
                if (externalBugs.length === 0) {
                    setInternalBugs(prev => prev.map(bug =>
                        bug.id === bugId ? { ...bug, ...updates, updated_at: new Date() } : bug
                    ));
                }
                
                toast.success(`Bug ${getShortBugId(bugId)} updated successfully`);
                return true;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to update bug:', error);
            toast.error(`Failed to update bug: ${error.message}`);
            
            // Handle document not found case
            if (error.message.includes('not found')) {
                if (externalBugs.length === 0) {
                    setInternalBugs(prev => prev.filter(bug => bug.id !== bugId));
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
    }, [collectionPaths.bugs, isUpdating, externalBugs.length]);

    // Load team members and sprints
    useEffect(() => {
        if (!enabled || !validateSuiteAccess() || !collectionPaths.teamMembers) {
            setTeamMembers([]);
            setSprints([]);
            return;
        }

        const unsubscribers = [];

        // Subscribe to team members if organization account
        if (collectionPaths.teamMembers) {
            const unsubscribeTeamMembers = firestoreService.subscribeToCollection(
                collectionPaths.teamMembers,
                [],
                (docs) => {
                    setTeamMembers(docs.map(doc => ({
                        id: doc.id,
                        name: getTeamMemberName(doc),
                        ...doc
                    })));
                },
                (err) => {
                    console.error('Failed to load team members:', err);
                    addNotification({
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to load team members'
                    });
                }
            );
            unsubscribers.push(unsubscribeTeamMembers);
        }

        // Subscribe to sprints
        if (collectionPaths.sprints) {
            const unsubscribeSprints = firestoreService.subscribeToCollection(
                collectionPaths.sprints,
                [],
                (docs) => {
                    setSprints(docs.map(doc => ({
                        id: doc.id,
                        ...doc
                    })));
                },
                (err) => {
                    console.error('Failed to load sprints:', err);
                    addNotification({
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to load sprints'
                    });
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
        };
    }, [enabled, validateSuiteAccess, collectionPaths.teamMembers, collectionPaths.sprints, addNotification]);

    // Only fetch bugs if external bugs are not provided
    useEffect(() => {
        if (!enabled || externalBugs.length > 0 || !validateSuiteAccess() || !collectionPaths.bugs) {
            if (externalBugs.length === 0) {
                setInternalBugs([]);
            }
            return;
        }

        setLoading(true);
        const unsubscribeBugs = firestoreService.subscribeToCollection(
            collectionPaths.bugs,
            [orderBy('created_at', 'desc')],
            (docs) => {
                const bugsData = docs.map(doc => ({
                    id: doc.id,
                    ...doc,
                    created_at: doc.created_at?.toDate?.() || new Date(doc.created_at),
                    updated_at: doc.updated_at?.toDate?.() || new Date(doc.updated_at)
                }));
                setInternalBugs(bugsData);
                setError(null);
                setLoading(false);
            },
            () => {
                setError('Failed to load bugs');
                setInternalBugs([]);
                setLoading(false);
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to load bugs'
                });
            }
        );

        return () => {
            try {
                unsubscribeBugs();
            } catch (error) {
                console.warn('Error unsubscribing from bugs:', error);
            }
        };
    }, [enabled, externalBugs.length, validateSuiteAccess, collectionPaths.bugs, addNotification]);

    // Bug operation methods
    const createBug = useCallback(async (bugData) => {
        if (!collectionPaths.bugs) {
            toast.error('Invalid suite configuration');
            return false;
        }

        try {
            setIsUpdating(prev => new Set([...prev, 'createBug']));
            const result = await firestoreService.createDocument(collectionPaths.bugs, {
                ...bugData,
                created_at: new Date(),
                updated_at: new Date(),
                suite_id: activeSuite.suite_id
            });

            if (result.success) {
                toast.success('Bug created successfully');
                return true;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to create bug:', error);
            toast.error(`Failed to create bug: ${error.message}`);
            return false;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                newSet.delete('createBug');
                return newSet;
            });
        }
    }, [activeSuite, collectionPaths.bugs]);

    // Specific update methods with validation
    const updateBugStatus = useCallback(async (bugId, status) => {
        if (!VALID_BUG_STATUSES.includes(status)) {
            toast.error('Invalid bug status');
            return false;
        }
        return await updateBugInFirestore(bugId, { status });
    }, [updateBugInFirestore]);

    const updateBugSeverity = useCallback(async (bugId, severity) => {
        if (!VALID_BUG_SEVERITIES.includes(severity)) {
            toast.error('Invalid bug severity');
            return false;
        }
        const priority = getPriorityFromSeverity(severity);
        return await updateBugInFirestore(bugId, { severity, priority });
    }, [updateBugInFirestore]);

    const updateBugAssignment = useCallback(async (bugId, userId) => {
        return await updateBugInFirestore(bugId, { assigned_to: userId || null });
    }, [updateBugInFirestore]);

    const updateBugEnvironment = useCallback(async (bugId, environment) => {
        if (!VALID_ENVIRONMENTS.includes(environment)) {
            toast.error('Invalid environment');
            return false;
        }
        return await updateBugInFirestore(bugId, { environment });
    }, [updateBugInFirestore]);

    const updateBugFrequency = useCallback(async (bugId, frequency) => {
        if (!VALID_FREQUENCIES.includes(frequency)) {
            toast.error('Invalid bug frequency');
            return false;
        }
        return await updateBugInFirestore(bugId, { frequency });
    }, [updateBugInFirestore]);

    const updateBug = useCallback(async (bugId, updates) => {
        if (!bugId || !updates || !activeSuite) {
            toast.error('Invalid parameters for bug update');
            return false;
        }
        return await updateBugInFirestore(bugId, updates);
    }, [activeSuite, updateBugInFirestore]);

    // Utility methods
    const formatDate = useCallback((date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(INITIAL_FILTERS);
    }, []);

    // Export and delete operations
    const exportBugs = useCallback(async () => {
        if (!collectionPaths.bugs) {
            toast.error('Invalid suite configuration');
            return;
        }

        try {
            const result = await firestoreService.queryDocuments(collectionPaths.bugs, [
                orderBy('created_at', 'desc')
            ]);
            
            if (result.success) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bugs-${activeSuite.suite_id}-${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Bugs exported successfully');
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('Failed to export bugs:', error);
            toast.error(`Failed to export bugs: ${error.message}`);
        }
    }, [activeSuite, collectionPaths.bugs]);

    const deleteBugs = useCallback(async (bugIds) => {
        if (!collectionPaths.bugs || !Array.isArray(bugIds) || bugIds.length === 0) {
            toast.error('Invalid parameters for bug deletion');
            return false;
        }

        try {
            setIsUpdating(prev => new Set([...prev, ...bugIds]));
            await Promise.all(
                bugIds.map(id => firestoreService.deleteDocument(`${collectionPaths.bugs}/${id}`))
            );
            
            // Update internal state if managing bugs internally
            if (externalBugs.length === 0) {
                setInternalBugs(prev => prev.filter(bug => !bugIds.includes(bug.id)));
            }
            
            toast.success(`Successfully deleted ${bugIds.length} bug${bugIds.length > 1 ? 's' : ''}`);
            return true;
        } catch (error) {
            console.error('Failed to delete bugs:', error);
            toast.error(`Failed to delete bugs: ${error.message}`);
            return false;
        } finally {
            setIsUpdating(prev => {
                const newSet = new Set([...prev]);
                bugIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    }, [collectionPaths.bugs, externalBugs.length]);

    return {
        bugs,
        filteredBugs,
        teamMembers,
        sprints,
        environments,
        filters,
        setFilters,
        resetFilters,
        error,
        loading,
        isUpdating,
        createBug,
        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBugFrequency,
        updateBug,
        exportBugs,
        deleteBugs,
        formatDate,
        // Additional utility methods
        totalBugsCount: bugs.length,
        filteredBugsCount: filteredBugs.length,
        hasActiveFilters: Object.values(filters).some(value => value !== 'all' && value !== ''),
    };
};