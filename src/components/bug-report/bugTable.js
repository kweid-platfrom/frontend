// components/BugTable.js
"use client"
import React from "react";
import { MessageSquare } from "lucide-react";

const BugTable = ({
    bugs,
    date,
    editingTitle,
    selectedBugs,
    teamMembers,
    statusOptions,
    priorityOptions,
    severityOptions,
    getStatusColor,
    getPriorityColor,
    getSeverityColor,
    isAllInGroupSelected,
    handleSelectAllInGroup,
    handleBugSelection,
    handleTitleEdit,
    handleTitleEditStart,
    handleTitleEditEnd,
    handleAssigneeChange,
    handleStatusChange,
    handlePriorityChange,
    handleSeverityChange,
    openBugDetails
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-white text-sm">
                        <th className="border border-gray-400 p-1 whitespace-nowrap w-8">
                            <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={isAllInGroupSelected(date)}
                                onChange={(e) => handleSelectAllInGroup(date, e.target.checked)}
                            />
                        </th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Bug/Defect Title</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Issue ID</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Issue Category</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Assign To</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Status</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Priority</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Severity</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Epic</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Test Case</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Case Status</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Due Date</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Automated</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Link to Automated Scripts</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">Creation Log</th>
                    </tr>
                </thead>
                <tbody>
                    {bugs.map(bug => (
                        <tr key={bug.id} className="hover:bg-gray-100 text-xs">
                            <td className="border border-gray-300 p-2 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    checked={selectedBugs.includes(`${date}-${bug.id}`)}
                                    onChange={() => handleBugSelection(bug.id, date)}
                                />
                            </td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">
                                <div className="flex items-center">
                                    {editingTitle === bug.id ? (
                                        <input
                                            type="text"
                                            className="border border-gray-300 p-1 mr-2 flex-grow"
                                            value={bug.title}
                                            onChange={(e) => handleTitleEdit(bug.id, date, e)}
                                            onBlur={handleTitleEditEnd}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTitleEditEnd()}
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            className="mr-2 cursor-pointer"
                                            onDoubleClick={() => handleTitleEditStart(bug.id)}
                                        >
                                            {bug.title}
                                        </span>
                                    )}
                                    <MessageSquare
                                        size={16}
                                        className="text-gray-500 cursor-pointer hover:text-blue-500"
                                        onClick={() => openBugDetails(bug)}
                                    />
                                </div>
                            </td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.id}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.category}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">
                                <select
                                    className="p-1 w-full"
                                    value={bug.assignedTo}
                                    onChange={(e) => handleAssigneeChange(bug.id, date, e.target.value)}
                                >
                                    {teamMembers.map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                                    <option value="unassigned">Unassigned</option>
                                </select>
                            </td>
                            <td className={`border border-gray-300 p-0 whitespace-nowrap ${getStatusColor(bug.status)}`}>
                                <select
                                    className={`p-1 text-white w-full ${getStatusColor(bug.status)}`}
                                    value={bug.status}
                                    onChange={(e) => handleStatusChange(bug.id, date, e.target.value)}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                    <option value="custom">+ Add New Status</option>
                                </select>
                            </td>
                            <td className={`border border-gray-300 p-0 whitespace-nowrap ${getPriorityColor(bug.priority)}`}>
                                <select
                                    className={`p-1 text-white w-full ${getPriorityColor(bug.priority)}`}
                                    value={bug.priority}
                                    onChange={(e) => handlePriorityChange(bug.id, date, e.target.value)}
                                >
                                    {priorityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </td>
                            <td className={`border border-gray-300 p-0 whitespace-nowrap ${getSeverityColor(bug.severity)}`}>
                                <select
                                    className={`p-1 text-white w-full ${getSeverityColor(bug.severity)}`}
                                    value={bug.severity}
                                    onChange={(e) => handleSeverityChange(bug.id, date, e.target.value)}
                                >
                                    {severityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.epic}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.testCase}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.caseStatus}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.dueDate}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.automated}</td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">
                                {bug.automationLink ? (
                                    <a href={bug.automationLink} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                        View Script
                                    </a>
                                ) : "N/A"}
                            </td>
                            <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.creationLog}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BugTable;