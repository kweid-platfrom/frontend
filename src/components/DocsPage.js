"use client";

import React from "react";
import Link from "next/link";
import "../app/globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "installation", title: "Installation" },
    { id: "features", title: "Features" },
    { id: "usage", title: "Usage Guide" },
    { id: "faq", title: "FAQs" },
    { id: "support", title: "Support & Contact" },
];

const DocsPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
                {sections.map(({ id, title }) => (
                    <section key={id} id={id} className="mb-16">
                        <h2 className="text-3xl font-bold text-[#2D3142]">{title}</h2>
                        <p className="mt-4 text-[#4A4B53]">
                            {id === "introduction" && "QAID is an all-in-one platform for test case management, defect tracking, and reporting."}
                            {id === "installation" && "No installation needed. QAID is accessible via web browser."}
                            {id === "features" && "✅ AI-generated test cases. ✅ Automated bug tracking. ✅ Cypress test script generation."}
                            {id === "usage" && (
                                <div className="max-w-full overflow-auto">
                                    <pre className="bg-[#2D3142] text-[#A5D6A7] p-4 rounded-md mt-4 text-sm md:text-base whitespace-pre-wrap">
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
                                </div>
                            )}
                            {id === "faq" && (
                                <>
                                    <h5 className="mb-2">Common questions and answers about QAID usage.</h5>
                                    <p><strong>Q:</strong> What platforms does QAID support?</p>
                                    <p><strong>A:</strong> QAID works on Windows, macOS, and Linux.</p>
                                    <p className="mt-4"><strong>Q:</strong> Can I integrate QAID with Jira?</p>
                                    <p><strong>A:</strong> Not Yet</p>
                                </>
                            )}
                            {id === "support" && (
                                <>
                                    Need help? Contact:
                                    <Link href="mailto:support@qaid.com" className="text-[#00897B] hover:underline"> support@qaid.com</Link>
                                </>
                            )}
                        </p>
                    </section>
                ))}
            </main>
            <Footer />
        </div>
    );
};

export default DocsPage;
