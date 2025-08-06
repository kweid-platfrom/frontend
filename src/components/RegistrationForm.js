'use client'
import React, { useState } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import DomainSuggestion from './DomainSuggestion';
import { isCustomDomain, isCommonEmailProvider } from '../utils/domainValidation';
import { Eye, EyeOff, Loader2, User, Building, ChevronDown } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import { toast } from 'sonner';

const RegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
    const {
        loading,
        error,
        pendingVerification,
        registerWithEmail,
        completeUserRegistration,
        clearError,
        validateRegistrationData,
    } = useRegistration();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        accountType: 'individual',
        organizationName: '',
        organizationIndustry: '',
        preferences: {}
    });

    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [showDomainSuggestion, setShowDomainSuggestion] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);

    const accountTypes = [
        { value: 'individual', label: 'Individual', description: 'Personal projects', icon: User },
        { value: 'organization', label: 'Organization', description: 'Team collaboration', icon: Building }
    ];

    const industries = [
        { value: 'technology', label: 'Technology' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'finance', label: 'Finance' },
        { value: 'education', label: 'Education' },
        { value: 'retail', label: 'Retail' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'media', label: 'Media & Entertainment' },
        { value: 'nonprofit', label: 'Non-profit' },
        { value: 'government', label: 'Government' },
        { value: 'other', label: 'Other' }
    ];

    React.useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (field === 'email' && value) {
            if (formData.accountType === 'organization' && isCommonEmailProvider(value)) {
                setEmailError('Organization accounts require a custom domain email (e.g., name@yourcompany.com)');
                setShowDomainSuggestion(false);
            } else if (formData.accountType === 'individual' && isCustomDomain(value)) {
                setEmailError('');
                setShowDomainSuggestion(true);
            } else {
                setEmailError('');
                setShowDomainSuggestion(false);
            }
        } else if (field === 'email') {
            setEmailError('');
            setShowDomainSuggestion(false);
        }

        clearError();
    };

    const handleAccountTypeChange = (accountType) => {
        setFormData(prev => ({
            ...prev,
            accountType,
            organizationName: accountType === 'individual' ? '' : prev.organizationName,
            organizationIndustry: accountType === 'individual' ? '' : prev.organizationIndustry
        }));

        if (accountType === 'organization' && formData.email && isCommonEmailProvider(formData.email)) {
            setEmailError('Organization accounts require a custom domain email (e.g., name@yourcompany.com)');
            setShowDomainSuggestion(false);
        } else if (accountType === 'individual' && formData.email && isCustomDomain(formData.email)) {
            setEmailError('');
            setShowDomainSuggestion(true);
        } else {
            setEmailError('');
            setShowDomainSuggestion(false);
        }
        
        setIsDropdownOpen(false);
    };

    const handleIndustryChange = (industry) => {
        setFormData(prev => ({
            ...prev,
            organizationIndustry: industry
        }));
        setIsIndustryDropdownOpen(false);
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
        
        if (formData.accountType === 'organization' && isCommonEmailProvider(formData.email)) {
            toast.error('Organization accounts require a custom domain email');
            return;
        }

        if (formData.accountType === 'organization' && !formData.organizationName) {
            toast.error('Organization name is required');
            return;
        }

        const validation = validateRegistrationData({
            ...formData,
            organizationIndustry: formData.accountType === 'organization' ? formData.organizationIndustry : undefined
        });
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError);
            return;
        }

        const result = await registerWithEmail(formData);
        if (result.success) {
            toast.success('Registration successful! Please check your email to verify your account.');
            if (formData.accountType === 'organization') {
                const orgResult = await completeUserRegistration({
                    name: formData.organizationName,
                    industry: formData.organizationIndustry
                });
                if (orgResult.success) {
                    if (orgResult.needsOrganizationInfo) {
                        toast.error('Organization details required. Please complete setup after signing in.');
                    } else {
                        toast.success('Organization created successfully!');
                        onSuccess({
                            ...result,
                            accountType: formData.accountType,
                            organization: orgResult.data?.organization
                        });
                    }
                } else {
                    toast.error(orgResult.error || 'Failed to create organization.');
                }
            } else {
                onSuccess(result);
            }
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const result = await registerWithGoogle();
            if (result.success) {
                if (result.needsOrganizationInfo) {
                    toast.success('Google sign-up successful! Please provide your organization details.');
                } else {
                    toast.success('Google sign-up successful! Please log in to continue.');
                }
                onSuccess(result);
            }
        } catch (error) {
            console.error('Google sign-up error:', error);
            toast.error('Google sign-up failed. Please try again.');
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
    const selectedIndustry = industries.find(industry => industry.value === formData.organizationIndustry);

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
                <p className="text-base sm:text-lg text-slate-600">Start your testing journey today</p>
            </div>

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

            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="px-4 text-sm text-slate-500 font-medium bg-white">or</span>
                <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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

                {formData.accountType === 'organization' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Organization Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="organizationName"
                                value={formData.organizationName}
                                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10"
                                placeholder="Enter your organization name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">
                                Industry <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 bg-white text-left flex items-center justify-between"
                                >
                                    <span className={formData.organizationIndustry ? 'text-slate-900' : 'text-slate-400'}>
                                        {selectedIndustry ? selectedIndustry.label : 'Select your industry'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isIndustryDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {industries.map((industry) => (
                                            <button
                                                key={industry.value}
                                                type="button"
                                                onClick={() => handleIndustryChange(industry.value)}
                                                className={`w-full px-3 sm:px-4 py-2.5 text-left hover:bg-slate-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-sm sm:text-base ${
                                                    formData.organizationIndustry === industry.value ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-900'
                                                }`}
                                            >
                                                {industry.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 block">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border ${emailError ? 'border-red-500' : 'border-slate-200'} rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder="name@company.com"
                        required
                    />
                    {emailError && (
                        <p className="text-sm text-red-500">{emailError}</p>
                    )}
                    {showDomainSuggestion && formData.accountType === 'individual' && (
                        <DomainSuggestion
                            email={formData.email}
                            currentAccountType={formData.accountType}
                            onSuggestUpgrade={handleSuggestUpgrade}
                            onDismiss={handleDismissSuggestion}
                        />
                    )}
                </div>

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
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="displayName" className="text-sm font-medium text-slate-700 block">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10"
                        placeholder="Enter your full name"
                        required
                    />
                </div>

                {formData.accountType === 'organization' && (
                    <div className="p-4 border border-teal-200 rounded-lg bg-teal-50/50">
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-teal-800">
                                <p className="font-medium mb-1">Organization Account</p>
                                <p>Your organization will be set up after email verification.</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || emailError}
                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    {loading && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 ml-2" />}
                </button>

                <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-teal-600 font-medium sm:font-semibold hover:text-teal-700 hover:underline transition-colors"
                    >
                        Sign In
                    </button>
                </p>
            </form>

            {(isDropdownOpen || isIndustryDropdownOpen) && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => {
                        setIsDropdownOpen(false);
                        setIsIndustryDropdownOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default RegistrationForm;