import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../contexts/AppProvider';
import firestoreService from './firestoreService';

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

// Helper function to convert Firebase Timestamp to Date
const convertFirebaseDate = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp.toDate) return timestamp.toDate();
    return timestamp;
};

// Helper function to calculate time difference in hours
const calculateHoursDifference = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = convertFirebaseDate(startDate);
    const end = convertFirebaseDate(endDate);
    return Math.abs(end - start) / (1000 * 60 * 60);
};

// Calculate bug report completeness score (matching Bug Service)
const calculateReportCompleteness = (bug) => {
    let score = 0;
    const totalFields = 10;
    if (bug.title?.trim()) score++;
    if (bug.actualBehavior?.trim()) score++;
    if (bug.expectedBehavior?.trim()) score++;
    if (bug.stepsToReproduce?.trim()) score++;
    if (bug.environment) score++;
    if (bug.priority) score++;
    if (bug.severity) score++;
    if (bug.category) score++;
    if (bug.hasAttachments || (bug.attachments?.length > 0)) score++;
    if (bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs) score++;
    return Math.round((score / totalFields) * 100);
};

// Build query constraints for Firestore (aligned with bugTrackingService)
const buildQueryConstraints = (filters, dateField = 'createdAt') => {
    const constraints = [];
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        constraints.push({ field: dateField, op: '>=', value: Timestamp.fromDate(fromDate) });
    }
    ['priority', 'severity', 'status', 'source', 'team', 'component', 'environment', 'feature', 'sprint'].forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            constraints.push({ field, op: '==', value: filters[field] });
        }
    });
    return constraints;
};

// Consolidated bug metrics calculator (enhanced from both services)
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
            bugReproductionRate: 0,
            bugsWithEvidence: 0,
            bugsWithVideoEvidence: 0,
            bugsWithNetworkLogs: 0,
            bugsWithConsoleLogs: 0,
            bugReportsWithAttachments: 0,
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsFromAutomatedTesting: 0,
            assignedBugs: 0,
            unassignedBugs: 0,
            assignmentRate: 0,
            highPriorityBugs: 0,
            mediumPriorityBugs: 0,
            lowPriorityBugs: 0,
            criticalSeverity: 0,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
            recentlyReported: 0,
            weeklyBugs: 0,
            monthlyBugs: 0,
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0,
            statusDistribution: {},
            priorityDistribution: {},
            severityDistribution: {},
            sourceDistribution: {},
            environmentDistribution: {},
            assigneeDistribution: {},
            openBugs: 0,
            inProgress: 0,
            closed: 0
        };
    }

    const totalBugs = bugs.length;
    
    const statusCounts = bugs.reduce((acc, bug) => {
        const status = bug.status || 'Open';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const priorityCounts = bugs.reduce((acc, bug) => {
        const priority = bug.priority || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    const severityCounts = bugs.reduce((acc, bug) => {
        const severity = bug.severity || 'Medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {});

    const sourceCounts = bugs.reduce((acc, bug) => {
        const source = bug.source || 'manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    const environmentCounts = bugs.reduce((acc, bug) => {
        const environment = bug.environment || 'Unknown';
        acc[environment] = (acc[environment] || 0) + 1;
        return acc;
    }, {});

    const assigneeCounts = bugs.reduce((acc, bug) => {
        const assignee = bug.assignedTo || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
    }, {});

    const resolvedStatuses = ['Resolved', 'Closed', 'Fixed', 'Done', 'Verified'];
    const resolvedBugs = bugs.filter(bug => resolvedStatuses.includes(bug.status));
    const activeBugs = totalBugs - resolvedBugs.length;
    
    const criticalBugs = bugs.filter(bug => bug.severity === 'Critical' || bug.priority === 'Critical').length;

    const resolvedBugsWithTimes = resolvedBugs.filter(bug => bug.resolvedAt && bug.createdAt);
    const avgResolutionTime = resolvedBugsWithTimes.length > 0
        ? Math.round(resolvedBugsWithTimes.reduce((sum, bug) => sum + calculateHoursDifference(bug.createdAt, bug.resolvedAt), 0) / resolvedBugsWithTimes.length)
        : 0;

    const bugResolutionRate = totalBugs > 0 ? Math.round((resolvedBugs.length / totalBugs) * 100) : 0;

    const completenessScores = bugs.map(calculateReportCompleteness);
    const avgReportCompleteness = completenessScores.length > 0
        ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
        : 0;

    const bugsWithVideoEvidence = bugs.filter(bug => bug.hasVideoEvidence).length;
    const bugsWithNetworkLogs = bugs.filter(bug => bug.hasNetworkLogs).length;
    const bugsWithConsoleLogs = bugs.filter(bug => bug.hasConsoleLogs).length;
    const bugsWithAttachments = bugs.filter(bug => bug.hasAttachments || (bug.attachments?.length > 0)).length;
    const bugsWithEvidence = bugs.filter(bug => 
        bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs || 
        bug.hasAttachments || (bug.attachments?.length > 0)
    ).length;

    const bugsFromScreenRecording = sourceCounts['screen-recording'] || 0;
    const bugsFromManualTesting = sourceCounts['manual'] || 0;
    const bugsFromAutomatedTesting = sourceCounts['automated'] || 0;

    const highPriorityBugs = priorityCounts['High'] || 0;
    const mediumPriorityBugs = priorityCounts['Medium'] || 0;
    const lowPriorityBugs = priorityCounts['Low'] || 0;

    const criticalSeverity = severityCounts['Critical'] || 0;
    const highSeverity = severityCounts['High'] || 0;
    const mediumSeverity = severityCounts['Medium'] || 0;
    const lowSeverity = severityCounts['Low'] || 0;

    const assignedBugs = bugs.filter(bug => bug.assignedTo?.trim()).length;
    const unassignedBugs = totalBugs - assignedBugs;
    const assignmentRate = totalBugs > 0 ? Math.round((assignedBugs / totalBugs) * 100) : 0;

    const bugsWithSteps = bugs.filter(bug => bug.stepsToReproduce?.trim()).length;
    const bugReproductionRate = totalBugs > 0 ? Math.round((bugsWithSteps / totalBugs) * 100) : 0;

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last24Hours).length;

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last7Days).length;

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last30Days).length;

    const weeklyReportsGenerated = Math.ceil(weeklyBugs / 10);
    const monthlyReportsGenerated = Math.ceil(monthlyBugs / 20);
    const avgBugsPerReport = weeklyReportsGenerated > 0 ? Math.round(weeklyBugs / weeklyReportsGenerated) : 0;

    return {
        totalBugs,
        resolvedBugs: resolvedBugs.length,
        activeBugs,
        criticalBugs,
        avgResolutionTime,
        bugResolutionRate,
        avgReportCompleteness,
        bugReproductionRate,
        bugsWithEvidence,
        bugsWithVideoEvidence,
        bugsWithNetworkLogs,
        bugsWithConsoleLogs,
        bugReportsWithAttachments: bugsWithAttachments,
        bugsFromScreenRecording,
        bugsFromManualTesting,
        bugsFromAutomatedTesting,
        assignedBugs,
        unassignedBugs,
        assignmentRate,
        highPriorityBugs,
        mediumPriorityBugs,
        lowPriorityBugs,
        criticalSeverity,
        highSeverity,
        mediumSeverity,
        lowSeverity,
        recentlyReported: recentBugs,
        weeklyBugs,
        monthlyBugs,
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport,
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        severityDistribution: severityCounts,
        sourceDistribution: sourceCounts,
        environmentDistribution: environmentCounts,
        assigneeDistribution: assigneeCounts,
        openBugs: statusCounts['Open'] || 0,
        inProgress: statusCounts['In Progress'] || 0,
        closed: statusCounts['Closed'] || 0
    };
};

// Secure fetch function using FirestoreService
const fetchSecureData = async (collectionName, filters, dateField, projectId, userCapabilities) => {
    try {
        if (!projectId) {
            throw new Error(`No project selected. Please select a project to view ${collectionName}.`);
        }

        if (!userCapabilities.canAccessBugs) {
            throw new Error(`You do not have permission to view ${collectionName} for this project.`);
        }

        const collectionPath = `projects/${projectId}/${collectionName}`;
        const constraints = buildQueryConstraints(filters, dateField);
        const queryResult = await firestoreService.queryDocuments(
            collectionPath,
            [...constraints, { field: dateField, order: 'desc' }],
            dateField,
            1000
        );

        if (!queryResult.success) {
            throw new Error(queryResult.error.message);
        }

        const data = queryResult.data.map(doc => ({
            id: doc.id,
            ...doc,
            createdAt: convertFirebaseDate(doc.createdAt),
            updatedAt: convertFirebaseDate(doc.updatedAt),
            resolvedAt: convertFirebaseDate(doc.resolvedAt)
        }));

        console.log(`Fetched ${data.length} ${collectionName} for project ${projectId}`);
        return data;
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        const errorMessage = error.message || `Failed to fetch ${collectionName}`;
        if (errorMessage.includes('permission-denied') || errorMessage.includes('Access denied')) {
            throw new Error(`You do not have permission to view ${collectionName} for this project`);
        }
        if (errorMessage.includes('unauthenticated')) {
            throw new Error('Authentication required. Please log in.');
        }
        if (errorMessage.includes('failed-precondition')) {
            throw new Error('Database query failed. Please try again.');
        }
        if (errorMessage.includes('not-found')) {
            throw new Error('Project not found or you do not have access.');
        }
        throw new Error(errorMessage);
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

// Main hook for bug metrics
export const useBugMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { activeSuite: activeProject, userCapabilities, isAuthenticated, addNotification } = useApp();

    const fetchBugMetrics = useCallback(async () => {
        if (!isAuthenticated) {
            setMetrics(null);
            setError('User not authenticated');
            setLoading(false);
            return;
        }
        if (!activeProject?.id) {
            setMetrics(null);
            setError('No project selected');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const bugs = await fetchSecureData('bugs', filters, 'createdAt', activeProject.id, userCapabilities);
            const bugMetrics = calculateBugMetrics(bugs);
            setMetrics({
                ...bugMetrics,
                summary: {
                    totalItems: bugs.length,
                    criticalIssues: bugMetrics.criticalBugs,
                    bugResolutionRate: bugMetrics.bugResolutionRate,
                    projectId: activeProject.id,
                    lastUpdated: new Date()
                }
            });
        } catch (err) {
            setError(err.message);
            addNotification({
                type: 'error',
                title: 'Bug Metrics Error',
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    }, [filters, activeProject?.id, userCapabilities, isAuthenticated, addNotification]);

    useEffect(() => {
        fetchBugMetrics();
    }, [fetchBugMetrics]);

    const refetch = useCallback(() => fetchBugMetrics(), [fetchBugMetrics]);

    return {
        metrics,
        loading,
        error,
        refetch,
        hasAccess: !!activeProject && userCapabilities?.canAccessBugs,
        canModify: !!activeProject && userCapabilities?.canCreateBugs,
        activeProject
    };
};

// TODO: Uncomment and implement when consolidated metrics are needed
// export const useQAIDMetrics = (filters = {}) => {
//     const [metrics, setMetrics] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const { activeSuite: activeProject, userCapabilities, isAuthenticated, addNotification } = useApp();

//     const fetchAllMetrics = useCallback(async () => {
//         if (!isAuthenticated) {
//             setMetrics(null);
//             setError('User not authenticated');
//             setLoading(false);
//             return;
//         }
//         if (!activeProject?.id) {
//             setMetrics(null);
//             setError('No project selected');
//             setLoading(false);
//             return;
//         }

//         try {
//             setLoading(true);
//             setError(null);
//             const [bugs] = await Promise.all([
//                 fetchSecureData('bugs', filters, 'createdAt', activeProject.id, userCapabilities),
//                 // fetchSecureData('testCases', filters, 'createdAt', activeProject.id, userCapabilities),
//                 // fetchSecureData('recordings', filters, 'createdAt', activeProject.id, userCapabilities)
//             ]);

//             const bugMetrics = calculateBugMetrics(bugs);
//             setMetrics({
//                 bugs: bugMetrics,
//                 summary: {
//                     totalItems: bugs.length,
//                     criticalIssues: bugMetrics.criticalBugs,
//                     bugResolutionRate: bugMetrics.bugResolutionRate,
//                     projectId: activeProject.id,
//                     lastUpdated: new Date()
//                 }
//             });
//         } catch (err) {
//             setError(err.message);
//             addNotification({
//                 type: 'error',
//                 title: 'Metrics Error',
//                 message: err.message
//             });
//         } finally {
//             setLoading(false);
//         }
//     }, [filters, activeProject?.id, userCapabilities, isAuthenticated, addNotification]);

//     useEffect(() => {
//         fetchAllMetrics();
//     }, [fetchAllMetrics]);

//     const refetch = useCallback(() => fetchAllMetrics(), [fetchAllMetrics]);

//     return {
//         metrics,
//         loading,
//         error,
//         refetch,
//         hasAccess: !!activeProject && userCapabilities?.canAccessBugs,
//         canModify: !!activeProject && userCapabilities?.canCreateBugs,
//         activeProject
//     };
// };

export { fetchSecureData, calculateBugMetrics };