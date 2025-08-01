// services/AIBugService.js - Dedicated service for AI-powered bug report generation
import aiServiceInstance from './aiService';

class AIBugService {
    constructor() {
        this.aiService = aiServiceInstance;
        this.isInitialized = false;
    }

    // Initialize the bug service
    async initialize() {
        try {
            // Test AI service connection
            const healthCheck = await this.aiService.testConnection();
            
            if (healthCheck.success) {
                this.isInitialized = true;
                console.log('✅ AIBugService initialized successfully');
                
                return {
                    success: true,
                    data: {
                        provider: healthCheck.provider,
                        model: healthCheck.model,
                        healthy: healthCheck.healthy
                    }
                };
            } else {
                throw new Error(healthCheck.error || 'Failed to initialize AI service');
            }
        } catch (error) {
            console.error('❌ AIBugService initialization failed:', error);
            this.isInitialized = false;
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Generate bug report from user input
    async generateBugReport(prompt, consoleError = '', additionalContext = {}) {
        if (!this.isInitialized) {
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }
        }

        try {
            console.log('🐛 Generating AI bug report...');

            // Combine prompt and console error
            const combinedInput = this.combineInputs(prompt, consoleError);
            
            // Prepare context for AI
            const context = {
                ...additionalContext,
                hasConsoleError: !!consoleError.trim(),
                timestamp: new Date().toISOString()
            };

            // Call AI service to generate bug report
            const result = await this.aiService.generateBugReport(combinedInput, 'mixed', context);

            if (result.success) {
                // Transform AI response to match component expectations
                const transformedReport = this.transformAIResponse(result.data, prompt, consoleError);
                
                console.log('✅ Bug report generated successfully');
                
                return {
                    success: true,
                    data: transformedReport,
                    generationId: result.analysisId,
                    provider: this.aiService.getCurrentProvider().provider,
                    model: this.aiService.getCurrentProvider().model
                };
            } else {
                throw new Error(result.error || 'Failed to generate bug report');
            }
        } catch (error) {
            console.error('❌ Bug report generation failed:', error);
            
            return {
                success: false,
                error: error.message,
                userMessage: this.getUserFriendlyError(error.message)
            };
        }
    }

    // Combine user prompt and console error into coherent input
    combineInputs(prompt, consoleError) {
        let combinedInput = '';

        if (prompt.trim()) {
            combinedInput += `Issue Description:\n${prompt.trim()}\n\n`;
        }

        if (consoleError.trim()) {
            combinedInput += `Console Error/Stack Trace:\n${consoleError.trim()}\n\n`;
        }

        // Add context about the input format
        combinedInput += 'Please analyze this information and generate a comprehensive bug report with all necessary details for the development team.';

        return combinedInput;
    }

    // Transform AI response to match component expectations
    transformAIResponse(aiData, originalPrompt, consoleError) {
        // Extract key information from AI response
        const title = aiData.title || this.extractTitle(originalPrompt, consoleError);
        const description = aiData.description || originalPrompt.trim() || 'Issue description generated from console error';
        const actualBehavior = aiData.actualBehavior || this.extractActualBehavior(originalPrompt, consoleError);
        const stepsToReproduce = this.formatStepsToReproduce(aiData.stepsToReproduce);
        const expectedBehavior = aiData.expectedBehavior || 'The application should function normally without errors.';
        const severity = aiData.severity || this.determineSeverity(originalPrompt, consoleError);
        const category = this.mapCategoryToComponent(aiData.additionalInfo?.relatedAreas?.[0] || this.determineCategory(originalPrompt, consoleError));

        return {
            title: title.length > 100 ? title.substring(0, 97) + '...' : title,
            description,
            actualBehavior,
            stepsToReproduce,
            expectedBehavior,
            severity,
            category,
            workaround: aiData.workaround || '',
            hasConsoleLogs: !!consoleError.trim(),
            hasNetworkLogs: false,
            // Additional AI-generated fields
            environment: aiData.environment || {},
            tags: aiData.tags || [],
            impact: aiData.impact || '',
            frequency: aiData.additionalInfo?.frequency || 'Unknown',
            reproducible: aiData.reproducible !== false,
            riskAssessment: aiData.riskAssessment || '',
            relatedAreas: aiData.relatedAreas || [],
            suggestedTestCases: aiData.suggestedTestCases || []
        };
    }

    // Format steps to reproduce as a string
    formatStepsToReproduce(steps) {
        if (Array.isArray(steps)) {
            return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
        }
        
        if (typeof steps === 'string') {
            return steps;
        }

        return '1. Navigate to the affected area\n2. Perform the action that triggers the issue\n3. Observe the error or unexpected behavior';
    }

    // Map AI category to component categories
    mapCategoryToComponent(aiCategory) {
        const categoryMap = {
            'UI': 'UI/UX',
            'UX': 'UI/UX',
            'UI/UX': 'UI/UX',
            'API': 'Backend',
            'Backend': 'Backend',
            'Database': 'Backend',
            'Performance': 'Performance',
            'Security': 'Security',
            'Integration': 'Integration',
            'Functional': 'Functional',
            'System': 'Functional'
        };

        return categoryMap[aiCategory] || 'Functional';
    }

    // Fallback methods for when AI doesn't provide specific fields
    extractTitle(prompt, consoleError) {
        // First try to extract from console error
        if (consoleError) {
            const lines = consoleError.split('\n');
            const errorLine = lines.find(line => 
                line.includes('Error:') || 
                line.includes('TypeError:') || 
                line.includes('ReferenceError:') ||
                line.includes('Cannot read property') ||
                line.includes('is not defined')
            );
            
            if (errorLine) {
                const parts = errorLine.split(':');
                if (parts.length >= 2) {
                    return `${parts[0].trim()}: ${parts[1].trim().substring(0, 50)}...`;
                }
            }
        }
        
        // Fall back to prompt
        if (prompt) {
            const firstLine = prompt.split('\n')[0];
            return firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
        }

        return 'Application Issue Detected';
    }

    extractActualBehavior(prompt, consoleError) {
        if (consoleError && (consoleError.includes('Error:') || consoleError.includes('TypeError:') || consoleError.includes('ReferenceError:'))) {
            return 'Application throws an error and functionality is broken.';
        }
        
        if (prompt.toLowerCase().includes('crash') || prompt.toLowerCase().includes('error')) {
            return 'The application encounters an error or crashes.';
        }
        
        return 'The application is not behaving as expected.';
    }

    determineSeverity(prompt, consoleError) {
        const combinedText = `${prompt} ${consoleError}`.toLowerCase();
        
        if (combinedText.includes('critical') || combinedText.includes('crash') || combinedText.includes('data loss')) {
            return 'Critical';
        }
        if (combinedText.includes('error') || combinedText.includes('exception') || combinedText.includes('broken')) {
            return 'High';
        }
        if (combinedText.includes('warning') || combinedText.includes('slow') || combinedText.includes('performance')) {
            return 'Medium';
        }
        return 'Low';
    }

    determineCategory(prompt, consoleError) {
        const combinedText = `${prompt} ${consoleError}`.toLowerCase();
        
        if (combinedText.includes('ui') || combinedText.includes('interface') || combinedText.includes('button') || combinedText.includes('form')) {
            return 'UI/UX';
        }
        if (combinedText.includes('api') || combinedText.includes('network') || combinedText.includes('server') || combinedText.includes('database')) {
            return 'Backend';
        }
        if (combinedText.includes('performance') || combinedText.includes('slow') || combinedText.includes('timeout')) {
            return 'Performance';
        }
        if (combinedText.includes('security') || combinedText.includes('authentication') || combinedText.includes('authorization')) {
            return 'Security';
        }
        return 'Functional';
    }

    // Get user-friendly error messages
    getUserFriendlyError(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('api key') || message.includes('apikey')) {
            return 'AI service requires an API key. Please check your configuration.';
        }
        
        if (message.includes('connection') || message.includes('network')) {
            return 'Unable to connect to AI service. Please check your internet connection.';
        }
        
        if (message.includes('quota') || message.includes('limit')) {
            return 'AI service quota exceeded. Please try again later.';
        }
        
        if (message.includes('provider')) {
            return 'AI provider not configured properly. Please check your settings.';
        }
        
        return 'AI service is currently unavailable. Please try again later.';
    }

    // Test service health
    async testHealth() {
        try {
            const result = await this.aiService.testConnection();
            return {
                success: result.success,
                healthy: result.healthy,
                provider: result.provider,
                model: result.model,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }

    // Get service status
    getServiceStatus() {
        return {
            initialized: this.isInitialized,
            provider: this.aiService.getCurrentProvider().provider,
            model: this.aiService.getCurrentProvider().model,
            healthy: this.aiService.getHealthStatus().isHealthy
        };
    }

    // Switch AI provider
    async switchProvider(provider) {
        try {
            const result = this.aiService.switchProvider(provider);
            if (result) {
                // Re-test connection with new provider
                const healthCheck = await this.aiService.testConnection();
                return {
                    success: healthCheck.success,
                    provider: provider,
                    healthy: healthCheck.healthy,
                    error: healthCheck.error
                };
            } else {
                throw new Error(`Failed to switch to provider: ${provider}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get supported providers
    getSupportedProviders() {
        return [
            { name: 'openai', model: 'gpt-3.5-turbo', configured: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY },
            { name: 'gemini', model: 'gemini-1.5-flash', configured: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY },
            { name: 'ollama', model: 'llama2', configured: true },
            { name: 'localai', model: 'gpt-3.5-turbo', configured: true }
        ];
    }
}

// Create and export singleton instance
const aiBugServiceInstance = new AIBugService();
export default aiBugServiceInstance;