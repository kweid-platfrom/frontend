// hooks/useAIWithMetrics.js - React hook for AI operations with automatic metrics tracking
import { useState, useEffect, useCallback, useRef } from 'react';
import aiIntegrationService from '../services/AIIntegrationService';

export const useAIWithMetrics = () => {
    // Core AI service state
    const [aiInitialized, setAiInitialized] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [currentProvider, setCurrentProvider] = useState(null);
    const [currentModel, setCurrentModel] = useState(null);

    // Metrics state
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metricsError, setMetricsError] = useState(null);
    const [sessionMetrics, setSessionMetrics] = useState({
        testCasesGenerated: 0,
        bugReportsGenerated: 0,
        aiCallsToday: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalCostToday: 0,
        timeSaved: 0
    });

    // Analytics state
    const [analyticsData, setAnalyticsData] = useState(null);
    const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState(null);

    // Refs for preventing multiple initializations
    const initializationRef = useRef(false);
    const metricsIntervalRef = useRef(null);

    // Initialize AI services on mount
    useEffect(() => {
        const initializeAI = async () => {
            if (initializationRef.current) return;
            initializationRef.current = true;

            console.log('Initializing AI services with metrics...');
            
            try {
                const result = await aiIntegrationService.initialize();
                
                if (result.success) {
                    setAiInitialized(true);
                    setAiAvailable(true);
                    setCurrentProvider(result.data.provider);
                    setCurrentModel(result.data.model);
                    setAiError(null);
                    
                    // Start session metrics updates
                    startMetricsUpdates();
                    
                    console.log('✅ AI services initialized successfully');
                } else {
                    throw new Error(result.userMessage || result.error || 'Initialization failed');
                }
            } catch (error) {
                console.error('AI initialization failed:', error);
                setAiInitialized(false);
                setAiAvailable(false);
                setAiError(error.message);
            }
        };

        initializeAI();

        // Cleanup on unmount
        return () => {
            if (metricsIntervalRef.current) {
                clearInterval(metricsIntervalRef.current);
            }
        };
    }, [startMetricsUpdates]);

    // Start periodic session metrics updates
    const startMetricsUpdates = useCallback(() => {
        const updateSessionMetrics = () => {
            const metrics = aiIntegrationService.getSessionMetrics();
            setSessionMetrics(metrics);
        };

        // Update immediately
        updateSessionMetrics();
        
        // Update every 30 seconds
        metricsIntervalRef.current = setInterval(updateSessionMetrics, 30000);
    }, []);

    // Generate test cases with automatic metrics tracking
    const generateTestCasesWithAI = useCallback(async (documentContent, documentTitle, templateConfig = {}) => {
        if (!aiAvailable) {
            return {
                success: false,
                error: 'AI service not available',
                userMessage: 'Please wait for AI service to initialize'
            };
        }

        setAiGenerating(true);
        setAiError(null);

        try {
            console.log(`Generating test cases for: ${documentTitle}`);
            
            const result = await aiIntegrationService.generateTestCases(
                documentContent, 
                documentTitle, 
                templateConfig
            );

            if (result.success) {
                // Update session metrics immediately
                const updatedMetrics = aiIntegrationService.getSessionMetrics();
                setSessionMetrics(updatedMetrics);
                
                console.log(`✅ Generated ${result.data.testCases?.length || 0} test cases`);
                
                return {
                    success: true,
                    data: result.data,
                    metadata: result.metadata,
                    tracking: result.tracking,
                    provider: result.provider,
                    model: result.model
                };
            } else {
                throw new Error(result.userMessage || result.error || 'Test case generation failed');
            }
        } catch (error) {
            console.error('❌ Test case generation failed:', error);
            setAiError(error.message);
            
            return {
                success: false,
                error: error.message,
                userMessage: error.message
            };
        } finally {
            setAiGenerating(false);
        }
    }, [aiAvailable]);

    // Generate bug report with automatic metrics tracking
    const generateBugReportWithAI = useCallback(async (prompt, consoleError = '', additionalContext = {}) => {
        if (!aiAvailable) {
            return {
                success: false,
                error: 'AI service not available',
                userMessage: 'Please wait for AI service to initialize'
            };
        }

        setAiGenerating(true);
        setAiError(null);

        try {
            console.log('🐛 Generating bug report...');
            
            const result = await aiIntegrationService.generateBugReport(
                prompt, 
                consoleError, 
                additionalContext
            );

            if (result.success) {
                // Update session metrics immediately
                const updatedMetrics = aiIntegrationService.getSessionMetrics();
                setSessionMetrics(updatedMetrics);
                
                console.log('✅ Generated bug report successfully');
                
                return {
                    success: true,
                    data: result.data,
                    tracking: result.tracking,
                    provider: result.provider,
                    model: result.model
                };
            } else {
                throw new Error(result.userMessage || result.error || 'Bug report generation failed');
            }
        } catch (error) {
            console.error('❌ Bug report generation failed:', error);
            setAiError(error.message);
            
            return {
                success: false,
                error: error.message,
                userMessage: error.message
            };
        } finally {
            setAiGenerating(false);
        }
    }, [aiAvailable]);

    // Get AI analytics for dashboard
    const getAIAnalytics = useCallback(async (dateRange = 30, forceRefresh = false) => {
        // Return cached data if available and not forced to refresh
        if (analyticsData && !forceRefresh && lastAnalyticsUpdate) {
            const timeSinceUpdate = Date.now() - new Date(lastAnalyticsUpdate).getTime();
            if (timeSinceUpdate < 5 * 60 * 1000) { // 5 minutes cache
                return {
                    success: true,
                    data: analyticsData,
                    cached: true
                };
            }
        }

        setMetricsLoading(true);
        setMetricsError(null);

        try {
            console.log(`📊 Fetching AI analytics for ${dateRange} days...`);
            
            const result = await aiIntegrationService.getAIAnalytics(dateRange);
            
            if (result.success) {
                setAnalyticsData(result.data);
                setLastAnalyticsUpdate(new Date().toISOString());
                
                console.log('✅ AI analytics loaded successfully');
                
                return {
                    success: true,
                    data: result.data,
                    cached: false
                };
            } else {
                throw new Error(result.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('❌ Failed to load AI analytics:', error);
            setMetricsError(error.message);
            
            return {
                success: false,
                error: error.message,
                data: null
            };
        } finally {
            setMetricsLoading(false);
        }
    }, [analyticsData, lastAnalyticsUpdate]);

    // Switch AI provider
    const switchAIProvider = useCallback(async (provider) => {
        if (!aiAvailable) {
            return {
                success: false,
                error: 'AI service not available'
            };
        }

        setAiGenerating(true);
        setAiError(null);

        try {
            console.log(`🔄 Switching to ${provider} provider...`);
            
            const result = await aiIntegrationService.switchProvider(provider);
            
            if (result.success) {
                setCurrentProvider(result.provider);
                setCurrentModel(result.model);
                
                console.log(`✅ Successfully switched to ${provider}`);
                
                return {
                    success: true,
                    provider: result.provider,
                    model: result.model
                };
            } else {
                throw new Error(result.userMessage || result.error || 'Provider switch failed');
            }
        } catch (error) {
            console.error(`❌ Failed to switch provider:`, error);
            setAiError(error.message);
            
            return {
                success: false,
                error: error.message
            };
        } finally {
            setAiGenerating(false);
        }
    }, [aiAvailable]);

    // Update AI settings
    const updateAISettings = useCallback(async (newSettings) => {
        if (!aiAvailable) {
            return {
                success: false,
                error: 'AI service not available'
            };
        }

        try {
            console.log('⚙️ Updating AI settings...');
            
            const result = await aiIntegrationService.updateSettings(newSettings);
            
            if (result.success) {
                // Update local state if provider changed
                if (newSettings.provider) {
                    setCurrentProvider(newSettings.provider);
                }
                
                console.log('✅ AI settings updated successfully');
                
                return {
                    success: true,
                    message: result.message
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('❌ Failed to update AI settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }, [aiAvailable]);

    // Test AI health
    const testAIHealth = useCallback(async () => {
        try {
            console.log('🔍 Testing AI service health...');
            
            const result = await aiIntegrationService.testHealth();
            
            if (result.success) {
                setAiAvailable(true);
                setAiError(null);
                console.log('✅ AI service is healthy');
            } else {
                setAiAvailable(false);
                setAiError(result.error || 'Health check failed');
                console.log('❌ AI service health check failed');
            }
            
            return result;
        } catch (error) {
            console.error('❌ Health check error:', error);
            setAiAvailable(false);
            setAiError(error.message);
            
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }, []);

    // Export AI report
    const exportAIReport = useCallback(async (format = 'json', dateRange = 30) => {
        try {
            console.log(`📤 Exporting AI report in ${format} format...`);
            
            const result = await aiIntegrationService.exportAIReport(format, dateRange);
            
            if (result.success) {
                // Create download blob
                const blob = new Blob([result.data], { type: result.contentType });
                const url = URL.createObjectURL(blob);
                
                // Trigger download
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('✅ AI report exported successfully');
                
                return {
                    success: true,
                    filename: result.filename
                };
            } else {
                return result;
            }
        } catch (error) {
            console.error('❌ Export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }, []);

    // Get service status
    const getServiceStatus = useCallback(() => {
        return {
            initialized: aiInitialized,
            available: aiAvailable,
            generating: aiGenerating,
            error: aiError,
            provider: currentProvider,
            model: currentModel,
            sessionMetrics,
            lastAnalyticsUpdate
        };
    }, [aiInitialized, aiAvailable, aiGenerating, aiError, currentProvider, currentModel, sessionMetrics, lastAnalyticsUpdate]);

    // Clear AI error
    const clearAIError = useCallback(() => {
        setAiError(null);
    }, []);

    // Refresh session metrics manually
    const refreshSessionMetrics = useCallback(() => {
        const metrics = aiIntegrationService.getSessionMetrics();
        setSessionMetrics(metrics);
    }, []);

    return {
        // Core AI service state
        aiService: aiIntegrationService,
        aiInitialized,
        aiAvailable,
        aiGenerating,
        aiError,
        currentProvider,
        currentModel,

        // Metrics state
        metricsLoading,
        metricsError,
        sessionMetrics,
        analyticsData,
        lastAnalyticsUpdate,

        // AI operations with automatic metrics tracking
        generateTestCasesWithAI,
        generateBugReportWithAI,
        getAIAnalytics,

        // Service management
        switchAIProvider,
        updateAISettings,
        testAIHealth,
        exportAIReport,

        // Utility functions
        getServiceStatus,
        clearAIError,
        refreshSessionMetrics
    };
};