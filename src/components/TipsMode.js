import React, { useState } from 'react';
import { TestTube, Users, Plus, Upload, Bug, Activity, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import CreateSuiteModal from './modals/createSuiteModal';

const TipsMode = ({ 
    isTrialActive, 
    trialDaysRemaining, 
    isOrganizationAccount,
    onSuiteCreated // Add this prop to handle suite creation
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreateSuite = () => {
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
    };

    const handleSuiteCreationComplete = async (newSuite) => {
        setShowCreateModal(false);
        if (onSuiteCreated) {
            await onSuiteCreated(newSuite);
        }
    };

    return (
        <>
            <div className="h-full flex flex-col max-w-6xl mx-auto px-4">
                {/* Welcome Header */}
                <div className="rounded-lg p-6 mb-6 text-center flex-shrink-0 shadow-sm">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-3 shadow-md">
                        <TestTube className="w-6 h-6 text-teal-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to QAiD
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Start your quality assurance journey by creating your first test suite
                    </p>
                    
                    {isTrialActive && trialDaysRemaining > 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 inline-block mb-3 shadow-sm border border-blue-100">
                            <p className="text-primary font-semibold text-sm">
                                🎉 Free trial active: {trialDaysRemaining} days remaining
                            </p>
                        </div>
                    )}

                    {/* Prominent Create Button */}
                    <button
                        onClick={handleCreateSuite}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test Suite
                    </button>
                </div>

                {/* Quick Start Guide */}
                <div className="rounded-lg p-4 flex-grow flex flex-col justify-center shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                        Your QA Journey in 3 Steps
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {/* Step 1 Card */}
                        <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-teal-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                                <TestTube className="w-6 h-6 text-teal-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm">Create Test Suite</h4>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                                Set up your workspace and define your project scope with custom configurations.
                            </p>
                            <div className="space-y-1">
                                <div className="flex items-center text-xs text-gray-500">
                                    <CheckCircle className="w-3 h-3 mr-1 text-teal-500" />
                                    Define project parameters
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    <CheckCircle className="w-3 h-3 mr-1 text-teal-500" />
                                    Configure environment
                                </div>
                            </div>
                        </div>

                        {/* Step 2 Card */}
                        <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm">Build Test Cases</h4>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                                Create comprehensive test scenarios and upload documents for AI-assisted generation.
                            </p>
                            <div className="space-y-1">
                                <div className="flex items-center text-xs text-gray-500">
                                    <Upload className="w-3 h-3 mr-1 text-blue-500" />
                                    Upload requirements
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    <Activity className="w-3 h-3 mr-1 text-blue-500" />
                                    Generate scenarios
                                </div>
                            </div>
                        </div>

                        {/* Step 3 Card */}
                        <div className="bg-white rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-sm">Execute & Monitor</h4>
                            <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                                Run tests, track progress, and generate comprehensive quality reports.
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
                        <div className="text-center">
                            <div className="inline-flex items-center bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-4 py-2 rounded-lg shadow-sm border border-purple-100">
                                <Users className="w-4 h-4 mr-2" />
                                <span className="text-xs font-semibold">Organization Account: Invite team members to collaborate</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Suite Modal */}
            <CreateSuiteModal
                isOpen={showCreateModal}
                onSuiteCreated={handleSuiteCreationComplete}
                onClose={handleCloseModal}
                onCancel={handleCloseModal}
                isRequired={false} // Not enforcing since this is optional
            />
        </>
    );
};

export default TipsMode;