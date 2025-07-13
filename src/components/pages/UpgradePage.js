// pages/upgrade/UpgradePage.js
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuite } from '../../contexts/SuiteContext';
import {
    CheckIcon,
    XMarkIcon,
    SparklesIcon,
    RocketLaunchIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    UsersIcon,
    ChartBarIcon,
    CloudArrowUpIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

const UpgradePage = () => {
    const router = useRouter();
    const { userProfile } = useSuite();
    const [selectedPlan] = useState('pro');
    const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
    const [isLoading, setIsLoading] = useState(false);

    const plans = {
        free: {
            name: 'Free',
            price: { monthly: 0, yearly: 0 },
            description: 'Perfect for getting started',
            features: [
                '1 Suite',
                '50 Test Cases',
                '25 Bug Reports',
                'Basic Dashboard',
                'Email Support'
            ],
            limitations: [
                'No AI Generation',
                'No Screen Recording',
                'No Automation Scripts',
                'No Team Collaboration',
                'No Advanced Analytics'
            ],
            color: 'gray',
            popular: false
        },
        pro: {
            name: 'Pro',
            price: { monthly: 29, yearly: 290 },
            description: 'Best for professional QA teams',
            features: [
                'Unlimited Suites',
                'Unlimited Test Cases',
                'Unlimited Bug Reports',
                'AI-Powered Test Generation',
                'Screen Recording & Annotations',
                'Cypress Script Generation',
                'Advanced Dashboard & Analytics',
                'Team Collaboration',
                'Priority Support',
                'Custom Integrations'
            ],
            limitations: [],
            color: 'blue',
            popular: true
        },
        enterprise: {
            name: 'Enterprise',
            price: { monthly: 99, yearly: 990 },
            description: 'For large organizations with advanced needs',
            features: [
                'Everything in Pro',
                'Unlimited Team Members',
                'Advanced Security & Compliance',
                'Custom Workflows',
                'API Access',
                'Dedicated Account Manager',
                'Custom Training',
                'SLA Guarantee',
                'On-premise Deployment Option'
            ],
            limitations: [],
            color: 'purple',
            popular: false
        }
    };

    const handleUpgrade = async (planType) => {
        setIsLoading(true);
        try {
            // Simulate upgrade process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // In a real app, you'd integrate with Stripe or another payment processor
            console.log(`Upgrading to ${planType} plan with ${billingCycle} billing`);
            
            // Redirect to success page or dashboard
            router.push('/dashboard?upgraded=true');
        } catch (error) {
            console.error('Upgrade failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentPlan = userProfile?.subscriptionType || 'free';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 py-16 sm:py-24">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                            <RocketLaunchIcon className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                        Supercharge Your QA
                    </h1>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
                        Unlock powerful AI-driven testing, advanced analytics, and seamless team collaboration
                    </p>
                    <div className="flex justify-center">
                        <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white text-blue-600 shadow-lg'
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                                    billingCycle === 'yearly'
                                        ? 'bg-white text-blue-600 shadow-lg'
                                        : 'text-white hover:bg-white/10'
                                }`}
                            >
                                Yearly
                                <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded-full font-bold">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid md:grid-cols-3 gap-8">
                    {Object.entries(plans).map(([key, plan]) => (
                        <div
                            key={key}
                            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                                plan.popular
                                    ? 'border-blue-500 ring-4 ring-blue-500/20 scale-105'
                                    : currentPlan === key
                                    ? 'border-green-500 ring-4 ring-green-500/20'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                                        <SparklesIcon className="h-4 w-4" />
                                        <span>Most Popular</span>
                                    </div>
                                </div>
                            )}

                            {currentPlan === key && (
                                <div className="absolute -top-4 right-4">
                                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-1">
                                        <CheckIcon className="h-4 w-4" />
                                        <span>Current Plan</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-8">
                                {/* Plan Header */}
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-gray-600 mb-4">{plan.description}</p>
                                    <div className="flex items-baseline justify-center space-x-1">
                                        <span className="text-5xl font-bold text-gray-900">
                                            ${plan.price[billingCycle]}
                                        </span>
                                        <span className="text-gray-600">
                                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                                        </span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                                        <p className="text-sm text-green-600 font-medium mt-2">
                                            Save ${(plan.price.monthly * 12) - plan.price.yearly} annually
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="space-y-4 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                    
                                    {plan.limitations.map((limitation, index) => (
                                        <div key={index} className="flex items-center space-x-3 opacity-50">
                                            <XMarkIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-500 line-through">{limitation}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => key !== 'free' && handleUpgrade(key)}
                                    disabled={isLoading || currentPlan === key || key === 'free'}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                                        currentPlan === key
                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                            : key === 'free'
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {isLoading && selectedPlan === key ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </div>
                                    ) : currentPlan === key ? (
                                        'Current Plan'
                                    ) : key === 'free' ? (
                                        'Current Plan'
                                    ) : (
                                        `Upgrade to ${plan.name}`
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Teams Choose QA Suite Pro
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Discover the powerful features that make QA Suite the preferred choice for professional testing teams
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: LightBulbIcon,
                                title: 'AI-Powered Test Generation',
                                description: 'Generate comprehensive test cases automatically using advanced AI algorithms'
                            },
                            {
                                icon: CloudArrowUpIcon,
                                title: 'Screen Recording & Annotations',
                                description: 'Capture bugs with video evidence and detailed annotations for faster resolution'
                            },
                            {
                                icon: CpuChipIcon,
                                title: 'Cypress Script Generation',
                                description: 'Automatically generate automation scripts from your manual test cases'
                            },
                            {
                                icon: UsersIcon,
                                title: 'Team Collaboration',
                                description: 'Work together seamlessly with real-time updates and role-based permissions'
                            },
                            {
                                icon: ChartBarIcon,
                                title: 'Advanced Analytics',
                                description: 'Deep insights into test coverage, bug trends, and team performance'
                            },
                            {
                                icon: ShieldCheckIcon,
                                title: 'Enterprise Security',
                                description: 'Bank-level security with SOC2 compliance and data encryption'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="text-center p-6">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <feature.icon className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    
                    <div className="space-y-8">
                        {[
                            {
                                question: 'Can I change my plan at any time?',
                                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.'
                            },
                            {
                                question: 'What happens to my data if I cancel?',
                                answer: 'Your data remains accessible for 30 days after cancellation. You can export all your data or reactivate your subscription during this period.'
                            },
                            {
                                question: 'Do you offer discounts for annual billing?',
                                answer: 'Yes! Annual billing includes a 20% discount compared to monthly billing. You\'ll save significantly over the course of a year.'
                            },
                            {
                                question: 'Is there a free trial for paid plans?',
                                answer: 'We offer a 14-day free trial for all paid plans. No credit card required to start your trial.'
                            }
                        ].map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Supercharge Your QA Process?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of teams already using QA Suite to deliver better software faster
                    </p>
                     <button
                        onClick={() => handleUpgrade('pro')}
                        disabled={isLoading}
                        className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            'Upgrade to Pro'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradePage;