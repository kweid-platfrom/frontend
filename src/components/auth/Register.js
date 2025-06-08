"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import { toast, Toaster } from "sonner";
import { createUserDocument } from "../../services/userService";
import RegistrationForm from "./reg/RegistrationForm";
import GoogleSignUp from "./reg/GoogleSignUp";
import BackgroundDecorations from "../BackgroundDecorations";
import '../../app/globals.css';

const Register = () => {
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
    const [googleLoading, setGoogleLoading] = useState(false);
    
    // New state for Google account type selection
    const [showGoogleAccountType, setShowGoogleAccountType] = useState(false);
    const [googleUserData, setGoogleUserData] = useState(null);
    const [googleAccountType, setGoogleAccountType] = useState("individual");

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

    const validateForm = () => {
        const newErrors = {};

        // First Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        } else if (formData.firstName.trim().length < 2) {
            newErrors.firstName = "First name must be at least 2 characters";
        }

        // Last Name validation
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        } else if (formData.lastName.trim().length < 2) {
            newErrors.lastName = "Last name must be at least 2 characters";
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(formData.email)) {
                newErrors.email = "Please enter a valid email address";
            }
            
            // Enhanced organization domain validation
            if (formData.userType === "organization") {
                const commonDomains = [
                    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
                    'icloud.com', 'protonmail.com', 'yandex.com', 'mail.com', 'live.com',
                    'msn.com', 'comcast.net', 'sbcglobal.net', 'verizon.net'
                ];
                const domain = formData.email.split('@')[1]?.toLowerCase();
                if (commonDomains.includes(domain)) {
                    newErrors.email = "Organization accounts require a custom domain email (not personal email providers)";
                }
            }
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        // Confirm Password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Terms validation
        if (!formData.termsAccepted) {
            newErrors.termsAccepted = "You must accept the terms and conditions";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Standardized registration data structure
    const createRegistrationData = (userData, method, accountType) => {
        return {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            userType: accountType, // 'individual' or 'organization'
            accountType: accountType === "organization" ? "business" : "personal",
            registrationMethod: method, // 'email' or 'google'
            needsOnboarding: true,
            registrationTimestamp: Date.now(),
            ...(method === 'google' && {
                photoURL: userData.photoURL,
                isGoogleUser: true
            })
        };
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create user account with Firebase Auth
            console.log('Creating user account...');
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );

            const user = userCredential.user;
            console.log('User account created:', user.uid);

            // Step 2: Send email verification
            console.log('Sending verification email...');
            await sendEmailVerification(user, {
                url: process.env.NEXT_PUBLIC_APP_URL
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
                    : "https://your-domain.com/verify-email",
                handleCodeInApp: true
            });

            // Step 3: Create user document in Firestore
            console.log('Creating user document...');
            const userData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                accountType: formData.userType === "organization" ? "business" : "personal",
                setupCompleted: false,
                setupStep: "pending", // Will be updated after email verification
                onboardingProgress: {
                    emailVerified: false,
                    organizationInfo: formData.userType === "organization" ? false : true, // Skip for individuals
                    teamInvites: formData.userType === "organization" ? false : true, // Skip for individuals
                    projectCreation: false
                }
            };

            await createUserDocument(user, userData, 'registration');

            // Step 4: Store standardized registration data
            const registrationData = createRegistrationData({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email
            }, 'email', formData.userType);

            localStorage.setItem("registrationData", JSON.stringify(registrationData));
            localStorage.setItem("emailForVerification", formData.email);

            toast.success(
                "Account created successfully! Please check your email and click the verification link to complete your registration.", 
                {
                    duration: 8000,
                    position: "top-center"
                }
            );

            // Clear form
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                userType: "individual",
                password: "",
                confirmPassword: "",
                termsAccepted: false
            });

            // Sign out user until they verify email
            setTimeout(async () => {
                try {
                    await auth.signOut();
                    console.log('User signed out - verification required');
                } catch (signOutError) {
                    console.error('Sign out error:', signOutError);
                }
            }, 1000);

        } catch (error) {
            console.error("Registration error:", error);
            
            // Handle specific Firebase Auth errors
            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "An account with this email already exists. Please try signing in instead.";
                    break;
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
                default:
                    errorMessage = getFirebaseErrorMessage(error) || "Registration failed. Please try again.";
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
            // Configure Google provider
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log('Google sign-in successful:', user.uid);

            // Check if this is a new user or existing user
            const isNewUser = result._tokenResponse?.isNewUser || false;

            if (!isNewUser) {
                // Existing user - proceed normally
                toast.success("Welcome back! Signed in with Google.", {
                    duration: 4000,
                    position: "top-center"
                });
                // Let your auth context handle the redirect
                return;
            }

            // New user - need account type selection
            const userData = {
                firstName: user.displayName?.split(' ')[0] || "",
                lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
                email: user.email,
                photoURL: user.photoURL || ""
            };

            // Store user data and show account type selection
            setGoogleUserData({ user, userData });
            setShowGoogleAccountType(true);

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

    const handleGoogleAccountTypeSelection = async () => {
        if (!googleUserData) return;

        setGoogleLoading(true);

        try {
            const { user, userData } = googleUserData;

            // Create user document with selected account type
            const userDocData = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: userData.firstName + (userData.lastName ? ` ${userData.lastName}` : ''),
                photoURL: userData.photoURL,
                accountType: googleAccountType === "organization" ? "business" : "personal",
                setupCompleted: false,
                setupStep: googleAccountType === "organization" ? "organization_info" : "project_creation",
                onboardingProgress: {
                    emailVerified: true, // Google emails are pre-verified
                    organizationInfo: googleAccountType === "organization" ? false : true,
                    teamInvites: googleAccountType === "organization" ? false : true,
                    projectCreation: false
                }
            };

            await createUserDocument(user, userDocData, 'google');

            // Store standardized registration data
            const registrationData = createRegistrationData(userData, 'google', googleAccountType);
            localStorage.setItem("googleRegistrationData", JSON.stringify(registrationData));
            localStorage.setItem("needsOnboarding", "true");

            toast.success("Google registration successful! Please complete your profile setup.", {
                duration: 5000,
                position: "top-center"
            });

            // Reset states
            setShowGoogleAccountType(false);
            setGoogleUserData(null);
            setGoogleAccountType("individual");

            // Redirect to onboarding will be handled by your auth provider/context

        } catch (error) {
            console.error("Google account setup error:", error);
            toast.error("Failed to complete Google registration. Please try again.", {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    // Google Account Type Selection Modal
    const GoogleAccountTypeModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Complete Your Google Registration
                </h3>
                <p className="text-gray-600 mb-6">
                    Please select your account type to continue:
                </p>
                
                <div className="space-y-3 mb-6">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                            type="radio"
                            name="googleAccountType"
                            value="individual"
                            checked={googleAccountType === "individual"}
                            onChange={(e) => setGoogleAccountType(e.target.value)}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Individual</div>
                            <div className="text-sm text-gray-500">Personal QA testing and projects</div>
                        </div>
                    </label>
                    
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                            type="radio"
                            name="googleAccountType"
                            value="organization"
                            checked={googleAccountType === "organization"}
                            onChange={(e) => setGoogleAccountType(e.target.value)}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium text-gray-900">Organization</div>
                            <div className="text-sm text-gray-500">Team collaboration and management</div>
                        </div>
                    </label>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => {
                            setShowGoogleAccountType(false);
                            setGoogleUserData(null);
                            // Optionally sign out the user if they cancel
                            auth.signOut();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={googleLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleGoogleAccountTypeSelection}
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                        disabled={googleLoading}
                    >
                        {googleLoading ? "Setting up..." : "Continue"}
                    </button>
                </div>
            </div>
        </div>
    );

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

            {/* Google Account Type Selection Modal */}
            {showGoogleAccountType && <GoogleAccountTypeModal />}

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo - Outside the card */}
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    {/* Registration Card - More prominent */}
                    <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 relative">
                        {/* Card glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        
                        {/* Header - Inside the card */}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;