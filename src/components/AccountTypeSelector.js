// components/AccountTypeSelector.jsx (for Google SSO flow)
'use client'
import React, { useState } from 'react';
import { isCustomDomain } from '../utils/domainValidation';
import DomainSuggestion from './DomainSuggestion';

const AccountTypeSelector = ({ 
    userEmail, 
    onAccountTypeSelected, 
    loading = false, 
    error = null 
}) => {
    const [selectedType, setSelectedType] = useState('individual');
    const [showDomainSuggestion, setShowDomainSuggestion] = useState(
        userEmail && isCustomDomain(userEmail)
    );
    const [organizationData, setOrganizationData] = useState({
        name: '',
        description: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const data = {
            accountType: selectedType,
            organizationData: selectedType === 'organization' ? organizationData : undefined
        };

        onAccountTypeSelected(data);
    };

    const handleSuggestUpgrade = () => {
        setSelectedType('organization');
        setShowDomainSuggestion(false);
    };

    const handleDismissSuggestion = () => {
        setShowDomainSuggestion(false);
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Complete Your Account Setup
                </h2>
                <p className="text-gray-600">
                    Choose your account type to get started
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Account Type
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedType('individual')}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                selectedType === 'individual'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-4 h-4 rounded-full border-2 ${
                                        selectedType === 'individual'
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedType === 'individual' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="font-medium text-gray-900">Individual Account</div>
                                    <div className="text-sm text-gray-500">
                                        Perfect for personal projects and solo work
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        • Personal dashboard • Individual test suites • Basic features
                                    </div>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedType('organization')}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                selectedType === 'organization'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-4 h-4 rounded-full border-2 ${
                                        selectedType === 'organization'
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedType === 'organization' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="font-medium text-gray-900">Organization Account</div>
                                    <div className="text-sm text-gray-500">
                                        Built for teams and collaborative work
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        • Team collaboration • Advanced permissions • Organization management
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Domain Suggestion for Individual + Custom Domain */}
                {showDomainSuggestion && selectedType === 'individual' && (
                    <DomainSuggestion
                        email={userEmail}
                        currentAccountType={selectedType}
                        onSuggestUpgrade={handleSuggestUpgrade}
                        onDismiss={handleDismissSuggestion}
                    />
                )}

                {/* Organization Details */}
                {selectedType === 'organization' && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-medium text-gray-900">Organization Details</h4>
                        
                        <div>
                            <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                id="orgName"
                                required
                                value={organizationData.name}
                                onChange={(e) => setOrganizationData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Your company name"
                            />
                        </div>

                        <div>
                            <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700">
                                Description (Optional)
                            </label>
                            <textarea
                                id="orgDescription"
                                value={organizationData.description}
                                onChange={(e) => setOrganizationData(prev => ({
                                    ...prev,
                                    description: e.target.value
                                }))}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Setting up account...' : 'Complete Setup'}
                </button>
            </form>
        </div>
    );
};

export default AccountTypeSelector;