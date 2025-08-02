/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import BackgroundDecorations from '../../BackgroundDecorations';
import '../../../app/globals.css';

const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            console.warn(`Retry ${attempt}/${maxAttempts} failed:`, error.message);
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
    }
};

const VerifyEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');


    const handleEmailVerified = useCallback(async () => {
        console.log('Email verified successfully');
        setStatus('success');
        setMessage('Email verified successfully! Please return to the registration tab to complete your setup.');

        // Set a flag to indicate email verification is complete (for the polling mechanism)
        try {
            localStorage.setItem('emailVerified', 'true');
            localStorage.setItem('emailVerifiedAt', Date.now().toString());
        } catch (error) {
            console.warn('Failed to set verification flag:', error);
        }
    }, []);

    useEffect(() => {
        if (status !== 'verifying') return;

        const verifyEmailOnly = async () => {
            const actionCode = searchParams.get('oobCode');
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid verification link. Please request a new one from the registration page.');
                return;
            }

            try {
                console.log('Processing email verification link...');

                // Verify the action code
                let info;
                try {
                    info = await retryOperation(async () => {
                        return await checkActionCode(auth, actionCode);
                    });
                    console.log('Action code verified:', info);
                } catch (error) {
                    console.error('Failed to check action code:', error);
                    throw error;
                }

                // Apply the action code to actually verify the email
                try {
                    await retryOperation(async () => {
                        await applyActionCode(auth, actionCode);
                    });
                    console.log('Email verification applied successfully');
                    
                    // Reload the current user to update emailVerified status
                    if (auth.currentUser) {
                        await auth.currentUser.reload();
                        console.log('User reloaded, emailVerified:', auth.currentUser.emailVerified);
                    }
                } catch (error) {
                    console.error('Failed to apply action code:', error);
                    throw error;
                }

                // Email verification complete - set flags for the other tab to detect
                await handleEmailVerified();

            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                let errorMessage = 'Failed to verify email. Please try again.';

                if (error.code === 'auth/expired-action-code') {
                    errorMessage = 'This verification link has expired. Please request a new one from the registration page.';
                } else if (error.code === 'auth/invalid-action-code') {
                    errorMessage = 'This verification link is invalid. Please request a new one from the registration page.';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'This account has been disabled.';
                }

                setMessage(errorMessage);
            }
        };

        const timeoutId = setTimeout(verifyEmailOnly, 100);
        return () => clearTimeout(timeoutId);
    }, [searchParams, handleEmailVerified]);

    const handleGoBackToRegistration = () => {
        try {
            // Clear any stale verification flags
            localStorage.removeItem('emailVerified');
            localStorage.removeItem('emailVerifiedAt');
            
            // Go back to registration page
            const redirectUrl = localStorage.getItem('registrationRedirectUrl') || '/register';
            router.push(redirectUrl);
        } catch (error) {
            console.error('Error during navigation to registration:', error);
            router.push('/register');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>

                        {status === 'verifying' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Email</h1>
                                <p className="text-slate-600">Please wait while we verify your email address...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h1>
                                <p className="text-slate-600 mb-6">{message}</p>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Next Step:</strong> Return to your registration tab. 
                                        Your email verification will be detected automatically and registration will continue.
                                    </p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                                <p className="text-slate-600 mb-6">{message}</p>
                                <button
                                    onClick={handleGoBackToRegistration}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
                                >
                                    Back to Registration
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;