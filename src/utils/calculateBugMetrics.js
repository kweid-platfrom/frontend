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
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            avgBugReportCompleteness: 0,
            bugReportsWithAttachments: 0,
            bugReproductionRate: 0,
            weeklyReportsGenerated: 0,
            monthlyReportsGenerated: 0,
            avgBugsPerReport: 0
        };
    }

    const totalBugs = bugs.length;
    
    // Source-based metrics
    const bugsFromScreenRecording = bugs.filter(bug => 
        bug.source === 'screen_recording' || 
        bug.source === 'recording' ||
        (bug.attachments && bug.attachments.some(att => att.isRecording))
    ).length;
    
    const bugsFromManualTesting = bugs.filter(bug => 
        bug.source === 'manual' || 
        bug.source === 'manual_testing' ||
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

    // Priority/Severity metrics
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

    // Resolution metrics
    const resolvedBugs = bugs.filter(bug => 
        bug.status === 'Resolved' || 
        bug.status === 'Closed' || 
        bug.status === 'Done' ||
        bug.resolvedAt
    ).length;

    // Calculate average resolution time
    const resolvedBugsWithTimes = bugs.filter(bug => 
        (bug.status === 'Resolved' || bug.status === 'Closed' || bug.status === 'Done') &&
        bug.resolvedAt && bug.createdAt
    );

    let avgResolutionTime = 0;
    if (resolvedBugsWithTimes.length > 0) {
        const totalResolutionTime = resolvedBugsWithTimes.reduce((total, bug) => {
            const createdAt = bug.createdAt?.seconds ? 
                new Date(bug.createdAt.seconds * 1000) : 
                new Date(bug.createdAt);
            const resolvedAt = bug.resolvedAt?.seconds ? 
                new Date(bug.resolvedAt.seconds * 1000) : 
                new Date(bug.resolvedAt);
            
            const diffHours = (resolvedAt - createdAt) / (1000 * 60 * 60);
            return total + Math.max(0, diffHours);
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

    const weeklyReportsGenerated = bugs.filter(bug => {
        const createdAt = bug.createdAt?.seconds ? 
            new Date(bug.createdAt.seconds * 1000) : 
            new Date(bug.createdAt);
        return createdAt >= oneWeekAgo;
    }).length;

    const monthlyReportsGenerated = bugs.filter(bug => {
        const createdAt = bug.createdAt?.seconds ? 
            new Date(bug.createdAt.seconds * 1000) : 
            new Date(bug.createdAt);
        return createdAt >= oneMonthAgo;
    }).length;

    // Average bugs per report (assuming 1 bug per report for now)
    const avgBugsPerReport = 1;

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
        avgResolutionTime,
        bugResolutionRate,
        avgBugReportCompleteness,
        bugReportsWithAttachments,
        bugReproductionRate,
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport
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
            resolvedBugs: calculateTrend(currentMetrics.resolvedBugs, previousMetrics.resolvedBugs),
            avgResolutionTime: calculateTrend(previousMetrics.avgResolutionTime, currentMetrics.avgResolutionTime), // Inverted for improvement
            bugsFromScreenRecording: calculateTrend(currentMetrics.bugsFromScreenRecording, previousMetrics.bugsFromScreenRecording)
        }
    };
};