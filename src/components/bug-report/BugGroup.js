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
    openDetailsOverlay
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
                <>
                    {/* Group header row with column titles */}
                    <div className="p-3 bg-gray-100 flex items-center border-b">
                        <div className="w-10 flex justify-center">
                            <input 
                                type="checkbox" 
                                className="rounded"
                                onChange={toggleSelectAll}
                                checked={selectedBugs.length === bugs.length && bugs.length > 0}
                            />
                        </div>
                        <div className="flex-grow grid grid-cols-12 gap-2 text-xs text-gray-600 font-medium">
                            <div className="col-span-5">Title</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Severity</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-1">Date</div>
                        </div>
                    </div>

                    {/* Bug items */}
                    <div>
                        {bugs.map((bug) => (
                            <BugItem
                                key={bug.id}
                                bug={bug}
                                isSelected={selectedBugs.includes(bug.id)}
                                toggleSelection={() => toggleBugSelection(bug.id)}
                                isExpanded={expandedBug === bug.id}
                                toggleExpand={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                                updateBugStatus={updateBugStatus}
                                openDetailsOverlay={() => openDetailsOverlay(bug)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BugGroup;