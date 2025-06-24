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
import { 
    canAccessBugs,
    getUserPermissions
} from '../services/permissionService';

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

// Apply filters to the query
const applyFilters = (baseQuery, filters, dateField = 'createdAt') => {
    let filteredQuery = baseQuery;

    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all') {
        const fromDate = getDateRange(filters.timeRange);
        filteredQuery = query(filteredQuery, where(dateField, '>=', Timestamp.fromDate(fromDate)));
    }

    // Individual field filters
    const filterFields = ['priority', 'severity', 'status', 'source', 'team', 'component', 'environment'];
    filterFields.forEach(field => {
        if (filters[field] && filters[field] !== 'all') {
            filteredQuery = query(filteredQuery, where(field, '==', filters[field]));
        }
    });

    return filteredQuery;
};

// Secure fetch function with corrected permission system
const fetchBugTrackingMetrics = async (filters = {}, projectContext = {}, userProfile = null) => {
    try {
        const { projectId, projectOwnerId = false } = projectContext;

        // Check if project is selected
        if (!projectId) {
            throw new Error('No project selected. Please select a project to view bug metrics.');
        }

        // Check permissions for accessing bugs
        if (!canAccessBugs(userProfile, 'read', { 
            projectId, 
            projectOwnerId 
        })) {
            throw new Error('Access denied: You cannot read bugs in this project.');
        }

        // Query the project's bugs subcollection
        const bugsRef = collection(db, 'projects', projectId, 'bugs');
        const filteredQuery = applyFilters(bugsRef, filters, 'createdAt');
        
        // Add ordering and limit for performance
        const finalQuery = query(
            filteredQuery,
            orderBy('createdAt', 'desc'),
            limit(1000) // Reasonable limit for performance
        );

        console.log('Executing bug metrics query for project:', projectId);
        const snapshot = await getDocs(finalQuery);
        const bugs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        }));

        console.log(`Fetched ${bugs.length} bugs for metrics`);

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
        const bugsFromAutomatedTesting = sourceCounts['automated'] || 0;

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

        // Count bugs by severity levels
        const criticalSeverity = severityCounts['Critical'] || 0;
        const highSeverity = severityCounts['High'] || 0;
        const mediumSeverity = severityCounts['Medium'] || 0;
        const lowSeverity = severityCounts['Low'] || 0;

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

        // Calculate assignment metrics
        const assignedBugs = bugs.filter(bug => bug.assignedTo && bug.assignedTo.trim()).length;
        const unassignedBugs = totalBugs - assignedBugs;
        const assignmentRate = totalBugs > 0 
            ? Math.round((assignedBugs / totalBugs) * 100)
            : 0;

        // Calculate assignee distribution
        const assigneeDistribution = bugs.reduce((acc, bug) => {
            const assignee = bug.assignedTo || 'Unassigned';
            acc[assignee] = (acc[assignee] || 0) + 1;
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
            bugsFromAutomatedTesting,
            
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
            
            // Severity breakdown
            criticalSeverity,
            highSeverity,
            mediumSeverity,
            lowSeverity,
            
            // Assignment metrics
            assignedBugs,
            unassignedBugs,
            assignmentRate,
            
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
            environmentDistribution: environmentCounts,
            assigneeDistribution,
            
            // Trends and recent activity
            bugTrend,
            recentlyReported: recentBugs,
            weeklyBugs,
            monthlyBugs,
            
            // Additional metrics
            openBugs: statusCounts['Open'] || 0,
            inProgress: statusCounts['In Progress'] || 0,
            closed: statusCounts['Closed'] || 0,
            
            // Summary for quick overview
            summary: {
                totalItems: totalBugs,
                criticalIssues: criticalBugs,
                resolutionRate: bugResolutionRate,
                projectId,
                lastUpdated: new Date()
            }
        };

    } catch (error) {
        console.error('Error fetching bug tracking metrics:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to view bugs for this project');
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

// Main hook for bug tracking metrics (updated with corrected permission system)
export const useBugTrackingMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get auth and project context
    const { userProfile } = useAuth(); // Get full userProfile instead of just hasPermission
    const { activeProject } = useProject();

    // Get user permissions using the corrected permission system
    const userPermissions = userProfile ? getUserPermissions(userProfile) : null;

    const fetchMetrics = useCallback(async () => {
        if (!activeProject?.id) {
            setMetrics(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create project context for permission checking
            const projectContext = {
                projectId: activeProject.id,
                projectOwnerId: activeProject.ownerId || activeProject.owner,
                isPublic: activeProject.isPublic || false
            };

            const data = await fetchBugTrackingMetrics(filters, projectContext, userProfile);
            setMetrics(data);
        } catch (err) {
            setError(err.message);
            console.error('Error in useBugTrackingMetrics:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, activeProject?.id, activeProject?.ownerId, activeProject?.owner, activeProject?.isPublic, userProfile]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const refetch = useCallback(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    // Enhanced permission checks using the corrected system
    const hasReadAccess = userPermissions?.canReadBugs && 
        canAccessBugs(userProfile, 'read', { 
            projectId: activeProject?.id, 
            projectOwnerId: activeProject?.ownerId || activeProject?.owner 
        });

    const hasWriteAccess = userPermissions?.canWriteBugs && 
        canAccessBugs(userProfile, 'write', { 
            projectId: activeProject?.id, 
            projectOwnerId: activeProject?.ownerId || activeProject?.owner 
        });

    const hasAnalyticsAccess = userPermissions?.canViewBugAnalytics;

    return {
        metrics,
        loading,
        error,
        refetch,
        
        // Enhanced permission properties using corrected system
        hasAccess: hasReadAccess,
        canRead: hasReadAccess,
        canWrite: hasWriteAccess,
        canModify: hasWriteAccess,
        canViewAnalytics: hasAnalyticsAccess,
        canExportReports: userPermissions?.canExportBugReports,
        
        // User and project context
        activeProject,
        userProfile,
        userPermissions,
        
        // Account type information
        isIndividualAccount: userPermissions?.isIndividual,
        isOrganizationAccount: userPermissions?.isOrganization,
        isAdmin: userPermissions?.isAdmin,
        
        // Upgrade prompts for individual accounts trying to access org features
        shouldShowUpgradePrompts: userPermissions?.shouldShowUpgradePrompts || {}
    };
};

// Export the main fetch function for use in other services
export { fetchBugTrackingMetrics };