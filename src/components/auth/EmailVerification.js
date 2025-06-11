"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendEmailVerification, applyActionCode } from "firebase/auth";
import { auth } from '../../config/firebase'; // Add this import
import { useAuth } from '../../context/AuthProvider'; 
import BubbleBackground from '../BackgroundDecorations';
import '../../app/globals.css'

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser } = useAuth();
    const [status, setStatus] = useState("waiting"); // waiting | resending | sent | error | verifying | success
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const handleEmailVerification = async () => {
            const mode = searchParams.get('mode');
            const oobCode = searchParams.get('oobCode');
            
            // If this is an email verification callback
            if (mode === 'verifyEmail' && oobCode) {
                setStatus("verifying");
                setMessage("Verifying your email...");
                
                try {
                    await applyActionCode(auth, oobCode); // Now auth is properly imported
                    
                    // Mark verification as complete
                    localStorage.setItem('emailVerificationComplete', 'true');
                    localStorage.removeItem('awaitingEmailVerification');
                    
                    setStatus("success");
                    setMessage("Email verified successfully!");
                    
                    // Wait 2 seconds then redirect to continue onboarding
                    setTimeout(() => {
                        if (currentUser) {
                            // Reload the user to get updated emailVerified status
                            currentUser.reload().then(() => {
                                // The AuthProvider will handle routing to onboarding
                                router.push('/dashboard'); // This will be intercepted by AuthProvider routing logic
                            });
                        } else {
                            router.push('/login?verified=true');
                        }
                    }, 2000);
                    
                    return;
                } catch (error) {
                    console.error("Email verification failed:", error);
                    setStatus("error");
                    
                    // Handle different verification error types
                    if (error.code === 'auth/expired-action-code') {
                        setMessage("This verification link has expired. We'll send you a new one.");
                        // Automatically resend verification email
                        setTimeout(async () => {
                            if (currentUser) {
                                try {
                                    await sendEmailVerification(currentUser);
                                    setStatus("sent");
                                    setMessage("New verification email sent! Check your inbox for the fresh link.");
                                    setCountdown(60);
                                } catch (resendError) {
                                    console.error("Auto-resend failed:", resendError);
                                    setMessage("Link expired and couldn't auto-send new one. Please click 'Resend' below.");
                                }
                            }
                        }, 2000);
                    } else if (error.code === 'auth/invalid-action-code') {
                        setMessage("This verification link is invalid or has already been used.");
                    } else {
                        setMessage("Email verification failed. Please try requesting a new verification email.");
                    }
                    return;
                }
            }
            
            // Regular verification page logic
            const verificationComplete = localStorage.getItem('emailVerificationComplete');
            if (verificationComplete === 'true') {
                localStorage.removeItem('emailVerificationComplete');
                setStatus("success");
                setMessage("Email verified successfully! Redirecting...");
                setTimeout(() => {
                    router.push('/dashboard'); // AuthProvider will handle proper routing
                }, 1500);
                return;
            }

            // If no current user, redirect to register
            if (!currentUser) {
                router.push('/register');
                return;
            }

            // If user is already verified, proceed to next step
            if (currentUser.emailVerified) {
                setStatus("success");
                setMessage("Email already verified! Redirecting...");
                setTimeout(() => {
                    router.push('/dashboard'); // AuthProvider will handle proper routing
                }, 1500);
                return;
            }
        };

        handleEmailVerification();

        // Start countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, router, countdown, searchParams]);

    const handleResendVerification = async () => {
        if (!currentUser || countdown > 0) return;

        try {
            setStatus("resending");
            setMessage("Sending new verification email...");
            
            // Reload user first to get fresh state
            await currentUser.reload();
            
            // Check if user is somehow already verified
            if (currentUser.emailVerified) {
                setStatus("success");
                setMessage("Email is already verified! Redirecting...");
                localStorage.setItem('emailVerificationComplete', 'true');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
                return;
            }
            
            await sendEmailVerification(currentUser);
            setStatus("sent");
            setMessage("New verification email sent! Check your inbox.");
            setCountdown(60); // 60 second cooldown
        } catch (error) {
            console.error("Error resending verification email:", error);
            setStatus("error");
            
            // Handle specific error cases
            if (error.code === 'auth/too-many-requests') {
                setMessage("Too many verification requests. Please wait a few minutes before trying again.");
            } else if (error.code === 'auth/user-token-expired') {
                setMessage("Your session has expired. Please sign in again.");
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setMessage("Failed to send verification email. Please try signing in again.");
            }
        }
    };

    const handleBackToRegister = () => {
        router.push('/register');
    };

    const VerifyingState = () => (
        <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto relative">
                <div className="w-20 h-20 border border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Verifying Email</h2>
                <p className="text-slate-600 text-lg">
                    Please wait while we verify your email address...
                </p>
            </div>
        </div>
    );

    const SuccessState = () => (
        <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-green-700 mb-3">Email Verified!</h2>
                <p className="text-slate-600 text-lg mb-4">
                    {message || "Your email has been successfully verified."}
                </p>
                <p className="text-slate-500 text-sm">
                    Redirecting you to continue setup...
                </p>
            </div>
        </div>
    );

    const WaitingState = () => (
        <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto relative">
                <div className="w-20 h-20 border border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin animate-reverse"></div>
            </div>
            
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Check Your Email</h2>
                <p className="text-slate-600 text-lg mb-4">
                    We&apos;ve sent a verification link to:
                </p>
                <p className="text-teal-600 font-semibold text-lg mb-6">
                    {currentUser?.email}
                </p>
                <p className="text-slate-500 text-sm mb-6">
                    Click the link in your email to verify your account. The page will update automatically once verified.
                </p>
                
                <div className="space-y-4">
                    <button
                        onClick={handleResendVerification}
                        disabled={countdown > 0 || status === "resending"}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            countdown > 0 || status === "resending"
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                    >
                        {status === "resending" 
                            ? "Sending..." 
                            : countdown > 0 
                                ? `Resend in ${countdown}s` 
                                : "Resend Verification Email"
                        }
                    </button>
                    
                    <button
                        onClick={handleBackToRegister}
                        className="w-full py-3 px-4 rounded-lg font-medium border border-teal-600 text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                        Back to Registration
                    </button>
                </div>
            </div>
        </div>
    );

    const SentState = () => (
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-700">Email Sent!</h3>
            <p className="text-slate-600">Check your inbox for the verification link.</p>
        </div>
    );

    const ErrorState = () => (
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-700">
                {status === "error" && message.includes("verification failed") ? "Verification Failed" : "Error"}
            </h3>
            <p className="text-slate-600">
                {message || "Please try again or contact support."}
            </p>
            {status === "error" && message.includes("verification failed") && (
                <button
                    onClick={() => router.push('/register')}
                    className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Back to Registration
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden">
            <BubbleBackground />
            
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    {status === "verifying" && <VerifyingState />}
                    {status === "success" && <SuccessState />}
                    {(status === "waiting" || status === "resending") && <WaitingState />}
                    
                    {status === "sent" && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                            <SentState />
                        </div>
                    )}
                    
                    {status === "error" && (
                        <div className="mt-6 p-4 bg-red-50 rounded-lg">
                            <ErrorState />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}