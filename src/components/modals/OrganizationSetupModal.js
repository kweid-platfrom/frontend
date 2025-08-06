'use client';

import React, { useState } from 'react';
import { X, Building2, User, Mail } from 'lucide-react';

const OrganizationSetupModal = ({ 
    isOpen, 
    onComplete, 
    isRequired = false,
    user,
    pendingData 
}) => {
    const [formData, setFormData] = useState({
        organizationName: '',
        description: '',
        industry: '',
        size: '1-10',
        website: '',
        location: '',
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const industryOptions = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'E-commerce',
        'Manufacturing',
        'Consulting',
        'Media & Entertainment',
        'Government',
        'Non-profit',
        'Other'
    ];

    const sizeOptions = [
        { value: '1-10', label: '1-10 employees' },
        { value: '11-50', label: '11-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '201-500', label: '201-500 employees' },
        { value: '501-1000', label: '501-1000 employees' },
        { value: '1000+', label: '1000+ employees' }
    ];

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.organizationName.trim()) {
            newErrors.organizationName = 'Organization name is required';
        }
        
        if (!formData.industry) {
            newErrors.industry = 'Please select an industry';
        }
        
        if (!formData.size) {
            newErrors.size = 'Please select organization size';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await onComplete(formData);
        } catch (error) {
            console.error('Organization setup error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/50 transition-opacity" />
                
                {/* Modal */}
                <div className="relative w-full max-w-2xl transform rounded-xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Building2 className="h-6 w-6 text-teal-600" />
                                Set Up Your Organization
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Complete your organization profile to access team features
                            </p>
                        </div>
                        {!isRequired && (
                            <button
                                onClick={() => onComplete(null)}
                                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* User Info Summary */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Account Owner</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{user?.displayName || pendingData?.displayName || 'User'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-96 overflow-y-auto">
                        {/* Organization Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                value={formData.organizationName}
                                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                    errors.organizationName ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your organization name"
                            />
                            {errors.organizationName && (
                                <p className="mt-1 text-sm text-red-600">{errors.organizationName}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Brief description of your organization (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Industry */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Industry *
                                </label>
                                <select
                                    value={formData.industry}
                                    onChange={(e) => handleInputChange('industry', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                        errors.industry ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select an industry</option>
                                    {industryOptions.map((industry) => (
                                        <option key={industry} value={industry}>
                                            {industry}
                                        </option>
                                    ))}
                                </select>
                                {errors.industry && (
                                    <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                                )}
                            </div>

                            {/* Organization Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Size *
                                </label>
                                <select
                                    value={formData.size}
                                    onChange={(e) => handleInputChange('size', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                        errors.size ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    {sizeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.size && (
                                    <p className="mt-1 text-sm text-red-600">{errors.size}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="https://www.example.com"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-teal-900 mb-1">
                                        Organization Benefits
                                    </p>
                                    <ul className="text-teal-700 space-y-1">
                                        <li>• Team collaboration and sharing</li>
                                        <li>• Centralized test management</li>
                                        <li>• Role-based access control</li>
                                        <li>• Advanced reporting and analytics</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500">
                            You can update these details later in organization settings
                        </p>
                        
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    Complete Setup
                                    <Building2 className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSetupModal;