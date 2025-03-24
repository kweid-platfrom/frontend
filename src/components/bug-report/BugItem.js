import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Link } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import BugItemDetails from "../bug-report/BugDetails";

const BugItem = ({
    bug,
    isSelected,
    toggleSelection,
    isExpanded,
    toggleExpand,
    updateBugStatus,
    teamMembers
}) => {
    const [loading, setLoading] = useState(false);
    const [bugData, setBugData] = useState(bug);

    // Set up real-time listener for bug data
    useEffect(() => {
        const bugRef = doc(db, "bugReports", bug.id);
        const unsubscribe = onSnapshot(bugRef, (snapshot) => {
            if (snapshot.exists()) {
                const updatedBug = { id: snapshot.id, ...snapshot.data() };
                setBugData(updatedBug);
            }
        }, (error) => {
            console.error("Error listening to bug updates:", error);
        });

        // Clean up the listener on component unmount
        return () => unsubscribe();
    }, [bug.id]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "Critical":
                return "text-red-700 bg-red-100";
            case "High":
                return "text-orange-700 bg-orange-100";
            case "Medium":
                return "text-yellow-700 bg-yellow-100";
            case "Low":
                return "text-green-700 bg-green-100";
            default:
                return "text-gray-700 bg-gray-100";
        }
    };

    const getPriorityFromSeverity = (severity) => {
        switch (severity) {
            case "Critical":
                return { level: "Critical", color: "text-red-700 bg-red-100" };
            case "High":
                return { level: "P1", color: "text-orange-700 bg-orange-100" };
            case "Medium":
                return { level: "P2", color: "text-yellow-700 bg-yellow-100" };
            case "Low":
                return { level: "P3", color: "text-green-700 bg-green-100" };
            default:
                return { level: "P4", color: "text-gray-700 bg-gray-100" };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "New":
                return "text-blue-700 bg-blue-100";
            case "In Progress":
                return "text-purple-700 bg-purple-100";
            case "Blocked":
                return "text-red-700 bg-red-100";
            case "Resolved":
                return "text-green-700 bg-green-100";
            case "Closed":
                return "text-gray-700 bg-gray-100";
            default:
                return "text-gray-700 bg-green-100";
        }
    };

    // Fixed formatDate function to handle all date formats properly
    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        
        try {
            // Handle Firestore timestamp
            if (typeof timestamp === 'object' && timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString();
            }
            
            // Handle JavaScript Date objects
            if (timestamp instanceof Date) {
                return timestamp.toLocaleDateString();
            }
            
            // Handle string timestamps
            if (typeof timestamp === 'string') {
                // Check if it's a valid date string
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString();
                }
                return timestamp; // Return the original string if not a valid date
            }
            
            // Handle numeric timestamps (milliseconds)
            if (typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleDateString();
            }
            
            // Default fallback
            return String(timestamp);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    };

    const priority = getPriorityFromSeverity(bugData.severity || "Low");

    return (
        <>
        <tr className={`hover:bg-gray-50 text-xs ${loading ? "opacity-50" : ""}`}>
            <td className="p-3">
                <input
                    type="checkbox"
                    className="rounded"
                    checked={isSelected}
                    onChange={toggleSelection}
                    onClick={(e) => e.stopPropagation()}
                    disabled={loading}
                />
            </td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 cursor-pointer" onClick={toggleExpand}>
                <div className="flex items-center">
                    {isExpanded ? 
                        <ChevronDown className="h-4 w-4 mr-2" /> : 
                        <ChevronRight className="h-4 w-4 mr-2" />
                    }
                    <span className="truncate max-w-xs">{bugData.title}</span>
                </div>
            </td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.id.slice(0, 8)}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.category}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.assignedTo || "Unassigned"}</td>
            <td className="border border-gray-300 px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bugData.status)}`}>
                    {bugData.status}
                </span>
            </td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(bugData.severity)}`}>
                    {bugData.severity}
                </span>
            </td>
            <td className="border border-gray-300 px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                    {priority.level}
                </span>
            </td>
            
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.epicName || "N/A"}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.testCaseName || "N/A"}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.testStatus || "N/A"}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{formatDate(bugData.dueDate)}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3">
                {bugData.isAutomated ? 
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-100">Yes</span> :
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-700 bg-gray-100">No</span>
                }
            </td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">
                {bugData.isAutomated && bugData.scriptLink && (
                    <a 
                        href={bugData.scriptLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        <Link className="h-4 w-4 inline" />
                    </a>
                )}
            </td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{bugData.reportedBy || "System"}</td>
            <td className="border border-gray-300 whitespace-nowrap px-4 py-3 text-xs text-gray-700">{formatDate(bugData.createdAt)}</td>
        </tr>

        {/* Expanded details as a separate row */}
        {isExpanded && (
            <tr className="w-full">
                <td colSpan="16" className="p-0">
                    <BugItemDetails 
                        bug={bugData}
                        teamMembers={teamMembers}
                        updateBugStatus={(status) => {
                            setLoading(true);
                            updateBugStatus(bugData.id, status)
                                .finally(() => setLoading(false));
                        }}
                        getSeverityColor={getSeverityColor}
                        getStatusColor={getStatusColor}
                        getPriorityFromSeverity={getPriorityFromSeverity}
                        formatDate={formatDate}
                    />
                </td>
            </tr>
        )}
        </>
    );
};

export default BugItem;