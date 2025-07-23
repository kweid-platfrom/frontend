'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import BackgroundDecorations from '../../BackgroundDecorations';
import { clearRegistrationState, handlePostVerification } from '../../../services/accountSetup';
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
    const [registrationData, setRegistrationData] = useState(null);
    const [showOnboardingOption, setShowOnboardingOption] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleEmailVerified = useCallback(async () => {
        if (isRedirecting) return; // Prevent multiple calls
        
        setIsRedirecting(true);
        console.log('Starting post-verification redirect process');

        try {
            // Always redirect to login with verified flag
            // The login page can handle the rest of the flow
            setTimeout(() => {
                router.push('/login?verified=true');
            }, 1500);

        } catch (error) {
            console.error('Redirect error:', error);
            setIsRedirecting(false);
            // Fallback - immediate redirect
            router.push('/login?verified=true');
        }
    }, [router, isRedirecting]);

    useEffect(() => {
        // Check for pending registration data
        const pendingReg = localStorage.getItem('pendingRegistration');
        if (pendingReg) {
            try {
                const regData = JSON.parse(pendingReg);
                if (Date.now() - regData.timestamp < 24 * 60 * 60 * 1000) {
                    setRegistrationData(regData);
                } else {
                    localStorage.removeItem('pendingRegistration');
                }
            } catch (error) {
                console.error('Error parsing registration data:', error);
                localStorage.removeItem('pendingRegistration');
            }
        }

        const verifyEmail = async () => {
            const actionCode = searchParams.get('oobCode');
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid verification link. Please request a new one.');
                return;
            }

            try {
                console.log('Starting email verification...');

                // Verify and apply action code
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

                try {
                    await retryOperation(async () => {
                        await applyActionCode(auth, actionCode);
                    });
                    console.log('Email verification applied successfully');
                } catch (error) {
                    console.error('Failed to apply action code:', error);
                    throw error;
                }

                // Set success state first
                setStatus('success');
                setMessage('Your email has been verified successfully!');

                // Handle onboarding flow
                if (registrationData?.isNewRegistration) {
                    setShowOnboardingOption(true);
                    localStorage.setItem('needsOnboarding', 'true');
                    localStorage.setItem('verificationComplete', 'true');
                } else {
                    // Wait to show success message, then redirect
                    setTimeout(() => {
                        handleEmailVerified();
                    }, 2000);
                }

                // Perform background cleanup operations AFTER setting success state
                // These run in the background and won't affect the UI
                performBackgroundCleanup(info?.data?.email, auth.currentUser?.uid);

            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                let errorMessage = 'Failed to verify email. Please try again.';
                
                if (error.code === 'auth/expired-action-code') {
                    errorMessage = 'This verification link has expired. Please request a new one.';
                } else if (error.code === 'auth/invalid-action-code') {
                    errorMessage = 'This verification link is invalid. Please request a new one.';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'This account has been disabled.';
                } else if (error.message?.includes('permission-denied')) {
                    errorMessage = 'Permission denied. Please try signing in again.';
                }
                
                setMessage(errorMessage);
            } finally {
                // Ensure registration state is cleared even on error (non-blocking)
                clearRegistrationState().catch(error => {
                    console.warn('Failed to clear registration state:', error);
                });
            }
        };

        verifyEmail();
    }, [searchParams, registrationData, handleEmailVerified]);

    // Background cleanup that runs completely separately from UI state
    const performBackgroundCleanup = (email, userId) => {
        // Run in the background without affecting UI
        setTimeout(async () => {
            try {
                // Update user document
                if (email) {
                    try {
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where('email', '==', email));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            const userDoc = querySnapshot.docs[0];
                            await updateDoc(doc(db, 'users', userDoc.id), {
                                'auth_metadata.email_verified': true,
                                emailVerified: true,
                                'profile_info.updated_at': new Date().toISOString(),
                                onboardingStatus: {
                                    emailVerified: true,
                                    needsSuiteCreation: true,
                                },
                            });
                            console.log('Background: User document updated successfully');
                        }
                    } catch (error) {
                        console.warn('Background: User document update failed:', error);
                    }
                }

                // Handle post-verification
                if (userId) {
                    try {
                        await handlePostVerification(userId);
                        console.log('Background: Post-verification completed');
                    } catch (error) {
                        console.warn('Background: Post-verification failed:', error);
                    }
                }

                // Clear registration state
                try {
                    await clearRegistrationState();
                    console.log('Background: Registration state cleared');
                } catch (error) {
                    console.warn('Background: Failed to clear registration state:', error);
                }
            } catch (error) {
                console.warn('Background cleanup error:', error);
            }
        }, 100); // Small delay to ensure it runs after state is set
    };

    const handleContinueOnboarding = async () => {
        try {
            localStorage.removeItem('pendingRegistration');
            localStorage.setItem('startOnboarding', 'true');
            localStorage.setItem('needsSuiteCreation', 'true');
            
            // Clear registration state (non-blocking)
            clearRegistrationState().catch(error => {
                console.warn('Failed to clear registration state during onboarding:', error);
            });
            
            router.push('/login?verified=true&continue=onboarding');
        } catch (error) {
            console.error('Error during onboarding setup:', error);
            router.push('/login?verified=true');
        }
    };

    const handleGoToLogin = async () => {
        try {
            localStorage.removeItem('pendingRegistration');
            
            // Clear registration state (non-blocking)
            clearRegistrationState().catch(error => {
                console.warn('Failed to clear registration state during login redirect:', error);
            });
            
            router.push('/login?verified=true');
        } catch (error) {
            console.error('Error during navigation to login:', error);
            router.push('/login?verified=true');
        }
    };

    const getAccountTypeDisplay = () => {
        if (!registrationData) return 'Individual';
        return registrationData.accountType === 'organization' ? 'Organization' : 'Individual';
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
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative text-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {status === 'verifying' && <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />}
                                {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
                                {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {status === 'verifying' && 'Verifying Your Email'}
                                {status === 'success' && 'Email Verified!'}
                                {status === 'error' && 'Verification Failed'}
                            </h1>
                            <p className="text-slate-600 mb-4">
                                {status === 'verifying' && 'Please wait while we verify your email address...'}
                                {status === 'success' && showOnboardingOption && 'Ready to set up your account! Create your first test suite to get started.'}
                                {status === 'success' && !showOnboardingOption && isRedirecting && 'Redirecting you to sign in...'}
                                {status === 'success' && !showOnboardingOption && !isRedirecting && message}
                                {status === 'error' && message}
                            </p>
                            {status === 'success' && registrationData && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-teal-800 mb-2">
                                        <strong>Registration Details:</strong>
                                    </p>
                                    <div className="text-sm text-teal-700 space-y-1">
                                        <p>Account Type: {getAccountTypeDisplay()}</p>
                                        <p>Name: {registrationData.firstName} {registrationData.lastName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {status === 'success' && showOnboardingOption ? (
                            <div className="space-y-3">
                                <button
                                    onClick={handleContinueOnboarding}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
                                >
                                    Complete Account Setup
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full text-teal-600 py-2 px-4 text-sm hover:bg-teal-50 rounded transition-colors border border-teal-200"
                                >
                                    Sign In Later
                                </button>
                                <p className="text-xs text-slate-500 mt-2">
                                    You&apos;ll need to create a test suite to access your dashboard
                                </p>
                            </div>
                        ) : status === 'success' && !showOnboardingOption ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                {isRedirecting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isRedirecting ? 'Redirecting you to sign in...' : 'Preparing to redirect...'}
                            </div>
                        ) : (
                            status === 'error' && (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGoToLogin}
                                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium"
                                    >
                                        Go to Sign In
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;