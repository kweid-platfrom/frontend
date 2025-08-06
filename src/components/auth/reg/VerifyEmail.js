/* eslint-disable react-hooks/exhaustive-deps */
// components/auth/VerifyEmail.jsx
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
        setMessage('Your email has been verified successfully! You can now sign in to complete your account setup.');
    }, []);

    useEffect(() => {
        if (status !== 'verifying') return;

        const verifyEmailOnly = async () => {
            const actionCode = searchParams.get('oobCode');
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid verification link. Please try registering again.');
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
                } catch (error) {
                    console.error('Failed to apply action code:', error);
                    throw error;
                }

                // Email verification complete
                await handleEmailVerified();

            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                let errorMessage = 'Failed to verify email. Please try again.';

                if (error.code === 'auth/expired-action-code') {
                    errorMessage = 'This verification link has expired. Please register again to get a new verification link.';
                } else if (error.code === 'auth/invalid-action-code') {
                    errorMessage = 'This verification link is invalid. Please register again to get a new verification link.';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'This account has been disabled.';
                }

                setMessage(errorMessage);
            }
        };

        const timeoutId = setTimeout(verifyEmailOnly, 100);
        return () => clearTimeout(timeoutId);
    }, [searchParams, handleEmailVerified]);

    const handleGoToLogin = () => {
        router.push('/login');
    };

    const handleGoToRegister = () => {
        router.push('/register');
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
                                
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
                                >
                                    Continue to Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                                <p className="text-slate-600 mb-6">{message}</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGoToRegister}
                                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
                                    >
                                        Try Registration Again
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                        onClick={handleGoToLogin}
                                        className="w-full border border-slate-300 text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-50 transition-all font-medium"
                                    >
                                        Go to Sign In
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;