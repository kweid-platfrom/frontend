// app/dashboard/bugs/page.js - Bug Reports Page
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function BugReportsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bug Reports</h1>
                        <p className="text-gray-600">Track and manage bug reports</p>
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        Report Bug
                    </button>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Open Bugs</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div>
                                    <h4 className="font-medium">Critical: Database Connection Error</h4>
                                    <p className="text-sm text-gray-600">Reported by John Doe • 1 day ago</p>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Critical</span>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div>
                                    <h4 className="font-medium">UI: Button Alignment Issue</h4>
                                    <p className="text-sm text-gray-600">Reported by Jane Smith • 2 days ago</p>
                                </div>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Low</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}