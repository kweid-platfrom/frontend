import React from 'react';
import { User, Building, ArrowRight, CheckCircle } from 'lucide-react';

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

const AccountTypeStep = ({ accountType, setAccountType, onNext, currentStep }) => {
    return (
        <div className="bg-white rounded-xl border border-white/20 p-6 sm:p-8 relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
            
            <StepIndicator currentStep={currentStep} accountType={accountType} />

            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Create Your Account</h1>
                <p className="text-sm sm:text-base text-slate-600">Choose your account type to get started</p>
            </div>

            <div className="space-y-4 mb-6">
                <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        accountType === 'individual'
                            ? 'border-teal-500 bg-teal-50/50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                    onClick={() => setAccountType('individual')}
                >
                    <div className="flex items-center">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 text-sm sm:text-base">Individual Account</h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">For solo testers, freelancers, and small teams</p>
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

                <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        accountType === 'organization'
                            ? 'border-teal-500 bg-teal-50/50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                    onClick={() => setAccountType('organization')}
                >
                    <div className="flex items-center">
                        <Building className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 text-sm sm:text-base">Organization Account</h3>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">For companies with custom domains and team collaboration</p>
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

            <button
                onClick={onNext}
                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 flex justify-center items-center gap-2 hover:-translate-y-0.5 text-sm sm:text-base"
            >
                Continue
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </div>
    );
};

export default AccountTypeStep;