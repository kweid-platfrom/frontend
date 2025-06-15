import React from 'react';
import { Filter, List, Table, Calendar, User, Flag, AlertTriangle, Clock } from "lucide-react";
import { BugAntIcon } from "@heroicons/react/24/outline";

const BugTrackerHeader = ({
    bugs,
    showFilters,
    setShowFilters,
    getActiveFilterCount,
    clearFilters,
    groupBy,
    setGroupBy,
    subGroupBy, 
    setSubGroupBy,
    viewMode,
    setViewMode
}) => {
    // Grouping options
    const groupingOptions = [
        { value: 'none', label: 'No Grouping', icon: List },
        { value: 'status', label: 'Status', icon: Clock },
        { value: 'severity', label: 'Severity', icon: AlertTriangle },
        { value: 'assignee', label: 'Assignee', icon: User },
        { value: 'sprint', label: 'Sprint', icon: Flag },
        { value: 'month', label: 'Month', icon: Calendar }
    ];

    const subGroupingOptions = [
        { value: 'none', label: 'No Sub-grouping' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' }
    ];

    return (
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white">
            <div>
                <h1 className="flex items-center text-3xl font-bold text-gray-900">
                    <BugAntIcon className="h-6 w-6 mr-2" />
                    Bug Tracker
                    <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                        {bugs.length} {bugs.length === 1 ? "bug" : "bugs"}
                    </span>
                </h1>
            </div>

            <div className="flex items-center space-x-2">
                {/* Grouping Controls */}
                <div className="flex items-center space-x-2">
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                    >
                        {groupingOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {(groupBy === 'sprint' || groupBy === 'month') && (
                        <select
                            value={subGroupBy}
                            onChange={(e) => setSubGroupBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                        >
                            {subGroupingOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center px-3 py-2 text-sm transition-colors ${
                            viewMode === 'list'
                                ? 'bg-[#00897B] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <List className="h-4 w-4 mr-1" />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center px-3 py-2 text-sm transition-colors border-l ${
                            viewMode === 'table'
                                ? 'bg-[#00897B] text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Table className="h-4 w-4 mr-1" />
                        Table
                    </button>
                </div>

                {/* Filter Controls */}
                {getActiveFilterCount() > 0 && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Clear filters
                    </button>
                )}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${showFilters
                        ? 'bg-[#00897B] text-white border-[#00897B]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white text-[#00897B] rounded-full text-xs font-medium">
                            {getActiveFilterCount()}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BugTrackerHeader;