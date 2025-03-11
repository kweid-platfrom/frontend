"use client"
import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

const SelectionActionsModal = ({
    selectedCount,
    onClose,
    onStatusChange,
    onPriorityChange,
    onSeverityChange,
    onAssigneeChange,
    onMoveToGroup,
    onDelete,
    onExport,
    statusOptions,
    priorityOptions,
    severityOptions,
    groups,
    teamMembers,
    anchorPosition
}) => {
    const [activeTab, setActiveTab] = useState("status");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedSeverity, setSelectedSeverity] = useState("");
    const [selectedAssignee, setSelectedAssignee] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);
    const modalRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        onStatusChange(status);
        onClose();
    };

    const handlePriorityChange = (priority) => {
        setSelectedPriority(priority);
        onPriorityChange(priority);
        onClose();
    };

    const handleSeverityChange = (severity) => {
        setSelectedSeverity(severity);
        onSeverityChange(severity);
        onClose();
    };

    const handleAssigneeChange = (assignee) => {
        setSelectedAssignee(assignee);
        onAssigneeChange(assignee);
        onClose();
    };

    const handleMoveToGroup = (group) => {
        setSelectedGroup(group);
        onMoveToGroup(group);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedCount} item(s)?`)) {
            onDelete();
            onClose();
        }
    };

    const handleExport = () => {
        onExport();
        onClose();
    };

    // Position modal below the bug tracker
    const modalStyle = {
        top: anchorPosition ? `${anchorPosition.bottom + 10}px` : '50%',
        left: anchorPosition ? `${anchorPosition.left}px` : '50%',
        transform: anchorPosition ? 'none' : 'translate(-50%, -50%)'
    };

    return (
        <div className="fixed inset-0 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-lg w-64"
                style={modalStyle}
            >
                <div className="flex items-center justify-between p-2 border-b">
                    <h2 className="text-sm font-semibold">Bulk Actions ({selectedCount})</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="border-b">
                    <div className="flex flex-wrap">
                        <button
                            className={`px-2 py-1 text-xs ${activeTab === "status" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
                            onClick={() => setActiveTab("status")}
                        >
                            Status
                        </button>
                        <button
                            className={`px-2 py-1 text-xs ${activeTab === "priority" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
                            onClick={() => setActiveTab("priority")}
                        >
                            Priority
                        </button>
                        <button
                            className={`px-2 py-1 text-xs ${activeTab === "severity" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
                            onClick={() => setActiveTab("severity")}
                        >
                            Severity
                        </button>
                        <button
                            className={`px-2 py-1 text-xs ${activeTab === "assignee" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
                            onClick={() => setActiveTab("assignee")}
                        >
                            Assignee
                        </button>
                        <button
                            className={`px-2 py-1 text-xs ${activeTab === "group" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
                            onClick={() => setActiveTab("group")}
                        >
                            Group
                        </button>
                    </div>
                </div>

                <div className="p-2">
                    {activeTab === "status" && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="w-full p-2 border rounded flex justify-between items-center text-sm"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>{selectedStatus ? statusOptions.find(s => s.value === selectedStatus)?.label : "Select status"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {statusOptions.map((status) => (
                                        <button
                                            key={status.value}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                            onClick={() => handleStatusChange(status.value)}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "priority" && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="w-full p-2 border rounded flex justify-between items-center text-sm"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>{selectedPriority ? priorityOptions.find(p => p.value === selectedPriority)?.label : "Select priority"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {priorityOptions.map((priority) => (
                                        <button
                                            key={priority.value}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                            onClick={() => handlePriorityChange(priority.value)}
                                        >
                                            {priority.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "severity" && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="w-full p-2 border rounded flex justify-between items-center text-sm"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>{selectedSeverity ? severityOptions.find(s => s.value === selectedSeverity)?.label : "Select severity"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {severityOptions.map((severity) => (
                                        <button
                                            key={severity.value}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                            onClick={() => handleSeverityChange(severity.value)}
                                        >
                                            {severity.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "assignee" && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="w-full p-2 border rounded flex justify-between items-center text-sm"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>{selectedAssignee ? teamMembers.find(m => m.id === selectedAssignee)?.name : "Select assignee"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {teamMembers.map((member) => (
                                        <button
                                            key={member.id}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                            onClick={() => handleAssigneeChange(member.id)}
                                        >
                                            {member.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "group" && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="w-full p-2 border rounded flex justify-between items-center text-sm"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>{selectedGroup ? groups.find(g => g.id === selectedGroup)?.name : "Select group"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10 max-h-32 overflow-y-auto">
                                    {groups.map((group) => (
                                        <button
                                            key={group.id}
                                            className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                            onClick={() => handleMoveToGroup(group.id)}
                                        >
                                            {group.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-2 border-t flex justify-between">
                    <button
                        className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                    <button
                        className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded"
                        onClick={handleExport}
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectionActionsModal;