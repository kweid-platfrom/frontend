import React from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import BugTable from "./bugTable";

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
    addNewStatus 
}) => {
    // Format date for display - showing month and year format
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long' };
        return new Date(dateString + "-01").toLocaleDateString(undefined, options);
    };

    return (
        <div className="mb-6 border rounded-md shadow-sm overflow-hidden flex">
            {/* Color strip on the left */}
            <div 
                className="w-2" 
                style={{ backgroundColor: groupColor }}
            ></div>
            
            {/* Group header */}
            <div className="flex-grow">
                <div 
                    className="flex items-center justify-between p-3 bg-white border-b cursor-pointer"
                    onClick={onToggleExpand}
                >
                    <div className="flex items-center space-x-2">
                        {/* Color changer moved before chevron */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onChangeColor();
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <RefreshCw size={16} />
                        </button>
                        
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        <h3 className="font-medium" style={{ color: groupColor }}>{formatDate(date)}</h3>
                        <span className="text-sm text-gray-600">({bugs.length} bugs)</span>
                    </div>
                </div>
                
                {/* Group content */}
                {expanded && (
                    <div className="bg-white">
                        <div className="overflow-x-auto scrollbar-custom">
                            <BugTable 
                                bugs={bugs}
                                date={date}
                                editingTitle={editingTitle}
                                selectedBugs={selectedBugs}
                                teamMembers={teamMembers}
                                statusOptions={statusOptions}
                                priorityOptions={priorityOptions}
                                severityOptions={severityOptions}
                                getStatusColor={getStatusColor}
                                getPriorityColor={getPriorityColor}
                                getSeverityColor={getSeverityColor}
                                isAllInGroupSelected={isAllInGroupSelected}
                                handleSelectAllInGroup={handleSelectAllInGroup}
                                handleBugSelection={handleBugSelection}
                                handleTitleEdit={handleTitleEdit}
                                handleTitleEditStart={handleTitleEditStart}
                                handleTitleEditEnd={handleTitleEditEnd}
                                handleAssigneeChange={handleAssigneeChange}
                                handleStatusChange={handleStatusChange}
                                handlePriorityChange={handlePriorityChange}
                                handleSeverityChange={handleSeverityChange}
                                openBugDetails={openBugDetails}
                                addNewStatus={addNewStatus}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugGroup;