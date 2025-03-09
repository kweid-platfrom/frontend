import React from 'react';
import "../../app/globals.css"
import MetricCard from './MetricCard';
import { CheckSquare, CheckCircle, Bug, Activity } from 'lucide-react';

const KeyMetrics = () => {
    const metrics = [
        {
            title: 'Total Test Cases',
            value: '437',
            change: '+12% from last month',
            icon: <CheckSquare />,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Test Success',
            value: '92.3%',
            change: '+3.5% from last month',
            icon: <CheckCircle />,
            iconColor: 'text-green-600',
            iconBgColor: 'bg-green-100',
        },
        {
            title: 'Open Defects',
            value: '32',
            change: '+5 from last week',
            icon: <Bug />,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-100',
        },
        {
            title: 'Avg. Resolution',
            value: '2.4 days',
            change: '-0.8 days',
            icon: <Activity />,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    icon={metric.icon}
                    iconColor={metric.iconColor}
                    iconBgColor={metric.iconBgColor}
                />
            ))}
        </div>
    );
};

export default KeyMetrics;
