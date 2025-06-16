import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthProvider';

// Utility function to get date range filter
const getDateRange = (timeRange) => {
    const now = new Date();
    const ranges = {
        '1d': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return ranges[timeRange] || ranges['7d'];
};

// Apply filters with proper user permissions based on your auth structure
const applyFilters = (baseQuery, filters, dateField = 'createdAt', userContext = null) => {
    let filteredQuery = baseQuery;

    // Security: Add user-based filtering based on your auth structure
    if (userContext) {
        // Filter by organization if user belongs to one
        if (userContext.userProfile?.organizationId) {
            filteredQuery = query(filteredQuery, where('organizationId', '==', userContext.userProfile.organizationId));
        }
        // If no organization, filter by user ID for individual accounts
        else if (userContext.currentUser?.uid) {
            filteredQuery = query(filteredQuery, where('createdBy', '==', userContext.currentUser.uid));
        }

        // Additional team-based filtering if your data model supports it
        if (userContext.userProfile?.accessibleTeams && userContext.userProfile.accessibleTeams.length > 0) {
            // Note: This assumes your documents have a 'team' field
            // Firestore 'in' queries are limited to 10 values
            const teams = userContext.userProfile.accessibleTeams.slice(0, 10);
            filteredQuery = query(filteredQuery, where('team', 'in', teams));
        }
    }

    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        filteredQuery = query(filteredQuery, where(dateField, '>=', Timestamp.fromDate(fromDate)));
    }

    // Apply other filters
    const filterFields = ['team', 'component', 'severity', 'priority', 'status', 'feature', 'sprint'];
    filterFields.forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            filteredQuery = query(filteredQuery, where(field, '==', filters[field]));
        }
    });

    return filteredQuery;
};

// Consolidated bug metrics calculator
const calculateBugMetrics = (bugs = []) => {
    if (!Array.isArray(bugs) || bugs.length === 0) {
        return {
            totalBugs: 0,
            resolvedBugs: 0,
            activeBugs: 0,
            criticalBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            avgReportCompleteness: 0,
            bugsWithEvidence: 0,
            statusDistribution: {},
            priorityDistribution: {},
            severityDistribution: {}
        };
    }

    const totalBugs = bugs.length;
    
    // Status distribution
    const statusCounts = bugs.reduce((acc, bug) => {
        const status = bug.status || 'New';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    // Priority distribution  
    const priorityCounts = bugs.reduce((acc, bug) => {
        const priority = bug.priority || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    // Severity distribution
    const severityCounts = bugs.reduce((acc, bug) => {
        const severity = bug.severity || 'Medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {});

    // Resolution metrics
    const resolvedStatuses = ['Resolved', 'Closed', 'Fixed', 'Done'];
    const resolvedBugs = bugs.filter(bug => resolvedStatuses.includes(bug.status));
    const activeBugs = totalBugs - resolvedBugs.length;
    
    // Critical bugs
    const criticalBugs = bugs.filter(bug => 
        bug.severity === 'Critical' || bug.priority === 'Critical'
    ).length;

    // Calculate average resolution time
    const resolvedBugsWithTimes = resolvedBugs.filter(bug => bug.resolvedAt && bug.createdAt);
    let avgResolutionTime = 0;
    
    if (resolvedBugsWithTimes.length > 0) {
        const totalTime = resolvedBugsWithTimes.reduce((sum, bug) => {
            const created = bug.createdAt.toDate ? bug.createdAt.toDate() : new Date(bug.createdAt);
            const resolved = bug.resolvedAt.toDate ? bug.resolvedAt.toDate() : new Date(bug.resolvedAt);
            return sum + (resolved - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedBugsWithTimes.length / (1000 * 60 * 60)); // hours
    }

    // Bug resolution rate
    const bugResolutionRate = totalBugs > 0 ? Math.round((resolvedBugs.length / totalBugs) * 100) : 0;

    // Report completeness
    const calculateCompleteness = (bug) => {
        let score = 0;
        const fields = ['title', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior', 'environment'];
        fields.forEach(field => {
            if (bug[field] && bug[field].toString().trim().length > 5) score++;
        });
        if (bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)) score++;
        return Math.round((score / 6) * 100);
    };

    const avgReportCompleteness = totalBugs > 0 
        ? Math.round(bugs.reduce((sum, bug) => sum + calculateCompleteness(bug), 0) / totalBugs)
        : 0;

    // Evidence metrics
    const bugsWithEvidence = bugs.filter(bug => 
        bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs || 
        (bug.attachments && bug.attachments.length > 0)
    ).length;

    return {
        totalBugs,
        resolvedBugs: resolvedBugs.length,
        activeBugs,
        criticalBugs,
        avgResolutionTime,
        bugResolutionRate,
        avgReportCompleteness,
        bugsWithEvidence,
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        severityDistribution: severityCounts
    };
};

// Secure fetch function with error handling using your auth structure
const fetchSecureData = async (collectionName, filters, dateField, userContext) => {
    try {
        // Check authentication using your auth structure
        if (!userContext?.currentUser) {
            throw new Error('Authentication required');
        }

        // Check if user has required permissions using your hasPermission method
        if (!userContext.hasPermission('read_tests')) {
            throw new Error('Insufficient permissions to read QA data');
        }

        const collectionRef = collection(db, collectionName);
        const filteredQuery = applyFilters(collectionRef, filters, dateField, userContext);
        
        // Add ordering and limit for performance
        const finalQuery = query(
            filteredQuery,
            orderBy(dateField, 'desc'),
            limit(1000) // Reasonable limit
        );

        const snapshot = await getDocs(finalQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        
        // Handle specific permission errors
        if (error.code === 'permission-denied') {
            throw new Error(`Access denied to ${collectionName}. Please check your permissions.`);
        }
        
        throw error;
    }
};

// TODO: Implement test case metrics when test cases feature is ready
// const calculateTestCaseMetrics = (testCases = []) => {
//     if (!Array.isArray(testCases) || testCases.length === 0) {
//         return {
//             total: 0,
//             passed: 0,
//             failed: 0,
//             pending: 0,
//             skipped: 0,
//             passRate: 0,
//             statusDistribution: {}
//         };
//     }

//     const total = testCases.length;
//     const statusCounts = testCases.reduce((acc, testCase) => {
//         const status = testCase.status || 'pending';
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//     }, {});

//     const passed = statusCounts.passed || 0;
//     const failed = statusCounts.failed || 0;
//     const pending = statusCounts.pending || 0;
//     const skipped = statusCounts.skipped || 0;

//     const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

//     return {
//         total,
//         passed,
//         failed,
//         pending,
//         skipped,
//         passRate,
//         statusDistribution: statusCounts
//     };
// };

// TODO: Implement recording metrics when recordings feature is ready
// const calculateRecordingMetrics = (recordings = []) => {
//     if (!Array.isArray(recordings) || recordings.length === 0) {
//         return {
//             total: 0,
//             completed: 0,
//             processing: 0,
//             failed: 0,
//             avgDuration: 0,
//             statusDistribution: {}
//         };
//     }

//     const total = recordings.length;
//     const statusCounts = recordings.reduce((acc, recording) => {
//         const status = recording.status || 'processing';
//         acc[status] = (acc[status] || 0) + 1;
//         return acc;
//     }, {});

//     const completed = statusCounts.completed || 0;
//     const processing = statusCounts.processing || 0;
//     const failed = statusCounts.failed || 0;

//     // Calculate average duration for completed recordings
//     const completedWithDuration = recordings.filter(r => 
//         r.status === 'completed' && r.duration && r.duration > 0
//     );
    
//     const avgDuration = completedWithDuration.length > 0
//         ? Math.round(completedWithDuration.reduce((sum, r) => sum + r.duration, 0) / completedWithDuration.length)
//         : 0;

//     return {
//         total,
//         completed,
//         processing,
//         failed,
//         avgDuration,
//         statusDistribution: statusCounts
//     };
// };

// Main hook for bug metrics only (other features commented out until implemented)
export const useBugMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Use your actual auth context
    const {
        currentUser,
        userProfile,
        hasPermission,
        hasRole,
        loading: authLoading
    } = useAuth();

    const fetchBugMetrics = useCallback(async () => {
        // Wait for auth to be ready
        if (authLoading) {
            return;
        }

        if (!currentUser) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        // Check permissions using your auth structure
        if (!hasPermission('read_tests')) {
            setError('Insufficient permissions to view bug metrics');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create user context object from your auth structure
            const userContext = {
                currentUser,
                userProfile,
                hasPermission,
                hasRole
            };

            // Fetch only bug data for now
            const bugs = await fetchSecureData('bugs', filters, 'createdAt', userContext);

            // Calculate bug metrics
            const bugMetrics = calculateBugMetrics(bugs);

            setMetrics({
                ...bugMetrics,
                summary: {
                    totalItems: bugs.length,
                    criticalIssues: bugMetrics.criticalBugs,
                    bugResolutionRate: bugMetrics.bugResolutionRate
                },
                lastUpdated: new Date()
            });

        } catch (err) {
            setError(err.message);
            console.error('Error fetching bug metrics:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, currentUser, userProfile, hasPermission, hasRole, authLoading]);

    useEffect(() => {
        fetchBugMetrics();
    }, [fetchBugMetrics]);

    const refetch = useCallback(() => {
        fetchBugMetrics();
    }, [fetchBugMetrics]);

    return {
        metrics,
        loading: loading || authLoading,
        error,
        refetch,
        // Additional helper methods
        hasAccess: currentUser && hasPermission('read_tests'),
        canModify: currentUser && hasPermission('write_tests'),
        isAdmin: currentUser && hasRole('admin')
    };
};

// TODO: Uncomment and implement when consolidated metrics are needed
// export const useQAIDMetrics = (filters = {}) => {
//     const [metrics, setMetrics] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
    
//     // Use your actual auth context
//     const {
//         currentUser,
//         userProfile,
//         hasPermission,
//         hasRole,
//         loading: authLoading
//     } = useAuth();

//     const fetchAllMetrics = useCallback(async () => {
//         // Implementation for when all features are ready
//         // This will include bugs, testCases, and recordings
//     }, [filters, currentUser, userProfile, hasPermission, hasRole, authLoading]);

//     useEffect(() => {
//         fetchAllMetrics();
//     }, [fetchAllMetrics]);

//     const refetch = useCallback(() => {
//         fetchAllMetrics();
//     }, [fetchAllMetrics]);

//     return {
//         metrics,
//         loading: loading || authLoading,
//         error,
//         refetch,
//         hasAccess: currentUser && hasPermission('read_tests'),
//         canModify: currentUser && hasPermission('write_tests'),
//         isAdmin: currentUser && hasRole('admin')
//     };
// };

// TODO: Uncomment when test cases feature is implemented
// export const useTestCaseMetrics = (filters = {}) => {
//     const { metrics, loading, error, refetch, hasAccess, canModify, isAdmin } = useQAMetrics(filters);
    
//     return {
//         metrics: metrics?.testCases || null,
//         loading,
//         error,
//         refetch,
//         hasAccess,
//         canModify,
//         isAdmin
//     };
// };

// TODO: Uncomment when recordings feature is implemented
// export const useRecordingMetrics = (filters = {}) => {
//     const { metrics, loading, error, refetch, hasAccess, canModify, isAdmin } = useQAMetrics(filters);
    
//     return {
//         metrics: metrics?.recordings || null,
//         loading,
//         error,
//         refetch,
//         hasAccess,
//         canModify,
//         isAdmin
//     };
// };