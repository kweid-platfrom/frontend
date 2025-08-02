// components/OrganizationInfoForm.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Loader2 } from 'lucide-react';
import { extractDomainName } from '../utils/domainValidation';
import { toast } from 'sonner';

const OrganizationInfoForm = ({ 
    userEmail, 
    userDisplayName, 
    userOrganizationIndustry,
    onSubmit, 
    loading, 
    error 
}) => {
    const router = useRouter();
    const [organizationData, setOrganizationData] = useState({
        name: '',
        description: '',
        size: 'small'
    });

    const organizationSizes = [
        { value: 'small', label: '1-10 employees', icon: '👥' },
        { value: 'medium', label: '11-50 employees', icon: '🏢' },
        { value: 'large', label: '51-200 employees', icon: '🏬' },
        { value: 'enterprise', label: '200+ employees', icon: '🏭' }
    ];

    // Show toast for errors
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    // Auto-suggest organization name based on email domain
    useEffect(() => {
        if (userEmail && !organizationData.name) {
            const domainName = extractDomainName(userEmail);
            if (domainName) {
                setOrganizationData(prev => ({
                    ...prev,
                    name: domainName,
                    description: `Organization for ${domainName}`
                }));
            }
        }
    }, [userEmail, organizationData.name]);

    const handleInputChange = (field, value) => {
        setOrganizationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        // Prevent default form submission first
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Form submission started'); // Debug log
        
        if (!organizationData.name.trim()) {
            toast.error('Organization name is required');
            return;
        }

        if (organizationData.name.trim().length < 2) {
            toast.error('Organization name must be at least 2 characters');
            return;
        }

        try {
            console.log('Calling onSubmit with data:', organizationData); // Debug log
            
            // Submit organization data
            const result = await onSubmit(organizationData);
            
            console.log('onSubmit result:', result); // Debug log
            
            // Check multiple possible success indicators
            if (result === true || result?.success === true || result?.status === 'success') {
                console.log('Success detected, showing toast and redirecting'); // Debug log
                
                // Show success toast
                toast.success('Organization created successfully! Redirecting to login...');
                
                // Use router.replace instead of router.push to prevent back navigation
                // Also reduce timeout for faster UX
                setTimeout(() => {
                    console.log('Attempting redirect to /login'); // Debug log
                    router.replace('/login');
                }, 1000);
            } else {
                console.log('Success condition not met, result:', result); // Debug log
                toast.error('Organization creation completed but status unclear. Please check your account.');
            }
        } catch (error) {
            console.error('Organization creation error:', error);
            toast.error(`Failed to create organization: ${error.message || 'Please try again.'}`);
        }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                    <Building className="w-8 h-8 text-teal-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Set up your organization
                </h1>
                <p className="text-base sm:text-lg text-slate-600">
                    Tell us about your organization to complete setup
                </p>
            </div>

            {/* User Info Display */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <div className="text-sm text-slate-600 mb-1">Account for:</div>
                <div className="font-medium text-slate-900">{userDisplayName}</div>
                <div className="text-sm text-slate-600 mb-2">{userEmail}</div>
                {userOrganizationIndustry && (
                    <div className="text-sm text-slate-500">
                        Industry: {userOrganizationIndustry.charAt(0).toUpperCase() + userOrganizationIndustry.slice(1)}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Organization Name */}
                <div className="space-y-2">
                    <label htmlFor="orgName" className="text-sm font-medium text-slate-700 block">
                        Organization Name *
                    </label>
                    <input
                        type="text"
                        id="orgName"
                        value={organizationData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10"
                        placeholder="Your company or organization name"
                        disabled={loading}
                        required
                    />
                </div>

                {/* Organization Size */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">
                        Organization Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {organizationSizes.map((size) => (
                            <button
                                key={size.value}
                                type="button"
                                onClick={() => handleInputChange('size', size.value)}
                                className={`p-3 border rounded-lg text-left transition-all duration-200 ${
                                    organizationData.size === size.value
                                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                }`}
                                disabled={loading}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{size.icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{size.label}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Organization Description */}
                <div className="space-y-2">
                    <label htmlFor="orgDescription" className="text-sm font-medium text-slate-700 block">
                        Description (Optional)
                    </label>
                    <textarea
                        id="orgDescription"
                        value={organizationData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded text-slate-900 placeholder-slate-400 transition-all duration-200 text-sm sm:text-base focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 resize-none"
                        placeholder="Brief description of your organization (optional)..."
                        disabled={loading}
                    />
                </div>

                {/* Info Box */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="text-sm text-teal-800">
                            <p className="font-medium mb-1">What happens next?</p>
                            <p>Your organization will be created and you&apos;ll be set as the administrator. You can invite team members and configure settings from your dashboard.</p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !organizationData.name.trim()}
                    className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium sm:font-semibold rounded px-4 sm:px-6 py-2.5 sm:py-2 transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg text-sm sm:text-base"
                >
                    {loading ? 'Creating Organization...' : 'Complete Setup'}
                    {loading && <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
            </form>

            {/* Progress Indicator */}
            <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-xs text-slate-500 ml-2">Final Step</span>
                </div>
            </div>
        </div>
    );
};

export default OrganizationInfoForm;