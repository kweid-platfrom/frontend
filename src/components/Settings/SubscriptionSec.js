// components/settings/SubscriptionSection.jsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function SubscriptionSection({ userData, orgData, isAdmin }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Determine if we're managing an organization subscription or individual
    const isOrgSubscription = Boolean(orgData && isAdmin);

    // Get current subscription info - org or individual
    const currentSubscription = isOrgSubscription
        ? orgData?.subscription
        : userData?.subscription;

    const [selectedPlan, setSelectedPlan] = useState(
        currentSubscription?.plan || 'free'
    );

    const [billingCycle, setBillingCycle] = useState(
        currentSubscription?.billingCycle || 'monthly'
    );

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: { monthly: 0, annually: 0 },
            features: ['5 projects', '2 team members', 'Basic analytics', '1GB storage']
        },
        {
            id: 'pro',
            name: 'Professional',
            price: { monthly: 29, annually: 290 },
            features: ['Unlimited projects', '10 team members', 'Advanced analytics', '15GB storage', 'Priority support']
        },
        {
            id: 'business',
            name: 'Business',
            price: { monthly: 99, annually: 990 },
            features: ['Unlimited projects', 'Unlimited team members', 'Premium analytics', '100GB storage', '24/7 support', 'Custom branding']
        }
    ];

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // If admin is updating org subscription
            if (isOrgSubscription) {
                await updateDoc(doc(db, 'organizations', userData.organizationId), {
                    'subscription.plan': selectedPlan,
                    'subscription.billingCycle': billingCycle,
                    'subscription.updatedAt': new Date()
                });
            } else {
                // Individual user subscription
                await updateDoc(doc(db, 'users', user.uid), {
                    'subscription.plan': selectedPlan,
                    'subscription.billingCycle': billingCycle,
                    'subscription.updatedAt': new Date()
                });
            }

            toast.success('Subscription updated successfully');
        } catch (error) {
            console.error('Error updating subscription:', error);
            toast.error('Failed to update subscription');
        } finally {
            setLoading(false);
        }
    };

    const getPrice = (plan) => {
        const planData = plans.find(p => p.id === plan);
        return planData ? planData.price[billingCycle] : 0;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-2">
                {isOrgSubscription ? 'Organization Subscription' : 'Your Subscription'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
                {isOrgSubscription
                    ? 'Manage your organization\'s subscription plan'
                    : 'Manage your personal subscription plan'}
            </p>

            <div className="space-y-6">
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                                    ? 'bg-white dark:bg-gray-600 shadow'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annually')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'annually'
                                    ? 'bg-white dark:bg-gray-600 shadow'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                                }`}
                        >
                            Annually <span className="text-green-500 text-xs">Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`border rounded-xl p-6 transition-all ${selectedPlan === plan.id
                                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                                    </div>
                                    {selectedPlan === plan.id && (
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium dark:bg-blue-900 dark:text-blue-200">
                                            Current
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold">${plan.price[billingCycle]}</span>
                                    {plan.price[billingCycle] > 0 && (
                                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-2 mb-6 flex-grow">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`w-full py-2 rounded-md font-medium transition-colors ${selectedPlan === plan.id
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h4 className="font-semibold">
                                {billingCycle === 'monthly' ? 'Monthly payment' : 'Annual payment'}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Next payment on {currentSubscription?.nextBillingDate ? new Date(currentSubscription.nextBillingDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div className="text-2xl font-bold mt-2 sm:mt-0">
                            ${getPrice(selectedPlan)}{billingCycle === 'monthly' ? '/mo' : '/yr'}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading || (selectedPlan === currentSubscription?.plan && billingCycle === currentSubscription?.billingCycle)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Updating...' : 'Update Subscription'}
                    </button>
                </div>
            </div>
        </div>
    );
}