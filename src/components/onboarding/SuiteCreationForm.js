'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useSuite } from '../../context/SuiteContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';
import { PlusIcon } from '@heroicons/react/24/outline';
import '../../app/globals.css'; 


const SuiteCreationForm = ({
    onComplete,
    isLoading: externalLoading = false,
    userProfile: externalUserProfile = null
}) => {
    const { currentUser, refreshUserData, isLoading: authLoading } = useAuth();
    
    // Use SuiteContext instead of mixed auth/suite logic
    const { 
        userProfile: contextUserProfile, 
        createTestSuite,
        canCreateSuite,
        subscriptionStatus,
        getFeatureLimits,
        isUserLoading,
        isLoading: suiteContextLoading
    } = useSuite();

    // Use external userProfile if provided (for onboarding), otherwise use context
    const userProfile = externalUserProfile || contextUserProfile;
    const router = useRouter();
    
    const [suiteName, setSuiteName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [componentReady, setComponentReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Determine account type using userProfile
    const isOrganizationAccount = userProfile?.accountType === 'organization';

    // Debug logging
    useEffect(() => {
        console.log('SuiteCreationForm Debug:', {
            isOrganizationAccount,
            canCreateSuite,
            subscriptionStatus,
            userProfile: userProfile ? {
                accountType: userProfile.accountType,
                organizationId: userProfile.organizationId,
                subscriptionType: userProfile.subscriptionType,
                isTrialActive: userProfile.isTrialActive
            } : null
        });
    }, [isOrganizationAccount, userProfile, canCreateSuite, subscriptionStatus]);

    // Ensure component is ready and auth state is stable
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!authLoading && !suiteContextLoading && !isUserLoading && currentUser && userProfile) {
                setComponentReady(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [authLoading, suiteContextLoading, isUserLoading, currentUser, userProfile]);

    // Early return if loading or user is not authenticated
    if ((authLoading || externalLoading || suiteContextLoading || isUserLoading) || !currentUser || !userProfile || !componentReady) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    // Check if user can create suite before showing form
    if (!canCreateSuite) {
        const limits = getFeatureLimits();
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Suite Creation Limit Reached
                    </h1>
                    <p className="text-gray-600 mb-4">
                        You&apos;ve reached the maximum number of test suites ({limits?.testSuites || 1}) for your current plan.
                    </p>
                    {subscriptionStatus?.showUpgradePrompt && (
                        <button
                            onClick={() => router.push('/pricing')}
                            className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Upgrade Plan
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // If suite creation is completed, show success state
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
                'onboardingStatus.suiteCreated': true,
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

    const handleCreateSuite = async (e) => {
        e.preventDefault();

        setErrors({});

        // Validate suite name
        const validation = validateSuiteName(suiteName);
        if (!validation.isValid) {
            setErrors({ suiteName: validation.errors[0] });
            return;
        }

        // Double-check creation limits
        if (!canCreateSuite) {
            setErrors({ suiteName: 'Suite creation limit reached for your current plan.' });
            return;
        }

        setIsLoading(true);

        try {
            // Use SuiteContext's createTestSuite method
            const suiteData = {
                name: suiteName,
                description: description.trim() || '',
                organizationId: isOrganizationAccount ? userProfile.organizationId : null,
                visibility: isOrganizationAccount ? 'organization' : 'private',
                tags: [],
                members: [],
                admins: isOrganizationAccount ? [currentUser.uid] : []
            };

            const newSuite = await createTestSuite(suiteData);
            
            console.log('Suite created successfully:', newSuite);

            // Mark as completed to prevent re-rendering
            setIsCompleted(true);

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
                await onComplete(newSuite.suite_id);
            }

            // Navigate to dashboard with a delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500); // 1.5 second delay to show success state

        } catch (error) {
            console.error('Error creating suite:', error);
            setIsCompleted(false); // Reset completion state on error
            
            // Handle specific error messages
            if (error.message.includes('Suite creation limit reached')) {
                setErrors({ suiteName: 'You have reached the maximum number of suites for your plan.' });
            } else if (error.message.includes('Failed to complete onboarding')) {
                setErrors({ general: 'Suite created but failed to complete setup. Please try refreshing the page.' });
            } else {
                setErrors({ general: 'Failed to create suite. Please try again.' });
            }
            
            toast.error('Failed to create suite. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get plan information using subscriptionStatus from context
    const getPlanInfo = () => {
        if (!subscriptionStatus) {
            return {
                type: 'Free',
                limit: 'Limited access',
                showWarning: false
            };
        }

        const { isTrial, subscriptionType, trialDaysRemaining, showTrialBanner, showUpgradePrompt } = subscriptionStatus;

        let planType = 'Free';
        let limit = 'Limited access';
        let showWarning = false;

        if (isTrial) {
            planType = 'Trial';
            limit = `${trialDaysRemaining} days remaining - Full access`;
            showWarning = showTrialBanner;
        } else if (subscriptionType !== 'free') {
            planType = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
            limit = 'Full access';
            showWarning = false;
        } else {
            showWarning = showUpgradePrompt;
        }

        return {
            type: planType,
            limit,
            showWarning,
            showUpgradePrompt: subscriptionStatus.showUpgradePrompt
        };
    };

    const planInfo = getPlanInfo();
    const limits = getFeatureLimits();

    // Render onboarding form
    return (
        <div className="bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-xs">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded flex items-center justify-center mx-auto mb-6">
                        <PlusIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {isOrganizationAccount
                            ? 'Create Organization Test Suite'
                            : 'Create Your First Test Suite'
                        }
                    </h1>
                    <p className="text-gray-600">
                        {isOrganizationAccount
                            ? 'Set up your organization workspace to start managing team test cases and QA activities'
                            : 'Set up your workspace to start managing test cases and QA activities'
                        }
                    </p>
                </div>

                <form onSubmit={handleCreateSuite} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={suiteName}
                            onChange={(e) => setSuiteName(e.target.value)}
                            placeholder="Suite name"
                            className={`w-full px-4 py-3 border rounded text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none transition-colors ${
                                errors.suiteName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                            disabled={isLoading}
                            autoFocus
                        />
                        {errors.suiteName && (
                            <p className="mt-2 text-sm text-red-600">{errors.suiteName}</p>
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
                        disabled={isLoading || !suiteName.trim() || !canCreateSuite}
                        className="w-full bg-teal-600 text-white py-3 px-6 rounded font-medium hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-teal-200 border-t-white rounded animate-spin mr-2"></div>
                                Creating...
                            </div>
                        ) : (
                            'Create Suite'
                        )}
                    </button>
                </form>

                {/* Plan info and limits */}
                <div className="mt-6 space-y-3">
                    {planInfo.showWarning && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-sm text-amber-800 text-center">
                                {planInfo.type}: {planInfo.limit}
                            </p>
                        </div>
                    )}

                    {limits && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 text-center">
                                Current plan allows {limits.testSuites} suite{limits.testSuites === 1 ? '' : 's'}, 
                                {' '}{limits.testCases} test cases per suite
                            </p>
                        </div>
                    )}

                    {planInfo.showUpgradePrompt && (
                        <div className="text-center">
                            <button
                                onClick={() => router.push('/pricing')}
                                className="text-sm text-teal-600 hover:text-teal-700 underline"
                            >
                                Upgrade for more features
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuiteCreationForm;