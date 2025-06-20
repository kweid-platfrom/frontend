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
import { useProject } from '../context/ProjectContext';

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
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    if (timestamp.toDate) {
        return timestamp.toDate();
    }
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

    // Check for required fields
    if (bug.title && bug.title.trim()) score++;
    if (bug.actualBehavior && bug.actualBehavior.trim()) score++;
    if (bug.expectedBehavior && bug.expectedBehavior.trim()) score++;
    if (bug.stepsToReproduce && bug.stepsToReproduce.trim()) score++;
    if (bug.environment) score++;
    if (bug.priority) score++;
    if (bug.severity) score++;
    if (bug.category) score++;
    
    // Check for attachments/evidence
    if (bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)) score++;
    if (bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs) score++;

    return Math.round((score / totalFields) * 100);
};

// Apply filters to the query (matching Bug Service architecture)
const applyFilters = (baseQuery, filters, dateField = 'createdAt') => {
    let filteredQuery = baseQuery;

    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        filteredQuery = query(filteredQuery, where(dateField, '>=', Timestamp.fromDate(fromDate)));
    }

    // Individual field filters
    const filterFields = ['priority', 'severity', 'status', 'source', 'team', 'component', 'environment', 'feature', 'sprint'];
    filterFields.forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            filteredQuery = query(filteredQuery, where(field, '==', filters[field]));
        }
    });

    return filteredQuery;
};

// Consolidated bug metrics calculator (enhanced from both services)
const calculateBugMetrics = (bugs = []) => {
    if (!Array.isArray(bugs) || bugs.length === 0) {
        return {
            // Core metrics
            totalBugs: 0,
            resolvedBugs: 0,
            activeBugs: 0,
            criticalBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            
            // Quality metrics
            avgReportCompleteness: 0,
            bugReproductionRate: 0,
            
            // Evidence metrics
            bugsWithEvidence: 0,
            bugsWithVideoEvidence: 0,
            bugsWithNetworkLogs: 0,
            bugsWithConsoleLogs: 0,
            bugReportsWithAttachments: 0,
            
            // Source metrics
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsFromAutomatedTesting: 0,
            
            // Assignment metrics
            assignedBugs: 0,
            unassignedBugs: 0,
            assignmentRate: 0,
            
            // Priority breakdown
            highPriorityBugs: 0,
            mediumPriorityBugs: 0,
            lowPriorityBugs: 0,
            
            // Severity breakdown
            criticalSeverity: 0,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
            
            // Activity metrics
            recentlyReported: 0,
            weeklyBugs: 0,
            monthlyBugs: 0,
            
            // Report metrics
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0,
            
            // Distributions
            statusDistribution: {},
            priorityDistribution: {},
            severityDistribution: {},
            sourceDistribution: {},
            environmentDistribution: {},
            assigneeDistribution: {}
        };
    }

    const totalBugs = bugs.length;
    
    // Status distribution
    const statusCounts = bugs.reduce((acc, bug) => {
        const status = bug.status || 'Open';
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

    // Source distribution
    const sourceCounts = bugs.reduce((acc, bug) => {
        const source = bug.source || 'manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    // Environment distribution
    const environmentCounts = bugs.reduce((acc, bug) => {
        const environment = bug.environment || 'Unknown';
        acc[environment] = (acc[environment] || 0) + 1;
        return acc;
    }, {});

    // Resolution metrics
    const resolvedStatuses = ['Resolved', 'Closed', 'Fixed', 'Done', 'Verified'];
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
            return sum + calculateHoursDifference(bug.createdAt, bug.resolvedAt);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedBugsWithTimes.length);
    }

    // Bug resolution rate
    const bugResolutionRate = totalBugs > 0 ? Math.round((resolvedBugs.length / totalBugs) * 100) : 0;

    // Report completeness
    const completenessScores = bugs.map(calculateReportCompleteness);
    const avgReportCompleteness = completenessScores.length > 0
        ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
        : 0;

    // Evidence metrics
    const bugsWithVideoEvidence = bugs.filter(bug => bug.hasVideoEvidence).length;
    const bugsWithNetworkLogs = bugs.filter(bug => bug.hasNetworkLogs).length;
    const bugsWithConsoleLogs = bugs.filter(bug => bug.hasConsoleLogs).length;
    const bugsWithAttachments = bugs.filter(bug => 
        bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)
    ).length;
    const bugsWithEvidence = bugs.filter(bug => 
        bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs || 
        bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)
    ).length;

    // Source metrics
    const bugsFromScreenRecording = sourceCounts['screen-recording'] || 0;
    const bugsFromManualTesting = sourceCounts['manual'] || 0;
    const bugsFromAutomatedTesting = sourceCounts['automated'] || 0;

    // Priority breakdown
    const highPriorityBugs = priorityCounts['High'] || 0;
    const mediumPriorityBugs = priorityCounts['Medium'] || 0;
    const lowPriorityBugs = priorityCounts['Low'] || 0;

    // Severity breakdown
    const criticalSeverity = severityCounts['Critical'] || 0;
    const highSeverity = severityCounts['High'] || 0;
    const mediumSeverity = severityCounts['Medium'] || 0;
    const lowSeverity = severityCounts['Low'] || 0;

    // Assignment metrics
    const assignedBugs = bugs.filter(bug => bug.assignedTo && bug.assignedTo.trim()).length;
    const unassignedBugs = totalBugs - assignedBugs;
    const assignmentRate = totalBugs > 0 ? Math.round((assignedBugs / totalBugs) * 100) : 0;

    // Assignee distribution
    const assigneeDistribution = bugs.reduce((acc, bug) => {
        const assignee = bug.assignedTo || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
    }, {});

    // Reproduction rate
    const bugsWithSteps = bugs.filter(bug => 
        bug.stepsToReproduce && bug.stepsToReproduce.trim()
    ).length;
    const bugReproductionRate = totalBugs > 0 ? Math.round((bugsWithSteps / totalBugs) * 100) : 0;

    // Recent activity metrics
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBugs = bugs.filter(bug => {
        const createdDate = convertFirebaseDate(bug.createdAt);
        return createdDate >= last24Hours;
    }).length;

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyBugs = bugs.filter(bug => {
        const createdDate = convertFirebaseDate(bug.createdAt);
        return createdDate >= last7Days;
    }).length;

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBugs = bugs.filter(bug => {
        const createdDate = convertFirebaseDate(bug.createdAt);
        return createdDate >= last30Days;
    }).length;

    // Report generation metrics
    const weeklyReportsGenerated = Math.ceil(weeklyBugs / 10);
    const monthlyReportsGenerated = Math.ceil(monthlyBugs / 20);
    const avgBugsPerReport = weeklyReportsGenerated > 0 ? Math.round(weeklyBugs / weeklyReportsGenerated) : 0;

    return {
        // Core metrics
        totalBugs,
        resolvedBugs: resolvedBugs.length,
        activeBugs,
        criticalBugs,
        avgResolutionTime,
        bugResolutionRate,
        
        // Quality metrics
        avgReportCompleteness,
        bugReproductionRate,
        
        // Evidence metrics
        bugsWithEvidence,
        bugsWithVideoEvidence,
        bugsWithNetworkLogs,
        bugsWithConsoleLogs,
        bugReportsWithAttachments: bugsWithAttachments,
        
        // Source metrics
        bugsFromScreenRecording,
        bugsFromManualTesting,
        bugsFromAutomatedTesting,
        
        // Assignment metrics
        assignedBugs,
        unassignedBugs,
        assignmentRate,
        
        // Priority breakdown
        highPriorityBugs,
        mediumPriorityBugs,
        lowPriorityBugs,
        
        // Severity breakdown
        criticalSeverity,
        highSeverity,
        mediumSeverity,
        lowSeverity,
        
        // Activity metrics
        recentlyReported: recentBugs,
        weeklyBugs,
        monthlyBugs,
        
        // Report metrics
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport,
        
        // Distributions
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        severityDistribution: severityCounts,
        sourceDistribution: sourceCounts,
        environmentDistribution: environmentCounts,
        assigneeDistribution,
        
        // Additional status metrics
        openBugs: statusCounts['Open'] || 0,
        inProgress: statusCounts['In Progress'] || 0,
        closed: statusCounts['Closed'] || 0
    };
};

// Secure fetch function matching Bug Service architecture
const fetchSecureData = async (collectionName, filters, dateField, projectId, hasPermission) => {
    try {
        // Check if project is selected
        if (!projectId) {
            throw new Error(`No project selected. Please select a project to view ${collectionName}.`);
        }

        // Check permissions if available
        if (hasPermission && !hasPermission('read_bugs')) {
            throw new Error(`You do not have permission to view ${collectionName} for this project.`);
        }

        // Query the project's subcollection (matching Bug Service logic)
        const collectionRef = collection(db, 'projects', projectId, collectionName);
        const filteredQuery = applyFilters(collectionRef, filters, dateField);
        
        // Add ordering and limit for performance
        const finalQuery = query(
            filteredQuery,
            orderBy(dateField, 'desc'),
            limit(1000) // Reasonable limit
        );

        console.log(`Executing ${collectionName} query for project:`, projectId);
        const snapshot = await getDocs(finalQuery);
        const data = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            resolvedAt: doc.data().resolvedAt?.toDate()
        }));

        console.log(`Fetched ${data.length} ${collectionName} for metrics`);
        return data;
        
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        
        // Handle specific Firebase errors
        if (error.code === 'permission-denied') {
            throw new Error(`You do not have permission to view ${collectionName} for this project`);
        }
        
        if (error.code === 'unauthenticated') {
            throw new Error('Authentication required. Please log in to continue.');
        }
        
        if (error.code === 'failed-precondition') {
            throw new Error('Database query failed. Please try again or contact support.');
        }
        
        if (error.code === 'not-found') {
            throw new Error('Project not found or you do not have access to it.');
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

// Main hook for bug metrics (updated to match Bug Service architecture)
export const useBugMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get auth and project context (matching Bug Service)
    const { hasPermission } = useAuth();
    const { activeProject } = useProject();

    const fetchBugMetrics = useCallback(async () => {
        if (!activeProject?.id) {
            setMetrics(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch only bug data for now (matching Bug Service approach)
            const bugs = await fetchSecureData('bugs', filters, 'createdAt', activeProject.id, hasPermission);

            // Calculate bug metrics using the enhanced calculator
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
            console.error('Error fetching bug metrics:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, activeProject?.id, hasPermission]);

    useEffect(() => {
        fetchBugMetrics();
    }, [fetchBugMetrics]);

    const refetch = useCallback(() => {
        fetchBugMetrics();
    }, [fetchBugMetrics]);

    return {
        metrics,
        loading,
        error,
        refetch,
        // Additional helper methods (matching Bug Service)
        hasAccess: activeProject && (!hasPermission || hasPermission('read_bugs')),
        canModify: activeProject && (!hasPermission || hasPermission('write_bugs')),
        activeProject
    };
};

// TODO: Uncomment and implement when consolidated metrics are needed
// export const useQAIDMetrics = (filters = {}) => {
//     const [metrics, setMetrics] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
    
//     // Get auth and project context
//     const { hasPermission } = useAuth();
//     const { activeProject } = useProject();

//     const fetchAllMetrics = useCallback(async () => {
//         if (!activeProject?.id) {
//             setMetrics(null);
//             setLoading(false);
//             return;
//         }

//         try {
//             setLoading(true);
//             setError(null);

//             // Fetch all data types when ready
//             const [bugs, testCases, recordings] = await Promise.all([
//                 fetchSecureData('bugs', filters, 'createdAt', activeProject.id, hasPermission),
//                 // fetchSecureData('testCases', filters, 'createdAt', activeProject.id, hasPermission),
//                 // fetchSecureData('recordings', filters, 'createdAt', activeProject.id, hasPermission)
//             ]);

//             // Calculate metrics for each data type
//             const bugMetrics = calculateBugMetrics(bugs);
//             // const testCaseMetrics = calculateTestCaseMetrics(testCases);
//             // const recordingMetrics = calculateRecordingMetrics(recordings);

//             setMetrics({
//                 bugs: bugMetrics,
//                 // testCases: testCaseMetrics,
//                 // recordings: recordingMetrics,
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
//             console.error('Error fetching QAID metrics:', err);
//         } finally {
//             setLoading(false);
//         }
//     }, [filters, activeProject?.id, hasPermission]);

//     useEffect(() => {
//         fetchAllMetrics();
//     }, [fetchAllMetrics]);

//     const refetch = useCallback(() => {
//         fetchAllMetrics();
//     }, [fetchAllMetrics]);

//     return {
//         metrics,
//         loading,
//         error,
//         refetch,
//         hasAccess: activeProject && (!hasPermission || hasPermission('read_bugs')),
//         canModify: activeProject && (!hasPermission || hasPermission('write_bugs')),
//         activeProject
//     };
// };

// Export the main fetch function for use in other services
export { fetchSecureData, calculateBugMetrics };