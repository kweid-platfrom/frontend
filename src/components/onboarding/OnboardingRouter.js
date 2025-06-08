// components/onboarding/OnboardingRouter.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Import onboarding step components
import OrganizationInfoForm from './OrganizationInfoForm';
import TeamInviteForm from './TeamInviteForm';
import ProjectCreationForm from './ProjectCreationForm';

const OnboardingRouter = () => {
    const { currentUser, userProfile, getUserProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const determineOnboardingStep = async () => {
            if (!currentUser) {
                navigate('/login');
                return;
            }

            // Check if email is verified
            if (!currentUser.emailVerified) {
                navigate('/verify-email');
                return;
            }

            // Get fresh user profile data
            const profile = userProfile || await getUserProfile(currentUser.uid);

            if (!profile) {
                // This shouldn't happen, but handle gracefully
                console.error('User profile not found');
                navigate('/login');
                return;
            }

            // Check if onboarding is already complete
            if (profile.onboardingStatus?.onboardingComplete) {
                navigate('/dashboard');
                return;
            }

            // Determine next onboarding step based on account type and progress
            const { accountType, onboardingStatus } = profile;

            if (accountType === 'organization') {
                if (!onboardingStatus.organizationInfoComplete) {
                    setCurrentStep('organization-info');
                } else if (!onboardingStatus.teamInvitesComplete) {
                    setCurrentStep('team-invites');
                } else if (!onboardingStatus.projectCreated) {
                    setCurrentStep('project-creation');
                } else {
                    // Mark onboarding as complete and redirect
                    await updateUserProfile(currentUser.uid, {
                        'onboardingStatus.onboardingComplete': true
                    });
                    navigate('/dashboard');
                }
            } else if (accountType === 'individual') {
                if (!onboardingStatus.projectCreated) {
                    setCurrentStep('project-creation');
                } else {
                    // Mark onboarding as complete and redirect
                    await updateUserProfile(currentUser.uid, {
                        'onboardingStatus.onboardingComplete': true
                    });
                    navigate('/dashboard');
                }
            } else {
                // No account type selected - this shouldn't happen post-verification
                // but handle gracefully
                console.error('No account type found for user');
                navigate('/setup');
            }

            setLoading(false);
        };

        determineOnboardingStep();
    }, [currentUser, userProfile, navigate, getUserProfile]);

    const handleStepComplete = (nextStep = null) => {
        if (nextStep) {
            setCurrentStep(nextStep);
        } else {
            // Onboarding complete, redirect to dashboard
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Setting up your account...</p>
                </div>
            </div>
        );
    }

    // Render appropriate onboarding step
    switch (currentStep) {
        case 'organization-info':
            return <OrganizationInfoForm onComplete={handleStepComplete} />;

        case 'team-invites':
            return <TeamInviteForm onComplete={handleStepComplete} />;

        case 'project-creation':
            return <ProjectCreationForm onComplete={handleStepComplete} />;

        default:
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-600">Redirecting...</p>
                    </div>
                </div>
            );
    }
};

export default OnboardingRouter;