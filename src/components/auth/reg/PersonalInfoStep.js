import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, ArrowRight, X, Building } from 'lucide-react';
import { shouldShowOrganizationPrompt, getEmailDomainInfo } from '../../../utils/emailDomainValidator';

const PersonalInfoStep = ({ 
    formData, 
    errors, 
    onInputChange, 
    onNext, 
    onPrev,
    accountType,
    setAccountType,
    emailValidation
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDomainBubble, setShowDomainBubble] = useState(false);
    const [emailValidationTimer, setEmailValidationTimer] = useState(null);

    // Debounced email validation function
    const validateEmailWithDelay = useCallback((email) => {
        // Clear existing timer
        if (emailValidationTimer) {
            clearTimeout(emailValidationTimer);
        }

        // Set new timer with longer delay for more accurate validation
        const timer = setTimeout(() => {
            if (email && shouldShowOrganizationPrompt(email, accountType)) {
                setShowDomainBubble(true);
            } else {
                setShowDomainBubble(false);
            }
        }, 1000); // Increased delay to 1 second for more reliable validation

        setEmailValidationTimer(timer);
    }, [emailValidationTimer, accountType]);

    const handleEmailChange = (e) => {
        const value = e.target.value;
        onInputChange('email', value);
        
        // Show organization prompt for custom domains on individual accounts
        if (value && value.includes('@')) {
            validateEmailWithDelay(value);
        } else {
            setShowDomainBubble(false);
            // Clear timer if email is incomplete
            if (emailValidationTimer) {
                clearTimeout(emailValidationTimer);
                setEmailValidationTimer(null);
            }
        }
    };

    const handleSwitchToOrganization = () => {
        // Add safety check for setAccountType function
        if (typeof setAccountType === 'function') {
            setAccountType('organization');
            setShowDomainBubble(false);
        } else {
            console.error('setAccountType is not a function. Please check the parent component.');
        }
    };

    const handleDismissBubble = () => {
        setShowDomainBubble(false);
        // Clear timer when bubble is dismissed
        if (emailValidationTimer) {
            clearTimeout(emailValidationTimer);
            setEmailValidationTimer(null);
        }
    };

    // Get domain for display in prompt
    const getDomain = () => {
        if (formData.email && formData.email.includes('@')) {
            const domainInfo = getEmailDomainInfo(formData.email);
            return domainInfo.domain || '';
        }
        return '';
    };

    const renderEmailValidationFeedback = () => {
        if (!emailValidation || !formData.email || showDomainBubble) return null;

        // Show success message for organization accounts with custom domains
        if (emailValidation.isValid && 
            emailValidation.domainInfo?.isCustom && 
            accountType === 'organization') {
            return (
                <div className="mt-2">
                    <p className="text-sm text-green-700">
                        Perfect! Custom domain email is ideal for organization accounts.
                    </p>
                </div>
            );
        }
        
        // Show validation messages
        if (emailValidation.suggestion) {
            return (
                <div className="mt-2">
                    <p className="text-sm text-amber-600">
                        {emailValidation.suggestion}
                    </p>
                </div>
            );
        }

        return null;
    };

    // Close bubble if account type changes or email is cleared
    useEffect(() => {
        if (accountType !== 'individual' || !formData.email) {
            setShowDomainBubble(false);
            // Clear timer when conditions change
            if (emailValidationTimer) {
                clearTimeout(emailValidationTimer);
                setEmailValidationTimer(null);
            }
        }
    }, [accountType, formData.email, emailValidationTimer]);

    // Cleanup timer on component unmount
    useEffect(() => {
        return () => {
            if (emailValidationTimer) {
                clearTimeout(emailValidationTimer);
            }
        };
    }, [emailValidationTimer]);

    return (
        <div className="relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
            
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base border-slate-200 focus:border-teal-500"
                        placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-red-600 text-xs font-medium mt-2">{errors.fullName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address *
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base border-slate-200 focus:border-teal-500"
                            placeholder="name@company.com"
                        />
                        
                        {/* Organization prompt bubble */}
                        {showDomainBubble && (
                            <div className="fixed z-50" style={{
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)'
                            }}>
                                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm mx-4 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-5 h-5 text-teal-600" />
                                            <h3 className="font-medium text-gray-900 text-sm">Custom Domain Detected</h3>
                                        </div>
                                        <button 
                                            onClick={handleDismissBubble} 
                                            className="text-gray-400 hover:text-gray-600 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-4">
                                        You&apos;re using <strong>{getDomain()}</strong>. Organization accounts work better with company domains.
                                    </p>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSwitchToOrganization}
                                            className="flex-1 bg-teal-600 text-white text-sm px-3 py-2 rounded hover:bg-teal-700 transition-colors"
                                        >
                                            Switch to Organization
                                        </button>
                                        <button
                                            onClick={handleDismissBubble}
                                            className="flex-1 border border-gray-300 text-gray-700 text-sm px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            Continue Individual
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {errors.email && <p className="text-red-600 text-xs font-medium mt-2">{errors.email}</p>}
                    {!showDomainBubble && renderEmailValidationFeedback()}
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
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base border-slate-200 focus:border-teal-500"
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
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base border-slate-200 focus:border-teal-500"
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
                    className="flex-1 bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 border-2 border-slate-200 rounded px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                >
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