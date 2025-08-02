/* eslint-disable @typescript-eslint/no-unused-vars */
// services/AIMetricsTracker.js - Enhanced AI metrics tracking and analytics
import { FirestoreService } from './firestoreService';

class AIMetricsTracker {
    constructor() {
        this.firestoreService = new FirestoreService();
        this.sessionMetrics = {
            testCasesGenerated: 0,
            bugReportsGenerated: 0,
            aiCallsToday: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalTokensUsed: 0,
            totalCostToday: 0,
            timeSaved: 0,
            startTime: new Date().toISOString()
        };
        
        // Cost per token for different providers (example rates)
        this.costRates = {
            openai: {
                input: 0.0015 / 1000,  // $0.0015 per 1K input tokens
                output: 0.002 / 1000   // $0.002 per 1K output tokens
            },
            gemini: {
                input: 0.00035 / 1000, // $0.00035 per 1K input tokens
                output: 0.00105 / 1000 // $0.00105 per 1K output tokens
            },
            ollama: { input: 0, output: 0 },
            localai: { input: 0, output: 0 }
        };

        // Time estimates for manual work (in minutes)
        this.timeEstimates = {
            testCaseCreation: 8, // 8 minutes per test case manually
            bugReportCreation: 15, // 15 minutes per detailed bug report
            documentAnalysis: 30 // 30 minutes to analyze and create test cases from docs
        };
    }

    // Track AI-generated test cases
    async trackTestCaseGeneration(generationData) {
        try {
            const {
                testCases = [],
                prompt,
                documentTitle,
                templateConfig = {},
                provider,
                model,
                tokensUsed = 0,
                responseTime = 0,
                generationId,
                successful = true
            } = generationData;

            const testCaseCount = testCases.length;
            const estimatedTimeSaved = testCaseCount * this.timeEstimates.testCaseCreation;
            const cost = this.calculateCost(tokensUsed, provider);

            // Create detailed tracking record
            const trackingRecord = {
                id: generationId || `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'test_case_generation',
                timestamp: new Date().toISOString(),
                
                // Generation details
                testCaseCount,
                documentTitle: documentTitle || 'Unknown Document',
                promptLength: prompt?.length || 0,
                templateConfig,
                
                // AI service details
                provider,
                model,
                tokensUsed,
                responseTime,
                successful,
                cost,
                
                // Efficiency metrics
                estimatedTimeSavedMinutes: estimatedTimeSaved,
                costPerTestCase: testCaseCount > 0 ? cost / testCaseCount : 0,
                timePerTestCase: testCaseCount > 0 ? responseTime / testCaseCount : 0,
                
                // Test case analysis
                testCaseBreakdown: this.analyzeTestCases(testCases),
                
                // Quality metrics
                averageStepsPerTest: this.calculateAverageSteps(testCases),
                hasTestData: testCases.some(tc => tc.testData),
                hasPreconditions: testCases.some(tc => tc.preconditions),
                automationPotential: this.calculateAutomationPotential(testCases),
                
                // User context
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId()
            };

            // Save to Firestore
            const result = await this.firestoreService.createDocument('ai_test_case_tracking', trackingRecord);
            
            // Update session metrics
            this.updateSessionMetrics('testCase', {
                count: testCaseCount,
                cost,
                timeSaved: estimatedTimeSaved,
                successful,
                tokens: tokensUsed
            });

            console.log(`📊 Tracked test case generation: ${testCaseCount} test cases, ${estimatedTimeSaved}min saved, $${cost.toFixed(4)} cost`);

            return {
                success: result.success,
                trackingId: result.docId,
                metrics: {
                    testCasesGenerated: testCaseCount,
                    timeSavedMinutes: estimatedTimeSaved,
                    cost,
                    efficiency: this.calculateEfficiency(cost, estimatedTimeSaved)
                }
            };
        } catch (error) {
            console.error('❌ Failed to track test case generation:', error);
            return { success: false, error: error.message };
        }
    }

    // Track AI-generated bug reports
    async trackBugReportGeneration(bugReportData) {
        try {
            const {
                bugReport,
                originalPrompt,
                consoleError,
                additionalContext = {},
                provider,
                model,
                tokensUsed = 0,
                responseTime = 0,
                generationId,
                successful = true
            } = bugReportData;

            const estimatedTimeSaved = this.timeEstimates.bugReportCreation;
            const cost = this.calculateCost(tokensUsed, provider);

            const trackingRecord = {
                id: generationId || `br_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'bug_report_generation',
                timestamp: new Date().toISOString(),
                
                // Bug report details
                hasConsoleError: !!consoleError,
                promptLength: originalPrompt?.length || 0,
                severity: bugReport?.severity,
                category: bugReport?.category,
                hasWorkaround: !!bugReport?.workaround,
                hasStepsToReproduce: !!bugReport?.stepsToReproduce,
                
                // AI service details
                provider,
                model,
                tokensUsed,
                responseTime,
                successful,
                cost,
                
                // Efficiency metrics
                estimatedTimeSavedMinutes: estimatedTimeSaved,
                
                // Quality indicators
                hasSuggestedTestCases: bugReport?.suggestedTestCases?.length > 0,
                testCaseSuggestions: bugReport?.suggestedTestCases?.length || 0,
                hasRiskAssessment: !!bugReport?.riskAssessment,
                reproducible: bugReport?.reproducible !== false,
                
                // Context
                additionalContext,
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId()
            };

            const result = await this.firestoreService.createDocument('ai_bug_report_tracking', trackingRecord);
            
            // Update session metrics
            this.updateSessionMetrics('bugReport', {
                count: 1,
                cost,
                timeSaved: estimatedTimeSaved,
                successful,
                tokens: tokensUsed
            });

            console.log(`📊 Tracked bug report generation: ${estimatedTimeSaved}min saved, $${cost.toFixed(4)} cost`);

            return {
                success: result.success,
                trackingId: result.docId,
                metrics: {
                    bugReportsGenerated: 1,
                    timeSavedMinutes: estimatedTimeSaved,
                    cost,
                    efficiency: this.calculateEfficiency(cost, estimatedTimeSaved)
                }
            };
        } catch (error) {
            console.error('❌ Failed to track bug report generation:', error);
            return { success: false, error: error.message };
        }
    }

    // Get comprehensive AI metrics for dashboard
    async getDashboardMetrics(dateRange = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

            console.log(`📊 Fetching AI dashboard metrics for last ${dateRange} days...`);

            // Fetch tracking data in parallel
            const [testCaseData, bugReportData, usageData] = await Promise.all([
                this.getTestCaseMetrics(startDate, endDate),
                this.getBugReportMetrics(startDate, endDate),
                this.getUsageMetrics(startDate, endDate)
            ]);

            // Calculate comprehensive metrics
            const metrics = {
                // Core counts
                totalTestCasesGenerated: testCaseData.totalTestCases,
                totalBugReportsGenerated: bugReportData.totalBugReports,
                totalAIGenerations: testCaseData.totalGenerations + bugReportData.totalGenerations,
                
                // Success rates
                testCaseSuccessRate: testCaseData.successRate,
                bugReportSuccessRate: bugReportData.successRate,
                overallSuccessRate: this.calculateOverallSuccessRate(testCaseData, bugReportData),
                
                // Time savings
                totalTimeSavedHours: (testCaseData.timeSaved + bugReportData.timeSaved) / 60,
                timeSavedFromTestCases: testCaseData.timeSaved / 60,
                timeSavedFromBugReports: bugReportData.timeSaved / 60,
                
                // Cost metrics
                totalCost: testCaseData.totalCost + bugReportData.totalCost,
                costPerTestCase: testCaseData.avgCostPerTestCase,
                costPerBugReport: bugReportData.avgCostPerBugReport,
                costEfficiency: this.calculateCostEfficiency(testCaseData, bugReportData),
                
                // Quality metrics
                averageTestCasesPerGeneration: testCaseData.avgTestCasesPerGeneration,
                automationCandidates: testCaseData.automationCandidates,
                criticalBugsIdentified: bugReportData.criticalBugs,
                
                // Provider breakdown
                providerUsage: this.combineProviderUsage(testCaseData.providerUsage, bugReportData.providerUsage),
                
                // Efficiency trends
                dailyMetrics: this.calculateDailyTrends(testCaseData.daily, bugReportData.daily),
                
                // ROI calculations
                estimatedROI: this.calculateROI(testCaseData, bugReportData, dateRange),
                productivityIncrease: this.calculateProductivityIncrease(testCaseData, bugReportData),
                
                // Session metrics
                currentSession: this.sessionMetrics,
                
                // Meta data
                lastUpdated: new Date().toISOString(),
                dateRange,
                dataAvailability: {
                    testCases: testCaseData.totalGenerations > 0,
                    bugReports: bugReportData.totalGenerations > 0,
                    hasHistoricalData: (testCaseData.totalGenerations + bugReportData.totalGenerations) > 10
                }
            };

            console.log('✅ AI dashboard metrics calculated successfully');
            return { success: true, data: metrics };

        } catch (error) {
            console.error('❌ Failed to get dashboard metrics:', error);
            return { 
                success: false, 
                error: error.message,
                data: this.getDefaultMetrics() 
            };
        }
    }

    // Get test case specific metrics
    async getTestCaseMetrics(startDate, endDate) {
        const result = await this.firestoreService.queryDocuments('ai_test_case_tracking', {
            where: [['timestamp', '>=', startDate.toISOString()], ['timestamp', '<=', endDate.toISOString()]],
            orderBy: [['timestamp', 'desc']]
        });

        const data = result.success ? result.data : [];
        const successful = data.filter(item => item.successful);
        const testCases = data.reduce((sum, item) => sum + (item.testCaseCount || 0), 0);

        return {
            totalGenerations: data.length,
            totalTestCases: testCases,
            successRate: data.length > 0 ? (successful.length / data.length) * 100 : 0,
            timeSaved: data.reduce((sum, item) => sum + (item.estimatedTimeSavedMinutes || 0), 0),
            totalCost: data.reduce((sum, item) => sum + (item.cost || 0), 0),
            avgTestCasesPerGeneration: data.length > 0 ? testCases / data.length : 0,
            avgCostPerTestCase: testCases > 0 ? data.reduce((sum, item) => sum + (item.cost || 0), 0) / testCases : 0,
            automationCandidates: data.reduce((sum, item) => sum + (item.automationPotential || 0), 0),
            providerUsage: this.calculateProviderUsage(data),
            daily: this.groupByDay(data)
        };
    }

    // Get bug report specific metrics
    async getBugReportMetrics(startDate, endDate) {
        const result = await this.firestoreService.queryDocuments('ai_bug_report_tracking', {
            where: [['timestamp', '>=', startDate.toISOString()], ['timestamp', '<=', endDate.toISOString()]],
            orderBy: [['timestamp', 'desc']]
        });

        const data = result.success ? result.data : [];
        const successful = data.filter(item => item.successful);

        return {
            totalGenerations: data.length,
            totalBugReports: data.length,
            successRate: data.length > 0 ? (successful.length / data.length) * 100 : 0,
            timeSaved: data.reduce((sum, item) => sum + (item.estimatedTimeSavedMinutes || 0), 0),
            totalCost: data.reduce((sum, item) => sum + (item.cost || 0), 0),
            avgCostPerBugReport: data.length > 0 ? data.reduce((sum, item) => sum + (item.cost || 0), 0) / data.length : 0,
            criticalBugs: data.filter(item => item.severity === 'Critical').length,
            providerUsage: this.calculateProviderUsage(data),
            daily: this.groupByDay(data)
        };
    }

    // Get usage metrics from AI service logs
    async getUsageMetrics(startDate, endDate) {
        const result = await this.firestoreService.queryDocuments('ai_usage_logs', {
            where: [['timestamp', '>=', startDate.toISOString()], ['timestamp', '<=', endDate.toISOString()]],
            orderBy: [['timestamp', 'desc']]
        });

        return result.success ? result.data : [];
    }

    // Helper methods for calculations
    calculateCost(tokensUsed, provider = 'gemini') {
        const rates = this.costRates[provider] || this.costRates.gemini;
        // Simplified calculation - you may want to separate input/output tokens
        return tokensUsed * (rates.input + rates.output) / 2;
    }

    calculateEfficiency(cost, timeSavedMinutes) {
        if (cost === 0) return 100;
        const laborCostPerMinute = 1.0; // $1 per minute assumption
        const laborCostSaved = timeSavedMinutes * laborCostPerMinute;
        return laborCostSaved > 0 ? ((laborCostSaved - cost) / laborCostSaved) * 100 : 0;
    }

    calculateROI(testCaseData, bugReportData, _days) {
        const totalCost = testCaseData.totalCost + bugReportData.totalCost;
        const totalTimeSaved = testCaseData.timeSaved + bugReportData.timeSaved;
        const laborCostSaved = totalTimeSaved * 1.0; // $1 per minute
        
        if (totalCost === 0) return 0;
        return ((laborCostSaved - totalCost) / totalCost) * 100;
    }

    calculateProductivityIncrease(testCaseData, bugReportData) {
        const totalTimeSaved = testCaseData.timeSaved + bugReportData.timeSaved;
        const workingMinutesPerWeek = 40 * 60; // 40 hours per week
        return Math.min((totalTimeSaved / workingMinutesPerWeek) * 100, 200); // Cap at 200%
    }

    analyzeTestCases(testCases) {
        const breakdown = {
            functional: 0,
            integration: 0,
            negative: 0,
            performance: 0,
            security: 0,
            other: 0
        };

        testCases.forEach(tc => {
            const type = tc.type?.toLowerCase() || 'other';
            if (breakdown.hasOwnProperty(type)) {
                breakdown[type]++;
            } else {
                breakdown.other++;
            }
        });

        return breakdown;
    }

    calculateAverageSteps(testCases) {
        const totalSteps = testCases.reduce((sum, tc) => {
            return sum + (tc.steps ? tc.steps.length : 0);
        }, 0);
        return testCases.length > 0 ? totalSteps / testCases.length : 0;
    }

    calculateAutomationPotential(testCases) {
        return testCases.filter(tc => tc.automationPotential === 'High').length;
    }

    updateSessionMetrics(type, data) {
        this.sessionMetrics.aiCallsToday++;
        this.sessionMetrics.totalTokensUsed += data.tokens || 0;
        this.sessionMetrics.totalCostToday += data.cost || 0;
        this.sessionMetrics.timeSaved += data.timeSaved || 0;

        if (data.successful) {
            this.sessionMetrics.successfulCalls++;
        } else {
            this.sessionMetrics.failedCalls++;
        }

        if (type === 'testCase') {
            this.sessionMetrics.testCasesGenerated += data.count || 0;
        } else if (type === 'bugReport') {
            this.sessionMetrics.bugReportsGenerated += data.count || 0;
        }
    }

    // Utility methods
    getCurrentUserId() {
        // Implement based on your auth system
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    getSessionId() {
        if (!this._sessionId) {
            this._sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this._sessionId;
    }

    calculateOverallSuccessRate(testCaseData, bugReportData) {
        const totalGenerations = testCaseData.totalGenerations + bugReportData.totalGenerations;
        if (totalGenerations === 0) return 0;
        
        const successfulTestCases = Math.round(testCaseData.totalGenerations * testCaseData.successRate / 100);
        const successfulBugReports = Math.round(bugReportData.totalGenerations * bugReportData.successRate / 100);
        
        return ((successfulTestCases + successfulBugReports) / totalGenerations) * 100;
    }

    calculateProviderUsage(data) {
        const usage = {};
        data.forEach(item => {
            const provider = item.provider || 'unknown';
            if (!usage[provider]) {
                usage[provider] = { count: 0, cost: 0, tokens: 0 };
            }
            usage[provider].count++;
            usage[provider].cost += item.cost || 0;
            usage[provider].tokens += item.tokensUsed || 0;
        });
        return usage;
    }

    combineProviderUsage(usage1, usage2) {
        const combined = { ...usage1 };
        Object.keys(usage2).forEach(provider => {
            if (combined[provider]) {
                combined[provider].count += usage2[provider].count;
                combined[provider].cost += usage2[provider].cost;
                combined[provider].tokens += usage2[provider].tokens;
            } else {
                combined[provider] = { ...usage2[provider] };
            }
        });
        return combined;
    }

    groupByDay(data) {
        const dailyData = {};
        data.forEach(item => {
            const date = item.timestamp.split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { count: 0, cost: 0, timeSaved: 0 };
            }
            dailyData[date].count++;
            dailyData[date].cost += item.cost || 0;
            dailyData[date].timeSaved += item.estimatedTimeSavedMinutes || 0;
        });
        return dailyData;
    }

    calculateDailyTrends(testCaseDaily, bugReportDaily) {
        const allDates = new Set([
            ...Object.keys(testCaseDaily),
            ...Object.keys(bugReportDaily)
        ]);

        const trends = {};
        allDates.forEach(date => {
            trends[date] = {
                testCases: testCaseDaily[date]?.count || 0,
                bugReports: bugReportDaily[date]?.count || 0,
                totalCost: (testCaseDaily[date]?.cost || 0) + (bugReportDaily[date]?.cost || 0),
                totalTimeSaved: (testCaseDaily[date]?.timeSaved || 0) + (bugReportDaily[date]?.timeSaved || 0)
            };
        });
        return trends;
    }

    calculateCostEfficiency(testCaseData, bugReportData) {
        const totalCost = testCaseData.totalCost + bugReportData.totalCost;
        const totalTimeSaved = testCaseData.timeSaved + bugReportData.timeSaved;
        const laborCostSaved = totalTimeSaved * 1.0; // $1 per minute
        
        return totalCost > 0 ? (laborCostSaved / totalCost) : 0;
    }

    getDefaultMetrics() {
        return {
            totalTestCasesGenerated: 0,
            totalBugReportsGenerated: 0,
            totalAIGenerations: 0,
            testCaseSuccessRate: 0,
            bugReportSuccessRate: 0,
            overallSuccessRate: 0,
            totalTimeSavedHours: 0,
            timeSavedFromTestCases: 0,
            timeSavedFromBugReports: 0,
            totalCost: 0,
            costPerTestCase: 0,
            costPerBugReport: 0,
            costEfficiency: 0,
            averageTestCasesPerGeneration: 0,
            automationCandidates: 0,
            criticalBugsIdentified: 0,
            providerUsage: {},
            dailyMetrics: {},
            estimatedROI: 0,
            productivityIncrease: 0,
            currentSession: this.sessionMetrics,
            lastUpdated: new Date().toISOString()
        };
    }

    // Reset session metrics (call at start of new session)
    resetSessionMetrics() {
        this.sessionMetrics = {
            testCasesGenerated: 0,
            bugReportsGenerated: 0,
            aiCallsToday: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalTokensUsed: 0,
            totalCostToday: 0,
            timeSaved: 0,
            startTime: new Date().toISOString()
        };
    }

    // Export metrics for reporting
    async exportMetrics(format = 'json', dateRange = 30) {
        const metricsResult = await this.getDashboardMetrics(dateRange);
        if (!metricsResult.success) {
            return metricsResult;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        
        if (format === 'json') {
            return {
                success: true,
                data: JSON.stringify(metricsResult.data, null, 2),
                contentType: 'application/json',
                filename: `ai-tracking-metrics-${timestamp}.json`
            };
        }
        
        // Add CSV export if needed
        return { success: false, error: 'Unsupported format' };
    }
}

// Create and export singleton instance
const aiMetricsTracker = new AIMetricsTracker();
export default aiMetricsTracker;