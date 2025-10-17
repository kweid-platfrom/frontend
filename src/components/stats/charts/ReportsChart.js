// ReportsChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { FileBarChart } from 'lucide-react';

const ReportsChart = ({ chartData, defaultOptions }) => {
    const ChartCard = ({ title, children, icon: Icon, subtitle }) => (
        <div className="bg-card rounded-lg shadow-theme border border-border p-6 hover:shadow-theme-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
            </div>
            {children}
        </div>
    );

    const reportsData = {
        labels: chartData.reportTrends.map(d => d.week),
        datasets: [
            {
                label: 'Overdue',
                data: chartData.reportTrends.map(d => d.overdue),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: '#EF4444',
                borderWidth: 2,
                borderRadius: 8
            },
            {
                label: 'Completed',
                data: chartData.reportTrends.map(d => d.completed),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10B981',
                borderWidth: 2,
                borderRadius: 8
            }
        ]
    };

    return (
        <ChartCard 
            title="Report Trends" 
            icon={FileBarChart}
            subtitle="Reporting activity and metrics"
        >
            <div style={{ height: '300px' }}>
                {chartData.reportTrends.length > 0 ? (
                    <Bar
                        data={reportsData}
                        options={defaultOptions}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FileBarChart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No reports data</p>
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

export default ReportsChart;
