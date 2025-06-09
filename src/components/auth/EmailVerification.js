// components/auth/EmailVerificationSuccess.js
'use client'
import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../../config/firebase'; // Adjust path as needed

const EmailVerification = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');
    const { currentUser, updateUserProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const verifyEmailFromURL = async () => {
            try {
                // Get the action code from URL parameters
                const mode = searchParams.get('mode');
                const oobCode = searchParams.get('oobCode');
                const continueUrl = searchParams.get('continueUrl');

                console.log('URL params:', { mode, oobCode, continueUrl });

                // Check if this is an email verification request
                if (mode === 'verifyEmail' && oobCode) {
                    try {
                        // Verify the action code first
                        await checkActionCode(auth, oobCode);
                        
                        // Apply the email verification
                        await applyActionCode(auth, oobCode);
                        
                        // Wait a moment for Firebase to update
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Reload the current user to get updated status
                        if (auth.currentUser) {
                            await auth.currentUser.reload();
                            
                            // Update user record in Firestore
                            await updateUserProfile(auth.currentUser.uid, {
                                emailVerified: true,
                                emailVerifiedAt: new Date()
                            });
                        }

                        setStatus('success');
                        setMessage('Email verified successfully!');

                        // Redirect to onboarding after 3 seconds
                        setTimeout(() => {
                            router.push('/onboarding');
                        }, 3000);

                    } catch (codeError) {
                        console.error('Action code error:', codeError);
                        
                        if (codeError.code === 'auth/expired-action-code') {
                            setMessage('Verification link has expired. Please request a new one.');
                        } else if (codeError.code === 'auth/invalid-action-code') {
                            setMessage('Invalid verification link. Please request a new one.');
                        } else {
                            setMessage('Verification failed. Please try again.');
                        }
                        
                        setStatus('error');
                    }
                } else {
                    // If no action code, check current user's email verification status
                    await checkCurrentUserVerification();
                }

            } catch (error) {
                console.error('Email verification error:', error);
                setStatus('error');
                setMessage('An error occurred during verification. Please try again.');
            }
        };

        const checkCurrentUserVerification = async () => {
            try {
                if (currentUser) {
                    // Reload user to get the latest status
                    await currentUser.reload();
                    
                    if (currentUser.emailVerified) {
                        // Update user record in Firestore
                        await updateUserProfile(currentUser.uid, {
                            emailVerified: true,
                            emailVerifiedAt: new Date()
                        });

                        setStatus('success');
                        setMessage('Email verified successfully!');

                        // Redirect to onboarding after 2 seconds
                        setTimeout(() => {
                            router.push('/onboarding');
                        }, 2000);
                    } else {
                        setStatus('error');
                        setMessage('Email not yet verified. Please check your email and click the verification link.');
                    }
                } else {
                    setStatus('error');
                    setMessage('No user found. Please log in first.');
                }
            } catch (error) {
                console.error('User verification check error:', error);
                setStatus('error');
                setMessage('Unable to verify email status. Please try again.');
            }
        };

        // Add a small delay to ensure auth state is loaded
        const timer = setTimeout(() => {
            verifyEmailFromURL();
        }, 500);

        return () => clearTimeout(timer);
    }, [currentUser, updateUserProfile, router, searchParams]);

    const handleResendVerification = () => {
        router.push('/resend-verification');
    };

    const handleBackToLogin = () => {
        router.push('/login');
    };

    const handleTryAgain = () => {
        setStatus('verifying');
        setMessage('Verifying your email...');
        
        // Retry verification after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Verifying Email
                            </h1>
                            <p className="text-gray-600">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Email Verified! ✨
                            </h1>
                            <p className="text-gray-600 mb-4">{message}</p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-700">
                                    Redirecting you to complete your account setup...
                                </p>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-gray-600 mb-6">{message}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleTryAgain}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={handleResendVerification}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                >
                                    Resend Verification Email
                                </button>
                                <button
                                    onClick={handleBackToLogin}
                                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;