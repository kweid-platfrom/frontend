// components/RegistrationContainer.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import RegistrationForm from '../RegistrationForm';
import EmailVerificationScreen from '../EmailVerificationScreen';
import AccountTypeSelector from '../AccountTypeSelector';
import { useRegistration } from '../../hooks/useRegistration';

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
                return (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Completing registration...</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {renderCurrentStep()}
                </div>
            </div>
        </div>
    );
};

export default Register;
