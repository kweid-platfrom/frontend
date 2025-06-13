"use client";

import React, { useState, useEffect, useCallback } from "react";
import '../app/globals.css'
import { db } from "../../config/firebase";
import {
    collection,
    query,
    orderBy,
    doc,
    updateDoc,
    onSnapshot,
    getDocs
} from "firebase/firestore";
import { Bug, AlertCircle, Clock, Filter, ChevronDown } from "lucide-react";
import BugGroup from '../bug-report/BugGroup';

const BugTracker = () => {
    const [bugs, setBugs] = useState([]);
    const [groupedBugs, setGroupedBugs] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState({
        status: "all",
        severity: "all",
        category: "all",
    });
    const [expandedBug, setExpandedBug] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    useEffect(() => {
        setIsLoading(true);
        
        // Fallback fetch function
        const fetchBugs = async () => {
            try {
                const bugsRef = collection(db, "bugs");
                const q = query(bugsRef, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                
                const initialBugs = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    initialBugs.push({
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        timestamp: data.createdAt?.toDate() || new Date(),
                    });
                });

                setBugs(initialBugs);
            } catch (error) {
                console.error("Error fetching initial bugs:", error);
            }
        };

        // Fetch initial bugs before setting up listener
        fetchBugs();

        // Set up real-time listener for bugs collection
        const bugsRef = collection(db, "bugs");
        const q = query(bugsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedBugs = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedBugs.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    timestamp: data.createdAt?.toDate() || new Date(),
                });
            });

            setBugs(fetchedBugs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching bugs:", error);
            setIsLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    const groupBugsByMonth = useCallback(() => {
        // Apply filters
        const filteredBugs = bugs.filter((bug) => {
            return (
                (activeFilters.status === "all" || bug.status === activeFilters.status) &&
                (activeFilters.severity === "all" || bug.severity === activeFilters.severity) &&
                (activeFilters.category === "all" || bug.category === activeFilters.category)
            );
        });

        // Apply sorting
        const sortedBugs = [...filteredBugs].sort((a, b) => {
            let comparison = 0;

            if (sortBy === "timestamp" || sortBy === "createdAt") {
                // Handle both timestamp field names
                const aDate = a.createdAt || a.timestamp;
                const bDate = b.createdAt || b.timestamp;
                comparison = aDate - bDate;
            } else if (sortBy === "severity") {
                const severityRank = { "High": 3, "Medium": 2, "Low": 1 };
                comparison = severityRank[a.severity] - severityRank[b.severity];
            } else if (sortBy === "title") {
                comparison = a.title.localeCompare(b.title);
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });

        // Group by month
        const grouped = {};
        sortedBugs.forEach((bug) => {
            const date = new Date(bug.createdAt || bug.timestamp);
            const monthYear = `Defects ${date.getFullYear()} - ${date.toLocaleString("default", { month: "long" })}`;

            if (!grouped[monthYear]) grouped[monthYear] = [];
            grouped[monthYear].push(bug);
        });

        setGroupedBugs(grouped);
    }, [bugs, activeFilters, sortBy, sortDirection]);

    useEffect(() => {
        if (bugs.length > 0) {
            groupBugsByMonth();
        }
    }, [bugs, groupBugsByMonth]);

    const updateBugStatus = async (bugId, newStatus) => {
        try {
            const bugRef = doc(db, "bugs", bugId);
            await updateDoc(bugRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating bug status:", error);
        }
    };

    const toggleGroupCollapse = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("desc");
        }
    };

    const getGroupColor = (groupName) => {
        const colors = [
            "bg-blue-500", "bg-green-500", "bg-purple-500",
            "bg-red-500", "bg-yellow-500", "bg-pink-500",
            "bg-indigo-500", "bg-teal-500", "bg-orange-500"
        ];

        let hash = 0;
        for (let i = 0; i < groupName.length; i++) {
            hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    const openDetailsOverlay = (bug) => {
        setDetailsOverlay(bug);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-pulse flex flex-col w-full max-w-4xl">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="mb-6">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2].map((j) => (
                                    <div key={j} className="h-20 bg-gray-100 rounded-md"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-[-1rem]">
                <h1 className="text-3xl font-semibold mb-4 md:mb-0 flex items-center">
                    <Bug className="h-6 w-6 mr-2" />
                    Bug Tracker
                    <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                        {bugs.length} {bugs.length === 1 ? "bug" : "bugs"}
                    </span>
                </h1>

                <div className="flex flex-wrap gap-2">
                    <div className="relative group">
                        <button className="flex items-center px-3 py-1.5 text-sm rounded border hover:bg-gray-50">
                            <Filter className="h-4 w-4 mr-1" />
                            Status: {activeFilters.status === "all" ? "All" : activeFilters.status}
                            <ChevronDown className="h-3 w-3 ml-1" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-10 hidden group-hover:block">
                            {["all", "New", "In Progress", "Resolved", "Closed"].map((status) => (
                                <button
                                    key={status}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => setActiveFilters({ ...activeFilters, status })}
                                >
                                    {status === "all" ? "All" : status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center px-3 py-1.5 text-sm rounded border hover:bg-gray-50">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Severity: {activeFilters.severity === "all" ? "All" : activeFilters.severity}
                            <ChevronDown className="h-3 w-3 ml-1" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-10 hidden group-hover:block">
                            {["all", "High", "Medium", "Low"].map((severity) => (
                                <button
                                    key={severity}
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => setActiveFilters({ ...activeFilters, severity })}
                                >
                                    {severity === "all" ? "All" : severity}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center"
                        onClick={() => toggleSort("createdAt")}
                    >
                        <Clock className="h-4 w-4 mr-1" />
                        Date {(sortBy === "timestamp" || sortBy === "createdAt") && (sortDirection === "asc" ? "↑" : "↓")}
                    </button>

                    <button
                        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 flex items-center"
                        onClick={() => toggleSort("severity")}
                    >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Severity {sortBy === "severity" && (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                </div>
            </div>

            {Object.keys(groupedBugs).length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed">
                    <Bug className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 mb-2">No bugs found</p>
                    <p className="text-gray-400 text-sm">
                        {activeFilters.status !== "all" || activeFilters.severity !== "all" || activeFilters.category !== "all"
                            ? "Try adjusting your filters"
                            : "All clear! No bugs have been reported yet."}
                    </p>
                </div>
            ) : (
                Object.keys(groupedBugs).map((monthYear) => (
                    <BugGroup
                        key={monthYear}
                        groupName={monthYear}
                        bugs={groupedBugs[monthYear]}
                        color={getGroupColor(monthYear)}
                        isCollapsed={collapsedGroups[monthYear] || false}
                        toggleCollapse={() => toggleGroupCollapse(monthYear)}
                        expandedBug={expandedBug}
                        setExpandedBug={setExpandedBug}
                        updateBugStatus={updateBugStatus}
                        openDetailsOverlay={openDetailsOverlay}
                    />
                ))
            )}
        </div>
    );
};

export default BugTracker;