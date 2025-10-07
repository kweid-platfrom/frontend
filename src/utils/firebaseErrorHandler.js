'use client'

export const getFirebaseErrorMessage = (error) => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
        console.log('Firebase error details:', {
            error,
            type: typeof error,
            code: error?.code,
            message: error?.message
        });
    }
    
    let errorCode = '';
    let errorMessage = '';
    
    // Normalize error input
    if (typeof error === 'string') {
        errorCode = error;
        errorMessage = error;
    } else if (error?.code) {
        errorCode = error.code;
        errorMessage = error.message || error.code;
    } else if (error?.message) {
        errorMessage = error.message;
        const authMatch = errorMessage.match(/auth\/[\w-]+/);
        errorCode = authMatch ? authMatch[0] : errorMessage;
    } else {
        errorMessage = 'Unknown error occurred';
        errorCode = 'unknown';
    }
    
    // Firestore-specific error messages
    const firestoreErrorMessages = {
        'permission-denied': 'You don\'t have permission to perform this action. Please check your account settings.',
        'not-found': 'The requested resource was not found.',
        'already-exists': 'This resource already exists.',
        'resource-exhausted': 'You\'ve reached your account\'s limit. Please upgrade your plan or try again later.',
        'unavailable': 'Service temporarily unavailable. Please try again later.',
        'deadline-exceeded': 'Request timed out. Please try again.',
        'failed-precondition': 'Operation failed due to invalid state. Please try again.',
        'aborted': 'Operation was aborted. Please try again.',
        'out-of-range': 'Data provided is out of acceptable range.',
        'invalid-argument': 'Invalid data provided. Please check your input.'
    };
    
    // Authentication error messages
    const authErrorMessages = {
        'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
        'auth/wrong-password': 'Incorrect email or password. Please try again.',
        'auth/invalid-credential': 'Incorrect email or password. Please try again.',
        'auth/invalid-login-credentials': 'Incorrect email or password. Please try again.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password (at least 6 characters).',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/missing-password': 'Please provide a password.',
        'auth/missing-email': 'Please provide an email address.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection and try again.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
        'auth/expired-action-code': 'This password reset link has expired. Please request a new one.',
        'auth/invalid-action-code': 'Invalid password reset link. Please request a new one.',
        'auth/requires-recent-login': 'Please sign in again to complete this action.'
    };
    
    // Combine error messages
    const errorMessages = { ...authErrorMessages, ...firestoreErrorMessages };
    
    if (errorMessages[errorCode]) {
        return errorMessages[errorCode];
    }
    
    // Fallback for unhandled errors
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes('password') || lowerMessage.includes('credential')) {
        return 'Incorrect email or password. Please try again.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
        return 'Network error. Please check your connection and try again.';
    }
    if (lowerMessage.includes('user') && lowerMessage.includes('not found')) {
        return 'No account found with this email. Please check your email or sign up.';
    }
    if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
        return 'This email is already registered. Try signing in instead.';
    }
    if (lowerMessage.includes('permission')) {
        return 'You don\'t have permission to perform this action. Please check your account settings.';
    }
    
    // Return raw error message in development for debugging
    if (process.env.NODE_ENV === 'development') {
        return `Debug: ${errorMessage} (Code: ${errorCode})`;
    }
    
    return 'Something went wrong. Please try again.';
};

// Helper function for async operations
export const handleFirebaseOperation = async (operation, successMessage = 'Operation successful', errorToast = null) => {
    try {
        const result = await operation();
        
        if (result?.success === false) {
            const errorMessage = getFirebaseErrorMessage(result.error || result);
            if (errorToast) {
                errorToast(errorMessage);
            }
            return { success: false, error: errorMessage };
        }
        
        return { success: true, data: result, message: successMessage };
    } catch (error) {
        const errorMessage = getFirebaseErrorMessage(error);
        if (errorToast) {
            errorToast(errorMessage);
        }
        return { success: false, error: errorMessage };
    }
};

// React Hook for Firebase operations
import { useState } from 'react';

export const useFirebaseOperation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const executeOperation = async (operation, onSuccess = null, onError = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await operation();
            
            if (result?.success === false) {
                const errorMessage = getFirebaseErrorMessage(result.error || result);
                setError(errorMessage);
                if (onError) onError(errorMessage);
                return { success: false, error: errorMessage };
            }
            
            if (onSuccess) onSuccess(result);
            return { success: true, data: result };
        } catch (error) {
            const errorMessage = getFirebaseErrorMessage(error);
            setError(errorMessage);
            if (onError) onError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };
    
    return { executeOperation, loading, error, setError };
};