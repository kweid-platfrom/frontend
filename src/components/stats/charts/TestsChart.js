// TestsChart.jsx
import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { TestTube } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TestsChart = ({ chartData, doughnutOptions, defaultOptions, trends, normalizedMetrics }) => {
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

    const testCaseMetricsData = {
        labels: ['Manual', 'Automated', 'AI Generated'],
        datasets: [{
            data: [normalizedMetrics.manualTestCases, normalizedMetrics.automatedTestCases, normalizedMetrics.aiGeneratedTestCases],
            backgroundColor: [
                'rgba(148, 163, 184, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
                '#94A3B8',
                '#3B82F6',
                '#8B5CF6'
            ],
            borderWidth: 2
        }]
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard 
                title="Test Case Distribution" 
                icon={TestTube}
                trend={trends.aiTrend}
                subtitle="Test case types and automation coverage"
            >
                <div style={{ height: '320px' }}>
                    {chartData.testCaseDistribution.length > 0 ? (
                        <Pie
                            data={chartData.testDistributionChartData || {
                                labels: chartData.testCaseDistribution.map(d => d.name),
                                datasets: [{
                                    data: chartData.testCaseDistribution.map(d => d.value),
                                    backgroundColor: [
                                        'rgba(148, 163, 184, 0.8)',
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(139, 92, 246, 0.8)',
                                        'rgba(229, 231, 235, 0.8)'
                                    ],
                                    borderColor: [
                                        '#94A3B8',
                                        '#3B82F6',
                                        '#8B5CF6',
                                        '#E5E7EB'
                                    ],
                                    borderWidth: 2,
                                    hoverOffset: 15,
                                    offset: 5
                                }]
                            }}
                            options={doughnutOptions}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <TestTube className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No test cases available</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>

            <ChartCard 
                title="Test Case Metrics" 
                icon={TestTube}
                subtitle="Detailed breakdown of test cases"
            >
                <div style={{ height: '320px' }}>
                    {normalizedMetrics.totalTestCases > 0 ? (
                        <Bar
                            data={testCaseMetricsData}
                            options={defaultOptions}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <TestTube className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No test cases</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>
        </div>
    );
};

export default TestsChart;