import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import BugItem from "../bug-report/BugItem";

const BugGroup = ({ 
    groupName, 
    bugs, 
    color, 
    isCollapsed, 
    toggleCollapse, 
    expandedBug, 
    setExpandedBug, 
    updateBugStatus,
    teamMembers
}) => {
    const [selectedBugs, setSelectedBugs] = useState([]);

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBugs(bugs.map(bug => bug.id));
        } else {
            setSelectedBugs([]);
        }
    };

    const toggleBugSelection = (bugId) => {
        setSelectedBugs(prev => 
            prev.includes(bugId) 
                ? prev.filter(id => id !== bugId) 
                : [...prev, bugId]
        );
    };

    return (
        <div className="mb-8 border rounded-md overflow-hidden">
            {/* Group Header with color stripe */}
            <div className="flex items-center border-b bg-gray-50">
                <div className={`${color} w-2 self-stretch`}></div>
                <button 
                    className="p-3 flex items-center flex-grow font-medium text-gray-700 hover:bg-gray-100"
                    onClick={toggleCollapse}
                >
                    {isCollapsed ? 
                        <ChevronRight className="h-4 w-4 mr-2" /> : 
                        <ChevronDown className="h-4 w-4 mr-2" />
                    }
                    <span className={`font-medium ${color.replace('bg-', 'text-').replace('-500', '-700')}`}>
                        {groupName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {bugs.length}
                    </span>
                </button>
            </div>

            {!isCollapsed && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th scope="col" className="w-10 p-3">
                                    <input 
                                        type="checkbox" 
                                        className="rounded"
                                        onChange={toggleSelectAll}
                                        checked={selectedBugs.length === bugs.length && bugs.length > 0}
                                    />
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-100 whitespace-nowrap">
                                    Defect Title
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    BugID
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Category
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Assign To
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Severity
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Priority
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Epic
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Test Case
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Test Status
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Due Date
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Automated
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Script Link
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Created By
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    Creation Log
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bugs.map((bug) => (
                                <BugItem
                                    key={bug.id}
                                    bug={bug}
                                    isSelected={selectedBugs.includes(bug.id)}
                                    toggleSelection={() => toggleBugSelection(bug.id)}
                                    isExpanded={expandedBug === bug.id}
                                    toggleExpand={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                                    updateBugStatus={updateBugStatus}
                                    teamMembers={teamMembers}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BugGroup;