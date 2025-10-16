// ============================================================================
// PART 2: Enhanced useMetricsProcessor.js with Additional Processing
// ============================================================================

import { useMemo } from 'react';

const DEFAULT_METRICS = {
    // All metrics from useDashboard plus computed metrics
    testCases: 0,
    totalTestCases: 0,
    manualTestCases: 0,
    automatedTestCases: 0,
    aiGeneratedTestCases: 0,
    testCasesWithTags: 0,
    testCasesLinkedToBugs: 0,
    testCasesWithRecordings: 0,
    outdatedTestCases: 0,
    recentlyUpdatedTestCases: 0,
    
    functionalCoverage: 0,
    edgeCaseCoverage: 0,
    negativeCaseCoverage: 0,
    totalCoveragePoints: 0,
    avgCoverage: 0, // Computed
    
    passCount: 0,
    failCount: 0,
    executionCount: 0,
    passRate: 0,
    failRate: 0,
    avgExecutionTime: 0,
    lastExecutionDate: null,
    executionTrend: 'stable',
    
    bugs: 0,
    totalBugs: 0,
    activeBugs: 0,
    resolvedBugs: 0,
    criticalBugs: 0,
    highPriorityBugs: 0,
    mediumPriorityBugs: 0,
    lowPriorityBugs: 0,
    
    bugsWithVideoEvidence: 0,
    bugsWithConsoleLogs: 0,
    bugsWithNetworkLogs: 0,
    bugsFromRecordings: 0,
    avgBugReportCompleteness: 0,
    bugReproductionRate: 85,
    
    avgResolutionTime: 0,
    bugResolutionRate: 0,
    criticalBugResolutionTime: 0,
    highBugResolutionTime: 0,
    recentlyResolvedBugs: 0,
    
    recordings: 0,
    recordingsWithIssues: 0,
    totalRecordingDuration: 0,
    avgRecordingDuration: 0,
    recordingsLinkedToBugs: 0,
    
    automationRate: 0,
    aiContributionRate: 0,
    aiGenerationSuccessRate: 0,
    
    activeContributors: 0,
    totalActivities: 0,
    recentActivity: [],
    
    testsCreatedThisWeek: 0,
    testsCreatedThisMonth: 0,
    bugsReportedThisWeek: 0,
    bugsReportedThisMonth: 0,
    recordingsCreatedThisWeek: 0,
    recordingsCreatedThisMonth: 0,
    
    testCaseTrend: [],
    bugTrend: [],
    executionTrend: [],
    
    totalDocuments: 0,
    activeDocuments: 0,
    totalTestData: 0,
    activeTestData: 0,
    
    activeSprints: 0,
    completedSprints: 0,
    sprintVelocity: 0,
    
    // Computed quality scores
    overallQualityScore: 0,
    testCaseQualityScore: 0,
    bugReportQualityScore: 0,
    automationHealthScore: 0,
    
    // Computed health indicators
    testHealthStatus: 'good',
    bugHealthStatus: 'good',
    velocityHealthStatus: 'good',
};

const calculateQualityScores = (metrics) => {
    const total = metrics.totalTestCases || 0;
    
    // Test Case Quality Score (0-100)
    let testCaseScore = 0;
    if (total > 0) {
        const taggedRatio = (metrics.testCasesWithTags / total) * 20;
        const linkedRatio = (metrics.testCasesLinkedToBugs / total) * 15;
        const recordingRatio = (metrics.testCasesWithRecordings / total) * 15;
        const freshnessRatio = ((total - metrics.outdatedTestCases) / total) * 20;
        const executionRatio = metrics.executionCount > 0 ? 20 : 0;
        const passRateBonus = metrics.passRate > 80 ? 10 : (metrics.passRate / 80) * 10;
        
        testCaseScore = Math.round(taggedRatio + linkedRatio + recordingRatio + freshnessRatio + executionRatio + passRateBonus);
    }
    
    // Bug Report Quality Score (0-100) - from avgBugReportCompleteness
    const bugReportScore = metrics.avgBugReportCompleteness || 0;
    
    // Automation Health Score (0-100)
    let automationScore = 0;
    if (total > 0) {
        const automationRatio = (metrics.automationRate / 100) * 40;
        const aiContributionRatio = (metrics.aiContributionRate / 100) * 30;
        const executionEfficiency = metrics.avgExecutionTime > 0 && metrics.avgExecutionTime < 300 ? 30 : 
                                     metrics.avgExecutionTime < 600 ? 20 : 10;
        
        automationScore = Math.round(automationRatio + aiContributionRatio + executionEfficiency);
    }
    
    // Overall Quality Score (weighted average)
    const overallScore = Math.round(
        (testCaseScore * 0.4) + 
        (bugReportScore * 0.3) + 
        (automationScore * 0.3)
    );
    
    return {
        testCaseQualityScore: testCaseScore,
        bugReportQualityScore: bugReportScore,
        automationHealthScore: automationScore,
        overallQualityScore: overallScore,
    };
};

const calculateHealthStatuses = (metrics) => {
    // Test Health Status
    let testHealthStatus = 'good';
    if (metrics.passRate < 50 || metrics.outdatedTestCases > metrics.totalTestCases * 0.3) {
        testHealthStatus = 'critical';
    } else if (metrics.passRate < 70 || metrics.outdatedTestCases > metrics.totalTestCases * 0.2) {
        testHealthStatus = 'warning';
    }
    
    // Bug Health Status
    let bugHealthStatus = 'good';
    const bugRatio = metrics.totalTestCases > 0 ? metrics.activeBugs / metrics.totalTestCases : 0;
    if (metrics.criticalBugs > 5 || bugRatio > 0.5) {
        bugHealthStatus = 'critical';
    } else if (metrics.criticalBugs > 2 || bugRatio > 0.3) {
        bugHealthStatus = 'warning';
    }
    
    // Velocity Health Status
    let velocityHealthStatus = 'good';
    if (metrics.testsCreatedThisWeek === 0 && metrics.bugsReportedThisWeek === 0) {
        velocityHealthStatus = 'warning';
    }
    if (metrics.activeSprints === 0 && metrics.totalTestCases > 0) {
        velocityHealthStatus = 'warning';
    }
    
    return {
        testHealthStatus,
        bugHealthStatus,
        velocityHealthStatus,
    };
};

const ensureConsistency = (metrics) => {
    // Ensure all numbers are non-negative
    Object.keys(metrics).forEach(key => {
        if (typeof metrics[key] === 'number' && metrics[key] < 0) {
            metrics[key] = 0;
        }
    });
    
    // Ensure rates are within 0-100
    const rates = ['passRate', 'failRate', 'bugResolutionRate', 'automationRate', 'aiContributionRate', 'aiGenerationSuccessRate'];
    rates.forEach(rate => {
        if (metrics[rate] > 100) metrics[rate] = 100;
        if (metrics[rate] < 0) metrics[rate] = 0;
    });
    
    // Ensure bug totals are consistent
    if (metrics.totalBugs > 0) {
        const calculatedTotal = metrics.activeBugs + metrics.resolvedBugs;
        if (Math.abs(calculatedTotal - metrics.totalBugs) > 1) {
            metrics.activeBugs = Math.max(0, metrics.totalBugs - metrics.resolvedBugs);
        }
    }
    
    // Calculate average coverage if not present
    if (!metrics.avgCoverage || metrics.avgCoverage === 0) {
        metrics.avgCoverage = Math.round(
            (metrics.functionalCoverage + metrics.edgeCaseCoverage + metrics.negativeCaseCoverage) / 3
        );
    }
    
    // Ensure fail rate is correct
    if (metrics.executionCount > 0) {
        metrics.failRate = Math.round(((metrics.executionCount - metrics.passCount) / metrics.executionCount) * 100);
    }
    
    return metrics;
};

export const useMetricsProcessor = (rawMetrics) => {
    return useMemo(() => {
        if (!rawMetrics) return DEFAULT_METRICS;

        const combined = { ...DEFAULT_METRICS, ...rawMetrics };
        
        // Calculate quality scores
        const qualityScores = calculateQualityScores(combined);
        
        // Calculate health statuses
        const healthStatuses = calculateHealthStatuses(combined);
        
        // Merge everything
        const processedMetrics = {
            ...combined,
            ...qualityScores,
            ...healthStatuses,
        };

        // Ensure consistency
        return ensureConsistency(processedMetrics);
    }, [rawMetrics]);
};