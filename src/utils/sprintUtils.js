// utils/sprintUtils.js

/**
 * Status check helpers - case-insensitive status validation
 */
export const statusChecks = {
    isTestCaseCompleted: (status) => {
        const normalized = (status || '').toLowerCase();
        return ['passed', 'completed', 'success'].includes(normalized);
    },

    isBugResolved: (status) => {
        const normalized = (status || '').toLowerCase();
        return ['resolved', 'closed', 'fixed'].includes(normalized);
    },

    isRecommendationImplemented: (status) => {
        const normalized = (status || '').toLowerCase();
        return ['implemented', 'completed', 'done'].includes(normalized);
    }
};

/**
 * Filter assets by sprint ID
 */
export const filterAssetsBySprint = (sprintId, testCases = [], bugs = [], recommendations = []) => {
    if (!sprintId) {
        return {
            testCases: [],
            bugs: [],
            recommendations: []
        };
    }

    const filteredTestCases = testCases.filter(tc => 
        (tc.sprint_id === sprintId || tc.sprintId === sprintId) &&
        tc.status !== 'deleted' && tc.status !== 'archived'
    );

    const filteredBugs = bugs.filter(bug => 
        (bug.sprint_id === sprintId || bug.sprintId === sprintId) &&
        bug.status !== 'deleted' && bug.status !== 'archived'
    );

    const filteredRecommendations = recommendations.filter(rec => 
        (rec.sprint_id === sprintId || rec.sprintId === sprintId) &&
        rec.status !== 'deleted' && rec.status !== 'archived'
    );

    return {
        testCases: filteredTestCases,
        bugs: filteredBugs,
        recommendations: filteredRecommendations
    };
};

/**
 * Get asset counts for a sprint
 */
export const getSprintAssetCounts = (sprintId, testCases = [], bugs = [], recommendations = []) => {
    const filtered = filterAssetsBySprint(sprintId, testCases, bugs, recommendations);
    
    return {
        testCases: filtered.testCases.length,
        bugs: filtered.bugs.length,
        recommendations: filtered.recommendations.length,
        total: filtered.testCases.length + filtered.bugs.length + filtered.recommendations.length
    };
};

/**
 * Calculate sprint progress percentage
 * Returns 0-100 representing completion percentage
 */
export const calculateSprintProgress = (sprint, testCases = [], bugs = [], recommendations = []) => {
    if (!sprint?.id) return 0;

    const filtered = filterAssetsBySprint(sprint.id, testCases, bugs, recommendations);

    // Count completed items
    const completedTests = filtered.testCases.filter(tc => 
        statusChecks.isTestCaseCompleted(tc.status)
    ).length;
    
    const resolvedBugs = filtered.bugs.filter(bug => 
        statusChecks.isBugResolved(bug.status)
    ).length;
    
    const implementedRecs = filtered.recommendations.filter(rec =>
        statusChecks.isRecommendationImplemented(rec.status)
    ).length;

    const totalAssets = filtered.testCases.length + filtered.bugs.length + filtered.recommendations.length;
    const completedAssets = completedTests + resolvedBugs + implementedRecs;

    return totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0;
};

/**
 * Get detailed sprint metrics
 * Returns comprehensive breakdown of sprint progress
 */
export const getSprintMetrics = (sprint, testCases = [], bugs = [], recommendations = []) => {
    if (!sprint?.id) {
        return {
            totalAssets: 0,
            completedAssets: 0,
            completionRate: 0,
            testCases: { total: 0, completed: 0, rate: 0 },
            bugs: { total: 0, resolved: 0, rate: 0 },
            recommendations: { total: 0, implemented: 0, rate: 0 }
        };
    }

    const filtered = filterAssetsBySprint(sprint.id, testCases, bugs, recommendations);

    // Count completed items
    const completedTests = filtered.testCases.filter(tc => 
        statusChecks.isTestCaseCompleted(tc.status)
    ).length;
    
    const resolvedBugs = filtered.bugs.filter(bug => 
        statusChecks.isBugResolved(bug.status)
    ).length;
    
    const implementedRecs = filtered.recommendations.filter(rec =>
        statusChecks.isRecommendationImplemented(rec.status)
    ).length;

    const totalAssets = filtered.testCases.length + filtered.bugs.length + filtered.recommendations.length;
    const completedAssets = completedTests + resolvedBugs + implementedRecs;

    return {
        totalAssets,
        completedAssets,
        completionRate: totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0,
        testCases: {
            total: filtered.testCases.length,
            completed: completedTests,
            rate: filtered.testCases.length > 0 
                ? Math.round((completedTests / filtered.testCases.length) * 100) 
                : 0
        },
        bugs: {
            total: filtered.bugs.length,
            resolved: resolvedBugs,
            rate: filtered.bugs.length > 0 
                ? Math.round((resolvedBugs / filtered.bugs.length) * 100) 
                : 0
        },
        recommendations: {
            total: filtered.recommendations.length,
            implemented: implementedRecs,
            rate: filtered.recommendations.length > 0 
                ? Math.round((implementedRecs / filtered.recommendations.length) * 100) 
                : 0
        }
    };
};

/**
 * Get status badge classes for UI components
 */
export const getStatusBadgeClasses = {
    testCase: (status) => {
        const normalized = (status || '').toLowerCase();
        
        if (normalized === 'passed' || normalized === 'completed' || normalized === 'success') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalized === 'failed' || normalized === 'failure') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalized === 'in-progress' || normalized === 'in progress' || normalized === 'running') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalized === 'blocked') {
            return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    },

    bug: (status) => {
        const normalized = (status || '').toLowerCase();
        
        if (normalized === 'resolved' || normalized === 'closed' || normalized === 'fixed') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalized === 'in-progress' || normalized === 'in progress') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalized === 'open' || normalized === 'new') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalized === 'on-hold' || normalized === 'blocked') {
            return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    },

    recommendation: (status) => {
        const normalized = (status || '').toLowerCase();
        
        if (normalized === 'implemented' || normalized === 'completed' || normalized === 'done') {
            return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300';
        } else if (normalized === 'rejected' || normalized === 'declined') {
            return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300';
        } else if (normalized === 'in-progress' || normalized === 'in progress') {
            return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300';
        } else if (normalized === 'pending' || normalized === 'new') {
            return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300';
        } else {
            return 'bg-muted text-muted-foreground';
        }
    }
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Calculate days remaining until sprint end date
 */
export const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Get sprint status info for display
 */
export const getSprintStatusInfo = (status) => {
    switch (status) {
        case 'active':
            return { 
                color: 'text-success', 
                bgColor: 'bg-green-100 dark:bg-green-950', 
                label: 'Active' 
            };
        case 'completed':
            return { 
                color: 'text-info', 
                bgColor: 'bg-blue-100 dark:bg-blue-950', 
                label: 'Completed' 
            };
        case 'on-hold':
            return { 
                color: 'text-warning', 
                bgColor: 'bg-yellow-100 dark:bg-yellow-950', 
                label: 'On Hold' 
            };
        case 'planning':
        default:
            return { 
                color: 'text-muted-foreground', 
                bgColor: 'bg-muted', 
                label: 'Planning' 
            };
    }
};