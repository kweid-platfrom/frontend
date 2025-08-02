'use client';

import { useApp } from '../context/AppProvider';

export const useBugs = () => {
    const { state, actions } = useApp();

    return {
        // Selection state
        selectedBugs: state.ui.selectedItems?.bugs || [],
        
        // Permissions and limits
        canCreateBugs: state.subscription?.planLimits?.canCreateBugs !== false,
        bugsLocked: state.subscription?.planLimits?.bugsLocked === true,
        
        // Data
        bugs: state.bugs.bugs || [],
        testCases: state.testCases?.testCases || [],
        relationships: state.relationships || { bugToTestCases: {} },
        teamMembers: state.team?.members || [],
        
        // Loading states
        loading: state.bugs.loading,
        bugsLoading: state.bugs.loading,
        bugsError: state.bugs.error,
        
        // Computed values
        totalBugs: state.bugs.bugs?.length || 0,
        
        // User and suite info
        currentUser: state.auth?.user || null,
        activeSuite: state.suites?.activeSuite || null,
        
        // Selection actions
        selectBugs: (bugs) => actions.ui.updateSelection('bugs', bugs),
        clearBugSelection: () => actions.ui.updateSelection('bugs', []),
        
        // CRUD operations
        createBug: async (bugData, sprintId = null) => {
            const suiteId = state.suites?.activeSuite?.id;
            if (!suiteId) {
                throw new Error('No active suite selected');
            }
            return actions.bugs.createBug(suiteId, bugData, sprintId);
        },
        
        updateBug: async (bugId, updates) => {
            if (!actions.bugs.updateBug) {
                throw new Error('Update bug action not available');
            }
            // Ensure suiteId is included in updates
            const suiteId = state.suites?.activeSuite?.id;
            if (!suiteId) {
                throw new Error('No active suite selected');
            }
            return actions.bugs.updateBug(bugId, { ...updates, suite_id: suiteId });
        },
        
        deleteBug: async (bugId) => {
            if (!actions.bugs.deleteBug) {
                throw new Error('Delete bug action not available');
            }
            // Pass suiteId to deleteBug function
            const suiteId = state.suites?.activeSuite?.id;
            if (!suiteId) {
                throw new Error('No active suite selected');
            }
            return actions.bugs.deleteBug(bugId, suiteId);
        },
        
        // Relationship actions
        linkTestCaseToBug: async (bugId, testCaseId) => {
            if (!actions.relationships?.linkTestCaseToBug) {
                throw new Error('Link test case action not available');
            }
            return actions.relationships.linkTestCaseToBug(bugId, testCaseId);
        },
        
        unlinkTestCaseFromBug: async (bugId, testCaseId) => {
            if (!actions.relationships?.unlinkTestCaseFromBug) {
                throw new Error('Unlink test case action not available');
            }
            return actions.relationships.unlinkTestCaseFromBug(bugId, testCaseId);
        },
        
        // Bulk operations
        bulkUpdateBugs: async (bugIds, updates) => {
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
        },
        
        bulkDeleteBugs: async (bugIds) => {
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
        },
        
        // Refresh data
        refreshBugs: async () => {
            const suiteId = state.suites?.activeSuite?.id;
            if (suiteId && actions.bugs.fetchBugs) {
                return actions.bugs.fetchBugs(suiteId);
            }
        },
        
        refreshTestCases: async () => {
            const suiteId = state.suites?.activeSuite?.id;
            if (suiteId && actions.testCases?.fetchTestCases) {
                return actions.testCases.fetchTestCases(suiteId);
            }
        },
        
        refreshRelationships: async () => {
            const suiteId = state.suites?.activeSuite?.id;
            if (suiteId && actions.relationships?.fetchRelationships) {
                return actions.relationships.fetchRelationships(suiteId);
            }
        }
    };
};