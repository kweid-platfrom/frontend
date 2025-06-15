import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Bug, TestTube, Brain, Zap } from 'lucide-react';

const QAIDCharts = () => {
    const [activeChart, setActiveChart] = useState('trends');

    // Sample data - in real app, this would come from metrics prop
    const weeklyTrends = [
        { week: 'Week 1', testCases: 45, bugs: 12, recordings: 8, aiGenerated: 15 },
        { week: 'Week 2', testCases: 52, bugs: 8, recordings: 12, aiGenerated: 20 },
        { week: 'Week 3', testCases: 61, bugs: 15, recordings: 18, aiGenerated: 25 },
        { week: 'Week 4', testCases: 58, bugs: 6, recordings: 22, aiGenerated: 28 }
    ];

    const bugResolutionData = [
        { day: 'Mon', resolved: 8, reported: 12 },
        { day: 'Tue', resolved: 15, reported: 10 },
        { day: 'Wed', resolved: 12, reported: 8 },
        { day: 'Thu', resolved: 18, reported: 14 },
        { day: 'Fri', resolved: 22, reported: 16 },
        { day: 'Sat', resolved: 5, reported: 3 },
        { day: 'Sun', resolved: 2, reported: 1 }
    ];

    const testCoverageData = [
        { name: 'Functional', value: 65, color: '#3B82F6' },
        { name: 'Edge Cases', value: 20, color: '#10B981' },
        { name: 'Negative', value: 15, color: '#F59E0B' }
    ];

    const aiProductivityData = [
        { month: 'Jan', manual: 120, aiGenerated: 30, efficiency: 20 },
        { month: 'Feb', manual: 110, aiGenerated: 45, efficiency: 29 },
        { month: 'Mar', manual: 100, aiGenerated: 60, efficiency: 38 },
        { month: 'Apr', manual: 95, aiGenerated: 75, efficiency: 44 }
    ];

    const automationProgress = [
        { feature: 'Auth', manual: 25, automated: 35 },
        { feature: 'Payments', manual: 30, automated: 20 },
        { feature: 'Dashboard', manual: 40, automated: 45 },
        { feature: 'Reports', manual: 15, automated: 25 },
        { feature: 'Settings', manual: 20, automated: 15 }
    ];

    const ChartCard = ({ title, children, icon: Icon, trend }) => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                </div>
                {trend && (
                    <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            {children}
        </div>
    );

    const chartTabs = [
        { id: 'trends', label: 'Weekly Trends', icon: Activity },
        { id: 'bugs', label: 'Bug Resolution', icon: Bug },
        { id: 'coverage', label: 'Test Coverage', icon: TestTube },
        { id: 'ai', label: 'AI Productivity', icon: Brain },
        { id: 'automation', label: 'Automation', icon: Zap }
    ];

    return (
        <div className="space-y-6">
            {/* Chart Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-1">
                <div className="flex space-x-1 overflow-x-auto">
                    {chartTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeChart === tab.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Content */}
            {activeChart === 'trends' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartCard title="Weekly Activity Trends" icon={Activity} trend={12}>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weeklyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="testCases" stroke="#3B82F6" strokeWidth={2} name="Test Cases" />
                                <Line type="monotone" dataKey="bugs" stroke="#EF4444" strokeWidth={2} name="Bugs Found" />
                                <Line type="monotone" dataKey="recordings" stroke="#10B981" strokeWidth={2} name="Recordings" />
                                <Line type="monotone" dataKey="aiGenerated" stroke="#8B5CF6" strokeWidth={2} name="AI Generated" />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Test Case Distribution" icon={TestTube} trend={8}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={weeklyTrends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="testCases" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="aiGenerated" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {activeChart === 'bugs' && (
                <ChartCard title="Bug Resolution Trends" icon={Bug} trend={-15}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={bugResolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="reported" fill="#EF4444" name="Bugs Reported" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resolved" fill="#10B981" name="Bugs Resolved" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            {activeChart === 'coverage' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Test Coverage Distribution" icon={TestTube}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={testCoverageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {testCoverageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Coverage']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Coverage Metrics</h3>
                        <div className="space-y-4">
                            {testCoverageData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-900">{item.value}%</div>
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${item.value}%`,
                                                    backgroundColor: item.color
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeChart === 'ai' && (
                <ChartCard title="AI Productivity Impact" icon={Brain} trend={25}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={aiProductivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="manual" fill="#94A3B8" name="Manual Test Cases" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="aiGenerated" fill="#8B5CF6" name="AI Generated" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            {activeChart === 'automation' && (
                <ChartCard title="Automation Progress by Feature" icon={Zap} trend={18}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={automationProgress} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis dataKey="feature" type="category" tick={{ fontSize: 12 }} width={80} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="manual" fill="#F59E0B" name="Manual Tests" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="automated" fill="#10B981" name="Automated Tests" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}
        </div>
    );
};

export default QAIDCharts;