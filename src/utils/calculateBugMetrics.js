// utils/bugMetricsCalculator.js

/**
 * Calculate comprehensive bug tracking metrics from bug data
 * @param {Array} bugs - Array of bug objects from Firestore
 * @returns {Object} Calculated metrics object
 */
export const calculateBugMetrics = (bugs = []) => {
    if (!Array.isArray(bugs) || bugs.length === 0) {
        return {
            totalBugs: 0,
            bugsFromScreenRecording: 0,
            bugsFromManualTesting: 0,
            bugsWithVideoEvidence: 0,
            bugsWithNetworkLogs: 0,
            bugsWithConsoleLogs: 0,
            criticalBugs: 0,
            highPriorityBugs: 0,
            mediumPriorityBugs: 0,
            lowPriorityBugs: 0,
            resolvedBugs: 0,
            activeBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            avgBugReportCompleteness: 0,
            bugReportsWithAttachments: 0,
            bugReproductionRate: 0,
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0,
            recentlyReported: 0,
            weeklyBugs: 0,
            monthlyBugs: 0,
            inProgress: 0,
            closed: 0,
            // Add distributions
            statusDistribution: {},
            priorityDistribution: {},
            severityDistribution: {},
            sourceDistribution: {},
            // Add trend data
            bugTrend: {},
            summary: {
                totalItems: 0,
                criticalIssues: 0,
                resolutionRate: 0,
                lastUpdated: new Date()
            }
        };
    }

    const totalBugs = bugs.length;

    // Helper function to convert Firebase timestamp to Date
    const convertFirebaseDate = (timestamp) => {
        if (!timestamp) return null;
        if (typeof timestamp === 'string') {
            return new Date(timestamp);
        }
        if (timestamp.toDate) {
            return timestamp.toDate();
        }
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000);
        }
        return timestamp;
    };

    // Source-based metrics - Fixed source matching
    const bugsFromScreenRecording = bugs.filter(bug =>
        bug.source === 'screen_recording' ||
        bug.source === 'screen-recording' ||
        bug.source === 'recording' ||
        (bug.attachments && bug.attachments.some(att => att.isRecording))
    ).length;

    const bugsFromManualTesting = bugs.filter(bug =>
        bug.source === 'manual' ||
        bug.source === 'manual_testing' ||
        bug.source === 'manual-testing' ||
        !bug.source
    ).length;

    // Evidence-based metrics
    const bugsWithVideoEvidence = bugs.filter(bug =>
        bug.hasVideoEvidence ||
        (bug.attachments && bug.attachments.some(att =>
            att.type?.startsWith('video/') || att.isRecording
        ))
    ).length;

    const bugsWithNetworkLogs = bugs.filter(bug =>
        bug.hasNetworkLogs ||
        (bug.attachments && bug.attachments.some(att =>
            att.name?.toLowerCase().includes('network') ||
            att.name?.toLowerCase().includes('har') ||
            att.type?.includes('json')
        ))
    ).length;

    const bugsWithConsoleLogs = bugs.filter(bug =>
        bug.hasConsoleLogs ||
        (bug.attachments && bug.attachments.some(att =>
            att.name?.toLowerCase().includes('console') ||
            att.name?.toLowerCase().includes('log')
        ))
    ).length;

    // Priority/Severity metrics - Fixed to match both priority and severity fields
    const criticalBugs = bugs.filter(bug =>
        bug.severity === 'Critical' || bug.priority === 'Critical'
    ).length;

    const highPriorityBugs = bugs.filter(bug =>
        bug.severity === 'High' || bug.priority === 'High'
    ).length;

    const mediumPriorityBugs = bugs.filter(bug =>
        bug.severity === 'Medium' || bug.priority === 'Medium'
    ).length;

    const lowPriorityBugs = bugs.filter(bug =>
        bug.severity === 'Low' || bug.priority === 'Low'
    ).length;

    // Resolution metrics - Fixed to match more status variations
    const resolvedStatuses = ['resolved', 'closed', 'fixed', 'verified', 'done', 'complete'];
    const normalizedStatus = (status) => (status || '').toLowerCase().trim();

    // Resolved bugs
    const resolvedBugs = bugs.filter(bug =>
        resolvedStatuses.includes(normalizedStatus(bug.status))
    ).length;

    // Active bugs = everything not resolved
    const activeBugs = bugs.filter(bug =>
        !resolvedStatuses.includes(normalizedStatus(bug.status))
    ).length;

    // Calculate average resolution time
    const resolvedBugsWithTimes = bugs.filter(bug =>
        resolvedStatuses.includes(bug.status) &&
        bug.resolvedAt && bug.createdAt
    );

    let avgResolutionTime = 0;
    if (resolvedBugsWithTimes.length > 0) {
        const totalResolutionTime = resolvedBugsWithTimes.reduce((total, bug) => {
            const createdAt = convertFirebaseDate(bug.createdAt);
            const resolvedAt = convertFirebaseDate(bug.resolvedAt);

            if (createdAt && resolvedAt) {
                const diffHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
                return total + Math.max(0, diffHours);
            }
            return total;
        }, 0);

        avgResolutionTime = Math.round(totalResolutionTime / resolvedBugsWithTimes.length);
    }

    // Bug resolution rate
    const bugResolutionRate = totalBugs > 0 ?
        Math.round((resolvedBugs / totalBugs) * 100) : 0;

    // Report completeness calculation
    const calculateReportCompleteness = (bug) => {
        let score = 0;
        const maxScore = 10;

        // Basic fields (4 points)
        if (bug.title && bug.title.trim().length > 5) score += 1;
        if (bug.stepsToReproduce && bug.stepsToReproduce.trim().length > 10) score += 1;
        if (bug.expectedBehavior && bug.expectedBehavior.trim().length > 5) score += 1;
        if (bug.actualBehavior && bug.actualBehavior.trim().length > 5) score += 1;

        // Evidence (3 points)
        if (bug.hasAttachments || (bug.attachments && bug.attachments.length > 0)) score += 1;
        if (bug.hasVideoEvidence || bug.hasConsoleLogs || bug.hasNetworkLogs) score += 1;
        if (bug.environment && bug.environment !== 'Unknown') score += 1;

        // Categorization (2 points)
        if (bug.severity && bug.severity !== 'Unknown') score += 1;
        if (bug.category && bug.category.trim()) score += 1;

        // Additional info (1 point)
        if (bug.frequency && bug.frequency !== 'unknown') score += 1;

        return Math.round((score / maxScore) * 100);
    };

    const avgBugReportCompleteness = totalBugs > 0 ?
        Math.round(bugs.reduce((total, bug) =>
            total + calculateReportCompleteness(bug), 0) / totalBugs) : 0;

    // Attachment metrics
    const bugReportsWithAttachments = bugs.filter(bug =>
        bug.hasAttachments ||
        (bug.attachments && bug.attachments.length > 0)
    ).length;

    // Bug reproduction rate (assuming bugs with complete info are more reproducible)
    const reproducibleBugs = bugs.filter(bug => {
        const completeness = calculateReportCompleteness(bug);
        return completeness >= 70; // 70% completeness threshold
    }).length;

    const bugReproductionRate = totalBugs > 0 ?
        Math.round((reproducibleBugs / totalBugs) * 100) : 0;

    // Time-based reporting metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const weeklyBugs = bugs.filter(bug => {
        const createdAt = convertFirebaseDate(bug.createdAt);
        return createdAt && createdAt >= oneWeekAgo;
    }).length;

    const monthlyBugs = bugs.filter(bug => {
        const createdAt = convertFirebaseDate(bug.createdAt);
        return createdAt && createdAt >= oneMonthAgo;
    }).length;

    const recentlyReported = bugs.filter(bug => {
        const createdAt = convertFirebaseDate(bug.createdAt);
        return createdAt && createdAt >= oneDayAgo;
    }).length;

    // Reports generated (estimated)
    const weeklyReportsGenerated = Math.ceil(weeklyBugs / 10) || 0;
    const monthlyReportsGenerated = Math.ceil(monthlyBugs / 20) || 0;
    const avgBugsPerReport = weeklyReportsGenerated > 0 ? Math.round(weeklyBugs / weeklyReportsGenerated) : 1;

    // Status distribution
    const statusDistribution = bugs.reduce((acc, bug) => {
        const status = bug.status || 'New';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    // Priority distribution
    const priorityDistribution = bugs.reduce((acc, bug) => {
        const priority = bug.priority || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    // Severity distribution
    const severityDistribution = bugs.reduce((acc, bug) => {
        const severity = bug.severity || 'Medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
    }, {});

    // Source distribution
    const sourceDistribution = bugs.reduce((acc, bug) => {
        const source = bug.source || 'manual';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    // Bug trend data
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

    // Additional status counts
    const inProgress = statusDistribution['In Progress'] || statusDistribution['In-Progress'] || 0;
    const closed = statusDistribution['Closed'] || statusDistribution['Done'] || 0;

    return {
        totalBugs,
        bugsFromScreenRecording,
        bugsFromManualTesting,
        bugsWithVideoEvidence,
        bugsWithNetworkLogs,
        bugsWithConsoleLogs,
        criticalBugs,
        highPriorityBugs,
        mediumPriorityBugs,
        lowPriorityBugs,
        resolvedBugs,
        activeBugs,
        avgResolutionTime,
        bugResolutionRate,
        avgBugReportCompleteness,
        bugReportsWithAttachments,
        bugReproductionRate,
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport,
        recentlyReported,
        weeklyBugs,
        monthlyBugs,
        inProgress,
        closed,
        // Distributions
        statusDistribution,
        priorityDistribution,
        severityDistribution,
        sourceDistribution,
        // Trend data
        bugTrend,
        // Summary
        summary: {
            totalItems: totalBugs,
            criticalIssues: criticalBugs,
            resolutionRate: bugResolutionRate,
            lastUpdated: new Date()
        }
    };
};

/**
 * Calculate metrics with trends (requires historical data)
 * @param {Array} currentBugs - Current period bugs
 * @param {Array} previousBugs - Previous period bugs for comparison
 * @returns {Object} Metrics with trend data
 */
export const calculateBugMetricsWithTrends = (currentBugs = [], previousBugs = []) => {
    const currentMetrics = calculateBugMetrics(currentBugs);
    const previousMetrics = calculateBugMetrics(previousBugs);

    // Calculate trends (percentage change)
    const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    return {
        ...currentMetrics,
        trends: {
            totalBugs: calculateTrend(currentMetrics.totalBugs, previousMetrics.totalBugs),
            resolvedBugs: calculateTrend(currentMetrics.resolvedBugs, previousMetrics.resolvedBugs),
            avgResolutionTime: calculateTrend(previousMetrics.avgResolutionTime, currentMetrics.avgResolutionTime), // Inverted for improvement
            bugsFromScreenRecording: calculateTrend(currentMetrics.bugsFromScreenRecording, previousMetrics.bugsFromScreenRecording),
            bugResolutionRate: calculateTrend(currentMetrics.bugResolutionRate, previousMetrics.bugResolutionRate),
            avgBugReportCompleteness: calculateTrend(currentMetrics.avgBugReportCompleteness, previousMetrics.avgBugReportCompleteness)
        }
    };
};