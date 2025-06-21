import React, { useState, useEffect } from 'react';
import { User, Mail, Building, CheckCircle, Loader2, AlertCircle, Users, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import { inviteUserService } from '../services/InviteUserService';

const WelcomeOnboardingPage = ({ 
    onComplete, 
    inviteData = null,
    isLoading: externalLoading = false 
}) => {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingInvite, setIsLoadingInvite] = useState(false);
    const [error, setError] = useState(null);
    const [processedInviteData, setProcessedInviteData] = useState(null);
    const [componentReady, setComponentReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [userDetails, setUserDetails] = useState({
        name: '',
        displayName: '',
        department: '',
        phoneNumber: '',
        preferredNotifications: 'email'
    });

    // Function to get URL parameters
    const getUrlParams = () => {
        if (typeof window === 'undefined') return {};
        const params = new URLSearchParams(window.location.search);
        return {
            token: params.get('token'),
            orgId: params.get('orgId'),
            email: params.get('email')
        };
    };

    // Initialize form and handle URL parameters
    useEffect(() => {
        const initializeComponent = async () => {
            setIsLoadingInvite(true);
            
            let finalInviteData = inviteData;

            // If no inviteData provided, check for URL parameters
            if (!finalInviteData) {
                const urlParams = getUrlParams();
                
                if (urlParams.token) {
                    console.log('Processing invite from URL params:', urlParams);
                    
                    try {
                        // Fetch invitation data using the token
                        const invitation = await inviteUserService.findInvitationByToken(urlParams.token);
                        
                        if (!invitation) {
                            throw new Error('Invalid or expired invitation');
                        }

                        // Check if invitation is expired
                        const expiryDate = invitation.expiresAt?.toDate ? 
                            invitation.expiresAt.toDate() : 
                            new Date(invitation.expiresAt);
                        
                        if (expiryDate < new Date()) {
                            throw new Error('This invitation has expired');
                        }

                        // Check if invitation is still pending
                        if (invitation.status !== 'pending') {
                            throw new Error('This invitation has already been used');
                        }

                        finalInviteData = invitation;
                        setProcessedInviteData(invitation);
                        
                        // Store in localStorage for future reference
                        localStorage.setItem('pending_invite_data', JSON.stringify(invitation));
                        
                    } catch (err) {
                        console.error('Error processing invite from URL:', err);
                        setError(err.message);
                        setIsLoadingInvite(false);
                        return;
                    }
                }
                
                // If still no invite data, check localStorage
                if (!finalInviteData) {
                    const storedInvite = localStorage.getItem('pending_invite_data');
                    if (storedInvite) {
                        try {
                            finalInviteData = JSON.parse(storedInvite);
                            setProcessedInviteData(finalInviteData);
                        } catch (err) {
                            console.error('Error parsing stored invite data:', err);
                        }
                    }
                }
            }

            // Initialize form with invite data
            if (finalInviteData) {
                setUserDetails(prev => ({
                    ...prev,
                    name: finalInviteData.email?.split('@')[0] || '',
                    displayName: finalInviteData.email?.split('@')[0] || ''
                }));
            }

            setIsLoadingInvite(false);
            setComponentReady(true);
        };

        initializeComponent();
    }, [inviteData]);

    const handleInputChange = (field, value) => {
        setUserDetails(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateStep1 = () => {
        if (!userDetails.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!userDetails.displayName.trim()) {
            setError('Display name is required');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
                setError(null);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
        }
    };

    const handleComplete = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const currentInviteData = processedInviteData || inviteData;
            
            if (!currentInviteData?.token) {
                throw new Error('Invalid invitation data');
            }

            // Accept the invitation with user details
            const result = await inviteUserService.acceptInvitation(currentInviteData.token, {
                userName: userDetails.name,
                displayName: userDetails.displayName,
                department: userDetails.department,
                phoneNumber: userDetails.phoneNumber,
                preferredNotifications: userDetails.preferredNotifications,
                projectIds: currentInviteData.projects?.map(p => p.id) || currentInviteData.projectIds || [],
                onboardingCompleted: true,
                onboardingCompletedAt: new Date().toISOString()
            });

            if (result.success) {
                // Clean up stored invite data
                localStorage.removeItem('pending_invite_data');
                
                // Clean up URL parameters
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location);
                    url.searchParams.delete('token');
                    url.searchParams.delete('orgId');
                    url.searchParams.delete('email');
                    window.history.replaceState({}, '', url);
                }
                
                // Set completion state
                setIsCompleted(true);
                
                // Call completion callback after a delay
                setTimeout(() => {
                    if (onComplete) {
                        onComplete(result);
                    }
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to complete onboarding');
            }
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Failed to complete setup. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Show loading state during initialization
    if ((isLoadingInvite || externalLoading) || !componentReady) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Processing invitation...</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please wait while we validate your invitation...
                    </p>
                </div>
            </div>
        );
    }

    // Show completion state
    if (isCompleted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-xs text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Welcome Aboard!
                    </h1>
                    <p className="text-gray-600 mb-4">
                        You&apos;re now part of {(processedInviteData || inviteData)?.organizationName}. 
                        Welcome to the team!
                    </p>
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-green-700">
                            You now have access to the dashboard and all assigned projects.
                        </p>
                    </div>
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const currentInviteData = processedInviteData || inviteData;

    // Render the main onboarding page
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Welcome to the Team!
                    </h1>
                    <p className="text-gray-600">
                        Complete your profile to get started - Step {step} of 2
                    </p>
                </div>

                {/* Organization Info Card */}
                <div className="bg-teal-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-teal-600" />
                        <div>
                            <h3 className="font-medium text-teal-900">
                                {currentInviteData?.organizationName || 'Organization'}
                            </h3>
                            <p className="text-sm text-teal-700">
                                Invited by {currentInviteData?.inviterName || 'Admin'} as {currentInviteData?.role || 'Member'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={userDetails.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                        placeholder="Enter your full name"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={userDetails.displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                        placeholder="How should others see your name?"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={currentInviteData?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Additional Information
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Help us personalize your experience (optional)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={userDetails.department}
                                        onChange={(e) => handleInputChange('department', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                        placeholder="e.g., Engineering, QA, Marketing"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={userDetails.phoneNumber}
                                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notification Preferences
                                </label>
                                <select
                                    value={userDetails.preferredNotifications}
                                    onChange={(e) => handleInputChange('preferredNotifications', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                                >
                                    <option value="email">Email only</option>
                                    <option value="email+sms">Email + SMS</option>
                                    <option value="minimal">Minimal notifications</option>
                                </select>
                            </div>

                            {/* Project Access Preview */}
                            {currentInviteData?.projects && currentInviteData.projects.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        <h4 className="font-medium text-blue-900">Project Access</h4>
                                    </div>
                                    <div className="space-y-1">
                                        {currentInviteData.projects.map((project, index) => (
                                            <div key={index} className="text-sm text-blue-700">
                                                • {project.name || `Project ${index + 1}`}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || isProcessing}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                        
                        <button
                            onClick={step === 1 ? handleNext : handleComplete}
                            disabled={isProcessing || (step === 1 && (!userDetails.name.trim() || !userDetails.displayName.trim()))}
                            className="flex items-center space-x-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{step === 1 ? 'Next' : 'Complete Setup'}</span>
                            {step === 1 && !isProcessing && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeOnboardingPage;