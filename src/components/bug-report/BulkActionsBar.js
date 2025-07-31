import React from 'react';
import { Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const BulkActionsBar = ({ selectedBugs, onBulkAction }) => {
    const handleBulkActionClick = (action) => {
        if (onBulkAction) {
            const mappedAction = action === 'open' ? 'open' :
                action === 'resolve' ? 'resolved' :
                    action === 'close' ? 'closed' : action;
            onBulkAction(mappedAction, selectedBugs);
        }
    };

    if (selectedBugs.length === 0) return null;

    return (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-teal-700 font-medium">
                    {selectedBugs.length} bug{selectedBugs.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleBulkActionClick('open')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reopen
                    </button>
                    <button
                        onClick={() => handleBulkActionClick('resolve')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                    </button>
                    <button
                        onClick={() => handleBulkActionClick('close')}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        <XCircle className="w-4 h-4 mr-1" />
                        Close
                    </button>
                    <button
                        onClick={() => handleBulkActionClick('delete')}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkActionsBar;