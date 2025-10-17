import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Zap } from 'lucide-react';

const ExecutionChart = ({ normalizedMetrics, doughnutOptions }) => {
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

    const pending = normalizedMetrics.totalTestCases - normalizedMetrics.executionCount;
    const executionData = {
        labels: ['Passed', 'Failed', 'Pending'],
        datasets: [{
            data: [normalizedMetrics.passCount, normalizedMetrics.failCount, Math.max(0, pending)],
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(107, 114, 128, 0.8)'
            ],
            borderColor: [
                '#10B981',
                '#EF4444',
                '#6B7280'
            ],
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    return (
        <ChartCard 
            title="Test Execution Status" 
            icon={Zap}
            subtitle="Current test execution breakdown"
        >
            <div style={{ height: '300px' }}>
                {normalizedMetrics.totalTestCases > 0 ? (
                    <Doughnut
                        data={executionData}
                        options={doughnutOptions}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No execution data</p>
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

export default ExecutionChart;