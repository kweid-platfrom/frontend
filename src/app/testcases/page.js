'use client';

import React from 'react';
import { useTestCases } from '../../hooks/useTestCases';
import { useUI } from '../../hooks/useUI';

const TestCases = () => {
    const { selectedTestCases, canCreateTestCases, testCasesLocked, selectTestCases } = useTestCases();
    const { toggleSidebar, sidebarOpen } = useUI();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    {testCasesLocked ? (
                        <p className="text-gray-600">Test cases are locked. Upgrade to access.</p>
                    ) : canCreateTestCases ? (
                        <div>
                            <p className="text-gray-600">Selected Test Cases: {selectedTestCases.length}</p>
                            <button
                                onClick={() => selectTestCases(['tc1', 'tc2'])} // Example test case IDs
                                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                            >
                                Select Sample Test Cases
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-600">Upgrade to create test cases</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestCases;