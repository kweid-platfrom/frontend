'use client'

import { useState, useMemo } from 'react';
import { List, Table, ChevronUp, ChevronDown } from 'lucide-react';

export default function FilterBar({ filters, onFiltersChange, testCases, viewMode, setViewMode }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract unique values for filter options
    const filterOptions = useMemo(() => {
        const statuses = [...new Set(testCases.map(tc => tc.status))];
        const priorities = [...new Set(testCases.map(tc => tc.priority))];
        const severities = [...new Set(testCases.map(tc => tc.severity))];
        const executionStatuses = [...new Set(testCases.map(tc => tc.executionStatus))];
        const assignees = [...new Set(testCases.map(tc => tc.assignee).filter(Boolean))];
        const components = [...new Set(testCases.map(tc => tc.component).filter(Boolean))];
        const testTypes = [...new Set(testCases.map(tc => tc.testType).filter(Boolean))];
        const environments = [...new Set(testCases.map(tc => tc.environment).filter(Boolean))];
        const allTags = [...new Set(testCases.flatMap(tc => tc.tags || []))];

        return { 
            statuses, 
            priorities, 
            severities,
            executionStatuses,
            assignees, 
            components,
            testTypes,
            environments,
            allTags 
        };
    }, [testCases]);

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
            priority: 'all',
            severity: 'all',
            executionStatus: 'all',
            assignee: 'all',
            component: 'all',
            testType: 'all',
            environment: 'all',
            automationStatus: 'all',
            tags: [],
            search: '',
            lastUpdated: 'all'
        });
    };

    const hasActiveFilters = () => {
        return filters.status !== 'all' || 
               filters.priority !== 'all' || 
               filters.severity !== 'all' ||
               filters.executionStatus !== 'all' ||
               filters.assignee !== 'all' || 
               filters.component !== 'all' ||
               filters.testType !== 'all' ||
               filters.environment !== 'all' ||
               filters.automationStatus !== 'all' ||
               (filters.tags && filters.tags.length > 0) || 
               filters.search !== '' ||
               filters.lastUpdated !== 'all';
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.status !== 'all') count++;
        if (filters.priority !== 'all') count++;
        if (filters.severity !== 'all') count++;
        if (filters.executionStatus !== 'all') count++;
        if (filters.assignee !== 'all') count++;
        if (filters.component !== 'all') count++;
        if (filters.testType !== 'all') count++;
        if (filters.environment !== 'all') count++;
        if (filters.automationStatus !== 'all') count++;
        if (filters.tags && filters.tags.length > 0) count++;
        if (filters.search !== '') count++;
        if (filters.lastUpdated !== 'all') count++;
        return count;
    };

    return (
        <div className="bg-background rounded-lg shadow-theme-md p-4 mb-4">
            {/* Search and Quick Filters Row */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                {/* Search Bar */}
                <div className="flex-1 min-w-64 max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search test cases..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-10 appearance-none ${
                                filters.search 
                                    ? 'bg-teal-50 border-teal-500' 
                                    : 'border-border'
                            }`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground whitespace-nowrap">Status:</label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className={`pl-3 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 min-w-32 bg-white appearance-none cursor-pointer ${
                            filters.status !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-border'
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em'
                        }}
                    >
                        <option value="all">All</option>
                        {filterOptions.statuses.map(status => (
                            <option key={status} value={status}>
                                {status?.charAt(0).toUpperCase() + status?.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground whitespace-nowrap">Priority:</label>
                    <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className={`pl-3 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 min-w-32 bg-white appearance-none cursor-pointer ${
                            filters.priority !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-border'
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em'
                        }}
                    >
                        <option value="all">All</option>
                        {filterOptions.priorities.map(priority => (
                            <option key={priority} value={priority}>
                                {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground whitespace-nowrap">Execution:</label>
                    <select
                        value={filters.executionStatus || 'all'}
                        onChange={(e) => handleFilterChange('executionStatus', e.target.value)}
                        className={`pl-3 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 min-w-36 bg-white appearance-none cursor-pointer ${
                            filters.executionStatus !== 'all' 
                                ? 'bg-teal-50 border-teal-500' 
                                : 'border-border'
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em'
                        }}
                    >
                        <option value="all">All</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="blocked">Blocked</option>
                        <option value="not_executed">Not Executed</option>
                        {filterOptions.executionStatuses.map(status => (
                            <option key={status} value={status}>
                                {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons and View Toggle */}
                <div className="flex items-center gap-2 ml-auto">
                    {hasActiveFilters() && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-destructive hover:text-destructive-foreground font-medium h-10"
                        >
                            Clear Filters ({getActiveFiltersCount()})
                        </button>
                    )}
                    
                    {/* View Mode Buttons */}
                    <div className="flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                                viewMode === 'list'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-border hover:bg-secondary'
                            } border rounded-l-md h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary`}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                                viewMode === 'table'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-border hover:bg-secondary'
                            } border border-l-0 rounded-r-md h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary`}
                            title="Table View"
                        >
                            <Table className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 hover:bg-secondary rounded h-10 flex items-center justify-center"
                        title={isExpanded ? 'Hide additional filters' : 'Show additional filters'}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-foreground" /> : <ChevronDown className="h-4 w-4 text-foreground" />}
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="border-t border-border pt-4">
                    <div className="space-y-4">
                        {/* Additional Filter Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Severity:
                                </label>
                                <select
                                    value={filters.severity || 'all'}
                                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    {filterOptions.severities.map(severity => (
                                        <option key={severity} value={severity}>
                                            {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Assignee:
                                </label>
                                <select
                                    value={filters.assignee || 'all'}
                                    onChange={(e) => handleFilterChange('assignee', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
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

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Component:
                                </label>
                                <select
                                    value={filters.component || 'all'}
                                    onChange={(e) => handleFilterChange('component', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All</option>
                                    {filterOptions.components.map(component => (
                                        <option key={component} value={component}>
                                            {component}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Test Type:
                                </label>
                                <select
                                    value={filters.testType || 'all'}
                                    onChange={(e) => handleFilterChange('testType', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All</option>
                                    <option value="functional">Functional</option>
                                    <option value="integration">Integration</option>
                                    <option value="unit">Unit</option>
                                    <option value="performance">Performance</option>
                                    <option value="security">Security</option>
                                    <option value="usability">Usability</option>
                                    {filterOptions.testTypes.map(testType => (
                                        <option key={testType} value={testType}>
                                            {testType}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Additional Filter Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Environment:
                                </label>
                                <select
                                    value={filters.environment || 'all'}
                                    onChange={(e) => handleFilterChange('environment', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All</option>
                                    <option value="development">Development</option>
                                    <option value="testing">Testing</option>
                                    <option value="staging">Staging</option>
                                    <option value="production">Production</option>
                                    {filterOptions.environments.map(environment => (
                                        <option key={environment} value={environment}>
                                            {environment}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Automation Status:
                                </label>
                                <select
                                    value={filters.automationStatus || 'all'}
                                    onChange={(e) => handleFilterChange('automationStatus', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All</option>
                                    <option value="manual">Manual</option>
                                    <option value="automated">Automated</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Last Updated:
                                </label>
                                <select
                                    value={filters.lastUpdated || 'all'}
                                    onChange={(e) => handleFilterChange('lastUpdated', e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm h-10 bg-white appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.25em 1.25em'
                                    }}
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                </select>
                            </div>
                        </div>

                        {/* Tags Filter */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
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
                                                : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {filterOptions.allTags.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No tags available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">Active filters:</span>
                        
                        {filters.status !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-success text-success-foreground text-xs rounded-full">
                                Status: {filters.status}
                                <button
                                    onClick={() => handleFilterChange('status', 'all')}
                                    className="ml-1 text-success hover:text-success-foreground"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.priority !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-warning text-warning-foreground text-xs rounded-full">
                                Priority: {filters.priority}
                                <button
                                    onClick={() => handleFilterChange('priority', 'all')}
                                    className="ml-1 text-warning hover:text-warning-foreground"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.severity !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Severity: {filters.severity}
                                <button
                                    onClick={() => handleFilterChange('severity', 'all')}
                                    className="ml-1 text-orange-600 hover:text-orange-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.executionStatus !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Execution: {filters.executionStatus?.replace('_', ' ')}
                                <button
                                    onClick={() => handleFilterChange('executionStatus', 'all')}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.assignee !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                                Assignee: {filters.assignee || 'Unassigned'}
                                <button
                                    onClick={() => handleFilterChange('assignee', 'all')}
                                    className="ml-1 text-teal-600 hover:text-teal-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.component !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Component: {filters.component}
                                <button
                                    onClick={() => handleFilterChange('component', 'all')}
                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.testType !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                Test Type: {filters.testType}
                                <button
                                    onClick={() => handleFilterChange('testType', 'all')}
                                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.environment !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Environment: {filters.environment}
                                <button
                                    onClick={() => handleFilterChange('environment', 'all')}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.automationStatus !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                Automation: {filters.automationStatus}
                                <button
                                    onClick={() => handleFilterChange('automationStatus', 'all')}
                                    className="ml-1 text-gray-600 hover:text-gray-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}

                        {filters.lastUpdated !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Updated: {filters.lastUpdated}
                                <button
                                    onClick={() => handleFilterChange('lastUpdated', 'all')}
                                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        
                        {filters.tags && filters.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                                Tag: {tag}
                                <button
                                    onClick={() => handleTagToggle(tag)}
                                    className="ml-1 text-teal-600 hover:text-teal-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        
                        {filters.search && (
                            <span className="inline-flex items-center px-2 py-1 bg-secondary text-foreground text-xs rounded-full">
                                Search: {filters.search}
                                <button
                                    onClick={() => handleFilterChange('search', '')}
                                    className="ml-1 text-muted-foreground hover:text-foreground"
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