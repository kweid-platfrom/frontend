// components/onboarding/OnboardingRouter.js
'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import onboarding step components
import OrganizationInfoForm from './OrganizationInfo';
import TeamInviteForm from './TeamInviteForm';
import ProjectCreationForm from './ProjectCreationForm';

const OnboardingRouter = () => {
    const { currentUser, userProfile, getUserProfile, updateUserProfile, initialized } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const determineOnboardingStep = async () => {
            try {
                setLoading(true);
                setError(null);

                // Wait for auth to be fully initialized
                if (!initialized) {
                    return;
                }

                if (!currentUser) {
                    console.log('No current user, redirecting to login');
                    router.push('/login');
                    return;
                }

                // Check if email is verified with a more robust approach
                const isEmailVerified = currentUser.emailVerified || 
                    (typeof window !== 'undefined' && 
                     localStorage.getItem('emailVerificationComplete') === 'true');

                if (!isEmailVerified) {
                    console.log('Email not verified, redirecting to verify-email');
                    router.push('/verify-email');
                    return;
                }

                // If we just verified the email, reload the user to get updated status
                if (!currentUser.emailVerified && localStorage.getItem('emailVerificationComplete') === 'true') {
                    console.log('Reloading user to get updated email verification status');
                    await currentUser.reload();
                }

                // Get fresh user profile data
                let profile = userProfile;
                
                if (!profile) {
                    console.log('No profile in context, fetching from database');
                    profile = await getUserProfile(currentUser.uid);
                }

                if (!profile) {
                    console.error('User profile not found');
                    setError('User profile not found. Please try logging in again.');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                    return;
                }

                console.log('User profile:', profile);

                // Check if onboarding is already complete
                if (profile.onboardingStatus?.onboardingComplete) {
                    console.log('Onboarding already complete, redirecting to dashboard');
                    router.push('/dashboard');
                    return;
                }

                // Determine next onboarding step based on account type and progress
                const { accountType, onboardingStatus = {} } = profile;

                console.log('Account type:', accountType);
                console.log('Onboarding status:', onboardingStatus);

                if (accountType === 'organization') {
                    if (!onboardingStatus.organizationInfoComplete) {
                        console.log('Setting step to organization-info');
                        setCurrentStep('organization-info');
                    } else if (!onboardingStatus.teamInvitesComplete) {
                        console.log('Setting step to team-invites');
                        setCurrentStep('team-invites');
                    } else if (!onboardingStatus.projectCreated) {
                        console.log('Setting step to project-creation');
                        setCurrentStep('project-creation');
                    } else {
                        // Mark onboarding as complete and redirect
                        console.log('All steps complete, marking onboarding as done');
                        await updateUserProfile(currentUser.uid, {
                            'onboardingStatus.onboardingComplete': true
                        });
                        router.push('/dashboard');
                        return;
                    }
                } else if (accountType === 'individual') {
                    if (!onboardingStatus.projectCreated) {
                        console.log('Setting step to project-creation for individual');
                        setCurrentStep('project-creation');
                    } else {
                        // Mark onboarding as complete and redirect
                        console.log('Individual onboarding complete, marking as done');
                        await updateUserProfile(currentUser.uid, {
                            'onboardingStatus.onboardingComplete': true
                        });
                        router.push('/dashboard');
                        return;
                    }
                } else {
                    // No account type selected - this shouldn't happen post-verification
                    console.error('No account type found for user:', profile);
                    setError('Account setup incomplete. Please complete your account setup.');
                    setTimeout(() => {
                        router.push('/setup');
                    }, 2000);
                    return;
                }

            } catch (error) {
                console.error('Error determining onboarding step:', error);
                setError(`An error occurred while setting up your account: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Only run after auth is initialized
        if (initialized) {
            // Add a small delay to ensure auth context is fully loaded
            const timer = setTimeout(() => {
                determineOnboardingStep();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [currentUser, userProfile, router, getUserProfile, updateUserProfile, initialized]);

    const handleStepComplete = async (nextStep = null) => {
        try {
            const { accountType } = userProfile;

            if (currentStep === 'organization-info') {
                // Mark organization info as complete and move to team invites
                await updateUserProfile(currentUser.uid, {
                    'onboardingStatus.organizationInfoComplete': true
                });
                console.log('Organization info completed, moving to team invites');
                setCurrentStep('team-invites');
                
            } else if (currentStep === 'team-invites') {
                // Mark team invites as complete and move to project creation
                await updateUserProfile(currentUser.uid, {
                    'onboardingStatus.teamInvitesComplete': true
                });
                console.log('Team invites completed, moving to project creation');
                setCurrentStep('project-creation');
                
            } else if (currentStep === 'project-creation') {
                // Mark project creation as complete
                await updateUserProfile(currentUser.uid, {
                    'onboardingStatus.projectCreated': true
                });
                
                if (accountType === 'individual') {
                    // For individual accounts, project creation completes onboarding
                    console.log('Individual project creation completed, marking onboarding as done');
                    await updateUserProfile(currentUser.uid, {
                        'onboardingStatus.onboardingComplete': true
                    });
                    router.push('/dashboard');
                } else if (accountType === 'organization') {
                    // For organization accounts, check if all steps are complete
                    console.log('Organization project creation completed, marking onboarding as done');
                    await updateUserProfile(currentUser.uid, {
                        'onboardingStatus.onboardingComplete': true
                    });
                    router.push('/dashboard');
                }
            } else if (nextStep) {
                // Handle any custom next step logic
                console.log('Moving to next step:', nextStep);
                setCurrentStep(nextStep);
            } else {
                // Fallback - mark onboarding as complete and redirect
                console.log('Onboarding complete, redirecting to dashboard');
                await updateUserProfile(currentUser.uid, {
                    'onboardingStatus.onboardingComplete': true
                });
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Error completing onboarding step:', error);
            setError(`An error occurred: ${error.message}`);
        }
    };

    // Handle team invite specific completion
    const handleTeamInviteComplete = async (invitedEmails = []) => {
        try {
            // Mark team invites as complete and store invited emails if any
            const updateData = {
                'onboardingStatus.teamInvitesComplete': true
            };
            
            if (invitedEmails.length > 0) {
                updateData['onboardingStatus.invitedEmails'] = invitedEmails;
            }
            
            await updateUserProfile(currentUser.uid, updateData);
            console.log('Team invites completed, moving to project creation');
            setCurrentStep('project-creation');
        } catch (error) {
            console.error('Error completing team invite step:', error);
            setError(`An error occurred: ${error.message}`);
        }
    };

    if (loading || !initialized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Setting up your account...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-medium">Setup Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mr-2"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Render appropriate onboarding step
    switch (currentStep) {
        case 'organization-info':
            return <OrganizationInfoForm onComplete={handleStepComplete} />;

        case 'team-invites':
            return (
                <TeamInviteForm 
                    onSendInvites={handleTeamInviteComplete}
                    onSkip={() => handleTeamInviteComplete([])}
                    userEmail={currentUser?.email}
                    isLoading={false}
                />
            );

        case 'project-creation':
            return <ProjectCreationForm onComplete={handleStepComplete} />;

        default:
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-600">Redirecting...</p>
                    </div>
                </div>
            );
    }
};

export default OnboardingRouter;