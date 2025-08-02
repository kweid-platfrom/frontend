'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import firestoreService from '../../services/firestoreService';
import { validateEmailForAccountType, getEmailDomainInfo } from '../../utils/emailDomainValidator';
import { FcGoogle } from 'react-icons/fc';
import { Square, User, Building2, ChevronDown, X, Mail, ArrowLeft } from 'lucide-react';
import BackgroundDecorations from '../BackgroundDecorations';
import '../../app/globals.css';

// Email Verification Step Component
const EmailVerificationStep = ({ email, onResendEmail, onBackToForm, isResending }) => {
    return (
        <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-teal-600" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>

            <p className="text-slate-600 mb-4">
                We&apos;ve sent a verification email to{' '}
                <span className="font-semibold text-slate-900">{email}</span>
            </p>

            <p className="text-sm text-slate-500 mb-6">
                Please check your inbox and spam folder, then click the verification link to complete your registration.
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-teal-800 font-medium mb-2">
                    What happens next:
                </p>
                <ol className="text-sm text-teal-700 space-y-1 text-left">
                    <li>1. Check your email inbox (and spam folder)</li>
                    <li>2. Click the verification link in the email</li>
                    <li>3. Complete any additional setup steps</li>
                    <li>4. Access your dashboard</li>
                </ol>
            </div>

            <div className="space-y-3">
                <button
                    onClick={onResendEmail}
                    disabled={isResending}
                    className="w-full text-teal-600 py-3 px-4 text-sm hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                    {isResending ? 'Resending...' : "Didn't receive the email? Resend verification"}
                </button>

                <button
                    onClick={onBackToForm}
                    className="w-full text-slate-600 py-2 px-4 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Registration
                </button>
            </div>
        </div>
    );
};

const GoogleSignUp = ({ onGoogleRegister, loading }) => {
    return (
        <button
            onClick={onGoogleRegister}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold border-2 border-slate-200 rounded px-4 py-2 transition-all duration-200 flex justify-center items-center gap-3 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
        >
            {loading ? (
                <Square className="animate-spin h-5 w-5 text-slate-400" />
            ) : (
                <FcGoogle className="w-5 h-5" />
            )}
            <span>{loading ? 'Signing up with Google...' : 'Continue with Google'}</span>
        </button>
    );
};

const AccountTypeSelector = ({ accountType, setAccountType }) => {
    const [isOpen, setIsOpen] = useState(false);

    const accountTypes = [
        { value: 'individual', label: 'Individual Account', icon: User, description: 'For personal use and solo projects' },
        { value: 'organization', label: 'Organization Account', icon: Building2, description: 'For teams and companies' }
    ];

    const selectedType = accountTypes.find(type => type.value === accountType);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <selectedType.icon className="w-5 h-5 text-slate-600" />
                    <div>
                        <div className="font-medium text-slate-900">{selectedType.label}</div>
                        <div className="text-sm text-slate-500">{selectedType.description}</div>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {accountTypes.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                                setAccountType(type.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${type.value === accountType ? 'bg-teal-50 text-teal-700' : 'text-slate-700'
                                }`}
                        >
                            <type.icon className="w-5 h-5" />
                            <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-slate-500">{type.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const EmailSuggestionBanner = ({
    emailValidation,
    onSwitch,
    onDismiss
}) => {
    if (!emailValidation?.recommendAccountType || emailValidation.domainType !== 'custom') {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium">
                        Organization Account Suggested
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                        Your email domain suggests you might be registering for your organization.
                        Would you like to create an organization account instead?
                    </p>
                    <button
                        onClick={onSwitch}
                        className="text-sm text-blue-700 font-medium hover:text-blue-800 mt-2 underline"
                    >
                        Switch to Organization Account
                    </button>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-blue-400 hover:text-blue-600 ml-2"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const Register = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState('form'); // 'form' | 'email-verification'
    const [accountType, setAccountType] = useState('individual');
    const [loading, setLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showEmailSuggestion, setShowEmailSuggestion] = useState(false);
    const [, setEmailDomainInfo] = useState(null);
    const [emailValidation, setEmailValidation] = useState(null);
    const [toast, setToast] = useState({ type: '', message: '', title: '' });
    const [registeredUser, setRegisteredUser] = useState(null); // Store user for resend functionality

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
    });

    const [errors, setErrors] = useState({});

    // Set registration flag on mount
    useEffect(() => {
        window.isRegistering = true;
        return () => {
            window.isRegistering = false;
        };
    }, []);

    // Email validation effect
    useEffect(() => {
        if (formData.email && currentStep === 'form') {
            const domainInfo = getEmailDomainInfo(formData.email);
            setEmailDomainInfo(domainInfo);

            const validation = validateEmailForAccountType(formData.email, accountType);
            setEmailValidation(validation);

            if (
                accountType === 'individual' &&
                validation.isValid &&
                validation.recommendAccountType === 'organization' &&
                !showEmailSuggestion
            ) {
                setShowEmailSuggestion(true);
            } else if (accountType === 'organization' || validation.domainType !== 'custom' || !validation.isValid) {
                setShowEmailSuggestion(false);
            }
        } else {
            setEmailDomainInfo(null);
            setEmailValidation(null);
            setShowEmailSuggestion(false);
        }
    }, [formData.email, accountType, showEmailSuggestion, currentStep]);

    // Auto-hide toast after 5 seconds
    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => {
                setToast({ type: '', message: '', title: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.message]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleAccountTypeSwitch = () => {
        setAccountType('organization');
        setShowEmailSuggestion(false);

        setToast({
            type: 'success',
            title: 'Account Type Changed',
            message: 'Switched to Organization account type',
        });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else {
            const validation = validateEmailForAccountType(formData.email, accountType);
            if (!validation.isValid) {
                newErrors.email = validation.error;
            }
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Store pending registration data according to new outline
    const storePendingRegistration = async (userId, userData, authProvider) => {
        const ttlHours = authProvider === 'google' ? 24 : 48;
        const pendingData = {
            userId,
            accountType: userData.accountType,
            displayName: userData.displayName,
            organizationData: userData.organizationData || null,
            preferences: userData.preferences || {},
            authProvider,
            createdAt: Date.now(),
            ttl: ttlHours * 60 * 60 * 1000, // Convert to milliseconds
        };

        // Store in localStorage for client-side access
        localStorage.setItem('pendingRegistration', JSON.stringify(pendingData));

        // Store in Firestore as per outline
        try {
            await firestoreService.createDocument('pendingRegistrations', pendingData, userId);
            console.log('Pending registration stored successfully');
        } catch (error) {
            console.error('Failed to store pending registration:', error);
            // Continue anyway - localStorage backup exists
        }
    };

    const handleResendEmail = async () => {
        if (!registeredUser) {
            setToast({
                type: 'error',
                title: 'Error',
                message: 'Unable to resend email. Please try registering again.',
            });
            setCurrentStep('form');
            return;
        }

        setIsResending(true);
        try {
            await sendEmailVerification(registeredUser, {
                url: `${window.location.origin}/verify-email`,
                handleCodeInApp: false,
            });
            setToast({
                type: 'success',
                title: 'Email Resent',
                message: 'Verification email has been resent successfully.',
            });
        } catch (error) {
            console.error('Error resending verification email:', error);
            setToast({
                type: 'error',
                title: 'Resend Failed',
                message: 'Failed to resend verification email. Please try again.',
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToForm = () => {
        setCurrentStep('form');
        setRegisteredUser(null);
    };

    const handleGoogleRegister = async () => {
        setIsGoogleLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists
            const userResult = await firestoreService.getUserProfile(user.uid);
            if (userResult.success) {
                setToast({
                    type: 'success',
                    title: 'Welcome Back',
                    message: 'Signed in successfully!',
                });
                router.push('/dashboard');
                return;
            }

            // Store pending registration data with Google SSO (Phase 1B from outline)
            const pendingUserData = {
                accountType,
                displayName: user.displayName,
                organizationData: accountType === 'organization' ? {
                    suggestedName: user.email.split('@')[1]?.split('.')[0] || '',
                } : null,
                preferences: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            await storePendingRegistration(user.uid, pendingUserData, 'google');

            // Complete registration immediately for Google SSO (Phase 3 from outline)
            const completionResult = await completeRegistration(user.uid, accountType);
            
            if (!completionResult.success) {
                throw new Error(completionResult.error);
            }

            setToast({
                type: 'success',
                title: 'Account Created',
                message: 'Google registration successful!',
            });

            // Handle routing based on account type
            if (accountType === 'organization') {
                // Store data for organization setup
                localStorage.setItem('pendingOrgSetup', JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    fullName: user.displayName,
                    suggestedCompany: user.email.split('@')[1]?.split('.')[0] || '',
                    timestamp: Date.now()
                }));
                router.push('/complete-org-setup');
            } else {
                router.push('/dashboard');
            }

        } catch (error) {
            console.error('Google registration error:', error);
            let errorMessage = 'Failed to sign up with Google. Please try again.';

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-up was cancelled.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup was blocked. Please allow popups and try again.';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'An account already exists with this email using a different sign-in method.';
            }

            setToast({
                type: 'error',
                title: 'Google Sign-Up Failed',
                message: errorMessage,
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // Complete registration function (Phase 3 from outline)
    const completeRegistration = async (userId, selectedAccountType) => {
        try {
            console.log('Completing registration for:', userId, 'Type:', selectedAccountType);

            // Get pending registration data
            const pendingData = await firestoreService.getDocument('pendingRegistrations', userId);
            if (!pendingData.success) {
                throw new Error('Pending registration data not found');
            }

            const registrationData = pendingData.data;
            
            // Create user profile
            const userProfileData = {
                user_id: userId,
                email: registrationData.email || auth.currentUser?.email,
                display_name: registrationData.displayName,
                account_type: selectedAccountType,
                profile_picture: auth.currentUser?.photoURL || null,
                contact_info: {
                    email: registrationData.email || auth.currentUser?.email,
                    phone: null,
                },
                preferences: registrationData.preferences,
                account_memberships: [],
                auth_metadata: {
                    provider: registrationData.authProvider,
                    email_verified: auth.currentUser?.emailVerified || false,
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
                authProvider: registrationData.authProvider,
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
            if (selectedAccountType === 'individual') {
                // Create individual account
                const [firstName, ...lastNameParts] = registrationData.displayName.split(' ');
                const lastName = lastNameParts.join(' ');

                const individualAccountData = {
                    user_id: userId,
                    email: registrationData.email || auth.currentUser?.email,
                    profile: {
                        first_name: firstName,
                        last_name: lastName,
                        display_name: registrationData.displayName,
                        bio: null,
                        profile_picture: auth.currentUser?.photoURL || null,
                    },
                    subscription: {
                        plan: 'trial',
                        status: 'trial_active',
                        trial_starts_at: trialStartDate,
                        trial_ends_at: trialEndDate,
                        features: subscriptionData.features
                    },
                    settings: {
                        timezone: registrationData.preferences.timezone,
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
                        steps_completed: [],
                        current_step: 'welcome',
                    }
                };

                await firestoreService.createDocument('individualAccounts', individualAccountData, userId);
                
            } else if (selectedAccountType === 'organization') {
                // Organization setup will be handled in the org setup flow
                console.log('Organization account - will complete setup in org flow');
            }

            // Delete pending registration data
            try {
                await firestoreService.deleteDocument('pendingRegistrations', userId);
                localStorage.removeItem('pendingRegistration');
            } catch (error) {
                console.warn('Failed to cleanup pending registration:', error);
            }

            return { success: true, userId };

        } catch (error) {
            console.error('Error completing registration:', error);
            return { success: false, error: error.message };
        }
    };

    const handleEmailSignUp = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            console.log('Starting email signup with accountType:', accountType);

            // Phase 1A: Create Firebase user (pre-email verification)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Store pending registration data
            const pendingUserData = {
                accountType,
                displayName: formData.fullName,
                email: formData.email,
                organizationData: accountType === 'organization' ? {
                    suggestedName: formData.email.split('@')[1]?.split('.')[0] || '',
                } : null,
                preferences: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            await storePendingRegistration(user.uid, pendingUserData, 'email');

            // Send verification email
            await sendEmailVerification(user, {
                url: `${window.location.origin}/verify-email`,
                handleCodeInApp: false,
            });

            // Store user for resend functionality and additional data for post-verification
            setRegisteredUser(user);
            
            // Store additional data for the verification flow
            const verificationData = {
                userId: user.uid,
                email: formData.email,
                fullName: formData.fullName,
                accountType,
                isNewRegistration: true,
                needsOrgSetup: accountType === 'organization',
                timestamp: Date.now()
            };
            
            localStorage.setItem('pendingRegistration', JSON.stringify(verificationData));

            // Sign out user until verification (as per outline)
            await signOut(auth);

            setToast({
                type: 'success',
                title: 'Account Created',
                message: 'Please check your email for verification link.',
            });

            // Switch to email verification step (Phase 2)
            setCurrentStep('email-verification');

        } catch (error) {
            console.error('Email registration error:', error);
            let errorMessage = 'Failed to create account. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }

            setToast({
                type: 'error',
                title: 'Registration Failed',
                message: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const renderRegistrationForm = () => (
        <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Create Your Account</h1>
            <p className="text-slate-600 mb-6 text-center">Get started with QAID today</p>

            {/* Google Sign Up */}
            <div className="mb-6">
                <GoogleSignUp onGoogleRegister={handleGoogleRegister} loading={isGoogleLoading} />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">or continue with email</span>
                </div>
            </div>

            {/* Account Type Selector */}
            <div className="mb-6">
                <AccountTypeSelector
                    accountType={accountType}
                    setAccountType={setAccountType}
                />
            </div>

            {/* Email Suggestion Banner */}
            {showEmailSuggestion && (
                <EmailSuggestionBanner
                    emailValidation={emailValidation}
                    onSwitch={handleAccountTypeSwitch}
                    onDismiss={() => setShowEmailSuggestion(false)}
                />
            )}

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.fullName ? 'border-red-300' : 'border-slate-300'
                            }`}
                        placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.email ? 'border-red-300' : 'border-slate-300'
                            }`}
                        placeholder="Enter your email address"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.password ? 'border-red-300' : 'border-slate-300'
                            }`}
                        placeholder="Create a password (min. 8 characters)"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors ${errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                            }`}
                        placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Terms Agreement */}
                <div>
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={formData.agreeToTerms}
                            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                            className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-600">
                            I agree to the{' '}
                            <a href="/terms" className="text-teal-600 hover:text-teal-700 underline">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
                                Privacy Policy
                            </a>
                        </span>
                    </label>
                    {errors.agreeToTerms && (
                        <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>
                    )}
                </div>
            </div>

            {/* Create Account Button */}
            <button
                onClick={handleEmailSignUp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Square className="animate-spin h-5 w-5" />
                        Creating Account...
                    </>
                ) : (
                    'Create Account'
                )}
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-6">
                <p className="text-sm text-slate-600">
                    Already have an account?{' '}
                    <button
                        onClick={() => router.push('/login')}
                        className="text-teal-600 hover:text-teal-700 font-medium hover:underline transition-colors"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </>
    );

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

                        {currentStep === 'form' && renderRegistrationForm()}

                        {currentStep === 'email-verification' && (
                            <EmailVerificationStep
                                email={formData.email}
                                onResendEmail={handleResendEmail}
                                onBackToForm={handleBackToForm}
                                isResending={isResending}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast.message && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white max-w-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' :
                        toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    <div className="font-medium">{toast.title}</div>
                    <div className="text-sm opacity-90">{toast.message}</div>
                </div>
            )}
        </div>
    );
};

export default Register;