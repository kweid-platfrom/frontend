// hooks/useTestMetrics.js - Complete React Hook for Test Metrics Management
import { useState, useEffect, useCallback, useRef } from 'react';
import testMetricsService from '../services/TestCaseMetricsService';

export const useTestMetrics = (suiteId, sprintId = null, options = {}) => {
    const {
        autoRefresh = true,
        refreshInterval = 30000, // 30 seconds
        enableRealtime = true,
        includeExecutions = false
    } = options;

    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [executions, setExecutions] = useState([]);
    const [executionsLoading, setExecutionsLoading] = useState(false);
    const [automationMetrics, setAutomationMetrics] = useState(null);
    const [aiMetrics, setAiMetrics] = useState(null);

    const unsubscribeRef = useRef(null);
    const executionsUnsubscribeRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    // Load initial metrics
    const loadMetrics = useCallback(async () => {
        if (!suiteId) return;

        try {
            setLoading(true);
            setError(null);

            const [metricsResult, automationResult, aiResult] = await Promise.all([
                testMetricsService.calculateTestCaseMetrics(suiteId, sprintId),
                testMetricsService.calculateAutomationMetrics(suiteId, sprintId),
                testMetricsService.calculateAIMetrics(suiteId, sprintId)
            ]);
            
            if (metricsResult.success) {
                setMetrics(metricsResult.data);
                setLastUpdated(new Date());
            } else {
                setError(metricsResult.error);
            }

            if (automationResult.success) {
                setAutomationMetrics(automationResult.data);
            }

            if (aiResult.success) {
                setAiMetrics(aiResult.data);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [suiteId, sprintId]);

    // Load test executions
    const loadExecutions = useCallback(async () => {
        if (!suiteId || !includeExecutions) return;

        try {
            setExecutionsLoading(true);
            const result = await testMetricsService.firestoreService.getSuiteAssets(
                suiteId,
                'testExecutions'
            );
            
            if (result.success) {
                setExecutions(result.data);
            }
        } catch (err) {
            console.error('Error loading executions:', err);
        } finally {
            setExecutionsLoading(false);
        }
    }, [suiteId, includeExecutions]);

    // Setup real-time subscription
    const setupRealtimeSubscription = useCallback(() => {
        if (!suiteId || !enableRealtime) return;

        // Subscribe to test case changes
        unsubscribeRef.current = testMetricsService.subscribeToTestCaseMetrics(
            suiteId,
            (updatedMetrics) => {
                setMetrics(updatedMetrics);
                setLastUpdated(new Date());
            },
            (error) => {
                console.error('Real-time subscription error:', error);
                setError(error);
            },
            sprintId
        );

        // Subscribe to test executions if needed
        if (includeExecutions) {
            executionsUnsubscribeRef.current = testMetricsService.subscribeToTestExecutions(
                suiteId,
                (updatedExecutions) => {
                    setExecutions(updatedExecutions);
                },
                (error) => {
                    console.error('Executions subscription error:', error);
                }
            );
        }
    }, [suiteId, sprintId, enableRealtime, includeExecutions]);

    // Setup auto-refresh
    const setupAutoRefresh = useCallback(() => {
        if (!autoRefresh || enableRealtime) return;

        refreshIntervalRef.current = setInterval(() => {
            loadMetrics();
            if (includeExecutions) {
                loadExecutions();
            }
        }, refreshInterval);
    }, [autoRefresh, enableRealtime, refreshInterval, loadMetrics, includeExecutions, loadExecutions]);

    // Cleanup subscriptions
    const cleanup = useCallback(() => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        if (executionsUnsubscribeRef.current) {
            executionsUnsubscribeRef.current();
            executionsUnsubscribeRef.current = null;
        }
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    // Initialize
    useEffect(() => {
        loadMetrics();
        if (includeExecutions) {
            loadExecutions();
        }
    }, [loadMetrics, loadExecutions, includeExecutions]);

    // Setup subscriptions and auto-refresh
    useEffect(() => {
        if (enableRealtime) {
            setupRealtimeSubscription();
        } else {
            setupAutoRefresh();
        }

        return cleanup;
    }, [setupRealtimeSubscription, setupAutoRefresh, cleanup, enableRealtime]);

    // Manual refresh
    const refresh = useCallback(async () => {
        await loadMetrics();
        if (includeExecutions) {
            await loadExecutions();
        }
    }, [loadMetrics, includeExecutions, loadExecutions]);

    // Create test case
    const createTestCase = useCallback(async (testCaseData) => {
        if (!suiteId) return { success: false, error: 'Suite ID required' };

        try {
            const result = await testMetricsService.createTestCase(suiteId, testCaseData, sprintId);
            
            if (result.success && !enableRealtime) {
                // Refresh metrics if not using real-time updates
                await refresh();
            }
            
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, sprintId, enableRealtime, refresh]);

    // Update test case
    const updateTestCase = useCallback(async (testCaseId, updates) => {
        if (!suiteId || !testCaseId) return { success: false, error: 'Suite ID and Test Case ID required' };

        try {
            const result = await testMetricsService.updateTestCase(suiteId, testCaseId, updates, sprintId);
            
            if (result.success && !enableRealtime) {
                await refresh();
            }
            
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, sprintId, enableRealtime, refresh]);

    // Execute test case
    const executeTestCase = useCallback(async (testCaseId, executionData) => {
        if (!suiteId || !testCaseId) return { success: false, error: 'Suite ID and Test Case ID required' };

        try {
            const result = await testMetricsService.executeTestCase(suiteId, testCaseId, executionData, sprintId);
            
            if (result.success && !enableRealtime) {
                await refresh();
            }
            
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, sprintId, enableRealtime, refresh]);

    // Track AI generation
    const trackAIGeneration = useCallback(async (generationData) => {
        if (!suiteId) return { success: false, error: 'Suite ID required' };

        try {
            const result = await testMetricsService.trackAIGeneration(suiteId, generationData);
            
            if (result.success && !enableRealtime) {
                await refresh();
            }
            
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, enableRealtime, refresh]);

    // Track screen recording
    const trackScreenRecording = useCallback(async (recordingData) => {
        if (!suiteId) return { success: false, error: 'Suite ID required' };

        try {
            const result = await testMetricsService.trackScreenRecording(suiteId, recordingData);
            
            if (result.success && !enableRealtime) {
                await refresh();
            }
            
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, enableRealtime, refresh]);

    // Generate test report
    const generateTestReport = useCallback(async (reportType = 'summary') => {
        if (!suiteId) return { success: false, error: 'Suite ID required' };

        try {
            const result = await testMetricsService.generateTestReport(suiteId, sprintId, reportType);
            return result;
        } catch (error) {
            return { success: false, error };
        }
    }, [suiteId, sprintId]);

    // Clear cache
    const clearCache = useCallback(() => {
        testMetricsService.clearCache(suiteId);
        refresh();
    }, [suiteId, refresh]);

    // Get combined metrics
    const getCombinedMetrics = useCallback(() => {
        if (!metrics) return null;

        return {
            ...metrics,
            ...automationMetrics,
            ...aiMetrics
        };
    }, [metrics, automationMetrics, aiMetrics]);

    return {
        // Data
        metrics: getCombinedMetrics(),
        rawMetrics: metrics,
        automationMetrics,
        aiMetrics,
        executions,
        lastUpdated,
        
        // Loading states
        loading,
        executionsLoading,
        
        // Error state
        error,
        
        // Actions
        refresh,
        createTestCase,
        updateTestCase,
        executeTestCase,
        trackAIGeneration,
        trackScreenRecording,
        generateTestReport,
        clearCache,
        
        // Utilities
        isRealtime: enableRealtime,
        suiteId,
        sprintId
    };
};

export default useTestMetrics;