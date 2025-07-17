'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckSquare, Square } from 'lucide-react';
import BugTableRow from './BugTableRow';
import BulkActionButtons from '../buttons/BulkActionButtons';

const BugTable = ({
    bugs = [],
    selectedBugs = [],
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
    onChatIconClick,
    onToggleSelection
}) => {
    const [editingTitle, setEditingTitle] = useState(null);
    const [titleValue, setTitleValue] = useState('');
    const [selectedIds, setSelectedIds] = useState(Array.isArray(selectedBugs) ? selectedBugs : []);

    // Debug logging for props and state
    useEffect(() => {
        console.log('BugTable props:', { selectedBugs, selectedIds, onBulkAction: !!onBulkAction, bugsLength: bugs.length });
    }, [selectedBugs, selectedIds, onBulkAction, bugs]);

    // Sync local state with prop changes
    useEffect(() => {
        setSelectedIds(Array.isArray(selectedBugs) ? selectedBugs : []);
    }, [selectedBugs]);

    const handleSelectAll = (checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        if (checked) {
            const allIds = bugs.map(bug => bug.id);
            setSelectedIds(allIds);
            allIds.forEach(id => onToggleSelection(id));
            toast.info(`Selected all ${bugs.length} bugs`);
        } else {
            setSelectedIds([]);
            bugs.forEach(bug => onToggleSelection(bug.id));
            toast.info('Cleared selection');
        }
    };

    const handleSelectItem = (id, checked) => {
        if (!onToggleSelection) {
            toast.error('You do not have permission to select bugs');
            return;
        }
        setSelectedIds(prev => {
            const newSelection = checked
                ? [...prev, id]
                : prev.filter(selectedId => selectedId !== id);
            console.log('handleSelectItem:', { id, checked, newSelection });
            toast.info(`${newSelection.length} bug${newSelection.length > 1 ? 's' : ''} selected`);
            return newSelection;
        });
        onToggleSelection(id);
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
                toast.info('Bug title updated');
            } catch (error) {
                console.error('Failed to update title:', error);
                toast.error('Failed to update bug title');
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
            toast.info(`Viewing "${bug.title}"`);
        } else if (onBugSelect) {
            onBugSelect(bug);
        }
    };

    const handleChatIconClick = (bug, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        if (onShowBugDetails) {
            onShowBugDetails(bug);
        }
        if (onChatIconClick) {
            onChatIconClick(bug, event);
        }
        if (onBugSelect) {
            onBugSelect(bug);
        }
    };

    const handleRowClick = (bug) => {
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
            <BulkActionButtons
                selectedIds={selectedIds}
                onBulkAction={onBulkAction}
            />
            <div className="overflow-x-auto">
                <table className="divide-y divide-gray-200" style={{ minWidth: '1400px' }}>
                    <thead className="bg-gray-50">
                        <tr className="h-12">
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
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 sticky left-12 bg-gray-50 z-30"
                                style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}
                            >
                                <div className="flex items-center h-full">Bug Title</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                            >
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Status</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Assigned To</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}
                            >
                                <div className="flex items-center h-full">Priority</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Severity</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Evidence</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                            >
                                <div className="flex items-center h-full">Environment</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '140px', minWidth: '140px', maxWidth: '140px' }}
                            >
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200"
                                style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}
                            >
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                                style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}
                            >
                                <div className="flex items-center h-full">Actions</div>
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
                                onClick={() => handleRowClick(bug)}
                                onChatClick={handleChatIconClick}
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