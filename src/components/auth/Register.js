// components/Register.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import RegistrationForm from '../RegistrationForm';
import EmailVerificationScreen from '../EmailVerificationScreen';
import AccountTypeSelector from '../AccountTypeSelector';
import { useRegistration } from '../../hooks/useRegistration';
import { Loader2 } from 'lucide-react';
import BackgroundDecorations from "@/components/BackgroundDecorations";
import "../../app/globals.css";

const Register = ({ onRegistrationComplete, onSwitchToLogin }) => {
    const [currentStep, setCurrentStep] = useState('register'); // 'register', 'verify', 'accountType', 'complete'
    const [userEmail, setUserEmail] = useState('');
    const [ setIsGoogleSSO] = useState(false);
    
    const {
        pendingVerification,
        registerWithGoogle,
        loading,
        error,
        clearRegistrationState
    } = useRegistration();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.emailVerified && pendingVerification) {
                setCurrentStep('complete');
            }
        });

        return () => unsubscribe();
    }, [pendingVerification]);

    // Handle successful email registration
    const handleRegistrationSuccess = (result) => {
        if (result.needsVerification) {
            setCurrentStep('verify');
            setUserEmail(result.user.email);
            setIsGoogleSSO(false);
        } else {
            // Google SSO - registration already completed
            onRegistrationComplete(result);
        }
    };

    // Handle Google SSO account type selection
    const handleGoogleAccountTypeSelected = async (accountTypeData) => {
        const result = await registerWithGoogle(accountTypeData);
        if (result.success) {
            onRegistrationComplete(result);
        }
    };

    // Handle email verification completion
    const handleVerificationComplete = (result) => {
        onRegistrationComplete(result);
    };

    // Handle back to registration
    const handleBackToRegistration = () => {
        clearRegistrationState();
        setCurrentStep('register');
        setUserEmail('');
        setIsGoogleSSO(false);
    };

    // Loading state component with consistent styling
    const LoadingState = ({ message = "Completing registration..." }) => (
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
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-4" />
                            <p className="text-slate-600 text-sm sm:text-base">{message}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render appropriate step
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'register':
                return (
                    <RegistrationForm
                        onSuccess={handleRegistrationSuccess}
                        onSwitchToLogin={onSwitchToLogin}
                    />
                );

            case 'verify':
                return (
                    <EmailVerificationScreen
                        email={userEmail}
                        onVerificationComplete={handleVerificationComplete}
                        onBackToRegistration={handleBackToRegistration}
                    />
                );

            case 'accountType':
                return (
                    <AccountTypeSelector
                        userEmail={userEmail}
                        onAccountTypeSelected={handleGoogleAccountTypeSelected}
                        loading={loading}
                        error={error}
                    />
                );

            default:
                return <LoadingState />;
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
                        {renderCurrentStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;