// components/bug-report/bugGroup.js
import React from "react";
import { ChevronRight, ChevronDown, Palette } from "lucide-react";


const BugGroup = ({
    date,
    bugs,
    expanded,
    groupColor,
    onToggleExpand,
    onChangeColor,
    teamMembers,
    editingTitle,
    onTitleEditStart,
    onTitleEdit,
    onTitleEditEnd,
    onAssigneeChange,
    onStatusChange,
    onPriorityChange,
    onSeverityChange,
    statusOptions,
    priorityOptions,
    severityOptions,
    selectedBugs,
    onBugSelection,
    isAllSelected,
    onSelectAll
}) => {
    // Format the date to a more readable format
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="mb-4">
            {/* Group header */}
            <div 
                className="flex items-center p-3 border rounded-md cursor-pointer"
                style={{ borderLeftColor: groupColor, borderLeftWidth: '4px' }}
            >
                {/* Expand/collapse button */}
                <button 
                    onClick={onToggleExpand}
                    className="mr-2"
                >
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {/* Group title */}
                <div className="flex-1 font-medium">{formattedDate} ({bugs.length})</div>
                
                {/* Group actions */}
                <button 
                    onClick={onChangeColor}
                    className="p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    title="Change group color"
                >
                    <Palette size={18} />
                </button>
                
                {/* Group selection checkbox */}
                <input 
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="ml-2"
                />
            </div>
            
            {/* Bug list - only display when expanded */}
            {expanded && (
                <div className="mt-2 border rounded-md overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="p-2 text-left">Select</th>
                                <th className="p-2 text-left">ID</th>
                                <th className="p-2 text-left">Title</th>
                                <th className="p-2 text-left">Assignee</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Priority</th>
                                <th className="p-2 text-left">Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bugs.map((bug) => {
                                const bugKey = `${date}-${bug.id}`;
                                const isSelected = selectedBugs.includes(bugKey);
                                const assignee = bug.assignedTo !== "unassigned" 
                                    ? teamMembers.find(member => member.id === bug.assignedTo)
                                    : null;
                                    
                                return (
                                    <tr 
                                        key={bug.id}
                                        className={`border-t ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        {/* Selection checkbox */}
                                        <td className="p-2">
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onBugSelection(bug.id)}
                                            />
                                        </td>
                                        
                                        {/* Bug ID */}
                                        <td className="p-2 font-mono text-sm">{bug.id}</td>
                                        
                                        {/* Bug title - editable */}
                                        <td className="p-2">
                                            {editingTitle === bug.id ? (
                                                <input 
                                                    type="text"
                                                    value={bug.title}
                                                    onChange={(e) => onTitleEdit(bug.id, e)}
                                                    onBlur={onTitleEditEnd}
                                                    onKeyDown={(e) => e.key === 'Enter' && onTitleEditEnd()}
                                                    className="w-full p-1 border rounded"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => onTitleEditStart(bug.id)}
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    {bug.title}
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Assignee dropdown */}
                                        <td className="p-2">
                                            <select
                                                value={bug.assignedTo}
                                                onChange={(e) => onAssigneeChange(bug.id, e.target.value)}
                                                className="p-1 border rounded bg-transparent"
                                            >
                                                <option value="unassigned">Unassigned</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.firstName} {member.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        
                                        {/* Status dropdown */}
                                        <td className="p-2">
                                            <select
                                                value={bug.status}
                                                onChange={(e) => onStatusChange(bug.id, e.target.value)}
                                                className={`p-1 border rounded text-white ${getStatusColor(bug.status)}`}
                                            >
                                                {statusOptions.map(status => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        
                                        {/* Priority dropdown */}
                                        <td className="p-2">
                                            <select
                                                value={bug.priority}
                                                onChange={(e) => onPriorityChange(bug.id, e.target.value)}
                                                className={`p-1 border rounded text-white ${getPriorityColor(bug.priority)}`}
                                            >
                                                {priorityOptions.map(priority => (
                                                    <option key={priority} value={priority}>
                                                        {priority}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        
                                        {/* Severity dropdown */}
                                        <td className="p-2">
                                            <select
                                                value={bug.severity}
                                                onChange={(e) => onSeverityChange(bug.id, e.target.value)}
                                                className={`p-1 border rounded text-white ${getSeverityColor(bug.severity)}`}
                                            >
                                                {severityOptions.map(severity => (
                                                    <option key={severity} value={severity}>
                                                        {severity}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Helper functions for status, priority, and severity colors
const getStatusColor = (status) => {
    switch (status) {
        case 'Open': return 'bg-blue-600';
        case 'In Progress': return 'bg-yellow-600';
        case 'Blocked': return 'bg-red-600';
        case 'Done': return 'bg-green-600';
        case 'Closed': return 'bg-gray-600';
        default: return 'bg-gray-600';
    }
};

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'Low': return 'bg-green-600';
        case 'Medium': return 'bg-yellow-600';
        case 'High': return 'bg-orange-600';
        case 'Critical': return 'bg-red-600';
        default: return 'bg-gray-600';
    }
};

const getSeverityColor = (severity) => {
    switch (severity) {
        case 'Minor': return 'bg-blue-600';
        case 'Major': return 'bg-orange-600';
        case 'Critical': return 'bg-red-600';
        case 'Blocker': return 'bg-purple-600';
        default: return 'bg-gray-600';
    }
};

export default BugGroup;