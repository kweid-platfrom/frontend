"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { auth } from "../../config/firebase";
import { toast, Toaster } from "sonner";
import BackgroundDecorations from "../BackgroundDecorations";

const EmailVerification = () => {
    const [verificationState, setVerificationState] = useState('verifying'); // 'verifying', 'success', 'error', 'expired'
    const [errorMessage, setErrorMessage] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                // Get action code from URL parameters
                const actionCode = searchParams.get('oobCode');
                const mode = searchParams.get('mode');

                if (!actionCode || mode !== 'verifyEmail') {
                    setVerificationState('error');
                    setErrorMessage('Invalid verification link. Please check your email for the correct link.');
                    return;
                }

                console.log('Verifying email with action code:', actionCode);

                // First, check if the action code is valid
                const info = await checkActionCode(auth, actionCode);
                console.log('Action code info:', info);
                
                // Get user email from the action code info
                const email = info.data.email;
                setUserEmail(email);

                // Apply the email verification
                await applyActionCode(auth, actionCode);
                console.log('Email verification successful');

                // Check if we have stored registration data
                const registrationData = localStorage.getItem("registrationData");
                const googleRegistrationData = localStorage.getItem("googleRegistrationData");
                
                setVerificationState('success');
                
                // Show success message
                toast.success("Email verified successfully! Redirecting to complete your setup...", {
                    duration: 4000,
                    position: "top-center"
                });

                // Redirect to onboarding/setup after a short delay
                setTimeout(() => {
                    if (registrationData || googleRegistrationData) {
                        router.push('/onboarding');
                    } else {
                        router.push('/dashboard');
                    }
                }, 3000);

            } catch (error) {
                console.error('Email verification error:', error);
                
                let errorMsg = 'Email verification failed. ';
                
                switch (error.code) {
                    case 'auth/expired-action-code':
                        setVerificationState('expired');
                        errorMsg = 'This verification link has expired. Please request a new verification email.';
                        break;
                    case 'auth/invalid-action-code':
                        setVerificationState('error');
                        errorMsg = 'This verification link is invalid or has already been used.';
                        break;
                    case 'auth/user-disabled':
                        setVerificationState('error');
                        errorMsg = 'This user account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        setVerificationState('error');
                        errorMsg = 'No user account found for this verification link.';
                        break;
                    default:
                        setVerificationState('error');
                        errorMsg += 'Please try again or contact support if the problem persists.';
                }
                
                setErrorMessage(errorMsg);
                
                toast.error(errorMsg, {
                    duration: 6000,
                    position: "top-center"
                });
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    const handleResendVerification = async () => {
        try {
            // Get stored email
            const storedEmail = localStorage.getItem("emailForVerification");
            if (!storedEmail && !userEmail) {
                toast.error("No email found. Please try registering again.", {
                    duration: 4000,
                    position: "top-center"
                });
                router.push('/register');
                return;
            }

            // You'll need to implement a function to resend verification email
            // This would typically require the user to sign in first
            toast.info("Please sign in to resend verification email.", {
                duration: 4000,
                position: "top-center"
            });
            
            router.push('/login');
            
        } catch (error) {
            console.error('Resend verification error:', error);
            toast.error("Failed to resend verification email. Please try again.", {
                duration: 4000,
                position: "top-center"
            });
        }
    };

    const renderContent = () => {
        switch (verificationState) {
            case 'verifying':
                return (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Verifying your email...</h2>
                        <p className="text-slate-600">Please wait while we verify your email address.</p>
                    </div>
                );

            case 'success':
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Email Verified Successfully!</h2>
                        <p className="text-slate-600 mb-6">
                            Your email address has been verified. You&apos;ll be redirected to complete your account setup.
                        </p>
                        {userEmail && (
                            <p className="text-sm text-slate-500 mb-4">
                                Verified: {userEmail}
                            </p>
                        )}
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                            <span className="ml-2 text-slate-600">Redirecting...</span>
                        </div>
                    </div>
                );

            case 'expired':
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Verification Link Expired</h2>
                        <p className="text-slate-600 mb-6">{errorMessage}</p>
                        <div className="space-y-3">
                            <button
                                onClick={handleResendVerification}
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Resend Verification Email
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="w-full bg-gray-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Back to Registration
                            </button>
                        </div>
                    </div>
                );

            case 'error':
            default:
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Verification Failed</h2>
                        <p className="text-slate-600 mb-6">{errorMessage}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/register')}
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Try Registering Again
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-gray-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Already have an account? Sign In
                            </button>
                        </div>
                    </div>
                );
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

                    {/* Verification Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;