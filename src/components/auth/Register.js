'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { FcGoogle } from 'react-icons/fc';
import AccountTypeStep from './reg/AccountTypeStep';
import PersonalInfoStep from './reg/PersonalInfoStep';
import ReviewStep from './reg/ReviewStep';
import { Mail, Square } from 'lucide-react';
import BackgroundDecorations from '../BackgroundDecorations';
import { toast, Toaster } from 'sonner';
import '../../app/globals.css';

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
            <span>
                {loading ? 'Signing up with Google...' : 'Continue with Google'}
            </span>
        </button>
    );
};

const Register = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [accountType, setAccountType] = useState('individual');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isResendingEmail] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [registeredUserEmail, setRegisteredUserEmail] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        companyType: 'startup',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleGoogleRegister = async () => {
        setIsGoogleLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // User already exists, redirect to dashboard
                toast.success("Welcome back!");
                router.push('/dashboard');
                return;
            }

            // Create user document first (required by security rules)
            const userData = {
                user_id: user.uid, // Required by security rules
                primary_email: user.email, // Required by security rules
                profile_info: { // Required by security rules
                    name: user.displayName || 'Google User', // Required by security rules
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Required by security rules
                }
                // account_memberships and session_context are optional according to rules
            };

            await setDoc(userDocRef, userData);

            toast.success("Account created successfully with Google!");
            router.push('/dashboard');

        } catch (error) {
            console.error('Error with Google registration:', error);
            let errorMessage = "Failed to sign up with Google. Please try again.";

            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-up was cancelled.";
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = "Popup was blocked. Please allow popups and try again.";
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "An account already exists with this email using a different sign-in method.";
            }

            toast.error(errorMessage);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            // Account type is always selected, no validation needed
        }

        if (step === 2) {
            if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';

            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            } else if (accountType === 'organization') {
                // For organization accounts, validate custom domain
                const domain = formData.email.split('@')[1];
                if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(domain.toLowerCase())) {
                    newErrors.email = 'Organization accounts require a custom company domain email';
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
        }

        if (step === 3) {
            if (accountType === 'organization') {
                if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
                if (!formData.companyType) newErrors.companyType = 'Company type is required';
            }
            if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleCreateAccount = async () => {
        if (!validateStep(3)) return;

        setIsCreatingAccount(true);

        try {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;

            if (accountType === 'individual') {
                // Create user document ONLY with required fields from security rules
                const userData = {
                    user_id: user.uid, // Required by security rules
                    primary_email: formData.email, // Required by security rules
                    profile_info: { // Required by security rules
                        name: formData.fullName, // Required by security rules
                        timezone: formData.timezone // Required by security rules
                    }
                    // Don't include account_memberships or session_context as they're optional
                    // and may be causing permission issues
                };

                await setDoc(doc(db, 'users', user.uid), userData);

                console.log('Individual user created successfully');

            } else {
                // Organization account creation
                const orgId = `org_${user.uid}_${Date.now()}`;

                // Step 1: Create user document with required fields ONLY
                const userData = {
                    user_id: user.uid, // Required by security rules
                    primary_email: formData.email, // Required by security rules
                    profile_info: { // Required by security rules
                        name: formData.fullName, // Required by security rules
                        timezone: formData.timezone // Required by security rules
                    }
                };

                await setDoc(doc(db, 'users', user.uid), userData);

                // Step 2: Create organization document with required fields from security rules
                const organizationData = {
                    org_id: orgId, // Required by security rules
                    organization_profile: { // Required by security rules
                        name: formData.companyName,
                        type: formData.companyType,
                        domain: formData.email.split('@')[1],
                        created_at: new Date().toISOString()
                    }
                };

                await setDoc(doc(db, 'organizations', orgId), organizationData);

                // Step 3: Add organization member record with required fields from security rules
                await setDoc(doc(db, 'organizations', orgId, 'members', user.uid), {
                    user_id: user.uid, // Required by security rules
                    org_email: formData.email, // Required by security rules
                    role: 'Admin', // Required by security rules - must be 'Admin' or 'Member'
                    join_date: new Date().toISOString(), // Required by security rules
                    status: 'active' // Required by security rules - must be 'active', 'invited', or 'suspended'
                });

                // Step 4: Now update user document with organization membership
                await setDoc(doc(db, 'users', user.uid), {
                    ...userData,
                    account_memberships: [{
                        org_id: orgId, // This is what the security rules check for
                        role: 'Admin',
                        status: 'active'
                    }]
                });

                console.log('Organization account created successfully');
            }

            // Send email verification after user document is created
            try {
                await sendEmailVerification(user, {
                    url: `${window.location.origin}/verify-email`,
                    handleCodeInApp: false,
                });
                toast.success("Account created successfully! Please check your email.");
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                toast.success("Account created successfully! Verification email will be sent shortly.");
            }

            // Store the email for display and sign out the user
            setRegisteredUserEmail(formData.email);

            // Sign out the user after successful registration
            await signOut(auth);

            setCurrentStep(4);

        } catch (error) {
            console.error('Error creating account:', error);
            let errorMessage = "Failed to create account. Please try again.";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "An account with this email already exists.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            } else if (error.code === 'permission-denied') {
                errorMessage = "Permission denied. Please check your account settings.";
            } else if (error.message && error.message.includes('permission-denied')) {
                errorMessage = "Permission denied while creating account. Please try again.";
            }

            toast.error(errorMessage);
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const handleResendEmail = async () => {
        // Since we signed out the user, we need to show a message instead
        toast.info("Please try signing in with your credentials. If your email isn't verified, you'll get an option to resend the verification email.");

        // Navigate to login page
        router.push('/login');
    };

    const handleSignInRedirect = () => {
        router.push('/login');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Create Your Account</h1>
                        <p className="text-slate-600 mb-6 text-center">Get started with QAID today</p>

                        {/* Google Sign Up */}
                        <div className="mb-6">
                            <GoogleSignUp
                                onGoogleRegister={handleGoogleRegister}
                                loading={isGoogleLoading}
                            />
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

                        <AccountTypeStep
                            accountType={accountType}
                            setAccountType={setAccountType}
                            onNext={nextStep}
                            currentStep={currentStep}
                        />
                    </>
                );
            case 2:
                return (
                    <PersonalInfoStep
                        formData={formData}
                        errors={errors}
                        onInputChange={handleInputChange}
                        onNext={nextStep}
                        onPrev={prevStep}
                        currentStep={currentStep}
                        accountType={accountType}
                    />
                );
            case 3:
                return (
                    <ReviewStep
                        formData={formData}
                        errors={errors}
                        accountType={accountType}
                        onInputChange={handleInputChange}
                        onPrev={prevStep}
                        onCreateAccount={handleCreateAccount}
                        isCreatingAccount={isCreatingAccount}
                        currentStep={currentStep}
                    />
                );
            case 4:
                return (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-teal-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
                            <p className="text-slate-600 mb-4">
                                We&apos;ve sent a verification email to <strong>{registeredUserEmail || formData.email}</strong>
                            </p>
                            <p className="text-sm text-slate-500">
                                Please check your inbox and spam folder, then click the verification link to continue.
                            </p>
                        </div>

                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-teal-800">
                                <strong>What happens next:</strong>
                            </p>
                            <ol className="text-sm text-teal-700 mt-2 space-y-1 text-left">
                                <li>1. Check your email inbox (and spam folder)</li>
                                <li>2. Click the verification link in the email</li>
                                <li>3. Return to the sign-in page to access your account</li>
                            </ol>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleResendEmail}
                                disabled={isResendingEmail}
                                className="w-full text-teal-600 py-2 px-4 text-sm hover:bg-teal-50 rounded transition-colors border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Didn&apos;t receive the email? Go to Sign In
                            </button>

                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 text-sm rounded transition-colors font-medium"
                            >
                                Go to Sign In
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <Toaster
                richColors
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '12px'
                    }
                }}
            />

            <BackgroundDecorations />

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    {/* Single Form Container */}
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>

                        {/* Step Content */}
                        {renderStepContent()}
                    </div>

                    {/* Sign In Link - Only show on steps 1-3 */}
                    {currentStep <= 3 && (
                        <div className="text-center mt-6">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
                                <button
                                    onClick={handleSignInRedirect}
                                    className="text-teal-600 hover:text-teal-700 font-medium hover:underline transition-colors"
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;