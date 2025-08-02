// services/AITestCaseService.js - Extended AI service specifically for test case operations
import aiServiceInstance from './aiService';

export class AITestCaseService {
    constructor() {
        this.aiService = aiServiceInstance;
        this.initialized = false;
        this.generationStats = {
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            totalTestCasesGenerated: 0,
            lastGeneration: null,
            isHealthy: false
        };
    }

    // Initialize the service and test connection
    async initialize() {
        console.log('🚀 Initializing AITestCaseService...');
        
        try {
            // Test connection to the AI service
            const connectionTest = await this.aiService.testConnection();
            
            if (connectionTest.success) {
                this.initialized = true;
                this.generationStats.isHealthy = true;
                
                console.log('✅ AITestCaseService initialized successfully');
                return {
                    success: true,
                    data: {
                        aiService: this.aiService,
                        provider: connectionTest.provider,
                        model: connectionTest.model,
                        healthy: true
                    }
                };
            } else {
                throw new Error(connectionTest.error || connectionTest.message || 'Connection test failed');
            }
        } catch (error) {
            this.initialized = false;
            this.generationStats.isHealthy = false;
            
            console.error('❌ AITestCaseService initialization failed:', error);
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyErrorMessage(error)
            };
        }
    }

    // Get user-friendly error messages
    getUserFriendlyErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('api key') || message.includes('apikey')) {
            return 'AI service requires an API key. Please check your environment configuration.';
        }
        
        if (message.includes('connection') || message.includes('network')) {
            return 'Unable to connect to AI service. Please check your internet connection and API configuration.';
        }
        
        if (message.includes('provider')) {
            return 'AI provider not configured properly. Please set NEXT_PUBLIC_AI_PROVIDER environment variable.';
        }
        
        if (message.includes('quota') || message.includes('limit')) {
            return 'AI service quota exceeded. Please check your usage limits or try again later.';
        }
        
        return 'AI service is currently unavailable. Please try again later.';
    }

    // Generate test cases from document content
    async generateTestCases(documentContent, documentTitle, templateConfig = {}) {
        if (!this.initialized) {
            return {
                success: false,
                error: 'AITestCaseService not initialized',
                userMessage: 'Please initialize the AI service first'
            };
        }

        try {
            console.log('📝 Generating test cases for:', documentTitle);
            
            // Build the prompt for test case generation
            const prompt = this.buildTestCasePrompt(documentContent, documentTitle, templateConfig);
            
            // Call the AI service
            const result = await this.aiService.generateTestCases(prompt, templateConfig);
            
            // Update generation stats
            this.updateGenerationStats(result);
            
            if (result.success) {
                console.log(`✅ Generated ${result.data?.testCases?.length || 0} test cases`);
                
                return {
                    success: true,
                    data: result.data,
                    generationId: result.generationId,
                    provider: result.provider,
                    model: result.model,
                    metadata: {
                        documentTitle,
                        generatedAt: new Date().toISOString(),
                        templateConfig,
                        testCaseCount: result.data?.testCases?.length || 0
                    }
                };
            } else {
                throw new Error(result.error || 'Failed to generate test cases');
            }
        } catch (error) {
            console.error('❌ Test case generation failed:', error);
            
            // Update stats for failed generation
            this.generationStats.failedGenerations++;
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyErrorMessage(error)
            };
        }
    }

    // Build enhanced prompt for test case generation
    buildTestCasePrompt(documentContent, documentTitle, templateConfig) {
        const context = `
Document Title: ${documentTitle}
Document Content: ${documentContent}
`;

        const instructions = `
Based on the provided document, generate comprehensive test cases that cover:
1. Functional requirements and user flows
2. Edge cases and boundary conditions
3. Error handling scenarios
4. Integration points
5. User experience validation

Template Configuration Applied:
- Format: ${templateConfig.format || 'Given-When-Then'}
- Priority Focus: ${templateConfig.priorities || 'Critical, High, Medium, Low'}
- Test Types: ${templateConfig.types || 'Functional, Integration, Edge Case, Negative'}
- Include Test Data: ${templateConfig.includeTestData ? 'Yes' : 'No'}
- Framework: ${templateConfig.framework || 'Generic'}
- Coverage Level: ${templateConfig.coverage || 'Standard'}

Generate practical, executable test cases that provide comprehensive coverage while being realistic for implementation.
`;

        return context + instructions;
    }

    // Update generation statistics
    updateGenerationStats(result) {
        this.generationStats.totalGenerations++;
        this.generationStats.lastGeneration = new Date().toISOString();
        
        if (result.success) {
            this.generationStats.successfulGenerations++;
            this.generationStats.totalTestCasesGenerated += result.data?.testCases?.length || 0;
            this.generationStats.isHealthy = true;
        } else {
            this.generationStats.failedGenerations++;
            // Don't immediately mark as unhealthy on single failure
            if (this.generationStats.failedGenerations > this.generationStats.successfulGenerations) {
                this.generationStats.isHealthy = false;
            }
        }
    }

    // Get generation statistics
    getGenerationStats() {
        const successRate = this.generationStats.totalGenerations > 0 
            ? (this.generationStats.successfulGenerations / this.generationStats.totalGenerations) * 100 
            : 0;

        return {
            ...this.generationStats,
            successRate: Math.round(successRate * 100) / 100,
            avgTestCasesPerGeneration: this.generationStats.successfulGenerations > 0 
                ? Math.round((this.generationStats.totalTestCasesGenerated / this.generationStats.successfulGenerations) * 10) / 10 
                : 0
        };
    }

    // Get current AI service status
    getServiceStatus() {
        return {
            initialized: this.initialized,
            healthy: this.generationStats.isHealthy,
            provider: this.aiService.currentProvider,
            model: this.aiService.providers[this.aiService.currentProvider]?.model,
            lastHealthCheck: this.aiService.lastHealthCheck,
            stats: this.getGenerationStats()
        };
    }

    // Test AI service health
    async testHealth() {
        try {
            const result = await this.aiService.testConnection();
            this.generationStats.isHealthy = result.success;
            return result;
        } catch (error) {
            this.generationStats.isHealthy = false;
            return {
                success: false,
                error: error.message,
                healthy: false
            };
        }
    }

    // Switch AI provider
    async switchProvider(provider) {
        try {
            const switched = this.aiService.switchProvider(provider);
            
            if (switched) {
                // Test the new provider
                const healthTest = await this.testHealth();
                
                if (healthTest.success) {
                    console.log(`✅ Successfully switched to ${provider}`);
                    return {
                        success: true,
                        provider: provider,
                        healthy: true
                    };
                } else {
                    throw new Error(`Provider ${provider} is not healthy: ${healthTest.error}`);
                }
            } else {
                throw new Error(`Failed to switch to provider: ${provider}`);
            }
        } catch (error) {
            console.error(`❌ Provider switch failed:`, error);
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyErrorMessage(error)
            };
        }
    }

    // Update AI settings
    updateSettings(newSettings) {
        if (newSettings.provider && newSettings.provider !== this.aiService.currentProvider) {
            return this.switchProvider(newSettings.provider);
        }

        // Update other settings if needed
        if (newSettings.temperature) {
            this.defaultTemperature = newSettings.temperature;
        }
        
        if (newSettings.maxTokens) {
            this.defaultMaxTokens = newSettings.maxTokens;
        }

        return {
            success: true,
            message: 'Settings updated successfully'
        };
    }

    // Generate bug report using AI
    async generateBugReport(bugDescription, additionalContext = {}) {
        if (!this.initialized) {
            return {
                success: false,
                error: 'AITestCaseService not initialized'
            };
        }

        try {
            const result = await this.aiService.generateBugReport(
                bugDescription, 
                'description', 
                additionalContext
            );

            if (result.success) {
                console.log('✅ Bug report generated successfully');
            }

            return result;
        } catch (error) {
            console.error('❌ Bug report generation failed:', error);
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyErrorMessage(error)
            };
        }
    }

    // Get AI metrics and analytics
    async getMetrics(dateRange = 30) {
        try {
            const metrics = await this.aiService.getAIMetrics(dateRange);
            
            // Add service-specific metrics
            if (metrics.success) {
                metrics.data.serviceStats = this.getGenerationStats();
                metrics.data.serviceStatus = this.getServiceStatus();
            }

            return metrics;
        } catch (error) {
            console.error('❌ Failed to get AI metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Clear all statistics (useful for testing or reset)
    clearStats() {
        this.generationStats = {
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            totalTestCasesGenerated: 0,
            lastGeneration: null,
            isHealthy: false
        };
    }

    // Get supported providers
    getSupportedProviders() {
        return Object.keys(this.aiService.providers).map(provider => ({
            name: provider,
            model: this.aiService.providers[provider].model,
            configured: this.isProviderConfigured(provider)
        }));
    }

    // Check if a provider is properly configured
    isProviderConfigured(provider) {
        const providerConfig = this.aiService.providers[provider];
        
        if (!providerConfig) return false;
        
        // OpenAI requires API key
        if (provider === 'openai') {
            return !!providerConfig.apiKey;
        }
        
        // LocalAI might require API key
        if (provider === 'localai') {
            return !!providerConfig.apiKey;
        }
        
        // Ollama doesn't require API key, just endpoint
        if (provider === 'ollama') {
            return !!providerConfig.endpoint;
        }
        
        return true;
    }

    // Validate current configuration
    validateConfiguration() {
        try {
            this.aiService.validateConfiguration();
            return {
                success: true,
                valid: true,
                provider: this.aiService.currentProvider
            };
        } catch (error) {
            return {
                success: false,
                valid: false,
                error: error.message,
                userMessage: this.getUserFriendlyErrorMessage(error)
            };
        }
    }
}