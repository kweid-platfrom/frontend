// services/AIIntegrationService.js - Central service for AI operations with automatic metrics tracking
import aiServiceInstance from './aiService';
import { AITestCaseService } from './AITestCaseService';
import aiBugServiceInstance from './AIBugService';
import aiMetricsTracker from './AIMetricsTracker';

class AIIntegrationService {
    constructor() {
        this.aiService = aiServiceInstance;
        this.testCaseService = new AITestCaseService();
        this.bugService = aiBugServiceInstance;
        this.metricsTracker = aiMetricsTracker;
        
        this.isInitialized = false;
        this.isAvailable = false;
        this.initializationError = null;
        this.currentProvider = null;
        this.currentModel = null;
    }

    // Initialize all AI services with metrics tracking
    async initialize() {
        console.log('🚀 Initializing AI Integration Service...');
        
        try {
            // Test base AI service connection
            const connectionTest = await this.aiService.testConnection();
            
            if (!connectionTest.success) {
                throw new Error(connectionTest.error || 'AI service connection failed');
            }

            // Initialize individual services
            const [testCaseInit, bugServiceInit] = await Promise.all([
                this.testCaseService.initialize(),
                this.bugService.initialize()
            ]);

            // Check if services initialized successfully
            const servicesHealthy = testCaseInit.success && bugServiceInit.success;
            
            if (servicesHealthy) {
                this.isInitialized = true;
                this.isAvailable = true;
                this.currentProvider = connectionTest.provider;
                this.currentModel = connectionTest.model;
                this.initializationError = null;

                console.log('✅ AI Integration Service initialized successfully');
                
                return {
                    success: true,
                    data: {
                        provider: this.currentProvider,
                        model: this.currentModel,
                        services: {
                            aiService: true,
                            testCaseService: testCaseInit.success,
                            bugService: bugServiceInit.success,
                            metricsTracker: true
                        }
                    }
                };
            } else {
                throw new Error('One or more AI services failed to initialize');
            }
            
        } catch (error) {
            console.error('❌ AI Integration Service initialization failed:', error);
            
            this.isInitialized = false;
            this.isAvailable = false;
            this.initializationError = error.message;
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Generate test cases with automatic metrics tracking
    async generateTestCases(documentContent, documentTitle, templateConfig = {}) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            console.log(`📝 Generating test cases for: ${documentTitle}`);
            
            const startTime = Date.now();
            
            // Generate test cases using the test case service
            const result = await this.testCaseService.generateTestCases(
                documentContent,
                documentTitle,
                templateConfig
            );

            const responseTime = Date.now() - startTime;

            if (result.success) {
                // Track the generation with detailed metrics
                const trackingResult = await this.metricsTracker.trackTestCaseGeneration({
                    testCases: result.data.testCases || [],
                    prompt: `Document: ${documentTitle}\nContent: ${documentContent}`,
                    documentTitle,
                    templateConfig,
                    provider: result.provider,
                    model: result.model,
                    tokensUsed: this.estimateTokens(documentContent + documentTitle),
                    responseTime,
                    generationId: result.generationId,
                    successful: true
                });

                console.log(`✅ Generated ${result.data.testCases?.length || 0} test cases with tracking`);

                return {
                    ...result,
                    tracking: trackingResult.success ? trackingResult.metrics : null,
                    trackingId: trackingResult.trackingId
                };
            } else {
                // Track failed attempt
                await this.metricsTracker.trackTestCaseGeneration({
                    testCases: [],
                    prompt: `Document: ${documentTitle}`,
                    documentTitle,
                    templateConfig,
                    provider: this.currentProvider,
                    model: this.currentModel,
                    tokensUsed: 0,
                    responseTime,
                    generationId: null,
                    successful: false
                });

                return result;
            }
            
        } catch (error) {
            console.error('❌ Test case generation with tracking failed:', error);
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Generate bug report with automatic metrics tracking
    async generateBugReport(prompt, consoleError = '', additionalContext = {}) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            console.log('🐛 Generating bug report with tracking...');
            
            const startTime = Date.now();
            
            // Generate bug report using the bug service
            const result = await this.bugService.generateBugReport(
                prompt,
                consoleError,
                additionalContext
            );

            const responseTime = Date.now() - startTime;

            if (result.success) {
                // Track the bug report generation
                const trackingResult = await this.metricsTracker.trackBugReportGeneration({
                    bugReport: result.data,
                    originalPrompt: prompt,
                    consoleError,
                    additionalContext,
                    provider: result.provider,
                    model: result.model,
                    tokensUsed: this.estimateTokens(prompt + consoleError),
                    responseTime,
                    generationId: result.generationId,
                    successful: true
                });

                console.log('✅ Generated bug report with tracking');

                return {
                    ...result,
                    tracking: trackingResult.success ? trackingResult.metrics : null,
                    trackingId: trackingResult.trackingId
                };
            } else {
                // Track failed attempt
                await this.metricsTracker.trackBugReportGeneration({
                    bugReport: null,
                    originalPrompt: prompt,
                    consoleError,
                    additionalContext,
                    provider: this.currentProvider,
                    model: this.currentModel,
                    tokensUsed: 0,
                    responseTime,
                    generationId: null,
                    successful: false
                });

                return result;
            }
            
        } catch (error) {
            console.error('❌ Bug report generation with tracking failed:', error);
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Get comprehensive AI analytics for dashboard
    async getAIAnalytics(dateRange = 30) {
        try {
            console.log(`📊 Fetching AI analytics for ${dateRange} days...`);
            
            // Get metrics from the tracker
            const metricsResult = await this.metricsTracker.getDashboardMetrics(dateRange);
            
            if (metricsResult.success) {
                // Add service status information
                const serviceStatus = this.getServiceStatus();
                const healthStatus = await this.testHealth();
                
                return {
                    success: true,
                    data: {
                        ...metricsResult.data,
                        serviceStatus,
                        healthStatus,
                        // Additional computed metrics for dashboard
                        efficiencyScore: this.calculateEfficiencyScore(metricsResult.data),
                        qualityScore: this.calculateQualityScore(metricsResult.data),
                        costSavings: this.calculateCostSavings(metricsResult.data),
                        trendAnalysis: this.analyzeTrends(metricsResult.data.dailyMetrics)
                    }
                };
            } else {
                return metricsResult;
            }
            
        } catch (error) {
            console.error('❌ Failed to get AI analytics:', error);
            return {
                success: false,
                error: error.message,
                data: this.getDefaultAnalytics()
            };
        }
    }

    // Test overall health of AI services
    async testHealth() {
        try {
            const [aiHealth, testCaseHealth, bugHealth] = await Promise.all([
                this.aiService.testConnection(),
                this.testCaseService.testHealth(),
                this.bugService.testHealth()
            ]);

            const overallHealthy = aiHealth.success && testCaseHealth.success && bugHealth.success;
            
            return {
                success: overallHealthy,
                healthy: overallHealthy,
                services: {
                    aiService: aiHealth,
                    testCaseService: testCaseHealth,
                    bugService: bugHealth
                },
                provider: this.currentProvider,
                model: this.currentModel
            };
            
        } catch (error) {
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }

    // Switch AI provider for all services
    async switchProvider(provider) {
        try {
            console.log(`🔄 Switching to ${provider} provider...`);
            
            // Switch provider in base service
            const switched = this.aiService.switchProvider(provider);
            
            if (!switched) {
                throw new Error(`Failed to switch to provider: ${provider}`);
            }

            // Test health with new provider
            const healthTest = await this.testHealth();
            
            if (healthTest.success) {
                this.currentProvider = provider;
                this.currentModel = this.aiService.providers[provider].model;
                
                console.log(`✅ Successfully switched to ${provider}`);
                
                return {
                    success: true,
                    provider,
                    model: this.currentModel,
                    healthy: true
                };
            } else {
                throw new Error(`Provider ${provider} health check failed`);
            }
            
        } catch (error) {
            console.error(`❌ Provider switch failed:`, error);
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Update AI settings across all services
    async updateSettings(newSettings) {
        try {
            const results = [];
            
            // Update provider if specified
            if (newSettings.provider && newSettings.provider !== this.currentProvider) {
                const switchResult = await this.switchProvider(newSettings.provider);
                results.push({ service: 'provider', result: switchResult });
            }
            
            // Update test case service settings
            if (newSettings.testCaseDefaults) {
                const testCaseResult = this.testCaseService.updateSettings(newSettings.testCaseDefaults);
                results.push({ service: 'testCase', result: testCaseResult });
            }
            
            // Update metrics tracking settings
            if (newSettings.metricsConfig) {
                this.updateMetricsConfig(newSettings.metricsConfig);
                results.push({ service: 'metrics', result: { success: true } });
            }

            const allSuccessful = results.every(r => r.result.success);
            
            return {
                success: allSuccessful,
                results,
                message: allSuccessful ? 'Settings updated successfully' : 'Some settings failed to update'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get current service status
    getServiceStatus() {
        return {
            initialized: this.isInitialized,
            available: this.isAvailable,
            provider: this.currentProvider,
            model: this.currentModel,
            error: this.initializationError,
            services: {
                aiService: this.aiService.getHealthStatus(),
                testCaseService: this.testCaseService.getServiceStatus(),
                bugService: this.bugService.getServiceStatus()
            }
        };
    }

    // Export comprehensive AI report
    async exportAIReport(format = 'json', dateRange = 30) {
        try {
            const analyticsResult = await this.getAIAnalytics(dateRange);
            
            if (!analyticsResult.success) {
                return analyticsResult;
            }

            const reportData = {
                exportInfo: {
                    generatedAt: new Date().toISOString(),
                    dateRange: `${dateRange} days`,
                    format,
                    version: '2.0',
                    services: ['AI Integration', 'Test Case Generation', 'Bug Report Generation', 'Metrics Tracking']
                },
                summary: {
                    totalTestCasesGenerated: analyticsResult.data.totalTestCasesGenerated,
                    totalBugReportsGenerated: analyticsResult.data.totalBugReportsGenerated,
                    totalTimeSaved: `${analyticsResult.data.totalTimeSavedHours.toFixed(1)} hours`,
                    totalCost: `${analyticsResult.data.totalCost.toFixed(4)}`,
                    roi: `${analyticsResult.data.estimatedROI.toFixed(1)}%`,
                    successRate: `${analyticsResult.data.overallSuccessRate.toFixed(1)}%`,
                    efficiencyScore: `${analyticsResult.data.efficiencyScore}/100`,
                    qualityScore: `${analyticsResult.data.qualityScore}/100`
                },
                detailedMetrics: analyticsResult.data,
                serviceStatus: this.getServiceStatus(),
                recommendations: this.generateRecommendations(analyticsResult.data)
            };

            const timestamp = new Date().toISOString().split('T')[0];
            
            if (format === 'json') {
                return {
                    success: true,
                    data: JSON.stringify(reportData, null, 2),
                    contentType: 'application/json',
                    filename: `ai-integration-report-${timestamp}.json`
                };
            }
            
            // Add CSV format if needed
            return await this.metricsTracker.exportMetrics(format, dateRange);
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    calculateEfficiencyScore(metrics) {
        // Score based on success rate, cost efficiency, and time savings
        const successScore = metrics.overallSuccessRate || 0;
        const costScore = Math.min(metrics.costEfficiency * 10, 100) || 0;
        const timeScore = Math.min(metrics.totalTimeSavedHours * 2, 100) || 0;
        
        return Math.round((successScore * 0.4 + costScore * 0.3 + timeScore * 0.3));
    }

    calculateQualityScore(metrics) {
        // Score based on automation candidates, critical bugs found, and average test cases per generation
        const automationScore = Math.min(metrics.automationCandidates * 2, 100) || 0;
        const bugScore = Math.min(metrics.criticalBugsIdentified * 10, 100) || 0;
        const generationScore = Math.min(metrics.averageTestCasesPerGeneration * 10, 100) || 0;
        
        return Math.round((automationScore * 0.4 + bugScore * 0.3 + generationScore * 0.3));
    }

    calculateCostSavings(metrics) {
        const laborCostPerHour = 60; // $60/hour assumption
        const totalLaborSaved = metrics.totalTimeSavedHours * laborCostPerHour;
        const netSavings = totalLaborSaved - metrics.totalCost;
        
        return {
            laborCostSaved: totalLaborSaved,
            aiCost: metrics.totalCost,
            netSavings,
            savingsPercentage: totalLaborSaved > 0 ? (netSavings / totalLaborSaved) * 100 : 0
        };
    }

    analyzeTrends(dailyMetrics) {
        const dates = Object.keys(dailyMetrics).sort();
        if (dates.length < 2) return { trend: 'insufficient_data' };
        
        const recent = dates.slice(-7); // Last 7 days
        const earlier = dates.slice(-14, -7); // Previous 7 days
        
        const recentAvg = recent.reduce((sum, date) => sum + (dailyMetrics[date].testCases + dailyMetrics[date].bugReports), 0) / recent.length;
        const earlierAvg = earlier.length > 0 ? earlier.reduce((sum, date) => sum + (dailyMetrics[date].testCases + dailyMetrics[date].bugReports), 0) / earlier.length : 0;
        
        const changePercent = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
        
        return {
            trend: changePercent > 10 ? 'increasing' : changePercent < -10 ? 'decreasing' : 'stable',
            changePercent: Math.round(changePercent),
            recentAverage: Math.round(recentAvg * 10) / 10,
            earlierAverage: Math.round(earlierAvg * 10) / 10
        };
    }

    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.overallSuccessRate < 80) {
            recommendations.push({
                type: 'success_rate',
                priority: 'high',
                message: 'Success rate is below 80%. Consider reviewing AI prompts and provider configuration.'
            });
        }
        
        if (metrics.costEfficiency < 2) {
            recommendations.push({
                type: 'cost_efficiency',
                priority: 'medium',
                message: 'Cost efficiency could be improved. Consider optimizing prompts or switching to a more cost-effective provider.'
            });
        }
        
        if (metrics.automationCandidates < metrics.totalTestCasesGenerated * 0.3) {
            recommendations.push({
                type: 'automation',
                priority: 'medium',
                message: 'Low automation potential in generated test cases. Consider adjusting templates to focus on automatable scenarios.'
            });
        }
        
        if (metrics.averageTestCasesPerGeneration < 5) {
            recommendations.push({
                type: 'productivity',
                priority: 'low',
                message: 'Consider optimizing prompts to generate more comprehensive test case sets per request.'
            });
        }
        
        return recommendations;
    }

    updateMetricsConfig(config) {
        if (config.timeEstimates) {
            this.metricsTracker.timeEstimates = { ...this.metricsTracker.timeEstimates, ...config.timeEstimates };
        }
        
        if (config.costRates) {
            this.metricsTracker.costRates = { ...this.metricsTracker.costRates, ...config.costRates };
        }
    }

    getUserFriendlyError(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('api key') || message.includes('apikey')) {
            return 'AI service requires proper API key configuration. Please check your environment settings.';
        }
        
        if (message.includes('connection') || message.includes('network')) {
            return 'Unable to connect to AI service. Please check your internet connection and try again.';
        }
        
        if (message.includes('quota') || message.includes('limit')) {
            return 'AI service usage limit reached. Please check your quota or try again later.';
        }
        
        if (message.includes('provider')) {
            return 'AI provider configuration issue. Please check your provider settings.';
        }
        
        return 'AI service is temporarily unavailable. Please try again later.';
    }

    getDefaultAnalytics() {
        return {
            totalTestCasesGenerated: 0,
            totalBugReportsGenerated: 0,
            totalAIGenerations: 0,
            overallSuccessRate: 0,
            totalTimeSavedHours: 0,
            totalCost: 0,
            costEfficiency: 0,
            estimatedROI: 0,
            automationCandidates: 0,
            criticalBugsIdentified: 0,
            averageTestCasesPerGeneration: 0,
            efficiencyScore: 0,
            qualityScore: 0,
            serviceStatus: this.getServiceStatus(),
            healthStatus: { success: false, healthy: false },
            lastUpdated: new Date().toISOString()
        };
    }

    // Reset all metrics (useful for testing)
    async resetAllMetrics() {
        this.metricsTracker.resetSessionMetrics();
        this.testCaseService.clearStats();
        
        return {
            success: true,
            message: 'All metrics reset successfully'
        };
    }

    // Get real-time session metrics
    getSessionMetrics() {
        return this.metricsTracker.sessionMetrics;
    }
}

// Create and export singleton instance
const aiIntegrationService = new AIIntegrationService();
export default aiIntegrationService;