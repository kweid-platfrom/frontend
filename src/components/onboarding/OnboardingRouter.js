/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import onboarding step components
import OrganizationInfoForm from './OrganizationInfo';
import TeamInviteForm from './TeamInviteForm';
import ProjectCreationForm from './ProjectCreationForm';

const OnboardingRouter = () => {
    const { currentUser, userProfile, refreshUserData, completeUserSetup, initialized } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);
    const [error, setError] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();
    const processingRef = useRef(false);
    const stepCompletionRef = useRef(null);

    // Helper function to normalize onboarding progress field names
    const normalizeOnboardingProgress = (progress = {}) => {
        return {
            // Standard fields
            emailVerified: progress.emailVerified || false,
            profileSetup: progress.profileSetup || false,
            
            // Organization-specific fields (normalize different naming conventions)
            organizationInfo: progress.organizationInfo || progress.organizationInfoComplete || false,
            teamInvites: progress.teamInvites || progress.teamInvitesComplete || false,
            projectCreation: progress.projectCreation || progress.projectCreated || false,
            
            // Keep original fields for backward compatibility
            ...progress
        };
    };

    // Helper function to determine if all required steps are complete
    const isOnboardingComplete = (accountType, progress, status) => {
        if (status?.onboardingComplete) return true;
        
        const normalizedProgress = normalizeOnboardingProgress(progress);
        
        if (accountType === 'individual') {
            return normalizedProgress.projectCreation;
        } else if (accountType === 'organization') {
            return normalizedProgress.organizationInfo && 
                   normalizedProgress.teamInvites && 
                   normalizedProgress.projectCreation;
        }
        
        return false;
    };

    // Helper function to get the next onboarding step
    const getNextOnboardingStep = (accountType, progress) => {
        const normalizedProgress = normalizeOnboardingProgress(progress);
        
        if (accountType === 'individual') {
            if (!normalizedProgress.projectCreation) return 'project-creation';
            return null; // Complete
        } else if (accountType === 'organization') {
            if (!normalizedProgress.organizationInfo) return 'organization-info';
            if (!normalizedProgress.teamInvites) return 'team-invites';
            if (!normalizedProgress.projectCreation) return 'project-creation';
            return null; // Complete
        }
        
        return null;
    };

    useEffect(() => {
        const determineOnboardingStep = async () => {
            // Prevent multiple simultaneous executions
            if (processingRef.current) {
                console.log('OnboardingRouter - Already processing, skipping...');
                return;
            }

            try {
                processingRef.current = true;
                setLoading(true);
                setError(null);

                console.log('OnboardingRouter - Starting step determination', {
                    initialized,
                    hasCurrentUser: !!currentUser,
                    hasUserProfile: !!userProfile,
                    isTransitioning
                });

                // Wait for auth to be fully initialized
                if (!initialized) {
                    console.log('OnboardingRouter - Not initialized yet, waiting...');
                    return;
                }

                if (!currentUser) {
                    console.log('OnboardingRouter - No current user, redirecting to login');
                    router.replace('/login');
                    return;
                }

                // Check email verification
                const isEmailVerified = currentUser.emailVerified || 
                    (typeof window !== 'undefined' && 
                     localStorage.getItem('emailVerificationComplete') === 'true');

                if (!isEmailVerified) {
                    console.log('OnboardingRouter - Email not verified, redirecting to verify-email');
                    router.replace('/verify-email');
                    return;
                }

                // Clean up email verification flag
                if (typeof window !== 'undefined' && localStorage.getItem('emailVerificationComplete') === 'true') {
                    localStorage.removeItem('emailVerificationComplete');
                }

                // Get user profile
                let profile = userProfile;
                
                if (!profile) {
                    console.log('OnboardingRouter - No profile in context, refreshing user data');
                    const refreshSuccess = await refreshUserData();
                    if (!refreshSuccess) {
                        console.error('OnboardingRouter - Failed to refresh user data');
                        setError('Failed to load user profile. Please try again.');
                        return;
                    }
                    return; // Will re-run with updated profile
                }

                console.log('OnboardingRouter - User profile loaded:', {
                    accountType: profile.accountType,
                    setupCompleted: profile.setupCompleted,
                    onboardingProgress: profile.onboardingProgress,
                    onboardingStatus: profile.onboardingStatus
                });

                const { accountType, onboardingStatus = {}, onboardingProgress = {} } = profile;

                // Ensure we stay on the same URL (/onboarding) regardless of step
                if (window.location.pathname !== '/onboarding') {
                    console.log('OnboardingRouter - Redirecting to main onboarding URL');
                    router.replace('/onboarding');
                    return;
                }

                // Check if onboarding is already complete
                if (isOnboardingComplete(accountType, onboardingProgress, onboardingStatus)) {
                    console.log('OnboardingRouter - Onboarding already complete, redirecting to dashboard');
                    router.replace('/dashboard');
                    return;
                }

                // Determine next step
                const nextStep = getNextOnboardingStep(accountType, onboardingProgress);
                
                console.log('OnboardingRouter - Next step determined:', {
                    accountType,
                    nextStep,
                    currentStep,
                    isTransitioning,
                    normalizedProgress: normalizeOnboardingProgress(onboardingProgress)
                });

                if (!nextStep) {
                    if (!accountType) {
                        console.error('OnboardingRouter - No account type found');
                        setError('Account type not found. Please complete your account setup first.');
                        setTimeout(() => router.replace('/setup'), 2000);
                    } else {
                        console.log('OnboardingRouter - All steps complete, marking onboarding as finished');
                        // Mark as complete and redirect
                        await completeUserSetup(currentUser.uid, {
                            setupCompleted: true,
                            setupStep: 'completed',
                            'onboardingStatus.onboardingComplete': true,
                            'onboardingStatus.completedAt': new Date().toISOString()
                        });
                        router.replace('/dashboard');
                    }
                    return;
                }

                // Only update step if it's different and we're not transitioning
                if (nextStep !== currentStep && !isTransitioning) {
                    console.log('OnboardingRouter - Setting current step to:', nextStep);
                    setCurrentStep(nextStep);
                }

            } catch (error) {
                console.error('OnboardingRouter - Error determining onboarding step:', error);
                setError(`An error occurred while setting up your account: ${error.message}`);
            } finally {
                setLoading(false);
                processingRef.current = false;
            }
        };

        determineOnboardingStep();
    }, [currentUser, userProfile, router, refreshUserData, completeUserSetup, initialized, isTransitioning]);

    const handleStepComplete = async (stepData = null) => {
        // Create unique completion ID to prevent duplicate calls
        const completionId = Date.now();
        console.log('OnboardingRouter - handleStepComplete called:', { 
            currentStep, 
            stepData: stepData ? 'provided' : 'none',
            completionId
        });

        // Prevent multiple simultaneous step completions
        if (isTransitioning || processingRef.current) {
            console.log('OnboardingRouter - Step completion already in progress, ignoring...', completionId);
            return;
        }

        // Check if this completion was already processed
        if (stepCompletionRef.current === completionId) {
            console.log('OnboardingRouter - Duplicate completion detected, ignoring...', completionId);
            return;
        }

        try {
            stepCompletionRef.current = completionId;
            setIsTransitioning(true);
            setLoading(true);
            processingRef.current = true;

            const updateData = {
                updatedAt: new Date().toISOString()
            };
            let nextStep = null;

            switch (currentStep) {
                case 'organization-info':
                    console.log('OnboardingRouter - Completing organization-info step');
                    // Update both field naming conventions for compatibility
                    updateData['onboardingProgress.organizationInfo'] = true;
                    updateData['onboardingProgress.organizationInfoComplete'] = true;
                    updateData['onboardingStatus.currentStep'] = 'team_invites';
                    
                    if (stepData) {
                        console.log('OnboardingRouter - Storing organization data');
                        updateData.organizationData = stepData;
                        if (stepData.organizationId) {
                            updateData.organizationId = stepData.organizationId;
                        }
                    }
                    nextStep = 'team-invites';
                    break;

                case 'team-invites':
                    console.log('OnboardingRouter - Completing team-invites step');
                    // Update both field naming conventions for compatibility
                    updateData['onboardingProgress.teamInvites'] = true;
                    updateData['onboardingProgress.teamInvitesComplete'] = true;
                    updateData['onboardingStatus.currentStep'] = 'project_creation';
                    
                    if (stepData) {
                        updateData['onboardingStatus.invitedEmails'] = stepData.invitedEmails || [];
                        updateData['onboardingStatus.invitedAt'] = new Date().toISOString();
                    }
                    nextStep = 'project-creation';
                    break;

                case 'project-creation':
                    console.log('OnboardingRouter - Completing project-creation step');
                    // Update both field naming conventions for compatibility
                    updateData['onboardingProgress.projectCreation'] = true;
                    updateData['onboardingProgress.projectCreated'] = true;
                    updateData['onboardingStatus.onboardingComplete'] = true;
                    updateData['onboardingStatus.completedAt'] = new Date().toISOString();
                    updateData['onboardingStatus.currentStep'] = 'complete';
                    updateData['setupCompleted'] = true;
                    updateData['setupStep'] = 'completed';
                    
                    if (stepData) {
                        updateData.projectData = stepData;
                        if (stepData.projectId) {
                            updateData.defaultProjectId = stepData.projectId;
                        }
                    }
                    nextStep = null; // Complete
                    break;

                default:
                    console.warn('OnboardingRouter - Unknown step:', currentStep);
                    throw new Error(`Unknown onboarding step: ${currentStep}`);
            }

            console.log('OnboardingRouter - Updating user with data:', updateData);
            
            // Update user profile in Firestore
            await completeUserSetup(currentUser.uid, updateData);
            
            // Refresh user data to get updated profile
            console.log('OnboardingRouter - Refreshing user data...');
            await refreshUserData();

            if (nextStep) {
                console.log(`OnboardingRouter - ${currentStep} completed, moving to ${nextStep}`);
                // Set next step immediately to prevent reverting
                setCurrentStep(nextStep);
                
                // Small delay to ensure UI updates
                setTimeout(() => {
                    setIsTransitioning(false);
                    setLoading(false);
                    processingRef.current = false;
                }, 300);
            } else {
                console.log('OnboardingRouter - Onboarding completed, redirecting to dashboard');
                // Small delay to ensure state updates are processed
                setTimeout(() => {
                    router.replace('/dashboard');
                }, 500);
            }

        } catch (error) {
            console.error('OnboardingRouter - Error completing onboarding step:', error);
            setError(`An error occurred while completing the ${currentStep} step: ${error.message}`);
            setIsTransitioning(false);
            setLoading(false);
            processingRef.current = false;
        }
    };

    const handleTeamInvitesSent = async (invitedEmails = []) => {
        try {
            console.log('OnboardingRouter - handleTeamInvitesSent called with:', invitedEmails.length, 'emails');
            await handleStepComplete({ invitedEmails });
        } catch (error) {
            console.error('OnboardingRouter - Error handling team invites sent:', error);
            setError(`An error occurred while processing team invites: ${error.message}`);
        }
    };

    const handleTeamInvitesSkip = async () => {
        try {
            console.log('OnboardingRouter - handleTeamInvitesSkip called');
            await handleStepComplete({ invitedEmails: [], skipped: true });
        } catch (error) {
            console.error('OnboardingRouter - Error skipping team invites:', error);
            setError(`An error occurred while skipping team invites: ${error.message}`);
        }
    };

    // Show loading state during transitions
    if (loading || !initialized || isTransitioning) {
        const getLoadingMessage = () => {
            if (isTransitioning) {
                switch (currentStep) {
                    case 'organization-info':
                        return 'Creating organization...';
                    case 'team-invites':
                        return 'Processing team invites...';
                    case 'project-creation':
                        return 'Setting up your workspace...';
                    default:
                        return 'Processing...';
                }
            }
            return 'Setting up your account...';
        };

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">{getLoadingMessage()}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Please wait while we set up your account...
                    </p>
                    {currentStep && !isTransitioning && (
                        <p className="text-xs text-gray-400 mt-1">
                            Current step: {currentStep.replace('-', ' ')}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-medium">Setup Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => {
                            setError(null);
                            setIsTransitioning(false);
                            setLoading(true);
                            processingRef.current = false;
                            window.location.reload();
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors mr-2"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => router.replace('/login')}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Render appropriate onboarding step based on account type and current step
    const renderOnboardingStep = () => {
        const accountType = userProfile?.accountType;
        
        console.log('OnboardingRouter - Rendering step:', { accountType, currentStep });
        
        // Individual account flow
        if (accountType === 'individual') {
            return (
                <ProjectCreationForm 
                    onComplete={handleStepComplete}
                    accountType={accountType}
                    isLoading={isTransitioning}
                    userProfile={userProfile}
                />
            );
        }
        
        // Organization account flow
        if (accountType === 'organization') {
            switch (currentStep) {
                case 'organization-info':
                    return (
                        <OrganizationInfoForm 
                            onComplete={handleStepComplete}
                            isLoading={isTransitioning}
                            userProfile={userProfile}
                        />
                    );

                case 'team-invites':
                    return (
                        <TeamInviteForm 
                            onSendInvites={handleTeamInvitesSent}
                            onSkip={handleTeamInvitesSkip}
                            userEmail={currentUser?.email}
                            isLoading={isTransitioning}
                            userProfile={userProfile}
                        />
                    );

                case 'project-creation':
                    return (
                        <ProjectCreationForm 
                            onComplete={handleStepComplete}
                            accountType={accountType}
                            isLoading={isTransitioning}
                            userProfile={userProfile}
                        />
                    );

                default:
                    return (
                        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Preparing your account...</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Current step: {currentStep || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Account type: {accountType || 'Unknown'}
                                </p>
                                <button
                                    onClick={() => {
                                        setIsTransitioning(false);
                                        processingRef.current = false;
                                        window.location.reload();
                                    }}
                                    className="mt-4 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors"
                                >
                                    Refresh Page
                                </button>
                            </div>
                        </div>
                    );
            }
        }
        
        // Fallback for unknown account types
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                        <p className="font-medium">Account Setup Required</p>
                        <p className="text-sm">
                            Account type: {accountType || 'Not set'}<br/>
                            Please complete your account setup first.
                        </p>
                    </div>
                    <button
                        onClick={() => router.replace('/setup')}
                        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors mr-2"
                    >
                        Go to Account Setup
                    </button>
                    <button
                        onClick={() => {
                            setIsTransitioning(false);
                            processingRef.current = false;
                            window.location.reload();
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    };

    return renderOnboardingStep();
};

export default OnboardingRouter;