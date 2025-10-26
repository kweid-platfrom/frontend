// slices/aiSlice.js - Integrated with AIContext
import React from 'react';
import { useAI as useAIContext } from '../AIContext'; // Import AIContext

// Initial AI state - Simplified since AIContext handles most of this
const initialAIState = {
    // UI state only - actual AI functionality is in AIContext
    isGenerating: false,
    loading: false,
    error: null,
    lastGeneration: null,
    generationHistory: [],
    
    // Local settings override (optional)
    settings: {
        temperature: 0.7,
        maxTokens: 3000,
        includeTestData: true,
        framework: 'Generic'
    }
};

// Hook for using AI slice (now properly integrated with AIContext)
export const useAISlice = () => {
    const [state, setState] = React.useState(initialAIState);
    
    // Get AIContext - this provides the actual AI functionality
    const aiContext = useAIContext();

    const actions = React.useMemo(() => ({
        // Settings
        updateSettings: (newSettings) => {
            setState(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    ...newSettings
                },
                error: null
            }));
        },

        // UI State
        setLoading: (loading) => {
            setState(prev => ({ ...prev, loading }));
        },

        setGenerating: (isGenerating) => {
            setState(prev => ({ ...prev, isGenerating }));
        },

        setError: (error) => {
            setState(prev => ({
                ...prev,
                error,
                loading: false,
                isGenerating: false
            }));
        },

        clearError: () => {
            setState(prev => ({ ...prev, error: null }));
        },

        // History Management
        updateGenerationHistory: (generationRecord) => {
            setState(prev => {
                const updatedHistory = [
                    generationRecord, 
                    ...prev.generationHistory
                ].slice(0, 50); // Keep last 50

                return {
                    ...prev,
                    generationHistory: updatedHistory,
                    lastGeneration: generationRecord
                };
            });
        },

        clearGenerationHistory: () => {
            setState(prev => ({
                ...prev,
                generationHistory: [],
                lastGeneration: null
            }));
        },

        // Clear State
        clearAIState: () => {
            console.log('🧹 Clearing AI slice state');
            setState(initialAIState);
        },

        // Delegate to AIContext for actual AI operations
        initializeAI: async () => {
            console.log('AI is auto-initialized via AIContext');
            return { 
                success: true, 
                message: 'AI Context is ready',
                initialized: aiContext?.initialized || false
            };
        },

        generateTestCases: async (documentContent, documentTitle, templateConfig = {}) => {
            if (!aiContext?.generateTestCases) {
                console.error('AIContext not available');
                return { 
                    success: false, 
                    error: 'AI service not available',
                    userMessage: 'AI service is not properly initialized'
                };
            }
            
            setState(prev => ({ ...prev, isGenerating: true, loading: true }));
            
            try {
                const result = await aiContext.generateTestCases(
                    documentContent, 
                    documentTitle, 
                    { ...state.settings, ...templateConfig }
                );
                
                if (result.success) {
                    actions.updateGenerationHistory({
                        type: 'test_cases',
                        timestamp: new Date().toISOString(),
                        success: true,
                        itemCount: result.testCases?.length || 0
                    });
                }
                
                setState(prev => ({ 
                    ...prev, 
                    isGenerating: false, 
                    loading: false,
                    error: result.success ? null : result.error
                }));
                
                return result;
            } catch (error) {
                const errorMsg = error.message || 'Generation failed';
                setState(prev => ({ 
                    ...prev, 
                    isGenerating: false, 
                    loading: false,
                    error: errorMsg
                }));
                return { success: false, error: errorMsg };
            }
        },

        generateBugReport: async (bugDescription, additionalContext = {}) => {
            if (!aiContext?.generateBugReport) {
                console.error('AIContext not available');
                return { 
                    success: false, 
                    error: 'AI service not available',
                    userMessage: 'AI service is not properly initialized'
                };
            }
            
            setState(prev => ({ ...prev, isGenerating: true, loading: true }));
            
            try {
                const result = await aiContext.generateBugReport(
                    bugDescription, 
                    { ...state.settings, ...additionalContext }
                );
                
                if (result.success) {
                    actions.updateGenerationHistory({
                        type: 'bug_report',
                        timestamp: new Date().toISOString(),
                        success: true
                    });
                }
                
                setState(prev => ({ 
                    ...prev, 
                    isGenerating: false, 
                    loading: false,
                    error: result.success ? null : result.error
                }));
                
                return result;
            } catch (error) {
                const errorMsg = error.message || 'Generation failed';
                setState(prev => ({ 
                    ...prev, 
                    isGenerating: false, 
                    loading: false,
                    error: errorMsg
                }));
                return { success: false, error: errorMsg };
            }
        },

        // Get stats from AIContext
        getGenerationStats: () => {
            if (!aiContext?.getAIMetrics) {
                return {
                    totalGenerations: state.generationHistory.length,
                    successfulGenerations: state.generationHistory.filter(g => g.success).length,
                    failedGenerations: state.generationHistory.filter(g => !g.success).length,
                    successRate: state.generationHistory.length > 0 
                        ? (state.generationHistory.filter(g => g.success).length / state.generationHistory.length * 100).toFixed(1)
                        : 0,
                    isHealthy: false,
                    lastGeneration: state.lastGeneration
                };
            }

            const metrics = aiContext.getAIMetrics();
            return {
                totalGenerations: metrics.totalRequests || state.generationHistory.length,
                successfulGenerations: metrics.successfulRequests || state.generationHistory.filter(g => g.success).length,
                failedGenerations: metrics.failedRequests || state.generationHistory.filter(g => !g.success).length,
                successRate: metrics.successRate || 0,
                isHealthy: aiContext.initialized && !aiContext.error,
                lastGeneration: state.lastGeneration
            };
        },

        // Get service status from AIContext
        getServiceStatus: () => {
            if (!aiContext) {
                return {
                    initialized: false,
                    healthy: false,
                    provider: null,
                    model: null,
                    error: 'AI Context not available'
                };
            }

            return {
                initialized: aiContext.initialized || false,
                healthy: aiContext.initialized && !aiContext.error,
                provider: aiContext.currentProvider || 'Unknown',
                model: aiContext.currentModel || 'Unknown',
                availableModels: aiContext.availableModels || [],
                error: aiContext.error || null
            };
        },

        // Additional AIContext methods
        switchProvider: async (modelId) => {
            if (!aiContext?.switchModel) {
                return { success: false, error: 'AIContext not available' };
            }
            return await aiContext.switchModel(modelId);
        },

        testHealth: async () => {
            if (!aiContext?.testHealth) {
                return { success: false, error: 'AIContext not available' };
            }
            return await aiContext.testHealth();
        },

        getMetrics: () => {
            if (!aiContext?.getAIMetrics) {
                return { success: false, error: 'AIContext not available' };
            }
            return aiContext.getAIMetrics();
        },

        getSupportedProviders: () => {
            return aiContext?.availableModels || [];
        },

        validateConfiguration: () => {
            const status = actions.getServiceStatus();
            return {
                success: status.initialized && status.healthy,
                valid: status.initialized && status.healthy,
                error: status.error,
                details: status
            };
        }
    }), [state, aiContext]);

    return {
        state,
        actions
    };
};

// Export for backward compatibility
const aiSliceModule = {
    initialState: initialAIState,
    useAISlice
};

export default aiSliceModule;