// context/AIProvider.js - Corrected AI Provider with proper service integration
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AITestCaseService } from '../services/AITestCaseService';

const AIContext = createContext();

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

export const AIProvider = ({ children }) => {
    const [aiService, setAiService] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [aiSettings, setAiSettings] = useState({
        provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai',
        temperature: 0.7,
        maxTokens: 3000,
        includeTestData: true,
        framework: 'Generic'
    });
    const [aiMetrics, setAiMetrics] = useState(null);
    const [generationHistory, setGenerationHistory] = useState([]);

    // Initialize AI service
    const initializeAI = useCallback(async () => {
        if (isInitialized || aiService) {
            console.log('🔄 AI service already initialized');
            return { success: true, data: { aiService } };
        }

        console.log('🚀 Initializing AI service...');
        setError(null);

        try {
            const service = new AITestCaseService();
            const result = await service.initialize();

            if (result.success) {
                setAiService(service);
                setIsInitialized(true);
                setError(null);

                console.log('✅ AI service initialized successfully');
                console.log(`Provider: ${result.data.provider}, Model: ${result.data.model}`);

                return {
                    success: true,
                    data: {
                        aiService: service,
                        provider: result.data.provider,
                        model: result.data.model,
                        healthy: result.data.healthy
                    }
                };
            } else {
                throw new Error(result.error || result.userMessage || 'AI initialization failed');
            }
        } catch (err) {
            console.error('❌ AI service initialization failed:', err);
            setError(err.message);
            setIsInitialized(false);
            setAiService(null);

            return {
                success: false,
                error: err.message,
                userMessage: getUserFriendlyErrorMessage(err)
            };
        }
    }, [isInitialized, aiService]);

    // Get user-friendly error messages
    const getUserFriendlyErrorMessage = (error) => {
        const message = error.message?.toLowerCase() || '';
        
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
    };

    // Update AI settings
    const updateAiSettings = useCallback(async (newSettings) => {
        console.log('🔧 Updating AI settings:', newSettings);
        
        try {
            setAiSettings(prev => ({ ...prev, ...newSettings }));
            
            // If provider is changing and service is available, switch provider
            if (newSettings.provider && aiService && newSettings.provider !== aiSettings.provider) {
                const result = await aiService.switchProvider(newSettings.provider);
                
                if (!result.success) {
                    setError(`Failed to switch to ${newSettings.provider}: ${result.error}`);
                    return { success: false, error: result.error };
                } else {
                    setError(null);
                }
            }
            
            return { success: true };
        } catch (err) {
            console.error('Failed to update AI settings:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, [aiService, aiSettings.provider]);

    // Generate test cases
    const generateTestCases = useCallback(async (documentContent, documentTitle, templateConfig = {}) => {
        if (!aiService || !isInitialized) {
            const errorMsg = 'AI service not available. Please check your configuration.';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }

        setIsGenerating(true);
        setError(null);

        try {
            console.log('📝 Generating test cases for:', documentTitle);

            const mergedConfig = { ...aiSettings, ...templateConfig };
            const result = await aiService.generateTestCases(documentContent, documentTitle, mergedConfig);

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

                setGenerationHistory(prev => [generationRecord, ...prev].slice(0, 50));

                return {
                    ...result,
                    generationRecord
                };
            } else {
                setError(result.error || result.userMessage);
                return result;
            }
        } catch (err) {
            console.error('❌ Test case generation failed:', err);
            const errorMessage = err.message || 'Failed to generate test cases';
            setError(errorMessage);
            
            return {
                success: false,
                error: errorMessage,
                userMessage: getUserFriendlyErrorMessage(err)
            };
        } finally {
            setIsGenerating(false);
        }
    }, [aiService, isInitialized, aiSettings]);

    // Fetch AI metrics
    const fetchAiMetrics = useCallback(async (dateRange = 30) => {
        if (!aiService) {
            console.warn('AI service not available for metrics');
            return { success: false, error: 'AI service not available' };
        }

        try {
            const metrics = await aiService.getMetrics(dateRange);
            if (metrics.success) {
                setAiMetrics(metrics.data);
            }
            return metrics;
        } catch (err) {
            console.error('Failed to fetch AI metrics:', err);
            return { success: false, error: err.message };
        }
    }, [aiService]);

    // Test AI health
    const testAIHealth = useCallback(async () => {
        if (!aiService) {
            return { success: false, error: 'AI service not available', healthy: false };
        }

        try {
            const result = await aiService.testHealth();
            console.log('🏥 AI health check:', result.success ? '✅ Healthy' : '❌ Unhealthy');
            
            if (result.success) {
                setError(null);
            } else {
                setError(result.error);
            }
            
            return result;
        } catch (err) {
            console.error('❌ Health check failed:', err);
            setError(err.message);
            return { success: false, error: err.message, healthy: false };
        }
    }, [aiService]);

    // Get service status
    const getServiceStatus = useCallback(() => {
        if (!aiService) {
            return {
                initialized: false,
                healthy: false,
                provider: aiSettings.provider,
                error: 'Service not initialized'
            };
        }

        return aiService.getServiceStatus();
    }, [aiService, aiSettings.provider]);

    // Get supported providers
    const getSupportedProviders = useCallback(() => {
        if (!aiService) {
            return [
                { name: 'openai', model: 'gpt-3.5-turbo', configured: false },
                { name: 'ollama', model: 'llama2', configured: false },
                { name: 'localai', model: 'gpt-3.5-turbo', configured: false }
            ];
        }

        return aiService.getSupportedProviders();
    }, [aiService]);

    // Clear AI state
    const clearAIState = useCallback(() => {
        console.log('🧹 Clearing AI state');
        setAiService(null);
        setIsInitialized(false);
        setIsGenerating(false);
        setError(null);
        setAiMetrics(null);
        setGenerationHistory([]);
    }, []);

    // Auto-initialize on mount
    useEffect(() => {
        console.log('AIProvider mounted, checking initialization...');
        
        if (!isInitialized && !aiService) {
            // Small delay to ensure environment is ready
            const timer = setTimeout(() => {
                initializeAI().catch(console.error);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [initializeAI, isInitialized, aiService]);

    const value = {
        // State
        aiService,
        isInitialized,
        isGenerating,
        error,
        aiSettings,
        aiMetrics,
        generationHistory,
        
        // Actions
        initializeAI,
        updateAiSettings,
        generateTestCases,
        fetchAiMetrics,
        testAIHealth,
        getServiceStatus,
        getSupportedProviders,
        clearAIState,
        
        // Computed values
        isHealthy: isInitialized && !error,
        hasError: !!error,
        canGenerate: isInitialized && !isGenerating && !error
    };

    return (
        <AIContext.Provider value={value}>
            {children}
        </AIContext.Provider>
    );
};