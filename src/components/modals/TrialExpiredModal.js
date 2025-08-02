// components/TrialExpiredModal.js
import React, { useState } from 'react';

const TrialExpiredModal = ({ 
    isOpen, 
    onAction, 
    excessSuites, 
    currentPlan 
}) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = async (action) => {
        setIsProcessing(true);
        try {
            await onAction(action);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Trial Period Ended
                            </h2>
                            <p className="text-sm text-gray-500">
                                Your free trial has expired
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-orange-800">
                                        Account Limitations Applied
                                    </h3>
                                    <div className="mt-2 text-sm text-orange-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Your account has been downgraded to the {currentPlan} plan</li>
                                            {excessSuites > 0 && (
                                                <li className="font-medium">
                                                    {excessSuites} test suite{excessSuites !== 1 ? 's have' : ' has'} been deactivated
                                                </li>
                                            )}
                                            <li>Limited test case creation and advanced features</li>
                                            <li>No access to recordings and automation tools</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Upgrade Benefits
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Reactivate all your test suites</li>
                                            <li>Unlimited test case creation</li>
                                            <li>Advanced recording and automation features</li>
                                            <li>Team collaboration tools</li>
                                            <li>Priority support</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {excessSuites > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Deactivated Test Suites
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {excessSuites} of your test suite{excessSuites !== 1 ? 's' : ''} 
                                    {excessSuites !== 1 ? ' have' : ' has'} been temporarily deactivated. 
                                    Your test data is safe and will be restored when you upgrade your plan.
                                </p>
                            </div>
                        )}

                        <div className="text-sm text-gray-600">
                            <p>
                                <strong>Don&apos;t worry!</strong> All your test data, cases, and configurations are safely stored. 
                                Upgrade now to restore full access to your workspace.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                            type="button"
                            onClick={() => handleAction('continue')}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                'Continue with Free Plan'
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => handleAction('upgrade')}
                            className="inline-flex justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Upgrade Now
                                </>
                            )}
                        </button>
                    </div>
                    
                    <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                            Questions? <a href="#" className="text-blue-600 hover:text-blue-800">Contact our support team</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialExpiredModal;