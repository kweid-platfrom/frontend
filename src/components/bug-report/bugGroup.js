// components/bug-report/bugGroup.jsx
import React from "react";
import { ChevronDown, ChevronUp, RefreshCw, MessageSquare } from "lucide-react";

const BugGroup = ({ 
    date, 
    bugs, 
    expanded, 
    groupColor, 
    onToggleExpand, 
    onChangeColor, 
    teamMembers, 
    statusOptions, 
    priorityOptions, 
    severityOptions, 
    selectedBugs, 
    editingTitle, 
    getStatusColor, 
    getPriorityColor, 
    getSeverityColor, 
    isAllInGroupSelected, 
    handleSelectAllInGroup, 
    handleBugSelection, 
    handleTitleEditStart, 
    handleTitleEdit, 
    handleTitleEditEnd, 
    handleAssigneeChange, 
    handleStatusChange, 
    handlePriorityChange, 
    handleSeverityChange, 
    openBugDetails, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addNewStatus 
}) => {
    // Format date for display
    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Find team member by ID
    const findTeamMember = (id) => {
        if (id === "unassigned") return { firstName: "Unassigned", lastName: "", avatar: null };
        return teamMembers.find(member => member.id === id) || { firstName: "Unknown", lastName: "", avatar: null };
    };

    return (
        <div className="mb-6 border rounded-md shadow-sm overflow-hidden">
            {/* Group header */}
            <div 
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={onToggleExpand}
                style={{ backgroundColor: groupColor, color: 'white' }}
            >
                <div className="flex items-center space-x-2">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <h3 className="font-medium">{formatDate(date)}</h3>
                    <span className="text-sm">({bugs.length} bugs)</span>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onChangeColor();
                        }}
                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>
            
            {/* Group content */}
            {expanded && (
                <div className="bg-white">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b text-sm font-medium text-gray-600">
                        <div className="col-span-1 flex items-center">
                            <input 
                                type="checkbox" 
                                checked={isAllInGroupSelected}
                                onChange={(e) => handleSelectAllInGroup(date, e.target.checked)}
                                className="rounded"
                            />
                        </div>
                        <div className="col-span-3">Title</div>
                        <div className="col-span-2">Assigned To</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1">Priority</div>
                        <div className="col-span-1">Severity</div>
                        <div className="col-span-3">Creation Info</div>
                    </div>
                    
                    {/* Bug rows */}
                    {bugs.map((bug) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const assignee = findTeamMember(bug.assignedTo);
                        const isSelected = selectedBugs.includes(`${date}-${bug.id}`);
                        
                        return (
                            <div 
                                key={bug.id}
                                className={`grid grid-cols-12 gap-2 p-3 border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                            >
                                {/* Checkbox */}
                                <div className="col-span-1 flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => handleBugSelection(bug.id, date)}
                                        className="rounded"
                                    />
                                </div>
                                
                                {/* Title */}
                                <div className="col-span-3 flex items-center">
                                    {editingTitle === bug.id ? (
                                        <input 
                                            type="text" 
                                            value={bug.title}
                                            onChange={(e) => handleTitleEdit(bug.id, date, e)}
                                            onBlur={handleTitleEditEnd}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTitleEditEnd()}
                                            className="w-full p-1 border rounded"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center w-full">
                                            <span 
                                                className="flex-grow cursor-pointer hover:underline"
                                                onClick={() => handleTitleEditStart(bug.id)}
                                            >
                                                {bug.id}: {bug.title}
                                            </span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openBugDetails(bug);
                                                }}
                                                className="ml-2 text-gray-500 hover:text-blue-500"
                                                title="Open bug details"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Assigned To */}
                                <div className="col-span-2">
                                    <select 
                                        value={bug.assignedTo}
                                        onChange={(e) => handleAssigneeChange(bug.id, date, e.target.value)}
                                        className="w-full p-1 border rounded text-sm"
                                    >
                                        <option value="unassigned">Unassigned</option>
                                        {teamMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.firstName} {member.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Status */}
                                <div className="col-span-1">
                                    <select 
                                        value={bug.status}
                                        onChange={(e) => handleStatusChange(bug.id, date, e.target.value)}
                                        className="w-full p-1 border rounded text-sm text-white"
                                        style={{ backgroundColor: getStatusColor(bug.status) }}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Priority */}
                                <div className="col-span-1">
                                    <select 
                                        value={bug.priority}
                                        onChange={(e) => handlePriorityChange(bug.id, date, e.target.value)}
                                        className="w-full p-1 border rounded text-sm text-white"
                                        style={{ backgroundColor: getPriorityColor(bug.priority) }}
                                    >
                                        {priorityOptions.map(priority => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Severity */}
                                <div className="col-span-1">
                                    <select 
                                        value={bug.severity}
                                        onChange={(e) => handleSeverityChange(bug.id, date, e.target.value)}
                                        className="w-full p-1 border rounded text-sm text-white"
                                        style={{ backgroundColor: getSeverityColor(bug.severity) }}
                                    >
                                        {severityOptions.map(severity => (
                                            <option key={severity} value={severity}>
                                                {severity}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Creation Info */}
                                <div className="col-span-3 text-sm text-gray-500">
                                    {bug.creationLog}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BugGroup;