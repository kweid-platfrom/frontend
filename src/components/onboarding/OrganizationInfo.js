/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
// components/onboarding/UnifiedOrganizationOnboarding.js
import React, { useState } from 'react';
import { Building2, ArrowRight, Loader2, Users, Mail, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const UnifiedOrganizationOnboarding = ({ onComplete, isLoading: parentLoading }) => {
    // Current step state
    const [currentStep, setCurrentStep] = useState(1); // 1: Org Info, 2: Team Invites

    // Organization form state
    const [orgFormData, setOrgFormData] = useState({
        companyName: '',
        industry: '',
        companySize: '',
        website: '',
        description: ''
    });

    // Team invite state
    const [emails, setEmails] = useState(['']);
    const [orgDomain, setOrgDomain] = useState('');
    const [externalEmails, setExternalEmails] = useState([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [organizationId, setOrganizationId] = useState(null);

    const { currentUser, userProfile } = useAuth();

    // Organization form options
    const industryOptions = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
        'Manufacturing', 'Consulting', 'Media & Entertainment', 'Non-profit',
        'Government', 'Other'
    ];

    const companySizeOptions = [
        '1-10 employees', '11-50 employees', '51-200 employees',
        '201-500 employees', '501-1000 employees', '1000+ employees'
    ];

    // Organization form handlers
    const handleOrgInputChange = (e) => {
        const { name, value } = e.target;
        setOrgFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateOrgForm = () => {
        const newErrors = {};

        if (!orgFormData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }
        if (!orgFormData.industry) {
            newErrors.industry = 'Please select an industry';
        }
        if (!orgFormData.companySize) {
            newErrors.companySize = 'Please select company size';
        }
        if (orgFormData.website && !orgFormData.website.match(/^https?:\/\/.+/)) {
            newErrors.website = 'Please enter a valid URL (including http:// or https://)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Team invite handlers
    const handleAddEmailField = () => setEmails([...emails, '']);

    const handleRemoveEmailField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleEmailChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const validateEmails = (emailList) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailList.every((email) => !email.trim() || emailRegex.test(email));
    };

    // Step 1: Organization Info Submission
    const handleOrgFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateOrgForm()) return;

        setLoading(true);
        try {
            console.log('=== ORGANIZATION FORM SUBMISSION ===');

            const organizationData = {
                companyName: orgFormData.companyName,
                industry: orgFormData.industry,
                companySize: orgFormData.companySize,
                website: orgFormData.website,
                description: orgFormData.description,
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
            await setDoc(doc(db, 'users', currentUser.uid), {
                organizationId: orgRef.id,
                organizationName: orgFormData.companyName,
                organizationRole: 'owner',
                updatedAt: new Date()
            }, { merge: true });

            // Set organization domain for email validation
            if (currentUser.email) {
                setOrgDomain(currentUser.email.split('@')[1]);
            }

            // Store organization ID for later use
            setOrganizationId(orgRef.id);

            // Move to next step
            setCurrentStep(2);
            toast.success('Organization information saved successfully!');

        } catch (error) {
            console.error('Error saving organization info:', error);
            setErrors({
                submit: `Failed to save organization information: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Team Invites Submission
    const handleTeamInvitesSubmit = async (e) => {
        e.preventDefault();

        const filtered = emails.filter((email) => email.trim());

        if (filtered.length === 0) {
            // Skip team invites
            await completeOnboarding([]);
            return;
        }

        if (!validateEmails(filtered)) {
            toast.error("One or more email addresses are invalid.");
            return;
        }

        const external = filtered.filter((email) => !email.endsWith(`@${orgDomain}`));
        if (external.length > 0) {
            setExternalEmails(filtered);
            setShowConfirmDialog(true);
        } else {
            await sendInvites(filtered);
        }
    };

    const handleSkipTeamInvites = async () => {
        setLoading(true); // Add loading state
        try {
            console.log('Skipping team invites...'); // Add logging
            await completeOnboarding([], true);
        } catch (error) {
            console.error('Error skipping team invites:', error);
            toast.error('Failed to skip team invites. Please try again.');
            // Don't change step on error
        } finally {
            setLoading(false);
        }
    };

    const sendInvites = async (inviteEmails) => {
        setLoading(true);
        try {
            console.log('Sending invites to:', inviteEmails);

            // Send invite emails
            const response = await fetch('/api/send-invites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: inviteEmails,
                    inviterName: currentUser.email.split('@')[0],
                    inviterEmail: currentUser.email,
                    organizationName: orgFormData.companyName,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send invites');
            }

            const result = await response.json();
            toast.success(`Invites sent successfully to ${result.sentCount} recipients`);

            // Complete onboarding
            await completeOnboarding(inviteEmails);

        } catch (error) {
            console.error("Error sending invites:", error);
            toast.error("Failed to send some invites. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const confirmExternalInvite = () => {
        setShowConfirmDialog(false);
        sendInvites(externalEmails);
    };

    // Complete the entire onboarding process
    const completeOnboarding = async (invitedEmails = [], skipped = false) => {
        try {
            const completionData = {
                // Organization step data
                organizationId: organizationId,
                organizationName: orgFormData.companyName,
                organizationData: orgFormData,

                // Team invites step data
                invitedEmails: invitedEmails,
                teamInvitesSkipped: skipped,

                // Completion timestamp
                completedAt: new Date().toISOString()
            };

            console.log('Completing onboarding with data:', completionData);

            if (onComplete && typeof onComplete === 'function') {
                // Make sure onComplete is awaited properly
                const result = await onComplete(completionData);
                console.log('onComplete result:', result);
            } else {
                console.warn('onComplete callback is not provided or not a function');
            }

        } catch (error) {
            console.error('Error completing onboarding:', error);
            toast.error('Failed to complete onboarding. Please try again.');
            throw error; // Re-throw to let the caller handle it
        }
    };

    const isFormLoading = loading || parentLoading;
    const filledEmailsCount = emails.filter(email => email.trim()).length;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Progress indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Step {currentStep} of 2</span>
                            <span>{currentStep === 1 ? 'Organization Info' : 'Team Invites'}</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentStep / 2) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Step 1: Organization Information */}
                    {currentStep === 1 && (
                        <>
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

                            {errors.submit && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {errors.submit}
                                </div>
                            )}

                            <form onSubmit={handleOrgFormSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        value={orgFormData.companyName}
                                        onChange={handleOrgInputChange}
                                        disabled={isFormLoading}
                                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter your company name"
                                    />
                                    {errors.companyName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                                        Industry *
                                    </label>
                                    <select
                                        id="industry"
                                        name="industry"
                                        value={orgFormData.industry}
                                        onChange={handleOrgInputChange}
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

                                <div>
                                    <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Size *
                                    </label>
                                    <select
                                        id="companySize"
                                        name="companySize"
                                        value={orgFormData.companySize}
                                        onChange={handleOrgInputChange}
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

                                <div>
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Website
                                    </label>
                                    <input
                                        type="url"
                                        id="website"
                                        name="website"
                                        value={orgFormData.website}
                                        onChange={handleOrgInputChange}
                                        disabled={isFormLoading}
                                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="https://www.yourcompany.com"
                                    />
                                    {errors.website && (
                                        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Brief Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={orgFormData.description}
                                        onChange={handleOrgInputChange}
                                        disabled={isFormLoading}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        placeholder="Tell us a bit about what your company does..."
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isFormLoading}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                    >
                                        {isFormLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
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
                        </>
                    )}

                    {/* Step 2: Team Invites */}
                    {currentStep === 2 && (
                        <>
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                                    <Users className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    Invite Your Team
                                </h3>
                                <p className="text-base text-slate-600 max-w-md mx-auto">
                                    Collaborate seamlessly with your teammates. You can always invite more people later.
                                </p>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-sm text-slate-500">
                                    {filledEmailsCount > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {filledEmailsCount} email{filledEmailsCount !== 1 ? 's' : ''} added
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddEmailField}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 hover:border-teal-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Email
                                </button>
                            </div>

                            <div className="space-y-4 mb-8">
                                {emails.map((email, index) => (
                                    <div key={index} className="group relative">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="email"
                                                    placeholder="teammate@company.com"
                                                    value={email}
                                                    onChange={(e) => handleEmailChange(index, e.target.value)}
                                                    className="w-full px-4 py-3 text-base border border-slate-200 rounded text-slate-900 placeholder-slate-400 bg-white transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 hover:border-slate-300"
                                                />
                                                {email && email.includes("@") && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        <div className={`w-2 h-2 rounded-full ${email.endsWith(`@${orgDomain}`)
                                                            ? 'bg-green-400'
                                                            : 'bg-yellow-400'
                                                            }`} title={
                                                                email.endsWith(`@${orgDomain}`)
                                                                    ? 'Internal email'
                                                                    : 'External email'
                                                            } />
                                                    </div>
                                                )}
                                            </div>

                                            {emails.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmailField(index)}
                                                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    aria-label="Remove email"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleSkipTeamInvites}
                                    className="flex-1 px-6 py-3.5 text-base font-medium text-slate-700 bg-white border-2 border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isFormLoading}
                                >
                                    Skip
                                </button>

                                <button
                                    type="button"
                                    onClick={handleTeamInvitesSubmit}
                                    className="flex-1 px-6 py-3.5 text-base font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                                    disabled={isFormLoading}
                                >
                                    {isFormLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-5 h-5" />
                                            <span>Send Invites</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {emails.some(email => email.includes("@")) && orgDomain && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span>Internal ({orgDomain})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            <span>External domain</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Confirmation Dialog */}
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogContent className="mx-4 max-w-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">
                                    Invite External Members?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                    {externalEmails.length} email{externalEmails.length !== 1 ? 's are' : ' is'} outside your organization ({orgDomain}).
                                    External members will have the same access as internal team members.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                <AlertDialogCancel
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={confirmExternalInvite}
                                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                                >
                                    Yes, Send Invites
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
};

export default UnifiedOrganizationOnboarding;