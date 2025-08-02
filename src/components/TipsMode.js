import React from 'react';
import { TestTube, Upload, Users, FileText, TrendingUp, Bug, Activity } from 'lucide-react';

const TipsMode = ({ activeSuite, isTrialActive, trialDaysRemaining, isOrganizationAccount }) => {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-8 mb-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                        <TestTube className="w-8 h-8 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to {activeSuite?.name || 'Your Test Suite'}!
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Your workspace is ready. Use the buttons in the header above to get started with quality assurance testing.
                    </p>
                    {isTrialActive && trialDaysRemaining > 0 && (
                        <div className="bg-white/80 rounded-lg p-3 inline-block">
                            <p className="text-blue-700 font-medium">
                                🎉 Free trial active: {trialDaysRemaining} days remaining
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                    Available Actions in Header
                </h3>
                <div className={`grid ${isOrganizationAccount ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Create/Upload Documents</h4>
                        <p className="text-gray-600 text-sm">
                            Upload project requirements, specifications, or create new test documentation to get started
                        </p>
                    </div>
                    
                    {isOrganizationAccount && (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Invite Team Members</h4>
                            <p className="text-gray-600 text-sm">
                                Collaborate with your team by inviting members to join your workspace
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                    Navigate to Add Data
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <TestTube className="w-6 h-6 text-teal-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Test Cases</h4>
                        <p className="text-gray-600 text-sm mb-3">
                            Use the sidebar to navigate to Test Cases and start creating comprehensive test scenarios
                        </p>
                        <p className="text-xs text-teal-600 font-medium">Sidebar → Test Cases → Create</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Bug className="w-6 h-6 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Bug Reports</h4>
                        <p className="text-gray-600 text-sm mb-3">
                            Navigate to Bugs section to start tracking issues and defects found during testing
                        </p>
                        <p className="text-xs text-red-600 font-medium">Sidebar → Bugs → Report</p>
                    </div>

                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Test Execution</h4>
                        <p className="text-gray-600 text-sm mb-3">
                            Once you have test cases, use Test Runs to execute and track testing progress
                        </p>
                        <p className="text-xs text-green-600 font-medium">Sidebar → Test Runs → Execute</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-2" />
                        Test Case Best Practices
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Clear Steps:</strong> Write specific, actionable test steps that anyone can follow</span>
                        </li>
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Expected Results:</strong> Define clear expected outcomes for each test</span>
                        </li>
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Descriptive Names:</strong> Use meaningful titles that explain what&apos;s being tested</span>
                        </li>
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Tags & Categories:</strong> Organize tests with relevant tags for easy filtering</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                        Getting Started Tips
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Start Small:</strong> Begin with critical user flows and expand coverage gradually</span>
                        </li>
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Use Documentation:</strong> Upload project docs to generate test cases automatically</span>
                        </li>
                        <li className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span><strong>Track Everything:</strong> Log bugs and issues as you find them</span>
                        </li>
                        {isOrganizationAccount && (
                            <li className="flex items-start">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span><strong>Team Collaboration:</strong> Invite team members to work together</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Ready to Get Started?
                </h3>
                <div className="text-center text-gray-600">
                    <p className="mb-4">
                        Use the navigation and header buttons to begin building your quality assurance process.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4">
                            <div className="text-2xl mb-2">1️⃣</div>
                            <p className="text-sm font-medium text-gray-900">Upload Documents</p>
                            <p className="text-xs text-gray-600 mt-1">Start with project requirements</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <div className="text-2xl mb-2">2️⃣</div>
                            <p className="text-sm font-medium text-gray-900">Create Test Cases</p>
                            <p className="text-xs text-gray-600 mt-1">Build your test scenarios</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                            <div className="text-2xl mb-2">3️⃣</div>
                            <p className="text-sm font-medium text-gray-900">Execute & Track</p>
                            <p className="text-xs text-gray-600 mt-1">Run tests and monitor progress</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TipsMode;