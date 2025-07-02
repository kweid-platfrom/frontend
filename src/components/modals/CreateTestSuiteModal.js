// components/modals/CreateTestSuiteModal.js
'use client'
import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { useSuite } from '../../context/SuiteContext';
import { useAuth } from '../../context/AuthProvider';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { toast } from 'sonner';
import {
    XMarkIcon,
    BeakerIcon,
    DocumentTextIcon,
    BugAntIcon,
    ChartBarIcon,
    PlayIcon,
    SparklesIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const CreateTestSuiteModal = ({
    isOpen,
    onClose,
    isFirstSuite = false,
    onSuccess
}) => {
    const router = useRouter();
    const { userProfile } = useAuth();
    const { createTestSuite } = useSuite();
    const { capabilities, loading: capabilitiesLoading } = useAccountCapabilities(userProfile?.uid);

    const [suiteName, setSuiteName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const features = [
        {
            icon: DocumentTextIcon,
            title: 'Smart Test Case Creation',
            description: 'AI-powered test case generation with automated step creation',
            capability: 'testCases'
        },
        {
            icon: BugAntIcon,
            title: 'Intelligent Bug Tracking',
            description: 'Screen recording integration with detailed context capture',
            capability: 'recordings'
        },
        {
            icon: PlayIcon,
            title: 'Automated Test Execution',
            description: 'Generate and run Cypress scripts with real-time reporting',
            capability: 'automatedScripts'
        },
        {
            icon: ChartBarIcon,
            title: 'Advanced Analytics',
            description: 'Comprehensive QA metrics and performance insights',
            capability: 'analytics'
        }
    ];

    // Get user's organization admin status
    const getUserOrgInfo = () => {
        if (!userProfile?.account_memberships) {
            return { isAdmin: false, orgId: null, orgName: null };
        }

        const adminMembership = userProfile.account_memberships.find(
            membership => membership.status === 'active' && membership.role === 'Admin'
        );

        if (adminMembership) {
            return {
                isAdmin: true,
                orgId: adminMembership.org_id,
                orgName: userProfile.organizationName || 'Your Organization'
            };
        }

        return { isAdmin: false, orgId: null, orgName: null };
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSuiteName('');
            setDescription('');
        }
    }, [isOpen]);

    const handleCreateSuite = async (e) => {
        e.preventDefault();

        if (!suiteName.trim()) {
            toast.error('Suite name required', {
                description: 'Please enter a name for your test suite.',
                duration: 3000,
            });
            return;
        }

        // Check if user can create suites using capabilities
        if (!isFirstSuite && capabilities && !capabilities.canCreateSuite) {
            toast.error('Suite limit reached', {
                description: capabilities.limits?.suites === 1
                    ? 'You can only create 1 test suite on your current plan.'
                    : `You've reached your test suite limit. Upgrade to create more.`,
                duration: 5000,
            });
            return;
        }

        setIsLoading(true);

        try {
            const orgInfo = getUserOrgInfo();

            const suiteData = {
                name: suiteName.trim(),
                description: description.trim() || '',
                tags: [],
                ownerType: orgInfo.isAdmin ? 'organization' : 'individual',
                ownerId: orgInfo.isAdmin ? orgInfo.orgId : userProfile.uid,
                createdBy: userProfile.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...(orgInfo.isAdmin && {
                    organizationId: orgInfo.orgId,
                    organizationName: orgInfo.orgName
                })
            };

            console.log('Creating suite with data:', suiteData);
            await createTestSuite(suiteData);

            toast.success('Test suite created successfully!', {
                description: `${suiteName} is ready for testing.`,
                duration: 3000,
            });

            // Reset form first
            setSuiteName('');
            setDescription('');

            // For first suite: close modal AND navigate
            if (isFirstSuite) {
                // Close modal first
                onClose();
                // Navigate to dashboard after brief delay to ensure modal closes
                setTimeout(() => {
                    router.push('/dashboard');
                }, 150);
            } else {
                // For additional suites: close modal and call success callback
                onClose();
                onSuccess?.();
            }

        } catch (error) {
            console.error('Error creating test suite:', error);

            let errorMessage = 'Failed to create test suite';
            let errorDescription = '';

            if (error.message.includes('Email verification required')) {
                errorDescription = 'Please verify your email address first.';
            } else if (error.message.includes('Suite creation limit reached')) {
                errorDescription = 'You\'ve reached your suite limit. Upgrade to create more.';
            } else if (error.message.includes('Only organization administrators can create')) {
                errorDescription = 'You need admin permissions to create organization test suites.';
            } else if (error.message.includes('permission-denied') || error.code === 'permission-denied') {
                errorDescription = 'You don\'t have permission to create test suites. Please check your account status.';
            } else if (error.message.includes('unauthenticated') || error.code === 'unauthenticated') {
                errorDescription = 'Please log in again to continue.';
            } else if (error.code === 'insufficient-permission') {
                errorDescription = 'Insufficient permissions. Please verify your account or contact support.';
            } else {
                errorDescription = error.message || 'Please try again or contact support.';
            }

            toast.error(errorMessage, {
                description: errorDescription,
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading && !isFirstSuite) {
            onClose();
        }
    };

    const renderLimitWarning = () => {
        if (isFirstSuite || capabilitiesLoading || !capabilities) return null;

        if (!capabilities.canCreateSuite) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                        <LockClosedIcon className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium text-red-800">Suite Limit Reached</h4>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                        {capabilities.limits?.suites === 1
                            ? 'You can only create 1 test suite on your current plan.'
                            : 'You\'ve reached your test suite limit. Upgrade to create more.'
                        }
                    </p>
                </div>
            );
        }

        return null;
    };

    const renderSubscriptionInfo = () => {
        if (capabilitiesLoading) {
            return (
                <div className="p-4 rounded-xl border bg-gray-50 border-gray-200 animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
            );
        }

        if (!capabilities) {
            return null;
        }

        const orgInfo = getUserOrgInfo();
        // FIXED: Safe access to subscription object with fallback defaults
        const subscription = capabilities.subscription || {
            isTrialActive: false,
            isPaid: false,
            displayName: 'Free Plan'
        };

        return (
            <div className={`p-4 rounded-xl border ${subscription.isTrialActive ? 'bg-blue-50 border-blue-200' :
                    subscription.isPaid ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${subscription.isTrialActive ? 'bg-blue-400' :
                            subscription.isPaid ? 'bg-green-400' :
                                'bg-gray-400'
                        }`}></div>
                    <p className={`text-sm font-medium ${subscription.isTrialActive ? 'text-blue-800' :
                            subscription.isPaid ? 'text-green-800' :
                                'text-gray-800'
                        }`}>
                        {subscription.displayName}
                    </p>
                </div>
                <p className={`text-xs ${subscription.isTrialActive ? 'text-blue-700' :
                        subscription.isPaid ? 'text-green-700' :
                            'text-gray-700'
                    }`}>
                    {capabilities.limits?.suites === -1 ? 'Unlimited' : capabilities.limits?.suites || 1} test suites included
                    {orgInfo.orgId && (
                        <span>
                            {' • '}
                            {orgInfo.isAdmin ? `Creating for: ${orgInfo.orgName} (Admin)` : `Individual suite`}
                        </span>
                    )}
                </p>
            </div>
        );
    };

    const isFeatureAvailable = (capability) => {
        if (!capabilities) return false;
        // FIXED: Safe access to subscription with fallback
        const subscription = capabilities.subscription || { isTrialActive: false };
        return capabilities.features?.[capability] || subscription.isTrialActive;
    };

    const canUserCreateSuite = () => {
        if (isFirstSuite) return true;
        return capabilities?.canCreateSuite || false;
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-teal-600 to-blue-600 px-8 py-6">
                                    {!isFirstSuite && (
                                        <button
                                            onClick={handleClose}
                                            disabled={isLoading}
                                            className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    )}

                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                            <BeakerIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <Dialog.Title className="text-2xl font-bold text-white">
                                            {isFirstSuite ? 'Welcome to QA Intelligence!' : 'Create New Test Suite'}
                                        </Dialog.Title>
                                    </div>

                                    <p className="text-teal-100 max-w-3xl">
                                        {isFirstSuite
                                            ? "Let's create your first test suite to get started. This will be your dedicated workspace for organizing test cases, tracking bugs, and managing your QA workflow."
                                            : "Set up a new test suite to organize your testing activities. You can perform functional, regression, integration, and performance testing all within the same suite."
                                        }
                                    </p>
                                </div>

                                <div className="p-8">
                                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                                        {/* Features Showcase */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <SparklesIcon className="h-5 w-5 text-teal-600" />
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Powerful QA features included:
                                                </h3>
                                            </div>

                                            <div className="grid gap-4">
                                                {features.map((feature, index) => {
                                                    const isAvailable = isFeatureAvailable(feature.capability);

                                                    return (
                                                        <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 ${isAvailable
                                                                ? 'bg-gradient-to-r from-teal-50 to-blue-50 border-teal-100 hover:border-teal-200'
                                                                : 'bg-gray-50 border-gray-200 opacity-60'
                                                            }`}>
                                                            <div className={`flex-shrink-0 p-2 rounded-lg ${isAvailable ? 'bg-teal-100' : 'bg-gray-200'
                                                                }`}>
                                                                <feature.icon className={`h-5 w-5 ${isAvailable ? 'text-teal-600' : 'text-gray-500'
                                                                    }`} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="flex items-center space-x-2">
                                                                    <h4 className={`font-medium text-sm ${isAvailable ? 'text-gray-900' : 'text-gray-600'
                                                                        }`}>
                                                                        {feature.title}
                                                                    </h4>
                                                                    {!isAvailable && (
                                                                        <LockClosedIcon className="h-3 w-3 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs mt-1 ${isAvailable ? 'text-gray-600' : 'text-gray-500'
                                                                    }`}>
                                                                    {feature.description}
                                                                    {!isAvailable && ' (Premium feature)'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Account Info */}
                                            {renderSubscriptionInfo()}
                                        </div>

                                        {/* Test Suite Creation Form */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                            {renderLimitWarning()}

                                            <form onSubmit={handleCreateSuite} className="space-y-6">
                                                <div>
                                                    <label htmlFor="suiteName" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Test Suite Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="suiteName"
                                                        value={suiteName}
                                                        onChange={(e) => setSuiteName(e.target.value)}
                                                        placeholder="e.g., E-commerce Application Testing"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                                        disabled={isLoading || (!canUserCreateSuite() && !isFirstSuite)}
                                                        autoFocus
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                        Description (Optional)
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder="Describe what this test suite will cover..."
                                                        rows={3}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors resize-none"
                                                        disabled={isLoading || (!canUserCreateSuite() && !isFirstSuite)}
                                                    />
                                                </div>

                                                <div className="flex space-x-3 pt-4">
                                                    {!isFirstSuite && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClose}
                                                            disabled={isLoading}
                                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        disabled={isLoading || !suiteName.trim() || (!canUserCreateSuite() && !isFirstSuite)}
                                                        className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-teal-700 hover:to-blue-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                                    >
                                                        {isLoading ? (
                                                            <div className="flex items-center justify-center">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                                Creating...
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center">
                                                                <BeakerIcon className="h-5 w-5 mr-2" />
                                                                {isFirstSuite ? 'Create First Test Suite' : 'Create Test Suite'}
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreateTestSuiteModal;