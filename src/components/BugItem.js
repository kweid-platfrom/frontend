import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BugItem = ({ bug, isSelected, onSelectBug, groupColor }) => {
    const [expanded, setExpanded] = useState(false);

    // Define the formatDate function inside the component
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="border-b border-gray-200 min-w-max">
            <div className="flex items-center py-3 px-2 hover:bg-gray-50">
                <div className="flex items-center min-w-[20px]">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectBug(bug.id, !isSelected)}
                        className="w-4 h-4"
                    />
                </div>
                <div
                    className="flex items-center min-w-[300px] cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ?
                        <ChevronDown size={16} className="mr-2" /> :
                        <ChevronRight size={16} className="mr-2" />
                    }
                    <span className="font-medium">{bug.title}</span>
                </div>

                <thead>
                    <tr className="bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider">
                    <th className="border-b border-gray-300 p-2">
                        {bug.id}
                    </th>
                    <th className="border-b border-gray-300 p-2">
                        {bug.status}
                    </th>
                    </tr>
                </thead>

                <div className="min-w-[100px] px-2">{bug.status}</div>
                <div className="min-w-[100px] px-2">{bug.priority}</div>
                <div className="min-w-[100px] px-2">{bug.severity}</div>
                <div className="min-w-[150px] px-2">{bug.assignedTo}</div>
                <div className="min-w-[150px] px-2">{formatDate(bug.createdAt)}</div>
                <div className="min-w-[100px] px-2">{bug.isAutomated ? "Yes" : "No"}</div>
                <div className="min-w-[100px] px-2">
                    {bug.automatedTestLink && (
                        <a
                            href={bug.automatedTestLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
                <div className="min-w-[140px] px-2">{bug.source}</div>
            </div>

            {expanded && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm mb-4">{bug.description}</p>

                            <h4 className="font-medium mb-2">Steps to Reproduce</h4>
                            <p className="text-sm whitespace-pre-line">{bug.stepsToReproduce}</p>
                        </div>
                        <div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Status</h4>
                                    <p className="text-sm">{bug.status}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Priority</h4>
                                    <p className="text-sm">{bug.priority}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Severity</h4>
                                    <p className="text-sm">{bug.severity}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Environment</h4>
                                    <p className="text-sm">{bug.environment}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Browser</h4>
                                    <p className="text-sm">{bug.browser}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">OS</h4>
                                    <p className="text-sm">{bug.os}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Assigned To</h4>
                                    <p className="text-sm">{bug.assignedTo}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Reported By</h4>
                                    <p className="text-sm">{bug.reportedBy}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Created At</h4>
                                    <p className="text-sm">{formatDate(bug.createdAt)}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500">Automated Test</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{bug.isAutomated ? "Yes" : "No"}</span>
                                        {bug.automatedTestLink && (
                                            <a
                                                href={bug.automatedTestLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-xs font-medium text-gray-500">Actual Result</h4>
                                <p className="text-sm mb-2">{bug.actualResult}</p>

                                <h4 className="text-xs font-medium text-gray-500">Expected Result</h4>
                                <p className="text-sm">{bug.expectedResult}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugItem;