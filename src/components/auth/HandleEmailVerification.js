'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthProvider';

const HandleEmailVerification = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    useAuth();
    const [status, setStatus] = useState('processing'); // processing | success | error

    useEffect(() => {
        const handleVerification = async () => {
            const actionCode = searchParams.get('oobCode');
            const mode = searchParams.get('mode');
            
            // Check if this is actually an email verification request
            if (mode !== 'verifyEmail' || !actionCode) {
                console.log('Not an email verification request, redirecting...');
                router.push('/login');
                return;
            }

            try {
                setStatus('processing');
                
                // Apply the verification code
                await applyActionCode(auth, actionCode);
                
                // Mark verification as successful
                setStatus('success');
                
                // Store verification success flag
                if (typeof window !== 'undefined') {
                    localStorage.setItem('emailVerificationComplete', 'true');
                    localStorage.removeItem('awaitingEmailVerification');
                }
                
                // Redirect directly to onboarding after successful verification
                // The OnboardingRouter will handle determining the correct step
                setTimeout(() => {
                    router.push('/onboarding');
                }, 2000);
                
            } catch (error) {
                console.error('Email verification failed:', error);
                setStatus('error');
                
                // Redirect to login with error after showing error message
                setTimeout(() => {
                    router.push('/login?verificationError=true');
                }, 3000);
            }
        };

        handleVerification();
    }, [searchParams, router]);

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold mb-2">Verifying Your Email...</h2>
                        <p className="text-gray-600">Please wait while we confirm your email address.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-green-700">Email Verified Successfully!</h2>
                        <p className="text-gray-600">Redirecting you to continue setup...</p>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-red-700">Verification Failed</h2>
                        <p className="text-gray-600">The verification link may be expired or invalid. Redirecting to login...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                {renderContent()}
            </div>
        </div>
    );
};

export default HandleEmailVerification;