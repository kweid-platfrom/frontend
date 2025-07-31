'use client'

import { useState, useMemo } from 'react';
import { List, Table, ChevronUp, ChevronDown } from 'lucide-react';

export default function BugFilterBar({ filters, onFiltersChange, bugs, viewMode, setViewMode }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract unique values for filter options
    const filterOptions = useMemo(() => {
        const statuses = [...new Set(bugs.map(bug => bug.status))];
        const severities = [...new Set(bugs.map(bug => bug.severity))];
        const priorities = [...new Set(bugs.map(bug => bug.priority))];
        const assignees = [...new Set(bugs.map(bug => bug.assignee).filter(Boolean))];
        const reporters = [...new Set(bugs.map(bug => bug.reporter).filter(Boolean))];
        const allTags = [...new Set(bugs.flatMap(bug => bug.tags || []))];

        return { statuses, severities, priorities, assignees, reporters, allTags };
    }, [bugs]);

    const handleFilterChange = (key, value) => {
        onFiltersChange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleTagToggle = (tag) => {
        const currentTags = filters.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        
        handleFilterChange('tags', newTags);
    };

    const clearFilters = () => {
        onFiltersChange({
            status: 'all',
            severity: 'all',
            priority: 'all',
            assignee: 'all',
            reporter: 'all',
            tags: [],
            search: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.status !== 'all' || 
               filters.severity !== 'all' || 
               filters.priority !== 'all' || 
               filters.assignee !== 'all' || 
               filters.reporter !== 'all' || 
               (filters.tags && filters.tags.length > 0) || 
               filters.search !== '';
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.status !== 'all') count++;
        if (filters.severity !== 'all') count++;
        if (filters.priority !== 'all') count++;
        if (filters.assignee !== 'all') count++;
        if (filters.reporter !== 'all') count++;
        if (filters.tags && filters.tags.length > 0) count++;
        if (filters.search !== '') count++;
        return count;
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
            {/* Search and Quick Filters Row */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                {/* Search Bar */}
                <div className="flex-1 min-w-64 max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search bugs..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-10 ${
                                filters.search 
                                    ? 'bg-teal-50 border-teal-500' 
                                    : 'border-gray-300'
                            }`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 min-w-32 ${
                            filters.status !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-gray-300'
                        }`}
                    >
                        <option value="all">All</option>
                        {filterOptions.statuses.map(status => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Severity:</label>
                    <select
                        value={filters.severity}
                        onChange={(e) => handleFilterChange('severity', e.target.value)}
                        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 min-w-32 ${
                            filters.severity !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-gray-300'
                        }`}
                    >
                        <option value="all">All</option>
                        {filterOptions.severities.map(severity => (
                            <option key={severity} value={severity}>
                                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Priority:</label>
                    <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 min-w-32 ${
                            filters.priority !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-gray-300'
                        }`}
                    >
                        <option value="all">All</option>
                        {filterOptions.priorities.map(priority => (
                            <option key={priority} value={priority}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Assignee:</label>
                    <select
                        value={filters.assignee}
                        onChange={(e) => handleFilterChange('assignee', e.target.value)}
                        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 min-w-40 ${
                            filters.assignee !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-gray-300'
                        }`}
                    >
                        <option value="all">All</option>
                        <option value="">Unassigned</option>
                        {filterOptions.assignees.map(assignee => (
                            <option key={assignee} value={assignee}>
                                {assignee}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons and View Toggle */}
                <div className="flex items-center gap-2 ml-auto">
                    {hasActiveFilters() && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium h-10"
                        >
                            Clear Filters ({getActiveFiltersCount()})
                        </button>
                    )}
                    
                    {/* View Mode Buttons - Enhanced for smooth transition */}
                    <div className="flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                                viewMode === 'list'
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            } border rounded-l-md h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                                viewMode === 'table'
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            } border border-l-0 rounded-r-md h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            title="Table View"
                        >
                            <Table className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-gray-200 rounded h-10 flex items-center justify-center"
                        title={isExpanded ? 'Hide additional filters' : 'Show additional filters'}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="border-t pt-4">
                    <div className="space-y-4">
                        {/* Tags Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Tags:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {filterOptions.allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                            filters.tags && filters.tags.includes(tag)
                                                ? 'bg-teal-100 text-teal-800 border-teal-300'
                                                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {filterOptions.allTags.length === 0 && (
                                    <p className="text-sm text-gray-500">No tags available</p>
                                )}
                            </div>
                        </div>

                        {/* Advanced Search Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reporter:
                                </label>
                                <select
                                    value={filters.reporter || 'all'}
                                    onChange={(e) => handleFilterChange('reporter', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10"
                                >
                                    <option value="all">All</option>
                                    <option value="">Unreported</option>
                                    {filterOptions.reporters.map(reporter => (
                                        <option key={reporter} value={reporter}>
                                            {reporter}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bug Type:
                                </label>
                                <select
                                    value={filters.bugType || 'all'}
                                    onChange={(e) => handleFilterChange('bugType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10"
                                >
                                    <option value="all">All</option>
                                    <option value="functional">Functional</option>
                                    <option value="ui">UI/UX</option>
                                    <option value="performance">Performance</option>
                                    <option value="security">Security</option>
                                    <option value="compatibility">Compatibility</option>
                                    <option value="data">Data</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Updated:
                                </label>
                                <select
                                    value={filters.lastUpdated || 'all'}
                                    onChange={(e) => handleFilterChange('lastUpdated', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
                <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">Active filters:</span>
                        
                        {filters.status !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Status: {filters.status}
                                <button
                                    onClick={() => handleFilterChange('status', 'all')}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.severity !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Severity: {filters.severity}
                                <button
                                    onClick={() => handleFilterChange('severity', 'all')}
                                    className="ml-1 text-red-600 hover:text-red-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.priority !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Priority: {filters.priority}
                                <button
                                    onClick={() => handleFilterChange('priority', 'all')}
                                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.assignee !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Assignee: {filters.assignee || 'Unassigned'}
                                <button
                                    onClick={() => handleFilterChange('assignee', 'all')}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.reporter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                Reporter: {filters.reporter || 'Unreported'}
                                <button
                                    onClick={() => handleFilterChange('reporter', 'all')}
                                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.tags && filters.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Tag: {tag}
                                <button
                                    onClick={() => handleTagToggle(tag)}
                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        
                        {filters.search && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Search: {filters.search}
                                <button
                                    onClick={() => handleFilterChange('search', '')}
                                    className="ml-1 text-gray-600 hover:text-gray-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}