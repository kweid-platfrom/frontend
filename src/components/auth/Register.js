'use client'
import React, { useState } from 'react';
import MultiStepRegistrationForm from '../MultiStepRegistrationForm';
import { useRegistration } from '../../hooks/useRegistration';
import { CheckCircle } from 'lucide-react';
import BackgroundDecorations from "@/components/BackgroundDecorations";
import Image from 'next/image';
import { toast, Toaster } from 'sonner';
import "../../app/globals.css";

const Register = ({ onSwitchToLogin }) => {
    const [registrationStatus, setRegistrationStatus] = useState('form'); // 'form', 'success'
    const [successMessage, setSuccessMessage] = useState('');
    useRegistration();

    // Default handler if not provided as prop
    const handleSwitchToLoginDefault = () => {
        console.log('Switching to login');
        // Default behavior - replace with your routing logic
        window.location.href = '/login';
    };

    const actualOnSwitchToLogin = onSwitchToLogin || handleSwitchToLoginDefault;

    // Handle successful registration
    const handleRegistrationSuccess = (result) => {
        console.log('Registration completed:', result);

        setRegistrationStatus('success');

        // Set appropriate success message based on the result
        let message = 'Account created successfully!';

        if (result.message) {
            message = result.message;
        } else if (result.completed) {
            message = 'Your account has been created successfully!';
        } else if (result.needsVerification) {
            message = 'Account created! Please check your email to verify your account before signing in.';
        }

        setSuccessMessage(message);

        // Use Sonner toast instead of custom toast
        if (result.needsVerification || message.includes('verify')) {
            toast.success("Registration successful! Check your email for verification.");
        } else {
            toast.success("Account created successfully!");
        }
    };

    // Success screen component
    const SuccessScreen = () => (
        <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mb-4">Registration Successful!</h1>
            <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed px-2">{successMessage}</p>

            {/* Additional info for verification if needed */}
            {successMessage.includes('verify') && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4 mb-6 text-left mx-2 sm:mx-0">
                    <div className="text-sm text-teal-700">
                        <p className="font-medium mb-2">Next steps:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                            <li>Check your email inbox for a verification link</li>
                            <li>Click the verification link to activate your account</li>
                        </ul>
                    </div>
                </div>
            )}

            <button
                onClick={actualOnSwitchToLogin}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium shadow-lg text-sm sm:text-base"
            >
                Continue to Sign In
            </button>
        </div>
    );

    // Render appropriate screen
    const renderCurrentScreen = () => {
        switch (registrationStatus) {
            case 'success':
                return <SuccessScreen />;
            case 'form':
            default:
                return (
                    <MultiStepRegistrationForm
                        onSuccess={handleRegistrationSuccess}
                        onSwitchToLogin={actualOnSwitchToLogin}
                    />
                );
        }
    };

    return (
        <>
            <Toaster position="top-center" richColors closeButton expand={false} />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
                <BackgroundDecorations />
                <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 lg:px-6 relative z-10 py-6 sm:py-8">
                    <div className="w-full max-w-[320px] xs:max-w-[360px] sm:max-w-md">
                        <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-4 xs:p-5 sm:p-6 md:p-8 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                            <div className="text-center">
                                <div className="text-center">
                                    <div className="inline-block">
                                        <div className="flex items-center justify-center">
                                            <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center">
                                                <Image
                                                    src="/logo.svg"
                                                    alt="Assura Logo"
                                                    width={25}
                                                    height={25}
                                                    className="w-full h-full object-contain"
                                                    priority
                                                />
                                            </div>
                                        </div>
                                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Join Assura, Experience efficiency</p>
                                    </div>
                                </div>
                            </div>
                            {renderCurrentScreen()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;