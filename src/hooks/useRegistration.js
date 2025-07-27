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
import { isCustomDomain, extractDomainName } from '../utils/domainValidation';

export const useRegistration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);

    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');

    const validateRegistrationData = (data) => {
        const errors = {};

        if (!data.email) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!data.password && !data.isGoogleSSO) {
            errors.password = 'Password is required';
        } else if (!data.isGoogleSSO && data.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!data.displayName) {
            errors.displayName = 'Full name is required';
        }

        if (!data.accountType) {
            errors.accountType = 'Please select an account type';
        }

        // Validate organization industry for organization accounts
        if (data.accountType === 'organization' && !data.organizationIndustry) {
            errors.organizationIndustry = 'Please select your organization industry';
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

    const determineAccountTypeFromEmail = (email) => {
        if (!email) return 'individual';
        
        // If it's a custom domain (not gmail, yahoo, etc.), suggest organization
        if (isCustomDomain(email)) {
            return 'organization';
        }
        
        return 'individual';
    };

    const storePendingRegistration = async (userData, authProvider = 'email') => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No authenticated user found');

            const pendingData = {
                accountType: userData.accountType,
                displayName: userData.displayName,
                organizationIndustry: userData.organizationIndustry || null, // Store organization industry
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
                displayName: userData.displayName,
                organizationIndustry: userData.organizationIndustry
            });

            return {
                success: true,
                user: userCredential.user,
                needsVerification: true
            };

        } catch (error) {
            console.error('Email registration error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists.';
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

    const registerWithGoogle = async (preSelectedAccountType = null) => {
        setLoading(true);
        setError(null);

        try {
            // Sign in with Google - this handles account selection
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (!user.emailVerified) {
                throw new Error('Google account email is not verified');
            }

            // Determine account type based on email domain or use pre-selected
            const suggestedAccountType = determineAccountTypeFromEmail(user.email);
            const accountType = preSelectedAccountType || suggestedAccountType;

            // For custom domain emails, auto-extract organization name
            let organizationData = null;
            if (accountType === 'organization') {
                const domainName = extractDomainName(user.email);
                organizationData = {
                    name: domainName || 'My Organization',
                    description: `Organization for ${domainName || user.email.split('@')[1]}`
                };
            }

            const userData = {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                accountType: accountType,
                organizationIndustry: accountType === 'organization' ? 'technology' : null, // Default industry for Google SSO organizations
                organizationData: organizationData,
                preferences: {},
                isGoogleSSO: true
            };

            console.log('Google SSO - Account type determined:', accountType);
            console.log('Google SSO - User data:', userData);

            // Validate the data
            const validation = validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            // Store pending registration data
            await storePendingRegistration(userData, 'google');

            // For individual accounts, complete registration immediately
            // For organization accounts, let them provide org info first
            if (accountType === 'individual') {
                const completionResult = await completeRegistration();
                return {
                    success: true,
                    user: user,
                    needsVerification: false,
                    completionResult,
                    accountType: accountType
                };
            } else {
                // Organization account - return success but don't complete yet
                return {
                    success: true,
                    user: user,
                    needsVerification: false,
                    needsOrganizationInfo: true,
                    accountType: accountType
                };
            }

        } catch (error) {
            console.error('Google registration error:', error);
            
            let errorMessage = 'Google sign-up failed. Please try again.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-up was cancelled. Please try again.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Popup was blocked. Please allow popups and try again.';
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = 'An account already exists with this email using a different sign-in method.';
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

    // This function now handles the verification completion differently based on account type
    const completeEmailVerification = async () => {
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
            
            console.log('Email verification completed for account type:', pendingData.accountType);

            // For individual accounts, complete registration and sign out
            if (pendingData.accountType === 'individual') {
                const registrationResult = await completeRegistration();
                if (registrationResult.success) {
                    // Sign out user after successful registration
                    await auth.signOut();
                    return {
                        success: true,
                        registrationComplete: true,
                        message: 'Registration completed successfully! Please log in to continue.',
                        accountType: pendingData.accountType
                    };
                }
                return registrationResult;
            } else {
                // For organization accounts, just return success - they need to provide org info
                return {
                    success: true,
                    needsOrganizationInfo: true,
                    accountType: pendingData.accountType,
                    data: {
                        displayName: pendingData.displayName,
                        email: auth.currentUser.email,
                        organizationIndustry: pendingData.organizationIndustry
                    }
                };
            }

        } catch (error) {
            console.error('Email verification completion error:', error);
            setError(error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            setLoading(false);
        }
    };

    const completeRegistration = async (organizationData = null) => {
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
            const { firstName, lastName } = parseDisplayName(pendingData.displayName);

            console.log('=== REGISTRATION DEBUG ===');
            console.log('Pending data from DB:', pendingData);
            console.log('Account type from pending data:', pendingData.accountType);
            console.log('Organization industry from pending data:', pendingData.organizationIndustry);

            // Use organization data if provided (for organization flow)
            const finalOrganizationData = organizationData || pendingData.organizationData;

            // Validate organization data for organization accounts
            if (pendingData.accountType === 'organization' && !finalOrganizationData?.name) {
                throw new Error('Organization information is required for organization accounts');
            }

            // Prepare user data with proper name parsing
            const userData = {
                user_id: userId,
                email: currentUser.email,
                display_name: pendingData.displayName,
                first_name: firstName,
                last_name: lastName,
                account_type: pendingData.accountType,
                organization_industry: pendingData.organizationIndustry, // Include organization industry
                preferences: pendingData.preferences || {},
                contact_info: {
                    email: currentUser.email,
                    phone: null
                },
                profile_picture: currentUser.photoURL || null,
                account_memberships: []
            };

            console.log('User data being sent to createOrUpdateUserProfile:', userData);
            console.log('Final account type:', userData.account_type);
            console.log('Organization industry:', userData.organization_industry);

            // Create user profile
            const userResult = await firestoreService.createOrUpdateUserProfile(userData);
            if (!userResult.success) {
                throw new Error(`Failed to create user profile: ${userResult.error.message}`);
            }

            console.log('User profile creation result:', userResult);

            let accountResult = null;
            let orgResult = null;

            // Create account based on type
            if (pendingData.accountType === 'organization') {
                console.log('Creating organization account...');
                
                // Enhanced organization data with industry
                const enhancedOrgData = {
                    name: finalOrganizationData.name,
                    description: finalOrganizationData.description || '',
                    industry: pendingData.organizationIndustry, // Include industry in organization data
                    settings: finalOrganizationData.settings || {}
                };
                
                orgResult = await firestoreService.createOrganization(enhancedOrgData);

                if (!orgResult.success) {
                    throw new Error(`Failed to create organization: ${orgResult.error.message}`);
                }
                
                console.log('Organization created successfully:', orgResult.data);
            } else {
                // Create individual account for individual users
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

            // Sign out user after successful registration
            await auth.signOut();

            console.log('=== REGISTRATION COMPLETE ===');
            console.log('Final account type:', userData.account_type);
            console.log('Organization industry:', userData.organization_industry);
            console.log('Organization created:', !!orgResult);

            return {
                success: true,
                registrationComplete: true,
                accountType: userData.account_type,
                message: 'Registration completed successfully! Please log in to continue.',
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
        completeEmailVerification, // New function for email verification completion
        resendVerificationEmail,
        clearError,
        clearRegistrationState,

        // Utilities
        validateRegistrationData,
        determineAccountTypeFromEmail
    };
}