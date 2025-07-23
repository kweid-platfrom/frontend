'use client'
import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useDashboard } from '../../hooks/useDashboard';

const DashboardPage = () => {
    const { metrics, loading, error } = useDashboard();

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    return (
        <PageLayout>
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-100 p-4 rounded shadow">
                        <h3 className="text-lg font-semibold">Test Cases</h3>
                        <p className="text-3xl">{metrics.testCases}</p>
                    </div>
                    <div className="bg-red-100 p-4 rounded shadow">
                        <h3 className="text-lg font-semibold">Bugs</h3>
                        <p className="text-3xl">{metrics.bugs}</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded shadow">
                        <h3 className="text-lg font-semibold">Recordings</h3>
                        <p className="text-3xl">{metrics.recordings}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                    <ul className="space-y-2">
                        {metrics.recentActivity.map((activity) => (
                            <li key={activity.id} className="p-2 bg-gray-100 rounded">
                                {activity.user_id} {activity.action} at {new Date(activity.timestamp.toDate()).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </PageLayout>
    );
};

export default DashboardPage;