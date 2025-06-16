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

// Calculate bug report completeness score
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

// Apply filters with proper user permissions and security
const applyFilters = (baseQuery, filters, dateField = 'createdAt', userContext = null) => {
    let filteredQuery = baseQuery;

    // CRITICAL: Add user-based filtering for security
    if (userContext?.currentUser?.uid) {
        // Option 1: If your security rules require createdBy field
        filteredQuery = query(filteredQuery, where('createdBy', '==', userContext.currentUser.uid));
        
        // Option 2: If you have organization-based access
        // if (userContext.userProfile?.organizationId) {
        //     filteredQuery = query(filteredQuery, where('organizationId', '==', userContext.userProfile.organizationId));
        // }
        
        // Option 3: If you have team-based access
        // if (userContext.userProfile?.teamId) {
        //     filteredQuery = query(filteredQuery, where('teamId', '==', userContext.userProfile.teamId));
        // }
    }

    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        filteredQuery = query(filteredQuery, where(dateField, '>=', Timestamp.fromDate(fromDate)));
    }

    // Individual field filters
    const filterFields = ['priority', 'severity', 'status', 'source', 'team', 'component'];
    filterFields.forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            filteredQuery = query(filteredQuery, where(field, '==', filters[field]));
        }
    });

    return filteredQuery;
};

// Secure fetch function with comprehensive error handling
const fetchBugTrackingMetrics = async (filters = {}, userContext = null) => {
    try {
        // Check authentication first
        if (!userContext?.currentUser) {
            throw new Error('Authentication required. Please log in to view bug metrics.');
        }

        // Check permissions if your auth system has them
        if (userContext.hasPermission && !userContext.hasPermission('read_tests')) {
            throw new Error('Insufficient permissions to view bug metrics.');
        }

        const bugsRef = collection(db, 'bugs');
        const filteredQuery = applyFilters(bugsRef, filters, 'createdAt', userContext);
        
        // Add ordering and reasonable limits for performance
        const finalQuery = query(
            filteredQuery,
            orderBy('createdAt', 'desc'),
            limit(1000) // Adjust based on your needs
        );

        console.log('Executing query with user:', userContext.currentUser.uid);
        const snapshot = await getDocs(finalQuery);
        const bugs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`Fetched ${bugs.length} bugs`);

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

        // Source distribution
        const sourceCounts = bugs.reduce((acc, bug) => {
            const source = bug.source || 'manual';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        // Calculate resolved bugs
        const resolvedStatuses = ['Resolved', 'Closed', 'Fixed', 'Verified', 'Done'];
        const resolvedBugs = bugs.filter(bug => 
            resolvedStatuses.includes(bug.status)
        );

        // Calculate resolution time for resolved bugs
        const resolutionTimes = resolvedBugs
            .filter(bug => bug.resolvedAt && bug.createdAt)
            .map(bug => calculateHoursDifference(bug.createdAt, bug.resolvedAt));

        const avgResolutionTime = resolutionTimes.length > 0 
            ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
            : 0;

        // Calculate bug resolution rate
        const bugResolutionRate = totalBugs > 0 
            ? Math.round((resolvedBugs.length / totalBugs) * 100)
            : 0;

        // Count bugs by source
        const bugsFromScreenRecording = sourceCounts['screen-recording'] || 0;
        const bugsFromManualTesting = sourceCounts['manual'] || 0;

        // Count bugs with evidence
        const bugsWithVideoEvidence = bugs.filter(bug => bug.hasVideoEvidence).length;
        const bugsWithNetworkLogs = bugs.filter(bug => bug.hasNetworkLogs).length;
        const bugsWithConsoleLogs = bugs.filter(bug => bug.hasConsoleLogs).length;
        const bugsWithAttachments = bugs.filter(bug => 
            bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)
        ).length;

        // Count bugs by priority levels
        const criticalBugs = priorityCounts['Critical'] || 0;
        const highPriorityBugs = priorityCounts['High'] || 0;
        const mediumPriorityBugs = priorityCounts['Medium'] || 0;
        const lowPriorityBugs = priorityCounts['Low'] || 0;

        // Calculate report completeness
        const completenessScores = bugs.map(calculateReportCompleteness);
        const avgBugReportCompleteness = completenessScores.length > 0
            ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
            : 0;

        // Calculate reproduction rate
        const bugsWithSteps = bugs.filter(bug => 
            bug.stepsToReproduce && bug.stepsToReproduce.trim()
        ).length;
        const bugReproductionRate = totalBugs > 0 
            ? Math.round((bugsWithSteps / totalBugs) * 100)
            : 0;

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

        // Estimate report generation metrics
        const weeklyReportsGenerated = Math.ceil(weeklyBugs / 10);
        const monthlyReportsGenerated = Math.ceil(monthlyBugs / 20);
        const avgBugsPerReport = weeklyReportsGenerated > 0 
            ? Math.round(weeklyBugs / weeklyReportsGenerated)
            : 0;

        // Bug trend analysis
        const bugTrend = bugs.reduce((acc, bug) => {
            const createdDate = convertFirebaseDate(bug.createdAt);
            if (createdDate) {
                const date = createdDate.toISOString().split('T')[0];
                if (!acc[date]) acc[date] = { reported: 0, resolved: 0 };
                acc[date].reported++;
                
                if (bug.resolvedAt) {
                    const resolvedDate = convertFirebaseDate(bug.resolvedAt);
                    if (resolvedDate) {
                        const resolvedDateStr = resolvedDate.toISOString().split('T')[0];
                        if (!acc[resolvedDateStr]) acc[resolvedDateStr] = { reported: 0, resolved: 0 };
                        acc[resolvedDateStr].resolved++;
                    }
                }
            }
            return acc;
        }, {});

        return {
            // Core metrics
            totalBugs,
            resolvedBugs: resolvedBugs.length,
            activeBugs: totalBugs - resolvedBugs.length,
            avgResolutionTime: Math.round(avgResolutionTime),
            bugResolutionRate,
            
            // Bug sources
            bugsFromScreenRecording,
            bugsFromManualTesting,
            
            // Evidence metrics
            bugsWithVideoEvidence,
            bugsWithNetworkLogs,
            bugsWithConsoleLogs,
            bugReportsWithAttachments: bugsWithAttachments,
            
            // Priority breakdown
            criticalBugs,
            highPriorityBugs,
            mediumPriorityBugs,
            lowPriorityBugs,
            
            // Quality metrics
            avgBugReportCompleteness,
            bugReproductionRate,
            
            // Report metrics
            weeklyReportsGenerated,
            monthlyReportsGenerated,
            avgBugsPerReport,
            
            // Distributions
            statusDistribution: statusCounts,
            priorityDistribution: priorityCounts,
            severityDistribution: severityCounts,
            sourceDistribution: sourceCounts,
            
            // Trends and recent activity
            bugTrend,
            recentlyReported: recentBugs,
            weeklyBugs,
            monthlyBugs,
            
            // Additional metrics
            inProgress: statusCounts['In Progress'] || 0,
            closed: statusCounts['Closed'] || 0,
            
            // Summary for quick overview
            summary: {
                totalItems: totalBugs,
                criticalIssues: criticalBugs,
                resolutionRate: bugResolutionRate,
                lastUpdated: new Date()
            }
        };

    } catch (error) {
        console.error('Error fetching bug tracking metrics:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'permission-denied') {
            throw new Error('Access denied. Please check your permissions or contact your administrator.');
        }
        
        if (error.code === 'unauthenticated') {
            throw new Error('Authentication required. Please log in to continue.');
        }
        
        if (error.code === 'failed-precondition') {
            throw new Error('Database query failed. Please try again or contact support.');
        }
        
        throw error;
    }
};

// Main hook for bug tracking metrics
export const useBugTrackingMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get auth context
    const {
        currentUser,
        userProfile,
        hasPermission,
        hasRole,
        loading: authLoading
    } = useAuth();

    const fetchMetrics = useCallback(async () => {
        // Wait for auth to be ready
        if (authLoading) {
            return;
        }

        if (!currentUser) {
            setError('Authentication required. Please log in to view metrics.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create user context
            const userContext = {
                currentUser,
                userProfile,
                hasPermission,
                hasRole
            };

            const data = await fetchBugTrackingMetrics(filters, userContext);
            setMetrics(data);
        } catch (err) {
            setError(err.message);
            console.error('Error in useBugTrackingMetrics:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, currentUser, userProfile, hasPermission, hasRole, authLoading]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const refetch = useCallback(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        loading: loading || authLoading,
        error,
        refetch,
        // Helper properties
        hasAccess: currentUser && (!hasPermission || hasPermission('read_tests')),
        canModify: currentUser && (!hasPermission || hasPermission('write_tests')),
        isAdmin: currentUser && (!hasRole || hasRole('admin'))
    };
};

// Export the main fetch function for use in other services
export { fetchBugTrackingMetrics };