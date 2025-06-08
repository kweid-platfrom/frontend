"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrorHandler";
import { toast, Toaster } from "sonner";
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
            
            // Organization domain validation
            if (formData.userType === "organization") {
                const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
                const domain = formData.email.split('@')[1]?.toLowerCase();
                if (commonDomains.includes(domain)) {
                    newErrors.email = "Organization accounts require a custom domain email";
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

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const actionCodeSettings = {
                url: process.env.NEXT_PUBLIC_APP_URL
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
                    : "https://your-domain.com/verify-email",
                handleCodeInApp: true,
                expires: 259200 // 3 days
            };

            await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings);

            // Store user info for verification
            const userData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email,
                userType: formData.userType,
                password: formData.password, // In production, hash this
                emailSentTimestamp: Date.now().toString()
            };

            window.localStorage.setItem("emailForSignIn", formData.email);
            window.localStorage.setItem("pendingUserData", JSON.stringify(userData));

            toast.success("Verification email sent! Please check your inbox. The link will be valid for 3 days.", {
                duration: 5000,
                position: "top-center"
            });

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

        } catch (error) {
            console.error("Firebase error:", error.code, error.message);
            const errorMessage = getFirebaseErrorMessage(error);
            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Store Google user data
            const googleUserData = {
                firstName: user.displayName?.split(' ')[0] || "",
                lastName: user.displayName?.split(' ').slice(1).join(' ') || "",
                email: user.email || "",
                photoURL: user.photoURL || "",
                userType: "individual", // Default to individual for Google signup
                isGoogleUser: true
            };

            localStorage.setItem("googleUserData", JSON.stringify(googleUserData));
            localStorage.setItem("needsOnboarding", "true");

            toast.success("Google authentication successful!", {
                duration: 4000,
                position: "top-center"
            });

            // Redirect will be handled by auth provider
        } catch (error) {
            console.error(error.message);
            const errorMessage = getFirebaseErrorMessage(error);
            toast.error(errorMessage, {
                duration: 5000,
                position: "top-center"
            });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
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