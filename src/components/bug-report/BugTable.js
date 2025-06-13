import React from 'react';
import { GripVertical } from 'lucide-react';

const BugTable = ({ 
    bugs, 
    selectedBugs, 
    onBugSelect, 
    selectedBug, 
    toggleBugSelection, 
    toggleGroupSelection, 
    allGroupSelected, 
    isGroupSelected, 
    handleDragStart, 
    getSeverityColor, 
    getStatusColor, 
    getPriorityFromSeverity, 
    formatDate, 
    getTeamMemberName, 
    updateBugStatus 
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="w-10 p-3">
                            {toggleGroupSelection && (
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                    onChange={toggleGroupSelection}
                                    checked={allGroupSelected}
                                    ref={(input) => {
                                        if (input) input.indeterminate = isGroupSelected && !allGroupSelected;
                                    }}
                                />
                            )}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap border-r border-gray-300 w-[300px] min-w-[300px] max-w-[300px]">
                            Defect Title
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            BugID
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Category
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Assign To
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Status
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Severity
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Priority
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Due Date
                        </th>
                        <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                            Created
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-8">
                            
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bugs.map((bug) => {
                        const priority = getPriorityFromSeverity 
                            ? getPriorityFromSeverity(bug.severity) 
                            : { level: bug.priority || 'Medium', color: 'bg-yellow-100 text-yellow-800' };
                        
                        return (
                            <tr
                                key={bug.id}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                    selectedBug?.id === bug.id ? 'bg-blue-50' : ''
                                } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => onBugSelect(bug)}
                                draggable
                                onDragStart={(e) => handleDragStart && handleDragStart(e, bug)}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedBugs.includes(bug.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleBugSelection(bug.id);
                                        }}
                                        className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                    />
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 w-[300px] min-w-[300px] max-w-[300px]">
                                    <div className="truncate">
                                        <div className="font-medium text-gray-900 truncate">{bug.title}</div>
                                        <div className="text-sm text-gray-500 truncate">{bug.description}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                    #{bug.id?.slice(-6) || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                    {bug.category || 'Uncategorized'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                    {getTeamMemberName(bug.assignedTo)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                    {updateBugStatus ? (
                                        <select
                                            value={bug.status || 'new'}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                updateBugStatus(bug.id, e.target.value);
                                            }}
                                            className={`text-xs px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-[#00897B] ${getStatusColor(bug.status)}`}
                                        >
                                            <option value="new">New</option>
                                            <option value="in progress">In Progress</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                                            {bug.status || 'New'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                                        {bug.severity || 'Low'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                                        {priority.level}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                    {formatDate(bug.dueDate)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                                    {formatDate(bug.createdAt)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default BugTable;