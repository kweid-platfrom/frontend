import React, { useState } from 'react';
import { User, Building, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const StepIndicator = ({ currentStep, accountType }) => {
    const steps = [
        { num: 1, title: 'Account Type', active: currentStep >= 1, completed: currentStep > 1 },
        { num: 2, title: 'Personal Info', active: currentStep >= 2, completed: currentStep > 2 },
        { num: 3, title: accountType === 'organization' ? 'Company Info' : 'Review', active: currentStep >= 3, completed: currentStep > 3 },
        { num: 4, title: 'Verify Email', active: currentStep >= 4, completed: currentStep > 4 },
        { num: 5, title: 'Create Suite', active: currentStep >= 5, completed: currentStep > 5 },
    ];

    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={step.num}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                            step.completed
                                ? 'bg-teal-500 text-white'
                                : step.active
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                        }`}>
                            {step.completed ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step.num}
                        </div>
                        <div className={`mt-1 sm:mt-2 text-xs font-medium text-center ${
                            step.active ? 'text-teal-600' : 'text-slate-500'
                        }`}>
                            {step.title}
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                            step.completed ? 'bg-teal-500' : 'bg-slate-200'
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const AccountTypeStep = ({ accountType, setAccountType, onNext, currentStep, error, isLoading = false }) => {
    const [localError, setLocalError] = useState('');

    const handleNext = () => {
        if (!accountType) {
            setLocalError('Please select an account type to continue');
            return;
        }
        setLocalError('');
        onNext();
    };

    const handleAccountTypeChange = (type) => {
        setAccountType(type);
        setLocalError(''); // Clear error when selection is made
    };

    const displayError = error || localError;

    return (
        <div className="bg-white rounded-xl border border-white/20 p-6 sm:p-8 relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
            
            <StepIndicator currentStep={currentStep} accountType={accountType} />

            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Create Your Account</h1>
                <p className="text-sm sm:text-base text-slate-600">Choose your account type to get started</p>
            </div>

            {/* Error Display */}
            {displayError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Setup Error</p>
                        <p className="text-sm text-red-700 mt-1">{displayError}</p>
                    </div>
                </div>
            )}

            <div className="space-y-4 mb-6">
                {/* Individual Account Option */}
                <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        accountType === 'individual'
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isLoading && handleAccountTypeChange('individual')}
                >
                    <div className="flex items-center">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 text-sm sm:text-base">Individual Account</h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">For solo testers, freelancers, and small teams</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                    30-day trial
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Personal projects
                                </span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            accountType === 'individual'
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-slate-300'
                        }`}>
                            {accountType === 'individual' && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Organization Account Option */}
                <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        accountType === 'organization'
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isLoading && handleAccountTypeChange('organization')}
                >
                    <div className="flex items-center">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 text-sm sm:text-base">Organization Account</h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">For companies with custom domains and team collaboration</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                    30-day trial
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Team features
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Admin controls
                                </span>
                            </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            accountType === 'organization'
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-slate-300'
                        }`}>
                            {accountType === 'organization' && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Information Box */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-800">What&apos;s the difference?</p>
                        <p className="text-sm text-blue-700 mt-1">
                            {accountType === 'organization' 
                                ? "Organization accounts get team collaboration, admin controls, and centralized billing. Perfect for companies wanting to manage multiple team members."
                                : accountType === 'individual'
                                ? "Individual accounts are great for personal projects, freelancers, or small teams. You can always upgrade to an organization account later."
                                : "Individual accounts are for personal use, while Organization accounts provide team features and admin controls for companies."
                            }
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleNext}
                disabled={isLoading || !accountType}
                className={`w-full font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 flex justify-center items-center gap-2 text-sm sm:text-base ${
                    isLoading || !accountType
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-[#00897B] hover:bg-[#00796B] text-white hover:-translate-y-0.5'
                }`}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Setting up...
                    </>
                ) : (
                    <>
                        Continue
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                )}
            </button>
        </div>
    );
};

export default AccountTypeStep;