'use client';
import React from 'react';
import { RefreshCcw, Trash } from 'lucide-react';

export const BulkActions = ({ 
  selectedItems, 
  onBulkRestore, 
  onBulkDelete, 
  onDeselectAll,
  isTrash = false 
}) => {
  if (!Array.isArray(selectedItems) || selectedItems.length === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-800 dark:text-blue-200">
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={onBulkRestore}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
            type="button"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Restore All</span>
          </button>
          <button
            onClick={onBulkDelete}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center space-x-1"
            type="button"
          >
            <Trash className="w-3 h-3" />
            <span>Delete All</span>
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};