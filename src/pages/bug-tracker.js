"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "../config/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { Bug, AlertCircle, CheckCircle, Clock, Filter, ChevronDown, User } from "lucide-react";

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
    const [sortBy, setSortBy] = useState("timestamp");
    const [sortDirection, setSortDirection] = useState("desc");

    const fetchBugs = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(
                collection(db, "bugReports"),
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);
            const fetchedBugs = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedBugs.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });

            setBugs(fetchedBugs);
        } catch (error) {
            console.error("Error fetching bugs:", error);
        } finally {
            setIsLoading(false);
        }
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

            if (sortBy === "timestamp") {
                comparison = a.timestamp - b.timestamp;
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
            const date = new Date(bug.timestamp);
            const monthYear = `Defects ${date.getFullYear()} - ${date.toLocaleString("default", { month: "long" })}`;

            if (!grouped[monthYear]) grouped[monthYear] = [];
            grouped[monthYear].push(bug);
        });

        setGroupedBugs(grouped);
    }, [bugs, activeFilters, sortBy, sortDirection]);

    useEffect(() => {
        fetchBugs();
    }, [fetchBugs]);

    useEffect(() => {
        if (bugs.length > 0) {
            groupBugsByMonth();
        }
    }, [bugs, groupBugsByMonth]);

    const updateBugStatus = async (bugId, newStatus) => {
        try {
            const bugRef = doc(db, "bugReports", bugId);
            await updateDoc(bugRef, { status: newStatus });

            // Update local state
            setBugs((prevBugs) =>
                prevBugs.map((bug) =>
                    bug.id === bugId ? { ...bug, status: newStatus } : bug
                )
            );
        } catch (error) {
            console.error("Error updating bug status:", error);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "High":
                return "text-red-600 bg-red-50";
            case "Medium":
                return "text-orange-600 bg-orange-50";
            case "Low":
                return "text-green-600 bg-green-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "New":
                return <AlertCircle className="h-4 w-4 text-blue-500" />;
            case "In Progress":
                return <Clock className="h-4 w-4 text-orange-500" />;
            case "Resolved":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <Bug className="h-4 w-4 text-gray-500" />;
        }
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDirection("desc");
        }
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
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-2xl font-semibold mb-4 md:mb-0 flex items-center">
                    <Bug className="h-6 w-6 mr-2" />
                    Bug Tracker
                    <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                        {bugs.length} {bugs.length === 1 ? "bug" : "bugs"}
                    </span>
                </h2>

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
                        onClick={() => toggleSort("timestamp")}
                    >
                        <Clock className="h-4 w-4 mr-1" />
                        Date {sortBy === "timestamp" && (sortDirection === "asc" ? "↑" : "↓")}
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
                    <div key={monthYear} className="mb-8">
                        <h3 className="text-lg font-medium text-gray-700 border-b pb-1 mb-4">{monthYear}</h3>
                        <div className="space-y-3">
                            {groupedBugs[monthYear].map((bug) => (
                                <div
                                    key={bug.id}
                                    className="border rounded-md overflow-hidden bg-white hover:shadow-md transition"
                                >
                                    <div
                                        className="p-4 cursor-pointer flex flex-wrap md:flex-nowrap justify-between items-center"
                                        onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                                    >
                                        <div className="flex items-start space-x-3 w-full md:w-auto mb-3 md:mb-0">
                                            {getStatusIcon(bug.status)}
                                            <div>
                                                <h4 className="font-medium text-gray-900">{bug.title}</h4>
                                                <p className="text-sm text-gray-500 truncate max-w-md">
                                                    {bug.description?.substring(0, 100)}
                                                    {bug.description?.length > 100 ? "..." : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(bug.severity)}`}>
                                                {bug.severity}
                                            </span>

                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                {bug.category}
                                            </span>

                                            {bug.assignedTo && (
                                                <span className="text-xs flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                                    <User className="h-3 w-3 mr-1" />
                                                    {bug.assignedTo}
                                                </span>
                                            )}

                                            <span className="text-xs text-gray-500">
                                                {bug.timestamp.toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedBug === bug.id && (
                                        <div className="border-t p-4 bg-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <h5 className="text-sm font-medium mb-1 text-gray-700">Description</h5>
                                                    <p className="text-sm text-gray-600 whitespace-pre-line">{bug.description}</p>
                                                </div>

                                                <div>
                                                    <h5 className="text-sm font-medium mb-1 text-gray-700">Steps to Reproduce</h5>
                                                    <p className="text-sm text-gray-600 whitespace-pre-line">{bug.stepsToReproduce}</p>
                                                </div>
                                            </div>

                                            {bug.attachments && bug.attachments.length > 0 && (
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-medium mb-2 text-gray-700">Attachments</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {bug.attachments.map((file, index) => (
                                                            <a
                                                                key={index}
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs bg-white border rounded px-2 py-1 flex items-center hover:bg-gray-50"
                                                            >
                                                                {file.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-4 border-t pt-4">
                                                <button
                                                    className={`px-3 py-1 text-xs rounded ${bug.status === "New" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-blue-50"
                                                        }`}
                                                    onClick={() => updateBugStatus(bug.id, "New")}
                                                >
                                                    New
                                                </button>
                                                <button
                                                    className={`px-3 py-1 text-xs rounded ${bug.status === "In Progress" ? "bg-orange-100 text-orange-700" : "bg-gray-100 hover:bg-orange-50"
                                                        }`}
                                                    onClick={() => updateBugStatus(bug.id, "In Progress")}
                                                >
                                                    In Progress
                                                </button>
                                                <button
                                                    className={`px-3 py-1 text-xs rounded ${bug.status === "Resolved" ? "bg-green-100 text-green-700" : "bg-gray-100 hover:bg-green-50"
                                                        }`}
                                                    onClick={() => updateBugStatus(bug.id, "Resolved")}
                                                >
                                                    Resolved
                                                </button>
                                                <button
                                                    className={`px-3 py-1 text-xs rounded ${bug.status === "Closed" ? "bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                                                        }`}
                                                    onClick={() => updateBugStatus(bug.id, "Closed")}
                                                >
                                                    Closed
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default BugTracker;