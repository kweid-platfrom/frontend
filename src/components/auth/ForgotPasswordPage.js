"use client";

import React, { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import '../../app/globals.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import BackgroundDecorations from "@/components/BackgroundDecorations";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Mock functions for demonstration
    const router = useRouter();

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Email field cannot be empty.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            // TODO: Replace with your actual password reset API call
            // Example: await sendPasswordResetEmail(auth, email);
            // or: await yourApiCall('/api/reset-password', { email });
            
            toast.success("Password reset link sent! Check your email.");
            setEmailSent(true);
        } catch (error) {
            setError(error.message || "Failed to send reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="w-32 h-32 flex items-center justify-center">
                                <Image src="/logo.svg" alt="Assura Logo" width={128} height={128} className="w-32 h-32 object-contain" />
                            </div>
                        </div>
                        {!emailSent ? (
                            <>
                                <h1 className="text-2xl font-bold text-card-foreground mb-1">Forgot Password</h1>
                                <p className="text-muted-foreground">Enter your email to reset your password</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-card-foreground mb-1">Check Your Email</h1>
                                <p className="text-muted-foreground">We&apos;ve sent a reset link to your email</p>
                            </>
                        )}
                    </div>

                    {/* Form Card */}
                    <div className="bg-card rounded-xl shadow-theme-xl border border-border p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-teal-500/10 rounded-2xl blur-xl -z-10"></div>
                        {!emailSent ? (
                            <div className="space-y-5">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-card-foreground block">
                                        Email address
                                    </label>
                                    <input
                                        className={`w-full px-4 py-2.5 border rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 ${error
                                                ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                                                : "border-input focus:border-primary focus:ring-ring/20"
                                            } focus:outline-none focus:ring-2`}
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (error) setError("");
                                        }}
                                        required
                                    />
                                    {error && (
                                        <p className="text-destructive text-xs font-medium mt-2">
                                            <svg className="w-4 h-4 mr-1 inline" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {error}
                                        </p>
                                    )}
                                </div>

                                {/* Reset Button */}
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded px-6 py-2.5 transition-all duration-200 flex justify-center items-center gap-2 shadow-theme-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin h-5 w-5" />
                                            Sending reset link...
                                        </>
                                    ) : (
                                        'Send reset link'
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5 text-center">
                                {/* Success Message */}
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center justify-center mb-2">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-green-800 font-medium">Reset link sent successfully!</p>
                                    <p className="text-green-700 text-sm mt-1">Check your email and follow the instructions to reset your password.</p>
                                </div>

                                {/* Resend Button */}
                                <button
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail("");
                                    }}
                                    className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded px-6 py-2.5 transition-all duration-200 flex justify-center items-center gap-2"
                                >
                                    Send to different email
                                </button>
                            </div>
                        )}

                        {/* Back to Login */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleBackToLogin}
                                className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;