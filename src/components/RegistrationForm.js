// components/RegistrationForm.jsx
'use client'
import React, { useState } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import DomainSuggestion from './DomainSuggestion';
import { isCustomDomain } from '../utils/domainValidation';

const RegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
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

    const [showDomainSuggestion, setShowDomainSuggestion] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

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

    return (
        <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleAccountTypeChange('individual')}
                            className={`p-3 border-2 rounded-lg text-left transition-colors ${
                                formData.accountType === 'individual'
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="font-medium">Individual</div>
                            <div className="text-sm text-gray-500">Personal projects</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAccountTypeChange('organization')}
                            className={`p-3 border-2 rounded-lg text-left transition-colors ${
                                formData.accountType === 'organization'
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="font-medium">Organization</div>
                            <div className="text-sm text-gray-500">Team collaboration</div>
                        </button>
                    </div>
                </div>

                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 ${
                            validationErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="you@example.com"
                    />
                    {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
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
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 ${
                            validationErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="At least 8 characters"
                    />
                    {validationErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                    )}
                </div>

                {/* Display Name */}
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Display Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 ${
                            validationErrors.displayName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Your name"
                    />
                    {validationErrors.displayName && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.displayName}</p>
                    )}
                </div>

                {/* Organization Fields */}
                {formData.accountType === 'organization' && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900">Organization Details</h4>
                        
                        <div>
                            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                id="orgName"
                                value={formData.organizationData.name}
                                onChange={(e) => handleOrganizationDataChange('name', e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 ${
                                    validationErrors.organizationName ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Your company name"
                            />
                            {validationErrors.organizationName && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.organizationName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700">
                                Description (Optional)
                            </label>
                            <textarea
                                id="orgDescription"
                                value={formData.organizationData.description}
                                onChange={(e) => handleOrganizationDataChange('description', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Brief description of your organization..."
                            />
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                </div>

                {/* Google Sign Up */}
                <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>

                {/* Login Link */}
                <div className="text-center">
                    <span className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-teal-600 hover:text-teal-500"
                        >
                            Sign in
                        </button>
                    </span>
                </div>
            </form>
        </div>
    );
};

export default RegistrationForm;