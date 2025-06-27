/* eslint-disable react-hooks/exhaustive-deps */
// components/modals/CreateTestSuiteModal.js
'use client'
import { useState, Fragment, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { useSuite } from '../../context/SuiteContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { accountService } from '../../services/accountService';
import { toast } from 'sonner';
import {
    XMarkIcon,
    BeakerIcon,
    DocumentTextIcon,
    BugAntIcon,
    ChartBarIcon,
    PlayIcon,
    SparklesIcon,
    ExclamationTriangleIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const CreateTestSuiteModal = ({ 
    isOpen, 
    onClose, 
    isFirstSuite = false,
    onSuccess 
}) => {
    const router = useRouter();
    const { user, userProfile, refetchProjects, setNeedsOnboarding } = useSuite();
    const [suiteName, setSuiteName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [capabilities, setCapabilities] = useState(null);
    const [projectLimits, setProjectLimits] = useState(null);

    const features = [
        {
            icon: DocumentTextIcon,
            title: 'Smart Test Case Creation',
            description: 'AI-powered test case generation with automated step creation'
        },
        {
            icon: BugAntIcon,
            title: 'Intelligent Bug Tracking',
            description: 'Screen recording integration with detailed context capture'
        },
        {
            icon: PlayIcon,
            title: 'Automated Test Execution',
            description: 'Generate and run Cypress scripts with real-time reporting'
        },
        {
            icon: ChartBarIcon,
            title: 'Advanced Analytics',
            description: 'Comprehensive QA metrics and performance insights'
        }
    ];

    // Check user capabilities and project limits when modal opens
    useEffect(() => {
        if (isOpen && user && userProfile) {
            checkUserCapabilities();
        }
    }, [isOpen, user, userProfile]);

    const checkUserCapabilities = async () => {
        try {
            // Get user capabilities from account service
            const userCapabilities = accountService.getUserCapabilities(userProfile);
            setCapabilities(userCapabilities);

            // Check project creation limits
            const projectCheck = await accountService.canCreateNewProject(userProfile);
            setProjectLimits(projectCheck);

            console.log('User capabilities:', userCapabilities);
            console.log('Project limits:', projectCheck);
        } catch (error) {
            console.error('Error checking user capabilities:', error);
            setError('Failed to check account capabilities. Please try again.');
        }
    };

    const handleCreateSuite = async (e) => {
        e.preventDefault();
        if (!suiteName.trim()) {
            setError('Test suite name is required');
            return;
        }

        // Check if user can create new projects (unless it's their first suite)
        if (!isFirstSuite && projectLimits && !projectLimits.canCreate) {
            const errorMsg = `You've reached your test suite limit (${projectLimits.maxAllowed}). ${
                capabilities?.isTrialActive 
                    ? 'Your trial includes multiple suites. Please contact support if you\'re seeing this message.' 
                    : 'Upgrade your plan to create more test suites.'
            }`;
            setError(errorMsg);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Determine organization context
            const currentOrgId = userProfile?.session_context?.current_org_id;
            const isOrgAccount = userProfile?.session_context?.current_account_type === 'organization';
            
            // Create test suite with proper Firestore structure
            const suiteData = {
                metadata: {
                    name: suiteName.trim(),
                    description: description.trim() || '',
                    created_by: user.uid,
                    created_date: serverTimestamp(),
                    updated_date: serverTimestamp(),
                    status: 'active',
                    // Add metadata for new architecture
                    account_type: isOrgAccount ? 'organization' : 'individual',
                    created_during_trial: capabilities?.isTrialActive || false
                },
                access_control: {
                    owner_id: currentOrgId || user.uid,
                    members: currentOrgId ? [] : [user.uid],
                    admins: currentOrgId ? [] : [user.uid],
                    visibility: 'private'
                },
                testing_assets: {
                    test_cases: {
                        count: 0,
                        last_updated: serverTimestamp()
                    },
                    bug_reports: {
                        count: 0,
                        last_updated: serverTimestamp()
                    },
                    recordings: {
                        count: 0,
                        last_updated: serverTimestamp()
                    },
                    automated_scripts: {
                        count: 0,
                        last_updated: serverTimestamp()
                    }
                },
                settings: {
                    default_assignee: user.uid,
                    test_case_prefix: 'TC',
                    bug_report_prefix: 'BUG',
                    enable_ai_generation: capabilities?.canUseAutomation || false,
                    enable_screen_recording: true,
                    automation_enabled: capabilities?.canUseAutomation || false
                },
                stats: {
                    total_test_cases: 0,
                    total_bug_reports: 0,
                    automated_tests: 0,
                    passed_tests: 0,
                    failed_tests: 0,
                    last_activity: serverTimestamp()
                }
            };

            // Create the test suite document properly
            let suiteRef;
            let suiteId;

            if (isOrgAccount) {
                // For organization accounts, create in organization's testSuites subcollection
                suiteRef = await addDoc(collection(db, 'organizations', currentOrgId, 'testSuites'), suiteData);
                suiteId = suiteRef.id;
            } else {
                // For individual accounts, create in user's testSuites subcollection  
                suiteRef = await addDoc(collection(db, 'individualAccounts', user.uid, 'testSuites'), suiteData);
                suiteId = suiteRef.id;
            }

            console.log('Test suite created with ID:', suiteId);

            // Update user's account memberships to include the new suite
            await updateUserTestSuites(suiteId, currentOrgId, isOrgAccount);

            // Show success notification
            toast.success('Test suite created successfully!', {
                description: `${suiteName} is ready for testing.`,
                duration: 3000,
            });

            // Refresh projects/suites list
            await refetchProjects();
            
            if (isFirstSuite) {
                setNeedsOnboarding(false);
                router.push('/dashboard');
            } else {
                onSuccess?.();
                onClose();
            }

            // Reset form
            setSuiteName('');
            setDescription('');
        } catch (error) {
            console.error('Error creating test suite:', error);
            let errorMessage = 'Failed to create test suite. ';
            
            // Handle specific Firebase errors
            if (error.code === 'permission-denied') {
                errorMessage += 'You don\'t have permission to create test suites in this location.';
            } else if (error.code === 'unauthenticated') {
                errorMessage += 'Please log in again to continue.';
            } else {
                errorMessage += 'Please try again or contact support if the problem persists.';
            }
            
            setError(errorMessage);
            toast.error('Creation failed', {
                description: errorMessage,
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserTestSuites = async (suiteId, orgId, isOrgAccount) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                console.error('User document not found');
                return;
            }

            const userData = userDoc.data();
            const updatedMemberships = [...(userData.account_memberships || [])];

            // Find the appropriate membership to update
            let membershipUpdated = false;

            for (let i = 0; i < updatedMemberships.length; i++) {
                const membership = updatedMemberships[i];
                
                // For organization accounts, update the org membership
                if (isOrgAccount && membership.org_id === orgId) {
                    if (!membership.accessible_test_suites) {
                        membership.accessible_test_suites = [];
                    }
                    membership.accessible_test_suites.push({
                        suite_id: suiteId,
                        role: 'Owner',
                        added_date: new Date()
                    });
                    membershipUpdated = true;
                    break;
                }
                // For individual accounts, update the individual membership
                else if (!isOrgAccount && membership.account_type === 'individual') {
                    if (!membership.owned_test_suites) {
                        membership.owned_test_suites = [];
                    }
                    membership.owned_test_suites.push({
                        suite_id: suiteId,
                        created_date: new Date()
                    });
                    membershipUpdated = true;
                    break;
                }
            }

            // If no appropriate membership was found, create one for individual accounts
            if (!membershipUpdated && !isOrgAccount) {
                const defaultSubscription = accountService.getUserCapabilities(userData);
                updatedMemberships.push({
                    account_type: 'individual',
                    subscription_plan: defaultSubscription.profile?.account_memberships?.[0]?.subscription_plan || 
                                     accountService.createFreemiumSubscription('individual'),
                    billing_info: {
                        payment_method: null,
                        billing_address: null,
                        next_billing_date: null
                    },
                    owned_test_suites: [{
                        suite_id: suiteId,
                        created_date: new Date()
                    }],
                    created_at: new Date()
                });
            }

            // Update the user document
            await updateDoc(userRef, {
                account_memberships: updatedMemberships,
                updated_at: new Date()
            });

            // If it's an organization account, also update the organization's member document
            if (isOrgAccount && orgId) {
                const orgMemberRef = doc(db, 'organizations', orgId, 'members', user.uid);
                await updateDoc(orgMemberRef, {
                    test_suite_access: arrayUnion({
                        suite_id: suiteId,
                        role: 'Owner',
                        added_date: new Date()
                    })
                });
            }

            console.log('User memberships updated successfully');
        } catch (error) {
            console.error('Error updating user test suites:', error);
            // Don't throw error here as the suite was already created successfully
        }
    };

    const handleClose = () => {
        if (!isLoading && !isFirstSuite) {
            setSuiteName('');
            setDescription('');
            setError('');
            onClose();
        }
    };

    const renderLimitWarning = () => {
        if (!projectLimits || isFirstSuite) return null;

        if (!projectLimits.canCreate) {
            return (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                        <LockClosedIcon className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium text-red-800">Suite Limit Reached</h4>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                        You&apos;ve used {projectLimits.currentCount} of {projectLimits.maxAllowed} test suites.
                        {capabilities?.isTrialActive 
                            ? ' Contact support if you need assistance.'
                            : ' Upgrade your plan to create more test suites.'
                        }
                    </p>
                </div>
            );
        }

        if (projectLimits.remaining <= 2) {
            return (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                        <h4 className="font-medium text-amber-800">Approaching Limit</h4>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                        {projectLimits.remaining} of {projectLimits.maxAllowed} test suites remaining.
                        {!capabilities?.isTrialActive && ' Consider upgrading for unlimited suites.'}
                    </p>
                </div>
            );
        }

        return null;
    };

    const renderSubscriptionInfo = () => {
        if (!capabilities) return null;

        const subscriptionInfo = accountService.getSubscriptionDisplayInfo(userProfile);

        return (
            <div className={`p-4 rounded-xl border ${
                subscriptionInfo.type === 'trial' ? 'bg-blue-50 border-blue-200' :
                subscriptionInfo.type === 'free' ? 'bg-gray-50 border-gray-200' :
                'bg-green-50 border-green-200'
            }`}>
                <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                        subscriptionInfo.type === 'trial' ? 'bg-blue-400' :
                        subscriptionInfo.type === 'free' ? 'bg-gray-400' :
                        'bg-green-400'
                    }`}></div>
                    <p className={`text-sm font-medium ${
                        subscriptionInfo.type === 'trial' ? 'text-blue-800' :
                        subscriptionInfo.type === 'free' ? 'text-gray-800' :
                        'text-green-800'
                    }`}>
                        {subscriptionInfo.status}: {subscriptionInfo.message}
                    </p>
                </div>
                <p className={`text-xs ${
                    subscriptionInfo.type === 'trial' ? 'text-blue-700' :
                    subscriptionInfo.type === 'free' ? 'text-gray-700' :
                    'text-green-700'
                }`}>
                    {subscriptionInfo.features} • Account Type: {capabilities.accountType?.charAt(0).toUpperCase() + capabilities.accountType?.slice(1)}
                </p>
            </div>
        );
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
                                                    // Check if feature is available based on capabilities
                                                    const isAvailable = capabilities ? (
                                                        feature.title.includes('AI') || feature.title.includes('Automated') 
                                                            ? capabilities.canUseAutomation
                                                            : feature.title.includes('Advanced')
                                                            ? capabilities.canAccessAdvancedReports
                                                            : true
                                                    ) : true;

                                                    return (
                                                        <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 ${
                                                            isAvailable 
                                                                ? 'bg-gradient-to-r from-teal-50 to-blue-50 border-teal-100 hover:border-teal-200'
                                                                : 'bg-gray-50 border-gray-200 opacity-60'
                                                        }`}>
                                                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                                                                isAvailable ? 'bg-teal-100' : 'bg-gray-200'
                                                            }`}>
                                                                <feature.icon className={`h-5 w-5 ${
                                                                    isAvailable ? 'text-teal-600' : 'text-gray-500'
                                                                }`} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="flex items-center space-x-2">
                                                                    <h4 className={`font-medium text-sm ${
                                                                        isAvailable ? 'text-gray-900' : 'text-gray-600'
                                                                    }`}>
                                                                        {feature.title}
                                                                    </h4>
                                                                    {!isAvailable && (
                                                                        <LockClosedIcon className="h-3 w-3 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <p className={`text-xs mt-1 ${
                                                                    isAvailable ? 'text-gray-600' : 'text-gray-500'
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
                                                        disabled={isLoading || (projectLimits && !projectLimits.canCreate && !isFirstSuite)}
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
                                                        disabled={isLoading || (projectLimits && !projectLimits.canCreate && !isFirstSuite)}
                                                    />
                                                </div>

                                                {error && (
                                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                        <p className="text-sm text-red-600">{error}</p>
                                                    </div>
                                                )}

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
                                                        disabled={isLoading || !suiteName.trim() || (projectLimits && !projectLimits.canCreate && !isFirstSuite)}
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