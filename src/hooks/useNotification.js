// hooks/useNotifications.js
'use client';

import { useCallback } from 'react';
import { useApp } from '../context/AppProvider';
import { getFirebaseErrorMessage, handleFirebaseOperation } from '../utils/firebaseErrorHandler';

export const useNotifications = () => {
    const { actions } = useApp();
    
    // Enhanced notification function
    const showNotification = useCallback((options) => {
        const {
            type = 'info',
            title,
            message,
            description,
            duration,
            error,
            action,
            id
        } = options;
        
        // Process error if provided
        let processedMessage = message || title;
        if (type === 'error' && error) {
            processedMessage = getFirebaseErrorMessage(error);
        }
        
        const notification = {
            id: id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message: processedMessage,
            description,
            duration,
            error, // Keep original error for processing
            action,
            timestamp: new Date().toISOString()
        };
        
        actions.ui.showNotification(notification);
        return notification.id;
    }, [actions.ui]);
    
    // Convenience methods
    const showSuccess = useCallback((message, options = {}) => {
        return showNotification({
            type: 'success',
            message,
            duration: 4000,
            ...options
        });
    }, [showNotification]);
    
    const showError = useCallback((error, options = {}) => {
        return showNotification({
            type: 'error',
            error: typeof error === 'string' ? new Error(error) : error,
            duration: 8000,
            ...options
        });
    }, [showNotification]);
    
    const showWarning = useCallback((message, options = {}) => {
        return showNotification({
            type: 'warning',
            message,
            duration: 6000,
            ...options
        });
    }, [showNotification]);
    
    const showInfo = useCallback((message, options = {}) => {
        return showNotification({
            type: 'info',
            message,
            duration: 5000,
            ...options
        });
    }, [showNotification]);
    
    // Firebase operation wrapper
    const executeFirebaseOperation = useCallback(async (
        operation,
        options = {}
    ) => {
        const {
            successMessage = 'Operation completed successfully',
            showSuccessNotification = false,
            showErrorNotification = true,
            onError
        } = options;
        
        return await handleFirebaseOperation(
            operation,
            successMessage,
            showErrorNotification ? (errorMessage, originalError) => {
                showError(originalError || errorMessage);
                if (onError) onError(errorMessage, originalError);
            } : onError,
            {
                showSuccessNotification,
                showErrorNotification,
                notificationActions: { showNotification }
            }
        );
    }, [showNotification, showError]);
    
    // Remove notification
    const removeNotification = useCallback((id) => {
        actions.ui.removeNotification(id);
    }, [actions.ui]);
    
    return {
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        executeFirebaseOperation,
        removeNotification
    };
};

// utils/notificationHelpers.js
export const createNotificationHelpers = (uiActions) => {
    const showFirebaseError = (error, customMessage = null, options = {}) => {
        const processedMessage = customMessage || getFirebaseErrorMessage(error);
        
        return uiActions.showNotification({
            type: 'error',
            message: processedMessage,
            originalError: error,
            duration: 8000,
            ...options
        });
    };
    
    const showFirebaseSuccess = (message, options = {}) => {
        return uiActions.showNotification({
            type: 'success',
            message,
            duration: 4000,
            ...options
        });
    };
    
    const handleAsyncOperation = async (
        operation,
        successMessage = 'Operation completed',
        options = {}
    ) => {
        const {
            showSuccess = false,
            showError = true,
            onSuccess,
            onError
        } = options;
        
        try {
            const result = await operation();
            
            if (result?.success === false) {
                if (showError) {
                    showFirebaseError(result.error || result, null, options);
                }
                if (onError) onError(result.error || result);
                return result;
            }
            
            if (showSuccess) {
                showFirebaseSuccess(successMessage, options);
            }
            if (onSuccess) onSuccess(result);
            
            return { success: true, data: result };
            
        } catch (error) {
            if (showError) {
                showFirebaseError(error, null, options);
            }
            if (onError) onError(error);
            
            return { success: false, error };
        }
    };
    
    return {
        showFirebaseError,
        showFirebaseSuccess,
        handleAsyncOperation
    };
};

// Enhanced error boundary component
import React from 'react';

export class NotificationErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('NotificationErrorBoundary caught an error:', error, errorInfo);
        
        // Show error notification if showNotification is available
        if (this.props.showNotification) {
            this.props.showNotification({
                type: 'error',
                message: getFirebaseErrorMessage(error),
                description: 'An unexpected error occurred in the notification system',
                duration: 10000
            });
        }
    }
    
    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">
                        Something went wrong with the notification system.
                    </p>
                </div>
            );
        }
        
        return this.props.children;
    }
}