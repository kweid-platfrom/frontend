// utils/firebaseErrorHandler.js

export const getFirebaseErrorMessage = (error) => {
    // Debug logging to see what we're getting (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.log('Error object:', error);
        console.log('Error type:', typeof error);
        console.log('Error code:', error?.code);
        console.log('Error message:', error?.message);
    }
    
    // Handle different error formats
    let errorCode = '';
    let errorMessage = '';
    
    if (typeof error === 'string') {
        errorCode = error;
        errorMessage = error;
    } else if (error?.code) {
        errorCode = error.code;
        errorMessage = error.message || error.code;
    } else if (error?.message) {
        errorMessage = error.message;
        // Try to extract auth code from message
        const authMatch = errorMessage.match(/auth\/[\w-]+/);
        errorCode = authMatch ? authMatch[0] : errorMessage;
    } else {
        errorMessage = 'Unknown error occurred';
    }
    
    switch (errorCode) {
        // Authentication Errors
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
            return 'Incorrect email or password. Please try again.';
            
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
            
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in instead.';
            
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger password (at least 6 characters).';
            
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
            
        case 'auth/missing-password':
        case 'auth/missing-email':
            return 'Please fill in all required fields.';
            
        // Rate Limiting
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
            
        // Network Issues
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection and try again.';
            
        // Google Sign-in Errors
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled. Please try again.';
            
        case 'auth/popup-blocked':
            return 'Popup was blocked. Please allow popups and try again.';
            
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Please contact support.';
            
        // Password Reset Errors
        case 'auth/expired-action-code':
            return 'This password reset link has expired. Please request a new one.';
            
        case 'auth/invalid-action-code':
            return 'Invalid password reset link. Please request a new one.';
            
        // Profile Update Errors
        case 'auth/requires-recent-login':
            return 'Please sign in again to complete this action.';
            
        // Generic Firestore Errors
        case 'permission-denied':
            return 'You don\'t have permission to perform this action.';
            
        case 'unavailable':
            return 'Service temporarily unavailable. Please try again later.';
            
        case 'deadline-exceeded':
            return 'Request timed out. Please try again.';
            
        default:
            // Check if the message contains known patterns
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
                return 'You don\'t have permission to perform this action.';
            }
            
            // For debugging - show the actual error in development
            if (process.env.NODE_ENV === 'development') {
                return `Debug: ${errorMessage}`;
            }
            
            // Default fallback
            return 'Something went wrong. Please try again.';
    }
};

// Helper function for handling async operations with error handling
export const handleFirebaseOperation = async (operation, successMessage, errorToast = null) => {
    try {
        const result = await operation();
        
        if (result?.success === false) {
            const errorMessage = getFirebaseErrorMessage(result.error || result);
            if (errorToast) {
                errorToast(errorMessage);
            }
            return { success: false, error: errorMessage };
        }
        
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = getFirebaseErrorMessage(error);
        if (errorToast) {
            errorToast(errorMessage);
        }
        return { success: false, error: errorMessage };
    }
};

// React Hook for Firebase operations (optional)
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