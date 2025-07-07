// components/notifications/NotificationCenter.js
'use client';

import React, { useEffect } from 'react';
import { useAppNotifications } from '../../contexts/AppProvider';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const NotificationCenter = () => {
    const { notifications, removeNotification } = useAppNotifications();
    
    // Auto-remove notifications after timeout
    useEffect(() => {
        const timeouts = notifications.map(notification => {
            if (notification.type === 'success' || notification.type === 'info') {
                return setTimeout(() => {
                    removeNotification(notification.id);
                }, 5000);
            }
            return null;
        }).filter(Boolean);
        
        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [notifications, removeNotification]);
    
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };
    
    const getNotificationStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };
    
    if (notifications.length === 0) return null;
    
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.slice(0, 5).map((notification) => (
                <div
                    key={notification.id}
                    className={`
                        max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out
                        ${getNotificationStyles(notification.type)}
                    `}
                >
                    <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                                {notification.title}
                            </div>
                            {notification.message && (
                                <div className="text-sm mt-1 opacity-90">
                                    {notification.message}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationCenter;