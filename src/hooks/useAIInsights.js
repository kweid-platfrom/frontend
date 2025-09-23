// hooks/useAIInsights.js - Fixed to prevent infinite loops
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppProvider';

export const useAIInsights = (config = {}) => {
  const {
    refreshInterval = 5, // minutes
    autoRefresh = false, // Default to false to prevent issues
    maxInsights = 10,
    includeMetrics = true
  } = config;

  const { bugs, testCases, aiMetrics } = useApp();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Use refs to prevent infinite loops
  const bugsRef = useRef(bugs);
  const testCasesRef = useRef(testCases);
  const aiMetricsRef = useRef(aiMetrics);
  const refreshTimeoutRef = useRef(null);

  // Update refs when data changes
  useEffect(() => {
    bugsRef.current = bugs;
  }, [bugs]);

  useEffect(() => {
    testCasesRef.current = testCases;
  }, [testCases]);

  useEffect(() => {
    aiMetricsRef.current = aiMetrics;
  }, [aiMetrics]);

  // Generate insights from current data - STABLE function
  const generateInsights = useCallback(() => {
    const currentInsights = [];
    const now = new Date();
    const currentBugs = bugsRef.current || [];
    const currentTestCases = testCasesRef.current || [];
    const currentMetrics = aiMetricsRef.current;

    // Bug-related insights
    if (currentBugs.length > 0) {
      const criticalBugs = currentBugs.filter(b => 
        b.severity === 'critical' || b.priority === 'P1'
      );
      
      const recentBugs = currentBugs.filter(b => {
        const created = new Date(b.created_at || b.createdAt);
        const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });

      if (criticalBugs.length > 0) {
        currentInsights.push({
          id: `critical-bugs-${criticalBugs.length}`,
          type: 'alert',
          severity: 'high',
          title: 'Critical Issues Detected',
          message: `${criticalBugs.length} critical bugs require immediate attention`,
          actionable: true,
          data: { count: criticalBugs.length }
        });
      }

      if (recentBugs.length > 3) {
        currentInsights.push({
          id: `recent-bugs-${recentBugs.length}`,
          type: 'trend',
          severity: 'medium',
          title: 'Increasing Bug Reports',
          message: `${recentBugs.length} new bugs reported in the last 7 days`,
          actionable: true,
          data: { count: recentBugs.length, trend: 'increasing' }
        });
      }
    }

    // Test case insights
    if (currentTestCases.length > 0) {
      const failedTests = currentTestCases.filter(tc => tc.status === 'failed');
      const blockedTests = currentTestCases.filter(tc => tc.status === 'blocked');
      const passRate = currentTestCases.length > 0 ? 
        ((currentTestCases.length - failedTests.length) / currentTestCases.length) * 100 : 0;

      if (passRate < 70) {
        currentInsights.push({
          id: `low-pass-rate-${Math.round(passRate)}`,
          type: 'warning',
          severity: 'medium',
          title: 'Low Test Pass Rate',
          message: `Current pass rate is ${Math.round(passRate)}% - consider reviewing test strategy`,
          actionable: true,
          data: { passRate, failed: failedTests.length, total: currentTestCases.length }
        });
      }

      if (blockedTests.length > 0) {
        currentInsights.push({
          id: `blocked-tests-${blockedTests.length}`,
          type: 'info',
          severity: 'low',
          title: 'Blocked Test Cases',
          message: `${blockedTests.length} test cases are currently blocked`,
          actionable: true,
          data: { count: blockedTests.length }
        });
      }
    }

    // AI metrics insights
    if (includeMetrics && currentMetrics?.efficiency < 60) {
      currentInsights.push({
        id: `low-ai-efficiency-${Math.round(currentMetrics.efficiency)}`,
        type: 'suggestion',
        severity: 'low',
        title: 'AI Usage Optimization',
        message: `AI efficiency at ${Math.round(currentMetrics.efficiency)}% - optimize usage`,
        actionable: true,
        data: { efficiency: currentMetrics.efficiency }
      });
    }

    return currentInsights.slice(0, maxInsights);
  }, [maxInsights, includeMetrics]);

  // Refresh insights - STABLE function
  const refreshInsights = useCallback(() => {
    setLoading(true);
    
    try {
      const newInsights = generateInsights();
      setInsights(newInsights);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    } finally {
      setLoading(false);
    }
  }, [generateInsights]);

  // Initial load - only run once when component mounts
  useEffect(() => {
    refreshInsights();
  }, []); // Empty dependency array

  // Data change handler - debounced to prevent excessive updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshInsights();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [bugs?.length, testCases?.length, aiMetrics?.efficiency]);

  // Auto-refresh setup - FIXED to prevent infinite loops
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshInsights();
        
        // Set up recurring refresh
        const interval = setInterval(refreshInsights, refreshInterval * 60 * 1000);
        
        return () => {
          clearInterval(interval);
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
        };
      }, refreshInterval * 60 * 1000);

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]); // Only depend on config, not refreshInsights

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    insights,
    loading,
    lastRefresh,
    refreshInsights
  };
};
