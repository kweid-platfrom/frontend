'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';

const ResourceSelectorModal = ({ isOpen, onClose, resourceType, resourceId }) => {
    const { state, actions } = useApp();
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resources = resourceType === 'testCases' ? state.bugs.bugs : state.testCases.testCases;
    const sourceResource = resourceType === 'testCases'
        ? state.testCases.testCases.find(tc => tc.id === resourceId)
        : state.bugs.bugs.find(bug => bug.id === resourceId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (resourceType === 'testCases') {
                await actions.linkBugsToTestCase(resourceId, selectedIds);
            } else {
                await actions.linkTestCasesToBug(resourceId, selectedIds);
            }
            setSelectedIds([]);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Link {resourceType === 'testCases' ? 'Bugs' : 'Test Cases'} to {sourceResource?.title}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6 max-h-64 overflow-y-auto">
                        {resources.map(resource => (
                            <label key={resource.id} className="flex items-center py-2">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(resource.id)}
                                    onChange={() => handleToggle(resource.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    disabled={isSubmitting}
                                />
                                <span className="ml-2 text-sm text-gray-600">{resource.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={isSubmitting || selectedIds.length === 0}
                        >
                            {isSubmitting ? 'Linking...' : 'Link Resources'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResourceSelectorModal;