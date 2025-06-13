// components/BugList.js
import React from "react";
import { Calendar, User, AlertTriangle } from "lucide-react";

const BugList = ({ 
    bugs, 
    onBugSelect, 
    selectedBug, 
    getSeverityColor, 
    getStatusColor, 
    formatDate 
}) => {
    const isPastDue = (dueDate) => {
        if (!dueDate) return false;
        const date = dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
        return date < new Date();
    };

    if (bugs.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">No bugs found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {bugs.map((bug) => (
                <div
                    key={bug.id}
                    onClick={() => onBugSelect(bug)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                        selectedBug?.id === bug.id 
                            ? 'bg-blue-50 border-l-blue-500' 
                            : 'border-l-transparent'
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            {/* Title and ID */}
                            <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {bug.title}
                                </h3>
                                <span className="text-xs text-gray-500 font-mono">
                                    #{bug.id.slice(-6)}
                                </span>
                                {isPastDue(bug.dueDate) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Overdue
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {bug.description}
                            </p>

                            {/* Meta information */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                {bug.assignedTo && (
                                    <div className="flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        {bug.assignedTo}
                                    </div>
                                )}
                                {bug.dueDate && (
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(bug.dueDate)}
                                    </div>
                                )}
                                <span>Created: {formatDate(bug.createdAt)}</span>
                            </div>
                        </div>

                        {/* Status and Severity badges */}
                        <div className="flex flex-col items-end space-y-2 ml-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bug.status)}`}>
                                {bug.status}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(bug.severity)}`}>
                                {bug.severity}
                            </span>
                            {bug.category && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                    {bug.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BugList;