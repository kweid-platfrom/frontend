"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "../app/globals.css";
import Navbar from "../components/Navbar"

const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "installation", title: "Installation" },
    { id: "features", title: "Features" },
    { id: "usage", title: "Usage Guide" },
    { id: "faq", title: "FAQs" },
    { id: "support", title: "Support & Contact" },
];

const DocsPage = () => {
    const [activeSection, setActiveSection] = useState("introduction");

    useEffect(() => {
        const handleScroll = () => {
            let currentSection = "introduction";
            sections.forEach(({ id }) => {
                const section = document.getElementById(id);
                if (section) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= 150) {
                        currentSection = id;
                    }
                }
            });
            setActiveSection(currentSection);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex">

                {/* Sidebar */}
                <aside className="w-64 bg-white text-white fixed h-full p-6 hidden md:block">
                    <h2 className="text-xl font-bold text-[#2d3142]">QAID Documentation</h2>
                    <nav className="mt-4 space-y-2">
                        {sections.map(({ id, title }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className={`block px-4 py-2 rounded-xs transition-all ${activeSection === id
                                        ? "bg-[#00897B] text-[#E1E2E6] font-semibold"
                                        : "text-[#2d3142] hover:bg-[#00897B] hover:text-[#E1E2E6]"
                                    }`}
                            >
                                {title}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6 md:ml-64 md:p-12">
                    {/* Introduction */}
                    <section id="introduction" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">Introduction</h2>
                        <p className="mt-4 text-[#4A4B53]">
                            QAID is an all-in-one platform for **test case management, defect tracking, and reporting**.
                            It simplifies software testing by providing automated test case generation, AI-powered analysis, and seamless integrations.
                        </p>
                    </section>

                    {/* Installation */}
                    <section id="installation" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">Installation</h2>
                        <p className="mt-4 text-[#4A4B53]">To install QAID, follow these steps:</p>
                        <pre className="bg-[#2D3142] text-[#A5D6A7] p-4 rounded-md mt-4">
                            <code>
                                {`# Install QAID CLI
You don’t need to install this application.

You can access it from any web browser as long as you have an active internet connection.`}
                            </code>
                        </pre>
                    </section>

                    {/* Features */}
                    <section id="features" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">Features</h2>
                        <ul className="mt-4 text-[#4A4B53] list-disc pl-5 space-y-2">
                            <li>✅ AI-generated test cases.</li>
                            <li>✅ Automatic bug tracking with video recording.</li>
                            <li>✅ Cypress test script generation.</li>
                            <li>✅ Real-time dashboard with test metrics.</li>
                            <li>✅ Seamless integrations with Jira, GitHub, and more.</li>
                        </ul>
                    </section>

                    {/* Usage Guide */}
                    <section id="usage" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">Usage Guide</h2>
                        <p className="mt-4 text-[#4A4B53]">
                            Start using QAID by creating a test case:
                        </p>
                        <pre className="bg-[#2D3142] text-[#A5D6A7] p-4 rounded-md mt-4">
                            <code>
                                {`1. Sign Up & Log In
    . Visit the QAID platform in your web browser.
    . Sign up using your work email or Google SSO.
    . Verify your email if required and log in to your account.

2. Set Up Your Project
    . Create a new project for test case management and defect tracking.
    . Define your test scope, including the application or system being tested.
    . Invite team members (if applicable) to collaborate on testing.

3. Record & Report Bugs
    . Use the Screen Recorder to capture issues while testing.
    . QAID will automatically log defects and capture network requests for better debugging.
    . Submit bug reports with screenshots, videos, and system logs.

4. Create & Manage Test Cases
    . Generate AI-powered test cases based on your application requirements.
    . Import existing test cases from CSV, Jira, or other test management tools.
    . Organize test cases into suites and categories.

5. Execute Tests & Track Results
    . Run manual or automated tests directly within QAID.
    . Monitor test execution in real-time dashboards.
    . Automatically generate Cypress test scripts for automation.

6. Analyze Reports & Insights
    . Get detailed bug reports, test results, and performance insights.
    . Generate weekly/monthly reports to track test progress and quality metrics.
    . Export reports in PDF format for sharing with stakeholders.

7. Integrate with Your Workflow
    . Connect QAID with tools like Jira, GitHub, Slack, and more.
    . Sync bug tracking and test cases across multiple platforms.
    . Automate issue creation and updates for seamless collaboration.`}
                            </code>
                        </pre>
                    </section>

                    {/* FAQs */}
                    <section id="faq" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">FAQs</h2>
                        <div className="mt-4 text-[#4A4B53]">
                            <p><strong>Q:</strong> What platforms does QAID support?</p>
                            <p><strong>A:</strong> QAID works on Windows, macOS, and Linux.</p>
                            <p className="mt-4"><strong>Q:</strong> Can I integrate QAID with Jira?</p>
                            <p><strong>A:</strong> Yes! QAID has built-in integration with Jira.</p>
                        </div>
                    </section>

                    {/* Support & Contact */}
                    <section id="support" className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">Support & Contact</h2>
                        <p className="mt-4 text-[#4A4B53]">
                            Need help? Contact our support team at:
                            <Link href="mailto:support@qaid.com" className="text-[#00897B] hover:underline"> support@qaid.com</Link>
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default DocsPage;
