// components/userProfile/tabs/SubscriptionTab.js
'use client'
import {
    StarIcon,
    CheckIcon,
    CalendarIcon,
    ExclamationTriangleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { useSubscription } from '../../../context/subscriptionContext';
import { useUserProfile } from '../../../context/userProfileContext';
import { useAuth } from '../../../context/AuthProvider';

const SubscriptionTab = () => {
    const { user } = useAuth();
    const { userProfile } = useUserProfile();
    const { subscriptionStatus, hasFeatureAccess, getFeatureLimits } = useSubscription();

    // Get subscription info based on actual subscription status
    const getSubscriptionInfo = () => {
        const { subscriptionType } = subscriptionStatus;
        
        const subscriptionData = {
            free: {
                name: 'Free Plan',
                color: 'bg-gray-100 text-gray-800',
                features: ['1 Test Suite', 'Basic Bug Tracking', 'Community Support', '25 Test Scripts'],
                price: 'Free forever',
                description: 'Perfect for getting started'
            },
            trial: {
                name: 'Trial Plan',
                color: 'bg-blue-100 text-blue-800',
                features: ['5 Test Suites', 'Advanced Reports', 'Team Collaboration', '1000 Test Scripts', 'Priority Support'],
                price: 'Free for 30 days',
                description: 'Full access to all premium features'
            },
            individual: {
                name: 'Individual Plan',
                color: 'bg-teal-100 text-teal-800',
                features: ['5 Test Suites', 'Advanced Features', 'Email Support', '1000 Test Scripts'],
                price: '$15/month',
                description: 'For individual professionals'
            },
            team: {
                name: 'Team Plan',
                color: 'bg-green-100 text-green-800',
                features: ['15 Test Suites', 'Team Collaboration', 'Priority Support', 'API Access'],
                price: '$29/month',
                description: 'For small teams'
            },
            premium: {
                name: 'Premium Plan',
                color: 'bg-purple-100 text-purple-800',
                features: ['Unlimited Test Suites', 'Advanced Analytics', '24/7 Support', 'Custom Integrations'],
                price: '$49/month',
                description: 'For growing businesses'
            },
            enterprise: {
                name: 'Enterprise Plan',
                color: 'bg-indigo-100 text-indigo-800',
                features: ['Unlimited Everything', 'Advanced Analytics', '24/7 Support', 'Custom Solutions'],
                price: '$99/month',
                description: 'For large organizations'
            }
        };

        return subscriptionData[subscriptionType] || subscriptionData.free;
    };

    const subscriptionInfo = getSubscriptionInfo();
    const limits = getFeatureLimits();

    // Trial Banner Component
    const TrialBanner = () => {
        if (!subscriptionStatus.isTrial) return null;

        const { trialDaysRemaining } = subscriptionStatus;
        const isExpiringSoon = trialDaysRemaining <= 7;

        return (
            <div className={`rounded-lg p-4 mb-6 ${isExpiringSoon ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center">
                    <ClockIcon className={`h-5 w-5 mr-3 ${isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`} />
                    <div>
                        <h3 className={`font-medium ${isExpiringSoon ? 'text-orange-800' : 'text-blue-800'}`}>
                            Trial Active - {trialDaysRemaining} days remaining
                        </h3>
                        <p className={`text-sm ${isExpiringSoon ? 'text-orange-600' : 'text-blue-600'}`}>
                            {isExpiringSoon 
                                ? 'Your trial is expiring soon. Upgrade to continue using premium features.'
                                : 'Enjoying your trial? Upgrade anytime to continue with premium features.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Upgrade Prompt Component
    const UpgradePrompt = () => {
        if (!subscriptionStatus.showUpgradePrompt) return null;

        return (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                        <h3 className="font-medium text-orange-800">Upgrade Required</h3>
                        <p className="text-sm text-orange-600">
                            Access premium features by upgrading your subscription.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const SubscriptionFeatures = ({ features }) => (
        <div>
            <h4 className="font-medium text-gray-900 mb-3">Features included:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const UpgradeButton = () => {
        const { subscriptionType, isTrial } = subscriptionStatus;
        
        if (subscriptionType === 'enterprise') return null;

        const getUpgradeText = () => {
            if (isTrial) return 'Continue with Premium';
            if (subscriptionType === 'free') return 'Start Free Trial';
            return 'Upgrade Plan';
        };

        return (
            <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200">
                    {getUpgradeText()}
                </button>
            </div>
        );
    };

    const BillingInfo = () => {
        if (subscriptionStatus.subscriptionType === 'free' || subscriptionStatus.isTrial) return null;

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-medium text-gray-900">Next billing date</h3>
                        <p className="text-sm text-gray-500">January 15, 2025</p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Auto-renewal enabled</span>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        Manage Billing
                    </button>
                    <button className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
                        Cancel Subscription
                    </button>
                </div>
            </div>
        );
    };

    const UsageStats = () => {
        // Mock data - replace with actual usage data from your backend
        const usageData = {
            activeProjects: 2,
            testCases: 47,
            openBugs: 12,
            testsRun: 156
        };

        return (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Usage Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">{usageData.activeProjects}</div>
                        <div className="text-sm text-gray-500">Active Projects</div>
                        {limits && (
                            <div className="text-xs text-gray-400">
                                of {limits.suites} allowed
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">{usageData.testCases}</div>
                        <div className="text-sm text-gray-500">Test Scripts</div>
                        {limits && (
                            <div className="text-xs text-gray-400">
                                of {limits.test_scripts} allowed
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{usageData.openBugs}</div>
                        <div className="text-sm text-gray-500">Open Bugs</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{usageData.testsRun}</div>
                        <div className="text-sm text-gray-500">Tests Run</div>
                    </div>
                </div>
            </div>
        );
    };

    const FeatureAccess = () => {
        const features = [
            { name: 'Multiple Test Suites', key: 'multipleSuites' },
            { name: 'Advanced Reports', key: 'advancedReports' },
            { name: 'Team Collaboration', key: 'teamCollaboration' },
            { name: 'API Access', key: 'apiAccess' },
            { name: 'Automation', key: 'automation' }
        ];

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Feature Access</h3>
                <div className="space-y-3">
                    {features.map((feature) => (
                        <div key={feature.key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{feature.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                hasFeatureAccess(feature.key)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {hasFeatureAccess(feature.key) ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Loading state
    if (!user || !userProfile || !subscriptionStatus) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="h-32 bg-gray-200 rounded mb-6"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Details</h2>
            <p className="text-sm text-gray-600 mb-6">View and manage your subscription</p>

            <TrialBanner />
            <UpgradePrompt />

            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {subscriptionInfo.name}
                        </h3>
                        <p className="text-gray-600 mt-1">
                            {subscriptionInfo.price}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {subscriptionInfo.description}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${subscriptionInfo.color}`}>
                            <StarIcon className="h-4 w-4 mr-1" />
                            Current Plan
                        </span>
                        {subscriptionStatus.isTrial && (
                            <div className="mt-2 text-xs text-blue-600">
                                Trial expires in {subscriptionStatus.trialDaysRemaining} days
                            </div>
                        )}
                    </div>
                </div>

                <SubscriptionFeatures features={subscriptionInfo.features} />

                {(subscriptionStatus.subscriptionType === 'free' || subscriptionStatus.isTrial) && <UpgradeButton />}
            </div>

            <FeatureAccess />
            <BillingInfo />
            <UsageStats />
        </div>
    );
};

export default SubscriptionTab;