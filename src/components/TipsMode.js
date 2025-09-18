'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { TestTube, Users, Upload, Bug, Activity, FileText, TrendingUp, CheckCircle } from 'lucide-react';

const TipsMode = ({
  isTrialActive,
  trialDaysRemaining,
  isOrganizationAccount,
  onInteraction, // Added prop for tracking interactions
}) => {
  const router = useRouter();

  const handleCreateTestPlan = () => {
    onInteraction(); // Track interaction
    router.push('/documents/create');
  };

  const handleNextClick = () => {
    onInteraction(); // Track interaction
    // Optionally, you can navigate to another page or trigger another action
    // For now, we'll just track the interaction to dismiss TipsMode
  };

  return (
    <>
      <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
        {/* Welcome Header */}
        <div className="rounded-lg p-6 mb-6 text-center flex-shrink-0 shadow-sm border border-gray-100">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-3 shadow-md">
            <TestTube className="w-6 h-6 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to QAiD
          </h2>
          <p className="text-gray-600 mb-4">
            Your test suite is ready! Start building your quality assurance framework
          </p>

          {isTrialActive && trialDaysRemaining > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 inline-block mb-4 shadow-sm border border-blue-100">
              <p className="text-primary font-semibold text-sm">
                🎉 Free trial active: {trialDaysRemaining} days remaining
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleCreateTestPlan}
            className="inline-flex items-center px-6 py-3 bg-teal-500 text-white font-semibold rounded-md shadow-lg transition-all duration-300 hover:bg-teal-600"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Test Plan
          </button>
        </div>

        {/* Quick Start Guide */}
        <div className="rounded-lg p-4 flex-grow flex flex-col justify-center shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            Your QA Journey in 3 Steps
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Step 1 Card */}
            <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-teal-200">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">Create Test Plan</h4>
              <p className="text-gray-600 text-xs mb-3">
                Upload requirements and generate test scenarios.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Upload className="w-3 h-3 mr-1 text-teal-500" />
                  Upload documents
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Activity className="w-3 h-3 mr-1 text-teal-500" />
                  AI-generated scenarios
                </div>
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TestTube className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">Build Test Cases</h4>
              <p className="text-gray-600 text-xs mb-3">
                Create and organize test cases into suites.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 mr-1 text-blue-500" />
                  Define test steps
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Activity className="w-3 h-3 mr-1 text-blue-500" />
                  Organize test suites
                </div>
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">Execute & Monitor</h4>
              <p className="text-gray-600 text-xs mb-3">
                Run tests and track progress.
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Activity className="w-3 h-3 mr-1 text-green-500" />
                  Execute test runs
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Bug className="w-3 h-3 mr-1 text-green-500" />
                  Track defects
                </div>
              </div>
            </div>
          </div>

          {isOrganizationAccount && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center bg-teal-50 text-teal-700 px-4 py-2 rounded-lg shadow-sm border border-teal-100">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-xs font-semibold">Organization Account: Invite team members</span>
              </div>
            </div>
          )}
          <div className="text-center mt-6">
            <button
              onClick={handleNextClick}
              className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              Understood, next
            </button>
            <p className="text-xs text-gray-500 mt-2">Step 1 of 2</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipsMode;