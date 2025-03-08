"use client";
import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { useAlert } from '../../components/CustomAlert';

const PricingPage = () => {
    const { showAlert, alertComponent } = useAlert();

    const handleContactSales = () => {
        showAlert('Thanks for your interest!', 'Our sales team will contact you shortly.', 'success');
    };

    const pricingPlans = [
        {
            name: 'Basic',
            price: '$19',
            period: '/month',
            features: [
                '5 projects',
                '20GB storage',
                'Basic analytics',
                'Email support'
            ],
            recommended: false,
            buttonText: 'Get Started'
        },
        {
            name: 'Professional',
            price: '$49',
            period: '/month',
            features: [
                'Unlimited projects',
                '100GB storage',
                'Advanced analytics',
                'Priority support',
                'API access'
            ],
            recommended: true,
            buttonText: 'Get Started'
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            features: [
                'Unlimited everything',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantees',
                'Training sessions'
            ],
            recommended: false,
            buttonText: 'Contact Sales'
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. All plans include a 14-day free trial.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {pricingPlans.map((plan, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-8 shadow-sm transition-all hover:shadow-md ${plan.recommended ? 'border-blue-500 relative' : 'border-gray-200'
                                }`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Recommended
                                </div>
                            )}

                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-gray-500">{plan.period}</span>
                            </div>

                            <ul className="mb-8 space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={plan.name === 'Enterprise' ? handleContactSales : undefined}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${plan.recommended
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                    }`}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-medium mb-2">Can I change plans later?</h3>
                            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-medium mb-2">How does the free trial work?</h3>
                            <p className="text-gray-600">All plans include a 14-day free trial. No credit card required until you decide to continue.</p>
                        </div>
                        <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-lg font-medium mb-2">Do you offer discounts?</h3>
                            <p className="text-gray-600">We offer special discounts for educational institutions and non-profit organizations. <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link> for details.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            {alertComponent}
        </div>
    );
};

export default PricingPage;