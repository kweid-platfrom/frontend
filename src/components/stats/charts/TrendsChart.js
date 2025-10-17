// TrendsChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Activity, TestTube, TrendingDown, TrendingUp } from 'lucide-react';

const TrendsChart = ({ chartData, defaultOptions, trends }) => {
    const ChartCard = ({ title, children, icon: Icon, trend, subtitle }) => (
        <div className="bg-card rounded-lg shadow-theme border border-border p-6 hover:shadow-theme-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-success' : 'text-error'}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            {children}
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard 
                title="Weekly Activity Trends" 
                icon={Activity} 
                trend={trends.passRateTrend}
                subtitle="Test cases and bug activity over time"
            >
                <div style={{ height: '320px' }}>
                    {chartData.weeklyTrends.length > 0 ? (
                        <Line
                            data={chartData.weeklyTrendsChartData || {
                                labels: chartData.weeklyTrends.map(d => d.week),
                                datasets: [
                                    {
                                        label: 'Test Cases Created',
                                        data: chartData.weeklyTrends.map(d => d.testCasesCreated),
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        borderWidth: 3,
                                        tension: 0.4,
                                        fill: true,
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
                                        pointBackgroundColor: '#3B82F6',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: '#3B82F6',
                                        pointHoverBorderWidth: 3
                                    },
                                    {
                                        label: 'Bugs Reported',
                                        data: chartData.weeklyTrends.map(d => d.bugsReported),
                                        borderColor: '#EF4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        borderWidth: 3,
                                        tension: 0.4,
                                        fill: true,
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
                                        pointBackgroundColor: '#EF4444',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: '#EF4444',
                                        pointHoverBorderWidth: 3
                                    },
                                    {
                                        label: 'Bugs Resolved',
                                        data: chartData.weeklyTrends.map(d => d.bugsResolved),
                                        borderColor: '#10B981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        borderWidth: 3,
                                        tension: 0.4,
                                        fill: true,
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
                                        pointBackgroundColor: '#10B981',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2,
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: '#10B981',
                                        pointHoverBorderWidth: 3
                                    }
                                ]
                            }}
                            options={defaultOptions}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No activity data</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>

            <ChartCard 
                title="Test Type Distribution" 
                icon={TestTube} 
                trend={trends.automationTrend}
                subtitle="Manual vs Automated test coverage"
            >
                <div style={{ height: '320px' }}>
                    {chartData.weeklyTrends.length > 0 ? (
                        <Line
                            data={chartData.testTypeChartData || {
                                labels: chartData.weeklyTrends.map(d => d.week),
                                datasets: [
                                    {
                                        label: 'Automated Tests',
                                        data: chartData.weeklyTrends.map(d => d.automatedTests),
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
                                        pointBackgroundColor: '#3B82F6',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2
                                    },
                                    {
                                        label: 'Manual Tests',
                                        data: chartData.weeklyTrends.map(d => d.manualTests),
                                        borderColor: '#8B5CF6',
                                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 5,
                                        pointHoverRadius: 7,
                                        pointBackgroundColor: '#8B5CF6',
                                        pointBorderColor: '#fff',
                                        pointBorderWidth: 2
                                    }
                                ]
                            }}
                            options={defaultOptions}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <TestTube className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No test case data</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>
        </div>
    );
};

export default TrendsChart;