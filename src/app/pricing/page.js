"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../app/globals.css";
import { useAlert } from "../../components/CustomAlert";

const PricingPage = () => {
    const router = useRouter();
    const { alertComponent } = useAlert();
    const [billingCycle, setBillingCycle] = useState("monthly");

    const navigateToCheckout = (plan) => {
        router.push({
            pathname: "/checkout",
            query: {
                planName: plan.name,
                planPrice: plan.price[billingCycle],
                billingCycle: billingCycle,
                // Add other relevant plan details here  
            },
        });
    };

    const handleContactSales = (plan) => {
        router.push({
            pathname: "/contact-sales",
            query: {
                planName: plan.name,
                // Add other relevant plan details here  
            },
        });
    };

    const pricingPlans = [
        {
            name: "Basic",
            price: { monthly: "$19", yearly: "$190" },
            features: ["5 projects", "20GB storage", "Basic analytics", "Email support"],
            recommended: false,
        },
        {
            name: "Professional",
            price: { monthly: "$49", yearly: "$490" },
            features: [
                "Unlimited projects",
                "100GB storage",
                "Advanced analytics",
                "Priority support",
                "API access",
            ],
            recommended: true,
        },
        {
            name: "Enterprise",
            price: { monthly: "Custom", yearly: "Custom" },
            features: [
                "Unlimited everything",
                "Dedicated support",
                "Custom integrations",
                "SLA guarantees",
                "Training sessions",
            ],
            recommended: false,
        },
    ];

    const testimonials = [
        {
            name: "Alice Johnson",
            feedback: "This service transformed the way we manage our projects!",
            company: "TechCorp",
        },
        {
            name: "John Smith",
            feedback: "Incredible value for the price. Highly recommend!",
            company: "Startup Inc.",
        },
    ];

    const handleBillingCycleChange = (cycle) => {
        // REMOVED: Alert on billing cycle change  
        // showAlert(`Billing cycle changed to ${cycle}`, "info");  
        setBillingCycle(cycle);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. All plans include a 14-day free trial.
                    </p>
                    {/* Toggle Button */}
                    <div className="mt-6 inline-flex bg-gray-200 rounded-full p-1">
                        <button
                            className={`px-4 py-2 rounded-full font-medium transition-colors duration-300 text-sm md:text-base  
                                ${billingCycle === "monthly"
                                    ? "bg-[#00897B] text-white shadow-md"
                                    : "text-gray-700 hover:bg-gray-300"
                                }`}
                            onClick={() => handleBillingCycleChange("monthly")} // Use handleBillingCycleChange  
                        >
                            Monthly
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full font-medium transition-colors duration-300 text-sm md:text-base  
                                ${billingCycle === "yearly"
                                    ? "bg-[#00897B] text-white shadow-md"
                                    : "text-gray-700 hover:bg-gray-300"
                                }`}
                            onClick={() => handleBillingCycleChange("yearly")} // Use handleBillingCycleChange  
                        >
                            Yearly (Save 20%)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`border rounded-lg p-8 shadow-sm transition-all hover:shadow-md ${plan.recommended ? "border-[#00897B] relative" : "border-gray-200"
                                }`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#00897B] text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Recommended
                                </div>
                            )}
                            <h3 className="text-xl md:text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                <span className="text-3xl md:text-4xl font-bold">{plan.price[billingCycle]}</span>
                                <span className="text-gray-500">{billingCycle === "monthly" ? "/mo" : "/yr"}</span>
                            </div>
                            <ul className="mb-8 space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center">
                                        ✅ {feature}
                                    </li>
                                ))}
                            </ul>
                            {/* <button  
                                onClick={plan.name === "Enterprise" ? handleContactSales : navigateToCheckout} // Use navigateToCheckout directly  
                                className="w-full py-3 px-4 rounded-lg font-medium bg-[#00897B] hover:bg-[#00695C] text-white"  
                            >  
                                {plan.name === "Enterprise" ? "Contact Sales" : "Subscribe Now"}  
                            </button>   */}
                            <button
                                onClick={plan.name === "Enterprise" ? () => handleContactSales(plan) : () => navigateToCheckout(plan)}
                                className="w-full py-3 px-4 rounded-lg font-medium bg-[#00897B] hover:bg-[#00695C] text-white"
                            >
                                {plan.name === "Enterprise" ? "Contact Sales" : "Subscribe Now"}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-medium mb-2">Can I change plans later?</h3>
                            <p>Yes, you can upgrade or downgrade anytime. Changes take effect on your next billing cycle.</p>
                        </div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">What Our Customers Say</h2>
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.map((testimonial) => (
                            <div key={testimonial.name} className="p-6 bg-gray-100 rounded-lg shadow">
                                <p className="text-gray-700 italic">“{testimonial.feedback}”</p>
                                <h4 className="font-semibold mt-4">- {testimonial.name}, {testimonial.company}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
            {alertComponent}
        </div>
    );
};

export default PricingPage;  