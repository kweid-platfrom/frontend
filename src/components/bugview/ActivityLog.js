// components/ActivityLog.js
import React from "react";

const ActivityLog = ({ activities, formatDate }) => {
    if (!activities || activities.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Activity</h3>
            <div className="space-y-2">
                {activities.slice(-5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        <span className="font-medium">{activity.user}</span>
                        <span>{activity.action}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">{formatDate(activity.createdAt)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityLog;