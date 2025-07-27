// components/Register.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import RegistrationForm from '../RegistrationForm';
import EmailVerificationScreen from '../EmailVerificationScreen';
import AccountTypeSelector from '../AccountTypeSelector';
import OrganizationInfoForm from '../OrganizationForm';
import { useRegistration } from '../../hooks/useRegistration';
import { Loader2 } from 'lucide-react';
import BackgroundDecorations from "@/components/BackgroundDecorations";
import "../../app/globals.css";

const Register = ({ onRegistrationComplete, onSwitchToLogin }) => {
    const [currentStep, setCurrentStep] = useState('register'); // 'register', 'verify', 'accountType', 'organizationInfo', 'complete'
    const [userEmail, setUserEmail] = useState('');
    const [userDisplayName, setUserDisplayName] = useState('');
    const [setIsGoogleSSO] = useState(false);

    const {
        pendingVerification,
        registerWithGoogle,
        completeRegistration,
        loading,
        error,
        clearRegistrationState
    } = useRegistration();

    // Default handlers if not provided as props
    const handleRegistrationCompleteDefault = (result) => {
        console.log('Registration completed successfully:', result);
        // Default behavior - you can redirect to dashboard or show success
        // window.location.href = '/dashboard'; // or use your router
        alert('Registration completed successfully!'); // Temporary - replace with proper handling
    };

    const handleSwitchToLoginDefault = () => {
        console.log('Switching to login');
        // Default behavior - you can redirect to login page
        // window.location.href = '/login'; // or use your router
        alert('Redirecting to login...'); // Temporary - replace with proper handling
    };

    // Use provided handlers or defaults
    const actualOnRegistrationComplete = onRegistrationComplete || handleRegistrationCompleteDefault;
    const actualOnSwitchToLogin = onSwitchToLogin || handleSwitchToLoginDefault;

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
        } else if (result.needsOrganizationInfo) {
            // Google SSO organization account
            setCurrentStep('organizationInfo');
            setUserEmail(result.user.email);
            setUserDisplayName(result.user.displayName || '');
            setIsGoogleSSO(true);
        } else {
            // Individual account or complete registration
            if (actualOnRegistrationComplete) {
                actualOnRegistrationComplete(result);
            }
        }
    };

    // Handle Google SSO account type selection
    const handleGoogleAccountTypeSelected = async (accountTypeData) => {
        const result = await registerWithGoogle(accountTypeData);
        if (result.success) {
            if (result.needsOrganizationInfo) {
                setCurrentStep('organizationInfo');
                setUserEmail(result.user.email);
                setUserDisplayName(result.user.displayName || '');
            } else if (actualOnRegistrationComplete) {
                actualOnRegistrationComplete(result);
            }
        }
    };

    // Handle email verification completion
    const handleVerificationComplete = (result) => {
        console.log('Verification completed with result:', result);

        if (result.needsOrganizationInfo) {
            // Organization account needs org info
            setCurrentStep('organizationInfo');
            setUserEmail(result.data?.email || userEmail);
            setUserDisplayName(result.data?.displayName || '');
        } else if (result.registrationComplete) {
            // Registration completed - redirect to login
            if (actualOnRegistrationComplete) {
                actualOnRegistrationComplete(result);
            }
        } else {
            console.error('Verification failed:', result.error);
        }
    };

    // Handle organization info submission
    const handleOrganizationInfoSubmit = async (organizationData) => {
        try {
            const result = await completeRegistration(organizationData);

            // Log the result for debugging
            console.log('completeRegistration result:', result);

            if (result.registrationComplete && actualOnRegistrationComplete) {
                actualOnRegistrationComplete(result);
            }

            // IMPORTANT: Return the result so OrganizationInfoForm can handle success
            // If result doesn't have explicit success flag, add it
            return { ...result, success: true };

        } catch (error) {
            console.error('Error completing organization registration:', error);
            // Re-throw the error so OrganizationInfoForm can handle it
            throw error;
        }
    };

    // Handle back to registration
    const handleBackToRegistration = () => {
        clearRegistrationState();
        setCurrentStep('register');
        setUserEmail('');
        setUserDisplayName('');
        setIsGoogleSSO(false);
    };

    // Handle back from organization info to verification (for email users)
    const handleBackToVerification = () => {
        setCurrentStep('verify');
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
                        onSwitchToLogin={actualOnSwitchToLogin}
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

            case 'organizationInfo':
                return (
                    <OrganizationInfoForm
                        userEmail={userEmail}
                        userDisplayName={userDisplayName}
                        onSubmit={handleOrganizationInfoSubmit}
                        onBack={handleBackToVerification}
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