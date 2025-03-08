"use client"

import React, { useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Activity, Bug, CheckCircle, Filter, List, PieChart as PieChartIcon, BarChart as BarChartIcon, CheckSquare } from 'lucide-react';
import "../app/globals.css"

const QAIDDashboard = () => {
    const [viewMode, setViewMode] = useState('chart');

    // Sample data for visualizations
    const defectTrendData = [
        { name: 'Jan', Critical: 12, Major: 18, Minor: 24, total: 54 },
        { name: 'Feb', Critical: 9, Major: 16, Minor: 22, total: 47 },
        { name: 'Mar', Critical: 11, Major: 20, Minor: 18, total: 49 },
        { name: 'Apr', Critical: 8, Major: 17, Minor: 15, total: 40 },
        { name: 'May', Critical: 7, Major: 15, Minor: 13, total: 35 },
        { name: 'Jun', Critical: 5, Major: 12, Minor: 10, total: 27 },
    ];

    const testCoverageData = [
        { name: 'User Auth', coverage: 92 },
        { name: 'Dashboard', coverage: 78 },
        { name: 'Reports', coverage: 85 },
        { name: 'Test Mgmt', coverage: 91 },
        { name: 'Defect Tracking', coverage: 87 },
        { name: 'Integrations', coverage: 72 },
    ];

    const bugStatusData = [
        { name: 'Open', value: 32, color: '#ff6b6b' },
        { name: 'In Progress', value: 18, color: '#feca57' },
        { name: 'Resolved', value: 27, color: '#48dbfb' },
        { name: 'Closed', value: 63, color: '#1dd1a1' },
    ];

    const testResultsData = [
        { name: 'Passed', value: 165, color: '#1dd1a1' },
        { name: 'Failed', value: 23, color: '#ff6b6b' },
        { name: 'Blocked', value: 12, color: '#feca57' },
        { name: 'Skipped', value: 8, color: '#c8d6e5' },
    ];

    // Recent activity sample data
    const recentActivity = [
        { id: 1, action: 'Bug reported', description: 'Authentication fails on mobile view', time: '28 min ago', user: 'Alex Chen', severity: 'Critical' },
        { id: 2, action: 'Test case created', description: 'Verify shopping cart functionality', time: '1 hour ago', user: 'Maria Gonzalez' },
        { id: 3, action: 'Bug resolved', description: 'Dashboard loading issue fixed', time: '3 hours ago', user: 'James Wilson', severity: 'Major' },
        { id: 4, action: 'AI generated test cases', description: '18 new test cases from requirements', time: '5 hours ago', user: 'System' },
        { id: 5, action: 'Cypress script generated', description: 'Login flow regression test', time: 'Yesterday', user: 'System' },
    ];

    return (
        <div className="flex flex-col space-y-4 p-4 max-w-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">QAID Dashboard</h1>
                    <p className="text-gray-500">Quality Assurance & Testing Management</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Table View</span>
                        <Switch
                            checked={viewMode === 'chart'}
                            onCheckedChange={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                        />
                        <span className="text-sm text-gray-500">Chart View</span>
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Filter size={16} /> Filter
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Total Test Cases</p>
                                <h3 className="text-2xl font-bold">437</h3>
                                <p className="text-xs text-green-500">+12% from last month</p>
                            </div>
                            <div className="bg-blue-100 p-2 rounded-full">
                                <CheckSquare size={20} className="text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Test Execution Success</p>
                                <h3 className="text-2xl font-bold">92.3%</h3>
                                <p className="text-xs text-green-500">+3.5% from last month</p>
                            </div>
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Open Defects</p>
                                <h3 className="text-2xl font-bold">32</h3>
                                <p className="text-xs text-red-500">+5 from last week</p>
                            </div>
                            <div className="bg-red-100 p-2 rounded-full">
                                <Bug size={20} className="text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Avg. Resolution Time</p>
                                <h3 className="text-2xl font-bold">2.4 days</h3>
                                <p className="text-xs text-green-500">-0.8 days from last month</p>
                            </div>
                            <div className="bg-purple-100 p-2 rounded-full">
                                <Activity size={20} className="text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Defect Trends */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Defect Trends</CardTitle>
                        <CardDescription>6-month trend of reported issues by severity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'chart' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={defectTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Critical" stroke="#ff6b6b" activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="Major" stroke="#feca57" />
                                    <Line type="monotone" dataKey="Minor" stroke="#54a0ff" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {defectTrendData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Critical}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Major}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Minor}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bug Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Bug Status Distribution</CardTitle>
                        <CardDescription>Current state of reported defects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'chart' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={bugStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {bugStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bugStatusData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: row.color }}></div>
                                                        {row.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(row.value / bugStatusData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Second row of charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Test Coverage */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Test Coverage by Module</CardTitle>
                        <CardDescription>Percentage of code covered by automated tests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'chart' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={testCoverageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Bar dataKey="coverage" fill="#54a0ff">
                                        {testCoverageData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.coverage > 90 ? '#1dd1a1' : entry.coverage > 80 ? '#54a0ff' : entry.coverage > 70 ? '#feca57' : '#ff6b6b'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage %</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {testCoverageData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.coverage}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <Badge className={
                                                        row.coverage > 90 ? 'bg-green-100 text-green-800' :
                                                            row.coverage > 80 ? 'bg-blue-100 text-blue-800' :
                                                                row.coverage > 70 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                    }>
                                                        {row.coverage > 90 ? 'Excellent' :
                                                            row.coverage > 80 ? 'Good' :
                                                                row.coverage > 70 ? 'Fair' :
                                                                    'Needs Improvement'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Test Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Test Execution Results</CardTitle>
                        <CardDescription>Last 7 days test run status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'chart' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={testResultsData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {testResultsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {testResultsData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: row.color }}></div>
                                                        {row.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.value}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(row.value / testResultsData.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Activity Feed */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <CardDescription>Latest actions in the QAID system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50">
                                <div className={`p-2 rounded-full ${activity.action.includes('Bug reported') ? 'bg-red-100' :
                                        activity.action.includes('Test case') ? 'bg-blue-100' :
                                            activity.action.includes('Bug resolved') ? 'bg-green-100' :
                                                activity.action.includes('AI generated') ? 'bg-purple-100' :
                                                    'bg-gray-100'
                                    }`}>
                                    {activity.action.includes('Bug reported') ? <Bug size={16} className="text-red-600" /> :
                                        activity.action.includes('Test case') ? <CheckSquare size={16} className="text-blue-600" /> :
                                            activity.action.includes('Bug resolved') ? <CheckCircle size={16} className="text-green-600" /> :
                                                activity.action.includes('AI generated') || activity.action.includes('Cypress') ? <Activity size={16} className="text-purple-600" /> :
                                                    <List size={16} className="text-gray-600" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="text-sm font-medium">{activity.action}</h4>
                                        <span className="text-xs text-gray-500">{activity.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-gray-500">By {activity.user}</span>
                                        {activity.severity && (
                                            <Badge className={activity.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                                {activity.severity}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full">View All Activity</Button>
                </CardFooter>
            </Card>

            {/* Features Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">QAID Key Features</CardTitle>
                    <CardDescription>Comprehensive quality assurance and testing management tools</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Test Case Management</h3>
                            <p className="text-sm text-gray-600">Create, organize, and execute test cases with customizable workflows.</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">AI-Generated Tests</h3>
                            <p className="text-sm text-gray-600">Automatically generate test cases from requirements documents.</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Defect Tracking</h3>
                            <p className="text-sm text-gray-600">Report, assign, and track bugs with screen recording capabilities.</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Cypress Test Generation</h3>
                            <p className="text-sm text-gray-600">Automatic regression test script generation for continuous testing.</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Quality Metrics</h3>
                            <p className="text-sm text-gray-600">Visual dashboards for tracking quality metrics and defect trends.</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">Cross-Platform Integration</h3>
                            <p className="text-sm text-gray-600">Seamless integration with popular project management tools.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default QAIDDashboard;