import React, { useState, useRef } from 'react';

const FilterSection = ({ testCases, filters, onFilterChange }) => {
    // Extract unique values for filter options
    const priorities = [...new Set(testCases.map(tc => tc.priority))];
    const modules = [...new Set(testCases.map(tc => tc.module))];
    const statuses = [...new Set(testCases.map(tc => tc.status))];

    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isModuleOpen, setIsModuleOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const priorityRef = useRef(null);
    const moduleRef = useRef(null);
    const statusRef = useRef(null);

    // Close dropdowns when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (priorityRef.current && !priorityRef.current.contains(event.target)) {
                setIsPriorityOpen(false);
            }
            if (moduleRef.current && !moduleRef.current.contains(event.target)) {
                setIsModuleOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target)) {
                setIsStatusOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handlePriorityChange = (priority) => {
        let newPriorities;
        if (filters.priority.includes(priority)) {
            newPriorities = filters.priority.filter(p => p !== priority);
        } else {
            newPriorities = [...filters.priority, priority];
        }
        onFilterChange({ ...filters, priority: newPriorities });
    };

    const handleModuleChange = (module) => {
        let newModules;
        if (filters.module.includes(module)) {
            newModules = filters.module.filter(m => m !== module);
        } else {
            newModules = [...filters.module, module];
        }
        onFilterChange({ ...filters, module: newModules });
    };

    const handleStatusChange = (status) => {
        let newStatuses;
        if (filters.status.includes(status)) {
            newStatuses = filters.status.filter(s => s !== status);
        } else {
            newStatuses = [...filters.status, status];
        }
        onFilterChange({ ...filters, status: newStatuses });
    };

    const handleSearchChange = (e) => {
        onFilterChange({ ...filters, searchTerm: e.target.value });
    };

    const handleClearFilters = () => {
        onFilterChange({ priority: [], module: [], status: [], searchTerm: '' });
    };

    return (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search bar and filter elements in the same row */}
                <div className="relative flex-grow">
                    <input
                        type="text"
                        className="block w-full px-4 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search test cases..."
                        value={filters.searchTerm}
                        onChange={handleSearchChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                {/* Priority Filter */}
                <div className="relative" ref={priorityRef}>
                    <button
                        onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <span>Priority {filters.priority.length > 0 ? `(${filters.priority.length})` : ''}</span>
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    {isPriorityOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                            {priorities.map(priority => (
                                <div key={priority} className="px-4 py-2 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <input
                                            id={`priority-${priority}`}
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            checked={filters.priority.includes(priority)}
                                            onChange={() => handlePriorityChange(priority)}
                                        />
                                        <label htmlFor={`priority-${priority}`} className="ml-2 text-sm text-gray-700">
                                            {priority}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Module Filter */}
                <div className="relative" ref={moduleRef}>
                    <button
                        onClick={() => setIsModuleOpen(!isModuleOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <span>Module {filters.module.length > 0 ? `(${filters.module.length})` : ''}</span>
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    {isModuleOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                            {modules.map(module => (
                                <div key={module} className="px-4 py-2 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <input
                                            id={`module-${module}`}
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            checked={filters.module.includes(module)}
                                            onChange={() => handleModuleChange(module)}
                                        />
                                        <label htmlFor={`module-${module}`} className="ml-2 text-sm text-gray-700">
                                            {module}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusRef}>
                    <button
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <span>Status {filters.status.length > 0 ? `(${filters.status.length})` : ''}</span>
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    {isStatusOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                            {statuses.map(status => (
                                <div key={status} className="px-4 py-2 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <input
                                            id={`status-${status}`}
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            checked={filters.status.includes(status)}
                                            onChange={() => handleStatusChange(status)}
                                        />
                                        <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">
                                            {status}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear filters button */}
                {(filters.priority.length > 0 || filters.module.length > 0 || filters.status.length > 0 || filters.searchTerm) && (
                    <button
                        onClick={handleClearFilters}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default FilterSection;