"use client";

import React from "react";
import Link from "next/link";
import '../app/globals.css';

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="text-2xl font-bold text-[#00897B]">LOGO</div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/features" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                                Features
                            </Link>
                            <Link href="/pricing" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                                Pricing
                            </Link>
                            <Link href="/docs" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                                Documentation
                            </Link>
                            <Link href="/login" className="text-[#00897B] font-medium hover:text-[#00796B] transition-colors">
                                Login
                            </Link>
                            <Link href="/register" className="bg-[#00897B] text-white px-4 py-2 rounded hover:bg-[#00796B] transition-colors">
                                Sign Up Free
                            </Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button className="text-[#4A4B53] hover:text-[#00897B]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <svg className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <polygon points="50,0 100,0 50,100 0,100" />
                        </svg>
                        <div className="pt-10 sm:pt-16 lg:pt-8 xl:pt-16">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-[#2D3142] sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">QA Testing,</span>{' '}
                                    <span className="block text-[#00897B] xl:inline">Simplified</span>
                                </h1>
                                <p className="mt-3 text-base text-[#4A4B53] sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    Streamline your quality assurance workflow with our comprehensive platform for test case management, defect tracking, and automated reporting.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <Link href="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#00897B] hover:bg-[#00796B] md:py-4 md:text-lg md:px-10">
                                            Get started
                                        </Link>
                                    </div>
                                    <div className="mt-3 sm:mt-0 sm:ml-3">
                                        <Link href="/demo" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-[#00897B] bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                                            Request demo
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <div className="h-56 w-full bg-[#E1E2E6] sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-[#9EA0A5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Feature Section */}
            <div className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-[#00897B] font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#2D3142] sm:text-4xl">
                            A better way to manage QA
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-[#4A4B53] lg:mx-auto">
                            Powerful tools to help your team catch bugs before your users do.
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                            {/* Feature 1 */}
                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#00897B] text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-[#2D3142]">Test Case Management</h3>
                                    <p className="mt-2 text-base text-[#4A4B53]">
                                        Create, organize, and execute test cases with ease. Track coverage and requirements traceability.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#00897B] text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-[#2D3142]">Bug Tracking</h3>
                                    <p className="mt-2 text-base text-[#4A4B53]">
                                        Log and track defects with detailed descriptions, screenshots, and priority ratings. Seamless integration with development tools.
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="relative">
                                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-[#00897B] text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="ml-16">
                                    <h3 className="text-lg leading-6 font-medium text-[#2D3142]">Advanced Reporting</h3>
                                    <p className="mt-2 text-base text-[#4A4B53]">
                                        Generate comprehensive reports with real-time metrics. Visualize testing progress and team performance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonial Section */}
            <div className="bg-[#F5F7FA] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base text-[#00897B] font-semibold tracking-wide uppercase">Testimonials</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#2D3142] sm:text-4xl">
                            Trusted by QA professionals
                        </p>
                    </div>

                    <div className="mt-10">
                        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-8">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-[#A5D6A7] rounded-full p-2">
                                        <svg className="h-8 w-8 text-[#00897B]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg leading-6 font-medium text-[#2D3142]">Sarah Chen</h3>
                                        <p className="text-[#9EA0A5]">QA Lead at TechSolutions</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-[#4A4B53] italic">
                                        &ldquo;QA Aid has transformed our testing process. We have reduced our bug escape rate by 78% and cut our testing time in half. The reporting features have been invaluable for communicating with stakeholders.&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#00897B]">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        <span className="block">Ready to get started?</span>
                        <span className="block text-[#A5D6A7]">Start your free trial today.</span>
                    </h2>
                    <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                        <div className="inline-flex rounded-md shadow">
                            <Link href="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-[#00897B] bg-white hover:bg-gray-50">
                                Sign up for free
                            </Link>
                        </div>
                        <div className="ml-3 inline-flex rounded-md shadow">
                            <Link href="/contact" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#00796B] hover:bg-opacity-90">
                                Contact sales
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white">
                <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
                    <nav className="flex flex-wrap justify-center">
                        <div className="px-5 py-2">
                            <Link href="/about" className="text-base text-[#4A4B53] hover:text-[#00897B]">
                                About
                            </Link>
                        </div>
                        <div className="px-5 py-2">
                            <Link href="/blog" className="text-base text-[#4A4B53] hover:text-[#00897B]">
                                Blog
                            </Link>
                        </div>
                        <div className="px-5 py-2">
                            <Link href="/careers" className="text-base text-[#4A4B53] hover:text-[#00897B]">
                                Careers
                            </Link>
                        </div>
                        <div className="px-5 py-2">
                            <Link href="/privacy" className="text-base text-[#4A4B53] hover:text-[#00897B]">
                                Privacy
                            </Link>
                        </div>
                        <div className="px-5 py-2">
                            <Link href="/terms" className="text-base text-[#4A4B53] hover:text-[#00897B]">
                                Terms
                            </Link>
                        </div>
                    </nav>
                    <div className="mt-8 flex justify-center space-x-6">
                        {/* Social Media Icons */}
                        <a href="#" className="text-[#9EA0A5] hover:text-[#00897B]">
                            <span className="sr-only">Twitter</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                        </a>
                        <a href="#" className="text-[#9EA0A5] hover:text-[#00897B]">
                            <span className="sr-only">LinkedIn</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                        </a>
                        <a href="#" className="text-[#9EA0A5] hover:text-[#00897B]">
                            <span className="sr-only">GitHub</span>
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                    <p className="mt-8 text-center text-base text-[#9EA0A5]">
                        &copy; 2025 QA Aid, Inc. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;