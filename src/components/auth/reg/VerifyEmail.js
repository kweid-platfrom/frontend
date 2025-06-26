// VerifyEmail.jsx - Updated with better flow management
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { doc, updateDoc, query, collection, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import BackgroundDecorations from '../../BackgroundDecorations';
import '../../../app/globals.css'

const VerifyEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const [registrationData, setRegistrationData] = useState(null);
    const [showOnboardingOption, setShowOnboardingOption] = useState(false);

    useEffect(() => {
        // Check if this is part of a new registration flow
        const pendingReg = localStorage.getItem('pendingRegistration');
        if (pendingReg) {
            try {
                const regData = JSON.parse(pendingReg);
                // Check if registration is within last 24 hours
                if (Date.now() - regData.timestamp < 24 * 60 * 60 * 1000) {
                    setRegistrationData(regData);
                }
            } catch (error) {
                console.error('Error parsing registration data:', error);
            }
        }

        const verifyEmail = async () => {
            const actionCode = searchParams.get('oobCode');
            
            if (!actionCode) {
                setStatus('error');
                setMessage('Invalid verification link. Please try again.');
                return;
            }

            try {
                // Verify the action code first
                const info = await checkActionCode(auth, actionCode);
                console.log('Action code info:', info);
                
                // Apply the email verification
                await applyActionCode(auth, actionCode);
                console.log('Email verification applied successfully');
                
                // Update user document in Firestore
                if (info.data.email) {
                    try {
                        const usersRef = collection(db, 'users');
                        const q = query(
                            usersRef, 
                            where('primary_email', '==', info.data.email),
                            limit(1)
                        );
                        
                        const querySnapshot = await getDocs(q);
                        
                        if (!querySnapshot.empty) {
                            const userDoc = querySnapshot.docs[0];
                            
                            await updateDoc(doc(db, 'users', userDoc.id), {
                                'session_context.email_verified': true,
                                'session_context.updated_at': new Date().toISOString(),
                                // Set flag to indicate user needs onboarding after login
                                'onboardingStatus.emailVerified': true,
                                'onboardingStatus.needsProjectCreation': true
                            });
                            
                            console.log('User document updated successfully');
                        }
                    } catch (firestoreError) {
                        console.error('Error updating Firestore document:', firestoreError);
                    }
                }

                setStatus('success');
                setMessage('Your email has been verified successfully!');
                
                // Show onboarding option if this is a new registration
                if (registrationData?.isNewRegistration) {
                    setShowOnboardingOption(true);
                    // Set a flag in localStorage to indicate the user should go through onboarding
                    localStorage.setItem('needsOnboarding', 'true');
                    localStorage.setItem('verificationComplete', 'true');
                } else {
                    // For existing users, just redirect to login
                    setTimeout(() => {
                        router.push('/login?verified=true');
                    }, 3000);
                }
                
            } catch (error) {
                console.error('Error verifying email:', error);
                setStatus('error');
                
                if (error.code === 'auth/expired-action-code') {
                    setMessage('This verification link has expired. Please request a new one.');
                } else if (error.code === 'auth/invalid-action-code') {
                    setMessage('This verification link is invalid. Please request a new one.');
                } else if (error.code === 'auth/user-disabled') {
                    setMessage('This account has been disabled.');
                } else {
                    setMessage('Failed to verify email. Please try again.');
                }
            }
        };

        verifyEmail();
    }, [searchParams, router, registrationData?.isNewRegistration]);

    const handleContinueOnboarding = () => {
        // Clear the registration data since we're continuing
        localStorage.removeItem('pendingRegistration');
        
        // Store flags to indicate we should start onboarding after login
        localStorage.setItem('startOnboarding', 'true');
        localStorage.setItem('needsSuiteCreation', 'true');
        
        // Navigate to login with verification success
        router.push('/login?verified=true&continue=onboarding');
    };

    const handleGoToLogin = () => {
        // Clear registration data
        localStorage.removeItem('pendingRegistration');
        router.push('/login?verified=true');
    };

    const getAccountTypeDisplay = () => {
        if (!registrationData) return '';
        return registrationData.accountType === 'organization' ? 'Organization' : 'Individual';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
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
                                {status === 'success' && !showOnboardingOption && message}
                                {status === 'error' && message}
                            </p>
                            
                            {/* Show registration details if available */}
                            {status === 'success' && registrationData && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-teal-800 mb-2">
                                        <strong>Registration Details:</strong>
                                    </p>
                                    <div className="text-sm text-teal-700 space-y-1">
                                        <p>Account Type: {getAccountTypeDisplay()}</p>
                                        <p>Name: {registrationData.formData?.fullName}</p>
                                        {registrationData.accountType === 'organization' && (
                                            <p>Company: {registrationData.formData?.companyName}</p>
                                        )}
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
                            <p className="text-sm text-slate-500">
                                Redirecting you to the sign-in page...
                            </p>
                        ) : status === 'error' && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium"
                                >
                                    Go to Sign In
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
