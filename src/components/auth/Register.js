// components/Register.jsx
'use client'
import React, { useState } from 'react';
import RegistrationForm from '../RegistrationForm';
import { useRegistration } from '../../hooks/useRegistration';
import { CheckCircle } from 'lucide-react';
import BackgroundDecorations from "@/components/BackgroundDecorations";
import "../../app/globals.css";

const Register = ({ onSwitchToLogin }) => {
    const [registrationStatus, setRegistrationStatus] = useState('form'); // 'form', 'success'
    const [successMessage, setSuccessMessage] = useState('');

    const { loading, error } = useRegistration();

    // Default handler if not provided as prop
    const handleSwitchToLoginDefault = () => {
        console.log('Switching to login');
        // Default behavior - replace with your routing logic
        window.location.href = '/login';
    };

    const actualOnSwitchToLogin = onSwitchToLogin || handleSwitchToLoginDefault;

    // Handle successful registration
    const handleRegistrationSuccess = (result) => {
        setRegistrationStatus('success');
        setSuccessMessage(result.message);
    };

    // Success screen component
    const SuccessScreen = () => (
        <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Registration Successful!</h1>
            <p className="text-slate-600 mb-6">{successMessage}</p>
            
            <button
                onClick={actualOnSwitchToLogin}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium"
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
                    <RegistrationForm
                        onSuccess={handleRegistrationSuccess}
                        onSwitchToLogin={actualOnSwitchToLogin}
                        loading={loading}
                        error={error}
                    />
                );
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
                        {renderCurrentScreen()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;