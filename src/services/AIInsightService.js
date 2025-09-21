// services/AIInsightService.js - AI service for recording analysis and insights
/* eslint-disable @typescript-eslint/no-unused-vars */
import aiServiceInstance from './aiService';
import { FirestoreService } from './index';

class AIInsightService {
    constructor() {
        this.aiService = aiServiceInstance;
        this.isInitialized = false;
        this.currentProvider = null;
        this.currentModel = null;
        this.firestoreService = new FirestoreService();
    }

    // Initialize the AI insight service
    async initialize() {
        console.log('🚀 Initializing AI Insight Service...');

        try {
            // Test the underlying AI service connection
            const connectionTest = await this.aiService.testConnection();

            if (!connectionTest.success) {
                throw new Error(connectionTest.error || 'AI service connection failed');
            }

            this.isInitialized = true;
            this.currentProvider = connectionTest.provider;
            this.currentModel = connectionTest.model;

            console.log('✅ AI Insight Service initialized successfully');

            return {
                success: true,
                data: {
                    provider: this.currentProvider,
                    model: this.currentModel,
                    healthy: true
                }
            };

        } catch (error) {
            console.error('❌ AI Insight Service initialization failed:', error);

            this.isInitialized = false;
            this.currentProvider = null;
            this.currentModel = null;

            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Test service health
    async testHealth() {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return {
                    success: false,
                    healthy: false,
                    error: initResult.error
                };
            }
        }

        try {
            const healthCheck = await this.aiService.testConnection();

            return {
                success: healthCheck.success,
                healthy: healthCheck.success,
                provider: this.currentProvider,
                model: this.currentModel,
                responseTime: healthCheck.responseTime,
                error: healthCheck.error
            };

        } catch (error) {
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }

    // Analyze recording data and generate insights
    async analyzeRecording(recordingData) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            console.log('🤖 Starting AI analysis of recording data...');

            const prompt = this.buildAnalysisPrompt(recordingData);

            const result = await this.aiService.callAI(prompt, {
                type: 'recording_analysis',
                temperature: 0.6,
                maxTokens: 4000,
                logPrompt: false
            });

            if (result.success) {
                try {
                    const parsedData = this.parseAnalysisResponse(result.data);
                    const enhancedInsights = this.enhanceInsights(parsedData.insights, recordingData);

                    // Store the analysis result
                    const analysisId = await this.storeAnalysisResult({
                        recordingId: recordingData.id,
                        insights: enhancedInsights,
                        metadata: recordingData.metadata,
                        provider: result.provider,
                        model: result.model,
                        tokensUsed: result.usage?.total_tokens || 0,
                        responseTime: result.responseTime
                    });

                    console.log(`✅ Generated ${enhancedInsights.length} AI insights`);

                    return {
                        success: true,
                        data: {
                            insights: enhancedInsights,
                            summary: parsedData.summary || this.generateSummary(enhancedInsights)
                        },
                        metadata: {
                            analysisId,
                            totalInsights: enhancedInsights.length,
                            responseTime: result.responseTime,
                            provider: result.provider,
                            model: result.model
                        }
                    };

                } catch (parseError) {
                    console.error('Failed to parse AI analysis response:', parseError);

                    // Fallback to basic analysis if AI parsing fails
                    const fallbackInsights = this.generateFallbackInsights(recordingData);

                    return {
                        success: true,
                        data: {
                            insights: fallbackInsights,
                            summary: this.generateSummary(fallbackInsights)
                        },
                        metadata: {
                            totalInsights: fallbackInsights.length,
                            responseTime: result.responseTime,
                            provider: result.provider,
                            model: result.model,
                            fallbackMode: true
                        }
                    };
                }
            } else {
                throw new Error(result.error || 'AI analysis failed');
            }

        } catch (error) {
            console.error('❌ Recording analysis failed:', error);

            // Generate fallback insights on error
            const fallbackInsights = this.generateFallbackInsights(recordingData);

            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message),
                fallbackData: {
                    insights: fallbackInsights,
                    summary: this.generateSummary(fallbackInsights)
                }
            };
        }
    }

    // Build comprehensive analysis prompt for AI
    buildAnalysisPrompt(recordingData) {
        const { duration, consoleLogs, networkLogs, detectedIssues, metadata } = recordingData;

        return `You are an expert QA engineer and application analyst. Analyze this user session recording data and provide comprehensive insights about application health, user experience, and potential issues.

Recording Data Analysis:
- Session Duration: ${duration || 0} seconds
- Console Logs: ${consoleLogs.length} entries
- Network Requests: ${networkLogs.length} requests  
- Pre-detected Issues: ${detectedIssues.length} issues
- Total Log Events: ${metadata?.totalLogs || 0}
- Total Network Events: ${metadata?.totalRequests || 0}

Console Log Analysis:
${this.formatConsoleLogs(consoleLogs)}

Network Request Analysis:
${this.formatNetworkLogs(networkLogs)}

Pre-detected Issues:
${this.formatDetectedIssues(detectedIssues)}

Generate a comprehensive analysis in valid JSON format:
{
    "insights": [
        {
            "id": "unique_insight_id",
            "type": "error|network|performance|security|usability|positive|automation",
            "category": "javascript|api|system|security|interaction|testing",
            "title": "Clear, actionable insight title",
            "description": "Detailed description of the issue or observation",
            "severity": "critical|high|medium|low|info",
            "confidence": 0.0-1.0,
            "impact": "Business and user impact description",
            "recommendation": "Specific actionable recommendation",
            "evidence": ["Evidence item 1", "Evidence item 2"],
            "tags": ["tag1", "tag2", "tag3"],
            "automationPotential": "high|medium|low",
            "businessImpact": "functionality|user_experience|performance|security",
            "testCaseRecommendations": [
                {
                    "title": "Test case title",
                    "type": "functional|integration|regression|negative|performance|security",
                    "priority": "critical|high|medium|low",
                    "reasoning": "Why this test case is important"
                }
            ],
            "relatedLogs": ["Log entry 1", "Log entry 2"],
            "icon": "AlertTriangle|CheckCircle|Clock|Network|Code|Brain|Shield|User|TrendingUp|Wifi",
            "color": "red|yellow|green|blue|purple"
        }
    ],
    "summary": {
        "totalInsights": 0,
        "criticalIssues": 0,
        "automationCandidates": 0,
        "overallHealth": "excellent|good|fair|poor|critical",
        "keyFindings": ["Finding 1", "Finding 2"],
        "priorityActions": ["Action 1", "Action 2"]
    },
    "qualityGates": {
        "errorRate": 0.0-1.0,
        "performanceScore": 0-100,
        "securityScore": 0-100,
        "usabilityScore": 0-100
    }
}

Focus on:
1. Critical JavaScript errors that break functionality
2. Network performance and reliability issues  
3. Security vulnerabilities (HTTP vs HTTPS, sensitive data exposure)
4. User experience problems (slow loading, failed requests)
5. Automation opportunities for regression testing
6. Positive aspects and good practices observed
7. Performance bottlenecks and optimization opportunities

Provide specific, actionable recommendations with evidence from the actual log data.`;
    }

    // Format console logs for AI analysis
    formatConsoleLogs(consoleLogs) {
        if (consoleLogs.length === 0) return 'No console logs recorded.';

        const logSummary = {};
        consoleLogs.forEach(log => {
            logSummary[log.level] = (logSummary[log.level] || 0) + (log.count || 1);
        });

        const criticalErrors = consoleLogs
            .filter(log => log.level === 'error')
            .slice(0, 5)
            .map(log => `${log.level.toUpperCase()}: ${log.message}`)
            .join('\n');

        return `Log Level Summary: ${JSON.stringify(logSummary)}
Critical Error Examples:
${criticalErrors || 'No critical errors found'}`;
    }

    // Format network logs for AI analysis
    formatNetworkLogs(networkLogs) {
        if (networkLogs.length === 0) return 'No network requests recorded.';

        const statusSummary = {};
        const slowRequests = [];
        const failedRequests = [];

        networkLogs.forEach(req => {
            const statusGroup = Math.floor((req.status || 0) / 100) * 100;
            statusSummary[`${statusGroup}xx`] = (statusSummary[`${statusGroup}xx`] || 0) + 1;

            if (req.duration > 3000) {
                slowRequests.push(`${req.method} ${req.url} - ${req.duration}ms`);
            }

            if (req.status >= 400) {
                failedRequests.push(`${req.method} ${req.url} - HTTP ${req.status}`);
            }
        });

        return `Status Code Summary: ${JSON.stringify(statusSummary)}
Slow Requests (>3s): ${slowRequests.slice(0, 3).join(', ') || 'None'}
Failed Requests: ${failedRequests.slice(0, 3).join(', ') || 'None'}
Average Response Time: ${this.calculateAverageResponseTime(networkLogs)}ms`;
    }

    // Format pre-detected issues for AI analysis
    formatDetectedIssues(detectedIssues) {
        if (detectedIssues.length === 0) return 'No pre-detected issues.';

        return detectedIssues
            .slice(0, 5)
            .map(issue => `${issue.severity?.toUpperCase() || 'UNKNOWN'}: ${issue.message}`)
            .join('\n');
    }

    // Parse AI analysis response
    parseAnalysisResponse(response) {
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                response.match(/```\n([\s\S]*?)\n```/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Try to parse as direct JSON
            return JSON.parse(response);

        } catch (error) {
            // If parsing fails, try to clean up the response
            const cleanedResponse = response
                .replace(/```json|```/g, '')
                .replace(/^\s*[\r\n]/gm, '')
                .trim();

            return JSON.parse(cleanedResponse);
        }
    }

    // Enhance insights with additional metadata
    enhanceInsights(insights, recordingData) {
        return insights.map((insight, index) => ({
            ...insight,
            id: insight.id || `insight_${Date.now()}_${index}`,
            time: insight.time || this.calculateInsightTime(insight, recordingData),
            aiGenerated: true,
            source: 'ai-analysis',
            recordingId: recordingData.id,
            generatedAt: new Date().toISOString(),
            provider: this.currentProvider,
            model: this.currentModel
        }));
    }

    // Calculate appropriate timestamp for insight based on evidence
    calculateInsightTime(insight, recordingData) {
        // Try to map insight to actual log timestamps
        if (insight.relatedLogs?.length > 0) {
            const relatedLog = recordingData.consoleLogs.find(log =>
                insight.relatedLogs.some(related => log.message.includes(related.substring(0, 20)))
            );
            if (relatedLog && relatedLog.timestamp) {
                return relatedLog.timestamp;
            }
        }

        // Default to a random time within the recording duration
        return Math.random() * (recordingData.duration || 300);
    }

    // Generate fallback insights when AI analysis fails
    generateFallbackInsights(recordingData) {
        const insights = [];
        const { consoleLogs, networkLogs, duration } = recordingData;

        // Basic error analysis
        const errors = consoleLogs.filter(log => log.level === 'error');
        if (errors.length > 0) {
            insights.push({
                id: `fallback-errors-${Date.now()}`,
                type: 'error',
                category: 'javascript',
                title: `${errors.length} JavaScript Error${errors.length > 1 ? 's' : ''} Detected`,
                description: 'JavaScript errors found in console logs that may impact functionality',
                severity: errors.length > 3 ? 'high' : 'medium',
                confidence: 1.0,
                impact: 'May prevent users from completing tasks successfully',
                recommendation: 'Review and fix JavaScript errors, implement proper error handling',
                evidence: errors.slice(0, 3).map(e => e.message),
                tags: ['javascript', 'errors', 'functionality'],
                automationPotential: 'high',
                businessImpact: 'functionality',
                testCaseRecommendations: [{
                    title: 'Test error handling scenarios',
                    type: 'negative',
                    priority: 'high',
                    reasoning: 'Ensure application gracefully handles error conditions'
                }],
                relatedLogs: errors.slice(0, 3).map(e => e.message),
                icon: 'AlertTriangle',
                color: 'red',
                time: Math.random() * duration,
                aiGenerated: false,
                source: 'fallback-analysis'
            });
        }

        // Basic network analysis
        const failedRequests = networkLogs.filter(req => req.status >= 400);
        if (failedRequests.length > 0) {
            insights.push({
                id: `fallback-network-${Date.now()}`,
                type: 'network',
                category: 'api',
                title: `${failedRequests.length} Failed Network Request${failedRequests.length > 1 ? 's' : ''}`,
                description: 'Network requests failed with HTTP error status codes',
                severity: failedRequests.some(r => r.status >= 500) ? 'high' : 'medium',
                confidence: 1.0,
                impact: 'Users may not be able to load or save data properly',
                recommendation: 'Check API endpoints and implement proper error handling',
                evidence: failedRequests.slice(0, 3).map(r => `${r.method} ${r.url} - HTTP ${r.status}`),
                tags: ['network', 'api', 'connectivity'],
                automationPotential: 'high',
                businessImpact: 'user_experience',
                testCaseRecommendations: [{
                    title: 'Test API error handling',
                    type: 'integration',
                    priority: 'medium',
                    reasoning: 'Verify application handles API failures gracefully'
                }],
                relatedLogs: failedRequests.slice(0, 3).map(r => `${r.method} ${r.url}`),
                icon: 'Network',
                color: 'yellow',
                time: Math.random() * duration,
                aiGenerated: false,
                source: 'fallback-analysis'
            });
        }

        // If no issues found, create positive insight
        if (insights.length === 0) {
            insights.push({
                id: `fallback-positive-${Date.now()}`,
                type: 'positive',
                category: 'system',
                title: 'Clean Recording Session',
                description: 'No critical issues detected in this recording session',
                severity: 'info',
                confidence: 1.0,
                impact: 'Application appears to be running smoothly',
                recommendation: 'Continue monitoring and maintain current stability',
                evidence: ['No critical errors found', 'Network requests completed successfully'],
                tags: ['positive', 'stable', 'healthy'],
                automationPotential: 'low',
                businessImpact: 'user_experience',
                testCaseRecommendations: [{
                    title: 'Create baseline health check tests',
                    type: 'regression',
                    priority: 'low',
                    reasoning: 'Maintain current application stability'
                }],
                relatedLogs: [],
                icon: 'CheckCircle',
                color: 'green',
                time: duration * 0.5,
                aiGenerated: false,
                source: 'fallback-analysis'
            });
        }

        return insights;
    }

    // Generate summary from insights
    generateSummary(insights) {
        const criticalIssues = insights.filter(i => i.severity === 'critical').length;
        const automationCandidates = insights.filter(i => i.automationPotential === 'high').length;

        const healthScore = this.calculateHealthScore(insights);
        let overallHealth = 'excellent';
        if (healthScore < 40) overallHealth = 'critical';
        else if (healthScore < 60) overallHealth = 'poor';
        else if (healthScore < 80) overallHealth = 'fair';
        else if (healthScore < 95) overallHealth = 'good';

        const keyFindings = insights
            .filter(i => i.severity === 'critical' || i.severity === 'high')
            .slice(0, 3)
            .map(i => i.title);

        const priorityActions = insights
            .filter(i => i.severity === 'critical' || i.severity === 'high')
            .slice(0, 3)
            .map(i => i.recommendation);

        return {
            totalInsights: insights.length,
            criticalIssues,
            automationCandidates,
            overallHealth,
            keyFindings: keyFindings.length > 0 ? keyFindings : ['No critical issues found'],
            priorityActions: priorityActions.length > 0 ? priorityActions : ['Continue monitoring application health']
        };
    }

    // Calculate overall health score
    calculateHealthScore(insights) {
        if (insights.length === 0) return 100;

        const severityWeights = { critical: 40, high: 20, medium: 10, low: 5, info: 0 };
        const totalPenalty = insights.reduce((sum, insight) =>
            sum + (severityWeights[insight.severity] || 0), 0
        );

        return Math.max(0, 100 - totalPenalty);
    }

    // Store analysis result in Firestore
    async storeAnalysisResult(analysisData) {
        try {
            const result = await this.firestoreService.createDocument('ai_recording_analysis', {
                ...analysisData,
                timestamp: new Date().toISOString(),
                id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });

            return result.success ? result.docId : null;

        } catch (error) {
            console.error('Error storing analysis result:', error);
            return null;
        }
    }

    // Get stored analysis results
    async getAnalysisHistory(recordingId, limit = 10) {
        try {
            return await this.firestoreService.queryDocuments('ai_recording_analysis', {
                where: [['recordingId', '==', recordingId]],
                orderBy: [['timestamp', 'desc']],
                limit
            });
        } catch (error) {
            console.error('Error fetching analysis history:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper methods
    calculateAverageResponseTime(networkLogs) {
        if (networkLogs.length === 0) return 0;
        const totalTime = networkLogs.reduce((sum, req) => sum + (req.duration || 0), 0);
        return Math.round(totalTime / networkLogs.length);
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

        return 'AI analysis service is temporarily unavailable. Please try again later.';
    }

    // Service status and configuration
    getServiceStatus() {
        return {
            initialized: this.isInitialized,
            healthy: this.isInitialized,
            provider: this.currentProvider,
            model: this.currentModel,
            error: this.isInitialized ? null : 'Service not initialized'
        };
    }

    // Switch AI provider
    async switchProvider(provider) {
        try {
            const switched = this.aiService.switchProvider(provider);

            if (switched) {
                const healthTest = await this.testHealth();

                if (healthTest.success) {
                    this.currentProvider = provider;
                    return { success: true, provider };
                }
            }

            throw new Error(`Failed to switch to provider: ${provider}`);

        } catch {
            return {
                success: false,
                error: `Failed to switch to provider: ${provider}`
            };
        }
    }
}

// Create and export singleton instance
const aiInsightService = new AIInsightService();
export default aiInsightService;