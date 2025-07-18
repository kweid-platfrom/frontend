// services/testMetricsService.js - Comprehensive Test Metrics Service
import firestoreService from './firestoreService';
import {  
    orderBy, 
    limit,
    serverTimestamp,
} from 'firebase/firestore';

class TestMetricsService {
    constructor() {
        this.firestoreService = firestoreService;
        this.metricsCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // ===== CACHE MANAGEMENT =====
    
    getCacheKey(suiteId, type, filters = {}) {
        return `${suiteId}-${type}-${JSON.stringify(filters)}`;
    }

    isValidCache(cacheEntry) {
        return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
    }

    setCache(key, data) {
        this.metricsCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.metricsCache.get(key);
        return this.isValidCache(cached) ? cached.data : null;
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.metricsCache.keys()) {
                if (key.includes(pattern)) {
                    this.metricsCache.delete(key);
                }
            }
        } else {
            this.metricsCache.clear();
        }
    }

    // ===== TEST CASE OPERATIONS =====

    async createTestCase(suiteId, testCaseData, sprintId = null) {
        const data = {
            ...testCaseData,
            type: 'testCase',
            status: testCaseData.status || 'active',
            priority: testCaseData.priority || 'medium',
            creationType: testCaseData.creationType || 'manual', // manual, automated, ai_generated
            tags: testCaseData.tags || [],
            linkedBugs: testCaseData.linkedBugs || [],
            hasRecording: testCaseData.hasRecording || false,
            isAutomated: testCaseData.isAutomated || false,
            coverage: {
                functional: testCaseData.coverage?.functional || false,
                edgeCase: testCaseData.coverage?.edgeCase || false,
                negative: testCaseData.coverage?.negative || false
            },
            metadata: {
                estimatedDuration: testCaseData.estimatedDuration || 0,
                actualDuration: testCaseData.actualDuration || 0,
                complexity: testCaseData.complexity || 'medium',
                lastExecuted: testCaseData.lastExecuted || null,
                executionCount: testCaseData.executionCount || 0
            }
        };

        const result = await this.firestoreService.createSuiteAsset(
            suiteId, 
            'testCases', 
            data, 
            sprintId
        );

        if (result.success) {
            // Log activity
            await this.logTestActivity(suiteId, {
                action: 'test_case_created',
                testCaseId: result.docId,
                details: {
                    name: testCaseData.name,
                    creationType: data.creationType,
                    priority: data.priority
                }
            });

            // Clear related cache
            this.clearCache(suiteId);
        }

        return result;
    }

    async updateTestCase(suiteId, testCaseId, updates, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        const result = await this.firestoreService.updateDocument(
            collectionPath,
            testCaseId,
            updates
        );

        if (result.success) {
            // Log activity
            await this.logTestActivity(suiteId, {
                action: 'test_case_updated',
                testCaseId,
                details: updates
            });

            // Clear related cache
            this.clearCache(suiteId);
        }

        return result;
    }

    async executeTestCase(suiteId, testCaseId, executionData, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        // First get the current test case
        const currentTest = await this.firestoreService.getDocument(collectionPath, testCaseId);
        if (!currentTest.success) {
            return currentTest;
        }

        const updates = {
            'metadata.lastExecuted': serverTimestamp(),
            'metadata.executionCount': (currentTest.data.metadata?.executionCount || 0) + 1,
            'metadata.actualDuration': executionData.duration || 0,
            lastExecutionResult: executionData.result, // passed, failed, skipped
            lastExecutionNotes: executionData.notes || ''
        };

        const result = await this.updateTestCase(suiteId, testCaseId, updates, sprintId);

        if (result.success) {
            // Create execution record
            await this.createTestExecution(suiteId, {
                testCaseId,
                sprintId,
                result: executionData.result,
                duration: executionData.duration || 0,
                notes: executionData.notes || '',
                executedBy: this.firestoreService.getCurrentUserId(),
                environment: executionData.environment || 'production',
                browserInfo: executionData.browserInfo || null
            });
        }

        return result;
    }

    async createTestExecution(suiteId, executionData) {
        const data = {
            ...executionData,
            type: 'testExecution',
            executedAt: serverTimestamp()
        };

        return await this.firestoreService.createSuiteAsset(
            suiteId,
            'testExecutions',
            data
        );
    }

    // ===== AI GENERATION TRACKING =====

    async trackAIGeneration(suiteId, generationData) {
        const data = {
            type: 'aiGeneration',
            prompt: generationData.prompt,
            model: generationData.model || 'gpt-4',
            tokensUsed: generationData.tokensUsed || 0,
            cost: generationData.cost || 0,
            testCasesGenerated: generationData.testCasesGenerated || 0,
            successRate: generationData.successRate || 0,
            generationType: generationData.generationType || 'test_cases', // test_cases, bug_reports, automation_scripts
            inputData: generationData.inputData || {},
            outputData: generationData.outputData || {},
            quality: generationData.quality || 'good', // excellent, good, fair, poor
            userFeedback: generationData.userFeedback || null
        };

        const result = await this.firestoreService.createSuiteAsset(
            suiteId,
            'aiGenerations',
            data
        );

        if (result.success) {
            await this.logTestActivity(suiteId, {
                action: 'ai_generation_completed',
                details: {
                    testCasesGenerated: data.testCasesGenerated,
                    generationType: data.generationType,
                    quality: data.quality
                }
            });
        }

        return result;
    }

    // ===== SCREEN RECORDING TRACKING =====

    async trackScreenRecording(suiteId, recordingData) {
        const data = {
            type: 'screenRecording',
            duration: recordingData.duration || 0,
            fileSize: recordingData.fileSize || 0,
            filePath: recordingData.filePath || '',
            recordingQuality: recordingData.quality || 'high',
            convertedToBugReport: recordingData.convertedToBugReport || false,
            convertedToTestCase: recordingData.convertedToTestCase || false,
            linkedBugId: recordingData.linkedBugId || null,
            linkedTestCaseId: recordingData.linkedTestCaseId || null,
            metadata: {
                browserInfo: recordingData.browserInfo || null,
                screenResolution: recordingData.screenResolution || null,
                deviceType: recordingData.deviceType || 'desktop'
            }
        };

        const result = await this.firestoreService.createSuiteAsset(
            suiteId,
            'screenRecordings',
            data
        );

        if (result.success) {
            await this.logTestActivity(suiteId, {
                action: 'screen_recording_created',
                details: {
                    duration: data.duration,
                    quality: data.recordingQuality
                }
            });
        }

        return result;
    }

    // ===== METRICS CALCULATION =====

    async calculateTestCaseMetrics(suiteId, sprintId = null, useCache = true) {
        const cacheKey = this.getCacheKey(suiteId, 'testCaseMetrics', { sprintId });
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) return { success: true, data: cached };
        }

        try {
            const collectionPath = sprintId
                ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
                : `testSuites/${suiteId}/testCases`;

            const testCasesResult = await this.firestoreService.queryDocuments(collectionPath);
            
            if (!testCasesResult.success) {
                return testCasesResult;
            }

            const testCases = testCasesResult.data;

            // Calculate metrics
            const metrics = {
                totalTestCases: testCases.length,
                manualTestCases: testCases.filter(tc => tc.creationType === 'manual').length,
                automatedTestCases: testCases.filter(tc => tc.isAutomated).length,
                aiGeneratedTestCases: testCases.filter(tc => tc.creationType === 'ai_generated').length,
                testCasesWithTags: testCases.filter(tc => tc.tags && tc.tags.length > 0).length,
                testCasesLinkedToBugs: testCases.filter(tc => tc.linkedBugs && tc.linkedBugs.length > 0).length,
                testCasesWithRecordings: testCases.filter(tc => tc.hasRecording).length,
                
                // Coverage metrics
                functionalCoverage: this.calculateCoverage(testCases, 'functional'),
                edgeCaseCoverage: this.calculateCoverage(testCases, 'edgeCase'),
                negativeCaseCoverage: this.calculateCoverage(testCases, 'negative'),
                
                // Status breakdown
                activeTestCases: testCases.filter(tc => tc.status === 'active').length,
                outdatedTestCases: testCases.filter(tc => tc.status === 'outdated').length,
                draftTestCases: testCases.filter(tc => tc.status === 'draft').length,
                
                // Quality metrics
                recentlyUpdatedTestCases: testCases.filter(tc => 
                    tc.updated_at && this.isRecent(tc.updated_at, 7)
                ).length,
                
                // Execution metrics
                executedTestCases: testCases.filter(tc => tc.metadata?.lastExecuted).length,
                avgExecutionTime: this.calculateAverageExecutionTime(testCases),
                
                // Priority breakdown
                highPriorityTestCases: testCases.filter(tc => tc.priority === 'high').length,
                mediumPriorityTestCases: testCases.filter(tc => tc.priority === 'medium').length,
                lowPriorityTestCases: testCases.filter(tc => tc.priority === 'low').length,
                
                // Complexity breakdown
                complexTestCases: testCases.filter(tc => tc.metadata?.complexity === 'high').length,
                mediumComplexityTestCases: testCases.filter(tc => tc.metadata?.complexity === 'medium').length,
                simpleTestCases: testCases.filter(tc => tc.metadata?.complexity === 'low').length,
                
                // Update frequency
                testCaseUpdateFrequency: this.calculateUpdateFrequency(testCases)
            };

            // Add AI generation metrics
            const aiMetrics = await this.calculateAIMetrics(suiteId, sprintId);
            if (aiMetrics.success) {
                metrics.aiGenerationSuccessRate = aiMetrics.data.successRate;
                metrics.avgTestCasesPerAIGeneration = aiMetrics.data.avgTestCasesPerGeneration;
                metrics.totalAIGenerations = aiMetrics.data.totalGenerations;
                metrics.aiCostPerTestCase = aiMetrics.data.costPerTestCase;
            }

            this.setCache(cacheKey, metrics);
            return { success: true, data: metrics };

        } catch (error) {
            console.error('Error calculating test case metrics:', error);
            return { success: false, error };
        }
    }

    async calculateAIMetrics(suiteId, sprintId = null) {
        try {
            const aiGenerationsResult = await this.firestoreService.getSuiteAssets(
                suiteId,
                'aiGenerations',
                sprintId
            );

            if (!aiGenerationsResult.success) {
                return { success: true, data: { successRate: 0, avgTestCasesPerGeneration: 0, totalGenerations: 0, costPerTestCase: 0 } };
            }

            const generations = aiGenerationsResult.data;
            
            if (generations.length === 0) {
                return { success: true, data: { successRate: 0, avgTestCasesPerGeneration: 0, totalGenerations: 0, costPerTestCase: 0 } };
            }

            const successfulGenerations = generations.filter(g => g.successRate > 0);
            const totalTestCases = generations.reduce((sum, g) => sum + g.testCasesGenerated, 0);
            const totalCost = generations.reduce((sum, g) => sum + (g.cost || 0), 0);

            return {
                success: true,
                data: {
                    successRate: Math.round((successfulGenerations.length / generations.length) * 100),
                    avgTestCasesPerGeneration: Math.round(totalTestCases / generations.length),
                    totalGenerations: generations.length,
                    costPerTestCase: totalTestCases > 0 ? Number((totalCost / totalTestCases).toFixed(3)) : 0
                }
            };

        } catch (error) {
            console.error('Error calculating AI metrics:', error);
            return { success: false, error };
        }
    }

    async calculateAutomationMetrics(suiteId, sprintId = null) {
        try {
            const testCasesResult = await this.firestoreService.getSuiteAssets(
                suiteId,
                'testCases',
                sprintId
            );

            if (!testCasesResult.success) {
                return { success: true, data: { automationRatio: 0, cypressScriptsGenerated: 0 } };
            }

            const testCases = testCasesResult.data;
            const automatedTests = testCases.filter(tc => tc.isAutomated);
            const cypressScripts = testCases.filter(tc => tc.automationType === 'cypress');

            return {
                success: true,
                data: {
                    automationRatio: testCases.length > 0 ? Math.round((automatedTests.length / testCases.length) * 100) : 0,
                    cypressScriptsGenerated: cypressScripts.length,
                    totalAutomatedTests: automatedTests.length,
                    automationCoverage: this.calculateAutomationCoverage(testCases)
                }
            };

        } catch (error) {
            console.error('Error calculating automation metrics:', error);
            return { success: false, error };
        }
    }

    // ===== HELPER METHODS =====

    calculateCoverage(testCases, coverageType) {
        if (testCases.length === 0) return 0;
        
        const coveredTests = testCases.filter(tc => 
            tc.coverage && tc.coverage[coverageType] === true
        );
        
        return Math.round((coveredTests.length / testCases.length) * 100);
    }

    calculateAverageExecutionTime(testCases) {
        const executedTests = testCases.filter(tc => 
            tc.metadata?.actualDuration && tc.metadata.actualDuration > 0
        );
        
        if (executedTests.length === 0) return 0;
        
        const totalTime = executedTests.reduce((sum, tc) => 
            sum + tc.metadata.actualDuration, 0
        );
        
        return Math.round(totalTime / executedTests.length);
    }

    calculateUpdateFrequency(testCases) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentUpdates = testCases.filter(tc => {
            if (!tc.updated_at) return false;
            const updateDate = tc.updated_at.toDate ? tc.updated_at.toDate() : new Date(tc.updated_at);
            return updateDate > oneWeekAgo;
        });
        
        return recentUpdates.length;
    }

    calculateAutomationCoverage(testCases) {
        const functionalTests = testCases.filter(tc => tc.coverage?.functional);
        const automatedFunctionalTests = functionalTests.filter(tc => tc.isAutomated);
        
        return functionalTests.length > 0 ? 
            Math.round((automatedFunctionalTests.length / functionalTests.length) * 100) : 0;
    }

    isRecent(timestamp, days = 7) {
        const now = new Date();
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date > cutoff;
    }

    // ===== ACTIVITY LOGGING =====

    async logTestActivity(suiteId, activityData) {
        return await this.firestoreService.createActivityLog(suiteId, {
            ...activityData,
            category: 'testing',
            timestamp: serverTimestamp()
        });
    }

    // ===== REAL-TIME SUBSCRIPTIONS =====

    subscribeToTestCaseMetrics(suiteId, callback, errorCallback = null, sprintId = null) {
        const collectionPath = sprintId
            ? `testSuites/${suiteId}/sprints/${sprintId}/testCases`
            : `testSuites/${suiteId}/testCases`;

        return this.firestoreService.subscribeToCollection(
            collectionPath,
            [orderBy('created_at', 'desc')],
            async () => {
                // Clear cache when data changes
                this.clearCache(suiteId);
                
                // Calculate and return updated metrics
                const metrics = await this.calculateTestCaseMetrics(suiteId, sprintId, false);
                if (metrics.success) {
                    callback(metrics.data);
                }
            },
            errorCallback
        );
    }

    subscribeToTestExecutions(suiteId, callback, errorCallback = null) {
        return this.firestoreService.subscribeToCollection(
            `testSuites/${suiteId}/testExecutions`,
            [orderBy('executedAt', 'desc'), limit(50)],
            callback,
            errorCallback
        );
    }

    // ===== REPORTING =====

    async generateTestReport(suiteId, sprintId = null, reportType = 'summary') {
        const metrics = await this.calculateTestCaseMetrics(suiteId, sprintId, false);
        const automationMetrics = await this.calculateAutomationMetrics(suiteId, sprintId);
        
        if (!metrics.success || !automationMetrics.success) {
            return { success: false, error: 'Failed to generate test report' };
        }

        const report = {
            suiteId,
            sprintId,
            reportType,
            generatedAt: serverTimestamp(),
            metrics: {
                ...metrics.data,
                ...automationMetrics.data
            },
            summary: {
                totalTestCases: metrics.data.totalTestCases,
                automationRatio: automationMetrics.data.automationRatio,
                aiContribution: metrics.data.totalTestCases > 0 ? 
                    Math.round((metrics.data.aiGeneratedTestCases / metrics.data.totalTestCases) * 100) : 0,
                qualityScore: this.calculateQualityScore(metrics.data),
                coverageScore: Math.round((
                    metrics.data.functionalCoverage + 
                    metrics.data.edgeCaseCoverage + 
                    metrics.data.negativeCaseCoverage
                ) / 3)
            }
        };

        return { success: true, data: report };
    }

    calculateQualityScore(metrics) {
        const factors = [
            metrics.totalTestCases > 0 ? (metrics.testCasesWithTags / metrics.totalTestCases) * 100 : 0,
            metrics.totalTestCases > 0 ? (metrics.testCasesWithRecordings / metrics.totalTestCases) * 100 : 0,
            metrics.totalTestCases > 0 ? (metrics.executedTestCases / metrics.totalTestCases) * 100 : 0,
            metrics.totalTestCases > 0 ? (metrics.recentlyUpdatedTestCases / metrics.totalTestCases) * 100 : 0
        ];

        return Math.round(factors.reduce((sum, factor) => sum + factor, 0) / factors.length);
    }

    // ===== CLEANUP =====

    cleanup() {
        this.metricsCache.clear();
    }
}

// Create and export singleton instance
const testMetricsService = new TestMetricsService();
export default testMetricsService;
export { TestMetricsService };