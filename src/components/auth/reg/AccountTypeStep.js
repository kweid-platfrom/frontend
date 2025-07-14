import React, { useState } from 'react';
import { User, Building, ArrowRight, AlertCircle } from 'lucide-react';

const AccountTypeStep = ({ 
    accountType, 
    setAccountType, 
    onNext, 
    error, 
    isLoading = false
}) => {
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
        setLocalError('');
    };

    const displayError = error || localError;

    return (
        <div className="relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
            
            <div className="text-center mb-6">
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

            {/* Account Type Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Individual Account Option */}
                <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        accountType === 'individual'
                            ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isLoading && handleAccountTypeChange('individual')}
                >
                    <div className="text-center">
                        <User className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-slate-900 text-base mb-2">Individual</h3>
                        <p className="text-sm text-slate-600 mb-3">For solo testers and freelancers</p>
                        <div className="flex justify-center">
                            <div className={`w-4 h-4 rounded-full border-2 ${
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
                    <div className="text-center">
                        <Building className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-slate-900 text-base mb-2">Organization</h3>
                        <p className="text-sm text-slate-600 mb-3">For companies and teams</p>
                        <div className="flex justify-center">
                            <div className={`w-4 h-4 rounded-full border-2 ${
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
            </div>

            {/* Information Box */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">What&apos;s the difference?</p>
                        <p className="text-sm text-blue-700">
                            {accountType === 'organization' 
                                ? "Organization accounts require a company email and provide team collaboration, admin controls, and centralized billing."
                                : accountType === 'individual'
                                ? "Individual accounts work with any email and are perfect for personal projects. You can upgrade to organization later."
                                : "Individual accounts work with any email, while Organization accounts require company emails but provide team features."
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