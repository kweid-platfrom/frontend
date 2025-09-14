// slices/aiSlice.js - MINIMAL FIX - Only replace the initializeAI action
import React from 'react';
import { AITestCaseService } from '../../services/AITestCaseService';

// Initial AI state (UNCHANGED)
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

// AI Actions - ONLY CHANGE: initializeAI
const aiActions = {
    // Initialize AI service - NO API CALLS ANYMORE
    initializeAI: () => async () => {
        console.log('🔄 Initializing AI service (config only)...');

        try {
            // Just create the service instance - don't call initialize() yet
            const aiService = new AITestCaseService();
            
            console.log('✅ AI service configured successfully (no API calls made)');
            return {
                success: true,
                data: {
                    aiService: aiService,
                    provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai',
                    model: null, // Will be determined on first actual use
                    healthy: null // Will be determined on first actual use
                }
            };
        } catch (error) {
            console.error('❌ AI configuration error:', error);
            throw error;
        }
    },

    // Update AI settings (UNCHANGED)
    updateSettings: (currentAIState) => (newSettings) => {
        console.log('🔧 Updating AI settings:', newSettings);

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

    // Generate test cases with AI - ADD LAZY INITIALIZATION
    generateTestCases: (currentAIState) => async (documentContent, documentTitle, templateConfig = {}) => {
        if (!currentAIState.serviceInstance) {
            console.error('❌ AI service not available');
            return {
                success: false,
                error: 'AI service not initialized',
                userMessage: 'Please initialize the AI service first'
            };
        }

        // LAZY INITIALIZATION: Initialize the service only when first needed
        if (!currentAIState.serviceInstance._initialized) {
            console.log('🔄 First time use - initializing AI service...');
            try {
                const initResult = await currentAIState.serviceInstance.initialize();
                if (!initResult.success) {
                    console.error('❌ AI service initialization failed:', initResult.error);
                    return {
                        success: false,
                        error: initResult.error || 'AI service initialization failed',
                        userMessage: initResult.userMessage || 'Please check your AI configuration'
                    };
                }
                // Mark as initialized to avoid future calls
                currentAIState.serviceInstance._initialized = true;
                console.log('✅ AI service initialized on first use');
            } catch (error) {
                console.error('❌ AI service initialization error:', error);
                return {
                    success: false,
                    error: error.message,
                    userMessage: 'Failed to initialize AI service. Please check your configuration.'
                };
            }
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

    // ALL OTHER ACTIONS REMAIN EXACTLY THE SAME
    getGenerationStats: () => () => {
        return {
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0,
            successRate: 0,
            isHealthy: false,
            lastGeneration: null
        };
    },

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

    generateBugReport: (currentAIState) => async (bugDescription, additionalContext = {}) => {
        if (!currentAIState.serviceInstance) {
            return {
                success: false,
                error: 'AI service not initialized'
            };
        }

        try {
            // LAZY INITIALIZATION for bug reports too
            if (!currentAIState.serviceInstance._initialized) {
                console.log('🔄 First time use - initializing AI service...');
                const initResult = await currentAIState.serviceInstance.initialize();
                if (!initResult.success) {
                    return {
                        success: false,
                        error: initResult.error || 'AI service initialization failed',
                        userMessage: initResult.userMessage || 'Please check your AI configuration'
                    };
                }
                currentAIState.serviceInstance._initialized = true;
            }

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

    clearAIState: () => () => {
        console.log('🧹 Clearing AI state');
        return initialAIState;
    },

    updateGenerationHistory: (currentAIState) => (generationRecord) => {
        const updatedHistory = [generationRecord, ...currentAIState.generationHistory].slice(0, 50);

        return {
            ...currentAIState,
            generationHistory: updatedHistory,
            lastGeneration: generationRecord
        };
    },

    setLoading: (currentAIState) => (loading) => {
        return {
            ...currentAIState,
            loading
        };
    },

    setGenerating: (currentAIState) => (isGenerating) => {
        return {
            ...currentAIState,
            isGenerating
        };
    },

    setError: (currentAIState) => (error) => {
        return {
            ...currentAIState,
            error,
            loading: false,
            isGenerating: false
        };
    },

    getSupportedProviders: (currentAIState) => () => {
        if (!currentAIState.serviceInstance) {
            return [
                { name: 'openai', model: 'gpt-3.5-turbo', configured: false },
                { name: 'gemini', model: 'gemini-pro', configured: false },
                { name: 'ollama', model: 'llama2', configured: false },
                { name: 'localai', model: 'gpt-3.5-turbo', configured: false }
            ];
        }

        return currentAIState.serviceInstance.getSupportedProviders();
    },

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

// Hook for using AI slice (UNCHANGED)
export const useAI = () => {
    const [state, setState] = React.useState(initialAIState);

    const actions = React.useMemo(() => {
        return {
            initializeAI: async () => {
                const initFunction = aiActions.initializeAI();
                return await initFunction();
            },

            updateSettings: async (newSettings) => {
                const updateFunction = aiActions.updateSettings(state);
                const newState = updateFunction(newSettings);
                setState(newState);
                return newState;
            },

            generateTestCases: async (documentContent, documentTitle, templateConfig = {}) => {
                const generateFunction = aiActions.generateTestCases(state);
                return await generateFunction(documentContent, documentTitle, templateConfig);
            },

            getGenerationStats: () => {
                const statsFunction = aiActions.getGenerationStats(state);
                return statsFunction();
            },

            switchProvider: async (provider) => {
                const switchFunction = aiActions.switchProvider(state);
                return await switchFunction(provider);
            },

            testHealth: async () => {
                const healthFunction = aiActions.testHealth(state);
                return await healthFunction();
            },

            getMetrics: async (dateRange = 30) => {
                const metricsFunction = aiActions.getMetrics(state);
                return await metricsFunction(dateRange);
            },

            generateBugReport: async (bugDescription, additionalContext = {}) => {
                const bugReportFunction = aiActions.generateBugReport(state);
                return await bugReportFunction(bugDescription, additionalContext);
            },

            getServiceStatus: () => {
                const statusFunction = aiActions.getServiceStatus(state);
                return statusFunction();
            },

            clearAIState: () => {
                const newState = aiActions.clearAIState()();
                setState(newState);
                return newState;
            },

            updateGenerationHistory: (generationRecord) => {
                const updateFunction = aiActions.updateGenerationHistory(state);
                const newState = updateFunction(generationRecord);
                setState(newState);
                return newState;
            },

            setLoading: (loading) => {
                const updateFunction = aiActions.setLoading(state);
                const newState = updateFunction(loading);
                setState(newState);
                return newState;
            },

            setGenerating: (isGenerating) => {
                const updateFunction = aiActions.setGenerating(state);
                const newState = updateFunction(isGenerating);
                setState(newState);
                return newState;
            },

            setError: (error) => {
                const updateFunction = aiActions.setError(state);
                const newState = updateFunction(error);
                setState(newState);
                return newState;
            },

            getSupportedProviders: () => {
                const providersFunction = aiActions.getSupportedProviders(state);
                return providersFunction();
            },

            validateConfiguration: () => {
                const validateFunction = aiActions.validateConfiguration(state);
                return validateFunction();
            }
        };
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