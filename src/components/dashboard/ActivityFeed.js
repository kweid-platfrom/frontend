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
    Code,
    UserPlus,
    FileText,
    ExternalLink,
    Lock
} from "lucide-react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthProvider"; // Assuming you have an auth context

const ActivityFeed = ({ organizationId }) => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser, loading: authLoading } = useAuth(); // Get current user from auth context

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        // Clear any previous errors
        setError(null);

        // Set up unsubscribe function for cleanup
        let unsubscribe = () => {};

        const fetchActivities = async () => {
            try {
                // Check if user is authenticated
                if (!currentUser) {
                    setError("authentication");
                    setIsLoading(false);
                    return;
                }

                // Create a query based on available filters
                let activitiesQuery;
                const activitiesRef = collection(db, "activities");

                if (organizationId) {
                    // Fetch activities for specific organization
                    activitiesQuery = query(activitiesRef, where("organizationId", "==", organizationId));
                } else {
                    // Fetch activities for current user
                    activitiesQuery = query(activitiesRef, where("userId", "==", currentUser.uid));
                }

                // First, get the initial data
                const querySnapshot = await getDocs(activitiesQuery);
                const fetchedActivities = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp?.toDate() : 
                              doc.data().timestamp ? new Date(doc.data().timestamp) : new Date()
                }));

                // Sort activities by timestamp (newest first)
                fetchedActivities.sort((a, b) => b.timestamp - a.timestamp);
                setActivities(fetchedActivities);

                // Set up real-time listener
                unsubscribe = onSnapshot(
                    activitiesQuery,
                    (snapshot) => {
                        const updatedActivities = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp?.toDate() : 
                                      doc.data().timestamp ? new Date(doc.data().timestamp) : new Date()
                        }));
                        updatedActivities.sort((a, b) => b.timestamp - a.timestamp);
                        setActivities(updatedActivities);
                        setIsLoading(false);
                    },
                    (error) => {
                        console.error("Error in real-time listener:", error);
                        setError(error.code === "permission-denied" ? "permission" : "unknown");
                        setIsLoading(false);
                    }
                );
            } catch (error) {
                console.error("Error fetching activities:", error);
                setError(error.code === "permission-denied" ? "permission" : "unknown");
                setIsLoading(false);
            }
        };

        fetchActivities();

        // Cleanup function to unsubscribe from the listener
        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [currentUser, authLoading, organizationId]);

    // Helper function to determine icon based on activity type
    const getActivityIcon = (activity) => {
        if (!activity) return AlertCircle;

        // Activity types
        switch (activity.type) {
            case "bug":
            case "defect":
                return Bug;
            case "test":
                return CheckSquare;
            case "team":
                return UserPlus;
            case "report":
                return FileText;
            case "integration":
                return ExternalLink;
            default:
                // Activity actions
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
        }
    };

    // Helper function to determine icon color based on activity status
    const getIconColor = (activity) => {
        if (!activity) return "text-gray-500";

        // Check for bug status
        if (activity.type === "bug" || activity.type === "defect") {
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
            return "text-red-500";
        }

        // Color based on activity type
        switch (activity.type) {
            case "test":
                return "text-green-500";
            case "team":
                return "text-purple-500";
            case "report":
                return "text-blue-500";
            case "integration":
                return "text-indigo-500";
            default:
                return "text-blue-500";
        }
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

        // Format descriptions for different activity types
        switch (activity.type) {
            case "bug":
            case "defect":
                return `${activity.status || "New"} defect: ${activity.title}`;
            
            case "test":
                return `Test ${activity.action || "run"} ${activity.status ? `(${activity.status})` : ""}: ${activity.title}`;
            
            case "team":
                return activity.action || "Team activity";
            
            case "report":
                return `Report ${activity.action || "generated"}: ${activity.title || ""}`;
            
            case "integration":
                return `Integration: ${activity.action || activity.title || "API activity"}`;
            
            default:
                return activity.action || activity.title || "Unknown activity";
        }
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

    // **Error States**
    if (error === "permission") {
        return (
            <div className="text-center py-6 text-amber-500">
                <Lock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Unable to access activity data</p>
                <p className="text-sm text-gray-500">You don&apos;t have permission to view these activities.</p>
                <p className="text-xs text-gray-400 mt-2">Please contact your administrator.</p>
            </div>
        );
    }

    if (error === "authentication") {
        return (
            <div className="text-center py-6 text-amber-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Authentication required</p>
                <p className="text-sm text-gray-500">Please sign in to view activities.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-6 text-red-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Something went wrong</p>
                <p className="text-sm text-gray-500">Unable to load activities at this time.</p>
                <p className="text-xs text-gray-400 mt-2">Please try again later.</p>
            </div>
        );
    }

    // **Empty State**
    if (!Array.isArray(activities) || activities.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
                <p className="text-sm text-gray-400">
                    {organizationId ? "No activities in this organization yet." : "You have no recent activities."}
                </p>
            </div>
        );
    }

    // **Activity Feed Render**
    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const Icon = getActivityIcon(activity);
                const iconColor = getIconColor(activity);
                const description = getActivityDescription(activity);
                const time = formatTime(activity.timestamp);

                return (
                    <div key={activity.id} className="flex items-start border-b pb-3 last:border-b-0 last:pb-0">
                        <div className={`mr-3 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">
                                {activity.user || "Unknown User"}
                                {activity.teamMember && ` → ${activity.teamMember}`}
                            </div>
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