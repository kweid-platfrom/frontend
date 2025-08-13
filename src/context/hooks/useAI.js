/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';

export const useAI = (authSlice, aiSlice, uiSlice, aiInitialized, setAiInitialized) => {
    const initializeAI = useCallback(async () => {
        if (!authSlice.state.isAuthenticated || aiInitialized || aiSlice.state.isInitialized) {
            return;
        }

        console.log('Initializing AI service...');
        try {
            const result = await aiSlice.actions.initializeAI();
            if (result.success) {
                setAiInitialized(true);
                console.log('✅ AI service initialized successfully');
                await aiSlice.actions.updateSettings({
                    isInitialized: true,
                    serviceInstance: result.data.aiService,
                    error: null,
                });
                uiSlice.actions.showNotification?.({
                    id: 'ai-initialized',
                    type: 'success',
                    message: 'AI assistant ready',
                    description: `Using ${result.data.provider} provider`,
                    duration: 3000,
                });
            } else {
                throw new Error(result.error || result.userMessage || 'AI initialization failed');
            }
        } catch (error) {
            console.error('AI service initialization error:', error);
            setAiInitialized(false);
            await aiSlice.actions.updateSettings({
                isInitialized: false,
                error: error.message,
                serviceInstance: null,
            });

            let message = 'AI assistant unavailable';
            let description = 'Please check your AI configuration';
            if (error.message.includes('API_KEY')) {
                description = 'Please configure your AI provider API key';
            } else if (error.message.includes('provider')) {
                description = 'Please set NEXT_PUBLIC_AI_PROVIDER environment variable';
            } else if (error.message.includes('Connection')) {
                description = 'Please check your internet connection and API key';
            }

            uiSlice.actions.showNotification?.({
                id: 'ai-init-error',
                type: 'error',
                message,
                description,
                duration: 8000,
            });
        }
    }, [authSlice.state.isAuthenticated, aiInitialized, aiSlice.state.isInitialized, aiSlice.actions, uiSlice.actions]);

    const generateTestCasesWithAI = useCallback(
        async (documentContent, documentTitle, templateConfig = {}) => {
            const currentState = {
                ai: aiSlice.state,
            };
            if (!currentState.ai.isInitialized || !currentState.ai.serviceInstance) {
                const error = 'AI service not available. Please check your configuration.';
                uiSlice.actions.showNotification?.({
                    id: 'ai-service-unavailable',
                    type: 'error',
                    message: error,
                    description: 'Try refreshing the page or check your environment variables',
                    duration: 5000,
                });
                return { success: false, error };
            }

            try {
                console.log('🚀 Starting AI test case generation...', { documentTitle });
                const result = await aiSlice.actions.generateTestCases(documentContent, documentTitle, templateConfig);

                if (result.success && result.data?.testCases?.length > 0) {
                    console.log(`✅ Generated ${result.data.testCases.length} test cases`);
                    return {
                        success: true,
                        data: {
                            testCases: result.data.testCases.map((testCase, index) => ({
                                ...testCase,
                                id: testCase.id || `temp_${Date.now()}_${index}`,
                                _isGenerated: true,
                                _generationTimestamp: new Date().toISOString(),
                                _generationId: result.generationId || `gen_${Date.now()}`,
                                _provider: result.provider,
                                _model: result.model,
                            })),
                            summary: result.data.summary || {
                                totalTests: result.data.testCases.length,
                                breakdown: result.data.testCases.reduce((acc, tc) => {
                                    const type = tc.type?.toLowerCase() || 'functional';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {}),
                            },
                        },
                        generationId: result.generationId,
                        provider: result.provider,
                        model: result.model,
                    };
                } else if (result.success && (!result.data?.testCases || result.data.testCases.length === 0)) {
                    uiSlice.actions.showNotification?.({
                        id: 'no-test-cases-generated',
                        type: 'warning',
                        message: 'No test cases generated',
                        description: 'Try providing more detailed requirements or adjusting the prompt',
                        duration: 5000,
                    });
                    return result;
                }
                return result;
            } catch (error) {
                console.error('❌ AI test case generation failed:', error);
                uiSlice.actions.showNotification?.({
                    id: 'ai-generation-failed',
                    type: 'error',
                    message: 'AI generation failed',
                    description: error.message || 'Unknown error occurred',
                    duration: 5000,
                });
                return { success: false, error: error.message };
            }
        },
        [aiSlice.state.isInitialized, aiSlice.actions, uiSlice.actions]
    );

    const getAIAnalytics = useCallback(() => {
        if (!aiSlice.state.isInitialized) {
            return { available: false, message: 'AI service not available' };
        }
        const stats = aiSlice.actions.getGenerationStats();
        return {
            available: true,
            ...stats,
            provider: aiSlice.state.settings.provider,
            isHealthy: aiSlice.state.error === null && stats.isHealthy,
            lastGeneration: aiSlice.state.lastGeneration,
            settings: aiSlice.state.settings,
        };
    }, [aiSlice.state.isInitialized, aiSlice.state.settings, aiSlice.state.error, aiSlice.state.lastGeneration, aiSlice.actions]);

    const updateAISettings = useCallback(
        async (newSettings) => {
            try {
                await aiSlice.actions.updateSettings(newSettings);
                uiSlice.actions.showNotification?.({
                    id: 'ai-settings-updated',
                    type: 'success',
                    message: 'AI settings updated',
                    description: `Provider: ${newSettings.provider || aiSlice.state.settings.provider}`,
                    duration: 3000,
                });
                return { success: true };
            } catch (error) {
                console.error('Failed to update AI settings:', error);
                uiSlice.actions.showNotification?.({
                    id: 'ai-settings-update-failed',
                    type: 'error',
                    message: 'Failed to update AI settings',
                    description: error.message,
                    duration: 5000,
                });
                return { success: false, error: error.message };
            }
        },
        [aiSlice.actions, aiSlice.state.settings.provider, uiSlice.actions]
    );

    return { initializeAI, generateTestCasesWithAI, getAIAnalytics, updateAISettings };
};