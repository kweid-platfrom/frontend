/* eslint-disable @typescript-eslint/no-unused-vars */
// slices/aiSlice.js - Fixed AI slice with proper service integration
import React from 'react'; // Add this import
import { AITestCaseService } from '../../services/AITestCaseService';

// Initial AI state
const initialAIState = {
    isInitialized: false,
    isGenerating: false,
    loading: false,
    error: null,
    serviceInstance: null,
    settings: {
        provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai',
        temperature: 0.7,
        maxTokens: 3000,
        includeTestData: true,
        framework: 'Generic'
    },
    lastGeneration: null,
    generationHistory: [],
    metrics: null
};

// AI Actions
const aiActions = {
    // Initialize AI service
    initializeAI: () => async () => {
        console.log('🔄 Initializing AI service...');
        
        try {
            const aiService = new AITestCaseService();
            const result = await aiService.initialize();
            
            if (result.success) {
                console.log('✅ AI service initialized successfully');
                return {
                    success: true,
                    data: {
                        aiService: aiService,
                        provider: result.data.provider,
                        model: result.data.model,
                        healthy: result.data.healthy
                    }
                };
            } else {
                console.error('❌ AI initialization failed:', result.error);
                throw new Error(result.error || result.userMessage || 'AI initialization failed');
            }
        } catch (error) {
            console.error('❌ AI initialization error:', error);
            throw error;
        }
    },

    // Update AI settings
    updateSettings: (currentAIState) => (newSettings) => {
        console.log('🔧 Updating AI settings:', newSettings);
        
        // This is a synchronous state update
        return {
            ...currentAIState,
            settings: {
                ...currentAIState.settings,
                ...newSettings
            },
            error: newSettings.error || currentAIState.error,
            isInitialized: newSettings.isInitialized !== undefined ? newSettings.isInitialized : currentAIState.isInitialized,
            serviceInstance: newSettings.serviceInstance !== undefined ? newSettings.serviceInstance : currentAIState.serviceInstance
        };
    },

    // Generate test cases with AI
    generateTestCases: (currentAIState) => async (documentContent, documentTitle, templateConfig = {}) => {
        if (!currentAIState.serviceInstance) {
            console.error('❌ AI service not available');
            return {
                success: false,
                error: 'AI service not initialized',
                userMessage: 'Please initialize the AI service first'
            };
        }

        console.log('🚀 Starting AI test case generation...');
        
        try {
            // Merge settings with template config
            const mergedConfig = {
                ...currentAIState.settings,
                ...templateConfig
            };

            const result = await currentAIState.serviceInstance.generateTestCases(
                documentContent,
                documentTitle,
                mergedConfig
            );

            if (result.success) {
                console.log(`✅ Generated ${result.data?.testCases?.length || 0} test cases`);
                
                // Update generation history
                const generationRecord = {
                    id: result.generationId || `gen_${Date.now()}`,
                    documentTitle,
                    testCaseCount: result.data?.testCases?.length || 0,
                    generatedAt: new Date().toISOString(),
                    provider: result.provider,
                    model: result.model,
                    success: true
                };

                return {
                    ...result,
                    generationRecord
                };
            } else {
                console.error('❌ Test case generation failed:', result.error);
                return result;
            }
        } catch (error) {
            console.error('❌ Test case generation error:', error);
            return {
                success: false,
                error: error.message,
                userMessage: 'Failed to generate test cases. Please try again.'
            };
        }
    },

    // Get generation statistics
    getGenerationStats: () => () => {
        // This returns a function that can be called to get current stats
        return {
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            successRate: 0,
            isHealthy: false,
            lastGeneration: null
        };
    },

    // Switch AI provider
    switchProvider: (currentAIState) => async (provider) => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                error: 'AI service not initialized'
            };
        }

        try {
            console.log(`🔄 Switching to provider: ${provider}`);
            const result = await currentAIState.serviceInstance.switchProvider(provider);
            
            if (result.success) {
                console.log(`✅ Successfully switched to ${provider}`);
            }
            
            return result;
        } catch (error) {
            console.error(`❌ Provider switch failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Test AI service health
    testHealth: (currentAIState) => async () => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                error: 'AI service not initialized',
                healthy: false
            };
        }

        try {
            const result = await currentAIState.serviceInstance.testHealth();
            console.log('🏥 AI health check:', result.success ? '✅ Healthy' : '❌ Unhealthy');
            return result;
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return {
                success: false,
                error: error.message,
                healthy: false
            };
        }
    },

    // Get AI metrics
    getMetrics: (currentAIState) => async (dateRange = 30) => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                error: 'AI service not initialized'
            };
        }

        try {
            const metrics = await currentAIState.serviceInstance.getMetrics(dateRange);
            console.log('📊 AI metrics retrieved:', metrics.success ? '✅ Success' : '❌ Failed');
            return metrics;
        } catch (error) {
            console.error('❌ Failed to get AI metrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Generate bug report
    generateBugReport: (currentAIState) => async (bugDescription, additionalContext = {}) => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                error: 'AI service not initialized'
            };
        }

        try {
            console.log('🐛 Generating AI bug report...');
            const result = await currentAIState.serviceInstance.generateBugReport(bugDescription, additionalContext);
            
            if (result.success) {
                console.log('✅ Bug report generated successfully');
            }
            
            return result;
        } catch (error) {
            console.error('❌ Bug report generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get service status
    getServiceStatus: (currentAIState) => () => {
        if (!currentAIState.serviceInstance) {
            return {
                initialized: false,
                healthy: false,
                provider: currentAIState.settings.provider,
                error: 'Service not initialized'
            };
        }

        return currentAIState.serviceInstance.getServiceStatus();
    },

    // Clear AI state (for logout/reset)
    clearAIState: () => () => {
        console.log('🧹 Clearing AI state');
        return initialAIState;
    },

    // Update generation history
    updateGenerationHistory: (currentAIState) => (generationRecord) => {
        const updatedHistory = [generationRecord, ...currentAIState.generationHistory].slice(0, 50); // Keep last 50
        
        return {
            ...currentAIState,
            generationHistory: updatedHistory,
            lastGeneration: generationRecord
        };
    },

    // Set loading state
    setLoading: (currentAIState) => (loading) => {
        return {
            ...currentAIState,
            loading
        };
    },

    // Set generating state
    setGenerating: (currentAIState) => (isGenerating) => {
        return {
            ...currentAIState,
            isGenerating
        };
    },

    // Set error state
    setError: (currentAIState) => (error) => {
        return {
            ...currentAIState,
            error,
            loading: false,
            isGenerating: false
        };
    },

    // Get supported providers
    getSupportedProviders: (currentAIState) => () => {
        if (!currentAIState.serviceInstance) {
            return [
                { name: 'openai', model: 'gpt-3.5-turbo', configured: false },
                { name: 'ollama', model: 'llama2', configured: false },
                { name: 'localai', model: 'gpt-3.5-turbo', configured: false }
            ];
        }

        return currentAIState.serviceInstance.getSupportedProviders();
    },

    // Validate configuration
    validateConfiguration: (currentAIState) => () => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                valid: false,
                error: 'Service not initialized'
            };
        }

        return currentAIState.serviceInstance.validateConfiguration();
    }
};

// Hook for using AI slice
export const useAI = () => {
    const [state, setState] = React.useState(initialAIState);

    // Create actions that have access to current state
    const actions = React.useMemo(() => {
        const boundActions = {};
        
        Object.keys(aiActions).forEach(actionName => {
            const action = aiActions[actionName];
            
            // Some actions need current state, others don't
            if (typeof action === 'function') {
                try {
                    // Try calling with state first
                    const result = action(state);
                    if (typeof result === 'function') {
                        // This action needs state
                        boundActions[actionName] = async (...args) => {
                            const actionResult = await result(...args);
                            // If action returns new state, update it
                            if (actionResult && typeof actionResult === 'object' && actionResult.hasOwnProperty('isInitialized')) {
                                setState(actionResult);
                            }
                            return actionResult;
                        };
                    } else {
                        // This action doesn't need state
                        boundActions[actionName] = action;
                    }
                } catch (error) {
                    // Fallback: action doesn't need state
                    boundActions[actionName] = action;
                }
            } else {
                boundActions[actionName] = action;
            }
        });
        
        return boundActions;
    }, [state]);

    return {
        state,
        actions
    };
};

const aiSliceModule = {
    initialState: initialAIState,
    actions: aiActions
};

export default aiSliceModule;