/* eslint-disable react-hooks/exhaustive-deps */
// hooks/useAIBugService.js - Custom hook for AI Bug Service integration
import { useState, useEffect, useCallback, useRef } from 'react';
import aiBugServiceInstance from '../services/AIBugService';

export const useAIBugService = () => {
    const [state, setState] = useState({
        isInitialized: false,
        isGenerating: false,
        isHealthy: false,
        error: null,
        provider: 'Unknown',
        model: 'Unknown',
        lastGeneration: null,
        generationHistory: []
    });

    const initializationRef = useRef(false);

    // Initialize the service
    const initialize = useCallback(async () => {
        if (initializationRef.current) {
            return state.isInitialized;
        }

        initializationRef.current = true;

        try {
            setState(prev => ({ ...prev, error: null }));
            
            const result = await aiBugServiceInstance.initialize();

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    isInitialized: true,
                    isHealthy: result.data.healthy,
                    provider: result.data.provider,
                    model: result.data.model,
                    error: null
                }));

                return true;
            } else {
                throw new Error(result.userMessage || result.error);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                isInitialized: false,
                isHealthy: false,
                error: error.message
            }));
            return false;
        } finally {
            initializationRef.current = false;
        }
    }, []);

    // Generate bug report
    const generateBugReport = useCallback(async (prompt, consoleError = '', additionalContext = {}) => {
        if (!state.isInitialized) {
            const initialized = await initialize();
            if (!initialized) {
                return {
                    success: false,
                    error: 'AI service not available',
                    userMessage: 'Please refresh the page and try again'
                };
            }
        }

        setState(prev => ({ ...prev, isGenerating: true, error: null }));

        try {
            const result = await aiBugServiceInstance.generateBugReport(prompt, consoleError, additionalContext);

            if (result.success) {
                const generationRecord = {
                    id: result.generationId || `bug_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
                    hasConsoleError: !!consoleError.trim(),
                    provider: result.provider,
                    model: result.model,
                    success: true
                };

                setState(prev => ({
                    ...prev,
                    lastGeneration: generationRecord,
                    generationHistory: [generationRecord, ...prev.generationHistory].slice(0, 10), // Keep last 10
                    error: null
                }));
            } else {
                setState(prev => ({ ...prev, error: result.userMessage || result.error }));
            }

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to generate bug report';
            setState(prev => ({ ...prev, error: errorMessage }));
            
            return {
                success: false,
                error: errorMessage,
                userMessage: 'Failed to generate bug report. Please try again.'
            };
        } finally {
            setState(prev => ({ ...prev, isGenerating: false }));
        }
    }, [state.isInitialized, initialize]);

    // Test service health
    const testHealth = useCallback(async () => {
        try {
            const result = await aiBugServiceInstance.testHealth();
            
            setState(prev => ({
                ...prev,
                isHealthy: result.healthy,
                provider: result.provider || prev.provider,
                model: result.model || prev.model,
                error: result.success ? null : result.error
            }));

            return result;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isHealthy: false,
                error: error.message
            }));

            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }, []);

    // Get service status
    const getServiceStatus = useCallback(() => {
        return {
            ...state,
            serviceInstance: aiBugServiceInstance,
            canGenerate: state.isInitialized && state.isHealthy && !state.isGenerating
        };
    }, [state]);

    // Switch provider
    const switchProvider = useCallback(async (provider) => {
        try {
            setState(prev => ({ ...prev, error: null }));
            
            const result = await aiBugServiceInstance.switchProvider(provider);
            
            if (result.success) {
                setState(prev => ({
                    ...prev,
                    provider: result.provider,
                    isHealthy: result.healthy,
                    error: null
                }));
            } else {
                setState(prev => ({ ...prev, error: result.error }));
            }

            return result;
        } catch (error) {
            const errorMessage = `Failed to switch to ${provider}: ${error.message}`;
            setState(prev => ({ ...prev, error: errorMessage }));
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    // Get supported providers
    const getSupportedProviders = useCallback(() => {
        return aiBugServiceInstance.getSupportedProviders();
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Reset service
    const reset = useCallback(() => {
        setState({
            isInitialized: false,
            isGenerating: false,
            isHealthy: false,
            error: null,
            provider: 'Unknown',
            model: 'Unknown',
            lastGeneration: null,
            generationHistory: []
        });
        initializationRef.current = false;
    }, []);

    // Auto-initialize on mount
    useEffect(() => {
        initialize().catch(console.error);
    }, [initialize]);

    return {
        // State
        ...state,
        canGenerate: state.isInitialized && state.isHealthy && !state.isGenerating,
        
        // Actions
        initialize,
        generateBugReport,
        testHealth,
        getServiceStatus,
        switchProvider,
        getSupportedProviders,
        clearError,
        reset
    };
};