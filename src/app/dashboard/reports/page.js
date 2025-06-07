// app/dashboard/reports/page.js - Reports Page
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReportsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600">View detailed test reports and analytics</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Test Execution Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Tests</span>
                                    <span className="font-semibold">124</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Passed</span>
                                    <span className="font-semibold text-green-600">114</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Failed</span>
                                    <span className="font-semibold text-red-600">8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Skipped</span>
                                    <span className="font-semibold text-gray-600">2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Bug Status Overview</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Open</span>
                                    <span className="font-semibold text-red-600">8</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>In Progress</span>
                                    <span className="font-semibold text-yellow-600">5</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Resolved</span>
                                    <span className="font-semibold text-green-600">23</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Closed</span>
                                    <span className="font-semibold text-gray-600">45</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}