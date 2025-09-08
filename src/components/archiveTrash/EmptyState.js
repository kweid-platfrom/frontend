'use client';
import React from 'react';
import { Archive, Trash2 } from 'lucide-react';

export const EmptyState = ({ type, activeTab, hasFilters }) => {
  const states = {
    auth: {
      icon: Archive,
      title: 'Authentication Required',
      message: 'Please sign in to view archived and deleted items.'
    },
    suite: {
      icon: Archive,
      title: 'No Test Suite Selected',
      message: 'Please select a test suite to view its archived and deleted items.'
    },
    items: {
      icon: activeTab === 'archived' ? Archive : Trash2,
      title: `No ${activeTab} items found`,
      message: hasFilters 
        ? 'Try adjusting your filters or search terms.'
        : `You don't have any ${activeTab} items yet.`
    }
  };

  const state = states[type];
  if (!state) return null;

  const { icon: Icon, title, message } = state;

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
};