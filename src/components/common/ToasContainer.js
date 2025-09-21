import React, { useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

const Toast = ({ toast }) => {
    const { id, type, message, duration } = toast;

    // Convert raw error messages to user-friendly ones
    const displayMessage = type === 'error' ? getFirebaseErrorMessage(message) : message;

    useEffect(() => {
        const timer = setTimeout(() => {
            // Automatically remove the toast after the specified duration
        }, duration || 3500);

        return () => clearTimeout(timer);
    }, [id, duration ]);

    const getToastStyles = () => {
        const baseStyles = "flex items-center p-4 mb-3 text-sm rounded-lg shadow-lg border";
        
        switch (type) {
            case 'success':
                return `${baseStyles} text-green-800 bg-green-50 border-green-200`;
            case 'error':
                return `${baseStyles} text-red-800 bg-red-50 border-red-200`;
            case 'warning':
                return `${baseStyles} text-orange-800 bg-orange-50 border-orange-200`;
            case 'info':
            default:
                return `${baseStyles} text-blue-800 bg-blue-50 border-blue-200`;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 mr-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0v3a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 0 11-16 0 8 0 0116 0zm-7-4a1 0 11-2 0 1 1 0 012 0zM9 9a1 0 000 2v3a1 0 001 1h1a1 0 100-2v-3a1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className={`${getToastStyles()} transform transition-all duration-300 ease-in-out animate-slide-in-right`}>
            {getIcon()}
            <div className="flex-1">
                {displayMessage}
            </div>
        </div>
    );
};

const ToastContainer = () => {
    const { state } = useApp();
    const { alerts } = state.app;

    if (!alerts?.length) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
            {alerts.map((alert) => (
                <Toast
                    key={alert.id}
                    toast={alert}
                />
            ))}
        </div>
    );
};

export default ToastContainer;