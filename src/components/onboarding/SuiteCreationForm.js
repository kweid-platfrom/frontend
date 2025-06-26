'use client'
import { useState, useEffect } from 'react';
import { useSuite } from '../../context/SuiteContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusIcon } from '@heroicons/react/24/outline';
import '../../app/globals.css'; 

const validateSuiteName = (name) => {
    const errors = [];
    if (!name || !name.trim()) {
        errors.push('Suite name is required');
    } else if (name.trim().length < 2) {
        errors.push('Suite name must be at least 2 characters');
    } else if (name.trim().length > 100) {
        errors.push('Suite name must be less than 100 characters');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};

const SuiteCreationForm = ({ onComplete }) => {
    const { 
        user,
        userProfile, 
        createTestSuite,
        canCreateSuite,
        subscriptionStatus,
        getFeatureLimits,
        isUserLoading,
        isSuitesLoading,
        suites,
        isLoading: suiteContextLoading
    } = useSuite();

    const router = useRouter();
    
    const [suiteName, setSuiteName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [componentReady, setComponentReady] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Determine account type using userProfile
    const isOrganizationAccount = userProfile?.accountType === 'organization';

    // Enhanced debug logging
    useEffect(() => {
        console.log('SuiteCreationForm Debug:', {
            // Loading states
            suiteContextLoading,
            isUserLoading,
            isSuitesLoading,
            componentReady,
            
            // User data
            user: !!user,
            userProfile: userProfile ? {
                accountType: userProfile.accountType,
                organizationId: userProfile.organizationId,
                subscriptionType: userProfile.subscriptionType,
                isTrialActive: userProfile.isTrialActive,
                trialDaysRemaining: userProfile.trialDaysRemaining,
                hasUsedTrial: userProfile.hasUsedTrial
            } : null,
            
            // Suite data
            suitesCount: suites?.length || 0,
            
            // Capability checks
            canCreateSuite,
            subscriptionStatus,
            
            // Feature limits
            featureLimits: getFeatureLimits(),
            
            // Organization info
            isOrganizationAccount
        });
    }, [
        suiteContextLoading, 
        isUserLoading, 
        isSuitesLoading,
        componentReady,
        user, 
        userProfile, 
        suites?.length,
        canCreateSuite, 
        subscriptionStatus, 
        isOrganizationAccount,
        getFeatureLimits
    ]);

    // Ensure component is ready and auth state is stable
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!suiteContextLoading && !isUserLoading && !isSuitesLoading && user && userProfile) {
                setComponentReady(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [suiteContextLoading, isUserLoading, isSuitesLoading, user, userProfile]);

    // Early return if loading or user is not authenticated
    if ((suiteContextLoading || isUserLoading || isSuitesLoading) || !user || !userProfile || !componentReady) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    // IMPORTANT: Only check canCreateSuite AFTER all loading is complete
    // This prevents the limit check from running on incomplete data
    if (!canCreateSuite && componentReady) {
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
                    <p className="text-sm text-gray-500 mb-6">
                        Current suites: {suites?.length || 0} / {limits?.testSuites || 1}
                    </p>
                    <div className="space-y-3">
                        {subscriptionStatus?.showUpgradePrompt && (
                            <button
                                onClick={() => router.push('/pricing')}
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                Upgrade Plan
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
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
                        Redirecting to your dashboard...
                    </p>
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const handleCreateSuite = async (e) => {
        e.preventDefault();

        setErrors({});

        // Validate suite name
        const validation = validateSuiteName(suiteName);
        if (!validation.isValid) {
            setErrors({ suiteName: validation.errors[0] });
            return;
        }

        // Double-check creation limits with enhanced debugging
        console.log('Pre-submission canCreateSuite check:', {
            canCreateSuite,
            suitesLength: suites?.length || 0,
            userProfile: userProfile ? {
                isTrialActive: userProfile.isTrialActive,
                subscriptionType: userProfile.subscriptionType,
                accountType: userProfile.accountType
            } : null,
            featureLimits: getFeatureLimits()
        });

        if (!canCreateSuite) {
            const limits = getFeatureLimits();
            const errorMessage = `Suite creation limit reached. You have ${suites?.length || 0} suite(s) out of ${limits?.testSuites || 1} allowed.`;
            console.error('Suite creation blocked:', errorMessage);
            
            setErrors({ 
                suiteName: errorMessage
            });
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
                admins: isOrganizationAccount ? [user.uid] : []
            };

            console.log('Creating suite with data:', suiteData);
            const newSuite = await createTestSuite(suiteData);
            
            console.log('Suite created successfully:', newSuite);

            // Mark as completed to prevent re-rendering
            setIsCompleted(true);

            // Show success message
            const successMessage = isOrganizationAccount
                ? 'Organization suite created successfully!'
                : 'Test suite created successfully!';
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

    // Render suite creation form
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PlusIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        {isOrganizationAccount
                            ? 'Create Organization Test Suite'
                            : 'Create New Test Suite'
                        }
                    </h1>
                    <p className="text-gray-600">
                        {isOrganizationAccount
                            ? 'Create a new test suite for your organization to manage team QA activities'
                            : 'Create a new test suite to organize your test cases and QA activities'
                        }
                    </p>
                </div>

                <form onSubmit={handleCreateSuite} className="space-y-6">
                    <div>
                        <label htmlFor="suiteName" className="block text-sm font-medium text-gray-700 mb-2">
                            Suite Name
                        </label>
                        <input
                            id="suiteName"
                            type="text"
                            value={suiteName}
                            onChange={(e) => setSuiteName(e.target.value)}
                            placeholder="Enter suite name"
                            className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-colors ${
                                errors.suiteName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            disabled={isLoading}
                            autoFocus
                        />
                        {errors.suiteName && (
                            <p className="mt-2 text-sm text-red-600">{errors.suiteName}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter suite description"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-colors resize-none"
                            disabled={isLoading}
                        />
                    </div>

                    {errors.general && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !suiteName.trim() || !canCreateSuite}
                            className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-teal-200 border-t-white rounded-full animate-spin mr-2"></div>
                                    Creating...
                                </div>
                            ) : (
                                'Create Suite'
                            )}
                        </button>
                    </div>
                </form>

                {/* Plan info and limits */}
                <div className="mt-6 space-y-3">
                    {planInfo.showWarning && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
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