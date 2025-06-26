import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

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

const PersonalInfoStep = ({ formData, errors, onInputChange, onNext, onPrev, currentStep, accountType }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="bg-white rounded-xl border border-white/20 p-6 sm:p-8 relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
            
            <StepIndicator currentStep={currentStep} accountType={accountType} />

            <div className="text-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Personal Information</h1>
                <p className="text-sm sm:text-base text-slate-600">Tell us about yourself</p>
            </div>

            <div className="space-y-4 sm:space-y-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => onInputChange('fullName', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base ${
                            errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-teal-500'
                        }`}
                        placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-red-600 text-xs font-medium mt-2">{errors.fullName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => onInputChange('email', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base ${
                            errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-teal-500'
                        }`}
                        placeholder="name@company.com"
                    />
                    {errors.email && <p className="text-red-600 text-xs font-medium mt-2">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => onInputChange('password', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base ${
                                errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-teal-500'
                            }`}
                            placeholder="Create a password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-red-600 text-xs font-medium mt-2">{errors.password}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base ${
                                errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-teal-500'
                            }`}
                            placeholder="Confirm your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-600 text-xs font-medium mt-2">{errors.confirmPassword}</p>}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={onPrev}
                    className="flex-1 bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-medium sm:font-semibold border-2 border-slate-200 rounded px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 flex justify-center items-center gap-2 hover:-translate-y-0.5 text-sm sm:text-base"
                >
                    Continue
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
};

export default PersonalInfoStep;