'use client';

import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppProvider';

export const useBugs = () => {
    const { state, actions } = useApp();

    // FIXED: Memoize computed values to prevent new objects on every render
    const selectedBugs = useMemo(() => 
        state.ui.selectedItems?.bugs || [], 
        [state.ui.selectedItems?.bugs]
    );

    const bugs = useMemo(() => 
        state.bugs.bugs || [], 
        [state.bugs.bugs]
    );

    const testCases = useMemo(() => 
        state.testCases?.testCases || [], 
        [state.testCases?.testCases]
    );

    const relationships = useMemo(() => 
        state.relationships || { bugToTestCases: {} }, 
        [state.relationships]
    );

    const teamMembers = useMemo(() => 
        state.team?.members || [], 
        [state.team?.members]
    );

    const currentUser = useMemo(() => 
        state.auth?.user || null, 
        [state.auth?.user]
    );

    const activeSuite = useMemo(() => 
        state.suites?.activeSuite || null, 
        [state.suites?.activeSuite]
    );

    // FIXED: Memoize all async functions to prevent recreation
    const selectBugs = useCallback((bugs) => {
        actions.ui.updateSelection('bugs', bugs);
    }, [actions.ui]);

    const clearBugSelection = useCallback(() => {
        actions.ui.updateSelection('bugs', []);
    }, [actions.ui]);

    const createBug = useCallback(async (bugData, sprintId = null) => {
        const suiteId = state.suites?.activeSuite?.id;
        if (!suiteId) {
            throw new Error('No active suite selected');
        }
        return actions.bugs.createBug(suiteId, bugData, sprintId);
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const updateBug = useCallback(async (bugId, updates) => {
        if (!actions.bugs.updateBug) {
            throw new Error('Update bug action not available');
        }
        // Ensure suiteId is included in updates
        const suiteId = state.suites?.activeSuite?.id;
        if (!suiteId) {
            throw new Error('No active suite selected');
        }
        return actions.bugs.updateBug(bugId, { ...updates, suite_id: suiteId });
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const deleteBug = useCallback(async (bugId) => {
        if (!actions.bugs.deleteBug) {
            throw new Error('Delete bug action not available');
        }
        // Pass suiteId to deleteBug function
        const suiteId = state.suites?.activeSuite?.id;
        if (!suiteId) {
            throw new Error('No active suite selected');
        }
        return actions.bugs.deleteBug(bugId, suiteId);
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const linkTestCaseToBug = useCallback(async (bugId, testCaseId) => {
        if (!actions.relationships?.linkTestCaseToBug) {
            throw new Error('Link test case action not available');
        }
        return actions.relationships.linkTestCaseToBug(bugId, testCaseId);
    }, [actions.relationships]);

    const unlinkTestCaseFromBug = useCallback(async (bugId, testCaseId) => {
        if (!actions.relationships?.unlinkTestCaseFromBug) {
            throw new Error('Unlink test case action not available');
        }
        return actions.relationships.unlinkTestCaseFromBug(bugId, testCaseId);
    }, [actions.relationships]);

    const bulkUpdateBugs = useCallback(async (bugIds, updates) => {
        const suiteId = state.suites?.activeSuite?.id;
        if (!suiteId) {
            throw new Error('No active suite selected');
        }
        
        if (!actions.bugs.bulkUpdateBugs) {
            // Fallback to individual updates
            return Promise.all(
                bugIds.map(id => actions.bugs.updateBug(id, { ...updates, suite_id: suiteId }))
            );
        }
        return actions.bugs.bulkUpdateBugs(bugIds, { ...updates, suite_id: suiteId });
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const bulkDeleteBugs = useCallback(async (bugIds) => {
        const suiteId = state.suites?.activeSuite?.id;
        if (!suiteId) {
            throw new Error('No active suite selected');
        }
        
        if (!actions.bugs.bulkDeleteBugs) {
            // Fallback to individual deletes
            return Promise.all(
                bugIds.map(id => actions.bugs.deleteBug(id, suiteId))
            );
        }
        return actions.bugs.bulkDeleteBugs(bugIds, suiteId);
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const refreshBugs = useCallback(async () => {
        const suiteId = state.suites?.activeSuite?.id;
        if (suiteId && actions.bugs.fetchBugs) {
            return actions.bugs.fetchBugs(suiteId);
        }
    }, [actions.bugs, state.suites?.activeSuite?.id]);

    const refreshTestCases = useCallback(async () => {
        const suiteId = state.suites?.activeSuite?.id;
        if (suiteId && actions.testCases?.fetchTestCases) {
            return actions.testCases.fetchTestCases(suiteId);
        }
    }, [actions.testCases, state.suites?.activeSuite?.id]);

    const refreshRelationships = useCallback(async () => {
        const suiteId = state.suites?.activeSuite?.id;
        if (suiteId && actions.relationships?.fetchRelationships) {
            return actions.relationships.fetchRelationships(suiteId);
        }
    }, [actions.relationships, state.suites?.activeSuite?.id]);

    // FIXED: Memoize the entire return object to prevent new object creation
    return useMemo(() => ({
        // Selection state
        selectedBugs,
        
        // Permissions and limits
        canCreateBugs: state.subscription?.planLimits?.canCreateBugs !== false,
        bugsLocked: state.subscription?.planLimits?.bugsLocked === true,
        
        // Data
        bugs,
        testCases,
        relationships,
        teamMembers,
        
        // Loading states
        loading: state.bugs.loading,
        bugsLoading: state.bugs.loading,
        bugsError: state.bugs.error,
        
        // Computed values
        totalBugs: bugs.length,
        
        // User and suite info
        currentUser,
        activeSuite,
        
        // Selection actions
        selectBugs,
        clearBugSelection,
        
        // CRUD operations
        createBug,
        updateBug,
        deleteBug,
        
        // Relationship actions
        linkTestCaseToBug,
        unlinkTestCaseFromBug,
        
        // Bulk operations
        bulkUpdateBugs,
        bulkDeleteBugs,
        
        // Refresh data
        refreshBugs,
        refreshTestCases,
        refreshRelationships
    }), [
        // Dependencies for memoization
        selectedBugs,
        state.subscription?.planLimits?.canCreateBugs,
        state.subscription?.planLimits?.bugsLocked,
        bugs,
        testCases,
        relationships,
        teamMembers,
        state.bugs.loading,
        state.bugs.error,
        currentUser,
        activeSuite,
        selectBugs,
        clearBugSelection,
        createBug,
        updateBug,
        deleteBug,
        linkTestCaseToBug,
        unlinkTestCaseFromBug,
        bulkUpdateBugs,
        bulkDeleteBugs,
        refreshBugs,
        refreshTestCases,
        refreshRelationships
    ]);
};