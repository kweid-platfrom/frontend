"use client";
import React, { useEffect, useState } from "react";
import {
    GitCommit,
    GitPullRequest,
    CheckSquare,
    AlertCircle,
    Terminal,
    Bug,
    FileCheck,
    Clock,
    Code
} from "lucide-react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch activities from Firestore
        const fetchActivities = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "activities"));
                const fetchedActivities = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setActivities(fetchedActivities);
            } catch (error) {
                console.error("Error fetching activities: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();

        // Optional: Enable real-time updates using onSnapshot
        const unsubscribe = onSnapshot(collection(db, "activities"), snapshot => {
            const fetchedActivities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setActivities(fetchedActivities);
        });

        return () => unsubscribe();
    }, []);

    console.log("ActivityFeed Data:", activities); // Debugging: Check if activities are being received

    // Exclude user actions, subscription, and billing activities
    const filteredActivities = activities.filter(activity =>
        !["user-action", "subscription", "billing"].includes(activity?.type)
    );

    // Helper function to determine icon based on activity type
    const getActivityIcon = (activity) => {
        if (!activity) return AlertCircle;

        if (activity.type === "bug") return Bug;
        if (activity.type === "test") return CheckSquare;

        if (activity.action) {
            if (activity.action.includes("fixed") || activity.action.includes("resolved")) {
                return CheckSquare;
            }
            if (activity.action.includes("test")) {
                return FileCheck;
            }
            if (activity.action.includes("coverage")) {
                return GitCommit;
            }
            if (activity.action.includes("deploy")) {
                return Terminal;
            }
            if (activity.action.includes("PR") || activity.action.includes("merge")) {
                return GitPullRequest;
            }
            if (activity.action.includes("code") || activity.action.includes("develop")) {
                return Code;
            }
        }

        return Clock;
    };

    // Helper function to determine icon color based on activity status
    const getIconColor = (activity) => {
        if (!activity) return "text-gray-500";

        if (activity.status) {
            const status = activity.status.toLowerCase();
            if (["failed", "critical", "high"].includes(status)) {
                return "text-red-500";
            }
            if (["passed", "resolved", "closed"].includes(status)) {
                return "text-green-500";
            }
            if (status === "in progress") {
                return "text-yellow-500";
            }
            if (status === "new") {
                return "text-blue-500";
            }
        }

        return activity.type === "bug" ? "text-red-500" : activity.type === "test" ? "text-green-500" : "text-blue-500";
    };

    // Format timestamp to relative time
    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown time";

        const now = new Date();
        const activityTime = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (isNaN(activityTime)) return "Invalid date";

        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

        return activityTime.toLocaleDateString();
    };

    // Format activity description
    const getActivityDescription = (activity) => {
        if (!activity) return "";

        if (activity.type === "bug") {
            return `${activity.status} bug: ${activity.title}`;
        }

        if (activity.type === "test") {
            return `Test run ${activity.status.toLowerCase()}: ${activity.title}`;
        }

        return activity.action || activity.title || "Unknown activity";
    };

    // **Loading State (Skeleton)**
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="mr-3">
                            <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                            <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // **Empty State**
    if (!Array.isArray(filteredActivities) || filteredActivities.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
            </div>
        );
    }

    // **Activity Feed Render**
    return (
        <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
                const Icon = getActivityIcon(activity);
                const iconColor = getIconColor(activity);
                const description = getActivityDescription(activity);
                const time = formatTime(activity.timestamp);

                return (
                    <div key={index} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0">
                        <div className={`mr-3 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">{activity.user || "Unknown User"}</div>
                            <div className="text-sm text-gray-600">{description}</div>
                            <div className="text-xs text-gray-500 mt-1">{time}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityFeed;
