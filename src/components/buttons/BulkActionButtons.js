import React from 'react';
import { toast } from 'sonner';

const BulkActionButtons = ({ selectedIds, onBulkAction }) => {
    // Define configurable actions
    const actions = [
        { label: 'Reopen', action: 'reopen', disabled: !onBulkAction },
        { label: 'Close', action: 'close', disabled: !onBulkAction },
        { label: 'Delete', action: 'delete', disabled: !onBulkAction }
    ];

    const handleActionClick = async (action) => {
        if (!onBulkAction) {
            toast.error('You do not have permission to perform this action');
            return;
        }
        if (!selectedIds || selectedIds.length === 0) {
            toast.error('No bugs selected for action');
            return;
        }
        console.log('BulkActionButtons handleActionClick:', { action, selectedIds });
        try {
            await onBulkAction(action, selectedIds);
            toast.info(`Successfully performed ${action} on ${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''}`);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} bugs: ${error.message}`);
        }
    };

    if (!selectedIds || selectedIds.length === 0) {
        return null;
    }

    return (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
                <span className="text-sm text-teal-700 font-medium">
                    {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                    {actions.map(({ label, action, disabled }) => (
                        <button
                            key={action}
                            onClick={() => handleActionClick(action)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            disabled={disabled}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BulkActionButtons;