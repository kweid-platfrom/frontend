'use client'

import { useState, useMemo } from 'react';
import { List, Table, ChevronUp, ChevronDown, Search, Filter, X } from 'lucide-react';

export default function BugFilterBar({ filters, onFiltersChange, bugs, viewMode, setViewMode }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Extract unique values for filter options
    const filterOptions = useMemo(() => {
        const statuses = [...new Set(bugs.map(bug => bug.status))];
        const severities = [...new Set(bugs.map(bug => bug.severity))];
        const assignees = [...new Set(bugs.map(bug => bug.assignee).filter(Boolean))];
        const reporters = [...new Set(bugs.map(bug => bug.reporter).filter(Boolean))];
        const allTags = [...new Set(bugs.flatMap(bug => bug.tags || []))];

        return { statuses, severities, assignees, reporters, allTags };
    }, [bugs]);

    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    }

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
            priority: 'all', // Added back to ensure compatibility with parent component
            assignee: 'all',
            reporter: 'all',
            tags: [],
            search: '',
            lastUpdated: 'all',
            bugType: 'all'
        });
    };

    const hasActiveFilters = () => {
        return filters.status !== 'all' ||
            filters.severity !== 'all' ||
            filters.assignee !== 'all' ||
            filters.reporter !== 'all' ||
            (filters.tags && filters.tags.length > 0) ||
            filters.search !== '' ||
            (filters.lastUpdated && filters.lastUpdated !== 'all') ||
            (filters.bugType && filters.bugType !== 'all');
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.status !== 'all') count++;
        if (filters.severity !== 'all') count++;
        if (filters.assignee !== 'all') count++;
        if (filters.reporter !== 'all') count++;
        if (filters.tags && filters.tags.length > 0) count++;
        if (filters.search !== '') count++;
        if (filters.lastUpdated && filters.lastUpdated !== 'all') count++;
        if (filters.bugType && filters.bugType !== 'all') count++;
        return count;
    };

    // Mobile Filter Modal
    const MobileFilterModal = () => (
        <div className={`
            fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out
            ${showMobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowMobileFilters(false)}
            />

            {/* Filter Panel */}
            <div className={`
                absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl max-h-[85vh] overflow-y-auto
                transform transition-transform duration-300 ease-in-out
                ${showMobileFilters ? 'translate-y-0' : 'translate-y-full'}
            `}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                        {hasActiveFilters() && (
                            <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                                {getActiveFiltersCount()}
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={() => setShowMobileFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Content */}
                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search bugs..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Quick Filters Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Statuses</option>
                                {filterOptions.statuses.map(status => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                            <select
                                value={filters.severity}
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Severities</option>
                                {filterOptions.severities.map(severity => (
                                    <option key={severity} value={severity}>
                                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                            <select
                                value={filters.assignee}
                                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Assignees</option>
                                <option value="">Unassigned</option>
                                {filterOptions.assignees.map(assignee => (
                                    <option key={assignee} value={assignee}>
                                        {assignee}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
                            <select
                                value={filters.reporter || 'all'}
                                onChange={(e) => handleFilterChange('reporter', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Reporters</option>
                                <option value="">Unreported</option>
                                {filterOptions.reporters.map(reporter => (
                                    <option key={reporter} value={reporter}>
                                        {reporter}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                            <select
                                value={filters.lastUpdated || 'all'}
                                onChange={(e) => handleFilterChange('lastUpdated', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bug Type</label>
                            <select
                                value={filters.bugType || 'all'}
                                onChange={(e) => handleFilterChange('bugType', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="all">All Types</option>
                                <option value="functional">Functional</option>
                                <option value="ui">UI/UX</option>
                                <option value="performance">Performance</option>
                                <option value="security">Security</option>
                                <option value="compatibility">Compatibility</option>
                                <option value="data">Data</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Tags {filters.tags && filters.tags.length > 0 && (
                                <span className="text-xs text-teal-600">({filters.tags.length} selected)</span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${filters.tags && filters.tags.includes(tag)
                                            ? 'bg-teal-100 text-teal-800 border-teal-300'
                                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            {filterOptions.allTags.length === 0 && (
                                <p className="text-sm text-gray-500 py-2">No tags available</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        {hasActiveFilters() && (
                            <button
                                onClick={() => {
                                    clearFilters();
                                    setShowMobileFilters(false);
                                }}
                                className="flex-1 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors"
                            >
                                Clear All Filters ({getActiveFiltersCount()})
                            </button>
                        )}
                        <button
                            onClick={() => setShowMobileFilters(false)}
                            className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4">
                {/* Mobile Layout */}
                <div className="block lg:hidden">
                    <div className="flex items-center gap-3 mb-3">
                        {/* Mobile Search Bar */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search bugs..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${filters.search
                                            ? 'bg-teal-50 border-teal-500'
                                            : 'border-gray-300'
                                        }`}
                                />
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className={`relative px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${hasActiveFilters()
                                    ? 'bg-teal-50 text-teal-700 border-teal-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            {hasActiveFilters() && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {getActiveFiltersCount()}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Mobile View Mode Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 text-sm transition-colors duration-200 ${viewMode === 'list'
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } border rounded-l-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500`}
                                title="List View"
                            >
                                <List className="h-4 w-4 mr-1" />
                                <span className="hidden xs:inline">List</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-2 text-sm transition-colors duration-200 ${viewMode === 'table'
                                        ? 'bg-teal-600 text-white border-teal-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } border border-l-0 rounded-r-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500`}
                                title="Table View"
                            >
                                <Table className="h-4 w-4 mr-1" />
                                <span className="hidden xs:inline">Table</span>
                            </button>
                        </div>

                        {hasActiveFilters() && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Clear ({getActiveFiltersCount()})
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Layout - Enhanced Responsiveness */}
                <div className="hidden lg:block">
                    {/* Search and Quick Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center lg:gap-4 mb-4 lg:flex-wrap">
                        {/* Search Bar */}
                        <div className="flex-1 min-w-0 md:min-w-64 lg:min-w-64 max-w-md lg:max-w-none">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search bugs..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-10 ${filters.search
                                            ? 'bg-teal-50 border-teal-500'
                                            : 'border-gray-300'
                                        }`}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Filters - Responsive Grid on Smaller Desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:gap-2 lg:flex-1 lg:justify-start mt-4 md:mt-0">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 flex-1 min-w-0 lg:min-w-32 ${filters.status !== 'all'
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
                                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 flex-1 min-w-0 lg:min-w-32 ${filters.severity !== 'all'
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
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Assignee:</label>
                                <select
                                    value={filters.assignee}
                                    onChange={(e) => handleFilterChange('assignee', e.target.value)}
                                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-10 flex-1 min-w-0 lg:min-w-40 ${filters.assignee !== 'all'
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
                        </div>

                        {/* Action Buttons and View Toggle - Responsive */}
                        <div className="flex items-center justify-end gap-2 mt-4 lg:mt-0 lg:ml-auto lg:flex-none">
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium h-10 whitespace-nowrap"
                                >
                                    Clear Filters ({getActiveFiltersCount()})
                                </button>
                            )}

                            {/* View Mode Buttons */}
                            <div className="flex">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-3 text-sm transition-colors duration-200 ${viewMode === 'list'
                                            ? 'bg-teal-600 text-white border-teal-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        } border rounded-l-md h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500`}
                                    title="List View"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-3 text-sm transition-colors duration-200 ${viewMode === 'table'
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
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${filters.tags && filters.tags.includes(tag)
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

                                {/* Advanced Search Options - Responsive Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                                {(filters.lastUpdated && filters.lastUpdated !== 'all') && (
                                    <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                        Last Updated: {filters.lastUpdated}
                                        <button
                                            onClick={() => handleFilterChange('lastUpdated', 'all')}
                                            className="ml-1 text-orange-600 hover:text-orange-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}

                                {(filters.bugType && filters.bugType !== 'all') && (
                                    <span className="inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                                        Bug Type: {filters.bugType}
                                        <button
                                            onClick={() => handleFilterChange('bugType', 'all')}
                                            className="ml-1 text-pink-600 hover:text-pink-800"
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
            </div>

            {/* Mobile Filter Modal */}
            <MobileFilterModal />
        </>
    );
}