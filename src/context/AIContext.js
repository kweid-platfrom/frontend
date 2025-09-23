// contexts/AIContext.js - Add to your existing AppProvider
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import aiService from '../services/aiService';

export const AIContext = createContext();

// Add these to your existing AppProvider
export const useAIContextValues = () => {
  const [aiState, setAIState] = useState({
    isHealthy: false,
    lastHealthCheck: null,
    suggestions: [],
    metrics: null,
    loading: false,
    error: null
  });

  const [aiOperations, setAIOperations] = useState({
    analyzing: false,
    generating: false,
    prioritizing: false,
    improving: false,
    assessing: false
  });

  // Initialize AI service
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const healthResult = await aiService.testConnection();
        setAIState(prev => ({
          ...prev,
          isHealthy: healthResult.success,
          lastHealthCheck: new Date().toISOString()
        }));
      } catch (error) {
        console.error('AI initialization failed:', error);
        setAIState(prev => ({
          ...prev,
          isHealthy: false,
          error: error.message
        }));
      }
    };

    initializeAI();
  }, []);

  // Add suggestion
  const addSuggestion = useCallback((suggestion) => {
    setAIState(prev => ({
      ...prev,
      suggestions: [...prev.suggestions, {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...suggestion
      }]
    }));
  }, []);

  // Remove suggestion
  const dismissSuggestion = useCallback((suggestionId) => {
    setAIState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));
  }, []);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setAIState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  // Update operation status
  const setOperationStatus = useCallback((operation, status) => {
    setAIOperations(prev => ({
      ...prev,
      [operation]: status
    }));
  }, []);

  // Load AI metrics
  const loadAIMetrics = useCallback(async (dateRange = 30) => {
    try {
      const result = await aiService.getEnhancedAIMetrics(dateRange);
      if (result.success) {
        setAIState(prev => ({
          ...prev,
          metrics: result.data
        }));
      }
      return result;
    } catch (error) {
      console.error('Failed to load AI metrics:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    // State
    aiState,
    aiOperations,
    
    // Actions
    addSuggestion,
    dismissSuggestion,
    clearSuggestions,
    setOperationStatus,
    loadAIMetrics,
    
    // Service reference
    aiService
  };
};

// Hook to use AI context
export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

// ================== SPECIALIZED HOOKS ==================

// Hook for smart AI suggestions (proactive)
export const useAISuggestions = (pageType) => {
  const { addSuggestion, aiState } = useAI();
  const [monitoredData, setMonitoredData] = useState(null);

  // Monitor data changes and trigger AI suggestions
  useEffect(() => {
    if (!monitoredData || !aiState.isHealthy) return;

    const checkForSuggestions = async () => {
      try {
        switch (pageType) {
          case 'test-management':
            await checkTestPrioritySuggestions(monitoredData);
            break;
          case 'documents':
            await checkDocumentQualitySuggestions(monitoredData);
            break;
          case 'bug-management':
            await checkBugSeveritySuggestions(monitoredData);
            break;
        }
      } catch (error) {
        console.error('AI suggestion check failed:', error);
      }
    };

    const timer = setTimeout(checkForSuggestions, 2000); // Debounce
    return () => clearTimeout(timer);
  }, [monitoredData, pageType, aiState.isHealthy]);

  const checkTestPrioritySuggestions = async (testCases) => {
    if (testCases.length > 5) {
      const result = await aiService.prioritizeTests(testCases, { autoSuggest: true });
      if (result.success && result.data.prioritizedTests) {
        const topTest = result.data.prioritizedTests[0];
        if (topTest.priorityScore > 85) {
          addSuggestion({
            type: 'test-priority',
            severity: 'high',
            message: `Run "${topTest.title}" first - critical priority (${topTest.priorityScore}/100)`,
            data: result.data,
            actions: [
              {
                label: 'Apply Priority',
                action: 'apply-priority'
              },
              {
                label: 'View Analysis',
                action: 'view-analysis'
              }
            ]
          });
        }
      }
    }
  };

  const checkDocumentQualitySuggestions = async (documentContent) => {
    if (documentContent && documentContent.length > 200) {
      const result = await aiService.analyzeRequirements(documentContent);
      if (result.success && result.data.summary.criticalIssues > 0) {
        addSuggestion({
          type: 'document-quality',
          severity: result.data.summary.criticalIssues > 3 ? 'high' : 'medium',
          message: `${result.data.summary.criticalIssues} critical issues found that could affect testing`,
          data: result.data,
          actions: [
            {
              label: 'Fix Issues',
              action: 'improve-document'
            },
            {
              label: 'View Details',
              action: 'view-analysis'
            }
          ]
        });
      }
    }
  };

  const checkBugSeveritySuggestions = async (bugData) => {
    if (bugData && !bugData.severity) {
      const result = await aiService.assessBugSeverity(bugData);
      if (result.success) {
        const assessment = result.data.assessment;
        if (assessment.severity === 'Critical' || assessment.priority === 'P1') {
          addSuggestion({
            type: 'bug-severity',
            severity: 'high',
            message: `AI suggests ${assessment.severity} severity, ${assessment.priority} priority`,
            data: result.data,
            actions: [
              {
                label: 'Apply Assessment',
                action: 'apply-severity'
              },
              {
                label: 'View Reasoning',
                action: 'view-analysis'
              }
            ]
          });
        }
      }
    }
  };

  return {
    suggestions: aiState.suggestions.filter(s => s.type.includes(pageType.split('-')[0])),
    monitorData: setMonitoredData
  };
};

// Hook for on-demand AI operations
export const useAIOperations = () => {
  const { aiOperations, setOperationStatus } = useAI();

  const executeOperation = async (operationType, aiMethod, ...args) => {
    setOperationStatus(operationType, true);
    try {
      const result = await aiMethod(...args);
      return result;
    } catch (error) {
      console.error(`AI operation ${operationType} failed:`, error);
      return { success: false, error: error.message };
    } finally {
      setOperationStatus(operationType, false);
    }
  };

  const analyzeRequirements = async (requirements, context) => 
    executeOperation('analyzing', aiService.analyzeRequirements, requirements, context);

  const generateTestCases = async (prompt, config) =>
    executeOperation('generating', aiService.generateTestCases, prompt, config);

  const prioritizeTests = async (tests, context) =>
    executeOperation('prioritizing', aiService.prioritizeTests, tests, context);

  const improveDocumentation = async (document, type, options) =>
    executeOperation('improving', aiService.improveDocumentation, document, type, options);

  const assessBugSeverity = async (bugData, context) =>
    executeOperation('assessing', aiService.assessBugSeverity, bugData, context);

  const generateTestData = async (requirements, specs) =>
    executeOperation('generating', aiService.generateTestData, requirements, specs);

  const analyzeDefectTrends = async (defectData, timeframe) =>
    executeOperation('analyzing', aiService.analyzeDefectTrends, defectData, timeframe);

  return {
    // Operation states
    loading: aiOperations,
    
    // Methods
    analyzeRequirements,
    generateTestCases,
    prioritizeTests,
    improveDocumentation,
    assessBugSeverity,
    generateTestData,
    analyzeDefectTrends
  };
};

// Hook for AI metrics and reporting
export const useAIMetrics = () => {
  const { aiState, loadAIMetrics } = useAI();

  const exportReport = async (format = 'json', dateRange = 30) => {
    try {
      const result = await aiService.exportEnhancedAIReport(format, dateRange);
      if (result.success) {
        // Create download
        const blob = new Blob([result.data], { type: result.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      return result;
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    metrics: aiState.metrics,
    loadMetrics: loadAIMetrics,
    exportReport
  };
};

// Hook for AI health monitoring
export const useAIHealth = () => {
  const { aiState } = useAI();

  const checkHealth = async () => {
    try {
      const result = await aiService.testConnection();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    isHealthy: aiState.isHealthy,
    lastCheck: aiState.lastHealthCheck,
    error: aiState.error,
    checkHealth
  };
};