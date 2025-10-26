// contexts/AIContext.js - Fixed version with proper model synchronization
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import aiServiceInstance from '../services/aiService';
import { createAIUsageLog } from '../utils/aiMetadataHelper';
import { useApp } from '../context/AppProvider';

const AIContext = createContext(null);

export const AIProvider = ({ children }) => {
    const { state: appState } = useApp();
    
    const [state, setState] = useState({
        // Service status
        isInitialized: false,
        isHealthy: false,
        provider: 'gemini',
        currentModel: aiServiceInstance.currentModel,
        availableModels: [],

        // Loading states for different operations
        isGeneratingTestCases: false,
        isGeneratingBugReport: false,
        isCheckingGrammar: false,
        isAnalyzingAutomation: false,
        isGeneratingReport: false,
        isGeneratingDocumentation: false,

        // Errors
        error: null,
        lastError: null,

        // Current session metrics (real-time, in-memory only)
        tokensUsed: 0,
        totalCost: 0,
        operationsCount: 0,

        // History (session only)
        operationHistory: [], // Last 50 operations

        // Configuration
        apiKeyConfigured: false,
        lastHealthCheck: null
    });

    const isMountedRef = useRef(true);
    const initializationRef = useRef(false);

    // Safe state update
    const safeSetState = useCallback((updater) => {
        if (isMountedRef.current) {
            setState(updater);
        }
    }, []);

    // Log to Firestore
    const logToFirestore = useCallback(async (operationData) => {
        try {
            // Get userId from Firebase Auth
            const userId = auth.currentUser?.uid || appState.auth?.user?.uid;
            const suiteId = appState.suites?.activeSuite?.id;

            if (!userId) {
                console.warn('⚠️ Cannot log AI usage: User not authenticated');
                return;
            }

            if (!suiteId) {
                console.warn('⚠️ No active suite - skipping Firestore logging');
                return;
            }

            // Create usage log with required fields
            const usageLog = createAIUsageLog({
                ...operationData,
                userId,
                suiteId
            });

            const logRef = doc(db, `testSuites/${suiteId}/ai_usage_logs`, usageLog.id);
            
            await setDoc(logRef, {
                ...usageLog,
                created_at: Timestamp.now()
            });

            console.log('✅ AI usage logged to Firestore:', usageLog.id);
        } catch (error) {
            console.error('❌ Failed to log AI usage to Firestore:', error);
            // Don't throw - logging failure shouldn't break AI operations
        }
    }, [appState.auth?.user?.uid, appState.suites?.activeSuite?.id]);

    // Initialize AI services
    const initialize = useCallback(async () => {
        if (initializationRef.current) return state.isInitialized;

        initializationRef.current = true;

        try {
            console.log('🚀 Initializing AI Context...');

            const healthCheck = await aiServiceInstance.testConnection();

            if (healthCheck.success) {
                const modelInfo = aiServiceInstance.getCurrentModelInfo();
                const availableModels = aiServiceInstance.getAvailableModels();

                safeSetState(prev => ({
                    ...prev,
                    isInitialized: true,
                    isHealthy: healthCheck.healthy,
                    provider: 'gemini',
                    currentModel: aiServiceInstance.currentModel, // ← Sync from service
                    availableModels,
                    apiKeyConfigured: modelInfo.apiKeyConfigured,
                    lastHealthCheck: new Date().toISOString(),
                    error: null
                }));

                console.log('✅ AI Context initialized successfully');
                return true;
            } else {
                throw new Error(healthCheck.error || 'Failed to initialize AI service');
            }
        } catch (error) {
            console.error('❌ AI Context initialization failed:', error);
            safeSetState(prev => ({
                ...prev,
                isInitialized: false,
                isHealthy: false,
                error: error.message,
                lastError: {
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    operation: 'initialization'
                }
            }));
            return false;
        } finally {
            initializationRef.current = false;
        }
    }, [safeSetState, state.isInitialized]);

    // Log operation (session-only + Firestore)
    const logOperation = useCallback((operation) => {
        // Session logging
        safeSetState(prev => ({
            ...prev,
            operationHistory: [
                {
                    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                    ...operation
                },
                ...prev.operationHistory
            ].slice(0, 50),
            operationsCount: prev.operationsCount + 1,
            tokensUsed: prev.tokensUsed + (operation.tokensUsed || 0),
            totalCost: prev.totalCost + (operation.cost || 0)
        }));

        // Firestore logging (async, non-blocking)
        const skipFirestoreLogging = [
            'test_cases',
            'bug_report'
        ];

        if (operation.success && 
            operation.shouldLog !== false && 
            !skipFirestoreLogging.includes(operation.type)) {
            
            logToFirestore({
                operationId: operation.operation_id || operation.id,
                operationType: operation.type,
                assetType: operation.assetType,
                assetIds: operation.assetIds || [],
                provider: operation.model?.split('-')[0] || 'gemini',
                model: operation.model,
                tokensUsed: operation.tokensUsed || 0,
                cost: operation.cost || 0,
                success: operation.success,
                promptSummary: operation.promptSummary || '',
                promptLength: operation.promptLength || 0,
            });
        }
    }, [safeSetState, logToFirestore]);

    // Update loading state
    const setLoadingState = useCallback((operation, isLoading) => {
        const loadingStateMap = {
            'test_cases': 'isGeneratingTestCases',
            'bug_report': 'isGeneratingBugReport',
            'grammar': 'isCheckingGrammar',
            'automation': 'isAnalyzingAutomation',
            'report': 'isGeneratingReport',
            'documentation': 'isGeneratingDocumentation'
        };

        const stateKey = loadingStateMap[operation];
        if (stateKey) {
            safeSetState(prev => ({ ...prev, [stateKey]: isLoading }));
        }
    }, [safeSetState]);

    // Generic AI operation wrapper
    const executeAIOperation = useCallback(async (operationType, operationFn, operationName, options = {}) => {
        if (!state.isInitialized) {
            const initialized = await initialize();
            if (!initialized) {
                return {
                    success: false,
                    error: 'AI service not initialized',
                    userMessage: 'Please check your Gemini API key configuration'
                };
            }
        }

        setLoadingState(operationType, true);
        safeSetState(prev => ({ ...prev, error: null }));

        try {
            const result = await operationFn();

            // Prepare operation data
            const operationData = {
                type: operationType,
                name: operationName,
                success: result.success,
                model: result.model || aiServiceInstance.currentModel, // ← Use service instance
                tokensUsed: result.tokensUsed || 0,
                cost: result.cost || 0,
                operation_id: options.operationId,
                promptSummary: options.promptSummary,
                promptLength: options.promptLength,
                shouldLog: options.shouldLog !== false,
            };

            // Add asset info for tracking
            if (operationType === 'test_cases' && result.success && result.data?.testCases) {
                operationData.assetType = 'testCases';
                operationData.testCasesCount = result.data.testCases.length;
            }

            if (operationType === 'bug_report' && result.success) {
                operationData.assetType = 'bugs';
            }

            if (result.success) {
                logOperation(operationData);
            } else {
                logOperation({
                    ...operationData,
                    error: result.error
                });

                safeSetState(prev => ({
                    ...prev,
                    error: result.error || `Failed to ${operationName}`,
                    lastError: {
                        message: result.error || `Failed to ${operationName}`,
                        timestamp: new Date().toISOString(),
                        operation: operationType
                    }
                }));
            }

            return result;
        } catch (error) {
            console.error(`Error in ${operationName}:`, error);

            const errorMessage = error.message || `Failed to ${operationName}`;
            
            logOperation({
                type: operationType,
                name: operationName,
                success: false,
                model: aiServiceInstance.currentModel, // ← Use service instance
                tokensUsed: 0,
                cost: 0,
                error: errorMessage,
                shouldLog: false
            });

            safeSetState(prev => ({
                ...prev,
                error: errorMessage,
                lastError: {
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                    operation: operationType
                }
            }));

            return {
                success: false,
                error: errorMessage,
                userMessage: `Failed to ${operationName}. Please try again.`
            };
        } finally {
            setLoadingState(operationType, false);
        }
    }, [state.isInitialized, initialize, setLoadingState, logOperation, safeSetState]);

    // ============= AI OPERATIONS (unchanged) =============

    const generateTestCases = useCallback(async (prompt, templateConfig = {}) => {
        return executeAIOperation(
            'test_cases',
            () => aiServiceInstance.generateTestCases(prompt, templateConfig),
            'generate test cases',
            {
                promptSummary: prompt.substring(0, 200),
                promptLength: prompt.length,
            }
        );
    }, [executeAIOperation]);

    const generateBugReport = useCallback(async (prompt, consoleError = '', additionalContext = {}) => {
        return executeAIOperation(
            'bug_report',
            () => aiServiceInstance.generateBugReport(prompt, consoleError, additionalContext),
            'generate bug report',
            {
                promptSummary: prompt.substring(0, 200),
                promptLength: prompt.length,
            }
        );
    }, [executeAIOperation]);

    const checkGrammar = useCallback(async (text, options = {}) => {
        return executeAIOperation(
            'grammar',
            () => aiServiceInstance.checkGrammar(text, options),
            'check grammar',
            {
                shouldLog: false
            }
        );
    }, [executeAIOperation]);

    const detectAutomationOpportunities = useCallback(async (testCases) => {
        return executeAIOperation(
            'automation',
            () => aiServiceInstance.detectAutomationOpportunities(testCases),
            'analyze automation opportunities',
            {
                shouldLog: false
            }
        );
    }, [executeAIOperation]);

    const generateQAReport = useCallback(async (reportData, reportType = 'sprint') => {
        return executeAIOperation(
            'report',
            () => aiServiceInstance.generateQAReport(reportData, reportType),
            'generate QA report'
        );
    }, [executeAIOperation]);

    const generateDocumentation = useCallback(async (content, docType = 'test_plan') => {
        return executeAIOperation(
            'documentation',
            () => aiServiceInstance.generateDocumentation(content, docType),
            'generate documentation'
        );
    }, [executeAIOperation]);

    const generateTeamImprovements = useCallback(async (teamData) => {
        return executeAIOperation(
            'team_improvement',
            () => aiServiceInstance.generateTeamImprovements(teamData),
            'generate team improvements',
            {
                shouldLog: false
            }
        );
    }, [executeAIOperation]);

    const generatePlainTextContent = useCallback(async (prompt, options = {}) => {
        return executeAIOperation(
            'plain_text_generation',
            () => aiServiceInstance.callAI(prompt, {
                type: 'document_assistance',
                temperature: options.temperature || 0.7,
                maxTokens: options.maxTokens || 2000,
                logPrompt: false
            }),
            'generate plain text content',
            {
                shouldLog: false
            }
        );
    }, [executeAIOperation]);

    // ============= UTILITY FUNCTIONS =============

    // FIXED: Properly sync model changes between context and service
    const switchModel = useCallback(async (modelName) => {
        try {
            const result = aiServiceInstance.switchModel(modelName);

            if (result.success) {
                // Update context state to match service
                safeSetState(prev => ({
                    ...prev,
                    currentModel: aiServiceInstance.currentModel, // ← Sync from service
                    error: null
                }));

                // Test the new model
                await testHealth();
                
                console.log(`✅ Model switched to ${result.currentModel}`);
            }

            return result;
        } catch (error) {
            const errorMessage = `Failed to switch model: ${error.message}`;
            safeSetState(prev => ({ ...prev, error: errorMessage }));
            return { success: false, error: errorMessage };
        }
    }, [safeSetState]);

    const testHealth = useCallback(async () => {
        try {
            const result = await aiServiceInstance.testConnection();

            safeSetState(prev => ({
                ...prev,
                isHealthy: result.healthy,
                currentModel: aiServiceInstance.currentModel, // ← Always sync
                lastHealthCheck: new Date().toISOString(),
                error: result.success ? null : result.error
            }));

            return result;
        } catch (error) {
            safeSetState(prev => ({
                ...prev,
                isHealthy: false,
                error: error.message
            }));
            return { success: false, healthy: false, error: error.message };
        }
    }, [safeSetState]);

    const getAvailableModels = useCallback(() => {
        return aiServiceInstance.getAvailableModels();
    }, []);

    const getCurrentModelInfo = useCallback(() => {
        return aiServiceInstance.getCurrentModelInfo();
    }, []);

    const clearError = useCallback(() => {
        safeSetState(prev => ({ ...prev, error: null }));
    }, [safeSetState]);

    const clearHistory = useCallback(() => {
        safeSetState(prev => ({
            ...prev,
            operationHistory: [],
            operationsCount: 0
        }));
    }, [safeSetState]);

    const resetSessionMetrics = useCallback(() => {
        safeSetState(prev => ({
            ...prev,
            tokensUsed: 0,
            totalCost: 0,
            operationsCount: 0,
            operationHistory: []
        }));
    }, [safeSetState]);

    const getServiceStatus = useCallback(() => {
        return {
            ...state,
            currentModel: aiServiceInstance.currentModel, // ← Always get from service
            modelInfo: getCurrentModelInfo(),
            canGenerate: state.isInitialized && state.isHealthy && state.apiKeyConfigured,
            isLoading: state.isGeneratingTestCases ||
                state.isGeneratingBugReport ||
                state.isCheckingGrammar ||
                state.isAnalyzingAutomation ||
                state.isGeneratingReport ||
                state.isGeneratingDocumentation
        };
    }, [state, getCurrentModelInfo]);

    useEffect(() => {
        isMountedRef.current = true;

        const initializeContext = async () => {
            try {
                await initialize();
            } catch (error) {
                console.error('Auto-initialization failed:', error);
            }
        };

        initializeContext();

        return () => {
            isMountedRef.current = false;
        };
    }, [initialize]);

    const value = {
        ...state,
        currentModel: aiServiceInstance.currentModel, // ← Always expose current model from service
        canGenerate: state.isInitialized && state.isHealthy && state.apiKeyConfigured,
        isLoading: state.isGeneratingTestCases ||
            state.isGeneratingBugReport ||
            state.isCheckingGrammar ||
            state.isAnalyzingAutomation ||
            state.isGeneratingReport ||
            state.isGeneratingDocumentation,
        isReady: state.isInitialized && state.isHealthy && !state.error,

        // AI Operations
        generateTestCases,
        generateBugReport,
        checkGrammar,
        detectAutomationOpportunities,
        generateQAReport,
        generateDocumentation,
        generateTeamImprovements,
        generatePlainTextContent,

        // Utilities
        switchModel,
        testHealth,
        getAvailableModels,
        getCurrentModelInfo,
        getServiceStatus,
        clearError,
        clearHistory,
        resetSessionMetrics,
        initialize
    };

    return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

export default AIContext;