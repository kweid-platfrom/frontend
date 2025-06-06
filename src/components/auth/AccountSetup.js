/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth, isSignInWithEmailLink } from "firebase/auth";
import { completeEmailLinkSignIn } from "../../utils/auth";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { toast } from "sonner";
import { TeamInvite } from "./TeamInvite";
import { PersonalInfoStep } from "../../components/PersonalInfoStep";
import { OrganizationInfoStep } from "../../components/OrganizationInfoStep";
import { ProgressBar } from "../../components/ProgressBar";
import { StepNavigation } from "../../components/StepNavigation";
import { useFormValidation } from "../../hooks/useFormValidation";
import { accountService } from "../../services/accountService";
import "../../app/globals.css";

const auth = getAuth(app);

const AccountSetup = () => {
    // State management
    const [step, setStep] = useState(1);
    const [accountType, setAccountType] = useState('personal'); // Track account type
    const [totalSteps, setTotalSteps] = useState(2); // Dynamic step count
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
        
        // Set total steps based on account type
        if (detectedAccountType === 'personal') {
            setTotalSteps(2); // Personal: Step 1 (Personal Info) -> Step 2 (Complete)
        } else {
            setTotalSteps(3); // Business: Step 1 (Personal) -> Step 2 (Organization) -> Step 3 (Team Invite)
        }
    };

    // Authentication effect
    useEffect(() => {
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
    }, []);

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

    // Step navigation
    const handleNextStep = () => {
        if (step === 1) {
            const isNameValid = validateName(formData.name);
            const isEmailValid = validateEmail(formData.email);

            let isPasswordValid = true;
            if (!isGoogleAuth) {
                isPasswordValid = validatePassword(formData.password, formData.confirmPassword);
            }

            if (isNameValid && isEmailValid && isPasswordValid) {
                if (accountType === 'personal') {
                    // For personal accounts, go directly to completion
                    handleSetupAccount([]);
                } else {
                    // For business accounts, go to organization step
                    setStep(2);
                }
            }
        } else if (step === 2 && accountType === 'business') {
            setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // Account setup handlers
    const handleSendInvites = async (inviteEmails) => {
        await handleSetupAccount(inviteEmails);
    };

    const handleSkip = async () => {
        await handleSetupAccount([]);
    };

    const handleSetupAccount = async (inviteEmails = []) => {
        const user = auth.currentUser;
        if (!user) {
            toast.error("User authentication failed. Please log in again.", {
                duration: 4000,
                position: "top-center"
            });
            router.push("/login");
            return;
        }

        setIsLoading(true);

        try {
            await accountService.setupAccount({
                name: formData.name,
                email: formData.email,
                company: accountType === 'business' ? formData.company : '',
                industry: accountType === 'business' ? formData.industry : '',
                companySize: accountType === 'business' ? formData.companySize : '',
                password: formData.password,
                isGoogleAuth,
                inviteEmails: accountType === 'business' ? inviteEmails : []
            });

            toast.success("Account setup complete. Redirecting...", {
                duration: 3000,
                position: "top-center"
            });
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (error) {
            console.error("Setup error:", error);
            toast.error(error.message || "An error occurred during account setup.", {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setIsLoading(false);
        }
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
                // Only show organization step for business accounts
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
                // Only show team invite for business accounts
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
            if (!formData.name.trim() || !formData.email.trim()) return false;
            if (!isGoogleAuth && (!formData.password || !formData.confirmPassword)) return false;
            return !errors.name && !errors.email && !errors.password;
        }
        if (step === 2 && accountType === 'business') {
            // Validate organization info
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

                    {/* Account type indicator (optional - for debugging) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-center mt-4 text-sm text-slate-500">
                            Account Type: {accountType} | Steps: {totalSteps}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSetup;