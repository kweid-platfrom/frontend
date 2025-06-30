import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckSquare, Square } from 'lucide-react';
import BugTableRow from './BugTableRow';

const BugTable = ({
    bugs = [], // Accept bugs from parent (useBugTracker)
    selectedBugs,
    onBugSelect,
    selectedBug,
    onDragStart,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onUpdateBugTitle,
    onShowBugDetails,
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    loading = false,
    error = null,
    onBulkAction, // New prop for handling bulk actions
    hasPermission // New prop for permission checking
}) => {
    const [editingTitle, setEditingTitle] = useState(null);
    const [titleValue, setTitleValue] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(bugs.map(bug => bug.id));
        } else {
            setSelectedIds([]);
        }
    };

    // Handle individual item selection
    const handleSelectItem = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    // Handle bulk actions - delegate to parent
    const handleBulkAction = async (action, ids) => {
        if (!hasPermission || !hasPermission('write')) {
            toast.error('You do not have permission to perform bulk actions');
            return;
        }

        try {
            await onBulkAction(action, ids);
            setSelectedIds([]); // Clear selection after successful action
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} bugs`);
        }
    };

    const handleTitleEdit = (bugId, currentTitle) => {
        setEditingTitle(bugId);
        setTitleValue(currentTitle);
    };

    const handleTitleSave = async (bugId) => {
        if (onUpdateBugTitle && titleValue.trim()) {
            try {
                await onUpdateBugTitle(bugId, titleValue.trim());
            } catch (error) {
                console.error('Failed to update title:', error);
            }
        }
        setEditingTitle(null);
        setTitleValue('');
    };

    const handleTitleCancel = () => {
        setEditingTitle(null);
        setTitleValue('');
    };

    const handleTitleKeyDown = (e, bugId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSave(bugId);
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    const handleTitleChange = (value) => {
        setTitleValue(value);
    };

    // Enhanced bug details handler to open the details panel
    const handleShowBugDetails = (bug) => {
        if (onShowBugDetails) {
            onShowBugDetails(bug);
        } else if (onBugSelect) {
            // Fallback to onBugSelect if onShowBugDetails is not provided
            onBugSelect(bug);
        }
    };

    // Handle chat icon click to open bug details
    const handleChatIconClick = (bug, event) => {
        event.stopPropagation(); // Prevent any parent click handlers
        handleShowBugDetails(bug);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => (
                        <div
                            key={idx}
                            className="h-6 bg-gray-200 rounded animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bugs</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-white border-b border-teal-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('reopen', selectedIds)}
                                className="px-2 py-1 bg-[#fff] text-gray-600 shadow-md text-xs rounded-full hover:text-green-700 transition-colors"
                                disabled={!hasPermission || !hasPermission('write')}
                            >
                                Reopen
                            </button>
                            <button
                                onClick={() => handleBulkAction('close', selectedIds)}
                                className="px-2 py-1 bg-[#fff] text-gray-600 text-xs rounded-full hover:text-teal-800 shadow-md transition-colors"
                                disabled={!hasPermission || !hasPermission('write')}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete', selectedIds)}
                                className="px-2 py-1 bg-[#fff] text-gray-600 text-xs shadow-md rounded-full hover:text-red-500 transition-colors"
                                disabled={!hasPermission || !hasPermission('admin')}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-10">
                            <th scope="col" className="w-12 px-6 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-20">
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
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 sticky left-10 bg-gray-50 z-20">
                                <div className="flex items-center h-full">
                                    Bug Title
                                </div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap ">
                                <div className="flex items-center h-full w-20">Status</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-28">Assigned To</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-20">
                                <div className="flex items-center h-full w-20">Priority</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-20">Severity</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-auto">Evidence</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28">
                                <div className="flex items-center h-full w-28">Environment</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28">
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24">
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24">
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-16">
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-8">
                                <div className="flex items-center h-full">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                    </svg>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs && bugs.length > 0 ? (
                            bugs.map((bug) => (
                                <BugTableRow
                                    key={bug.id}
                                    bug={bug}
                                    selectedBugs={selectedBugs}
                                    selectedBug={selectedBug}
                                    selectedIds={selectedIds}
                                    onToggleSelection={handleSelectItem}
                                    onBugSelect={onBugSelect}
                                    onDragStart={onDragStart}
                                    onUpdateBugStatus={onUpdateBugStatus}
                                    onUpdateBugSeverity={onUpdateBugSeverity}
                                    onUpdateBugAssignment={onUpdateBugAssignment}
                                    onUpdateBugEnvironment={onUpdateBugEnvironment}
                                    onUpdateBugTitle={onUpdateBugTitle}
                                    onShowBugDetails={handleShowBugDetails}
                                    onChatIconClick={handleChatIconClick}
                                    teamMembers={teamMembers}
                                    environments={environments}
                                    isUpdating={isUpdating}
                                    editingTitle={editingTitle}
                                    titleValue={titleValue}
                                    onTitleEdit={handleTitleEdit}
                                    onTitleSave={handleTitleSave}
                                    onTitleCancel={handleTitleCancel}
                                    onTitleChange={handleTitleChange}
                                    onTitleKeyDown={handleTitleKeyDown}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="18" className="px-6 py-8 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="text-sm text-gray-500">
                                            No bugs found
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BugTable;