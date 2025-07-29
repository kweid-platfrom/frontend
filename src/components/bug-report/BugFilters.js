'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, List, Table, User, Calendar, Flag, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BugFilters = ({ filters, setFilters, teamMembers, sprints, isExpanded, setIsExpanded, groupBy, setGroupBy, subGroupBy, setSubGroupBy, viewMode, setViewMode }) => {
    const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

    const categories = ['UI', 'Functionality', 'Performance', 'Security', 'Documentation', 'Other'];
    const statusOptions = ['New', 'In Progress', 'Blocked', 'Resolved', 'Closed'];
    const severityOptions = ['Critical', 'High', 'Medium', 'Low'];
    const dueDateOptions = [
        { value: 'overdue', label: 'Overdue' },
        { value: 'today', label: 'Due Today' },
        { value: 'this-week', label: 'Due This Week' },
        { value: 'no-due-date', label: 'No Due Date' },
    ];

    const groupingOptions = [
        { value: 'none', label: 'No Grouping', icon: List },
        { value: 'status', label: 'Status', icon: List },
        { value: 'severity', label: 'Severity', icon: AlertTriangle },
        { value: 'assignee', label: 'Assignee', icon: User },
        { value: 'sprint', label: 'Sprint', icon: Flag },
        { value: 'month', label: 'Month', icon: Calendar },
    ];

    const subGroupingOptions = [
        { value: 'none', label: 'No Sub-grouping' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
    ];

    // Validate teamMembers and sprints
    const validateOptions = (options, type) => {
        if (!Array.isArray(options)) {
            console.error(`${type} is not an array:`, options);
            return [];
        }
        return options.filter(opt => opt && typeof opt === 'object' && 'name' in opt && typeof opt.name === 'string');
    };

    const safeTeamMembers = validateOptions(teamMembers, 'teamMembers');
    const safeSprints = validateOptions(sprints, 'sprints');

    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters((prev) => ({ ...prev, searchTerm }));
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, setFilters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        toast.info(`Filtered by ${key}`);
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            status: 'all',
            severity: 'all',
            category: 'all',
            assignedTo: 'all',
            sprint: 'all',
            dueDate: 'all',
        });
        setSearchTerm('');
        toast.success('Filters cleared');
    };

    const FilterSelect = ({ label, value, options, onChange, placeholder = 'All' }) => (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent w-full ${
                    value !== 'all' ? 'bg-teal-50 border-[#00897B]' : ''
                }`}
                aria-label={label}
            >
                <option value="all">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value || option} value={option.value || option}>
                        {option.label || option}
                    </option>
                ))}
            </select>
        </div>
    );

    const hasActiveFilters = Object.values(filters).some((value) => value !== 'all' && value !== '');

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bugs by title, description, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent ${
                            searchTerm ? 'bg-teal-50 border-[#00897B]' : ''
                        }`}
                        aria-label="Search bugs"
                    />
                </div>

                {/* Grouping Dropdown */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Group by:</span>
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                        {groupingOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {(groupBy === 'sprint' || groupBy === 'month') && (
                        <select
                            value={subGroupBy}
                            onChange={(e) => setSubGroupBy(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            {subGroupingOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* View Mode Buttons */}
                <div className="flex">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-3 text-sm transition-colors ${
                            viewMode === 'list'
                                ? 'bg-teal-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        } border border-gray-300 rounded-l-md`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-3 text-sm transition-colors ${
                            viewMode === 'table'
                                ? 'bg-teal-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        } border border-l-0 border-gray-300 rounded-r-md`}
                    >
                        <Table className="h-4 w-4" />
                    </button>
                </div>

                {/* Expand/Collapse Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-gray-200 rounded"
                    aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            </div>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden w-full ${
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
                    <FilterSelect
                        label="Status"
                        value={filters.status}
                        options={statusOptions}
                        onChange={(value) => handleFilterChange('status', value)}
                    />
                    <FilterSelect
                        label="Severity"
                        value={filters.severity}
                        options={severityOptions}
                        onChange={(value) => handleFilterChange('severity', value)}
                    />
                    <FilterSelect
                        label="Category"
                        value={filters.category}
                        options={categories}
                        onChange={(value) => handleFilterChange('category', value)}
                    />
                    <FilterSelect
                        label="Assigned To"
                        value={filters.assignedTo}
                        options={[
                            { value: 'unassigned', label: 'Unassigned' },
                            ...safeTeamMembers.map((member) => ({
                                value: member.name,
                                label: member.name,
                            })),
                        ]}
                        onChange={(value) => handleFilterChange('assignedTo', value)}
                    />
                    <FilterSelect
                        label="Sprint"
                        value={filters.sprint}
                        options={safeSprints.map((sprint) => ({
                            value: sprint.id,
                            label: sprint.name,
                        }))}
                        onChange={(value) => handleFilterChange('sprint', value)}
                    />
                    <FilterSelect
                        label="Due Date"
                        value={filters.dueDate}
                        options={dueDateOptions}
                        onChange={(value) => handleFilterChange('dueDate', value)}
                    />
                </div>
                {hasActiveFilters && (
                    <div className="mt-4">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-[#00897B] hover:text-teal-700 focus:outline-none focus:underline"
                            aria-label="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugFilters;