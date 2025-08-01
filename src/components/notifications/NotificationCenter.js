/* eslint-disable react-hooks/exhaustive-deps */
// components/notifications/NotificationCenter.js
'use client';

import React, { useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { useApp } from '../../context/AppProvider';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorHandler';

const NotificationCenter = () => {
    const { state, actions } = useApp();
    const processedNotifications = useRef(new Set());
    const toastIds = useRef(new Map());
    
    // Handle notifications with Sonner
    useEffect(() => {
        const notifications = state.ui.notifications || [];
        
        if (notifications.length === 0) {
            return;
        }

        notifications.forEach(notification => {
            // Skip if already processed
            if (processedNotifications.current.has(notification.id)) {
                return;
            }
            
            // Mark as processed
            processedNotifications.current.add(notification.id);
            
            // Process the message through Firebase error handler
            let processedMessage = notification.message || notification.title || 'Notification';
            let processedDescription = notification.description;
            
            // Enhanced error processing
            if (notification.type === 'error') {
                if (notification.error || notification.originalError) {
                    // Use the error object if provided
                    const errorObj = notification.error || notification.originalError;
                    processedMessage = getFirebaseErrorMessage(errorObj);
                    
                    // Add error details to description in development
                    if (process.env.NODE_ENV === 'development' && !processedDescription) {
                        processedDescription = `Error Code: ${errorObj?.code || 'unknown'}`;
                    }
                } else {
                    // Try to process the message itself as a potential Firebase error
                    const processedError = getFirebaseErrorMessage(processedMessage);
                    // Only use processed error if it's different (meaning it was recognized as a Firebase error)
                    if (processedError !== 'Something went wrong. Please try again.' && 
                        processedError !== processedMessage &&
                        !processedError.startsWith('Debug:')) {
                        processedMessage = processedError;
                    }
                }
            }
            
            // Configure toast options
            const duration = notification.duration || 
                (notification.type === 'error' ? 8000 : 
                 notification.type === 'warning' ? 6000 : 
                 notification.type === 'success' ? 4000 : 5000);
            
            const options = {
                id: notification.id,
                duration,
                description: processedDescription,
                action: notification.action ? {
                    label: notification.action.label,
                    onClick: () => {
                        if (notification.action.onClick) {
                            notification.action.onClick();
                        }
                        handleNotificationDismiss(notification.id);
                    }
                } : undefined,
                onDismiss: () => {
                    handleNotificationDismiss(notification.id);
                },
                onAutoClose: () => {
                    handleNotificationDismiss(notification.id);
                },
                // Add custom styling based on type
                className: `notification-toast notification-${notification.type}`,
                style: {
                    background: notification.type === 'error' ? '#fef2f2' : 
                               notification.type === 'warning' ? '#fffbeb' :
                               notification.type === 'success' ? '#f0fdf4' : 'white',
                    borderColor: notification.type === 'error' ? '#fecaca' : 
                                notification.type === 'warning' ? '#fed7aa' :
                                notification.type === 'success' ? '#bbf7d0' : '#e5e7eb'
                }
            };
            
            // Show toast based on type and store the toast ID
            let toastId;
            try {
                switch (notification.type) {
                    case 'success':
                        toastId = toast.success(processedMessage, options);
                        break;
                    case 'error':
                        toastId = toast.error(processedMessage, options);
                        break;
                    case 'warning':
                        toastId = toast.warning(processedMessage, options);
                        break;
                    case 'info':
                        toastId = toast.info(processedMessage, options);
                        break;
                    default:
                        toastId = toast(processedMessage, options);
                        break;
                }
                
                // Store toast ID for potential manual dismissal
                if (toastId) {
                    toastIds.current.set(notification.id, toastId);
                }
            } catch (error) {
                console.error('Error showing toast notification:', error);
                // Fallback to basic toast
                toastId = toast(processedMessage, { 
                    id: notification.id,
                    duration,
                    onDismiss: () => handleNotificationDismiss(notification.id)
                });
                toastIds.current.set(notification.id, toastId);
            }
        });
    }, [state.ui.notifications]);
    
    // Handle notification dismissal
    const handleNotificationDismiss = (notificationId) => {
        // Remove from processed set
        processedNotifications.current.delete(notificationId);
        // Remove toast ID mapping
        toastIds.current.delete(notificationId);
        // Remove from app state
        if (actions.ui.removeNotification) {
            actions.ui.removeNotification(notificationId);
        } else if (actions.ui.clearNotification) {
            // Fallback method name
            actions.ui.clearNotification(notificationId);
        }
    };
    
    // Handle programmatic dismissal of notifications
    useEffect(() => {
        const currentNotificationIds = new Set(
            (state.ui.notifications || []).map(n => n.id)
        );
        
        // Find notifications that were removed from state
        const dismissedIds = Array.from(processedNotifications.current).filter(
            id => !currentNotificationIds.has(id)
        );
        
        // Dismiss corresponding toasts
        dismissedIds.forEach(id => {
            const toastId = toastIds.current.get(id);
            if (toastId) {
                try {
                    toast.dismiss(toastId);
                } catch (error) {
                    console.warn('Failed to dismiss toast:', error);
                }
            }
            processedNotifications.current.delete(id);
            toastIds.current.delete(id);
        });
    }, [state.ui.notifications]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear all processed notifications
            processedNotifications.current.clear();
            
            // Dismiss all active toasts
            Array.from(toastIds.current.values()).forEach(toastId => {
                try {
                    toast.dismiss(toastId);
                } catch (error) {
                    console.warn('Failed to dismiss toast on cleanup:', error);
                }
            });
            toastIds.current.clear();
        };
    }, []);
    
    return (
        <Toaster
            position="top-center"
            expand={false}
            richColors={true}
            closeButton={true}
            toastOptions={{
                duration: 5000,
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    color: '#374151',
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                },
                className: 'notification-toast',
                actionButtonStyle: {
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                },
                cancelButtonStyle: {
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                }
            }}
            theme="light"
            visibleToasts={5}
            gap={12}
            offset={20}
        />
    );
};

export default NotificationCenter;