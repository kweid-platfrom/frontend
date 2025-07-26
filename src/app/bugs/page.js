'use client';

import React from 'react';
import { useBugs } from '../../hooks/useBugs';
import { useUI } from '../../hooks/useUI';

const BugTracker = () => {
    const { selectedBugs, canCreateBugs, selectBugs } = useBugs();
    const { toggleSidebar, sidebarOpen } = useUI();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Bug Tracker</h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    {canCreateBugs ? (
                        <div>
                            <p className="text-gray-600">Selected Bugs: {selectedBugs.length}</p>
                            <button
                                onClick={() => selectBugs(['bug1', 'bug2'])} // Example bug IDs
                                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                            >
                                Select Sample Bugs
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-600">Upgrade to create bugs</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BugTracker;