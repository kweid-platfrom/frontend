// hooks/useAIAnalysis.js
import { useState, useCallback } from 'react';
import { useApp } from '../context/AppProvider';
import { aiHelpers } from '../utils/aiHelpers';

export const useAIAnalysis = () => {
  const { actions } = useApp();
  const [operations, setOperations] = useState({});

  const setOperationState = useCallback((operationId, state) => {
    setOperations(prev => ({
      ...prev,
      [operationId]: { ...prev[operationId], ...state }
    }));
  }, []);

  const executeAnalysis = useCallback(async (analysisType, data, config = {}) => {
    const operationId = `${analysisType}-${Date.now()}`;
    
    setOperationState(operationId, { 
      loading: true, 
      error: null, 
      result: null 
    });

    try {
      let result;
      
      switch (analysisType) {
        case 'bug-severity':
          result = await actions.ai.assessBugSeverity(data, config);
          break;
        case 'defect-trends':
          result = await actions.ai.analyzeDefectTrends(data, config.timeframe);
          break;
        case 'test-priority':
          result = await actions.ai.prioritizeTests(data, config);
          break;
        case 'requirements':
          result = await actions.ai.analyzeRequirements(data, config);
          break;
        case 'test-generation':
          result = await actions.ai.generateTestCases(data, config);
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      const validation = aiHelpers.validateAIResponse(result);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setOperationState(operationId, { 
        loading: false, 
        result: result.data 
      });

      return { success: true, data: result.data, operationId };

    } catch (error) {
      setOperationState(operationId, { 
        loading: false, 
        error: error.message 
      });

      return { success: false, error: error.message, operationId };
    }
  }, [actions.ai, setOperationState]);

  const getOperationState = useCallback((operationId) => {
    return operations[operationId] || { loading: false, error: null, result: null };
  }, [operations]);

  const clearOperation = useCallback((operationId) => {
    setOperations(prev => {
      const { [operationId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    executeAnalysis,
    getOperationState,
    clearOperation,
    operations
  };
};