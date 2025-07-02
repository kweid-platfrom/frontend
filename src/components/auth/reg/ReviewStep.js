import React from 'react';
import { Square } from 'lucide-react';

const ReviewStep = ({ 
    formData, 
    errors, 
    accountType, 
    onInputChange, 
    onPrev, 
    onCreateAccount, 
    isCreatingAccount,
}) => {
    const companyTypes = [
        { value: 'startup', label: 'Startup' },
        { value: 'small_business', label: 'Small Business' },
        { value: 'corporation', label: 'Corporation' },
        { value: 'non_profit', label: 'Non-Profit' },
        { value: 'government', label: 'Government' },
        { value: 'education', label: 'Education' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Review & Complete</h1>
            <p className="text-slate-600 mb-6 text-center">
                {accountType === 'organization' 
                    ? 'Complete your organization setup' 
                    : 'Review your account details'
                }
            </p>

            <div className="space-y-4">
                {/* Account Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-2">Account Summary</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                        <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                        <p><span className="font-medium">Email:</span> {formData.email}</p>
                        <p><span className="font-medium">Account Type:</span> {accountType === 'individual' ? 'Individual' : 'Organization'}</p>
                    </div>
                </div>

                {/* Organization Details */}
                {accountType === 'organization' && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => onInputChange('companyName', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                    errors.companyName ? 'border-red-500' : 'border-slate-300'
                                }`}
                                placeholder="Enter your company name"
                            />
                            {errors.companyName && (
                                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="companyType" className="block text-sm font-medium text-slate-700 mb-2">
                                Company Type *
                            </label>
                            <select
                                id="companyType"
                                value={formData.companyType}
                                onChange={(e) => onInputChange('companyType', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                    errors.companyType ? 'border-red-500' : 'border-slate-300'
                                }`}
                            >
                                {companyTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.companyType && (
                                <p className="mt-1 text-sm text-red-600">{errors.companyType}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Terms and Conditions */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={(e) => onInputChange('agreeToTerms', e.target.checked)}
                            className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor="agreeToTerms" className="text-sm text-slate-700">
                            I agree to the{' '}
                            <a href="/terms" className="text-teal-600 hover:text-teal-700 underline">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="text-teal-600 hover:text-teal-700 underline">
                                Privacy Policy
                            </a>
                        </label>
                    </div>
                    {errors.agreeToTerms && (
                        <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onPrev}
                        className="flex-1 px-4 py-3 text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onCreateAccount}
                        disabled={isCreatingAccount}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isCreatingAccount && <Square className="animate-spin h-5 w-5" />}
                        {isCreatingAccount ? 'Signing up...' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ReviewStep;