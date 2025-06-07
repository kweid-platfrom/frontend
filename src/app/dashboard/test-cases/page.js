// app/dashboard/test-cases/page.js - Test Cases Page
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TestCasesPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Test Cases</h1>
                        <p className="text-gray-600">Manage your test cases and test suites</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Create Test Case
                    </button>
                </div>
                
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Recent Test Cases</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div>
                                    <h4 className="font-medium">Login Functionality Test</h4>
                                    <p className="text-sm text-gray-600">Updated 2 hours ago</p>
                                </div>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Passed</span>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div>
                                    <h4 className="font-medium">Payment Processing Test</h4>
                                    <p className="text-sm text-gray-600">Updated 4 hours ago</p>
                                </div>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Failed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}