'use client'
import React from 'react';
import MultiStepRegistrationForm from './MultiStepRegistrationForm';

const RegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                <p className="text-base sm:text-lg text-slate-600">Start your testing journey today</p>
            </div>

            <MultiStepRegistrationForm 
                onSuccess={onSuccess}
                onSwitchToLogin={onSwitchToLogin}
            />
        </div>
    );
};

export default RegistrationForm;