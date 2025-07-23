// hooks/useFirestore.js - React hook for Firestore service integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../contexts/AppProvider';
import firestoreService from '../../services/firestoreService';

/**
 * Custom hook for Firestore operations with app context integration
 */
export const useFirestore = () => {
    const { addNotification, isAuthenticated } = useApp();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const subscriptionsRef = useRef(new Set());

    // Helper function to handle operation results
    const handleResult = useCallback((result, successMessage = null, showSuccessNotification = false) => {
        if (result.success) {
            setError(null);
            if (showSuccessNotification && successMessage) {
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: successMessage
                });
            }
            return result.data;
        } else {
            setError(result.error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: result.error.message
            });
            throw new Error(result.error.message);
        }
    }, [addNotification]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // ===== DOCUMENT OPERATIONS =====

    const createDocument = useCallback(async (collectionPath, data, docId = null, successMessage = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createDocument(collectionPath, data, docId);
            return handleResult(result, successMessage, !!successMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getDocument = useCallback(async (collectionPath, docId) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getDocument(collectionPath, docId);
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const updateDocument = useCallback(async (collectionPath, docId, data, successMessage = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.updateDocument(collectionPath, docId, data);
            return handleResult(result, successMessage, !!successMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const deleteDocument = useCallback(async (collectionPath, docId, successMessage = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.deleteDocument(collectionPath, docId);
            return handleResult(result, successMessage, !!successMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const queryDocuments = useCallback(async (collectionPath, constraints = [], orderByField = null, limitCount = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.queryDocuments(collectionPath, constraints, orderByField, limitCount);
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== REAL-TIME SUBSCRIPTIONS =====

    const subscribeToDocument = useCallback((collectionPath, docId, callback, errorCallback = null) => {
        if (!isAuthenticated) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        const unsubscribe = firestoreService.subscribeToDocument(
            collectionPath,
            docId,
            callback,
            errorCallback || ((error) => {
                setError(error.error);
                addNotification({
                    type: 'error',
                    title: 'Subscription Error',
                    message: error.error.message
                });
            })
        );

        if (unsubscribe) {
            subscriptionsRef.current.add(unsubscribe);
        }
        return unsubscribe;
    }, [isAuthenticated, addNotification]);

    const subscribeToCollection = useCallback((collectionPath, constraints = [], callback, errorCallback = null) => {
        if (!isAuthenticated) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        const unsubscribe = firestoreService.subscribeToCollection(
            collectionPath,
            constraints,
            callback,
            errorCallback || ((error) => {
                setError(error.error);
                addNotification({
                    type: 'error',
                    title: 'Subscription Error',
                    message: error.error.message
                });
            })
        );

        if (unsubscribe) {
            subscriptionsRef.current.add(unsubscribe);
        }
        return unsubscribe;
    }, [isAuthenticated, addNotification]);

    // ===== USER OPERATIONS =====

    const createOrUpdateUserProfile = useCallback(async (userData, successMessage = 'Profile updated successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createOrUpdateUserProfile(userData);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getUserProfile = useCallback(async (userId = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getUserProfile(userId);
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const subscribeToUserProfile = useCallback((callback, errorCallback = null) => {
        if (!isAuthenticated) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        const unsubscribe = firestoreService.subscribeToUserProfile(
            callback,
            errorCallback || ((error) => {
                setError(error.error);
                addNotification({
                    type: 'error',
                    title: 'Profile Subscription Error',
                    message: error.error.message
                });
            })
        );

        if (unsubscribe) {
            subscriptionsRef.current.add(unsubscribe);
        }
        return unsubscribe;
    }, [isAuthenticated, addNotification]);

    // ===== ORGANIZATION OPERATIONS =====

    const createOrganization = useCallback(async (orgData, successMessage = 'Organization created successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createOrganization(orgData);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getUserOrganizations = useCallback(async () => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getUserOrganizations();
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== TEST SUITE OPERATIONS =====

    const createTestSuite = useCallback(async (suiteData, successMessage = 'Test suite created successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createTestSuite(suiteData);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getUserTestSuites = useCallback(async () => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getUserTestSuites();
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const subscribeToUserTestSuites = useCallback((callback, errorCallback = null) => {
        if (!isAuthenticated) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        const unsubscribe = firestoreService.subscribeToUserTestSuites(
            callback,
            errorCallback || ((error) => {
                setError(error.error);
                addNotification({
                    type: 'error',
                    title: 'Test Suites Subscription Error',
                    message: error.error.message
                });
            })
        );

        if (unsubscribe) {
            subscriptionsRef.current.add(unsubscribe);
        }
        return unsubscribe;
    }, [isAuthenticated, addNotification]);

    // ===== SUITE ASSETS OPERATIONS =====

    const createSuiteAsset = useCallback(async (suiteId, assetType, assetData, sprintId = null, successMessage = 'Asset created successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createSuiteAsset(suiteId, assetType, assetData, sprintId);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getSuiteAssets = useCallback(async (suiteId, assetType, sprintId = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getSuiteAssets(suiteId, assetType, sprintId);
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const subscribeToSuiteAssets = useCallback((suiteId, assetType, callback, errorCallback = null, sprintId = null) => {
        if (!isAuthenticated) {
            if (errorCallback) {
                errorCallback({ success: false, error: { message: 'User not authenticated' } });
            }
            return null;
        }

        const unsubscribe = firestoreService.subscribeToSuiteAssets(
            suiteId,
            assetType,
            callback,
            errorCallback || ((error) => {
                setError(error.error);
                addNotification({
                    type: 'error',
                    title: 'Suite Assets Subscription Error',
                    message: error.error.message
                });
            }),
            sprintId
        );

        if (unsubscribe) {
            subscriptionsRef.current.add(unsubscribe);
        }
        return unsubscribe;
    }, [isAuthenticated, addNotification]);

    // ===== SPRINT OPERATIONS =====

    const createSprint = useCallback(async (suiteId, sprintData, successMessage = 'Sprint created successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createSprint(suiteId, sprintData);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    const getSuiteSprints = useCallback(async (suiteId) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.getSuiteSprints(suiteId);
            return handleResult(result);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== ACTIVITY LOGS =====

    const createActivityLog = useCallback(async (suiteId, logData, successMessage = null) => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.createActivityLog(suiteId, logData);
            return handleResult(result, successMessage, !!successMessage);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== BATCH OPERATIONS =====

    const executeBatch = useCallback(async (operations, successMessage = 'Batch operations completed successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.executeBatch(operations);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== TRANSACTION OPERATIONS =====

    const executeTransaction = useCallback(async (transactionFunction, successMessage = 'Transaction completed successfully') => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        setLoading(true);
        try {
            const result = await firestoreService.executeTransaction(transactionFunction);
            return handleResult(result, successMessage, true);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, handleResult]);

    // ===== UTILITY METHODS =====

    // Expose utility methods from service
    const getCurrentUserId = useCallback(() => {
        return firestoreService.getCurrentUserId();
    }, []);

    const getCurrentUser = useCallback(() => {
        return firestoreService.getCurrentUser();
    }, []);

    const createDocRef = useCallback((collectionPath, ...pathSegments) => {
        return firestoreService.createDocRef(collectionPath, ...pathSegments);
    }, []);

    const createCollectionRef = useCallback((collectionPath) => {
        return firestoreService.createCollectionRef(collectionPath);
    }, []);

    // ===== CLEANUP =====

    // Clean up all subscriptions when component unmounts
    useEffect(() => {
        const subscriptions = subscriptionsRef.current;
        return () => {
            subscriptions.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            subscriptions.clear();
        };
    }, []);

    // Clean up subscriptions when authentication status changes
    useEffect(() => {
        if (!isAuthenticated) {
            const subscriptions = subscriptionsRef.current;
            subscriptions.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            subscriptions.clear();
        }
    }, [isAuthenticated]);

    // Return all methods and state
    return {
        // State
        loading,
        error,
        clearError,

        // Generic CRUD operations
        createDocument,
        getDocument,
        updateDocument,
        deleteDocument,
        queryDocuments,

        // Real-time subscriptions
        subscribeToDocument,
        subscribeToCollection,

        // User operations
        createOrUpdateUserProfile,
        getUserProfile,
        subscribeToUserProfile,

        // Organization operations
        createOrganization,
        getUserOrganizations,

        // Test suite operations
        createTestSuite,
        getUserTestSuites,
        subscribeToUserTestSuites,

        // Suite assets operations
        createSuiteAsset,
        getSuiteAssets,
        subscribeToSuiteAssets,

        // Sprint operations
        createSprint,
        getSuiteSprints,

        // Activity logs
        createActivityLog,

        // Batch operations
        executeBatch,
        executeTransaction,

        // Utility methods
        getCurrentUserId,
        getCurrentUser,
        createDocRef,
        createCollectionRef,

        // Authentication status
        isAuthenticated
    };
};

export default useFirestore;