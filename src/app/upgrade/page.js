'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { useUI } from '../../hooks/useUI';

const Upgrade = () => {
    const { state } = useApp();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { isTrialActive, trialDaysRemaining } = state;
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Upgrade</h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    {isTrialActive ? (
                        <p className="text-gray-600">Trial active: {trialDaysRemaining} days remaining</p>
                    ) : (
                        <p className="text-gray-600">Upgrade to unlock premium features</p>
                    )}
                    <button
                        onClick={() => router.push('/pricing')} // Assuming a pricing page exists
                        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Upgrade;