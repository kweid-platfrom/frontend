import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useEntitySync } from '../../hooks/old-hooks/useEntitySync';
import { useAuth } from './AuthProvider';
import { useSubscription } from './subscriptionContext';
import firestoreService from '../../services/firestoreService';

// Create the context
const EntityContext = createContext();

// Custom hook to use the context
export const useEntityContext = () => {
    const context = useContext(EntityContext);
    if (!context) {
        throw new Error('useEntityContext must be used within an EntityProvider');
    }
    return context;
};

// Entity Provider Component
export const EntityProvider = ({ children }) => {
    // Auth and subscription contexts
    const { user, isAuthenticated } = useAuth();
    const { activeSuiteId, getAccountInfo } = useSubscription();

    // Entity states
    const [testCases, setTestCases] = useState([]);
    const [bugs, setBugs] = useState([]);
    const [recordings, setRecordings] = useState([]);
    const [relationships, setRelationships] = useState({
        testCaseToBugs: {},
        bugToRecordings: {},
        requirementToTestCases: {},
    });

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [errors, setErrors] = useState({});

    // Get account information - handle both function and direct value
    const accountInfo = useMemo(() => {
        try {
            const info = typeof getAccountInfo === 'function' ? getAccountInfo() : getAccountInfo;
            return info || {};
        } catch (error) {
            console.warn('Error getting account info:', error);
            return {};
        }
    }, [getAccountInfo]);

    // Extract account type and org ID with proper validation
    const accountType = useMemo(() => {
        // Check multiple possible sources for account type
        return accountInfo.accountType || 
               accountInfo.type || 
               accountInfo.account_type ||
               user?.accountType ||
               'suite'; // Default to 'suite' level collections as per FirestoreService
    }, [accountInfo, user]);

    const orgId = useMemo(() => {
        // Check multiple possible sources for org ID
        return accountInfo.orgId || 
               accountInfo.organizationId || 
               accountInfo.org_id ||
               user?.orgId ||
               null;
    }, [accountInfo, user]);

    // Enhanced error handler aligned with FirestoreService error format
    const handleError = useCallback((error, context = 'unknown') => {
        console.error(`Entity Error [${context}]:`, error);
        
        // Handle different error formats
        let errorMessage = 'An unknown error occurred';
        let errorCode = 'unknown';

        if (error?.error?.message) {
            // FirestoreService error format
            errorMessage = error.error.message;
            errorCode = error.error.code || 'unknown';
        } else if (error?.message) {
            // Standard Error object
            errorMessage = error.message;
            errorCode = error.code || 'unknown';
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        const errorEntry = {
            message: errorMessage,
            code: errorCode,
            context,
            timestamp: new Date().toISOString(),
            originalError: error
        };

        setErrors(prev => ({
            ...prev,
            [context]: errorEntry
        }));

        // Optional: You might want to show a toast notification here
        // toast.error(`${context}: ${errorMessage}`);
    }, []);

    // Clear specific error
    const clearError = useCallback((context) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[context];
            return newErrors;
        });
    }, []);

    // Clear all errors
    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Use the entity sync hook
    useEntitySync(
        isAuthenticated,
        activeSuiteId,
        orgId,
        accountType,
        setTestCases,
        setBugs,
        setRecordings,
        setRelationships,
        handleError,
        setIsLoading,
        setIsInitialized
    );

    // CRUD Operations aligned with FirestoreService patterns

    // Test Cases CRUD
    const createTestCase = useCallback(async (testCaseData) => {
        if (!activeSuiteId) {
            const error = new Error('No active suite selected');
            handleError(error, 'createTestCase');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('createTestCase');
            
            const result = await firestoreService.createSuiteAsset(
                activeSuiteId,
                'testCases',
                testCaseData
            );
            
            if (!result.success) {
                handleError(result, 'createTestCase');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'createTestCase');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const updateTestCase = useCallback(async (testCaseId, updates) => {
        if (!activeSuiteId || !testCaseId) {
            const error = new Error('Missing required parameters for update');
            handleError(error, 'updateTestCase');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('updateTestCase');
            
            const collectionPath = `testSuites/${activeSuiteId}/testCases`;
            const result = await firestoreService.updateDocument(collectionPath, testCaseId, updates);
            
            if (!result.success) {
                handleError(result, 'updateTestCase');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'updateTestCase');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const deleteTestCase = useCallback(async (testCaseId) => {
        if (!activeSuiteId || !testCaseId) {
            const error = new Error('Missing required parameters for delete');
            handleError(error, 'deleteTestCase');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('deleteTestCase');
            
            const collectionPath = `testSuites/${activeSuiteId}/testCases`;
            const result = await firestoreService.deleteDocument(collectionPath, testCaseId);
            
            if (!result.success) {
                handleError(result, 'deleteTestCase');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'deleteTestCase');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    // Bugs CRUD
    const createBug = useCallback(async (bugData) => {
        if (!activeSuiteId) {
            const error = new Error('No active suite selected');
            handleError(error, 'createBug');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('createBug');
            
            const result = await firestoreService.createSuiteAsset(
                activeSuiteId,
                'bugs',
                bugData
            );
            
            if (!result.success) {
                handleError(result, 'createBug');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'createBug');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const updateBug = useCallback(async (bugId, updates) => {
        if (!activeSuiteId || !bugId) {
            const error = new Error('Missing required parameters for update');
            handleError(error, 'updateBug');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('updateBug');
            
            const collectionPath = `testSuites/${activeSuiteId}/bugs`;
            const result = await firestoreService.updateDocument(collectionPath, bugId, updates);
            
            if (!result.success) {
                handleError(result, 'updateBug');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'updateBug');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const deleteBug = useCallback(async (bugId) => {
        if (!activeSuiteId || !bugId) {
            const error = new Error('Missing required parameters for delete');
            handleError(error, 'deleteBug');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('deleteBug');
            
            const collectionPath = `testSuites/${activeSuiteId}/bugs`;
            const result = await firestoreService.deleteDocument(collectionPath, bugId);
            
            if (!result.success) {
                handleError(result, 'deleteBug');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'deleteBug');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    // Recordings CRUD
    const createRecording = useCallback(async (recordingData) => {
        if (!activeSuiteId) {
            const error = new Error('No active suite selected');
            handleError(error, 'createRecording');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('createRecording');
            
            const result = await firestoreService.createSuiteAsset(
                activeSuiteId,
                'recordings',
                recordingData
            );
            
            if (!result.success) {
                handleError(result, 'createRecording');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'createRecording');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const updateRecording = useCallback(async (recordingId, updates) => {
        if (!activeSuiteId || !recordingId) {
            const error = new Error('Missing required parameters for update');
            handleError(error, 'updateRecording');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('updateRecording');
            
            const collectionPath = `testSuites/${activeSuiteId}/recordings`;
            const result = await firestoreService.updateDocument(collectionPath, recordingId, updates);
            
            if (!result.success) {
                handleError(result, 'updateRecording');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'updateRecording');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    const deleteRecording = useCallback(async (recordingId) => {
        if (!activeSuiteId || !recordingId) {
            const error = new Error('Missing required parameters for delete');
            handleError(error, 'deleteRecording');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('deleteRecording');
            
            const collectionPath = `testSuites/${activeSuiteId}/recordings`;
            const result = await firestoreService.deleteDocument(collectionPath, recordingId);
            
            if (!result.success) {
                handleError(result, 'deleteRecording');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'deleteRecording');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    // Relationship management
    const createRelationship = useCallback(async (relationshipData) => {
        if (!activeSuiteId) {
            const error = new Error('No active suite selected');
            handleError(error, 'createRelationship');
            return { success: false, error };
        }

        try {
            setIsLoading(true);
            clearError('createRelationship');
            
            // Ensure suite_id is included as required by the hook
            const dataWithSuiteId = {
                ...relationshipData,
                suite_id: activeSuiteId
            };
            
            const result = await firestoreService.createSuiteAsset(
                activeSuiteId,
                'relationships',
                dataWithSuiteId
            );
            
            if (!result.success) {
                handleError(result, 'createRelationship');
            }
            
            return result;
        } catch (error) {
            handleError(error, 'createRelationship');
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [activeSuiteId, handleError, clearError]);

    // Utility functions
    const getTestCaseById = useCallback((testCaseId) => {
        return testCases.find(tc => tc.id === testCaseId) || null;
    }, [testCases]);

    const getBugById = useCallback((bugId) => {
        return bugs.find(bug => bug.id === bugId) || null;
    }, [bugs]);

    const getRecordingById = useCallback((recordingId) => {
        return recordings.find(rec => rec.id === recordingId) || null;
    }, [recordings]);

    const getBugsForTestCase = useCallback((testCaseId) => {
        const bugIds = relationships.testCaseToBugs[testCaseId] || [];
        return bugs.filter(bug => bugIds.includes(bug.id));
    }, [relationships.testCaseToBugs, bugs]);

    const getRecordingsForBug = useCallback((bugId) => {
        const recordingIds = relationships.bugToRecordings[bugId] || [];
        return recordings.filter(rec => recordingIds.includes(rec.id));
    }, [relationships.bugToRecordings, recordings]);

    const getTestCasesForRequirement = useCallback((requirementId) => {
        const testCaseIds = relationships.requirementToTestCases[requirementId] || [];
        return testCases.filter(tc => testCaseIds.includes(tc.id));
    }, [relationships.requirementToTestCases, testCases]);

    // Context value
    const contextValue = useMemo(() => ({
        // State
        testCases,
        bugs,
        recordings,
        relationships,
        isLoading,
        isInitialized,
        errors,
        
        // Account info
        accountType,
        orgId,
        activeSuiteId,
        
        // Test Cases CRUD
        createTestCase,
        updateTestCase,
        deleteTestCase,
        
        // Bugs CRUD
        createBug,
        updateBug,
        deleteBug,
        
        // Recordings CRUD
        createRecording,
        updateRecording,
        deleteRecording,
        
        // Relationships
        createRelationship,
        
        // Utility functions
        getTestCaseById,
        getBugById,
        getRecordingById,
        getBugsForTestCase,
        getRecordingsForBug,
        getTestCasesForRequirement,
        
        // Error management
        clearError,
        clearAllErrors,
        
        // Manual actions (for advanced use cases)
        refreshData: () => {
            // This could trigger a manual refresh if needed
            setIsInitialized(false);
        }
    }), [
        testCases,
        bugs,
        recordings,
        relationships,
        isLoading,
        isInitialized,
        errors,
        accountType,
        orgId,
        activeSuiteId,
        createTestCase,
        updateTestCase,
        deleteTestCase,
        createBug,
        updateBug,
        deleteBug,
        createRecording,
        updateRecording,
        deleteRecording,
        createRelationship,
        getTestCaseById,
        getBugById,
        getRecordingById,
        getBugsForTestCase,
        getRecordingsForBug,
        getTestCasesForRequirement,
        clearError,
        clearAllErrors
    ]);

    return (
        <EntityContext.Provider value={contextValue}>
            {children}
        </EntityContext.Provider>
    );
};