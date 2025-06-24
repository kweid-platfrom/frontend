'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useProject } from '../../context/ProjectContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';
import { createProject } from '../../services/projectService';
import { validateProjectName } from '../../utils/onboardingUtils';
import { PlusIcon } from '@heroicons/react/24/outline';

const ProjectCreationForm = ({
    onComplete,
    isLoading: externalLoading = false,
    userProfile: externalUserProfile = null
}) => {
    const { currentUser, userProfile: contextUserProfile, refreshUserData, isLoading: authLoading } = useAuth();

    // Use external userProfile if provided (for onboarding), otherwise use context
    const userProfile = externalUserProfile || contextUserProfile;
    const { refetchProjects } = useProject();
    const router = useRouter();
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [componentReady, setComponentReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Determine account type
    const isOrganizationAccount = userProfile?.accountType === 'organization' || userProfile?.organizationId;

    // Debug logging
    useEffect(() => {
        console.log('ProjectCreationForm Debug:', {
            isOrganizationAccount,
            userProfile: userProfile ? {
                accountType: userProfile.accountType,
                organizationId: userProfile.organizationId,
                subscriptionType: userProfile.subscriptionType
            } : null
        });
    }, [isOrganizationAccount, userProfile]);

    // Ensure component is ready and auth state is stable
    useEffect(() => {
        // Add a small delay to ensure auth state is stable
        const timer = setTimeout(() => {
            if (!authLoading && currentUser) {
                setComponentReady(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [authLoading, currentUser]);

    // Early return if auth is loading or user is not authenticated
    if ((authLoading || externalLoading) || !currentUser || !componentReady) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    // If project creation is completed, show success state
    if (isCompleted) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-xs text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Suite Created Successfully!
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {isOrganizationAccount
                            ? 'Redirecting to your organization dashboard...'
                            : 'Redirecting to your dashboard...'
                        }
                    </p>
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const completeOnboarding = async () => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const updateData = {
                'onboardingStatus.onboardingComplete': true,
                'onboardingStatus.projectCreated': true,
                'onboardingStatus.completedAt': serverTimestamp(),
                setupCompleted: true,
                setupStep: 'completed',
                updatedAt: serverTimestamp()
            };

            // Add organization-specific onboarding completion if applicable
            if (isOrganizationAccount) {
                updateData['onboardingStatus.organizationSetupComplete'] = true;
            }

            await updateDoc(userRef, updateData);

            console.log('Onboarding status updated in Firestore for', isOrganizationAccount ? 'organization' : 'individual', 'account');
            await refreshUserData();
            return true;
        } catch (error) {
            console.error('Error updating onboarding status:', error);
            return false;
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        setErrors({});

        const validation = validateProjectName(projectName);
        if (!validation.isValid) {
            setErrors({ projectName: validation.errors[0] });
            return;
        }

        setIsLoading(true);

        try {
            const result = await createProject(
                { name: projectName, description },
                currentUser.uid,
                userProfile?.organizationId
            );

            if (!result.success) {
                setErrors({ projectName: result.error });
                return;
            }

            console.log('Suite created successfully with ID:', result.projectId);

            // Mark as completed to prevent re-rendering
            setIsCompleted(true);

            // Store the new project ID for the dashboard
            localStorage.setItem('activeProjectId', result.projectId);

            // Complete onboarding in Firestore
            const onboardingCompleted = await completeOnboarding();

            if (!onboardingCompleted) {
                throw new Error('Failed to complete onboarding setup');
            }

            // Show success message
            const successMessage = isOrganizationAccount
                ? 'Suite created successfully! Welcome to your organization workspace!'
                : 'Suite created successfully! Welcome to QA Suite!';
            toast.success(successMessage);

            // Call the onComplete callback if provided
            if (typeof onComplete === 'function') {
                await onComplete(result.projectId);
            }

            // Refresh projects to include the new one
            if (refetchProjects) {
                await refetchProjects();
            }

            // Navigate to dashboard with a delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500); // 1.5 second delay to show success state

        } catch (error) {
            console.error('Error creating project:', error);
            setIsCompleted(false); // Reset completion state on error
            if (error.message.includes('Failed to complete onboarding')) {
                setErrors({ general: 'Suite created but failed to complete setup. Please try refreshing the page.' });
            } else {
                setErrors({ general: 'Failed to create suite. Please try again.' });
            }
            toast.error('Failed to create suite. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get plan information with better organization account handling
    const getPlanInfo = () => {
        const subscription = userProfile?.subscriptionType;
        const isTrial = subscription === 'trial';
        const isFree = subscription === 'free';
        const isUpgraded = !isTrial && !isFree;

        let planType = 'Free';
        let limit = 'Limited access';
        let showWarning = false;

        if (isTrial) {
            planType = 'Trial';
            limit = '30 days free trial - Full access';
            showWarning = true;
        } else if (isUpgraded) {
            planType = subscription;
            limit = 'Full access';
            showWarning = false;
        }

        return {
            type: planType,
            limit,
            showWarning
        };
    };


    const planInfo = getPlanInfo();

    // Render onboarding form (full screen only)
    return (
        <div className="bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-xs">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded flex items-center justify-center mx-auto mb-6">
                        <PlusIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {isOrganizationAccount
                            ? 'Create Another Test Suite'
                            : 'Add Another Test Suite'
                        }
                    </h1>
                    <p className="text-gray-600">
                        {isOrganizationAccount
                            ? 'Set up your organization workspace to start managing team test cases and QA activities'
                            : 'Set up your workspace to start managing test cases and QA activities'
                        }
                    </p>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Project name"
                            className={`w-full px-4 py-3 border rounded text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none transition-colors ${errors.projectName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            disabled={isLoading}
                            autoFocus
                        />
                        {errors.projectName && (
                            <p className="mt-2 text-sm text-red-600">{errors.projectName}</p>
                        )}
                    </div>

                    <div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none transition-colors resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {errors.general && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !projectName.trim()}
                        className="w-full bg-teal-600 text-white py-3 px-6 rounded font-medium hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-teal-200 border-t-white rounded animate-spin mr-2"></div>
                                Creating...
                            </div>
                        ) : (
                            'Create suite'
                        )}
                    </button>
                </form>

                {/* Plan info for onboarding */}
                {planInfo.showWarning && (
                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800 text-center">
                            {isOrganizationAccount ? 'Organization free Trial' : 'Free trial'}: {planInfo.limit}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectCreationForm;