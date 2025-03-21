import React from "react";
import { Bug, AlertCircle, CheckCircle, Clock, Info } from "lucide-react";

const BugItem = ({ 
    bug, 
    isSelected, 
    toggleSelection, 
    isExpanded, 
    toggleExpand, 
    updateBugStatus,
    openDetailsOverlay
}) => {
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

    const handleInfoClick = (e) => {
        e.stopPropagation();
        openDetailsOverlay();
    };

    return (
        <div className="border-b hover:bg-gray-50 transition-colors">
            <div className="p-3 flex items-center">
                <div className="w-10 flex justify-center">
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={toggleSelection}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                    />
                </div>
                <div 
                    className="flex-grow grid grid-cols-12 gap-2 items-center cursor-pointer"
                    onClick={toggleExpand}
                >
                    <div className="col-span-5 flex items-center">
                        <button 
                            className="mr-2 p-1 rounded-full hover:bg-gray-200"
                            onClick={handleInfoClick}
                        >
                            <Info className="h-4 w-4 text-gray-500" />
                        </button>
                        <div>
                            <h4 className="font-medium text-gray-900 text-sm">{bug.title}</h4>
                            <p className="text-xs text-gray-500 truncate max-w-md">
                                {bug.description?.substring(0, 60)}
                                {bug.description?.length > 60 ? "..." : ""}
                            </p>
                        </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                        <span className="flex items-center text-xs py-1 px-2 rounded-full bg-gray-100">
                            {getStatusIcon(bug.status)}
                            <span className="ml-1">{bug.status}</span>
                        </span>
                    </div>
                    <div className="col-span-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(bug.severity)}`}>
                            {bug.severity}
                        </span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {bug.category}
                        </span>
                    </div>
                    <div className="col-span-1 text-xs text-gray-500">
                        {bug.timestamp.toLocaleDateString()}
                    </div>
                </div>
            </div>

            {isExpanded && (
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
    );
};

export default BugItem;