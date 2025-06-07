// app/dashboard/page.js - Main Dashboard Page
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Welcome to your QA Suite dashboard</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Total Tests</h3>
                        <p className="text-3xl font-bold text-blue-600">124</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Active Bugs</h3>
                        <p className="text-3xl font-bold text-red-600">8</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Test Coverage</h3>
                        <p className="text-3xl font-bold text-green-600">92%</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold">Automated Tests</h3>
                        <p className="text-3xl font-bold text-purple-600">56</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}