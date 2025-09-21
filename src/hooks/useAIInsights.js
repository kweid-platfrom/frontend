// hooks/useAIInsights.js - Hook for managing AI insights in recordings
import { useState, useCallback, useEffect } from 'react';
import aiInsightService from '../services/AIInsightService';

export const useAIInsights = (recording, options = {}) => {
    const {
        autoAnalyze = true,
        enableFallback = true,
        storageKey = null // If provided, will cache insights locally
    } = options;

    const [insights, setInsights] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [error, setError] = useState(null);
    const [analysisMetrics, setAnalysisMetrics] = useState(null);
    const [serviceReady, setServiceReady] = useState(false);

    // Check service health on mount
    useEffect(() => {
        const checkService = async () => {
            try {
                const health = await aiInsightService.testHealth();
                setServiceReady(health.success && health.healthy);
            } catch (err) {
                console.warn('AI insight service health check failed:', err);
                setServiceReady(false);
            }
        };

        checkService();
    }, []);

    // Load cached insights if available
    useEffect(() => {
        if (storageKey && recording?.id) {
            try {
                const cached = localStorage.getItem(`ai_insights_${storageKey}_${recording.id}`);
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    const cacheAge = Date.now() - new Date(parsedCache.timestamp).getTime();
                    
                    // Use cached insights if less than 1 hour old
                    if (cacheAge < 60 * 60 * 1000) {
                        setInsights(parsedCache.insights);
                        setAnalysisMetrics(parsedCache.metadata);
                        setAnalysisComplete(true);
                        console.log('📋 Loaded cached AI insights');
                        return;
                    }
                }
            } catch (err) {
                console.warn('Failed to load cached insights:', err);
            }
        }
    }, [recording?.id, storageKey]);

    // Analyze recording data
    const analyzeRecording = useCallback(async (recordingData) => {
        if (!recordingData || isAnalyzing) {
            return { success: false, error: 'Invalid recording data or analysis in progress' };
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisComplete(false);

        try {
            console.log('🤖 Analyzing recording with AI insights service...');
            
            const result = await aiInsightService.analyzeRecording(recordingData);

            if (result.success && result.data?.insights) {
                const processedInsights = result.data.insights.map(insight => ({
                    ...insight,
                    recordingId: recordingData.id,
                    generatedAt: new Date().toISOString()
                }));

                setInsights(processedInsights);
                setAnalysisMetrics(result.metadata);
                setAnalysisComplete(true);
                setError(null);

                // Cache insights if storage key provided
                if (storageKey) {
                    try {
                        const cacheData = {
                            insights: processedInsights,
                            metadata: result.metadata,
                            timestamp: new Date().toISOString(),
                            recordingId: recordingData.id
                        };
                        localStorage.setItem(
                            `ai_insights_${storageKey}_${recordingData.id}`, 
                            JSON.stringify(cacheData)
                        );
                    } catch (err) {
                        console.warn('Failed to cache insights:', err);
                    }
                }

                console.log(`✅ Generated ${processedInsights.length} AI insights`);
                
                return {
                    success: true,
                    insights: processedInsights,
                    metadata: result.metadata
                };

            } else if (result.fallbackData?.insights) {
                // Handle fallback mode
                const fallbackInsights = result.fallbackData.insights.map(insight => ({
                    ...insight,
                    recordingId: recordingData.id,
                    generatedAt: new Date().toISOString(),
                    fallbackMode: true
                }));

                setInsights(fallbackInsights);
                setAnalysisMetrics({
                    totalInsights: fallbackInsights.length,
                    provider: 'fallback',
                    model: 'rule-based',
                    fallbackMode: true
                });
                setAnalysisComplete(true);
                setError(result.userMessage || 'AI service unavailable, using fallback analysis');

                console.log(`⚠️ Using fallback insights: ${fallbackInsights.length} insights`);
                
                return {
                    success: true,
                    insights: fallbackInsights,
                    fallbackMode: true,
                    error: result.userMessage
                };

            } else {
                throw new Error(result.userMessage || result.error || 'Failed to generate insights');
            }

        } catch (err) {
            console.error('❌ Recording analysis failed:', err);
            
            const errorMessage = err.message || 'Failed to analyze recording';
            setError(errorMessage);
            
            // Generate basic fallback if enabled
            if (enableFallback) {
                const basicInsights = generateBasicFallbackInsights(recordingData);
                setInsights(basicInsights);
                setAnalysisMetrics({
                    totalInsights: basicInsights.length,
                    provider: 'basic-fallback',
                    model: 'rule-based',
                    fallbackMode: true,
                    error: errorMessage
                });
                setAnalysisComplete(true);

                return {
                    success: false,
                    insights: basicInsights,
                    fallbackMode: true,
                    error: errorMessage
                };
            }

            setAnalysisComplete(false);
            return {
                success: false,
                error: errorMessage
            };

        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing, enableFallback, storageKey]);

    // Generate basic fallback insights
    const generateBasicFallbackInsights = (recordingData) => {
        const insights = [];
        const { consoleLogs = [], networkLogs = [], duration = 300 } = recordingData;

        // Basic error detection
        const errors = consoleLogs.filter(log => log.level === 'error');
        if (errors.length > 0) {
            insights.push({
                id: `basic_error_${Date.now()}`,
                type: 'error',
                category: 'javascript',
                title: `${errors.length} JavaScript Error${errors.length > 1 ? 's' : ''} Found`,
                description: 'JavaScript errors detected that may affect application functionality',
                severity: errors.length > 3 ? 'high' : 'medium',
                confidence: 1.0,
                impact: 'May prevent users from completing tasks',
                recommendation: 'Review and fix JavaScript errors',
                evidence: errors.slice(0, 3).map(e => e.message),
                tags: ['javascript', 'errors', 'basic-analysis'],
                automationPotential: 'high',
                businessImpact: 'functionality',
                icon: 'AlertTriangle',
                color: 'red',
                time: Math.random() * duration,
                source: 'basic-fallback'
            });
        }

        // Basic network analysis
        const failedRequests = networkLogs.filter(req => req.status >= 400);
        if (failedRequests.length > 0) {
            insights.push({
                id: `basic_network_${Date.now()}`,
                type: 'network',
                category: 'api',
                title: `${failedRequests.length} Failed Request${failedRequests.length > 1 ? 's' : ''}`,
                description: 'Network requests failed with error status codes',
                severity: failedRequests.some(r => r.status >= 500) ? 'high' : 'medium',
                confidence: 1.0,
                impact: 'Users may experience data loading issues',
                recommendation: 'Check API endpoints and error handling',
                evidence: failedRequests.slice(0, 3).map(r => `${r.method} ${r.url} - ${r.status}`),
                tags: ['network', 'api', 'basic-analysis'],
                automationPotential: 'high',
                businessImpact: 'user_experience',
                icon: 'Network',
                color: 'yellow',
                time: Math.random() * duration,
                source: 'basic-fallback'
            });
        }

        // If no issues found, add positive insight
        if (insights.length === 0) {
            insights.push({
                id: `basic_positive_${Date.now()}`,
                type: 'positive',
                category: 'system',
                title: 'Clean Session',
                description: 'No major issues detected in this recording',
                severity: 'info',
                confidence: 1.0,
                impact: 'Application appears stable',
                recommendation: 'Continue monitoring for potential issues',
                evidence: ['No critical errors found'],
                tags: ['positive', 'stable', 'basic-analysis'],
                automationPotential: 'low',
                businessImpact: 'user_experience',
                icon: 'CheckCircle',
                color: 'green',
                time: duration * 0.5,
                source: 'basic-fallback'
            });
        }

        return insights;
    };

    // Auto-analyze when recording data is available
    useEffect(() => {
        if (autoAnalyze && recording && serviceReady && !analysisComplete && !isAnalyzing) {
            const hasData = (recording.consoleLogs?.length > 0 || 
                           recording.networkLogs?.length > 0 || 
                           recording.detectedIssues?.length > 0);
            
            if (hasData) {
                const recordingData = {
                    id: recording.id || `recording_${Date.now()}`,
                    duration: recording.duration || 300,
                    consoleLogs: recording.consoleLogs || [],
                    networkLogs: recording.networkLogs || [],
                    detectedIssues: recording.detectedIssues || [],
                    metadata: {
                        totalLogs: recording.consoleLogs?.length || 0,
                        totalRequests: recording.networkLogs?.length || 0,
                        totalIssues: recording.detectedIssues?.length || 0,
                        recordingDuration: recording.duration || 300
                    }
                };

                analyzeRecording(recordingData);
            }
        }
    }, [autoAnalyze, recording, serviceReady, analysisComplete, isAnalyzing, analyzeRecording]);

    // Clear cached insights
    const clearCache = useCallback(() => {
        if (storageKey && recording?.id) {
            try {
                localStorage.removeItem(`ai_insights_${storageKey}_${recording.id}`);
                console.log('🗑️ Cleared cached insights');
            } catch (err) {
                console.warn('Failed to clear insight cache:', err);
            }
        }
    }, [storageKey, recording?.id]);

    // Refresh insights (clear cache and re-analyze)
    const refreshInsights = useCallback(async () => {
        clearCache();
        setInsights([]);
        setAnalysisComplete(false);
        setError(null);
        
        if (recording) {
            const recordingData = {
                id: recording.id || `recording_${Date.now()}`,
                duration: recording.duration || 300,
                consoleLogs: recording.consoleLogs || [],
                networkLogs: recording.networkLogs || [],
                detectedIssues: recording.detectedIssues || [],
                metadata: {
                    totalLogs: recording.consoleLogs?.length || 0,
                    totalRequests: recording.networkLogs?.length || 0,
                    totalIssues: recording.detectedIssues?.length || 0,
                    recordingDuration: recording.duration || 300
                }
            };

            return await analyzeRecording(recordingData);
        }
    }, [recording, clearCache, analyzeRecording]);

    // Export insights data
    const exportInsights = useCallback((format = 'json') => {
        if (insights.length === 0) {
            return { success: false, error: 'No insights to export' };
        }

        const exportData = {
            recordingId: recording?.id,
            recordingTitle: recording?.title || 'Untitled Recording',
            generatedAt: new Date().toISOString(),
            totalInsights: insights.length,
            insights: insights.map(insight => ({
                ...insight,
                // Remove internal properties for export
                recordingId: undefined,
                generatedAt: undefined
            })),
            metadata: analysisMetrics,
            summary: {
                criticalIssues: insights.filter(i => i.severity === 'critical').length,
                highPriorityIssues: insights.filter(i => i.severity === 'high').length,
                automationCandidates: insights.filter(i => i.automationPotential === 'high').length,
                categories: [...new Set(insights.map(i => i.category))]
            }
        };

        if (format === 'json') {
            return {
                success: true,
                data: JSON.stringify(exportData, null, 2),
                filename: `recording_insights_${recording?.id || Date.now()}.json`,
                contentType: 'application/json'
            };
        }

        // CSV format
        if (format === 'csv') {
            const csvHeaders = ['Title', 'Severity', 'Category', 'Type', 'Confidence', 'Impact', 'Recommendation', 'Automation Potential'];
            const csvRows = insights.map(insight => [
                insight.title,
                insight.severity,
                insight.category,
                insight.type,
                insight.confidence,
                insight.impact,
                insight.recommendation,
                insight.automationPotential
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');

            return {
                success: true,
                data: csvContent,
                filename: `recording_insights_${recording?.id || Date.now()}.csv`,
                contentType: 'text/csv'
            };
        }

        return { success: false, error: `Unsupported format: ${format}` };
    }, [insights, recording, analysisMetrics]);

    // Get insights by criteria
    const getInsightsByType = useCallback((type) => {
        return insights.filter(insight => insight.type === type);
    }, [insights]);

    const getInsightsBySeverity = useCallback((severity) => {
        return insights.filter(insight => insight.severity === severity);
    }, [insights]);

    const getInsightsByCategory = useCallback((category) => {
        return insights.filter(insight => insight.category === category);
    }, [insights]);

    const getCriticalInsights = useCallback(() => {
        return insights.filter(insight => 
            insight.severity === 'critical' || insight.severity === 'high'
        );
    }, [insights]);

    const getAutomationCandidates = useCallback(() => {
        return insights.filter(insight => insight.automationPotential === 'high');
    }, [insights]);

    // Summary statistics
    const getInsightStats = useCallback(() => {
        return {
            total: insights.length,
            critical: insights.filter(i => i.severity === 'critical').length,
            high: insights.filter(i => i.severity === 'high').length,
            medium: insights.filter(i => i.severity === 'medium').length,
            low: insights.filter(i => i.severity === 'low').length,
            info: insights.filter(i => i.severity === 'info').length,
            automationReady: insights.filter(i => i.automationPotential === 'high').length,
            categories: [...new Set(insights.map(i => i.category))],
            types: [...new Set(insights.map(i => i.type))],
            averageConfidence: insights.length > 0 ? 
                insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0
        };
    }, [insights]);

    return {
        // State
        insights,
        isAnalyzing,
        analysisComplete,
        error,
        analysisMetrics,
        serviceReady,

        // Actions
        analyzeRecording,
        refreshInsights,
        clearCache,
        exportInsights,

        // Getters
        getInsightsByType,
        getInsightsBySeverity,
        getInsightsByCategory,
        getCriticalInsights,
        getAutomationCandidates,
        getInsightStats,

        // Computed values
        hasInsights: insights.length > 0,
        hasCriticalIssues: insights.some(i => i.severity === 'critical' || i.severity === 'high'),
        hasAutomationCandidates: insights.some(i => i.automationPotential === 'high'),
        isUsingFallback: analysisMetrics?.fallbackMode === true,
        
        // Service status
        canAnalyze: serviceReady && !isAnalyzing
    };
};