// components/DomainSuggestion.jsx
import React from 'react';
import { isCustomDomain, extractDomain } from '../utils/domainValidation';

const DomainSuggestion = ({ 
    email, 
    currentAccountType, 
    onSuggestUpgrade, 
    onDismiss,
    className = '' 
}) => {
    if (!email || currentAccountType === 'organization' || !isCustomDomain(email)) {
        return null;
    }

    const domain = extractDomain(email);

    return (
        <div className={`bg-teal-50 border border-teal-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-teal-800">
                        Organization Account Suggested
                    </h4>
                    <p className="mt-1 text-sm text-teal-700">
                        We noticed you&apos;re using a custom domain email ({domain}). 
                        You might benefit from our organization features like team collaboration, 
                        advanced permissions, and centralized management.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={onSuggestUpgrade}
                            className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 transition-colors"
                        >
                            Switch to Organization
                        </button>
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="text-sm text-teal-600 hover:text-teal-800 px-3 py-1"
                        >
                            Continue as Individual
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DomainSuggestion;
