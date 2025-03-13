"use client";
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../app/globals.css"

const FeaturePage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-6 py-12 flex flex-col items-center">
                <div className="text-center mb-12 w-full max-w-4xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight w-full">
                        QAID: Comprehensive <br className="hidden md:block"/> Quality Assurance & Testing Management Tool
                    </h1>
                    <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                        Streamline your QA processes with an all-in-one test management solution.
                    </p>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
                    {[
                        { title: "Unified Platform", desc: "Combines test case management, defect tracking, and reporting in one seamless interface." },
                        { title: "Screen Recording & Bug Capture", desc: "Facilitates accurate bug reproduction with network tab capture." },
                        { title: "AI-Generated Test Cases", desc: "Automatically generates test cases from requirements documents, saving time." },
                        { title: "Automated Cypress Test Scripts", desc: "Enhance regression testing with AI-assisted test script creation." },
                        { title: "Quality Dashboards", desc: "Provides insights into testing progress and defect trends." },
                        { title: "Cross-Platform Integration", desc: "Seamlessly integrates with project management tools." }
                    ].map((feature, index) => (
                        <div key={index} className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
                            <p className="text-gray-700">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center mt-12 w-full">
                    <h2 className="text-2xl font-bold text-gray-900 m-6">Get Started with QAID Today!</h2>
                    <p className="text-gray-700 mt-2">Improve your QA efficiency with AI-driven test automation and management.</p>
                    <div className="m-9 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button className="px-6 py-3 bg-[#00897B] text-white font-semibold rounded-sm hover:bg-[#00695C] transition">
                            Sign Up for Free
                        </button>
                        <button className="px-9 py-3 bg-gray-200 text-gray-900 font-semibold rounded-sm hover:bg-gray-300 transition">
                            Book a Demo
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FeaturePage;
