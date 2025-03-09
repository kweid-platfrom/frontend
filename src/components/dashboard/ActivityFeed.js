// ActivityFeed.jsx - Updated with available Lucide icons
import React from "react";
import { GitCommit, GitPullRequest, CheckSquare, AlertCircle, Terminal } from "lucide-react";

const ActivityFeed = () => {
    const activities = [
        {
            user: "Alex Kim",
            action: "fixed 3 critical bugs in the Auth module",
            time: "2 hours ago",
            icon: AlertCircle,
            iconColor: "text-red-500"
        },
        {
            user: "Jamie Chen",
            action: "added 28 new unit tests",
            time: "4 hours ago",
            icon: CheckSquare, // Changed from FileCheck
            iconColor: "text-green-500"
        },
        {
            user: "Taylor Wong",
            action: "increased code coverage by 5%",
            time: "yesterday",
            icon: GitCommit,
            iconColor: "text-blue-500"
        },
        {
            user: "Jordan Smith",
            action: "deployed test suite v2.3",
            time: "yesterday",
            icon: Terminal,
            iconColor: "text-purple-500"
        },
        {
            user: "Casey Johnson",
            action: "merged PR for test optimization",
            time: "2 days ago",
            icon: GitPullRequest,
            iconColor: "text-indigo-500"
        },
    ];

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => (
                <div key={index} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0">
                    <div className={`mr-3 ${activity.iconColor}`}>
                        <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium">{activity.user}</div>
                        <div className="text-sm text-gray-600">{activity.action}</div>
                        <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;