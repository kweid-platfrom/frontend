// hooks/useRegistration.js
import { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import firestoreService from '../services/firestoreService';
import { isCommonEmailProvider } from '../utils/domainValidation';

export const useRegistration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);

    const googleProvider = new GoogleAuthProvider();

    const validateRegistrationData = (data) => {
        const errors = {};

        if (!data.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!data.password && !data.isGoogleSSO) {
            errors.password = 'Password is required';
        } else if (!data.isGoogleSSO && data.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (!data.displayName) {
            errors.displayName = 'Display name is required';
        }

        if (!data.accountType) {
            errors.accountType = 'Please select an account type';
        }

        // Organization-specific validation
        if (data.accountType === 'organization') {
            if (isCommonEmailProvider(data.email)) {
                errors.email = 'Organization accounts require a custom domain email (not Gmail, Yahoo, etc.)';
            }

            if (!data.organizationData?.name) {
                errors.organizationName = 'Organization name is required';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    const storePendingRegistration = async (userData, authProvider = 'email') => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No authenticated user found');

            const pendingData = {
                accountType: userData.accountType,
                displayName: userData.displayName,
                organizationData: userData.organizationData || null,
                preferences: userData.preferences || {},
                authProvider,
                createdAt: new Date().toISOString(),
                ttl: authProvider === 'google' ? 24 : 48 // hours
            };

            const result = await firestoreService.createDocument(
                'pendingRegistrations',
                pendingData,
                userId
            );

            if (!result.success) {
                throw new Error(result.error.message);
            }

            return result;
        } catch (error) {
            console.error('Error storing pending registration:', error);
            throw error;
        }
    };

    const registerWithEmail = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate input data
            const validation = validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Create Firebase Auth account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            // Store pending registration data
            await storePendingRegistration(userData, 'email');

            // Send verification email
            await sendEmailVerification(userCredential.user);

            setPendingVerification(true);
            setRegistrationData({
                email: userData.email,
                accountType: userData.accountType,
                displayName: userData.displayName
            });

            return {
                success: true,
                user: userCredential.user,
                needsVerification: true
            };

        } catch (error) {
            console.error('Email registration error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoading(false);
        }
    };

    const registerWithGoogle = async (accountTypeData) => {
        setLoading(true);
        setError(null);

        try {
            // Sign in with Google
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (!user.emailVerified) {
                throw new Error('Google account email is not verified');
            }

            const userData = {
                email: user.email,
                displayName: user.displayName || accountTypeData.displayName,
                accountType: accountTypeData.accountType,
                organizationData: accountTypeData.organizationData,
                preferences: accountTypeData.preferences || {}
            };

            // Validate the data (especially for organization accounts)
            const validation = validateRegistrationData({ ...userData, isGoogleSSO: true });
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Store pending registration data
            await storePendingRegistration(userData, 'google');

            // Complete registration immediately since Google email is verified
            const completionResult = await completeRegistration();

            return {
                success: true,
                user: user,
                needsVerification: false,
                completionResult
            };

        } catch (error) {
            console.error('Google registration error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Add this debugging to your completeRegistration method in useRegistration.js
    const completeRegistration = async () => {
        setLoading(true);
        setError(null);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('No authenticated user found');
            }

            // Get pending registration data
            const pendingResult = await firestoreService.getDocument('pendingRegistrations', userId);
            if (!pendingResult.success) {
                throw new Error('No pending registration found');
            }

            const pendingData = pendingResult.data;
            const currentUser = auth.currentUser;

            console.log('=== REGISTRATION DEBUG ===');
            console.log('Pending data from DB:', pendingData);
            console.log('Account type from pending data:', pendingData.accountType);

            // Prepare user data - EXPLICITLY preserve account_type
            const userData = {
                user_id: userId,
                email: currentUser.email,
                display_name: pendingData.displayName,
                account_type: pendingData.accountType,  // Make sure this is preserved
                preferences: pendingData.preferences || {},
                authProvider: pendingData.authProvider
            };

            console.log('User data being sent to createOrUpdateUserProfile:', userData);
            console.log('Account type in userData:', userData.account_type);

            // Create user profile
            const userResult = await firestoreService.createOrUpdateUserProfile(userData);
            if (!userResult.success) {
                throw new Error(`Failed to create user profile: ${userResult.error.message}`);
            }

            console.log('User profile creation result:', userResult);
            console.log('Final user data account_type:', userResult.data?.account_type);

            let accountResult = null;
            let orgResult = null;

            // Create account based on type
            if (pendingData.accountType === 'individual') {
                console.log('Creating individual account...');
                const individualData = {
                    user_id: userId,
                    subscription: {
                        plan: 'trial',
                        status: 'trial_active',
                        trial_starts_at: new Date().toISOString(),
                        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        features: {
                            maxSuites: 5,
                            maxTestCasesPerSuite: 50,
                            canCreateTestCases: true,
                            canUseRecordings: true,
                            canUseAutomation: true,
                            canInviteTeam: true,
                            canExportReports: true,
                            canCreateOrganizations: true,
                            advancedAnalytics: true,
                            prioritySupport: false
                        }
                    }
                };

                accountResult = await firestoreService.createDocument(
                    'individualAccounts',
                    individualData,
                    userId
                );

            } else if (pendingData.accountType === 'organization') {
                console.log('Creating organization account...');
                orgResult = await firestoreService.createOrganization({
                    name: pendingData.organizationData.name,
                    description: pendingData.organizationData.description || '',
                    settings: pendingData.organizationData.settings || {}
                });

                if (!orgResult.success) {
                    throw new Error(`Failed to create organization: ${orgResult.error.message}`);
                }
            }

            // Create subscription
            const subscriptionData = {
                user_id: userId,
                plan: 'trial',
                status: 'trial_active',
                trial_starts_at: new Date().toISOString(),
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                authProvider: pendingData.authProvider,
                isTrialActive: true,
                daysRemainingInTrial: 30,
                features: {
                    maxSuites: 5,
                    maxTestCasesPerSuite: 50,
                    canCreateTestCases: true,
                    canUseRecordings: true,
                    canUseAutomation: true,
                    canInviteTeam: true,
                    canExportReports: true,
                    canCreateOrganizations: true,
                    advancedAnalytics: true,
                    prioritySupport: false
                }
            };

            const subscriptionResult = await firestoreService.createDocument(
                'subscriptions',
                subscriptionData,
                userId
            );

            // Clean up pending registration
            await firestoreService.deleteDocument('pendingRegistrations', userId);

            setPendingVerification(false);
            setRegistrationData(null);

            console.log('=== REGISTRATION COMPLETE ===');
            console.log('Final account type should be:', pendingData.accountType);

            return {
                success: true,
                data: {
                    user: userResult.data,
                    account: accountResult?.data,
                    organization: orgResult?.data,
                    subscription: subscriptionResult.data
                }
            };

        } catch (error) {
            console.error('Registration completion error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
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
    const clearRegistrationState = () => {
        setPendingVerification(false);
        setRegistrationData(null);
        setError(null);
    };

    return {
        // State
        loading,
        error,
        pendingVerification,
        registrationData,

        // Actions
        registerWithEmail,
        registerWithGoogle,
        completeRegistration,
        resendVerificationEmail,
        clearError,
        clearRegistrationState,

        // Utilities
        validateRegistrationData
    };
};
