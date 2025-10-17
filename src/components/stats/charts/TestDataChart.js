// TestDataChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Database } from 'lucide-react';

const TestDataChart = ({ chartData, defaultOptions }) => {
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

    const testDataBarData = {
        labels: chartData.testDataTrends.map(d => d.set),
        datasets: [
            {
                label: 'Coverage %',
                data: chartData.testDataTrends.map(d => d.coverage),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: '#8B5CF6',
                borderWidth: 2,
                borderRadius: 8,
                yAxisID: 'y'
            },
            {
                label: 'Items',
                data: chartData.testDataTrends.map(d => d.items),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3B82F6',
                borderWidth: 2,
                borderRadius: 8,
                yAxisID: 'y1'
            }
        ]
    };

    return (
        <ChartCard 
            title="Test Data Coverage" 
            icon={Database}
            subtitle="Test data usage and coverage"
        >
            <div style={{ height: '300px' }}>
                {chartData.testDataTrends.length > 0 ? (
                    <Bar
                        data={testDataBarData}
                        options={{
                            ...defaultOptions,
                            scales: {
                                ...defaultOptions.scales,
                                y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    grid: {
                                        drawOnChartArea: false,
                                    },
                                },
                            }
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Database className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No test data</p>
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

export default TestDataChart;