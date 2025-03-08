import React from 'react';
import "../../app/globals.css"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bug, CheckSquare, CheckCircle, Activity, List } from 'lucide-react';

const ActivityFeed = () => {
    const recentActivity = [
        { id: 1, action: 'Bug reported', description: 'Authentication fails on mobile view', time: '28 min ago', user: 'Alex Chen', severity: 'Critical' },
        { id: 2, action: 'Test case created', description: 'Verify shopping cart functionality', time: '1 hour ago', user: 'Maria Gonzalez' },
        { id: 3, action: 'Bug resolved', description: 'Dashboard loading issue fixed', time: '3 hours ago', user: 'James Wilson', severity: 'Major' },
        { id: 4, action: 'AI generated test cases', description: '18 new test cases from requirements', time: '5 hours ago', user: 'System' },
        { id: 5, action: 'Cypress script generated', description: 'Login flow regression test', time: 'Yesterday', user: 'System' },
    ];

    const getActivityIcon = (action) => {
        if (action.includes('Bug reported')) return <Bug size={14} className="text-red-600" />;
        if (action.includes('Test case')) return <CheckSquare size={14} className="text-blue-600" />;
        if (action.includes('Bug resolved')) return <CheckCircle size={14} className="text-green-600" />;
        if (action.includes('AI generated') || action.includes('Cypress')) return <Activity size={14} className="text-purple-600" />;
        return <List size={14} className="text-gray-600" />;
    };

    const getActivityBgColor = (action) => {
        if (action.includes('Bug reported')) return 'bg-red-100';
        if (action.includes('Test case')) return 'bg-blue-100';
        if (action.includes('Bug resolved')) return 'bg-green-100';
        if (action.includes('AI generated') || action.includes('Cypress')) return 'bg-purple-100';
        return 'bg-gray-100';
    };

    const getSeverityBadge = (severity) => {
        if (!severity) return null;

        const colorMap = {
            'Critical': 'bg-red-500 text-white',
            'Major': 'bg-amber-500 text-white',
            'Minor': 'bg-yellow-500 text-white',
            'Low': 'bg-green-500 text-white'
        };

        return (
            <span className={`text-xs px-2 py-1 rounded-full ${colorMap[severity] || 'bg-gray-500 text-white'}`}>
                {severity}
            </span>
        );
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions from the testing platform</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getActivityBgColor(activity.action)}`}>
                                {getActivityIcon(activity.action)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                                <p className="text-sm text-gray-600">{activity.description}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">by {activity.user}</p>
                                    {getSeverityBadge(activity.severity)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ActivityFeed;