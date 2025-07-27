/* eslint-disable react-hooks/exhaustive-deps */
// components/EmailVerificationScreen.jsx
'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { useRegistration } from '../hooks/useRegistration';
import { auth } from '../config/firebase';
import { toast } from 'sonner';

const EmailVerificationScreen = ({
    email,
    onVerificationComplete,
    onBackToRegistration
}) => {
    const router = useRouter();
    const {
        isVerified,
        checkingVerification,
        error: verificationError,
        checkVerificationStatus,
        clearError: clearVerificationError
    } = useEmailVerification();

    const {
        loading: registrationLoading,
        error: registrationError,
        completeEmailVerification,
        resendVerificationEmail,
        clearError: clearRegistrationError
    } = useRegistration();

    const [, setLastResend] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isCompletingVerification, setIsCompletingVerification] = useState(false);

    // Show toast for errors
    useEffect(() => {
        if (verificationError) {
            toast.error(verificationError);
            clearVerificationError();
        }
        if (registrationError) {
            toast.error(registrationError);
            clearRegistrationError();
        }
    }, [verificationError, registrationError, clearVerificationError, clearRegistrationError]);

    // Check verification status periodically
    useEffect(() => {
        if (!isVerified && !isCompletingVerification) {
            const interval = setInterval(() => {
                checkVerificationStatus();
            }, 3000); // Check every 3 seconds

            return () => clearInterval(interval);
        }
    }, [isVerified, isCompletingVerification, checkVerificationStatus]);

    // Handle verification completion
    useEffect(() => {
        if (isVerified && !isCompletingVerification) {
            handleCompleteEmailVerification();
        }
    }, [isVerified, isCompletingVerification]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    useEffect(() => {
        const checkExternalVerification = async () => {
            try {
                const emailVerified = localStorage.getItem('emailVerified');
                if (emailVerified === 'true') {
                    console.log('External email verification detected, reloading user...');

                    // Clear the flag
                    localStorage.removeItem('emailVerified');
                    localStorage.removeItem('emailVerifiedAt');

                    // Reload current user to get updated emailVerified status
                    if (auth.currentUser) {
                        await auth.currentUser.reload();
                        // Then check verification status
                        await checkVerificationStatus();
                    }
                }
            } catch (error) {
                console.error('Error checking external verification:', error);
            }
        };

        // Check immediately on mount
        checkExternalVerification();

        // Also check when the window regains focus (user returns to tab)
        const handleFocus = () => {
            checkExternalVerification();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [checkVerificationStatus]);

    // Updated function to handle email verification completion
    const handleCompleteEmailVerification = async () => {
        if (isCompletingVerification) return; // Prevent multiple calls
        
        setIsCompletingVerification(true);
        
        try {
            const result = await completeEmailVerification();
            
            if (result.success) {
                if (result.registrationComplete) {
                    // Individual account - redirect to login
                    toast.success('Registration completed successfully! Please log in to continue.');
                    setTimeout(() => {
                        router.push('/login');
                    }, 1500);
                } else if (result.needsOrganizationInfo) {
                    // Organization account - needs org info
                    toast.success('Email verified! Please provide your organization details.');
                    if (onVerificationComplete) {
                        onVerificationComplete(result);
                    }
                } else {
                    // Fallback
                    if (onVerificationComplete) {
                        onVerificationComplete(result);
                    }
                }
            } else {
                toast.error(result.error || 'Verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Error completing email verification:', error);
            toast.error('An error occurred during verification. Please try again.');
        } finally {
            setIsCompletingVerification(false);
        }
    };

    const handleResendEmail = async () => {
        if (resendCooldown > 0) return;

        const result = await resendVerificationEmail();
        if (result.success) {
            setLastResend(new Date());
            setResendCooldown(60); // 60 second cooldown
            toast.success('Verification email sent! Please check your inbox.');
        }
    };

    const handleCheckNow = async () => {
        await checkVerificationStatus();
    };

    const loading = checkingVerification || registrationLoading || isCompletingVerification;

    return (
        <div className="max-w-md mx-auto text-center py-8">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Title and Description */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Email
            </h2>
            <p className="text-gray-600 mb-6">
                We&apos;ve sent a verification link to{' '}
                <span className="font-medium text-gray-900">{email}</span>
            </p>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">Next steps:</h3>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the verification link in the email</li>
                    <li>Return to this page to complete setup</li>
                </ol>
            </div>

            {/* Status Messages */}
            {isVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                            Email verified! Completing your setup...
                        </span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleCheckNow}
                    disabled={loading || isVerified}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Checking...' : 'I\'ve Verified My Email'}
                </button>

                <button
                    onClick={handleResendEmail}
                    disabled={loading || resendCooldown > 0}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend Verification Email'
                    }
                </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-sm text-gray-500 space-y-2">
                <p>
                    Didn&apos;t receive the email? Check your spam folder or try a different email address.
                </p>
                <p>
                    Having trouble?{' '}
                    <button
                        onClick={onBackToRegistration}
                        className="text-teal-600 hover:text-teal-800 underline"
                    >
                        Go back to registration
                    </button>
                </p>
            </div>
        </div>
    );
};

export default EmailVerificationScreen;