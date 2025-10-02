'use client';
import React from 'react';
import { Search, CheckSquare, Square } from 'lucide-react';

export const FilterControls = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  showExpiredOnly,
  setShowExpiredOnly,
  expiredCount,
  filteredItems,
  selectedItems,
  onSelectAll
}) => {
  const allSelected = filteredItems.length > 0 && selectedItems.length === filteredItems.length;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="testCases">Test Cases</option>
            <option value="bugs">Bugs</option>
            <option value="recordings">Recordings</option>
            <option value="sprints">Sprints</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showExpiredOnly}
              onChange={(e) => setShowExpiredOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show expired only</span>
            {expiredCount > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {expiredCount}
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Select All Checkbox */}
      {filteredItems.length > 0 && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-muted/30rounded-lg">
          <button
            onClick={onSelectAll}
             className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <span className="text-sm text-muted-foreground">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </div>
      )}
    </div>
  );
};