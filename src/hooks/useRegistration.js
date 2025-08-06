import { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import firestoreService from '../services/firestoreService';
import { 
    isValidEmail,
    isCommonEmailProvider,
    generateOrgNameSuggestions 
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

        if (!data.password) {
            errors.password = 'Password is required';
        } else if (data.password.length < 6) {
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

    const createPendingRegistration = async (userData) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('No authenticated user found');

            const accountType = userData.accountType || 'individual';
            
            const orgSuggestions = accountType === 'organization' 
                ? generateOrgNameSuggestions(userData.email)
                : [];

            const pendingData = {
                email: userData.email,
                displayName: userData.displayName,
                accountType,
                organizationName: userData.organizationName || '',
                organizationIndustry: userData.organizationIndustry || '',
                orgSuggestions,
                authProvider: 'email',
                createdAt: new Date().toISOString(),
                ttl: 48 // hours
            };

            const result = await firestoreService.createDocument(
                'pendingRegistrations',
                pendingData,
                userId
            );

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to store registration data');
            }

            return result;
        } catch (error) {
            console.error('Error creating pending registration:', error);
            throw error;
        }
    };

    const registerWithEmail = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const validation = validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(Object.values(validation.errors)[0]);
            }

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            await createPendingRegistration({
                ...userData,
                authProvider: 'email'
            });

            await sendEmailVerification(userCredential.user);
            await signOut(auth);

            return {
                success: true,
                needsVerification: true,
                message: 'Registration successful! Please check your email to verify your account, then sign in to continue.'
            };
        } catch (error) {
            console.error('Email registration error:', error);
            
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

    const completeUserRegistration = async (organizationData = null) => {
        setLoading(true);
        setError(null);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('No authenticated user found');
            }

            const pendingResult = await firestoreService.getDocument('pendingRegistrations', userId);
            if (!pendingResult.success) {
                throw new Error('No pending registration found');
            }

            const pendingData = pendingResult.data;
            if (!pendingData.accountType || !['individual', 'organization'].includes(pendingData.accountType)) {
                throw new Error('Invalid accountType in pendingRegistrations');
            }

            const currentUser = auth.currentUser;
            const { firstName, lastName } = parseDisplayName(pendingData.displayName);

            const userData = {
                user_id: userId,
                email: currentUser.email,
                display_name: pendingData.displayName,
                first_name: firstName,
                last_name: lastName,
                account_type: pendingData.accountType,
                role: pendingData.accountType === 'organization' ? 'Admin' : 'member',
                preferences: {},
                contact_info: {
                    email: currentUser.email,
                    phone: null
                },
                profile_picture: currentUser.photoURL || null,
                account_memberships: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: userId,
                updated_by: userId,
                registrationCompleted: pendingData.accountType === 'organization' ? false : true
            };

            if (pendingData.accountType === 'organization' && isCommonEmailProvider(currentUser.email)) {
                throw new Error('Organization accounts require a custom domain email');
            }

            const userResult = await firestoreService.createOrUpdateUserProfile(userData);
            if (!userResult.success) {
                throw new Error(`Failed to create user profile: ${userResult.error?.message}`);
            }

            // Verify user document
            const verifyUser = await firestoreService.user.getUserProfile(userId);
            if (!verifyUser.success || verifyUser.data.account_type !== pendingData.accountType || 
                (pendingData.accountType === 'organization' && verifyUser.data.role !== 'Admin')) {
                throw new Error(`User profile verification failed: expected account_type ${pendingData.accountType} and role 'Admin', got ${verifyUser.data?.account_type} and ${verifyUser.data?.role}`);
            }

            let orgResult = null;

            if (pendingData.accountType === 'organization') {
                const orgDataToUse = organizationData || {
                    name: pendingData.organizationName,
                    industry: pendingData.organizationIndustry
                };

                if (!orgDataToUse?.name || !orgDataToUse?.industry) {
                    return {
                        success: true,
                        needsOrganizationInfo: true,
                        accountType: pendingData.accountType,
                        orgSuggestions: pendingData.orgSuggestions || []
                    };
                }

                const enhancedOrgData = {
                    name: orgDataToUse.name,
                    description: orgDataToUse.description || `${orgDataToUse.name} organization`,
                    industry: orgDataToUse.industry || 'technology',
                    settings: orgDataToUse.settings || {},
                    ownerId: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: userId,
                    updated_by: userId
                };
                
                orgResult = await firestoreService.organization.createOrganization(enhancedOrgData);
                if (!orgResult.success) {
                    throw new Error(`Failed to create organization: ${orgResult.error?.message}`);
                }

                // Create membership document for the admin
                const membershipData = {
                    user_id: userId,
                    role: 'Admin',
                    status: 'active',
                    joined_at: new Date().toISOString(),
                    created_by: userId,
                    updated_by: userId
                };

                const membershipResult = await firestoreService.createDocument(
                    `organizations/${orgResult.data.id}/members`,
                    membershipData,
                    userId
                );
                if (!membershipResult.success) {
                    throw new Error(`Failed to create membership: ${membershipResult.error?.message}`);
                }

                // Update user profile with organization details
                userData.account_memberships = [{
                    organization_id: orgResult.data.id,
                    role: 'Admin',
                    joined_at: new Date().toISOString()
                }];
                userData.organizationId = orgResult.data.id;
                userData.organizationName = orgResult.data.name;
                userData.registrationCompleted = true;

                const updateResult = await firestoreService.createOrUpdateUserProfile(userData);
                if (!updateResult.success) {
                    throw new Error(`Failed to update user profile with org data: ${updateResult.error?.message}`);
                }
            } else {
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

                await firestoreService.createDocument('individualAccounts', individualData, userId);
            }

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

            await firestoreService.createDocument('subscriptions', subscriptionData, userId);
            await firestoreService.deleteDocument('pendingRegistrations', userId);

            return {
                success: true,
                registrationComplete: true,
                accountType: pendingData.accountType,
                data: {
                    user: userResult.data,
                    organization: orgResult?.data,
                    subscription: subscriptionData
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

    return {
        loading,
        error,
        registerWithEmail,
        completeUserRegistration,
        resendVerificationEmail,
        clearError,
        validateRegistrationData
    };
};