"use client"
import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../contexts/AppProvider';
import firestoreService from '../services/firestoreService';

// Utility to get date range for filtering
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

// Convert Firebase Timestamp to Date
const convertFirebaseDate = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp.toDate) return timestamp.toDate();
    return timestamp;
};

// Calculate time difference in hours
const calculateHoursDifference = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = convertFirebaseDate(startDate);
    const end = convertFirebaseDate(endDate);
    return Math.abs(end - start) / (1000 * 60 * 60);
};

// Calculate bug report completeness score
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

// Build query constraints for Firestore
const buildQueryConstraints = (filters, dateField = 'createdAt') => {
    const constraints = [];
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        constraints.push({ field: dateField, op: '>=', value: Timestamp.fromDate(fromDate) });
    }
    ['priority', 'severity', 'status', 'source', 'team', 'component', 'environment'].forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            constraints.push({ field, op: '==', value: filters[field] });
        }
    });
    return constraints;
};

// Fetch bug tracking metrics
const fetchBugTrackingMetrics = async (filters = {}, suiteContext = {}, userCapabilities = {}) => {
    try {
        const { suiteId } = suiteContext;

        if (!suiteId) {
            throw new Error('No suite selected. Please select a suite to view bug metrics.');
        }

        if (!userCapabilities.canAccessBugs) {
            throw new Error('Access denied: Bug tracking feature not available.');
        }

        const bugsCollectionPath = `testSuites/${suiteId}/bugs`;
        const constraints = buildQueryConstraints(filters);
        const queryResult = await firestoreService.queryDocuments(
            bugsCollectionPath,
            [...constraints, { field: 'createdAt', order: 'desc' }],
            'createdAt',
            1000
        );

        if (!queryResult.success) {
            throw new Error(queryResult.error.message);
        }

        const bugs = queryResult.data.map(bug => ({
            ...bug,
            createdAt: convertFirebaseDate(bug.createdAt),
            updatedAt: convertFirebaseDate(bug.updatedAt),
            resolvedAt: convertFirebaseDate(bug.resolvedAt)
        }));

        console.log(`Fetched ${bugs.length} bugs for suite ${suiteId}`);

        const totalBugs = bugs.length;

        // Calculate distributions
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

        // Calculate resolved bugs and resolution time
        const resolvedStatuses = ['Resolved', 'Closed', 'Fixed', 'Verified', 'Done'];
        const resolvedBugs = bugs.filter(bug => resolvedStatuses.includes(bug.status));
        const resolutionTimes = resolvedBugs
            .filter(bug => bug.createdAt && bug.resolvedAt)
            .map(bug => calculateHoursDifference(bug.createdAt, bug.resolvedAt));
        const avgResolutionTime = resolutionTimes.length > 0
            ? Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length)
            : 0;
        const bugResolutionRate = totalBugs > 0
            ? Math.round((resolvedBugs.length / totalBugs) * 100)
            : 0;

        // Source metrics
        const bugsFromScreenRecording = sourceCounts['screen-recording'] || 0;
        const bugsFromManualTesting = sourceCounts['manual'] || 0;
        const bugsFromAutomatedTesting = sourceCounts['automated'] || 0;

        // Evidence metrics
        const bugsWithVideoEvidence = bugs.filter(bug => bug.hasVideoEvidence).length;
        const bugsWithNetworkLogs = bugs.filter(bug => bug.hasNetworkLogs).length;
        const bugsWithConsoleLogs = bugs.filter(bug => bug.hasConsoleLogs).length;
        const bugsWithAttachments = bugs.filter(bug => bug.hasAttachments || (bug.attachments?.length > 0)).length;

        // Priority and severity metrics
        const criticalBugs = priorityCounts['Critical'] || 0;
        const highPriorityBugs = priorityCounts['High'] || 0;
        const mediumPriorityBugs = priorityCounts['Medium'] || 0;
        const lowPriorityBugs = priorityCounts['Low'] || 0;
        const criticalSeverity = severityCounts['Critical'] || 0;
        const highSeverity = severityCounts['High'] || 0;
        const mediumSeverity = severityCounts['Medium'] || 0;
        const lowSeverity = severityCounts['Low'] || 0;

        // Quality metrics
        const completenessScores = bugs.map(calculateReportCompleteness);
        const avgBugReportCompleteness = completenessScores.length > 0
            ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
            : 0;
        const bugsWithSteps = bugs.filter(bug => bug.stepsToReproduce?.trim()).length;
        const bugReproductionRate = totalBugs > 0
            ? Math.round((bugsWithSteps / totalBugs) * 100)
            : 0;

        // Recent activity metrics
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last24Hours).length;
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last7Days).length;
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthlyBugs = bugs.filter(bug => convertFirebaseDate(bug.createdAt) >= last30Days).length;

        // Report metrics
        const weeklyReportsGenerated = Math.ceil(weeklyBugs / 10);
        const monthlyReportsGenerated = Math.ceil(monthlyBugs / 20);
        const avgBugsPerReport = weeklyReportsGenerated > 0
            ? Math.round(weeklyBugs / weeklyReportsGenerated)
            : 0;

        // Trend analysis
        const bugTrend = bugs.reduce((acc, bug) => {
            const createdDate = convertFirebaseDate(bug.createdAt);
            if (createdDate) {
                const date = createdDate.toISOString().split('T')[0];
                acc[date] = acc[date] || { reported: 0, resolved: 0 };
                acc[date].reported++;
                if (bug.resolvedAt) {
                    const resolvedDate = convertFirebaseDate(bug.resolvedAt);
                    if (resolvedDate) {
                        const resolvedDateStr = resolvedDate.toISOString().split('T')[0];
                        acc[resolvedDateStr] = acc[resolvedDateStr] || { reported: 0, resolved: 0 };
                        acc[resolvedDateStr].resolved++;
                    }
                }
            }
            return acc;
        }, {});

        // Assignment metrics
        const assignedBugs = bugs.filter(bug => bug.assignedTo?.trim()).length;
        const unassignedBugs = totalBugs - assignedBugs;
        const assignmentRate = totalBugs > 0
            ? Math.round((assignedBugs / totalBugs) * 100)
            : 0;

        return {
            totalBugs,
            resolvedBugs: resolvedBugs.length,
            activeBugs: totalBugs - resolvedBugs.length,
            avgResolutionTime,
            bugResolutionRate,
            bugsFromScreenRecording,
            bugsFromManualTesting,
            bugsFromAutomatedTesting,
            bugsWithVideoEvidence,
            bugsWithNetworkLogs,
            bugsWithConsoleLogs,
            bugReportsWithAttachments: bugsWithAttachments,
            criticalBugs,
            highPriorityBugs,
            mediumPriorityBugs,
            lowPriorityBugs,
            criticalSeverity,
            highSeverity,
            mediumSeverity,
            lowSeverity,
            assignedBugs,
            unassignedBugs,
            assignmentRate,
            avgBugReportCompleteness,
            bugReproductionRate,
            weeklyReportsGenerated,
            monthlyReportsGenerated,
            avgBugsPerReport,
            statusDistribution: statusCounts,
            priorityDistribution: priorityCounts,
            severityDistribution: severityCounts,
            sourceDistribution: sourceCounts,
            environmentDistribution: environmentCounts,
            assigneeDistribution: assigneeCounts,
            bugTrend,
            recentlyReported: recentBugs,
            weeklyBugs,
            monthlyBugs,
            openBugs: statusCounts['Open'] || 0,
            inProgress: statusCounts['In Progress'] || 0,
            closed: statusCounts['Closed'] || 0,
            summary: {
                totalItems: totalBugs,
                criticalIssues: criticalBugs,
                resolutionRate: bugResolutionRate,
                suiteId,
                lastUpdated: new Date()
            }
        };
    } catch (error) {
        console.error('Error fetching bug metrics:', error);
        const errorMessage = error.message || 'Failed to fetch bug metrics';
        if (errorMessage.includes('permission-denied') || errorMessage.includes('Access denied')) {
            throw new Error('You do not have permission to view bugs for this suite');
        }
        if (errorMessage.includes('unauthenticated')) {
            throw new Error('Authentication required. Please log in.');
        }
        if (errorMessage.includes('failed-precondition')) {
            throw new Error('Database query failed. Please try again.');
        }
        if (errorMessage.includes('not-found')) {
            throw new Error('Suite not found or you do not have access.');
        }
        throw new Error(errorMessage);
    }
};

// Main hook for bug tracking metrics
export const useBugTrackingMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { activeSuite, userCapabilities, addNotification, isAuthenticated } = useApp();

    const fetchMetrics = useCallback(async () => {
        if (!isAuthenticated) {
            setMetrics(null);
            setError('User not authenticated');
            setLoading(false);
            return;
        }
        if (!activeSuite?.id) {
            setMetrics(null);
            setError('No suite selected');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const suiteContext = {
                suiteId: activeSuite.id
            };
            const data = await fetchBugTrackingMetrics(filters, suiteContext, userCapabilities);
            setMetrics(data);
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
    }, [filters, activeSuite?.id, userCapabilities, isAuthenticated, addNotification]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const refetch = useCallback(() => fetchMetrics(), [fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        refetch,
        canRead: userCapabilities?.canAccessBugs,
        canWrite: userCapabilities?.canCreateBugs,
        canModify: userCapabilities?.canCreateBugs,
        canViewAnalytics: userCapabilities?.canViewBugAnalytics,
        canExportReports: userCapabilities?.canExportReports
    };
};

export { fetchBugTrackingMetrics };