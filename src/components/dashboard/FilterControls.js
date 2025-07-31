
// components/dashboard/FilterControls.jsx
import React from 'react';

const TIME_FILTER_OPTIONS = [
    { value: '1d', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
    { value: 'all', label: 'All time' },
];

const FilterButton = ({ active, onClick, children, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : active
                ? 'bg-teal-100 text-teal-700 border border-teal-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
        aria-pressed={active}
        aria-disabled={disabled}
    >
        {children}
    </button>
);

export const FilterControls = ({ filters, onFilterChange, loading }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Time Range:</span>
                    <div className="flex space-x-1">
                        {TIME_FILTER_OPTIONS.map((option) => (
                            <FilterButton
                                key={option.value}
                                active={filters.timeRange === option.value}
                                onClick={() => onFilterChange('timeRange', option.value)}
                                disabled={loading}
                            >
                                {option.label}
                            </FilterButton>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Priority:</span>
                    <select
                        value={filters.priority}
                        onChange={(e) => onFilterChange('priority', e.target.value)}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        aria-label="Select priority"
                    >
                        <option value="all">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        aria-label="Select status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="New">New</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Source:</span>
                    <select
                        value={filters.source}
                        onChange={(e) => onFilterChange('source', e.target.value)}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        aria-label="Select source"
                    >
                        <option value="all">All Sources</option>
                        <option value="screen-recording">Screen Recording</option>
                        <option value="manual">Manual Testing</option>
                        <option value="automated">Automated</option>
                        <option value="user-report">User Report</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
);