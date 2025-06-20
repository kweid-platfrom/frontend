// app/dashboard/automation/page.js - Automation Page

export default function AutomationPage() {
    return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Test Automation</h1>
                        <p className="text-gray-600">Manage automated test scripts and schedules</p>
                    </div>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                        Create Script
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Automation Scripts</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <h4 className="font-medium">Login Flow Test</h4>
                                        <p className="text-sm text-gray-600">Last run: 30 min ago</p>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Scheduled Runs</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <h4 className="font-medium">Daily Regression Test</h4>
                                        <p className="text-sm text-gray-600">Next run: Tomorrow 2:00 AM</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Scheduled</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}