// hooks/useRegistration.js - REFACTORED TO USE MULTI-STEP SERVICE
import { useState } from 'react';
import { auth } from '../config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import RegistrationService, { RegistrationFlowHelpers } from '../services/RegistrationService';
import {
    isCommonEmailProvider
} from '../utils/domainValidation';

export const useRegistration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [registrationState, setRegistrationState] = useState(null);

    // Initialize service
    const registrationService = new RegistrationService();

    /**
     * Client-side validation before calling service
     */
    const validateRegistrationData = (data, step = 1) => {
        const errors = {};

        // Step 1 validation (basic account creation)
        if (step === 1) {
            // Email validation
            if (!data.email) {
                errors.email = 'Email is required';
            } else if (!RegistrationFlowHelpers.validateEmail(data.email)) {
                errors.email = 'Please enter a valid email address';
            } else if (data.accountType === 'organization' && isCommonEmailProvider(data.email)) {
                errors.email = 'Organization accounts require a custom domain email';
            }

            // Display name validation
            if (!data.name || data.name.trim().length < 2) {
                errors.name = 'Full name is required (minimum 2 characters)';
            } else if (data.name.trim().length > 100) {
                errors.name = 'Full name must be less than 100 characters';
            }

            // Account type validation
            if (!data.accountType || !['individual', 'organization'].includes(data.accountType)) {
                errors.accountType = 'Account type must be either "individual" or "organization"';
            }
        }

        // Step 2+ validation handled by RegistrationStateManager
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    /**
     * Start individual registration (Step 1)
     */
    const startIndividualRegistration = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            // Client-side validation
            const validation = validateRegistrationData({
                ...userData,
                accountType: 'individual'
            }, 1);

            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            const result = await registrationService.createIndividualStep1({
                email: userData.email,
                name: userData.name,
                provider: userData.googleCredential ? 'google' : 'email',
                googleCredential: userData.googleCredential
            });

            if (result.success) {
                setRegistrationState(result.data);
                return {
                    success: true,
                    needsCompletion: true,
                    registrationState: result.data,
                    message: 'Account created! Please complete your profile.'
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Individual registration start error:', error);
            const errorMessage = error.message || 'Registration failed. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Complete individual registration (Step 2)
     */
    const completeIndividualRegistration = async (userId, profileData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            const validation = RegistrationFlowHelpers.validatePersonalName(profileData.firstName, 'First name');
            if (!validation.valid) {
                throw new Error(validation.errors[0]);
            }

            const lastNameValidation = RegistrationFlowHelpers.validatePersonalName(profileData.lastName, 'Last name');
            if (!lastNameValidation.valid) {
                throw new Error(lastNameValidation.errors[0]);
            }

            if (!profileData.agreedToTerms) {
                throw new Error('You must agree to the terms of service');
            }

            // Validate password if provided
            if (profileData.finalPassword) {
                const passwordValidation = RegistrationFlowHelpers.validatePassword(profileData.finalPassword);
                if (!passwordValidation.valid) {
                    throw new Error(passwordValidation.errors[0]);
                }
            }

            const result = await registrationService.completeIndividualStep2(userId, {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                displayName: profileData.displayName || RegistrationFlowHelpers.generateDisplayName(profileData.firstName, profileData.lastName),
                finalPassword: profileData.finalPassword,
                preferences: profileData.preferences || {},
                agreedToTerms: profileData.agreedToTerms
            });

            if (result.success) {
                setRegistrationState(result.data);
                let message;
                const needsVerification = !profileData.googleCredential;

                if (needsVerification) {
                    message = 'Account created! Please check your email to verify your account before signing in.';
                } else {
                    message = 'Your account has been created successfully!';
                }

                return {
                    success: true,
                    completed: true,
                    registrationState: result.data,
                    message: message,
                    needsVerification: needsVerification
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Individual registration completion error:', error);
            const errorMessage = error.message || 'Failed to complete registration. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Start organization registration (Step 1)
     */
    const startOrganizationRegistration = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            // Client-side validation
            const validation = validateRegistrationData({
                ...userData,
                accountType: 'organization'
            }, 1);

            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            const result = await registrationService.createOrganizationStep1({
                email: userData.email,
                name: userData.name,
                provider: userData.googleCredential ? 'google' : 'email',
                googleCredential: userData.googleCredential
            });

            if (result.success) {
                setRegistrationState(result.data);
                return {
                    success: true,
                    needsCompletion: true,
                    registrationState: result.data,
                    message: 'Admin account created! Please create your organization.'
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Organization registration start error:', error);
            const errorMessage = error.message || 'Registration failed. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create organization (Step 2)
     */
    const createOrganization = async (userId, organizationData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate organization data
            const validation = RegistrationFlowHelpers.validateOrganizationName(organizationData.name);
            if (!validation.valid) {
                throw new Error(validation.errors[0]);
            }

            const result = await registrationService.createOrganizationStep2(userId, {
                name: organizationData.name,
                industry: organizationData.industry || 'other',
                size: organizationData.size || 'small',
                description: organizationData.description || ''
            });

            if (result.success) {
                setRegistrationState(result.data);
                return {
                    success: true,
                    needsCompletion: true,
                    registrationState: result.data,
                    message: 'Organization created! Linking your account...'
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Organization creation error:', error);
            const errorMessage = error.message || 'Failed to create organization. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Link user to organization (Step 3)
     */
    const linkUserToOrganization = async (userId, organizationId) => {
        setLoading(true);
        setError(null);

        try {
            const result = await registrationService.linkUserToOrganizationStep3(userId, organizationId);

            if (result.success) {
                setRegistrationState(result.data);
                return {
                    success: true,
                    needsCompletion: true,
                    registrationState: result.data,
                    message: 'Account linked! Please complete your profile.'
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('User linking error:', error);
            const errorMessage = error.message || 'Failed to link account. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Complete organization registration (Step 4)
     */
    const completeOrganizationRegistration = async (userId, profileData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate required fields
            const validation = RegistrationFlowHelpers.validatePersonalName(profileData.firstName, 'First name');
            if (!validation.valid) {
                throw new Error(validation.errors[0]);
            }

            const lastNameValidation = RegistrationFlowHelpers.validatePersonalName(profileData.lastName, 'Last name');
            if (!lastNameValidation.valid) {
                throw new Error(lastNameValidation.errors[0]);
            }

            if (!profileData.agreedToTerms) {
                throw new Error('You must agree to the terms of service');
            }

            // Validate password if provided
            if (profileData.finalPassword) {
                const passwordValidation = RegistrationFlowHelpers.validatePassword(profileData.finalPassword);
                if (!passwordValidation.valid) {
                    throw new Error(passwordValidation.errors[0]);
                }
            }

            const result = await registrationService.completeOrganizationStep4(userId, {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                displayName: profileData.displayName || RegistrationFlowHelpers.generateDisplayName(profileData.firstName, profileData.lastName),
                finalPassword: profileData.finalPassword,
                preferences: profileData.preferences || {},
                agreedToTerms: profileData.agreedToTerms
            });

            if (result.success) {
                setRegistrationState(result.data);
                let message;
                const needsVerification = !profileData.googleCredential;
                
                if (needsVerification) {
                    message = 'Account created! Please check your email to verify your account before signing in.';
                } else {
                    message = 'Organization created successfully!';
                }
                
                return {
                    success: true,
                    completed: true,
                    registrationState: result.data,
                    message: message,
                    needsVerification: needsVerification
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Organization registration completion error:', error);
            const errorMessage = error.message || 'Failed to complete registration. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get registration state for a user with state manager
     */
    const getRegistrationState = async (userId) => {
        try {
            const result = await registrationService.getRegistrationState(userId);
            if (result.success) {
                setRegistrationState(result.data);

                // Create state manager for additional context
                const stateManager = registrationService.createRegistrationStateManager(userId);
                await stateManager.loadState();

                return {
                    ...result.data,
                    progress: stateManager.getProgressPercentage(),
                    statusMessage: stateManager.getStatusMessage(),
                    nextStep: stateManager.getNextStep(),
                    isCompleted: stateManager.isCompleted()
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get registration state:', error);
            return null;
        }
    };

    /**
     * Continue registration using state manager
     */
    const continueRegistration = async (userId, stepData) => {
        setLoading(true);
        setError(null);

        try {
            const stateManager = registrationService.createRegistrationStateManager(userId);
            await stateManager.loadState();

            if (stateManager.isCompleted()) {
                return {
                    success: true,
                    completed: true,
                    message: 'Registration already completed!'
                };
            }

            // Validate step data
            const validation = stateManager.validateStepData(stepData);
            if (!validation.valid) {
                throw new Error(validation.errors[0]);
            }

            // Execute next step
            const result = await stateManager.executeNextStep(stepData);

            if (result.success) {
                const updatedState = stateManager.getCurrentState();
                setRegistrationState(updatedState);

                return {
                    success: true,
                    completed: stateManager.isCompleted(),
                    registrationState: updatedState,
                    message: stateManager.getStatusMessage(),
                    progress: stateManager.getProgressPercentage(),
                    nextStep: stateManager.getNextStep()
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Registration continuation error:', error);
            const errorMessage = error.message || 'Failed to continue registration. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle Google Sign-In for registration
     */
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await registrationService.handleGoogleSignIn();

            if (result.success) {
                return {
                    success: true,
                    credential: result.data.credential,
                    user: result.data.user,
                    email: result.data.email,
                    name: result.data.name,
                    provider: 'google'
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Google Sign-In error:', error);
            const errorMessage = error.message || 'Google Sign-In failed. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset registration to a specific step
     */
    const resetRegistrationToStep = async (userId, targetStep) => {
        setLoading(true);
        setError(null);

        try {
            const result = await registrationService.resetRegistrationToStep(userId, targetStep);

            if (result.success) {
                // Refresh registration state
                await getRegistrationState(userId);

                return {
                    success: true,
                    message: result.data.message
                };
            } else {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Registration reset error:', error);
            const errorMessage = error.message || 'Failed to reset registration. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Resend verification email
     */
    const resendVerificationEmail = async () => {
        setLoading(true);
        setError(null);

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No authenticated user found. Please sign in first.');
            }

            if (user.emailVerified) {
                throw new Error('Your email is already verified. You can sign in normally.');
            }

            await sendEmailVerification(user);

            return {
                success: true,
                message: 'Verification email sent successfully. Please check your inbox.'
            };
        } catch (error) {
            console.error('Resend verification error:', error);
            const errorMessage = error.message || 'Failed to send verification email. Please try again.';
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Legacy method - for backward compatibility
     * Converts old single-step registration to new multi-step flow
     */
    const registerWithEmail = async (userData) => {
        console.warn('registerWithEmail is deprecated. Use startIndividualRegistration/startOrganizationRegistration instead.');

        // Determine flow based on account type
        if (userData.accountType === 'individual') {
            // Step 1: Start individual registration
            const step1Result = await startIndividualRegistration({
                email: userData.email,
                name: userData.displayName
            });

            if (!step1Result.success) {
                return step1Result;
            }

            // Step 2: Complete individual registration
            return await completeIndividualRegistration(step1Result.registrationState.userId, {
                firstName: userData.firstName || userData.displayName.split(' ')[0],
                lastName: userData.lastName || userData.displayName.split(' ').slice(1).join(' '),
                displayName: userData.displayName,
                finalPassword: userData.password,
                preferences: userData.preferences || {},
                agreedToTerms: true
            });
        } else {
            // Multi-step organization flow
            const step1Result = await startOrganizationRegistration({
                email: userData.email,
                name: userData.displayName
            });

            if (!step1Result.success) {
                return step1Result;
            }

            const userId = step1Result.registrationState.userId;

            // Step 2: Create organization
            const step2Result = await createOrganization(userId, {
                name: userData.organizationName,
                industry: userData.organizationIndustry,
                size: userData.organizationSize || 'small'
            });

            if (!step2Result.success) {
                return step2Result;
            }

            // Step 3: Link user to organization
            const step3Result = await linkUserToOrganization(userId, step2Result.registrationState.organizationId);

            if (!step3Result.success) {
                return step3Result;
            }

            // Step 4: Complete profile
            return await completeOrganizationRegistration(userId, {
                firstName: userData.firstName || userData.displayName.split(' ')[0],
                lastName: userData.lastName || userData.displayName.split(' ').slice(1).join(' '),
                displayName: userData.displayName,
                finalPassword: userData.password,
                preferences: userData.preferences || {},
                agreedToTerms: true
            });
        }
    };

    /**
     * Legacy method - Google registration
     */
    const registerWithGoogle = async (userData, credential) => {
        console.warn('registerWithGoogle is deprecated. Use handleGoogleSignIn with start/complete methods instead.');

        return await registerWithEmail({
            ...userData,
            googleCredential: credential
        });
    };

    const clearError = () => setError(null);

    return {
        // New multi-step methods
        startIndividualRegistration,
        completeIndividualRegistration,
        startOrganizationRegistration,
        createOrganization,
        linkUserToOrganization,
        completeOrganizationRegistration,

        // State management
        getRegistrationState,
        continueRegistration,
        resetRegistrationToStep,

        // Google authentication
        handleGoogleSignIn,

        // Utility methods
        resendVerificationEmail,

        // Legacy methods (deprecated)
        registerWithEmail,
        registerWithGoogle,

        // State and utilities
        loading,
        error,
        registrationState,
        clearError,
        validateRegistrationData
    };
};