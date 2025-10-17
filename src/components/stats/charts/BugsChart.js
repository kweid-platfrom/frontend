// BugsChart.jsx
import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Bug } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const BugsChart = ({ chartData, defaultOptions, doughnutOptions, trends }) => {
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
                title="Daily Bug Resolution" 
                icon={Bug} 
                trend={trends.resolutionTrend}
                subtitle="Bug reporting and resolution patterns"
            >
                <div style={{ height: '320px' }}>
                    {chartData.dailyResolution.length > 0 ? (
                        <Bar
                            data={chartData.bugResolutionChartData || {
                                labels: chartData.dailyResolution.map(d => d.day),
                                datasets: [
                                    {
                                        label: 'Bugs Reported',
                                        data: chartData.dailyResolution.map(d => d.reported),
                                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                        borderColor: '#EF4444',
                                        borderWidth: 2,
                                        borderRadius: 8,
                                        hoverBackgroundColor: '#EF4444'
                                    },
                                    {
                                        label: 'Bugs Resolved',
                                        data: chartData.dailyResolution.map(d => d.resolved),
                                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                        borderColor: '#10B981',
                                        borderWidth: 2,
                                        borderRadius: 8,
                                        hoverBackgroundColor: '#10B981'
                                    }
                                ]
                            }}
                            options={defaultOptions}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Bug className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No bug data</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>

            <ChartCard 
                title="Bug Priority Distribution" 
                icon={Bug}
                subtitle="Current bug priority breakdown"
            >
                <div style={{ height: '320px' }}>
                    {chartData.bugPriority.length > 0 ? (
                        <Doughnut
                            data={chartData.bugPriorityChartData || {
                                labels: chartData.bugPriority.map(d => d.name),
                                datasets: [{
                                    data: chartData.bugPriority.map(d => d.value),
                                    backgroundColor: [
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(249, 115, 22, 0.8)',
                                        'rgba(245, 158, 11, 0.8)',
                                        'rgba(16, 185, 129, 0.8)',
                                        'rgba(107, 114, 128, 0.8)'
                                    ],
                                    borderColor: [
                                        '#EF4444',
                                        '#F97316',
                                        '#F59E0B',
                                        '#10B981',
                                        '#6B7280'
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
                                <Bug className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No bugs reported</p>
                            </div>
                        </div>
                    )}
                </div>
            </ChartCard>
        </div>
    );
};

export default BugsChart;