// components/notifications/NotificationCenter.js
'use client';

import React, { useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { useAppNotifications } from '../../contexts/AppProvider';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorHandler';

const NotificationCenter = () => {
    const { notifications, removeNotification } = useAppNotifications();
    const processedNotifications = useRef(new Set());
    
    // Handle notifications with Sonner
    useEffect(() => {
        notifications.forEach(notification => {
            // Skip if already processed
            if (processedNotifications.current.has(notification.id)) {
                return;
            }
            
            // Mark as processed
            processedNotifications.current.add(notification.id);
            
            // Process the message through Firebase error handler if it's an error
            let processedMessage = notification.message || notification.title;
            
            if (notification.type === 'error' && notification.error) {
                processedMessage = getFirebaseErrorMessage(notification.error);
            } else if (notification.type === 'error' && !notification.error) {
                // Try to process the message itself as a potential Firebase error
                processedMessage = getFirebaseErrorMessage(processedMessage);
            }
            
            const options = {
                id: notification.id,
                duration: notification.type === 'error' || notification.type === 'warning' ? 8000 : 5000,
                onDismiss: () => {
                    removeNotification(notification.id);
                    processedNotifications.current.delete(notification.id);
                }
            };
            
            // Use appropriate toast method based on type
            switch (notification.type) {
                case 'success':
                    toast.success(processedMessage, options);
                    break;
                case 'error':
                    toast.error(processedMessage, options);
                    break;
                case 'warning':
                    toast.warning(processedMessage, options);
                    break;
                default:
                    toast.info(processedMessage, options);
                    break;
            }
            
            // Remove from context after showing
            removeNotification(notification.id);
        });
    }, [notifications, removeNotification]);
    
    return (
        <Toaster
            position="top-center"
            expand={false}
            richColors={true}
            closeButton={true}
            toastOptions={{
                duration: 5000
            }}
        />
    );
};

export default NotificationCenter;