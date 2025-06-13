'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import '../../app/globals.css'
// Import utility functions
import {
    normalizeOnboardingProgress,
    isOnboardingComplete,
    createStepUpdateData,
    logStepCompletion,
    getStepDisplayName
} from '../../utils/onboardingUtils';

// Import onboarding step components - ONLY what we need
import ProjectCreationForm from './ProjectCreationForm';
import UnifiedOrganizationOnboarding from '../onboarding/OrganizationInfo';

const OnboardingRouter = () => {
    const { currentUser, userProfile, refreshUserData, completeUserSetup, initialized } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);
    const [error, setError] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();
    const processingRef = useRef(false);
    const stepCompletionRef = useRef(null);
    // Add a ref to track if we're completing unified onboarding
    const unifiedCompletionRef = useRef(false);

    useEffect(() => {
        const determineOnboardingStep = async () => {
            // Prevent multiple simultaneous executions
            if (processingRef.current || unifiedCompletionRef.current) {
                console.log('OnboardingRouter - Already processing or completing unified onboarding, skipping...');
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

                // Check if onboarding is already complete using utility function
                if (isOnboardingComplete(accountType, onboardingProgress, onboardingStatus)) {
                    console.log('OnboardingRouter - Onboarding already complete, redirecting to dashboard');
                    router.replace('/dashboard');
                    return;
                }

                // Determine next step for organization accounts
                if (accountType === 'organization') {
                    const normalizedProgress = normalizeOnboardingProgress(onboardingProgress);

                    console.log('OnboardingRouter - Checking organization progress:', {
                        normalizedProgress,
                        currentStepFromStatus: onboardingStatus.currentStep
                    });

                    // Check if organization setup is complete (both org info and team invites)
                    const orgSetupComplete = normalizedProgress.organizationInfo && 
                        (normalizedProgress.teamInvites || normalizedProgress.teamInvitesSkipped);

                    if (orgSetupComplete) {
                        console.log('OnboardingRouter - Organization setup complete, redirecting to dashboard');
                        router.replace('/dashboard');
                        return;
                    }

                    // If not complete, show unified organization onboarding
                    if (!normalizedProgress.organizationInfo) {
                        console.log('OnboardingRouter - Organization info not complete, using unified organization onboarding flow');
                        setCurrentStep('unified-organization');
                    } else if (!normalizedProgress.teamInvites && !normalizedProgress.teamInvitesSkipped) {
                        console.log('OnboardingRouter - Organization info complete but team invites pending, using unified organization onboarding flow');
                        setCurrentStep('unified-organization');
                    }
                } else if (accountType === 'individual') {
                    console.log('OnboardingRouter - Individual account, going to project creation');
                    setCurrentStep('project-creation');
                } else {
                    console.error('OnboardingRouter - No account type found');
                    setError('Account type not found. Please complete your account setup first.');
                    setTimeout(() => router.replace('/setup'), 2000);
                    return;
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
    

    // Handle unified onboarding completion
    const handleUnifiedOnboardingComplete = async (completionData) => {
        console.log('OnboardingRouter - Unified onboarding completed with:', completionData);

        // Set the completion flag to prevent useEffect from interfering
        unifiedCompletionRef.current = true;

        try {
            setIsTransitioning(true);
            setLoading(true);

            const orgStepData = createStepUpdateData('organization-info', {
                organizationId: completionData.organizationId,
                organizationName: completionData.organizationName,
                organizationData: completionData.organizationData
            }, userProfile?.accountType);

            const teamStepData = createStepUpdateData('team-invites', {
                invitedEmails: completionData.invitedEmails || [],
                skipped: completionData.teamInvitesSkipped || false,
                completed: true
            }, userProfile?.accountType);

            // Combine both step updates - mark onboarding as complete for organization accounts
            const combinedUpdateData = {
                ...orgStepData,
                ...teamStepData,
                // Mark onboarding as complete since we're skipping project creation step
                'onboardingStatus.onboardingComplete': true,
                'onboardingStatus.completedAt': new Date().toISOString(),
                'onboardingStatus.currentStep': 'complete',
                'setupCompleted': true,
                'setupStep': 'completed'
            };

            // If team invites were skipped, mark that explicitly
            if (completionData.teamInvitesSkipped) {
                combinedUpdateData['onboardingProgress.teamInvitesSkipped'] = true;
                combinedUpdateData['onboardingStatus.teamInvitesSkipped'] = true;
            }

            combinedUpdateData.updatedAt = new Date().toISOString();

            console.log('OnboardingRouter - Updating user with combined data:', combinedUpdateData);

            // Update user profile in Firestore
            await completeUserSetup(currentUser.uid, combinedUpdateData);

            // Refresh user data to get updated profile
            console.log('OnboardingRouter - Refreshing user data after unified completion...');
            const refreshSuccess = await refreshUserData();

            if (!refreshSuccess) {
                throw new Error('Failed to refresh user data after unified completion');
            }

            console.log('OnboardingRouter - Organization onboarding completed, redirecting to dashboard');
            
            // Redirect to dashboard
            router.replace('/dashboard');

        } catch (error) {
            console.error('OnboardingRouter - Error completing unified onboarding:', error);
            setError(`An error occurred while completing the organization setup: ${error.message}`);
        } finally {
            // Reset all states
            setIsTransitioning(false);
            setLoading(false);
            // Clear the completion flag after a brief delay to ensure state has settled
            setTimeout(() => {
                unifiedCompletionRef.current = false;
            }, 1000);
        }
    };


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

            // Use utility function to create update data with consistent step names
            const updateData = createStepUpdateData(currentStep, stepData, userProfile?.accountType);

            // Log step completion for debugging
            logStepCompletion(currentStep, stepData, userProfile?.accountType, currentUser.uid);

            console.log('OnboardingRouter - Updating user with data:', updateData);

            // Update user profile in Firestore
            await completeUserSetup(currentUser.uid, updateData);

            // Refresh user data to get updated profile
            console.log('OnboardingRouter - Refreshing user data after step completion...');
            const refreshSuccess = await refreshUserData();

            if (!refreshSuccess) {
                throw new Error('Failed to refresh user data after step completion');
            }

            // For individual accounts, redirect to dashboard after project creation
            if (currentStep === 'project-creation') {
                console.log('OnboardingRouter - Project creation completed, redirecting to dashboard');
                router.replace('/dashboard');
                return;
            }

            // Wait a moment for the refresh to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('OnboardingRouter - User data refreshed, checking next step...');

        } catch (error) {
            console.error('OnboardingRouter - Error completing onboarding step:', error);
            setError(`An error occurred while completing the ${getStepDisplayName(currentStep)} step: ${error.message}`);
            setIsTransitioning(false);
            setLoading(false);
            processingRef.current = false;
            stepCompletionRef.current = null;
        }
    };

    // Show loading state during transitions
    if (loading || !initialized || isTransitioning) {
        const getLoadingMessage = () => {
            if (isTransitioning) {
                switch (currentStep) {
                    case 'unified-organization':
                        return 'Setting up organization...';
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
                            Current step: {getStepDisplayName(currentStep)}
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
                            stepCompletionRef.current = null;
                            unifiedCompletionRef.current = false;
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

    // Render appropriate onboarding step
    const renderOnboardingStep = () => {
        const accountType = userProfile?.accountType;

        console.log('OnboardingRouter - Rendering step:', { accountType, currentStep });

        switch (currentStep) {
            case 'unified-organization':
                return (
                    <UnifiedOrganizationOnboarding
                        onComplete={handleUnifiedOnboardingComplete}
                        isLoading={isTransitioning}
                    />
                );

            case 'project-creation':
                // Only show for individual accounts now
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
                                Current step: {currentStep ? getStepDisplayName(currentStep) : 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">
                                Account type: {accountType || 'Unknown'}
                            </p>
                            <button
                                onClick={() => {
                                    setIsTransitioning(false);
                                    processingRef.current = false;
                                    stepCompletionRef.current = null;
                                    unifiedCompletionRef.current = false;
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
    };

    return renderOnboardingStep();
};

export default OnboardingRouter;