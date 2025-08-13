// hooks/useRegistration.js - FIXED VERSION with proper atomic transaction
import { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    signInWithCredential,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import firestoreService from '../services';
import { 
    isValidEmail,
    isCommonEmailProvider 
} from '../utils/domainValidation';

export const useRegistration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const validateRegistrationData = (data) => {
        const errors = {};

        if (!data.email) {
            errors.email = 'Email is required';
        } else if (!isValidEmail(data.email)) {
            errors.email = 'Please enter a valid email address';
        } else if (data.accountType === 'organization' && isCommonEmailProvider(data.email)) {
            errors.email = 'Organization accounts require a custom domain email';
        }

        if (!data.password && !data.googleId) {
            errors.password = 'Password is required';
        } else if (!data.googleId && data.password && data.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!data.displayName) {
            errors.displayName = 'Full name is required';
        }

        if (data.accountType === 'organization') {
            if (!data.organizationIndustry) {
                errors.organizationIndustry = 'Industry is required for organization accounts';
            }
            if (!data.organizationName) {
                errors.organizationName = 'Organization name is required';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    const parseDisplayName = (displayName) => {
        if (!displayName) return { firstName: '', lastName: '' };
        
        const nameParts = displayName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        return { firstName, lastName };
    };

    /**
     * FIXED: Use atomic registration service instead of separate calls
     */
    const registerWithEmail = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Starting complete registration with data:', userData);
            
            const validation = validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Step 1: Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            const userId = userCredential.user.uid;
            const currentUser = userCredential.user;
            console.log('✅ Firebase user created:', userId);

            try {
                // Step 2: Parse name components
                const { firstName, lastName } = parseDisplayName(userData.displayName);

                // Step 3: FIXED - Use atomic registration service
                const registrationData = {
                    userId: userId,
                    email: currentUser.email,
                    displayName: userData.displayName,
                    firstName: firstName,
                    lastName: lastName,
                    accountType: userData.accountType,
                    preferences: userData.preferences || {},
                    ...(userData.accountType === 'organization' && {
                        organizationName: userData.organizationName,
                        organizationIndustry: userData.organizationIndustry,
                        organizationSize: userData.organizationSize || 'small'
                    })
                };

                console.log('📋 Using atomic registration with data:', registrationData);

                // FIXED: Single atomic transaction for everything
                const registrationResult = await firestoreService.completeUserRegistration(registrationData);

                if (!registrationResult.success) {
                    throw new Error(`Registration failed: ${registrationResult.error?.message}`);
                }

                console.log('✅ Atomic registration completed successfully');

                // Step 4: Send verification email
                await sendEmailVerification(userCredential.user);
                console.log('✅ Verification email sent');

                // Step 5: Sign out user (they need to verify email)
                await signOut(auth);
                console.log('✅ User signed out for email verification');

                return {
                    success: true,
                    needsVerification: true,
                    accountType: userData.accountType,
                    message: `Registration successful! Please check your email to verify your account, then sign in to ${userData.accountType === 'organization' ? 'access your organization' : 'continue'}.`,
                    data: registrationResult.data
                };

            } catch (registrationError) {
                // Clean up Firebase Auth user if Firestore operations failed
                console.log('Cleaning up Firebase Auth user due to registration failure...');
                try {
                    await currentUser.delete();
                    console.log('✅ Firebase Auth user cleaned up');
                } catch (cleanupError) {
                    console.error('Failed to cleanup Firebase Auth user:', cleanupError);
                }
                
                // Also clean up any partial Firestore data
                try {
                    await firestoreService.cleanupPartialRegistration(userId);
                } catch (cleanupError) {
                    console.error('Failed to cleanup partial registration:', cleanupError);
                }
                
                throw registrationError;
            }

        } catch (error) {
            console.error('Registration error:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            let errorMessage = 'Registration failed. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists. Please sign in instead.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
                case 'permission-denied':
                    errorMessage = 'Permission denied. Please check your account permissions and try again.';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }
            
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const registerWithGoogle = async (userData, credential) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Starting Google registration with data:', userData);
            
            // Step 1: Sign in with Google credential
            const googleCredential = GoogleAuthProvider.credential(credential);
            const userCredential = await signInWithCredential(auth, googleCredential);
            const userId = userCredential.user.uid;
            const currentUser = userCredential.user;
            
            console.log('✅ Google user authenticated:', userId);

            try {
                // Step 2: Parse name components
                const { firstName, lastName } = parseDisplayName(userData.displayName);

                // Step 3: FIXED - Use atomic registration service
                const registrationData = {
                    userId: userId,
                    email: currentUser.email,
                    displayName: userData.displayName,
                    firstName: firstName,
                    lastName: lastName,
                    accountType: userData.accountType,
                    preferences: userData.preferences || {},
                    ...(userData.accountType === 'organization' && {
                        organizationName: userData.organizationName,
                        organizationIndustry: userData.organizationIndustry,
                        organizationSize: userData.organizationSize || 'small'
                    })
                };

                console.log('👤 Using atomic Google registration with data:', registrationData);

                // FIXED: Single atomic transaction for everything
                const registrationResult = await firestoreService.completeUserRegistration(registrationData);

                if (!registrationResult.success) {
                    throw new Error(`Google registration failed: ${registrationResult.error?.message}`);
                }

                console.log('✅ Atomic Google registration completed successfully');

                return {
                    success: true,
                    needsVerification: false, // Google users are already verified
                    accountType: userData.accountType,
                    message: `Welcome! Your ${userData.accountType === 'organization' ? 'organization' : 'account'} has been set up successfully.`,
                    data: registrationResult.data
                };

            } catch (registrationError) {
                // Clean up Firebase Auth user if Firestore operations failed
                console.log('Cleaning up Firebase Auth user due to Google registration failure...');
                try {
                    await currentUser.delete();
                    console.log('Firebase Auth user cleaned up');
                } catch (cleanupError) {
                    console.error('Failed to cleanup Firebase Auth user:', cleanupError);
                }
                
                // Also clean up any partial Firestore data
                try {
                    await firestoreService.cleanupPartialRegistration(userId);
                } catch (cleanupError) {
                    console.error('Failed to cleanup partial Google registration:', cleanupError);
                }
                
                throw registrationError;
            }

        } catch (error) {
            console.error('Google registration error:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            
            let errorMessage = 'Google registration failed. Please try again.';
            
            switch (error.code) {
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'An account with this email already exists with a different sign-in method. Please try signing in with your email and password.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid Google credential. Please try again.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in was cancelled. Please try again.';
                    break;
                case 'permission-denied':
                    errorMessage = 'Permission denied. Please check your account permissions and try again.';
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }
            
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationEmail = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No authenticated user found');
            }

            await sendEmailVerification(user);
            return { success: true };
        } catch (error) {
            console.error('Resend verification error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    return {
        loading,
        error,
        registerWithEmail,
        registerWithGoogle,
        resendVerificationEmail,
        clearError,
        validateRegistrationData
    };
};