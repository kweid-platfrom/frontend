/* eslint-disable @typescript-eslint/no-unused-vars */
// services/aiService.js - Gemini-only AI Service
import { FirestoreService } from '../services'
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
    constructor() {
        this.firestoreService = new FirestoreService();
        
        // Simplified configuration - Gemini only
        this.config = {
            model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash',
            apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            temperature: 0.7,
            maxTokens: 3000
        };

        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.isHealthy = false;
        this.lastHealthCheck = null;

        // Initialize Gemini client
        if (this.config.apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(this.config.apiKey);
                console.log('✅ Gemini AI client initialized');
            } catch (error) {
                console.error('❌ Failed to initialize Gemini client:', error);
            }
        } else {
            console.warn('⚠️ Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY');
        }
    }

    // Test connection to Gemini - REQUIRED METHOD
    async testConnection() {
        console.log('🔍 Testing Gemini AI connection...');

        try {
            if (!this.config.apiKey) {
                throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
            }

            if (!this.genAI) {
                this.genAI = new GoogleGenerativeAI(this.config.apiKey);
            }

            const testPrompt = "Hello! Please respond with 'Connection successful' if you can read this.";
            const result = await this.callAI(testPrompt, {
                type: 'connection_test',
                temperature: 0.1,
                maxTokens: 50,
                logPrompt: false
            });

            if (result.success) {
                this.isHealthy = true;
                this.lastHealthCheck = new Date().toISOString();

                console.log('✅ Gemini connection successful');
                return {
                    success: true,
                    provider: 'gemini',
                    model: this.config.model,
                    responseTime: result.responseTime,
                    healthy: true,
                    message: 'Gemini AI connection test successful'
                };
            } else {
                throw new Error(result.error || 'Connection test failed');
            }
        } catch (error) {
            this.isHealthy = false;
            this.lastHealthCheck = new Date().toISOString();

            console.error('❌ Gemini connection failed:', error.message);

            return {
                success: false,
                provider: 'gemini',
                healthy: false,
                error: error.message,
                message: `Failed to connect to Gemini: ${error.message}`
            };
        }
    }

    // Get health status
    getHealthStatus() {
        return {
            isHealthy: this.isHealthy,
            lastHealthCheck: this.lastHealthCheck,
            provider: 'gemini',
            model: this.config.model
        };
    }

    // Get current provider configuration
    getCurrentProvider() {
        return {
            provider: 'gemini',
            model: this.config.model,
            config: this.config
        };
    }

    // Core AI API call with retry logic
    async callAI(prompt, options = {}) {
        if (!this.config.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(this.config.apiKey);
        }

        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: this.config.model,
                    generationConfig: {
                        temperature: options.temperature || this.config.temperature,
                        maxOutputTokens: options.maxTokens || this.config.maxTokens,
                    }
                });

                const promptText = Array.isArray(prompt) 
                    ? prompt.map(p => p.content || p).join('\n') 
                    : prompt;

                const result = await model.generateContent(promptText);
                const response = await result.response;
                const text = response.text();

                const responseTime = Date.now() - startTime;

                // Log successful AI usage (only if not a connection test)
                if (options.type !== 'connection_test') {
                    await this.logAIUsage({
                        provider: 'gemini',
                        type: options.type || 'general',
                        tokensUsed: 0, // Gemini doesn't provide token count in response
                        cost: 0,
                        successful: true,
                        responseTime,
                        model: this.config.model,
                        prompt: options.logPrompt ? prompt : '[REDACTED]',
                        timestamp: new Date().toISOString()
                    });
                }

                return {
                    success: true,
                    data: text,
                    usage: { total_tokens: 0 }, // Gemini doesn't provide token usage
                    responseTime,
                    provider: 'gemini',
                    model: this.config.model
                };
            } catch (error) {
                console.error(`AI API attempt ${attempt} failed:`, error);

                if (attempt === this.maxRetries) {
                    // Log failed attempt
                    if (options.type !== 'connection_test') {
                        await this.logAIUsage({
                            provider: 'gemini',
                            type: options.type || 'general',
                            tokensUsed: 0,
                            cost: 0,
                            successful: false,
                            responseTime: Date.now() - startTime,
                            model: this.config.model,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    }

                    return {
                        success: false,
                        error: `Failed after ${this.maxRetries} attempts: ${error.message}`,
                        provider: 'gemini'
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // Generate test cases from user prompt
    async generateTestCases(prompt, templateConfig = {}) {
        const systemPrompt = this.buildTestCasePrompt(prompt, templateConfig);

        const result = await this.callAI(systemPrompt, {
            type: 'test_generation',
            temperature: 0.6,
            maxTokens: 3000
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);

                // Store generation record
                const docResult = await this.firestoreService.createDocument('ai_generations', {
                    type: 'test_cases',
                    prompt,
                    templateConfig,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    responseTime: result.responseTime,
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    generationId: docResult.success ? docResult.docId : null,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                console.error('Failed to parse AI response:', error);
                return {
                    success: false,
                    error: 'Invalid AI response format',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Build comprehensive test case generation prompt
    buildTestCasePrompt(prompt, templateConfig) {
        return `
You are an expert QA engineer with extensive experience in test case design and quality assurance. Generate comprehensive test cases based on the given requirements.

Template Configuration:
- Test Case Format: ${templateConfig.format || 'Given-When-Then'}
- Priority Levels: ${templateConfig.priorities || 'Critical, High, Medium, Low'}
- Test Types: ${templateConfig.types || 'Functional, Integration, Edge Case, Negative, Performance'}
- Include Test Data: ${templateConfig.includeTestData ? 'Yes' : 'No'}
- Framework: ${templateConfig.framework || 'Generic'}
- Coverage Requirements: ${templateConfig.coverage || 'Standard'}

Generate test cases in valid JSON format with the following structure:
{
    "testCases": [
        {
            "id": "unique_test_id",
            "title": "Clear, descriptive test case title",
            "description": "Detailed description of what this test validates",
            "priority": "Critical|High|Medium|Low",
            "type": "Functional|Integration|Edge Case|Negative|Performance|Security|Accessibility",
            "category": "UI|API|Database|Integration|System",
            "preconditions": "Required setup before test execution",
            "steps": [
                "Step 1: Clear action to perform",
                "Step 2: Next action with expected behavior",
                "Step 3: Verification step"
            ],
            "expectedResult": "Clear expected outcome",
            "testData": "Sample data if applicable",
            "tags": ["tag1", "tag2"],
            "estimatedTime": "5-15 minutes",
            "automationPotential": "High|Medium|Low",
            "riskLevel": "High|Medium|Low"
        }
    ],
    "summary": {
        "totalTests": 0,
        "breakdown": {
            "functional": 0,
            "integration": 0,
            "edgeCase": 0,
            "negative": 0,
            "performance": 0,
            "security": 0
        },
        "coverageAreas": ["area1", "area2"],
        "automationRecommendations": "Recommendations for test automation",
        "riskAssessment": "Overall risk assessment"
    },
    "qualityGates": {
        "criticalTests": 0,
        "highPriorityTests": 0,
        "automationCandidates": 0
    }
}

Requirements and Context: ${prompt}

Focus on creating realistic, executable test cases that provide comprehensive coverage while being practical for implementation.
`;
    }

    // Generate comprehensive bug report with AI enhancement
    async generateBugReport(input, type = 'description', additionalContext = {}) {
        const systemPrompt = this.buildBugReportPrompt(input, type, additionalContext);

        const result = await this.callAI(systemPrompt, {
            type: 'bug_analysis',
            temperature: 0.5,
            maxTokens: 2500
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);

                // Store bug analysis
                const docResult = await this.firestoreService.createDocument('ai_bug_analysis', {
                    input,
                    inputType: type,
                    additionalContext,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    analysisId: docResult.success ? docResult.docId : null
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Invalid AI response format',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Build comprehensive bug report prompt
    buildBugReportPrompt(input, type, additionalContext) {
        return `
You are an expert QA engineer and bug analyst. Create a comprehensive, actionable bug report based on the provided information.

Generate a detailed bug report in valid JSON format:
{
    "title": "Concise, descriptive bug title",
    "severity": "Critical|High|Medium|Low",
    "priority": "P1|P2|P3|P4",
    "description": "Detailed description of the issue",
    "impact": "Description of business/user impact",
    "stepsToReproduce": [
        "Step 1: Specific action",
        "Step 2: Next action",
        "Step 3: Result observation"
    ],
    "expectedBehavior": "What should happen",
    "actualBehavior": "What actually happens",
    "environment": {
        "browser": "Browser if applicable",
        "browserVersion": "Version if determinable",
        "os": "Operating system if determinable",
        "device": "Device type if applicable",
        "version": "Application version if available",
        "url": "URL if web-based"
    },
    "additionalInfo": {
        "frequency": "Always|Sometimes|Rare",
        "userType": "All users|Specific role|Admin only",
        "dataRequired": "Any specific data needed",
        "networkConditions": "Online|Offline|Slow connection"
    },
    "testCaseRecommendations": [
        {
            "title": "Regression test case title",
            "type": "Regression|Smoke|Integration|Unit",
            "priority": "High|Medium|Low",
            "reasoning": "Why this test case is important"
        }
    ],
    "relatedAreas": ["Area 1", "Area 2"],
    "suggestedTestCases": [
        {
            "title": "Test case to prevent regression",
            "type": "Regression|Smoke|Integration",
            "priority": "High|Medium|Low",
            "automationPotential": "High|Medium|Low"
        }
    ],
    "reproducible": true,
    "workaround": "Temporary fix if available",
    "attachments": ["Screenshot needed", "Console logs", "Network logs"],
    "tags": ["tag1", "tag2", "tag3"],
    "riskAssessment": "Assessment of risk if not fixed",
    "needsTestCase": true
}

${type === 'console' ? 'Console logs/error messages:' : 'Bug description:'} ${input}

${additionalContext.environment ? `Environment Details: ${JSON.stringify(additionalContext.environment)}` : ''}
${additionalContext.userStory ? `Related User Story: ${additionalContext.userStory}` : ''}
${additionalContext.feature ? `Feature Area: ${additionalContext.feature}` : ''}

Analyze the information thoroughly and provide actionable insights for the QA team.
`;
    }

    // Helper method to parse JSON responses safely
    parseJSONResponse(response) {
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
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

    // Log AI usage
    async logAIUsage(usageData) {
        try {
            await this.firestoreService.createDocument('ai_usage_logs', {
                ...usageData,
                id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        } catch (error) {
            console.error('Error logging AI usage:', error);
        }
    }

    // Get AI metrics with proper error handling
    async getAIMetrics(dateRange = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

            console.log(`📊 Fetching AI metrics for last ${dateRange} days...`);

            const [usageResult, generationsResult, bugAnalysisResult] = await Promise.all([
                this.firestoreService.queryDocuments('ai_usage_logs', {
                    where: [['timestamp', '>=', startDate.toISOString()]],
                    orderBy: [['timestamp', 'desc']]
                }).catch(e => ({ success: false, data: [], error: e.message })),
                this.firestoreService.queryDocuments('ai_generations', {
                    where: [['timestamp', '>=', startDate.toISOString()]],
                    orderBy: [['timestamp', 'desc']]
                }).catch(e => ({ success: false, data: [], error: e.message })),
                this.firestoreService.queryDocuments('ai_bug_analysis', {
                    where: [['timestamp', '>=', startDate.toISOString()]],
                    orderBy: [['timestamp', 'desc']]
                }).catch(e => ({ success: false, data: [], error: e.message }))
            ]);

            const usageLogs = usageResult.success ? usageResult.data : [];
            const generations = generationsResult.success ? generationsResult.data : [];
            const bugAnalyses = bugAnalysisResult.success ? bugAnalysisResult.data : [];

            const metrics = this.calculateMetrics(usageLogs, generations, bugAnalyses, dateRange);

            return {
                success: true,
                data: metrics,
                lastUpdated: new Date().toISOString(),
                dataPoints: {
                    usageLogs: usageLogs.length,
                    generations: generations.length,
                    bugAnalyses: bugAnalyses.length
                }
            };
        } catch (error) {
            console.error('❌ Error fetching AI metrics:', error);
            return {
                success: false,
                error: error.message,
                data: this.getDefaultMetrics()
            };
        }
    }

    // Calculate metrics from data
    calculateMetrics(usageLogs, generations, bugAnalyses, dateRange) {
        const successful = usageLogs.filter(log => log.successful);
        const failed = usageLogs.filter(log => !log.successful);

        const totalAIGenerations = generations.length;
        const successfulGenerations = successful.length;
        const failedGenerations = failed.length;
        const aiSuccessRate = usageLogs.length > 0 ? (successfulGenerations / usageLogs.length) * 100 : 0;

        // Test case analysis
        const allTestCases = generations.reduce((acc, gen) => {
            const testCases = gen.result?.testCases || [];
            return acc.concat(testCases);
        }, []);

        const testTypeBreakdown = {
            functional: allTestCases.filter(tc => tc.type === 'Functional').length,
            integration: allTestCases.filter(tc => tc.type === 'Integration').length,
            edgeCase: allTestCases.filter(tc => tc.type === 'Edge Case').length,
            negative: allTestCases.filter(tc => tc.type === 'Negative').length,
            performance: allTestCases.filter(tc => tc.type === 'Performance').length,
            security: allTestCases.filter(tc => tc.type === 'Security').length
        };

        const avgResponseTime = usageLogs.length > 0 
            ? Math.round(usageLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / usageLogs.length / 1000)
            : 0;

        const totalTestCases = allTestCases.length;
        const avgTestCasesPerGeneration = totalAIGenerations > 0 ? totalTestCases / totalAIGenerations : 0;

        return {
            totalAIGenerations,
            successfulGenerations,
            failedGenerations,
            aiSuccessRate,
            avgGenerationTimeSeconds: avgResponseTime,
            avgTestCasesPerGeneration,
            totalAPICallsCount: usageLogs.length,
            geminiCallsCount: usageLogs.filter(log => log.provider === 'gemini').length,
            functionalTestsGenerated: testTypeBreakdown.functional,
            integrationTestsGenerated: testTypeBreakdown.integration,
            edgeTestsGenerated: testTypeBreakdown.edgeCase,
            negativeTestsGenerated: testTypeBreakdown.negative,
            performanceTestsGenerated: testTypeBreakdown.performance,
            securityTestsGenerated: testTypeBreakdown.security,
            bugSuggestionsGenerated: bugAnalyses.length,
            estimatedTimeSavedHours: Math.round((totalTestCases * 5) / 60 * 10) / 10,
            lastUpdated: new Date().toISOString(),
            dateRange,
            provider: 'gemini',
            model: this.config.model
        };
    }

    // Export AI report
    async exportAIReport(format = 'json', dateRange = 30) {
        try {
            const metricsResult = await this.getAIMetrics(dateRange);
            if (!metricsResult.success) {
                throw new Error(metricsResult.error || 'Failed to fetch metrics for export');
            }

            const metrics = metricsResult.data;
            const timestamp = new Date().toISOString().split('T')[0];

            if (format === 'json') {
                const reportData = {
                    exportInfo: {
                        generatedAt: new Date().toISOString(),
                        dateRange: `${dateRange} days`,
                        format: 'json',
                        version: '1.0',
                        provider: 'gemini'
                    },
                    metrics,
                    summary: {
                        totalGenerations: metrics.totalAIGenerations,
                        successRate: `${metrics.aiSuccessRate.toFixed(2)}%`,
                        timeSaved: `${metrics.estimatedTimeSavedHours} hours`
                    }
                };

                return {
                    success: true,
                    data: JSON.stringify(reportData, null, 2),
                    contentType: 'application/json',
                    filename: `gemini-ai-report-${timestamp}.json`
                };
            } else if (format === 'csv') {
                const csvRows = [
                    ['Metric', 'Value', 'Description'],
                    ['Total AI Generations', metrics.totalAIGenerations, 'Total number of AI-powered generations'],
                    ['Success Rate', `${metrics.aiSuccessRate.toFixed(2)}%`, 'Percentage of successful AI calls'],
                    ['Average Generation Time', `${metrics.avgGenerationTimeSeconds}s`, 'Average time per generation'],
                    ['Gemini API Calls', metrics.geminiCallsCount, 'Total API calls to Gemini'],
                    ['Functional Tests Generated', metrics.functionalTestsGenerated, 'Number of functional test cases'],
                    ['Time Saved', `${metrics.estimatedTimeSavedHours}h`, 'Estimated manual work time saved']
                ];

                const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

                return {
                    success: true,
                    data: csvContent,
                    contentType: 'text/csv',
                    filename: `gemini-ai-report-${timestamp}.csv`
                };
            }

            throw new Error(`Unsupported export format: ${format}`);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Default metrics for error cases
    getDefaultMetrics() {
        return {
            totalAIGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            aiSuccessRate: 0,
            avgGenerationTimeSeconds: 0,
            avgTestCasesPerGeneration: 0,
            totalAPICallsCount: 0,
            geminiCallsCount: 0,
            functionalTestsGenerated: 0,
            integrationTestsGenerated: 0,
            edgeTestsGenerated: 0,
            negativeTestsGenerated: 0,
            performanceTestsGenerated: 0,
            securityTestsGenerated: 0,
            bugSuggestionsGenerated: 0,
            estimatedTimeSavedHours: 0,
            lastUpdated: new Date().toISOString(),
            provider: 'gemini',
            model: this.config.model
        };
    }

    // Compatibility methods
    async testHealth() {
        return await this.testConnection();
    }

    getServiceStatus() {
        return {
            initialized: this.isHealthy,
            healthy: this.isHealthy,
            provider: 'gemini',
            model: this.config.model,
            lastHealthCheck: this.lastHealthCheck,
            error: this.isHealthy ? null : 'Service not healthy'
        };
    }

    getSupportedProviders() {
        return [{
            name: 'gemini',
            model: this.config.model,
            configured: !!this.config.apiKey
        }];
    }
}

const aiServiceInstance = new AIService();
export default aiServiceInstance;