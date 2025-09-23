// components/TestCaseActivityLog.js
import React from 'react';
import { Activity } from 'lucide-react';

const TestCaseActivityLog = ({ activities, formatDate }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No activity recorded yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                    <Activity className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            by {activity.user} on {formatDate(activity.timestamp) || 'Unknown'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TestCaseActivityLog;