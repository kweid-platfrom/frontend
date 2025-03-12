// components/BugGroup.js
"use client"
import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import BugTable from "./bugTable";

const BugGroup = ({
    date,
    bugs,
    expandedGroups,
    groupColors,
    editingTitle,
    selectedBugs,
    teamMembers,
    statusOptions,
    priorityOptions,
    severityOptions,
    toggleGroup,
    changeGroupColor,
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
    getStatusColor,
    getPriorityColor,
    getSeverityColor,
    openBugDetails
}) => {
    return (
        <div
            className="bg-white shadow rounded overflow-hidden"
            style={{
                borderLeft: `6px solid ${groupColors[date] || '#cccccc'}`
            }}
        >
            <div
                className="flex items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors"
                style={{ backgroundColor: `${groupColors[date] || '#cccccc'}20` }}
            >
                {expandedGroups[date] ?
                    <ChevronDown
                        size={20}
                        className="cursor-pointer mr-2"
                        onClick={() => toggleGroup(date)}
                    /> :
                    <ChevronRight
                        size={20}
                        className="cursor-pointer mr-2"
                        onClick={() => toggleGroup(date)}
                    />
                }
                <div
                    className="w-4 h-4 mr-2 cursor-pointer border border-gray-400"
                    style={{ backgroundColor: groupColors[date] || '#cccccc' }}
                    onClick={() => changeGroupColor(date)}
                ></div>
                <h3
                    className="text-lg font-bold"
                    style={{ color: groupColors[date] || '#cccccc' }}
                    onClick={() => toggleGroup(date)}
                >
                    Issues {date}
                </h3>
            </div>

            {expandedGroups[date] && (
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
                />
            )}
        </div>
    );
};

export default BugGroup;