'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckSquare, Square } from 'lucide-react';
import BugTableRow from './BugTableRow';
import BulkActionButtons from '../buttons/BulkActionButtons';

const BugTable = ({
    bugs = [],
    selectedBugs = [],
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugPriority,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onUpdateBugFrequency, // Added this prop
    onShowBugDetails,
    onCreateBug,
    onRetryFetch,
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    loading = false,
    error = null,
    onBulkAction,
    onChatIconClick,
    onToggleSelection,
}) => {
    const [selectedIds, setSelectedIds] = useState(Array.isArray(selectedBugs) ? selectedBugs : []);

    useEffect(() => {
        console.log('BugTable props:', { selectedBugs, selectedIds, onBulkAction: !!onBulkAction, bugsLength: bugs.length });
    }, [selectedBugs, selectedIds, onBulkAction, bugs]);

    useEffect(() => {
        setSelectedIds(Array.isArray(selectedBugs) ? selectedBugs : []);
    }, [selectedBugs]);

    const handleSelectAll = (checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        if (checked) {
            const allIds = bugs.filter((bug) => bug && bug.id).map((bug) => bug.id);
            setSelectedIds(allIds);
            const itemsToSelect = allIds.filter((id) => !selectedIds.includes(id));
            itemsToSelect.forEach((id) => onToggleSelection(id));
            toast.info(`Selected all ${allIds.length} bugs`);
        } else {
            setSelectedIds([]);
            selectedIds.forEach((id) => onToggleSelection(id));
            toast.info('Cleared selection');
        }
    };

    const handleSelectItem = (id, checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        setSelectedIds((prev) => {
            const newSelection = checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id);
            console.log('handleSelectItem:', { id, checked, newSelection });
            toast.info(`${newSelection.length} bug${newSelection.length > 1 ? 's' : ''} selected`);
            return newSelection;
        });
        onToggleSelection(id);
    };

    const handleChatIconClick = (bug, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (!bug || !bug.id) {
            console.error('Invalid bug object in handleChatIconClick:', bug);
            toast.error('Cannot display bug details: Invalid bug data');
            return;
        }
        if (onChatIconClick) {
            onChatIconClick(bug, event);
        }
        if (onShowBugDetails) {
            onShowBugDetails(bug);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="h-6 bg-gray-200 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
                    <div className="text-center">
                        <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bugs</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        {onRetryFetch && (
                            <button
                                onClick={onRetryFetch}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden w-full px-6">
            <BulkActionButtons selectedIds={selectedIds} onBulkAction={onBulkAction} />
            <div className="overflow-x-auto">
                <table className="divide-y divide-gray-200 w-full">
                    <thead className="bg-gray-50">
                        <tr className="h-12">
                            <th
                                scope="col"
                                className="w-12 px-3 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-30"
                            >
                                <div className="flex items-center justify-center h-full">
                                    {selectedIds.length === bugs.length && bugs.length > 0 ? (
                                        <CheckSquare
                                            className="w-4 h-4 text-teal-600 cursor-pointer"
                                            onClick={() => handleSelectAll(false)}
                                        />
                                    ) : (
                                        <Square
                                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                                            onClick={() => handleSelectAll(true)}
                                        />
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 sticky left-12 bg-gray-50 z-30 min-w-[300px]"
                            >
                                <div className="flex items-center h-full">Bug Title</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[80px]"
                            >
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[120px]"
                            >
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Status</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[120px]"
                            >
                                <div className="flex items-center h-full">Assigned To</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[80px]"
                            >
                                <div className="flex items-center h-full">Priority</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Severity</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Evidence</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[120px]"
                            >
                                <div className="flex items-center h-full">Environment</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[140px]"
                            >
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[100px]"
                            >
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[60px]"
                            >
                                <div className="flex items-center h-full">Actions</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map((bug) => (
                            <BugTableRow
                                key={bug.id}
                                bug={bug}
                                selectedIds={selectedIds}
                                onToggleSelection={handleSelectItem}
                                onUpdateBugStatus={onUpdateBugStatus}
                                onUpdateBugSeverity={onUpdateBugSeverity}
                                onUpdateBugPriority={onUpdateBugPriority}
                                onUpdateBugAssignment={onUpdateBugAssignment}
                                onUpdateBugEnvironment={onUpdateBugEnvironment}
                                onUpdateBugFrequency={onUpdateBugFrequency} // Pass the frequency update prop
                                onShowBugDetails={onShowBugDetails}
                                onChatClick={handleChatIconClick}
                                teamMembers={teamMembers}
                                environments={environments}
                                isUpdating={isUpdating}
                            />
                        ))}
                    </tbody>
                </table>
                {bugs.length === 0 && !loading && !error && (
                    <div className="text-center py-6">
                        <p className="text-gray-500">No bugs found. Report a new bug to get started.</p>
                        {onCreateBug && (
                            <button
                                onClick={onCreateBug}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-teal-600 hover:bg-teal-700"
                            >
                                Report Bug
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugTable;