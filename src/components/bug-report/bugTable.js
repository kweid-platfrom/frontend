"use client"
import React, { useState } from "react";
import { MessageSquare, Check } from "lucide-react";
import Image from "next/image";

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
    openBugDetails,
    addNewStatus
}) => {
    const [newStatusValues, setNewStatusValues] = useState({});
    const [showNewStatusInput, setShowNewStatusInput] = useState({});

    const handleNewStatusChange = (bugId, value) => {
        setNewStatusValues({
            ...newStatusValues,
            [bugId]: value
        });
    };

    const saveNewStatus = (bugId, date) => {
        if (newStatusValues[bugId] && newStatusValues[bugId].trim() !== "") {
            addNewStatus(newStatusValues[bugId]);
            handleStatusChange(bugId, date, newStatusValues[bugId]);
            setShowNewStatusInput({
                ...showNewStatusInput,
                [bugId]: false
            });
            setNewStatusValues({
                ...newStatusValues,
                [bugId]: ""
            });
        }
    };

    return (
        <div className="overflow-x-auto w-full">
            <table className="min-w-full table-auto border-collapse text-left">
                <thead>
                    <tr className="bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider">
                        <th className="border-b border-gray-300 p-2 w-8 sticky left-0 bg-gray-50 z-10">
                            <input
                                type="checkbox"
                                className="w-4 h-4 cursor-pointer"
                                checked={isAllInGroupSelected}
                                onChange={(e) => handleSelectAllInGroup(date, e.target.checked)}
                            />
                        </th>
                        <th className="border-b border-gray-300 p-2 sticky left-8 bg-gray-50 z-10 min-w-64">Bug/Defect Title</th>
                        <th className="border-b border-gray-300 p-2">Issue ID</th>
                        <th className="border-b border-gray-300 p-2">Issue Category</th>
                        <th className="border-b border-gray-300 p-2">Assign To</th>
                        <th className="border-b border-gray-300 p-2 min-w-32">Status</th>
                        <th className="border-b border-gray-300 p-2 min-w-32">Priority</th>
                        <th className="border-b border-gray-300 p-2 min-w-32">Severity</th>
                        <th className="border-b border-gray-300 p-2">Epic</th>
                        <th className="border-b border-gray-300 p-2">Test Case</th>
                        <th className="border-b border-gray-300 p-2">Case Status</th>
                        <th className="border-b border-gray-300 p-2">Due Date</th>
                        <th className="border-b border-gray-300 p-2">Automated</th>
                        <th className="border-b border-gray-300 p-2">Link to Automated Scripts</th>
                        <th className="border-b border-gray-300 p-2">Reported By</th>
                        <th className="border-b border-gray-300 p-2">Creation Log</th>
                    </tr>
                </thead>
                <tbody>
                    {bugs.map(bug => (
                        <tr key={bug.id} className="hover:bg-gray-50 text-sm">
                            <td className="border-b border-gray-300 p-2 text-center sticky left-0 bg-white z-10">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer"
                                    checked={selectedBugs.includes(`${date}-${bug.id}`)}
                                    onChange={() => handleBugSelection(bug.id, date)}
                                />
                            </td>
                            <td className="border-b border-gray-300 p-2 sticky left-8 bg-white z-10">
                                <div className="flex items-center">
                                    {editingTitle === bug.id ? (
                                        <input
                                            type="text"
                                            className="border border-gray-300 p-1 mr-2 flex-grow rounded"
                                            value={bug.title}
                                            onChange={(e) => handleTitleEdit(bug.id, date, e)}
                                            onBlur={handleTitleEditEnd}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTitleEditEnd()}
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            className="mr-2 cursor-pointer text-blue-600 hover:text-blue-800 truncate max-w-56"
                                            onDoubleClick={() => handleTitleEditStart(bug.id)}
                                            title={bug.title}
                                        >
                                            {bug.title}
                                        </span>
                                    )}
                                    <MessageSquare
                                        size={16}
                                        className="text-gray-500 cursor-pointer hover:text-blue-500 flex-shrink-0"
                                        onClick={() => openBugDetails(bug)}
                                        title="View bug details"
                                    />
                                </div>
                            </td>
                            <td className="border-b border-gray-300 p-2 font-mono text-xs">{bug.id}</td>
                            <td className="border-b border-gray-300 p-2">{bug.category}</td>
                            <td className="border-b border-gray-300 p-2">
                                <select
                                    className="p-1 w-full rounded text-sm border border-gray-200"
                                    value={bug.assignedTo}
                                    onChange={(e) => handleAssigneeChange(bug.id, date, e.target.value)}
                                >
                                    <option value="unassigned">Unassigned</option>
                                    {teamMembers.map(member => {
                                        // Handling different member formats
                                        if (typeof member === 'object') {
                                            return (
                                                <option key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName || ''}
                                                </option>
                                            );
                                        }
                                        return (
                                            <option key={member} value={member}>{member}</option>
                                        );
                                    })}
                                </select>
                                {/* Display avatar and name for assigned team member */}
                                {bug.assignedTo !== "unassigned" && (
                                    <div className="flex items-center mt-1">
                                        {teamMembers.map(member => {
                                            if ((typeof member === 'object' && member.id === bug.assignedTo) || 
                                                (typeof member === 'string' && member === bug.assignedTo)) {
                                                const avatarSrc = typeof member === 'object' ? member.avatar : null;
                                                const name = typeof member === 'object' ? member.firstName : member;
                                                
                                                return (
                                                    <div key={bug.assignedTo} className="flex items-center">
                                                        {avatarSrc ? (
                                                            <div className="w-6 h-6 rounded-full overflow-hidden mr-1">
                                                                <Image 
                                                                    src={avatarSrc} 
                                                                    alt={name} 
                                                                    width={24}
                                                                    height={24}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-1">
                                                                <span className="text-xs">{name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        <span className="text-xs">{name}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                )}
                            </td>
                            <td className="border-b border-gray-300 p-0">
                                {showNewStatusInput[bug.id] ? (
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            className="p-1 flex-grow rounded text-black border border-gray-300"
                                            value={newStatusValues[bug.id] || ""}
                                            onChange={(e) => handleNewStatusChange(bug.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveNewStatus(bug.id, date)}
                                            placeholder="New status..."
                                            autoFocus
                                        />
                                        <button
                                            className="p-1 ml-1"
                                            onClick={() => saveNewStatus(bug.id, date)}
                                        >
                                            <Check className="h-4 w-4 text-green-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        className={`p-1 w-full h-full rounded text-white ${getStatusColor(bug.status)}`}
                                        value={bug.status}
                                        onChange={(e) => {
                                            if (e.target.value === "custom") {
                                                setShowNewStatusInput({
                                                    ...showNewStatusInput,
                                                    [bug.id]: true
                                                });
                                            } else {
                                                handleStatusChange(bug.id, date, e.target.value);
                                            }
                                        }}
                                        style={{ border: "none" }}
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                        <option value="custom">+ Add New Status</option>
                                    </select>
                                )}
                            </td>
                            <td className="border-b border-gray-300 p-0">
    <select
        className={`p-1 w-full h-full rounded text-white ${getPriorityColor(bug.priority)}`}
        value={bug.priority}
        onChange={(e) => handlePriorityChange(bug.id, date, e.target.value)}
        style={{ border: "none" }}
    >
        {priorityOptions.map(option => (
            <option key={option} value={option}>{option}</option>
        ))}
    </select>
</td>
                            <td className="border-b border-gray-300 p-0">
                                <select
                                    className={`p-1 w-full h-full rounded text-white ${getSeverityColor(bug.severity)}`}
                                    value={bug.severity}
                                    onChange={(e) => handleSeverityChange(bug.id, date, e.target.value)}
                                    style={{ border: "none" }}
                                >
                                    {severityOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="border-b border-gray-300 p-2">{bug.epic || "-"}</td>
                            <td className="border-b border-gray-300 p-2">{bug.testCase || "-"}</td>
                            <td className="border-b border-gray-300 p-2">{bug.caseStatus || "-"}</td>
                            <td className="border-b border-gray-300 p-2">{bug.dueDate || "-"}</td>
                            <td className="border-b border-gray-300 p-2 text-center">
                                {bug.automated ? (
                                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td className="border-b border-gray-300 p-2">
                                {bug.automationLink ? (
                                    <a 
                                        href={bug.automationLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-700 underline"
                                    >
                                        View Script
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td className="border-b border-gray-300 p-2 text-xs text-gray-500">
                                {bug.creationLog || "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BugTable;