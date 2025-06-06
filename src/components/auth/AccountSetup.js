/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, isSignInWithEmailLink, onAuthStateChanged } from "firebase/auth";
import { completeEmailLinkSignIn, registerWithEmail, logInWithEmail } from "../../services/authService";
import { createUserIfNotExists, completeUserSetup } from "../../services/userService";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { toast } from "sonner";
import { TeamInvite } from "./TeamInvite";
import { PersonalInfoStep } from "../../components/PersonalInfoStep";
import { OrganizationInfoStep } from "../../components/OrganizationInfoStep";
import { ProgressBar } from "../../components/ProgressBar";
import { StepNavigation } from "../../components/StepNavigation";
import { useFormValidation } from "../../hooks/useFormValidation";
import "../../app/globals.css";

const auth = getAuth(app);

const AccountSetup = () => {
    // State management
    const [step, setStep] = useState(1);
    const [accountType, setAccountType] = useState('personal');
    const [totalSteps, setTotalSteps] = useState(2);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        industry: "",
        companySize: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);
    const [authUser, setAuthUser] = useState(null);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Hooks
    const { errors, validateName, validateEmail, validatePassword, clearError, getAccountType } = useFormValidation();
    const router = useRouter();

    // Refs for authentication handling
    const authAttemptedRef = useRef(false);
    const authErrorMessageRef = useRef(null);
    const redirectToRegisterRef = useRef(false);

    // Utility functions
    const extractNameFromEmail = (email) => {
        if (!email) return "";
        const emailPrefix = email.split('@')[0];
        return emailPrefix
            .replace(/[._0-9]/g, ' ')
            .split(' ')
            .filter(word => word.length > 0)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getNameFromSources = (firebaseUser) => {
        const storedName = localStorage.getItem("userFullName") ||
            localStorage.getItem("googleUserName") ||
            localStorage.getItem("registeredUserName");

        if (storedName && storedName.trim()) {
            return storedName.trim();
        }

        if (firebaseUser?.displayName && firebaseUser.displayName.trim()) {
            return firebaseUser.displayName.trim();
        }

        if (firebaseUser?.email) {
            return extractNameFromEmail(firebaseUser.email);
        }

        return "";
    };

    // Function to determine account type and set total steps
    const determineAccountTypeAndSteps = (email) => {
        if (!email) return;

        const detectedAccountType = getAccountType(email);
        setAccountType(detectedAccountType);

        if (detectedAccountType === 'personal') {
            setTotalSteps(2);
        } else {
            setTotalSteps(3);
        }
    };

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? 'User authenticated' : 'No user');
            setAuthUser(user);
            setAuthInitialized(true);
        });

        return () => unsubscribe();
    }, []);

    // Authentication effect
    useEffect(() => {
        if (!authInitialized) return;

        const googleUserName = localStorage.getItem("googleUserName");
        const googleUserEmail = localStorage.getItem("googleUserEmail");

        if (googleUserName && googleUserEmail) {
            setFormData(prev => ({
                ...prev,
                name: googleUserName,
                email: googleUserEmail
            }));
            setIsGoogleAuth(true);
            authAttemptedRef.current = true;
            determineAccountTypeAndSteps(googleUserEmail);
            return;
        }

        if (authAttemptedRef.current) {
            return;
        }

        authAttemptedRef.current = true;
        const storedEmail = window.localStorage.getItem("emailForSignIn");

        if (!storedEmail) {
            authErrorMessageRef.current = "Invalid or expired link. Please register again.";
            redirectToRegisterRef.current = true;
            return;
        }

        if (isSignInWithEmailLink(auth, window.location.href)) {
            completeEmailLinkSignIn(storedEmail, window.location.href)
                .then((result) => {
                    if (!result.user) {
                        authErrorMessageRef.current = "Authentication failed. Please try again.";
                        redirectToRegisterRef.current = true;
                    } else {
                        const storedName = localStorage.getItem("registeredUserName");
                        const extractedName = storedName?.trim() || getNameFromSources(result.user);

                        setFormData(prev => ({
                            ...prev,
                            email: result.user.email || "",
                            name: extractedName
                        }));

                        determineAccountTypeAndSteps(result.user.email);

                        window.localStorage.removeItem("emailForSignIn");
                        window.localStorage.removeItem("emailSentTimestamp");
                    }
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);
                    authErrorMessageRef.current = error.message || "Invalid or expired link. Please register again.";
                    redirectToRegisterRef.current = true;
                });
        }
    }, [authInitialized]);

    // Watch for email changes to update account type
    useEffect(() => {
        if (formData.email) {
            determineAccountTypeAndSteps(formData.email);
        }
    }, [formData.email]);

    // Error handling effect
    useEffect(() => {
        if (authAttemptedRef.current && authErrorMessageRef.current) {
            toast.error(authErrorMessageRef.current, {
                duration: 5000,
                position: "top-center"
            });
            authErrorMessageRef.current = null;

            if (redirectToRegisterRef.current) {
                const timeoutId = setTimeout(() => {
                    router.push("/register");
                }, 2000);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [router]);

    // Form handlers
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            clearError(field);
        }
    };

    const handleTogglePassword = (field) => {
        if (field === 'showPassword') {
            setShowPassword(!showPassword);
        } else if (field === 'showConfirmPassword') {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    const handleClearError = (field) => {
        clearError(field);
    };

    // UPDATED: Simplified authentication logic using userService
    const authenticateUser = async () => {
        console.log('Starting authentication process...');

        // If user is already authenticated (email link or Google), return them
        if (authUser) {
            console.log('User already authenticated:', authUser.uid);
            return authUser;
        }

        // If this is Google auth, user should already be authenticated
        if (isGoogleAuth) {
            console.log('Google auth detected, user should be authenticated');
            if (!authUser) {
                throw new Error('Google authentication failed - user not found');
            }
            return authUser;
        }

        // For email link users, they should already be authenticated
        // Only attempt email/password registration if they have a password (new manual registration)
        if (formData.password && formData.password.trim()) {
            try {
                console.log('Attempting to register with email/password...');
                const userCredential = await registerWithEmail(formData.email, formData.password);
                console.log('Registration successful:', userCredential.user.uid);
                return userCredential.user;
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    console.log('Email already exists, attempting sign in...');
                    try {
                        const signInResult = await logInWithEmail(formData.email, formData.password);
                        console.log('Sign in successful:', signInResult.user.uid);
                        return signInResult.user;
                    } catch (signInError) {
                        console.error('Sign in failed:', signInError);
                        throw new Error('Email already exists but password is incorrect');
                    }
                }
                throw error;
            }
        }

        // If we reach here, something is wrong - user should be authenticated
        throw new Error('User authentication failed - no valid authentication method found');
    };

    // UPDATED: Using userService for user document creation
    const createUserAccount = async (user) => {
        console.log('Creating user account for:', user.uid);

        try {
            // Prepare additional data from form
            const additionalData = {
                name: formData.name.trim(),
                company: formData.company?.trim() || '',
                industry: formData.industry || '',
                companySize: formData.companySize || '',
                accountType: accountType,
                setupCompleted: true,
                setupStep: 'completed'
            };

            // Use userService to create or update user document
            const result = await createUserIfNotExists(user, additionalData, 'setup');

            if (result.error) {
                throw new Error(result.error);
            }

            console.log('User account created/updated successfully:', {
                isNewUser: result.isNewUser,
                needsSetup: result.needsSetup
            });

            return result.userData;
        } catch (error) {
            console.error('Failed to create user account:', error);
            throw error;
        }
    };

    // UPDATED: Complete user setup using userService
    const completeAccountSetup = async (user) => {
        console.log('Completing account setup for:', user.uid);

        try {
            // Prepare setup data
            const setupData = {
                name: formData.name.trim(),
                company: formData.company?.trim() || '',
                industry: formData.industry || '',
                companySize: formData.companySize || '',
                accountType: accountType
            };

            // Use userService to complete setup
            const userData = await completeUserSetup(user.uid, setupData);

            console.log('Account setup completed successfully');
            return userData;
        } catch (error) {
            console.error('Failed to complete account setup:', error);
            throw error;
        }
    };

    // UPDATED: Streamlined handleNextStep function
    const handleNextStep = async () => {
        console.log('handleNextStep called', { step, accountType, formData });

        // Validation
        const isNameValid = formData.name && formData.name.trim().length > 0;
        const isEmailValid = formData.email && /\S+@\S+\.\S+/.test(formData.email);
        const isPasswordValid = isGoogleAuth || (formData.password && formData.password.length >= 6);

        if (!isNameValid || !isEmailValid || !isPasswordValid) {
            console.log('Validation failed:', { isNameValid, isEmailValid, isPasswordValid });

            if (!isNameValid) validateName(formData.name);
            if (!isEmailValid) validateEmail(formData.email);
            if (!isPasswordValid && !isGoogleAuth) {
                validatePassword(formData.password, formData.confirmPassword);
            }

            toast.error('Please fix the form errors before continuing', {
                duration: 3000,
                position: "top-center"
            });
            return;
        }

        // Handle personal account completion
        if (step === 1 && accountType === 'personal') {
            console.log('Completing personal account setup...');
            setIsLoading(true);

            try {
                // Step 1: Authenticate user
                const user = await authenticateUser();
                if (!user) {
                    throw new Error('Authentication failed - no user returned');
                }

                // Step 2: Create/update user document using userService
                await createUserAccount(user);

                // Step 3: Clean up and redirect
                localStorage.removeItem("googleUserName");
                localStorage.removeItem("googleUserEmail");
                localStorage.removeItem("registeredUserName");
                localStorage.removeItem("emailForSignIn");
                localStorage.removeItem("emailSentTimestamp");

                toast.success("Account setup complete! Redirecting to dashboard...", {
                    duration: 3000,
                    position: "top-center"
                });

                // Small delay to show success message
                setTimeout(() => {
                    console.log('Redirecting to dashboard...');
                    router.push("/dashboard");
                }, 1500);

            } catch (error) {
                console.error('Personal account setup failed:', error);
                toast.error(error.message || 'Account setup failed. Please try again.', {
                    duration: 4000,
                    position: "top-center"
                });
            } finally {
                setIsLoading(false);
            }
        }
        // Handle business account flow
        else if (step === 1 && accountType === 'business') {
            console.log('Business account - moving to organization info step');
            setStep(2);
        }
        else if (step === 2 && accountType === 'business') {
            if (!formData.company.trim() || !formData.industry || !formData.companySize) {
                toast.error('Please fill in all organization details', {
                    duration: 3000,
                    position: "top-center"
                });
                return;
            }
            console.log('Organization info validated - moving to team invite step');
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // UPDATED: Business account setup with userService
    const handleSendInvites = async (inviteEmails) => {
        console.log('Completing business account setup with invites...');
        setIsLoading(true);

        try {
            // Step 1: Authenticate user
            const user = await authenticateUser();
            if (!user) {
                throw new Error('Authentication failed - no user returned');
            }

            // Step 2: Complete user setup using userService
            await completeAccountSetup(user);

            // Step 3: Handle invites (implement your invite logic here)
            if (inviteEmails && inviteEmails.length > 0) {
                console.log('Processing team invites:', inviteEmails);
                // TODO: Implement your invite sending logic
            }

            // Step 4: Clean up and redirect
            localStorage.removeItem("googleUserName");
            localStorage.removeItem("googleUserEmail");
            localStorage.removeItem("registeredUserName");
            localStorage.removeItem("emailForSignIn");
            localStorage.removeItem("emailSentTimestamp");

            toast.success("Account setup complete! Redirecting to dashboard...", {
                duration: 3000,
                position: "top-center"
            });

            setTimeout(() => {
                console.log('Redirecting to dashboard...');
                router.push("/dashboard");
            }, 1500);

        } catch (error) {
            console.error('Business account setup failed:', error);
            toast.error(error.message || 'Account setup failed. Please try again.', {
                duration: 4000,
                position: "top-center"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        await handleSendInvites([]);
    };

    // Step content renderer
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <PersonalInfoStep
                        formData={formData}
                        errors={errors}
                        showPassword={showPassword}
                        showConfirmPassword={showConfirmPassword}
                        isGoogleAuth={isGoogleAuth}
                        onInputChange={handleInputChange}
                        onTogglePassword={handleTogglePassword}
                        onClearError={handleClearError}
                        accountType={accountType}
                    />
                );

            case 2:
                if (accountType === 'business') {
                    return (
                        <OrganizationInfoStep
                            formData={formData}
                            onInputChange={handleInputChange}
                        />
                    );
                }
                return null;

            case 3:
                if (accountType === 'business') {
                    return (
                        <form onSubmit={(e) => e.preventDefault()}>
                            <TeamInvite
                                onSendInvites={handleSendInvites}
                                onSkip={handleSkip}
                                isLoading={isLoading}
                                userEmail={formData.email}
                                organizationName={formData.company}
                                inviterName={formData.name}
                            />
                        </form>
                    );
                }
                return null;

            default:
                return null;
        }
    };

    // Validation for step navigation
    const canProceedToNextStep = () => {
        if (step === 1) {
            const hasRequiredFields = formData.name.trim() && formData.email.trim();
            const hasPasswordFields = isGoogleAuth || (formData.password && formData.confirmPassword);
            const noValidationErrors = !errors.name && !errors.email && !errors.password;

            return hasRequiredFields && hasPasswordFields && noValidationErrors;
        }
        if (step === 2 && accountType === 'business') {
            return formData.company.trim() && formData.industry && formData.companySize;
        }
        return true;
    };

    // Get button text based on account type and step
    const getNextButtonText = () => {
        if (step === 1 && accountType === 'personal') {
            return isLoading ? 'Setting up...' : 'Complete Setup';
        }
        if (step === 1 && accountType === 'business') {
            return 'Continue';
        }
        if (step === 2 && accountType === 'business') {
            return 'Continue';
        }
        return 'Next';
    };

    // Show loading screen while auth is initializing
    if (!authInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Initializing authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading screen only during account creation process
    if (isLoading && (
        (step === 1 && accountType === 'personal') ||
        (step === 3 && accountType === 'business')
    )) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Setting up your account...</p>
                    <p className="text-slate-500 text-sm mt-2">This may take a moment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="zigzagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#0891b2" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
                <path
                    d="M-10,10 L20,40 L50,10 L80,40 L110,10 L110,25 L80,55 L50,25 L20,55 L-10,25 Z"
                    fill="url(#zigzagGradient)"
                />
                <path
                    d="M-10,50 L20,80 L50,50 L80,80 L110,50 L110,65 L80,95 L50,65 L20,95 L-10,65 Z"
                    fill="url(#zigzagGradient)"
                />
            </svg>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent transform rotate-12"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent transform -rotate-12"></div>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-0 w-px h-32 bg-gradient-to-b from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute top-40 right-10 w-px h-24 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute bottom-32 left-20 w-16 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute bottom-20 right-0 w-20 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute top-1/3 left-1/4 w-px h-16 bg-gradient-to-b from-transparent via-slate-200 to-transparent transform rotate-45"></div>
                <div className="absolute top-2/3 right-1/4 w-12 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent transform rotate-45"></div>
            </div>

            {/* Main content */}
            <div className="flex items-center justify-center min-h-screen px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Complete your setup</h1>
                        <p className="text-slate-600">
                            {accountType === 'personal'
                                ? 'Complete your personal account setup to get started'
                                : 'Complete your business account setup to get started'
                            }
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <ProgressBar currentStep={step} totalSteps={totalSteps} />

                    {/* Form Card */}
                    <div className="bg-white/90 backdrop-blur-sm rounded shadow-sm shadow-slate-200/50 border border-slate-200/50 p-6">
                        <div className="space-y-5">
                            {renderStepContent()}

                            {/* Step Navigation */}
                            <StepNavigation
                                currentStep={step}
                                totalSteps={totalSteps}
                                onNext={handleNextStep}
                                onPrev={handlePrevStep}
                                canProceed={canProceedToNextStep()}
                                nextButtonText={getNextButtonText()}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>

                    {/* Debug info for development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-center mt-4 text-sm text-slate-500">
                            Account Type: {accountType} | Steps: {totalSteps} | Current Step: {step}
                            <br />
                            Auth User: {authUser ? 'Yes' : 'No'} | Auth Initialized: {authInitialized ? 'Yes' : 'No'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSetup;