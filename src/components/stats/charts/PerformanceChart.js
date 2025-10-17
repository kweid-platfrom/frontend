// PerformanceChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Brain } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PerformanceChart = ({ chartData, defaultOptions, trends }) => {
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
        <ChartCard 
            title="Performance Metrics Over Time" 
            icon={Brain}
            trend={trends.passRateTrend}
            subtitle="Pass rates and automation progress"
        >
            <div style={{ height: '400px' }}>
                {chartData.performanceData.length > 0 ? (
                    <Line
                        data={chartData.performanceChartData || {
                            labels: chartData.performanceData.map(d => d.month),
                            datasets: [
                                {
                                    label: 'Pass Rate %',
                                    data: chartData.performanceData.map(d => d.passRate),
                                    borderColor: '#10B981',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 6,
                                    pointHoverRadius: 8,
                                    pointBackgroundColor: '#10B981',
                                    pointBorderColor: '#fff',
                                    pointBorderWidth: 2
                                },
                                {
                                    label: 'Automation Rate %',
                                    data: chartData.performanceData.map(d => d.automationRate),
                                    borderColor: '#3B82F6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 6,
                                    pointHoverRadius: 8,
                                    pointBackgroundColor: '#3B82F6',
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
                            <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No performance data</p>
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

export default PerformanceChart;