// services/aiService.js - Fixed version with proper environment variable support
import { FirestoreService } from '../services';
import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
    constructor() {
        this.firestoreService = new FirestoreService();
        
        // Gemini model configurations
        this.models = {
            'gemini-2.0-flash-lite': {
                name: 'Gemini 2.0 Flash',
                displayName: 'Flash (Fast & Cost-Effective)',
                costPer1kTokens: 0.00015,
                maxTokens: 8192,
                description: 'Best for quick responses and high-volume tasks',
                recommended: true
            },
            'gemini-1.5-pro': {
                name: 'Gemini 1.5 Pro',
                displayName: 'Pro (Advanced Reasoning)',
                costPer1kTokens: 0.00125,
                maxTokens: 8192,
                description: 'Best for complex analysis and detailed insights'
            },
            'gemini-pro': {
                name: 'Gemini Pro',
                displayName: 'Pro (Standard)',
                costPer1kTokens: 0.0005,
                maxTokens: 4096,
                description: 'Balanced performance for general tasks'
            },
            'gemini-pro-vision': {
                name: 'Gemini Pro Vision',
                displayName: 'Pro Vision (Image Support)',
                costPer1kTokens: 0.00025,
                maxTokens: 4096,
                description: 'For analyzing screenshots and visual content'
            }
        };

        // Get API key - support both client and server-side
        this.apiKey = this.getApiKey();
        
        // Get initial model from environment or use default
        const envModel = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL;
        this.currentModel = envModel && this.models[envModel] 
            ? envModel 
            : 'gemini-2.0-flash-lite'; // Default model
        
        this.temperature = 0.7;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Health status
        this.isHealthy = false;
        this.lastHealthCheck = null;
        this.initializationError = null;
        
        // Gemini client
        this.genAI = null;
        
        // Initialize if API key is available
        if (this.apiKey) {
            this.initializeClient();
        } else {
            console.warn('⚠️ Gemini API key not found. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY');
            this.initializationError = 'API key not configured';
        }
    }

    // Get API key from environment - supports both client and server-side
    getApiKey() {
        // Try client-side first (NEXT_PUBLIC_)
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        }
        
        // Try server-side (without NEXT_PUBLIC_)
        if (process.env.GEMINI_API_KEY) {
            return process.env.GEMINI_API_KEY;
        }
        
        // Fallback to NEXT_PUBLIC_ on server
        return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    }

    // Initialize Gemini client
    initializeClient() {
        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            console.log(`✅ Gemini client initialized with model: ${this.currentModel}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize Gemini client:', error);
            this.initializationError = error.message;
            return false;
        }
    }

    // Switch between Gemini models
    switchModel(modelName) {
        if (!this.models[modelName]) {
            console.error(`Invalid model: ${modelName}`);
            return {
                success: false,
                error: `Model ${modelName} not found. Available models: ${Object.keys(this.models).join(', ')}`
            };
        }

        const previousModel = this.currentModel;
        this.currentModel = modelName;
        
        console.log(`🔄 Switched from ${previousModel} to ${modelName}`);
        
        return {
            success: true,
            previousModel,
            currentModel: this.currentModel,
            modelInfo: this.models[modelName]
        };
    }

    // Get available models
    getAvailableModels() {
        return Object.entries(this.models).map(([key, value]) => ({
            id: key,
            ...value,
            isActive: key === this.currentModel
        }));
    }

    // Get current model info
    getCurrentModelInfo() {
        return {
            model: this.currentModel,
            ...this.models[this.currentModel],
            apiKeyConfigured: !!this.apiKey,
            isHealthy: this.isHealthy,
            lastHealthCheck: this.lastHealthCheck
        };
    }

    // Test connection to Gemini
    async testConnection() {
        console.log(`Testing Gemini connection with ${this.currentModel}...`);

        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
            }

            if (!this.genAI) {
                this.initializeClient();
            }

            const testPrompt = "Respond with exactly: 'Connection successful'";
            const result = await this.callAI(testPrompt, {
                type: 'connection_test',
                temperature: 0.1,
                maxTokens: 20,
                logPrompt: false
            });

            if (result.success) {
                this.isHealthy = true;
                this.lastHealthCheck = new Date().toISOString();
                this.initializationError = null;

                console.log('✅ Gemini connection successful');
                return {
                    success: true,
                    provider: 'gemini',
                    model: this.currentModel,
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
            this.initializationError = error.message;

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
            model: this.currentModel,
            modelInfo: this.models[this.currentModel],
            error: this.initializationError
        };
    }

    // Get service status (alias for compatibility)
    getServiceStatus() {
        return {
            initialized: this.isHealthy,
            healthy: this.isHealthy,
            provider: 'gemini',
            model: this.currentModel,
            lastHealthCheck: this.lastHealthCheck,
            error: this.initializationError
        };
    }

    // Core AI API call with retry logic
    async callAI(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        if (!this.genAI) {
            this.initializeClient();
        }

        const startTime = Date.now();
        const modelToUse = options.model || this.currentModel;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: modelToUse,
                    generationConfig: {
                        temperature: options.temperature ?? this.temperature,
                        maxOutputTokens: options.maxTokens || this.models[modelToUse]?.maxTokens || 4096,
                    }
                });

                const promptText = Array.isArray(prompt) 
                    ? prompt.map(p => p.content || p).join('\n') 
                    : prompt;

                const result = await model.generateContent(promptText);
                const response = await result.response;
                const text = response.text();

                const responseTime = Date.now() - startTime;
                const estimatedTokens = this.estimateTokens(promptText + text);

                // Log successful AI usage (except for connection tests)
                if (options.type !== 'connection_test') {
                    await this.logAIUsage({
                        provider: 'gemini',
                        model: modelToUse,
                        type: options.type || 'general',
                        tokensUsed: estimatedTokens,
                        cost: this.calculateCost(estimatedTokens, modelToUse),
                        successful: true,
                        responseTime,
                        prompt: options.logPrompt ? promptText : '[REDACTED]',
                        timestamp: new Date().toISOString()
                    });
                }

                return {
                    success: true,
                    data: text,
                    usage: { 
                        total_tokens: estimatedTokens,
                        estimated: true 
                    },
                    responseTime,
                    provider: 'gemini',
                    model: modelToUse
                };
            } catch (error) {
                console.error(`AI API attempt ${attempt} failed:`, error);

                if (attempt === this.maxRetries) {
                    // Log failed attempt
                    if (options.type !== 'connection_test') {
                        await this.logAIUsage({
                            provider: 'gemini',
                            model: modelToUse,
                            type: options.type || 'general',
                            tokensUsed: 0,
                            cost: 0,
                            successful: false,
                            responseTime: Date.now() - startTime,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    }

                    return {
                        success: false,
                        error: `Failed after ${this.maxRetries} attempts: ${error.message}`,
                        provider: 'gemini',
                        model: modelToUse
                    };
                }

                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // Generate test cases from user prompt
    async generateTestCases(prompt, templateConfig = {}) {
        const systemPrompt = this.buildTestCasePrompt(prompt, templateConfig);
        const modelToUse = templateConfig.useAdvancedModel ? 'gemini-1.5-pro' : this.currentModel;

        const result = await this.callAI(systemPrompt, {
            type: 'test_generation',
            temperature: 0.6,
            maxTokens: 4000,
            model: modelToUse
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);

                const docResult = await this.firestoreService.createDocument('ai_generations', {
                    type: 'test_cases',
                    prompt,
                    templateConfig,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, modelToUse),
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
                    model: result.model,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, modelToUse)
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
        return `You are an expert QA engineer with extensive experience in test case design and quality assurance. Generate comprehensive test cases based on the given requirements.

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

Focus on creating realistic, executable test cases that provide comprehensive coverage while being practical for implementation.`;
    }

    // Generate comprehensive bug report with AI enhancement
    async generateBugReport(input, type = 'description', additionalContext = {}) {
        const systemPrompt = this.buildBugReportPrompt(input, type, additionalContext);
        const modelToUse = additionalContext.useAdvancedModel ? 'gemini-1.5-pro' : this.currentModel;

        const result = await this.callAI(systemPrompt, {
            type: 'bug_analysis',
            temperature: 0.5,
            maxTokens: 3000,
            model: modelToUse
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);

                const docResult = await this.firestoreService.createDocument('ai_bug_analysis', {
                    input,
                    inputType: type,
                    additionalContext,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, modelToUse),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    analysisId: docResult.success ? docResult.docId : null,
                    provider: result.provider,
                    model: result.model,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, modelToUse)
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
        return `You are an expert QA engineer and bug analyst. Create a comprehensive, actionable bug report based on the provided information.

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

Analyze the information thoroughly and provide actionable insights for the QA team.`;
    }

    // Grammar and document checking
    async checkGrammar(text, options = {}) {
        const prompt = `You are an expert technical writer and grammar checker. Review the following text for grammar, spelling, clarity, and technical accuracy.

Text to review:
${text}

Provide a detailed review in JSON format:
{
    "overallScore": 0-100,
    "issues": [
        {
            "type": "grammar|spelling|clarity|style|technical",
            "severity": "error|warning|suggestion",
            "line": 1,
            "original": "text with issue",
            "suggestion": "corrected text",
            "explanation": "why this is an issue",
            "position": { "start": 0, "end": 10 }
        }
    ],
    "summary": {
        "totalIssues": 0,
        "errors": 0,
        "warnings": 0,
        "suggestions": 0
    },
    "improvements": [
        "General improvement suggestion 1",
        "General improvement suggestion 2"
    ],
    "correctedText": "fully corrected version of the text"
}

Focus on: ${options.focus || 'grammar, spelling, clarity, and technical accuracy'}`;

        const result = await this.callAI(prompt, {
            type: 'grammar_check',
            temperature: 0.3,
            maxTokens: 3000
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);
                
                await this.firestoreService.createDocument('ai_grammar_checks', {
                    originalText: text,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, this.currentModel),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse grammar check results',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Generate improvement suggestions for team performance
    async generateTeamImprovements(teamData) {
        const prompt = `You are an expert QA consultant. Analyze this team's performance data and provide actionable improvement suggestions.

Team Performance Data:
${JSON.stringify(teamData, null, 2)}

Generate comprehensive improvement suggestions in JSON format:
{
    "overallAssessment": {
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "score": 0-100,
        "trend": "improving|declining|stable"
    },
    "recommendations": [
        {
            "category": "process|tools|training|automation|communication",
            "priority": "critical|high|medium|low",
            "title": "Short recommendation title",
            "description": "Detailed explanation",
            "expectedImpact": "Description of expected improvement",
            "implementationSteps": ["Step 1", "Step 2"],
            "estimatedEffort": "low|medium|high",
            "estimatedTimeframe": "1-2 weeks|1-3 months|3-6 months"
        }
    ],
    "metrics": {
        "currentProductivity": 0-100,
        "potentialProductivity": 0-100,
        "qualityScore": 0-100,
        "automationOpportunities": 0-100
    },
    "quickWins": [
        "Quick improvement 1",
        "Quick improvement 2"
    ]
}`;

        const result = await this.callAI(prompt, {
            type: 'team_improvement',
            temperature: 0.6,
            maxTokens: 3000,
            model: 'gemini-1.5-pro'
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);
                
                await this.firestoreService.createDocument('ai_team_improvements', {
                    teamData,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, result.model),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse improvement suggestions',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Auto-detect automatable test cases
    async detectAutomationOpportunities(testCases) {
        const prompt = `You are an expert test automation architect. Analyze these test cases and identify automation opportunities.

Test Cases:
${JSON.stringify(testCases, null, 2)}

Generate automation analysis in JSON format:
{
    "summary": {
        "totalTestCases": 0,
        "highAutomationPotential": 0,
        "mediumAutomationPotential": 0,
        "lowAutomationPotential": 0,
        "notRecommended": 0
    },
    "automationAnalysis": [
        {
            "testCaseId": "test_id",
            "testCaseTitle": "test title",
            "automationPotential": "high|medium|low|not-recommended",
            "automationScore": 0-100,
            "reasoning": "Why this test should/shouldn't be automated",
            "recommendedFramework": "Selenium|Cypress|Playwright|Jest|Pytest|etc",
            "complexity": "simple|moderate|complex",
            "estimatedEffort": "low|medium|high",
            "priority": "critical|high|medium|low",
            "benefits": ["benefit 1", "benefit 2"],
            "challenges": ["challenge 1", "challenge 2"],
            "implementationApproach": "Step-by-step approach"
        }
    ],
    "recommendations": {
        "automationStrategy": "Recommended overall strategy",
        "priorityOrder": ["test_id_1", "test_id_2"],
        "toolRecommendations": ["tool 1", "tool 2"],
        "estimatedROI": "Description of ROI"
    }
}`;

        const result = await this.callAI(prompt, {
            type: 'automation_detection',
            temperature: 0.5,
            maxTokens: 4000,
            model: 'gemini-1.5-pro'
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);
                
                await this.firestoreService.createDocument('ai_automation_analysis', {
                    testCases,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, result.model),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse automation analysis',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Generate comprehensive QA reports
    async generateQAReport(reportData, reportType = 'sprint') {
        const prompt = `You are an expert QA manager. Generate a comprehensive ${reportType} report based on this data.

Report Data:
${JSON.stringify(reportData, null, 2)}

Generate a detailed report in JSON format:
{
    "title": "Report title",
    "period": "Time period covered",
    "executiveSummary": "High-level summary for stakeholders",
    "keyMetrics": {
        "totalTests": 0,
        "passRate": 0.0,
        "failRate": 0.0,
        "blockedTests": 0,
        "defectsFound": 0,
        "criticalDefects": 0,
        "testCoverage": 0.0
    },
    "sections": [
        {
            "title": "Section title",
            "content": "Section content",
            "charts": [
                {
                    "type": "bar|line|pie",
                    "title": "Chart title",
                    "data": {}
                }
            ]
        }
    ],
    "achievements": [
        "Achievement 1",
        "Achievement 2"
    ],
    "concerns": [
        {
            "issue": "Issue description",
            "severity": "critical|high|medium|low",
            "recommendation": "How to address"
        }
    ],
    "recommendations": [
        "Recommendation 1",
        "Recommendation 2"
    ],
    "nextSteps": [
        "Next step 1",
        "Next step 2"
    ]
}`;

        const result = await this.callAI(prompt, {
            type: 'qa_report_generation',
            temperature: 0.5,
            maxTokens: 4000,
            model: 'gemini-1.5-pro'
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);
                
                await this.firestoreService.createDocument('ai_qa_reports', {
                    reportType,
                    reportData,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, result.model),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse QA report',
                    rawResponse: result.data
                };
            }
        }

        return result;
    }

    // Generate test documentation
    async generateDocumentation(content, docType = 'test_plan') {
        const prompt = `You are an expert technical writer specializing in QA documentation. Generate professional ${docType} documentation.

Content/Requirements:
${content}

Generate comprehensive documentation in JSON format:
{
    "title": "Document title",
    "version": "1.0",
    "sections": [
        {
            "heading": "Section heading",
            "content": "Section content with proper formatting",
            "subsections": [
                {
                    "heading": "Subsection heading",
                    "content": "Subsection content"
                }
            ]
        }
    ],
    "tables": [
        {
            "title": "Table title",
            "headers": ["Column 1", "Column 2"],
            "rows": [
                ["Data 1", "Data 2"]
            ]
        }
    ],
    "appendices": [
        {
            "title": "Appendix title",
            "content": "Appendix content"
        }
    ],
    "metadata": {
        "author": "AI Assistant",
        "lastUpdated": "${new Date().toISOString()}",
        "status": "draft",
        "reviewers": []
    }
}

Include: Introduction, Scope, Test Approach, Test Environment, Test Schedule, Deliverables, Entry/Exit Criteria, Risks, and Approvals sections as appropriate for ${docType}.`;

        const result = await this.callAI(prompt, {
            type: 'documentation_generation',
            temperature: 0.4,
            maxTokens: 4000
        });

        if (result.success) {
            try {
                const parsedData = this.parseJSONResponse(result.data);
                
                await this.firestoreService.createDocument('ai_documentation', {
                    docType,
                    content,
                    result: parsedData,
                    tokensUsed: result.usage?.total_tokens || 0,
                    cost: this.calculateCost(result.usage?.total_tokens || 0, this.currentModel),
                    provider: result.provider,
                    model: result.model,
                    timestamp: new Date().toISOString()
                });

                return {
                    success: true,
                    data: parsedData,
                    provider: result.provider,
                    model: result.model
                };
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to parse documentation',
                    rawResponse: result.data
                };
            }
        }

        return result;
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

    // Estimate token count (rough estimation)
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for English text
        return Math.ceil(text.length / 4);
    }

    // Calculate cost based on tokens and model
    calculateCost(tokens, model = null) {
        const modelToUse = model || this.currentModel;
        const costPer1k = this.models[modelToUse]?.costPer1kTokens || 0.0001;
        return (tokens / 1000) * costPer1k;
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

        // Cost calculations
        const totalCost = usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
        const totalTokens = usageLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);

        // Model usage breakdown
        const modelUsage = {};
        usageLogs.forEach(log => {
            const model = log.model || 'unknown';
            modelUsage[model] = (modelUsage[model] || 0) + 1;
        });

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
            totalCost: totalCost.toFixed(4),
            totalTokensUsed: totalTokens,
            modelUsageBreakdown: modelUsage,
            currentModel: this.currentModel,
            availableModels: Object.keys(this.models),
            lastUpdated: new Date().toISOString(),
            dateRange,
            provider: 'gemini'
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
                        version: '2.0',
                        provider: 'gemini',
                        currentModel: this.currentModel
                    },
                    metrics,
                    modelComparison: this.getAvailableModels(),
                    summary: {
                        totalGenerations: metrics.totalAIGenerations,
                        successRate: `${metrics.aiSuccessRate.toFixed(2)}%`,
                        timeSaved: `${metrics.estimatedTimeSavedHours} hours`,
                        totalCost: `${metrics.totalCost}`,
                        costPerGeneration: metrics.totalAIGenerations > 0 
                            ? `${(parseFloat(metrics.totalCost) / metrics.totalAIGenerations).toFixed(4)}`
                            : '$0'
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
                    ['Current Model', this.currentModel, this.models[this.currentModel]?.displayName],
                    ['Total AI Generations', metrics.totalAIGenerations, 'Total number of AI-powered generations'],
                    ['Success Rate', `${metrics.aiSuccessRate.toFixed(2)}%`, 'Percentage of successful AI calls'],
                    ['Average Generation Time', `${metrics.avgGenerationTimeSeconds}s`, 'Average time per generation'],
                    ['Total API Calls', metrics.totalAPICallsCount, 'Total API calls to Gemini'],
                    ['Total Tokens Used', metrics.totalTokensUsed, 'Total tokens consumed'],
                    ['Total Cost', `${metrics.totalCost}`, 'Total API cost'],
                    ['Functional Tests Generated', metrics.functionalTestsGenerated, 'Number of functional test cases'],
                    ['Time Saved', `${metrics.estimatedTimeSavedHours}h`, 'Estimated manual work time saved'],
                    ['', '', ''],
                    ['Model', 'Usage Count', 'Cost Per 1K Tokens'],
                    ...Object.entries(metrics.modelUsageBreakdown).map(([model, count]) => 
                        [model, count, `${this.models[model]?.costPer1kTokens || 0}`]
                    )
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
            totalCost: '0.0000',
            totalTokensUsed: 0,
            modelUsageBreakdown: {},
            currentModel: this.currentModel,
            availableModels: Object.keys(this.models),
            lastUpdated: new Date().toISOString(),
            provider: 'gemini'
        };
    }

    // Compatibility methods for existing integrations
    async testHealth() {
        return await this.testConnection();
    }

    getCurrentProvider() {
        return {
            provider: 'gemini',
            model: this.currentModel,
            config: {
                model: this.currentModel,
                apiKey: this.apiKey ? '***configured***' : 'not configured',
                temperature: this.temperature,
                maxTokens: this.models[this.currentModel]?.maxTokens
            }
        };
    }

    getSupportedProviders() {
        return [{
            name: 'gemini',
            models: this.getAvailableModels(),
            currentModel: this.currentModel
        }];
    }

    // Model performance comparison helper
    getModelComparison() {
        return Object.entries(this.models).map(([key, model]) => ({
            id: key,
            name: model.displayName,
            costPer1kTokens: model.costPer1kTokens,
            maxTokens: model.maxTokens,
            description: model.description,
            recommended: model.recommended || false,
            isActive: key === this.currentModel,
            estimatedCostFor10kTokens: (model.costPer1kTokens * 10).toFixed(4)
        }));
    }

    // Update configuration
    updateConfig(config) {
        if (config.model && this.models[config.model]) {
            this.switchModel(config.model);
        }

        if (config.temperature !== undefined) {
            this.temperature = Math.max(0, Math.min(2, config.temperature));
        }

        return {
            success: true,
            currentConfig: {
                model: this.currentModel,
                temperature: this.temperature,
                apiKeyConfigured: !!this.apiKey
            }
        };
    }
}

const aiServiceInstance = new AIService();
export default aiServiceInstance;