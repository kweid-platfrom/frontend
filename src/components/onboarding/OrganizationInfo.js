/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
// components/onboarding/UnifiedOrganizationOnboarding.js
import React, { useState } from 'react';
import { Building2, ArrowRight, Loader2, Users, Mail, Plus, X, CheckCircle } from 'lucide-react';
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
    const [currentStep, setCurrentStep] = useState(1); // 1: Org Info, 2: Team Invites, 3: Complete

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
            // Skip team invites and complete onboarding
            await completeOnboarding([], true);
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
        setLoading(true);
        try {
            console.log('Skipping team invites and completing onboarding...');
            await completeOnboarding([], true);
        } catch (error) {
            console.error('Error skipping team invites:', error);
            toast.error('Failed to skip team invites. Please try again.');
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

            // Complete onboarding with invited emails
            await completeOnboarding(inviteEmails, false);

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
            console.log('=== COMPLETING ORGANIZATION ONBOARDING ===');
            
            // Show completion step
            setCurrentStep(3);
            
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

            // Wait a moment to show the completion message
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (onComplete && typeof onComplete === 'function') {
                console.log('Calling onComplete callback...');
                await onComplete(completionData);
            } else {
                console.warn('onComplete callback is not provided or not a function');
            }

        } catch (error) {
            console.error('Error completing onboarding:', error);
            toast.error('Failed to complete onboarding. Please try again.');
            throw error;
        }
    };

    const isFormLoading = loading || parentLoading;
    const filledEmailsCount = emails.filter(email => email.trim()).length;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Progress indicator - Only show for steps 1 and 2 */}
                    {currentStep <= 2 && (
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
                    )}

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
                                        required
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
                                        required
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
                                        required
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
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        id="website"
                                        name="website"
                                        value={orgFormData.website}
                                        onChange={handleOrgInputChange}
                                        disabled={isFormLoading}
                                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="https://example.com"
                                    />
                                    {errors.website && (
                                        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={orgFormData.description}
                                        onChange={handleOrgInputChange}
                                        disabled={isFormLoading}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        placeholder="Tell us a bit about your organization..."
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isFormLoading}
                                        className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isFormLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="w-4 h-4" />
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
                                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-teal-600" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    Invite your team
                                </h1>
                                <p className="text-gray-600">
                                    Add team members to your organization (you can do this later from the dashboard)
                                </p>
                            </div>

                            <form onSubmit={handleTeamInvitesSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Team Member Email Addresses
                                    </label>
                                    
                                    {emails.map((email, index) => (
                                        <div key={index} className="flex items-center gap-2 mb-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                                disabled={isFormLoading}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-teal-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                placeholder="colleague@company.com"
                                            />
                                            {emails.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEmailField(index)}
                                                    disabled={isFormLoading}
                                                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleAddEmailField}
                                        disabled={isFormLoading}
                                        className="mt-2 flex items-center gap-2 text-teal-600 hover:text-teal-700 disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add another email
                                    </button>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <button
                                        type="button"
                                        onClick={handleSkipTeamInvites}
                                        disabled={isFormLoading}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                    >
                                        Skip for now
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        disabled={isFormLoading}
                                        className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isFormLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {filledEmailsCount > 0 ? 'Sending Invites...' : 'Completing Setup...'}
                                            </>
                                        ) : (
                                            <>
                                                {filledEmailsCount > 0 ? 'Send Invites' : 'Complete Setup'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Step 3: Completion */}
                    {currentStep === 3 && (
                        <div className="text-center py-8">
                            <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Organization setup complete!
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Your organization <strong>{orgFormData.companyName}</strong> has been successfully created.
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecting you to your dashboard where you can create your first project...
                            </p>
                            <div className="mt-6">
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog for External Emails */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>External Email Addresses Detected</AlertDialogTitle>
                        <AlertDialogDescription>
                            Some email addresses don&apos;t match your organization domain ({orgDomain}). 
                            Are you sure you want to invite these external users?
                            <div className="mt-2 text-sm">
                                {externalEmails.filter(email => !email.endsWith(`@${orgDomain}`)).map(email => (
                                    <div key={email} className="text-gray-700">• {email}</div>
                                ))}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExternalInvite}>
                            Send Invites
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UnifiedOrganizationOnboarding;