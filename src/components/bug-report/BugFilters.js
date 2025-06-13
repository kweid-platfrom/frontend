// components/BugFilters.js
import React from "react";
import { Search, X } from "lucide-react";

const BugFilters = ({ filters, setFilters, teamMembers, sprints, onClose }) => {
    const categories = ["UI", "Functionality", "Performance", "Security", "Documentation", "Other"];
    const statusOptions = ["New", "In Progress", "Blocked", "Resolved", "Closed"];
    const severityOptions = ["Critical", "High", "Medium", "Low"];
    const dueDateOptions = [
        { value: "overdue", label: "Overdue" },
        { value: "today", label: "Due Today" },
        { value: "this-week", label: "Due This Week" },
        { value: "no-due-date", label: "No Due Date" }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const FilterSelect = ({ label, value, options, onChange, placeholder = "All" }) => (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
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

    return (
        <div className="bg-gray-50 border-b p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filter Bugs</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bugs by title, description, or ID..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                    />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <FilterSelect
                        label="Status"
                        value={filters.status}
                        options={statusOptions}
                        onChange={(value) => handleFilterChange("status", value)}
                    />

                    <FilterSelect
                        label="Severity"
                        value={filters.severity}
                        options={severityOptions}
                        onChange={(value) => handleFilterChange("severity", value)}
                    />

                    <FilterSelect
                        label="Category"
                        value={filters.category}
                        options={categories}
                        onChange={(value) => handleFilterChange("category", value)}
                    />

                    <FilterSelect
                        label="Assigned To"
                        value={filters.assignedTo}
                        options={[
                            { value: "unassigned", label: "Unassigned" },
                            ...teamMembers.map(member => ({
                                value: member.name,
                                label: member.name
                            }))
                        ]}
                        onChange={(value) => handleFilterChange("assignedTo", value)}
                    />

                    <FilterSelect
                        label="Sprint"
                        value={filters.sprint}
                        options={sprints.map(sprint => ({
                            value: sprint.id,
                            label: sprint.name
                        }))}
                        onChange={(value) => handleFilterChange("sprint", value)}
                    />

                    <FilterSelect
                        label="Due Date"
                        value={filters.dueDate}
                        options={dueDateOptions}
                        onChange={(value) => handleFilterChange("dueDate", value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default BugFilters;