// services/aiEventInterceptor.js
import aiServiceInstance from './aiService';
import FirestoreService from './index';

class AIEventInterceptor {
    constructor() {
        this.metrics = new Map();
        this.userContext = null;
        this.aiService = aiServiceInstance;
    }

    setUserContext(user, activeSuite) {
        this.userContext = {
            userId: user?.uid,
            userEmail: user?.email,
            accountType: user?.accountType,
            organizationId: user?.organizationId,
            suiteId: activeSuite?.id,
            suiteName: activeSuite?.name,
            timestamp: new Date().toISOString()
        };
    }

    // Main wrapper function for all actions
    wrapActionsWithAI(actions, actionType) {
        const wrappedActions = {};
        
        Object.keys(actions).forEach(actionName => {
            if (typeof actions[actionName] === 'function') {
                wrappedActions[actionName] = this.wrapAction(
                    actions[actionName], 
                    actionType, 
                    actionName
                );
            } else {
                wrappedActions[actionName] = actions[actionName];
            }
        });

        return wrappedActions;
    }

    // Wrap individual action with AI intelligence
    wrapAction(originalAction, actionType, actionName) {
        return async (...args) => {
            const startTime = Date.now();
            const eventId = `${actionType}_${actionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            try {
                // Pre-action AI analysis
                const preAnalysis = await this.preActionAnalysis(actionType, actionName, args);
                
                // Apply AI enhancements to arguments
                const enhancedArgs = await this.enhanceActionArgs(actionType, actionName, args, preAnalysis);
                
                // Execute original action with enhanced arguments
                const result = await originalAction(...enhancedArgs);
                
                // Post-action AI analysis and metrics
                const postAnalysis = await this.postActionAnalysis(
                    actionType, 
                    actionName, 
                    enhancedArgs, 
                    result, 
                    startTime
                );

                // Log event for learning and metrics
                await this.logAIEvent({
                    eventId,
                    actionType,
                    actionName,
                    preAnalysis,
                    postAnalysis,
                    result,
                    executionTime: Date.now() - startTime,
                    context: this.userContext
                });

                // Return enhanced result with AI insights
                return {
                    ...result,
                    aiInsights: postAnalysis.insights,
                    aiMetrics: postAnalysis.metrics
                };

            } catch (error) {
                await this.logAIEvent({
                    eventId,
                    actionType,
                    actionName,
                    error: error.message,
                    executionTime: Date.now() - startTime,
                    context: this.userContext
                });
                throw error;
            }
        };
    }

    // Pre-action AI analysis
    async preActionAnalysis(actionType, actionName, args) {
        const analysis = {
            actionType,
            actionName,
            timestamp: new Date().toISOString(),
            context: this.userContext,
            suggestions: [],
            enhancements: {},
            quality_score: null
        };

        try {
            // Apply rule-based intelligence based on action type
            switch (actionType) {
                case 'testCases':
                    return await this.analyzeTestCaseAction(actionName, args, analysis);
                
                case 'bugs':
                    return await this.analyzeBugAction(actionName, args, analysis);
                
                case 'suites':
                    return await this.analyzeSuiteAction(actionName, args, analysis);

                default:
                    return analysis;
            }
        } catch (error) {
            console.warn('Pre-action AI analysis failed:', error);
            return analysis;
        }
    }

    // Test case specific AI analysis
    async analyzeTestCaseAction(actionName, args, analysis) {
        if (actionName === 'createTestCase') {
            const testCaseData = args[0];
            
            // AI enhancement for test case creation
            if (testCaseData) {
                // Suggest missing fields
                const suggestions = [];
                if (!testCaseData.priority) {
                    suggestions.push({
                        type: 'missing_field',
                        field: 'priority',
                        suggestion: 'Consider adding priority level (Critical/High/Medium/Low)',
                        impact: 'helps with test execution planning'
                    });
                }

                if (!testCaseData.expectedResult) {
                    suggestions.push({
                        type: 'missing_field',
                        field: 'expectedResult',
                        suggestion: 'Add clear expected result for verification',
                        impact: 'improves test case clarity and execution'
                    });
                }

                // Quality scoring
                let qualityScore = 60; // Base score
                if (testCaseData.title?.length > 10) qualityScore += 10;
                if (testCaseData.description?.length > 50) qualityScore += 15;
                if (testCaseData.steps?.length > 2) qualityScore += 10;
                if (testCaseData.expectedResult) qualityScore += 5;

                // Smart defaults based on title/description
                const enhancements = {};
                if (testCaseData.title?.toLowerCase().includes('login')) {
                    enhancements.suggestedTags = ['authentication', 'security'];
                    enhancements.suggestedSteps = [
                        'Navigate to login page',
                        'Enter valid credentials',
                        'Click login button',
                        'Verify successful authentication'
                    ];
                }

                analysis.suggestions = suggestions;
                analysis.quality_score = qualityScore;
                analysis.enhancements = enhancements;
            }
        }

        return analysis;
    }

    // Bug specific AI analysis  
    async analyzeBugAction(actionName, args, analysis) {
        if (actionName === 'createBug') {
            const bugData = args[0];
            
            if (bugData) {
                // Auto-assess severity using existing AI service
                try {
                    const severityResult = await this.aiService.assessBugSeverity(bugData, {
                        applicationType: 'Web Application',
                        businessCriticality: 'High'
                    });

                    if (severityResult.success) {
                        analysis.enhancements.aiSeverityAssessment = severityResult.data.assessment;
                        analysis.enhancements.recommendedPriority = severityResult.data.assessment.priority;
                        
                        analysis.suggestions.push({
                            type: 'ai_suggestion',
                            field: 'severity',
                            suggestion: `AI suggests ${severityResult.data.assessment.severity} severity based on impact analysis`,
                            confidence: severityResult.data.assessment.confidenceScore
                        });
                    }
                } catch (error) {
                    console.warn('AI severity assessment failed:', error);
                }

                // Quality scoring for bug reports
                let qualityScore = 50;
                if (bugData.title?.length > 15) qualityScore += 15;
                if (bugData.description?.length > 100) qualityScore += 20;
                if (bugData.stepsToReproduce?.length > 0) qualityScore += 15;

                analysis.quality_score = qualityScore;
            }
        }

        return analysis;
    }

    // Suite specific AI analysis
    async analyzeSuiteAction(actionName, args, analysis) {
        if (actionName === 'createTestSuite') {
            const suiteData = args[0];
            
            if (suiteData) {
                // Suggest suite structure based on name/type
                const suggestions = [];
                const enhancements = {};

                if (suiteData.name?.toLowerCase().includes('api')) {
                    suggestions.push({
                        type: 'structure_suggestion',
                        suggestion: 'Consider organizing with folders: Authentication, CRUD Operations, Error Handling',
                        impact: 'improves test organization for API testing'
                    });
                }

                if (suiteData.name?.toLowerCase().includes('mobile')) {
                    suggestions.push({
                        type: 'structure_suggestion', 
                        suggestion: 'Consider device-specific test categories: iOS, Android, Cross-platform',
                        impact: 'better mobile testing coverage'
                    });
                }

                analysis.suggestions = suggestions;
                analysis.enhancements = enhancements;
            }
        }

        return analysis;
    }

    // Enhance action arguments with AI suggestions
    async enhanceActionArgs(actionType, actionName, args, preAnalysis) {
        const enhancedArgs = [...args];

        // Apply enhancements to first argument (usually the data object)
        if (args[0] && typeof args[0] === 'object' && preAnalysis.enhancements) {
            enhancedArgs[0] = {
                ...args[0],
                ...preAnalysis.enhancements,
                // Add AI metadata
                aiEnhanced: true,
                aiQualityScore: preAnalysis.quality_score,
                aiTimestamp: new Date().toISOString()
            };
        }

        return enhancedArgs;
    }

    // Post-action analysis and metrics calculation
    async postActionAnalysis(actionType, actionName, args, result, startTime) {
        const executionTime = Date.now() - startTime;
        
        const analysis = {
            success: result?.success || false,
            executionTime,
            metrics: {
                timeSaved: 0,
                qualityImprovement: 0,
                suggestionAcceptanceRate: 0
            },
            insights: [],
            recommendations: []
        };

        // Calculate metrics based on action type
        if (result?.success) {
            switch (actionType) {
                case 'testCases':
                    if (actionName === 'createTestCase') {
                        // Estimate time saved with AI assistance
                        const baselineTime = 900000; // 15 minutes in ms
                        analysis.metrics.timeSaved = Math.max(0, (baselineTime - executionTime) / 1000 / 60); // in minutes
                        
                        if (args[0]?.aiQualityScore > 75) {
                            analysis.metrics.qualityImprovement = 25;
                            analysis.insights.push('High quality test case created with AI assistance');
                        }
                    }
                    break;

                case 'bugs':
                    if (actionName === 'createBug') {
                        const baselineTime = 600000; // 10 minutes
                        analysis.metrics.timeSaved = Math.max(0, (baselineTime - executionTime) / 1000 / 60);
                        
                        if (args[0]?.aiSeverityAssessment) {
                            analysis.insights.push('AI-assisted severity assessment applied');
                            analysis.metrics.qualityImprovement = 20;
                        }
                    }
                    break;
            }
        }

        return analysis;
    }

    // Log AI events for learning and metrics
    async logAIEvent(eventData) {
        try {
            // Store in Firestore for metrics dashboard
            await FirestoreService.createDocument('ai_events', {
                ...eventData,
                userId: this.userContext?.userId,
                organizationId: this.userContext?.organizationId,
                suiteId: this.userContext?.suiteId,
                timestamp: new Date().toISOString()
            });

            // Update real-time metrics cache
            this.updateMetricsCache(eventData);
            
        } catch (error) {
            console.error('Failed to log AI event:', error);
        }
    }

    // Update in-memory metrics for dashboard
    updateMetricsCache(eventData) {
        const userId = this.userContext?.userId;
        if (!userId) return;

        if (!this.metrics.has(userId)) {
            this.metrics.set(userId, {
                totalActions: 0,
                totalTimeSaved: 0,
                totalQualityImprovements: 0,
                aiAssisted: 0,
                lastUpdated: new Date().toISOString()
            });
        }

        const userMetrics = this.metrics.get(userId);
        userMetrics.totalActions += 1;
        
        if (eventData.postAnalysis) {
            userMetrics.totalTimeSaved += eventData.postAnalysis.metrics.timeSaved || 0;
            userMetrics.totalQualityImprovements += eventData.postAnalysis.metrics.qualityImprovement || 0;
            if (eventData.postAnalysis.metrics.timeSaved > 0) {
                userMetrics.aiAssisted += 1;
            }
        }
        
        userMetrics.lastUpdated = new Date().toISOString();
        this.metrics.set(userId, userMetrics);
    }

    // Get metrics for dashboard
    getMetrics(userId) {
        return this.metrics.get(userId) || {
            totalActions: 0,
            totalTimeSaved: 0,
            totalQualityImprovements: 0,
            aiAssisted: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    // Get real-time insights for user
    getInsights(userId) {
        const metrics = this.getMetrics(userId);
        const insights = [];

        if (metrics.totalTimeSaved > 60) {
            insights.push({
                type: 'productivity',
                message: `AI has saved you ${Math.round(metrics.totalTimeSaved)} minutes this week`,
                impact: 'time_saved'
            });
        }

        if (metrics.aiAssisted > 10) {
            insights.push({
                type: 'adoption',
                message: `${metrics.aiAssisted} tasks completed with AI assistance`,
                impact: 'efficiency'
            });
        }

        return insights;
    }
}

// Export singleton instance
export const aiEventInterceptor = new AIEventInterceptor();
export default aiEventInterceptor;