// components/RegistrationForm.jsx
'use client'
import React, { useState } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import DomainSuggestion from './DomainSuggestion';
import { isCustomDomain } from '../utils/domainValidation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, User, Building, ChevronDown } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";

const RegistrationForm = ({ onSuccess }) => {
    const {
        loading,
        error,
        pendingVerification,
        registerWithEmail,
        registerWithGoogle,
        clearError,
        validateRegistrationData
    } = useRegistration();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        accountType: 'individual',
        organizationData: {
            name: '',
            description: ''
        },
        preferences: {}
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showDomainSuggestion, setShowDomainSuggestion] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const accountTypes = [
        {
            value: 'individual',
            label: 'Individual',
            description: 'Personal projects',
            icon: User
        },
        {
            value: 'organization',
            label: 'Organization',
            description: 'Team collaboration',
            icon: Building
        }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Show domain suggestion for individual accounts with custom domains
        if (field === 'email' && value && isCustomDomain(value) && formData.accountType === 'individual') {
            setShowDomainSuggestion(true);
        }

        // Clear validation errors
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
        
        clearError();
    };

    const handleOrganizationDataChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            organizationData: {
                ...prev.organizationData,
                [field]: value
            }
        }));
    };

    const handleAccountTypeChange = (accountType) => {
        setFormData(prev => ({
            ...prev,
            accountType
        }));

        // Reset domain suggestion when switching to organization
        if (accountType === 'organization') {
            setShowDomainSuggestion(false);
        }
        setIsDropdownOpen(false);
    };

    const handleSuggestUpgrade = () => {
        handleAccountTypeChange('organization');
        setShowDomainSuggestion(false);
    };

    const handleDismissSuggestion = () => {
        setShowDomainSuggestion(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form data
        const validation = validateRegistrationData(formData);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            return;
        }

        const result = await registerWithEmail(formData);
        if (result.success) {
            onSuccess(result);
        }
    };

    const handleGoogleSignUp = async () => {
        // For Google sign-up, we need account type selection first
        // This would typically be handled in a modal or separate step
        const accountTypeData = {
            accountType: formData.accountType,
            organizationData: formData.organizationData,
            displayName: formData.displayName || undefined
        };

        const result = await registerWithGoogle(accountTypeData);
        if (result.success) {
            onSuccess(result);
        }
    };

    if (pendingVerification) {
        return (
            <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-4">
                    We&apos;ve sent a verification link to <strong>{formData.email}</strong>. 
                    Please check your email and click the link to verify your account.
                </p>
                <p className="text-sm text-gray-500">
                    Didn&apos;t receive the email? Check your spam folder or{' '}
                    <button 
                        className="text-teal-600 hover:text-teal-800 underline"
                        onClick={() => {/* Handle resend */}}
                    >
                        resend verification
                    </button>
                </p>
            </div>
        );
    }

    const selectedAccountType = accountTypes.find(type => type.value === formData.accountType);

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                <p className="text-base sm:text-lg text-slate-600">Start your testing journey today</p>
            </div>

            {/* Google Sign Up - Moved to top */}
            <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full bg-white/80 backdrop-blur-sm hover:bg-slate-50/80 text-slate-700 font-medium sm:font-semibold border-2 border-slate-200 rounded px-3 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base mb-6"
            >
                <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Continue with Google</span>
                {loading && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="px-4 text-sm text-slate-500 font-medium bg-white">or</span>
                <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Type Selection - Custom Dropdown */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">
                        Account Type
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 bg-white text-left flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <selectedAccountType.icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                                <div>
                                    <div className="font-medium">{selectedAccountType.label}</div>
                                    <div className="text-xs text-slate-500">{selectedAccountType.description}</div>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Options */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                {accountTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleAccountTypeChange(type.value)}
                                        className={`w-full px-3 sm:px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                                            formData.accountType === type.value ? 'bg-teal-50 border-l-2 border-l-teal-500' : ''
                                        }`}
                                    >
                                        <type.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${formData.accountType === type.value ? 'text-teal-600' : 'text-slate-500'}`} />
                                        <div>
                                            <div className={`font-medium text-sm sm:text-base ${formData.accountType === type.value ? 'text-teal-900' : 'text-slate-900'}`}>
                                                {type.label}
                                            </div>
                                            <div className="text-xs text-slate-500">{type.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 block">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                            validationErrors.email ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                        } focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder="name@company.com"
                    />
                    {validationErrors.email && (
                        <p className="text-red-600 text-xs font-medium mt-2">{validationErrors.email}</p>
                    )}
                </div>

                {/* Domain Suggestion */}
                {showDomainSuggestion && (
                    <DomainSuggestion
                        email={formData.email}
                        currentAccountType={formData.accountType}
                        onSuggestUpgrade={handleSuggestUpgrade}
                        onDismiss={handleDismissSuggestion}
                    />
                )}

                {/* Password Field */}
                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700 block">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                                validationErrors.password ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                            } focus:outline-none focus:ring focus:ring-teal-500/10`}
                            placeholder="At least 6 characters"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                    {validationErrors.password && (
                        <p className="text-red-600 text-xs font-medium mt-2">{validationErrors.password}</p>
                    )}
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                    <label htmlFor="displayName" className="text-sm font-medium text-slate-700 block">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                            validationErrors.displayName ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                        } focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder="Enter your full name"
                    />
                    {validationErrors.displayName && (
                        <p className="text-red-600 text-xs font-medium mt-2">{validationErrors.displayName}</p>
                    )}
                </div>

                {/* Organization Fields */}
                <div className="min-h-0">
                    {formData.accountType === 'organization' && (
                        <div className="space-y-4 p-4 border border-teal-200 rounded-lg bg-teal-50/50 animate-in slide-in-from-top-2 duration-200">
                            <h4 className="font-medium text-slate-900">Organization Details</h4>
                            
                            <div className="space-y-2">
                                <label htmlFor="orgName" className="text-sm font-medium text-slate-700 block">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    id="orgName"
                                    value={formData.organizationData.name}
                                    onChange={(e) => handleOrganizationDataChange('name', e.target.value)}
                                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base ${
                                        validationErrors.organizationName ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-teal-500"
                                    } focus:outline-none focus:ring focus:ring-teal-500/10 bg-white`}
                                    placeholder="Your company name"
                                />
                                {validationErrors.organizationName && (
                                    <p className="text-red-600 text-xs font-medium mt-2">{validationErrors.organizationName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="orgDescription" className="text-sm font-medium text-slate-700 block">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="orgDescription"
                                    value={formData.organizationData.description}
                                    onChange={(e) => handleOrganizationDataChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 bg-white resize-none"
                                    placeholder="Brief description of your organization..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {loading && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                </button>

                {/* Login Link */}
                <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-teal-600 font-medium sm:font-semibold hover:text-teal-700 hover:underline transition-colors">
                        Sign In
                    </Link>
                </p>
            </form>

            {/* Click outside to close dropdown */}
            {isDropdownOpen && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
};

export default RegistrationForm;