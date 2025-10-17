// RecordingsChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Video } from 'lucide-react';

const RecordingsChart = ({ chartData, defaultOptions }) => {
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

    const recordingsData = {
        labels: chartData.recordingTrends.map(d => d.week),
        datasets: [
            {
                label: 'Recordings',
                data: chartData.recordingTrends.map(d => d.recordings),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            },
            {
                label: 'Coverage %',
                data: chartData.recordingTrends.map(d => d.coverage),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }
        ]
    };

    return (
        <ChartCard 
            title="Recording Trends" 
            icon={Video}
            subtitle="Test recording activity"
        >
            <div style={{ height: '300px' }}>
                {chartData.recordingTrends.length > 0 ? (
                    <Line
                        data={recordingsData}
                        options={defaultOptions}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No recordings data</p>
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
};

export default RecordingsChart;