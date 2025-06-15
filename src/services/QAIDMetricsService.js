/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';

// QAID-Specific QA Metrics Service
class QAIDMetricsService {
    constructor() {
        this.baseURL = process.env.REACT_APP_QAID_API_URL;
        this.apiKey = process.env.REACT_APP_QAID_API_KEY;
    }


    // 1. TEST CASE MANAGEMENT METRICS
    async getTestCaseMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/test-cases/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timeRange: filters.timeRange || '30d',
                    team: filters.team || 'all',
                    feature: filters.feature || 'all',
                    sprint: filters.sprint || 'all'
                })
            });

            const data = await response.json();

            return {
                // Core Test Case Metrics
                totalTestCases: data.totalTestCases,
                manualTestCases: data.manualTestCases,
                automatedTestCases: data.automatedTestCases,
                aiGeneratedTestCases: data.aiGeneratedTestCases,

                // Test Case Quality
                testCasesWithTags: data.testCasesWithTags,
                testCasesLinkedToBugs: data.testCasesLinkedToBugs,
                testCasesWithRecordings: data.testCasesWithRecordings,

                // Coverage Metrics
                functionalCoverage: data.functionalTestCases / data.totalTestCases * 100,
                edgeCaseCoverage: data.edgeTestCases / data.totalTestCases * 100,
                negativeCaseCoverage: data.negativeTestCases / data.totalTestCases * 100,

                // AI Generation Efficiency
                aiGenerationSuccessRate: data.successfulAIGenerations / data.totalAIAttempts * 100,
                avgTestCasesPerAIGeneration: data.avgTestCasesPerGeneration,

                // Test Case Maintenance
                outdatedTestCases: data.outdatedTestCases,
                recentlyUpdatedTestCases: data.recentlyUpdatedTestCases,
                testCaseUpdateFrequency: data.testCaseUpdatesPerWeek
            };
        } catch (error) {
            console.error('Error fetching test case metrics:', error);
            return this.getFallbackTestCaseMetrics();
        }
    }


    // 2. BUG REPORTING & TRACKING METRICS
    async getBugMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/bugs/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // Bug Discovery & Reporting
                totalBugs: data.totalBugs,
                bugsFromScreenRecording: data.bugsFromRecording,
                bugsFromManualTesting: data.bugsFromManual,
                bugsWithVideoEvidence: data.bugsWithVideo,
                bugsWithNetworkLogs: data.bugsWithNetworkData,
                bugsWithConsoleLogs: data.bugsWithConsoleLogs,

                // Bug Severity Distribution
                criticalBugs: data.bugsBySeverity.critical,
                highPriorityBugs: data.bugsBySeverity.high,
                mediumPriorityBugs: data.bugsBySeverity.medium,
                lowPriorityBugs: data.bugsBySeverity.low,

                // Bug Resolution
                resolvedBugs: data.resolvedBugs,
                avgResolutionTime: data.avgResolutionTimeHours,
                bugResolutionRate: data.resolvedBugs / data.totalBugs * 100,

                // Bug Report Quality
                avgBugReportCompleteness: data.avgCompleteness,
                bugReportsWithAttachments: data.reportsWithAttachments,
                bugReproductionRate: data.reproducibleBugs / data.totalBugs * 100,

                // Weekly/Monthly Reports
                weeklyReportsGenerated: data.weeklyReports,
                monthlyReportsGenerated: data.monthlyReports,
                avgBugsPerReport: data.avgBugsPerReport
            };
        } catch (error) {
            console.error('Error fetching bug metrics:', error);
            return this.getFallbackBugMetrics();
        }
    }


    // 3. SCREEN RECORDING & EVIDENCE METRICS
    async getRecordingMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/recordings/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // Recording Usage
                totalRecordings: data.totalRecordings,
                avgRecordingDuration: data.avgDurationMinutes,
                totalRecordingHours: data.totalDurationHours,

                // Recording Quality & Context
                recordingsWithNetworkData: data.recordingsWithNetwork,
                recordingsWithConsoleData: data.recordingsWithConsole,
                recordingsLinkedToBugs: data.recordingsLinkedToBugs,
                recordingsLinkedToTestCases: data.recordingsLinkedToTestCases,

                // Recording Efficiency
                bugsFoundPerRecording: data.avgBugsPerRecording,
                recordingToReportConversionRate: data.recordingsConvertedToReports / data.totalRecordings * 100,

                // Storage & Performance
                totalStorageUsedGB: data.totalStorageGB,
                avgUploadTime: data.avgUploadTimeSeconds,
                recordingProcessingFailures: data.processingFailures,

                // User Adoption
                activeRecordingUsers: data.activeUsers,
                recordingsPerUser: data.avgRecordingsPerUser,
                recordingUsageGrowth: data.usageGrowthPercentage
            };
        } catch (error) {
            console.error('Error fetching recording metrics:', error);
            return {};
        }
    }


    // 4. AI TEST GENERATION METRICS
    async getAIMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/ai/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // AI Generation Volume
                totalAIGenerations: data.totalGenerations,
                successfulGenerations: data.successfulGenerations,
                failedGenerations: data.failedGenerations,

                // AI Generation Quality
                aiSuccessRate: data.successfulGenerations / data.totalGenerations * 100,
                avgTestCasesPerGeneration: data.avgTestCasesGenerated,
                testCasesRequiringRevision: data.revisedTestCases,

                // AI Input Sources
                generationsFromUserStories: data.fromUserStories,
                generationsFromDocuments: data.fromDocuments,
                generationsFromRequirements: data.fromRequirements,

                // AI Performance
                avgGenerationTimeSeconds: data.avgGenerationTime,
                openAIAPICallsCount: data.apiCalls,
                openAITokensUsed: data.tokensConsumed,
                aiCostPerTestCase: data.costPerTestCase,

                // Test Case Type Distribution
                functionalTestsGenerated: data.functionalTests,
                edgeTestsGenerated: data.edgeTests,
                negativeTestsGenerated: data.negativeTests,

                // Prompt Effectiveness
                customPromptUsage: data.customPrompts,
                defaultPromptUsage: data.defaultPrompts,
                promptFineTuningCount: data.promptAdjustments
            };
        } catch (error) {
            console.error('Error fetching AI metrics:', error);
            return {};
        }
    }


    // 5. AUTOMATION SUPPORT METRICS
    async getAutomationMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/automation/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // Automation Coverage
                automationRatio: data.automatedTests / data.totalTests * 100,
                manualToAutomatedConversions: data.conversions,

                // Cypress Integration
                cypressScriptsGenerated: data.cypressScripts,
                cypressGenerationSuccessRate: data.successfulCypressGenerations / data.totalCypressAttempts * 100,

                // GitHub Integration
                githubSyncsCompleted: data.githubSyncs,
                cicdIntegrationsActive: data.activeCICD,
                automationExecutionRate: data.automationExecutions,

                // Automation Quality
                automatedTestPassRate: data.automatedPassRate,
                automatedTestStability: data.automationStability,
                automationMaintenanceEffort: data.maintenanceHours,

                // ROI Metrics
                timesSavedByAutomation: data.timeSavedHours,
                automationROI: data.automationROI,
                manualTestingReduction: data.manualReductionPercentage
            };
        } catch (error) {
            console.error('Error fetching automation metrics:', error);
            return {};
        }
    }


    // 6. TEAM & PROJECT METRICS
    async getTeamMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/team/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // Team Productivity
                activeTeamMembers: data.activeMembers,
                testCasesCreatedPerMember: data.avgTestCasesPerMember,
                bugsFoundPerMember: data.avgBugsPerMember,
                recordingsPerMember: data.avgRecordingsPerMember,

                // Feature & Sprint Tracking
                featuresUnderTest: data.featuresInProgress,
                sprintTestingProgress: data.sprintProgress,
                releaseReadiness: data.releaseReadinessScore,

                // Collaboration Metrics
                crossTeamCollaboration: data.collaborationScore,
                testCaseReviewCycle: data.avgReviewTimeHours,
                knowledgeSharing: data.knowledgeSharingScore,

                // Quality Trends
                qualityTrendScore: data.qualityTrend,
                defectDensityTrend: data.defectTrend,
                testCoverageGrowth: data.coverageGrowth
            };
        } catch (error) {
            console.error('Error fetching team metrics:', error);
            return {};
        }
    }


    // 7. DASHBOARD & REPORTING METRICS
    async getDashboardMetrics(filters = {}) {
        try {
            const response = await fetch(`${this.baseURL}/api/dashboard/metrics`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filters)
            });

            const data = await response.json();

            return {
                // Dashboard Usage
                dashboardViews: data.dashboardViews,
                uniqueDashboardUsers: data.uniqueUsers,
                avgSessionDuration: data.avgSessionMinutes,

                // Report Generation
                pdfReportsGenerated: data.pdfReports,
                weeklyReports: data.weeklyReports,
                monthlyReports: data.monthlyReports,
                customReports: data.customReports,

                // Filter Usage
                mostUsedFilters: data.popularFilters,
                advancedFilterUsage: data.advancedFilters,

                // Export Activity
                dataExports: data.totalExports,
                csvExports: data.csvExports,
                pdfExports: data.pdfExports
            };
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            return {};
        }
    }


    // 8. COMPREHENSIVE METRICS AGGREGATOR
    async getAllQAIDMetrics(filters = {}) {
        try {
            const [
                testCaseMetrics,
                bugMetrics,
                recordingMetrics,
                aiMetrics,
                automationMetrics,
                teamMetrics,
                dashboardMetrics
            ] = await Promise.all([
                this.getTestCaseMetrics(filters),
                this.getBugMetrics(filters),
                this.getRecordingMetrics(filters),
                this.getAIMetrics(filters),
                this.getAutomationMetrics(filters),
                this.getTeamMetrics(filters),
                this.getDashboardMetrics(filters)
            ]);


            return {
                testCases: testCaseMetrics,
                bugs: bugMetrics,
                recordings: recordingMetrics,
                ai: aiMetrics,
                automation: automationMetrics,
                team: teamMetrics,
                dashboard: dashboardMetrics,

                // QAID-Specific KPIs
                overallQAEfficiency: this.calculateQAEfficiency({
                    testCaseMetrics,
                    bugMetrics,
                    automationMetrics,
                    aiMetrics
                }),

                evidenceQualityScore: this.calculateEvidenceQuality({
                    recordingMetrics,
                    bugMetrics
                }),

                aiProductivityGain: this.calculateAIProductivity({
                    aiMetrics,
                    testCaseMetrics
                })
            };
        } catch (error) {
            console.error('Error fetching comprehensive QAID metrics:', error);
            return {};
        }
    }


    // 9. QAID-SPECIFIC CALCULATIONS
    calculateQAEfficiency(metrics) {
        const {
            testCaseMetrics: { automationRatio = 0 },
            bugMetrics: { bugReproductionRate = 0, bugResolutionRate = 0 },
            aiMetrics: { aiSuccessRate = 0 }
        } = metrics;

        return Math.round(
            (automationRatio * 0.3 +
                bugReproductionRate * 0.3 +
                bugResolutionRate * 0.2 +
                aiSuccessRate * 0.2)
        );
    }


    calculateEvidenceQuality(metrics) {
        const {
            recordingMetrics: { recordingsWithNetworkData = 0, recordingsWithConsoleData = 0, totalRecordings = 1 },
            bugMetrics: { bugsWithVideoEvidence = 0, totalBugs = 1 }
        } = metrics;

        const networkCoverage = recordingsWithNetworkData / totalRecordings * 100;
        const consoleCoverage = recordingsWithConsoleData / totalRecordings * 100;
        const videoBugCoverage = bugsWithVideoEvidence / totalBugs * 100;

        return Math.round((networkCoverage + consoleCoverage + videoBugCoverage) / 3);
    }


    calculateAIProductivity(metrics) {
        const {
            aiMetrics: { avgTestCasesPerGeneration = 0, aiSuccessRate = 0 },
            testCaseMetrics: { aiGeneratedTestCases = 0, totalTestCases = 1 }
        } = metrics;

        const aiContribution = aiGeneratedTestCases / totalTestCases * 100;
        const aiEfficiency = avgTestCasesPerGeneration * (aiSuccessRate / 100);

        return Math.round((aiContribution + aiEfficiency) / 2);
    }


    // Fallback methods
    getFallbackTestCaseMetrics() {
        return {
            totalTestCases: 0,
            manualTestCases: 0,
            automatedTestCases: 0,
            aiGeneratedTestCases: 0,
            functionalCoverage: 0,
            edgeCaseCoverage: 0,
            negativeCaseCoverage: 0
        };
    }


    getFallbackBugMetrics() {
        return {
            totalBugs: 0,
            criticalBugs: 0,
            resolvedBugs: 0,
            avgResolutionTime: 0,
            bugResolutionRate: 0,
            bugsFromScreenRecording: 0
        };
    }
}


// React Hook for QAID Metrics
export const useQAIDMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const qaidService = new QAIDMetricsService();

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const data = await qaidService.getAllQAIDMetrics(filters);
            setMetrics(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchMetrics();
    }, [JSON.stringify(filters)]);


    return {
        metrics,
        loading,
        error,
        refetch: fetchMetrics,
        service: qaidService
    };
};


export default QAIDMetricsService;