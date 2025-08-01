/* eslint-disable @typescript-eslint/no-unused-vars */
// services/aiService.js - Enhanced AI Service with Gemini AI support
import { FirestoreService } from './firestoreService';
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
    constructor() {
        this.firestoreService = new FirestoreService();
        this.providers = {
            openai: {
                endpoint: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
                model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-3.5-turbo',
                apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            },
            gemini: {
                // Updated default model to a stable, available one
                model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash',
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            },
            ollama: {
                endpoint: process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT || 'http://localhost:11434/api',
                model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'llama2',
                apiKey: null,
            },
            localai: {
                endpoint: process.env.NEXT_PUBLIC_LOCALAI_ENDPOINT || 'http://localhost:8080/v1',
                model: process.env.NEXT_PUBLIC_LOCALAI_MODEL || 'gpt-3.5-turbo',
                apiKey: process.env.NEXT_PUBLIC_LOCALAI_API_KEY || 'local-key',
            },
        };

        this.currentProvider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.isHealthy = false;
        this.lastHealthCheck = null;

        // Initialize Gemini client if provider is gemini
        if (this.currentProvider === 'gemini' && this.providers.gemini.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.providers.gemini.apiKey);
        }
    }

    // Test connection to AI provider - REQUIRED METHOD
    async testConnection() {
        console.log(`🔍 Testing connection to ${this.currentProvider} provider...`);

        try {
            this.validateConfiguration();

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

                console.log(`✅ ${this.currentProvider} connection successful`);
                return {
                    success: true,
                    provider: this.currentProvider,
                    model: this.providers[this.currentProvider].model,
                    responseTime: result.responseTime,
                    healthy: true,
                    message: 'Connection test successful'
                };
            } else {
                throw new Error(result.error || 'Connection test failed');
            }
        } catch (error) {
            this.isHealthy = false;
            this.lastHealthCheck = new Date().toISOString();

            console.error(`❌ ${this.currentProvider} connection failed:`, error.message);

            return {
                success: false,
                provider: this.currentProvider,
                healthy: false,
                error: error.message,
                message: `Failed to connect to ${this.currentProvider}: ${error.message}`
            };
        }
    }

    // Get health status
    getHealthStatus() {
        return {
            isHealthy: this.isHealthy,
            lastHealthCheck: this.lastHealthCheck,
            provider: this.currentProvider,
            model: this.providers[this.currentProvider]?.model
        };
    }

    // Get current provider configuration with model info
    getCurrentProvider() {
        return {
            provider: this.currentProvider,
            model: this.providers[this.currentProvider]?.model || 'unknown',
            config: this.providers[this.currentProvider]
        };
    }

    // Switch AI provider dynamically with validation
    switchProvider(provider) {
        if (this.providers[provider]) {
            this.currentProvider = provider;
            this.isHealthy = false; // Reset health status when switching
            this.lastHealthCheck = null;

            // Initialize Gemini client if switching to gemini
            if (provider === 'gemini' && this.providers.gemini.apiKey) {
                this.genAI = new GoogleGenerativeAI(this.providers.gemini.apiKey);
            }

            console.log(`Switched to AI provider: ${provider}`);
            return true;
        }
        console.error(`Unsupported AI provider: ${provider}`);
        return false;
    }

    // Validate provider configuration
    validateConfiguration() {
        const provider = this.providers[this.currentProvider];

        if (!provider) {
            throw new Error(`Unsupported AI provider: ${this.currentProvider}`);
        }

        if (this.currentProvider === 'openai' && !provider.apiKey) {
            throw new Error('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY environment variable.');
        }

        if (this.currentProvider === 'gemini' && !provider.apiKey) {
            throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
        }

        if (this.currentProvider === 'gemini' && !this.genAI) {
            this.genAI = new GoogleGenerativeAI(provider.apiKey);
        }

        if (this.currentProvider === 'localai' && !provider.apiKey) {
            console.warn('LocalAI API key not configured. Using default key.');
        }

        return true;
    }

    // Core AI API call with retry logic and multiple provider support
    async callAI(prompt, options = {}) {
        this.validateConfiguration();

        const startTime = Date.now();
        const provider = this.providers[this.currentProvider];

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                let response;
                let parsedResponse;

                if (this.currentProvider === 'gemini') {
                    response = await this.makeGeminiCall(prompt, options, provider);
                    parsedResponse = this.parseGeminiResponse(response);
                } else {
                    const requestData = this.buildRequestData(prompt, options, provider);
                    response = await this.makeAPICall(requestData, provider);
                    parsedResponse = this.parseResponse(response, provider);
                }

                const responseTime = Date.now() - startTime;

                // Log successful AI usage (only if not a connection test)
                if (options.type !== 'connection_test') {
                    await this.logAIUsage({
                        provider: this.currentProvider,
                        type: options.type || 'general',
                        tokensUsed: parsedResponse.usage?.total_tokens || 0,
                        cost: this.calculateCost(parsedResponse.usage?.total_tokens || 0, this.currentProvider),
                        successful: true,
                        responseTime,
                        model: provider.model,
                        prompt: options.logPrompt ? prompt : '[REDACTED]',
                        timestamp: new Date().toISOString()
                    });
                }

                return {
                    success: true,
                    data: parsedResponse.content,
                    usage: parsedResponse.usage,
                    responseTime,
                    provider: this.currentProvider,
                    model: provider.model
                };
            } catch (error) {
                console.error(`AI API attempt ${attempt} failed:`, error);

                if (attempt === this.maxRetries) {
                    // Log failed attempt (only if not a connection test)
                    if (options.type !== 'connection_test') {
                        await this.logAIUsage({
                            provider: this.currentProvider,
                            type: options.type || 'general',
                            tokensUsed: 0,
                            cost: 0,
                            successful: false,
                            responseTime: Date.now() - startTime,
                            model: provider.model,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    }

                    return {
                        success: false,
                        error: `Failed after ${this.maxRetries} attempts: ${error.message}`,
                        provider: this.currentProvider
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // Make Gemini API call
    async makeGeminiCall(prompt, options, provider) {
        const model = this.genAI.getGenerativeModel({
            model: provider.model,
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 2000,
            }
        });

        const promptText = Array.isArray(prompt) ?
            prompt.map(p => p.content).join('\n') :
            prompt;

        const result = await model.generateContent(promptText);
        const response = await result.response;

        return {
            text: response.text(),
            usage: {
                // Gemini doesn't provide detailed token usage in the same way
                total_tokens: 0
            }
        };
    }

    // Parse Gemini response
    parseGeminiResponse(response) {
        return {
            content: response.text,
            usage: response.usage || { total_tokens: 0 }
        };
    }

    // Build request data based on provider (for non-Gemini providers)
    buildRequestData(prompt, options, provider) {
        const baseData = {
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
        };

        switch (this.currentProvider) {
            case 'openai':
            case 'localai':
                return {
                    model: provider.model,
                    messages: Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }],
                    ...baseData
                };
            case 'ollama':
                return {
                    model: provider.model,
                    prompt: Array.isArray(prompt) ? prompt.map(m => m.content).join('\n') : prompt,
                    stream: false,
                    options: {
                        temperature: baseData.temperature,
                        num_predict: baseData.max_tokens
                    }
                };
            default:
                throw new Error(`Unsupported provider: ${this.currentProvider}`);
        }
    }

    // Make API call based on provider (for non-Gemini providers)
    async makeAPICall(requestData, provider) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (provider.apiKey) {
            headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        let endpoint = provider.endpoint;

        switch (this.currentProvider) {
            case 'openai':
            case 'localai':
                endpoint += '/chat/completions';
                break;
            case 'ollama':
                endpoint += '/generate';
                break;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return await response.json();
    }

    // Parse response based on provider (for non-Gemini providers)
    parseResponse(data, provider) {
        switch (this.currentProvider) {
            case 'openai':
            case 'localai':
                return {
                    content: data.choices[0].message.content,
                    usage: data.usage
                };
            case 'ollama':
                return {
                    content: data.response,
                    usage: { total_tokens: 0 } // Ollama doesn't provide token usage
                };
            default:
                throw new Error(`Unsupported provider: ${this.currentProvider}`);
        }
    }

    // Generate test cases from user prompt with enhanced templates
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

    // Enhanced helper methods
    calculateCost(tokens, provider = 'gemini') {
        const costPerToken = {
            openai: 0.0000015, // Updated pricing
            gemini: 0.000001,  // Gemini Pro pricing (approximate)
            localai: 0.0,
            ollama: 0.0
        };
        return tokens * (costPerToken[provider] || 0);
    }

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

    // Enhanced AI metrics with detailed tracking
    async getAIMetrics(dateRange = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

            // Get AI usage logs with error handling
            const [usageResult, generationsResult] = await Promise.all([
                this.firestoreService.queryDocuments('ai_usage_logs').catch(e => ({ success: false, error: e.message })),
                this.firestoreService.queryDocuments('ai_generations').catch(e => ({ success: false, error: e.message }))
            ]);

            const usageLogs = usageResult.success ? usageResult.data : [];
            const generations = generationsResult.success ? generationsResult.data : [];

            // Calculate comprehensive metrics
            const metrics = {
                // Core metrics
                totalAIGenerations: generations.length,
                successfulGenerations: usageLogs.filter(log => log.successful).length,
                failedGenerations: usageLogs.filter(log => !log.successful).length,
                aiSuccessRate: usageLogs.length > 0 ? (usageLogs.filter(log => log.successful).length / usageLogs.length) * 100 : 0,

                // Generation breakdown
                generationsFromUserStories: generations.filter(g => g.type === 'user_story').length,
                generationsFromDocuments: generations.filter(g => g.type === 'document').length,
                generationsFromRequirements: generations.filter(g => g.type === 'requirements').length,
                generationsFromBugs: generations.filter(g => g.type === 'bug_analysis').length,

                // Performance metrics
                avgGenerationTimeSeconds: this.calculateAverageResponseTime(usageLogs),
                avgTestCasesPerGeneration: this.calculateAvgTestCasesPerGeneration(generations),

                // Cost metrics by provider
                openAITokensUsed: this.getTokensByProvider(usageLogs, 'openai'),
                geminiCallsCount: this.getCallsByProvider(usageLogs, 'gemini'),
                ollamaCallsCount: this.getCallsByProvider(usageLogs, 'ollama'),
                localAITokensUsed: this.getTokensByProvider(usageLogs, 'localai'),
                totalAPICallsCount: usageLogs.length,
                aiCostPerTestCase: this.calculateCostPerTestCase(usageLogs, generations),

                // Provider distribution
                providerUsage: this.getProviderUsageStats(usageLogs),

                // Time savings estimation
                estimatedTimeSavedHours: this.calculateTimeSaved(generations),
                productivityIncrease: this.calculateProductivityIncrease(generations, usageLogs)
            };

            return {
                success: true,
                data: metrics,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching AI metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods for metrics calculations
    calculateAverageResponseTime(logs) {
        if (logs.length === 0) return 0;
        const totalTime = logs.reduce((sum, log) => sum + (log.responseTime || 0), 0);
        return Math.round(totalTime / logs.length / 1000);
    }

    calculateAvgTestCasesPerGeneration(generations) {
        if (generations.length === 0) return 0;
        const totalTestCases = generations.reduce((sum, gen) => {
            return sum + (gen.result?.testCases?.length || 0);
        }, 0);
        return Math.round((totalTestCases / generations.length) * 10) / 10;
    }

    calculateCostPerTestCase(logs, generations) {
        const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
        const totalTestCases = generations.reduce((sum, gen) => sum + (gen.result?.testCases?.length || 0), 0);
        return totalTestCases > 0 ? totalCost / totalTestCases : 0;
    }

    getTokensByProvider(logs, provider) {
        return logs
            .filter(log => log.provider === provider)
            .reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
    }

    getCallsByProvider(logs, provider) {
        return logs.filter(log => log.provider === provider).length;
    }

    getProviderUsageStats(logs) {
        const stats = {};
        logs.forEach(log => {
            const provider = log.provider || 'unknown';
            if (!stats[provider]) {
                stats[provider] = { calls: 0, tokens: 0, successRate: 0 };
            }
            stats[provider].calls++;
            stats[provider].tokens += log.tokensUsed || 0;
        });

        // Calculate success rates
        Object.keys(stats).forEach(provider => {
            const providerLogs = logs.filter(log => log.provider === provider);
            const successful = providerLogs.filter(log => log.successful).length;
            stats[provider].successRate = providerLogs.length > 0 ? (successful / providerLogs.length) * 100 : 0;
        });

        return stats;
    }

    calculateTimeSaved(generations) {
        // Estimate: Each generated test case saves ~5 minutes of manual work
        const totalTestCases = generations.reduce((sum, gen) => {
            return sum + (gen.result?.testCases?.length || 0);
        }, 0);
        return Math.round((totalTestCases * 5) / 60 * 10) / 10; // Convert to hours
    }

    calculateProductivityIncrease(generations, logs) {
        // Estimate productivity increase based on successful generations
        const successfulGenerations = logs.filter(log => log.successful).length;
        if (successfulGenerations === 0) return 0;

        // Rough calculation: each successful generation increases productivity by 15%
        return Math.min(successfulGenerations * 0.15, 100); // Cap at 100%
    }
}

const aiServiceInstance = new AIService();
export default aiServiceInstance;