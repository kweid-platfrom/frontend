'use client';

import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { useUI } from '../../hooks/useUI';
import { useApp } from '../../context/AppProvider';

const Dashboard = () => {
    const { metrics, loading, error } = useDashboard();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { state } = useApp();
    const { activeSuite, isTrialActive, trialDaysRemaining } = state;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeSuite ? `${activeSuite.name} Dashboard` : 'Dashboard'}
                    </h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Metrics Cards */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Test Cases</h2>
                            <p className="text-2xl font-bold text-teal-700">{metrics.testCases}</p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Bugs</h2>
                            <p className="text-2xl font-bold text-teal-700">{metrics.bugs}</p>
                        </div>
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900">Recordings</h2>
                            <p className="text-2xl font-bold text-teal-700">{metrics.recordings}</p>
                        </div>

                        {/* Trial Status */}
                        {isTrialActive && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow rounded-lg p-6 sm:col-span-2 lg:col-span-3">
                                <p className="text-gray-600">
                                    Trial active: {trialDaysRemaining} days remaining
                                </p>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="bg-white shadow rounded-lg p-6 sm:col-span-2 lg:col-span-3">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                            {metrics.recentActivity.length > 0 ? (
                                <ul className="space-y-3">
                                    {metrics.recentActivity.map((activity, index) => (
                                        <li key={index} className="text-sm text-gray-600">
                                            {activity.description || 'Activity occurred'} -{' '}
                                            {activity.timestamp?.toDate().toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">No recent activity</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;