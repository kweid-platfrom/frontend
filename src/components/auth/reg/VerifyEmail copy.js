/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import firestoreService from '../../../services/firestoreService';
import { CheckCircle, XCircle, Loader2, ArrowRight, Building2, ChevronDown } from 'lucide-react';
import BackgroundDecorations from '../../BackgroundDecorations';
import '../../../app/globals.css';

const OrganizationSetupForm = ({ registrationData, onComplete, loading }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        companyType: 'startup',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const [errors, setErrors] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const companyTypes = [
        { value: 'startup', label: 'Startup' },
        { value: 'small_business', label: 'Small Business' },
        { value: 'enterprise', label: 'Enterprise' },
        { value: 'agency', label: 'Agency' },
        { value: 'freelancer', label: 'Freelancer' },
        { value: 'other', label: 'Other' },
    ];

    // Auto-suggest company name from email domain
    useEffect(() => {
        if (registrationData?.email && !formData.companyName) {
            const domain = registrationData.email.split('@')[1];
            if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
                const suggestedName = domain
                    .split('.')[0]
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                setFormData(prev => ({ ...prev, companyName: suggestedName }));
            }
        }
    }, [registrationData, formData.companyName]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }
        if (!formData.companyType) {
            newErrors.companyType = 'Company type is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onComplete(formData);
        }
    };

    const selectedType = companyTypes.find(type => type.value === formData.companyType);

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Organization Setup</h2>
                <p className="text-slate-600">
                    Set up your organization account to get started with team collaboration
                </p>
            </div>

            {registrationData && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-teal-800 mb-2">
                        <strong>Account Details:</strong>
                    </p>
                    <div className="text-sm text-teal-700 space-y-1">
                        <p>Name: {registrationData.fullName || registrationData.displayName}</p>
                        <p>Email: {registrationData.email}</p>
                        <p>Account Type: Organization</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company Name *
                    </label>
                    <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.companyName ? 'border-red-300' : 'border-slate-300'
                            }`}
                        placeholder="Enter your company name"
                    />
                    {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                    )}
                </div>

                {/* Company Type */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company Type *
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-white border rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors ${errors.companyType ? 'border-red-300' : 'border-slate-300'
                                }`}
                        >
                            <span>{selectedType?.label || 'Select company type'}</span>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {companyTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, companyType: type.value }));
                                            setIsDropdownOpen(false);
                                            if (errors.companyType) {
                                                setErrors(prev => ({ ...prev, companyType: '' }));
                                            }
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${type.value === formData.companyType ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.companyType && (
                        <p className="text-red-500 text-sm mt-1">{errors.companyType}</p>
                    )}
                </div>

                {/* Timezone */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Timezone
                    </label>
                    <input
                        type="text"
                        value={formData.timezone}
                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                        placeholder="Your timezone"
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Setting up organization...
                    </>
                ) : (
                    <>
                        Complete Setup
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
};

const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            console.warn(`Retry ${attempt}/${maxAttempts} failed:`, error.message);
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
    }
};

const VerifyEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'org_setup', 'error'
    const [message, setMessage] = useState('');
    const [registrationData, setRegistrationData] = useState(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isOrgSetupLoading, setIsOrgSetupLoading] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);

    // Complete registration function (Phase 3 from outline)
    const completeRegistration = useCallback(async (userId, pendingData) => {
        try {
            console.log('Completing registration for:', userId, 'Account Type:', pendingData.accountType);

            // Create user profile
            const userProfileData = {
                user_id: userId,
                email: pendingData.email,
                display_name: pendingData.displayName,
                account_type: pendingData.accountType,
                profile_picture: null,
                contact_info: {
                    email: pendingData.email,
                    phone: null,
                },
                preferences: pendingData.preferences || {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    notifications: {
                        email: true,
                        browser: true,
                        mobile: false,
                        trial_reminders: true,
                    },
                    theme: 'light',
                    language: 'en',
                },
                account_memberships: [],
                auth_metadata: {
                    provider: pendingData.authProvider || 'email',
                    email_verified: true,
                    last_sign_in: new Date().toISOString(),
                    account_created: new Date().toISOString(),
                }
            };

            const userResult = await firestoreService.createOrUpdateUserProfile(userProfileData);
            if (!userResult.success) {
                throw new Error(`Failed to create user profile: ${userResult.error.message}`);
            }

            // Create trial subscription (30-day trial as per outline)
            const trialStartDate = new Date();
            const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const subscriptionData = {
                user_id: userId,
                plan: 'trial',
                status: 'trial_active',
                trial_starts_at: trialStartDate.toISOString(),
                trial_ends_at: trialEndDate.toISOString(),
                authProvider: pendingData.authProvider || 'email',
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

            // Handle account type specific setup
            if (pendingData.accountType === 'individual') {
                // Create individual account
                const [firstName, ...lastNameParts] = pendingData.displayName.split(' ');
                const lastName = lastNameParts.join(' ');

                const individualAccountData = {
                    user_id: userId,
                    email: pendingData.email,
                    profile: {
                        first_name: firstName,
                        last_name: lastName,
                        display_name: pendingData.displayName,
                        bio: null,
                        profile_picture: null,
                    },
                    subscription: {
                        plan: 'trial',
                        status: 'trial_active',
                        trial_starts_at: trialStartDate,
                        trial_ends_at: trialEndDate,
                        features: subscriptionData.features
                    },
                    settings: {
                        timezone: pendingData.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                        notifications: {
                            email_reports: true,
                            email_reminders: true,
                            browser_notifications: true,
                            trial_expiry_reminders: true,
                        },
                        privacy: {
                            profile_visibility: 'private',
                            allow_team_invites: true,
                        }
                    },
                    onboarding: {
                        completed: false,
                        steps_completed: ['email_verification'],
                        current_step: 'welcome',
                    }
                };

                await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
                
            } else if (pendingData.accountType === 'organization') {
                // Organization setup will be handled in the org setup flow
                console.log('Organization account - will complete setup in org flow');
            }

            // Delete pending registration data
            try {
                await firestoreService.deleteDocument('pendingRegistrations', userId);
                console.log('Pending registration data cleaned up');
            } catch (error) {
                console.warn('Failed to cleanup pending registration from Firestore:', error);
            }

            return { success: true, userId };

        } catch (error) {
            console.error('Error completing registration:', error);
            return { success: false, error: error.message };
        }
    }, []);

    const handleEmailVerified = useCallback(async (needsOrgSetup = false) => {
        if (isRedirecting || verificationComplete) return;

        console.log('Email verified, needsOrgSetup:', needsOrgSetup);
        setVerificationComplete(true);

        try {
            if (needsOrgSetup) {
                console.log('Setting up organization flow');
                setStatus('org_setup');
                setMessage('Email verified! Now complete your organization setup.');
                return;
            } else {
                console.log('Individual account - redirecting to login');
                setStatus('success');
                setMessage('Email verified successfully! Redirecting to sign in...');
                setIsRedirecting(true);

                // Clear registration data for individual accounts
                try {
                    localStorage.removeItem('pendingRegistration');
                } catch (error) {
                    console.warn('Failed to clear registration data:', error);
                }

                setTimeout(() => {
                    router.push('/login?verified=true');
                }, 2000);
            }
        } catch (error) {
            console.error('Post-verification error:', error);
            setStatus('error');
            setMessage('Verification completed but there was an issue. Please try signing in.');
        }
    }, [router, isRedirecting, verificationComplete]);

    const handleOrganizationSetup = async (orgData) => {
        setIsOrgSetupLoading(true);

        try {
            if (!registrationData?.userId) {
                throw new Error('User ID not found');
            }

            console.log('Creating organization with data:', orgData);

            // Create organization
            const orgPayload = {
                name: orgData.companyName,
                description: `${orgData.companyName} organization`,
                orgId: `${registrationData.userId}_org`,
                settings: {
                    company_type: orgData.companyType,
                    timezone: orgData.timezone,
                }
            };

            const orgResult = await firestoreService.createOrganization(orgPayload);
            if (!orgResult.success) {
                throw new Error(`Failed to create organization: ${orgResult.error.message}`);
            }

            console.log('Organization created successfully:', orgResult.data.id);

            // Update user profile with organization membership
            const userUpdateData = {
                account_memberships: [{
                    org_id: orgResult.data.id,
                    role: 'Admin',
                    joined_at: new Date().toISOString(),
                    status: 'active'
                }],
                onboarding: {
                    completed: true,
                    steps_completed: ['email_verification', 'organization_setup'],
                    current_step: 'dashboard',
                }
            };

            const userUpdateResult = await firestoreService.createOrUpdateUserProfile(userUpdateData);
            if (!userUpdateResult.success) {
                console.warn('Failed to update user profile:', userUpdateResult.error);
            }

            // Clean up localStorage
            localStorage.removeItem('pendingRegistration');
            localStorage.setItem('orgSetupComplete', 'true');

            setStatus('success');
            setMessage('Organization setup completed successfully! Redirecting to dashboard...');
            setIsRedirecting(true);

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('Organization setup error:', error);
            setStatus('error');
            setMessage(`Failed to set up organization: ${error.message}. You can complete this later in your dashboard.`);

            // Still redirect to dashboard after a delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } finally {
            setIsOrgSetupLoading(false);
        }
    };

    useEffect(() => {
        if (status !== 'verifying' || verificationComplete) return;

        const verifyEmail = async () => {
            const actionCode = searchParams.get('oobCode');
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid verification link. Please request a new one.');
                return;
            }

            try {
                console.log('Starting email verification process...');

                // Get registration data from both localStorage and Firestore
                let currentRegData = null;
                
                // First, try localStorage
                const pendingReg = localStorage.getItem('pendingRegistration');
                if (pendingReg) {
                    try {
                        const localData = JSON.parse(pendingReg);
                        if (Date.now() - (localData.timestamp || 0) < 48 * 60 * 60 * 1000) { // 48 hour expiry
                            console.log('Found valid pending registration data in localStorage:', localData);
                            currentRegData = localData;
                            setRegistrationData(localData);
                        } else {
                            console.log('Pending registration data expired, removing');
                            localStorage.removeItem('pendingRegistration');
                        }
                    } catch (error) {
                        console.error('Error parsing registration data:', error);
                        localStorage.removeItem('pendingRegistration');
                    }
                }

                // Verify and apply action code
                let info;
                try {
                    info = await retryOperation(async () => {
                        return await checkActionCode(auth, actionCode);
                    });
                    console.log('Action code verified:', info);
                } catch (error) {
                    console.error('Failed to check action code:', error);
                    throw error;
                }

                try {
                    await retryOperation(async () => {
                        await applyActionCode(auth, actionCode);
                    });
                    console.log('Email verification applied successfully');
                } catch (error) {
                    console.error('Failed to apply action code:', error);
                    throw error;
                }

                // If we don't have local data, try to get it from Firestore using the email from action code
                if (!currentRegData && info?.data?.email) {
                    try {
                        // Try to find pending registration by email (you might need to implement this query)
                        console.log('Attempting to find pending registration for email:', info.data.email);
                        // This would require a custom query in your firestoreService
                        // For now, we'll proceed without it and handle in the completion flow
                    } catch (error) {
                        console.warn('Could not find pending registration data:', error);
                    }
                }

                // Complete registration (Phase 3 from outline)
                if (currentRegData) {
                    console.log('Completing registration with data:', currentRegData);
                    
                    const completionResult = await completeRegistration(currentRegData.userId, currentRegData);
                    if (!completionResult.success) {
                        throw new Error(`Registration completion failed: ${completionResult.error}`);
                    }

                    console.log('Registration completed successfully');
                }

                // Determine if organization setup is needed
                const needsOrgSetup = currentRegData?.needsOrgSetup === true || 
                                   currentRegData?.accountType === 'organization';

                console.log('Organization setup needed:', needsOrgSetup);

                // Handle flow based on account type
                await handleEmailVerified(needsOrgSetup);

            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                let errorMessage = 'Failed to verify email. Please try again.';

                if (error.code === 'auth/expired-action-code') {
                    errorMessage = 'This verification link has expired. Please request a new one.';
                } else if (error.code === 'auth/invalid-action-code') {
                    errorMessage = 'This verification link is invalid. Please request a new one.';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'This account has been disabled.';
                }

                setMessage(errorMessage);
            }
        };

        const timeoutId = setTimeout(verifyEmail, 100);
        return () => clearTimeout(timeoutId);
    }, [searchParams, completeRegistration, handleEmailVerified]);

    const handleGoToLogin = () => {
        try {
            sessionStorage.removeItem('verificationAttempted');
            localStorage.removeItem('pendingRegistration');
            localStorage.removeItem('orgSetupComplete');
            router.push('/login');
        } catch (error) {
            console.error('Error during navigation to login:', error);
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>

                        {status === 'verifying' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Email</h1>
                                <p className="text-slate-600">Please wait while we verify your email address and complete your registration...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    {isOrgSetupLoading ? 'Setup Complete!' : 'Email Verified!'}
                                </h1>
                                <p className="text-slate-600 mb-4">{message}</p>
                                {!isOrgSetupLoading && !isRedirecting && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Redirecting...
                                    </div>
                                )}
                            </div>
                        )}

                        {status === 'org_setup' && (
                            <OrganizationSetupForm
                                registrationData={registrationData}
                                onComplete={handleOrganizationSetup}
                                loading={isOrgSetupLoading}
                            />
                        )}

                        {status === 'error' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                                <p className="text-slate-600 mb-6">{message}</p>
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium"
                                >
                                    Go to Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;