/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
// components/onboarding/OrganizationInfoForm.js
import React, { useState } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const OrganizationInfoForm = ({ onComplete, isLoading: parentLoading }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        companySize: '',
        website: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { currentUser, userProfile } = useAuth();

    const industryOptions = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'E-commerce',
        'Manufacturing',
        'Consulting',
        'Media & Entertainment',
        'Non-profit',
        'Government',
        'Other'
    ];

    const companySizeOptions = [
        '1-10 employees',
        '11-50 employees',
        '51-200 employees',
        '201-500 employees',
        '501-1000 employees',
        '1000+ employees'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.industry) {
            newErrors.industry = 'Please select an industry';
        }

        if (!formData.companySize) {
            newErrors.companySize = 'Please select company size';
        }

        // Optional website validation
        if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
            newErrors.website = 'Please enter a valid URL (including http:// or https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            console.log('=== ORGANIZATION FORM SUBMISSION ===');
            
            // Create organization in Firestore
            const organizationData = {
                companyName: formData.companyName,
                industry: formData.industry,
                companySize: formData.companySize,
                website: formData.website,
                description: formData.description,
                createdBy: currentUser.uid,
                createdAt: new Date(),
                updatedAt: new Date(),
                members: [currentUser.uid],
                memberCount: 1,
                ownerId: currentUser.uid,
                status: 'active'
            };

            console.log('Creating organization in Firestore...');
            const orgRef = await addDoc(collection(db, 'organizations'), organizationData);
            console.log('Organization created with ID:', orgRef.id);

            // Update user profile with organization ID
            console.log('Updating user profile with organization ID...');
            await setDoc(doc(db, 'users', currentUser.uid), {
                organizationId: orgRef.id,
                organizationName: formData.companyName,
                organizationRole: 'owner',
                updatedAt: new Date()
            }, { merge: true });

            console.log('User profile updated successfully');

            // Prepare data for onComplete callback - THIS IS THE KEY FIX
            const stepCompletionData = {
                organizationId: orgRef.id,
                organizationName: formData.companyName,
                companyName: formData.companyName,
                industry: formData.industry,
                companySize: formData.companySize,
                website: formData.website,
                description: formData.description,
                createdAt: new Date().toISOString()
            };

            console.log('Calling onComplete with data:', stepCompletionData);

            // Call onComplete - this should trigger the step progression
            if (onComplete && typeof onComplete === 'function') {
                await onComplete(stepCompletionData);
                console.log('onComplete called successfully');
            } else {
                console.error('onComplete is not a function:', onComplete);
                throw new Error('Completion handler not available');
            }

        } catch (error) {
            console.error('Error saving organization info:', error);
            setErrors({
                submit: `Failed to save organization information: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    const isFormLoading = loading || parentLoading;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-[#00695C]" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Tell us about your organization
                        </h1>
                        <p className="text-gray-600">
                            Help us customize your experience by providing some basic information about your company
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Step 1 of 3</span>
                            <span>Organization Info</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-teal-600 h-2 rounded-full w-1/3"></div>
                        </div>
                    </div>

                    {/* Error message */}
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {errors.submit}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Name */}
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                disabled={isFormLoading}
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Enter your company name"
                            />
                            {errors.companyName && (
                                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                            )}
                        </div>

                        {/* Industry */}
                        <div>
                            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                                Industry *
                            </label>
                            <select
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                disabled={isFormLoading}
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select your industry</option>
                                {industryOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {errors.industry && (
                                <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                            )}
                        </div>

                        {/* Company Size */}
                        <div>
                            <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                                Company Size *
                            </label>
                            <select
                                id="companySize"
                                name="companySize"
                                value={formData.companySize}
                                onChange={handleInputChange}
                                disabled={isFormLoading}
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.companySize ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select company size</option>
                                {companySizeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {errors.companySize && (
                                <p className="mt-1 text-sm text-red-600">{errors.companySize}</p>
                            )}
                        </div>

                        {/* Website */}
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                                Company Website
                            </label>
                            <input
                                type="url"
                                id="website"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                disabled={isFormLoading}
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="https://www.yourcompany.com"
                            />
                            {errors.website && (
                                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Brief Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                disabled={isFormLoading}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Tell us a bit about what your company does..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isFormLoading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {isFormLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        {loading ? 'Saving...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrganizationInfoForm;