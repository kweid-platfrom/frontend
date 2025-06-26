// components/userProfile/tabs/SubscriptionTab.js
'use client'
import {
    StarIcon,
    CheckIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

const SubscriptionTab = ({ userProfile }) => {
    const getSubscriptionInfo = () => {
        const { subscriptionType } = userProfile || {};
        const subscriptionData = {
            free: {
                name: 'Free Plan',
                color: 'bg-gray-100 text-gray-800',
                features: ['1 Project', 'Basic Bug Tracking', 'Community Support'],
                price: 'Free forever'
            },
            individual: {
                name: 'Individual Plan',
                color: 'bg-teal-100 text-teal-800',
                features: ['1 Project', 'Advanced Features', 'Email Support'],
                price: '$15/month'
            },
            team: {
                name: 'Team Plan',
                color: 'bg-green-100 text-green-800',
                features: ['5 Projects', 'Team Collaboration', 'Priority Support'],
                price: '$29/month'
            },
            enterprise: {
                name: 'Enterprise Plan',
                color: 'bg-purple-100 text-purple-800',
                features: ['Unlimited Projects', 'Advanced Analytics', '24/7 Support'],
                price: '$99/month'
            }
        };
        return subscriptionData[subscriptionType] || subscriptionData.free;
    };

    const subscriptionInfo = getSubscriptionInfo();

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

    const UpgradeButton = () => (
        <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200">
                Upgrade to Team Plan
            </button>
        </div>
    );

    const BillingInfo = () => (
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

    const UsageStats = () => (
        <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">2</div>
                    <div className="text-sm text-gray-500">Active Projects</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">47</div>
                    <div className="text-sm text-gray-500">Test Cases</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-gray-500">Open Bugs</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-sm text-gray-500">Tests Run</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Details</h2>
            <p className="text-sm text-gray-600 mb-6">View and manage your subscription</p>

            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {subscriptionInfo.name}
                        </h3>
                        <p className="text-gray-600 mt-1">
                            {subscriptionInfo.price}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${subscriptionInfo.color}`}>
                            <StarIcon className="h-4 w-4 mr-1" />
                            Current Plan
                        </span>
                    </div>
                </div>

                <SubscriptionFeatures features={subscriptionInfo.features} />

                {userProfile.subscriptionType === 'free' && <UpgradeButton />}
            </div>

            {userProfile.subscriptionType !== 'free' && <BillingInfo />}

            <UsageStats />
        </div>
    );
};

export default SubscriptionTab;