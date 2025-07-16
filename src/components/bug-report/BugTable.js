// src/components/BugTable.js
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckSquare, Square } from 'lucide-react';
import BugTableRow from './BugTableRow';

const BugTable = ({
    bugs = [],
    onBugSelect,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onUpdateBugTitle,
    onShowBugDetails,
    onCreateBug,
    onRetryFetch,
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    loading = false,
    error = null,
    onBulkAction,
    onToggleSelection
}) => {
    const [editingTitle, setEditingTitle] = useState(null);
    const [titleValue, setTitleValue] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);



    const handleSelectAll = (checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        if (checked) {
            setSelectedIds(bugs.map(bug => bug.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id, checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkAction = async (action, ids) => {
        if (!onBulkAction) {
            toast.error('You do not have permission to perform this action');
            return;
        }
        try {
            await onBulkAction(action, ids);
            setSelectedIds([]);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} bugs`);
        }
    };

    const handleTitleEdit = (bugId, currentTitle) => {
        if (!onUpdateBugTitle) {
            toast.error('You do not have permission to update bug titles');
            return;
        }
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

    const handleShowBugDetails = (bug) => {
        if (onShowBugDetails) {
            onShowBugDetails(bug);
        } else if (onBugSelect) {
            onBugSelect(bug);
        }
    };

    const handleChatIconClick = (bug, event) => {
        event.stopPropagation();
        handleShowBugDetails(bug);
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {selectedIds.length > 0 && onBulkAction && (
                <div className="bg-white border-b border-teal-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('reopen', selectedIds)}
                                className="px-2 py-1 bg-white text-gray-600 shadow-md text-xs rounded-full hover:text-green-700 transition-colors"
                                disabled={!onBulkAction}
                            >
                                Reopen
                            </button>
                            <button
                                onClick={() => handleBulkAction('close', selectedIds)}
                                className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full hover:text-teal-800 shadow-md transition-colors"
                                disabled={!onBulkAction}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete', selectedIds)}
                                className="px-2 py-1 bg-white text-gray-600 text-xs shadow-md rounded-full hover:text-red-500 transition-colors"
                                disabled={!onBulkAction}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="divide-y divide-gray-200" style={{ minWidth: '1600px' }}>
                    <thead className="bg-gray-50">
                        <tr className="h-12">
                            {/* Checkbox - Sticky */}
                            <th 
                                scope="col" 
                                className="w-12 px-3 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-30"
                                style={{ minWidth: '48px', maxWidth: '48px' }}
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
                            
                            {/* Bug Title - Sticky */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 sticky left-12 bg-gray-50 z-30"
                                style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}
                            >
                                <div className="flex items-center h-full">Bug Title</div>
                            </th>
                            
                            {/* Bug ID */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                            >
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            
                            {/* Tags */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            
                            {/* Status */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Status</div>
                            </th>
                            
                            {/* Assigned To */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Assigned To</div>
                            </th>
                            
                            {/* Priority */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                            >
                                <div className="flex items-center h-full">Priority</div>
                            </th>
                            
                            {/* Severity */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Severity</div>
                            </th>
                            
                            {/* Evidence */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Evidence</div>
                            </th>
                            
                            {/* Reporter */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            
                            {/* Source */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            
                            {/* Environment */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Environment</div>
                            </th>
                            
                            {/* Device/Browser */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '140px', minWidth: '140px', maxWidth: '140px' }}
                            >
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            
                            {/* Due Date */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            
                            {/* Created */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            
                            {/* Frequency */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            
                            {/* Drag Handle */}
                            <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                                style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}
                            >
                                <div className="flex items-center h-full"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map(bug => (
                            <BugTableRow
                                key={bug.id}
                                bug={bug}
                                selectedIds={selectedIds}
                                onToggleSelection={handleSelectItem}
                                isSelected={selectedIds.includes(bug.id)}
                                editingTitle={editingTitle}
                                titleValue={titleValue}
                                onSelect={() => handleSelectItem(bug.id, !selectedIds.includes(bug.id))}
                                onClick={() => handleShowBugDetails(bug)}
                                onChatClick={(e) => handleChatIconClick(bug, e)}
                                onUpdateBugStatus={onUpdateBugStatus}
                                onUpdateBugSeverity={onUpdateBugSeverity}
                                onUpdateBugAssignment={onUpdateBugAssignment}
                                onUpdateBugEnvironment={onUpdateBugEnvironment}
                                onTitleEdit={() => handleTitleEdit(bug.id, bug.title)}
                                onTitleChange={handleTitleChange}
                                onTitleSave={() => handleTitleSave(bug.id)}
                                onTitleCancel={handleTitleCancel}
                                onTitleKeyDown={(e) => handleTitleKeyDown(e, bug.id)}
                                teamMembers={teamMembers}
                                environments={environments}
                                isUpdating={isUpdating.has(bug.id)}
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