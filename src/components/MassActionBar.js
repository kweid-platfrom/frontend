import React from 'react';
import { X, Share2, Trash2, UserPlus, Tag } from 'lucide-react';

const MassActionBar = ({ selectedCount, onClearSelections }) => {
    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 py-2 px-4 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedCount} bugs selected</span>

            <div className="h-4 w-px bg-gray-300"></div>

            <div className="flex gap-3">
                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600">
                    <UserPlus size={16} />
                    <span>Assign</span>
                </button>

                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600">
                    <Tag size={16} />
                    <span>Change Status</span>
                </button>

                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600">
                    <Share2 size={16} />
                    <span>Share</span>
                </button>

                <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600">
                    <Trash2 size={16} />
                    <span>Delete</span>
                </button>
            </div>

            <button
                className="ml-auto p-1 text-gray-500 hover:text-gray-700"
                onClick={onClearSelections}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default MassActionBar;