"use client";

import React, { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import '../../app/globals.css';
import { useRouter } from "next/navigation";

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
        
        // Simulate API call
        setTimeout(() => {
            toast.success("Password reset link sent! Check your email.");
            setEmailSent(true);
            setLoading(false);
        }, 1500);
    };

    const handleBackToLogin = () => {
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            {/* Diagonal Zigzag Background Decoration */}
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

            {/* Additional Subtle Zigzag Lines */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/60 to-transparent transform rotate-12"></div>
                <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent transform -rotate-12"></div>
            </div>

            {/* Existing Decorative Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-0 w-px h-32 bg-gradient-to-b from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute top-40 right-10 w-px h-24 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute bottom-32 left-20 w-16 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"></div>
                <div className="absolute bottom-20 right-0 w-20 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="absolute top-1/3 left-1/4 w-px h-16 bg-gradient-to-b from-transparent via-slate-200 to-transparent transform rotate-45"></div>
                <div className="absolute top-2/3 right-1/4 w-12 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent transform rotate-45"></div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-screen px-6 relative z-10">
                <div className="w-full max-w-sm">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                        <div className="inline-block mb-4">
                            <div className="font-bold text-3xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                        {!emailSent ? (
                            <>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password</h1>
                                <p className="text-slate-600">Enter your email to reset your password</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-slate-900 mb-1">Check Your Email</h1>
                                <p className="text-slate-600">We&apos;ve sent a reset link to your email</p>
                            </>
                        )}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
                        {!emailSent ? (
                            <div className="space-y-5">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 block">
                                        Email address
                                    </label>
                                    <input
                                        className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                            error 
                                                ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                                : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                        } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
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
                                        <p className="text-red-600 text-sm font-medium flex items-center mt-2">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
                                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
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
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded px-6 py-2 transition-all duration-200 flex justify-center items-center gap-2"
                                >
                                    Send to different email
                                </button>
                            </div>
                        )}

                        {/* Back to Login */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleBackToLogin}
                                className="text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors flex items-center justify-center gap-2 mx-auto"
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