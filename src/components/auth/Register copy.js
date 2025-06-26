"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import { toast, Toaster } from "sonner";
import { createUserDocument } from "../../services/userService";
import { validateRegistration } from "../../utils/validation";

// Component imports
import RegistrationForm from "./reg/RegistrationForm";
import GoogleSignUp from "./reg/GoogleSignUp";
import BackgroundDecorations from "../BackgroundDecorations";

import '../../app/globals.css';
import RegistrationSuccess from "./RegistrationSuccess";

const Register = () => {
    // Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        userType: "individual",
        password: "",
        confirmPassword: "",
        termsAccepted: false
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Email verification state
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [lastResendTime, setLastResendTime] = useState(0);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Google registration state
    const [googleLoading, setGoogleLoading] = useState(false);

    // Helper function to determine account type based on email domain
    const determineAccountTypeFromEmail = (email) => {
        if (!email) return "individual";
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return "individual";
        
        // List of common public email domains
        const publicDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
            'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com',
            'yandex.com', 'mail.com', 'zoho.com', 'fastmail.com', 'tutanota.com',
            'gmx.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net'
        ];
        
        // If it's a public domain, it's an individual account
        if (publicDomains.includes(domain)) {
            return "individual";
        }
        
        // Custom domain = organization account
        return "organization";
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    // Store registration data for onboarding flow
    const storeRegistrationData = (userData, method, accountType) => {
        const registrationData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            userType: accountType,
            accountType: accountType === "organization" ? "business" : "personal",
            registrationMethod: method,
            needsOnboarding: true,
            needsEmailVerification: method === 'email',
            registrationTimestamp: Date.now(),
            ...(method === 'google' && {
                photoURL: userData.photoURL,
                isGoogleUser: true
            })
        };

        localStorage.setItem("registrationData", JSON.stringify(registrationData));
        localStorage.setItem("emailForVerification", userData.email);
        
        if (method === 'email') {
            localStorage.setItem("awaitingEmailVerification", "true");
        }
    };

    const handleResendVerification = async () => {
        const now = Date.now();
        const timeSinceLastResend = now - lastResendTime;
        const cooldownTime = 60000; // 60 seconds cooldown

        if (timeSinceLastResend < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - timeSinceLastResend) / 1000);
            toast.error(`Please wait ${remainingTime} seconds before resending.`, {
                duration: 3000,
                position: "top-center"
            });
            return;
        }

        setResendLoading(true);

        try {
            const email = localStorage.getItem("emailForVerification") || formData.email;
            const registrationData = JSON.parse(localStorage.getItem("registrationData") || "{}");
            
            if (!email || !registrationData.password) {
                toast.error("Unable to resend verification. Please try registering again.", {
                    duration: 5000,
                    position: "top-center"
                });
                return;
            }

            // Sign in temporarily to resend verification
            const userCredential = await signInWithEmailAndPassword(auth, email, registrationData.password);
            const user = userCredential.user;

            if (user.emailVerified) {
                toast.success("Your email is already verified! You can now sign in.", {
                    duration: 5000,
                    position: "top-center"
                });
                await auth.signOut();
                return;
            }

            await sendEmailVerification(user);
            await auth.signOut();

            setLastResendTime(now);
            
            // Start countdown timer
            let countdown = 60;
            setResendCountdown(countdown);
            const timer = setInterval(() => {
                countdown--;
                setResendCountdown(countdown);
                if (countdown <= 0) {
                    clearInterval(timer);
                    setResendCountdown(0);
                }
            }, 1000);

            toast.success("Verification email sent successfully! Check your inbox.", {
                duration: 5000,
                position: "top-center"
            });

        } catch (error) {
            console.error("Resend verification error:", error);
            
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "Account not found. Please register again.";
                    // Clear stored data and reset form
                    localStorage.removeItem("registrationData");
                    localStorage.removeItem("emailForVerification");
                    localStorage.removeItem("awaitingEmailVerification");
                    setRegistrationSuccess(false);
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = "Unable to verify account credentials. Please register again.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many requests. Please wait a few minutes before trying again.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your connection and try again.";
                    break;
                default:
                    errorMessage = getFirebaseErrorMessage(error) || "Failed to resend verification email. Please try again.";
            }

            toast.error(errorMessage, {
                duration: 6000,
                position: "top-center"
            });
        } finally {
            setResendLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const validationErrors = validateRegistration(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            console.log('Starting email registration...');

            // Step 1: Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;
            console.log('Firebase Auth user created:', user.uid);

            // Step 2: Send email verification
            try {
                await sendEmailVerification(user);
                console.log('Verification email sent successfully');
            } catch (emailError) {
                console.error('Email verification failed:', emailError);
                toast.error("Account created but verification email failed to send. You can resend it later.", {
                    duration: 6000,
                    position: "top-center"
                });
            }

            // Step 3: Prepare user data based on new architecture
            const userData = {
                user_id: user.uid,
                primary_email: formData.email.toLowerCase().trim(),
                profile_info: {
                    name: {
                        first: formData.firstName.trim(),
                        last: formData.lastName.trim(),
                        display: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
                    },
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    avatar_url: null,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                account_memberships: [],
                session_context: {
                    current_account_id: null,
                    current_account_type: formData.userType,
                    preferences: {
                        theme: 'light',
                        notifications: true
                    }
                },
                auth_metadata: {
                    registration_method: 'email',
                    email_verified: false,
                    registration_date: new Date(),
                    last_login: null
                }
            };

            // Step 4: Create user document
            try {
                await createUserDocument(user, userData, 'email');
                console.log('User document created successfully');
            } catch (firestoreError) {
                console.error('Firestore document creation failed:', firestoreError);
                try {
                    await user.delete();
                    console.log('Auth user deleted due to Firestore failure');
                } catch (deleteError) {
                    console.error('Failed to delete auth user:', deleteError);
                }
                throw new Error(`Database error: ${firestoreError.message}`);
            }

            // Step 5: Create individual account if user type is individual
            if (formData.userType === 'individual') {
                try {
                    const individualAccountData = {
                        user_id: user.uid,
                        account_profile: {
                            display_name: `${formData.firstName.trim()}'s Account`,
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        subscription: {
                            plan: 'free',
                            status: 'active',
                            started_at: new Date(),
                            billing_cycle: null
                        },
                        usage_metrics: {
                            test_suites_count: 0,
                            storage_used_mb: 0,
                            api_calls_this_month: 0
                        },
                        settings: {
                            default_visibility: 'private',
                            auto_backup: true,
                            email_notifications: true
                        }
                    };

                    // Create individual account document
                    await createIndividualAccount(user.uid, individualAccountData);
                    console.log('Individual account created successfully');
                } catch (accountError) {
                    console.error('Individual account creation failed:', accountError);
                    // Don't fail the registration for account creation issues
                    toast.warning("Account created but individual profile setup had issues. You can complete setup later.", {
                        duration: 6000,
                        position: "top-center"
                    });
                }
            }

            // Step 6: Store registration data
            const registrationData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email,
                password: formData.password, // Store temporarily for resend functionality
                userType: formData.userType,
                accountType: formData.userType === "organization" ? "business" : "personal",
                registrationMethod: 'email',
                needsOnboarding: true,
                needsEmailVerification: true,
                registrationTimestamp: Date.now()
            };

            localStorage.setItem("registrationData", JSON.stringify(registrationData));
            localStorage.setItem("emailForVerification", formData.email);
            localStorage.setItem("awaitingEmailVerification", "true");

            // Step 7: Sign out user until they verify email
            await auth.signOut();
            console.log('User signed out - email verification required');

            // Step 8: Show success state
            setRegistrationSuccess(true);
            toast.success(
                "Account created successfully!",
                {
                    duration: 10000,
                    position: "top-center"
                }
            );

            // Clear form but keep email for resend functionality
            const currentEmail = formData.email;
            setFormData({
                firstName: "",
                lastName: "",
                email: currentEmail,
                userType: "individual",
                password: "",
                confirmPassword: "",
                termsAccepted: false
            });

        } catch (error) {
            console.error("Registration error:", error);

            let errorMessage;
            if (error.message.includes('Database error:')) {
                errorMessage = "Failed to create user profile. Please check your internet connection and try again.";
            } else {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = "An account with this email already exists. Try signing in instead, or check your email for a verification link.";
                        toast.error(errorMessage, {
                            duration: 8000,
                            position: "top-center",
                            action: {
                                label: "Go to Sign In",
                                onClick: () => window.location.href = '/login'
                            }
                        });
                        return;
                    case 'auth/weak-password':
                        errorMessage = "Password is too weak. Please choose a stronger password.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "Please enter a valid email address.";
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = "Email/password registration is not enabled. Please contact support.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Network error. Please check your internet connection and try again.";
                        break;
                    case 'permission-denied':
                        errorMessage = "Database permission denied. Please check your Firestore security rules.";
                        break;
                    default:
                        errorMessage = getFirebaseErrorMessage(error) || `Registration failed: ${error.message}`;
                }
            }

            toast.error(errorMessage, {
                duration: 6000,
                position: "top-center"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);

        try {
            console.log('Starting Google registration...');

            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log('Google sign-in successful:', user.uid);

            // Check if this is a new user
            const isNewUser = result._tokenResponse?.isNewUser || false;

            if (!isNewUser) {
                toast.success("Welcome back! Signed in with Google.", {
                    duration: 4000,
                    position: "top-center"
                });
                return;
            }

            // New user - automatically determine account type from email domain
            const userData = {
                firstName: user.displayName?.split(' ')[0] || "",
                lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
                email: user.email,
                photoURL: user.photoURL || ""
            };

            // Determine account type based on email domain
            const accountType = determineAccountTypeFromEmail(user.email);
            
            console.log('Google registration - Auto-detected account type:', {
                email: user.email,
                domain: user.email?.split('@')[1],
                accountType
            });

            // Show user what account type was detected
            const domainType = accountType === 'organization' ? 'custom domain' : 'public email provider';
            toast.info(`Detected ${domainType} - setting up ${accountType} account`, {
                duration: 4000,
                position: "top-center"
            });

            // Prepare user data based on new architecture
            const userDocData = {
                user_id: user.uid,
                primary_email: user.email.toLowerCase().trim(),
                profile_info: {
                    name: {
                        first: userData.firstName,
                        last: userData.lastName,
                        display: user.displayName || `${userData.firstName} ${userData.lastName}`.trim()
                    },
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    avatar_url: userData.photoURL,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                account_memberships: [],
                session_context: {
                    current_account_id: null,
                    current_account_type: accountType,
                    preferences: {
                        theme: 'light',
                        notifications: true
                    }
                },
                auth_metadata: {
                    registration_method: 'google',
                    email_verified: true, // Google emails are pre-verified
                    registration_date: new Date(),
                    last_login: new Date(),
                    google_profile: {
                        id: user.uid,
                        photo_url: userData.photoURL
                    }
                }
            };

            // Create user document
            await createUserDocument(user, userDocData, 'google');
            console.log('Google user document created successfully');

            // Create individual account if user type is individual
            if (accountType === 'individual') {
                try {
                    const individualAccountData = {
                        user_id: user.uid,
                        account_profile: {
                            display_name: `${userData.firstName}'s Account`,
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        subscription: {
                            plan: 'free',
                            status: 'active',
                            started_at: new Date(),
                            billing_cycle: null
                        },
                        usage_metrics: {
                            test_suites_count: 0,
                            storage_used_mb: 0,
                            api_calls_this_month: 0
                        },
                        settings: {
                            default_visibility: 'private',
                            auto_backup: true,
                            email_notifications: true
                        }
                    };

                    await createIndividualAccount(user.uid, individualAccountData);
                    console.log('Individual account created successfully');
                } catch (accountError) {
                    console.error('Individual account creation failed:', accountError);
                    toast.warning("Account created but individual profile setup had issues. You can complete setup later.", {
                        duration: 6000,
                        position: "top-center"
                    });
                }
            }

            // Store registration data for onboarding
            storeRegistrationData(userData, 'google', accountType);
            localStorage.setItem("needsOnboarding", "true");
            localStorage.removeItem("awaitingEmailVerification");

            const accountTypeText = accountType === 'organization' ? 'organization' : 'individual';
            toast.success(`Google registration successful! Setting up your ${accountTypeText} account...`, {
                duration: 3000,
                position: "top-center"
            });

            // Redirect to onboarding
            setTimeout(() => {
                window.location.href = '/onboarding';
            }, 1500);

        } catch (error) {
            console.error("Google registration error:", error);

            let errorMessage;
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in was cancelled. Please try again.";
                    break;
                case 'auth/popup-blocked':
                    errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
                    break;
                case 'auth/account-exists-with-different-credential':
                    errorMessage = "An account already exists with this email using a different sign-in method.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your connection and try again.";
                    break;
                default:
                    errorMessage = getFirebaseErrorMessage(error) || "Google sign-in failed. Please try again.";
            }

            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoToLogin = () => {
        window.location.href = '/login';
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

                    {/* Registration Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>

                        {registrationSuccess ? (
                            <RegistrationSuccess
                                email={formData.email || localStorage.getItem("emailForVerification")}
                                onResendVerification={handleResendVerification}
                                onGoToLogin={handleGoToLogin}
                                resendLoading={resendLoading}
                                resendCountdown={resendCountdown}
                            />
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                                    <p className="text-base sm:text-lg text-slate-600">Streamline your testing workflow</p>
                                </div>

                                <div className="space-y-6">
                                    <GoogleSignUp
                                        onGoogleRegister={handleGoogleRegister}
                                        loading={googleLoading}
                                    />

                                    {/* Divider */}
                                    <div className="flex items-center my-8">
                                        <div className="flex-grow border-t border-slate-300"></div>
                                        <span className="px-4 text-sm text-slate-500 font-medium bg-white">or register with email</span>
                                        <div className="flex-grow border-t border-slate-300"></div>
                                    </div>

                                    <RegistrationForm
                                        formData={formData}
                                        errors={errors}
                                        loading={loading}
                                        onInputChange={handleInputChange}
                                        onSubmit={handleRegister}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to create individual account (you'll need to implement this in your userService)
const createIndividualAccount = async (userId, accountData) => {
    // Import your Firestore instance
    const { db } = await import("../../config/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    
    const accountRef = doc(db, "individualAccounts", userId);
    await setDoc(accountRef, accountData);
};

export default Register;