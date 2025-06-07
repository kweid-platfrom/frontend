
// app/dashboard/settings/page.js - Settings Page
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Manage your account and application settings</p>
                </div>
                
                <div className="bg-white rounded-lg shadow divide-y">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="your@email.com" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                <label className="ml-2 text-sm text-gray-700">Email notifications for test failures</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                <label className="ml-2 text-sm text-gray-700">Daily summary reports</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}