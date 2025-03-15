"use client";

import React from "react";
import Link from "next/link";
import '../app/globals.css';
import Footer from "../components/Footer"
import Navbar from "../components/Navbar";
import Image from "next/image";

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-10">
                <Navbar />
            </nav>

            {/* Hero Section */}
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <svg className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <polygon points="50,0 100,0 50,100 0,100" />
                        </svg>
                        <div className="pt-10 sm:pt-16 lg:pt-8 xl:pt-16">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-[#2D3142] sm:text-5xl md:text-6xl mb-10">
                                    <span className="block xl:inline">QA Testing,</span>{' '}
                                    <span className="block text-[#00897B] xl:inline">Simplified</span>
                                </h1>
                                <p className="mt-3 text-base text-[#4A4B53] sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 mb-13">
                                    Streamline your quality assurance workflow with our comprehensive platform for test case management, defect tracking, and automated reporting.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <Link href="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xs text-white bg-[#00897B] hover:bg-[#00796B] md:py-4 md:text-lg md:px-10">
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
                <div className="">
    <Image 
        src="/2.webp" 
        alt="hero-image" 
        width={900}  // Set appropriate width
        height={300} // Set appropriate height
        className="object-cover rounded-lg"
    />
</div>
                </div>
            </div>

            {/* Feature Section */}
            <div className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-[#00897B] font-semibold mb-4 tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-[#2D3142] sm:text-4xl mb-6">
                            A better way to manage QA
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-[#4A4B53] lg:mx-auto mb-12">
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
                    <Footer />
            </footer>
        </div>
    );
};

export default Home;