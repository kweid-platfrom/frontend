// components/Bugs/BugTable.js
'use client'

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { db } from '../../config/firebase';
import {
    collection,
    query,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { useProject } from '../../context/ProjectContext';
import BugTableRow from './BugTableRow';

export default function BugTable({
    refreshTrigger = 0,
    // Bug-specific props
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onBugSelect,
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    editingTitle,
    titleValue,
    onTitleEdit,
    onTitleSave,
    onTitleChange,
    onTitleKeyDown,
    selectedBug,
    onDragStart,
    isNewRow = false,
    onCreateBug,
    newRowData
}) {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [error, setError] = useState(null);

    const { activeProject } = useProject();

    // Fetch bugs from Firestore subcollection
    const fetchBugs = useCallback(async () => {
        if (!activeProject?.id) {
            setBugs([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Query the subcollection: projects/{projectId}/bugs
            const bugsRef = collection(db, 'projects', activeProject.id, 'bugs');
            const q = query(
                bugsRef,
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const bugList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt instanceof Timestamp
                    ? doc.data().createdAt.toDate()
                    : null,
                updatedAt: doc.data().updatedAt instanceof Timestamp
                    ? doc.data().updatedAt.toDate()
                    : null,
            }));

            setBugs(bugList);

            if (bugList.length === 0) {
                toast.info('No bugs found for this project');
            } else {
                toast.success(`Loaded ${bugList.length} bug${bugList.length > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error('Error fetching bugs:', error);
            const errorMessage = error.code === 'permission-denied'
                ? 'You do not have permission to view bugs for this project'
                : 'Failed to load bugs. Please try again.';

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [activeProject?.id]);

    // Fetch bugs on component mount and when activeProject changes
    useEffect(() => {
        fetchBugs();
    }, [fetchBugs, refreshTrigger]);

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(bugs.map(bug => bug.id));
            toast.info(`Selected all ${bugs.length} bugs`);
        } else {
            setSelectedIds([]);
            toast.info('Cleared selection');
        }
    };

    // Handle individual item selection
    const handleSelectItem = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => {
                const newSelection = [...prev, id];
                if (newSelection.length === 1) {
                    toast.info('1 bug selected');
                }
                return newSelection;
            });
        } else {
            setSelectedIds(prev => {
                const newSelection = prev.filter(selectedId => selectedId !== id);
                return newSelection;
            });
        }
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        toast.info(`Sorted by ${key} (${direction}ending)`);
    };

    // Sort bugs
    const sortedBugs = [...bugs].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
        }
        return 0;
    });

    // Handle bulk actions
    const handleBulkAction = async (action, ids) => {
        if (!hasPermission('write_bugs')) {
            toast.error('You do not have permission to perform bulk actions');
            return;
        }

        const actionLabels = {
            activate: 'Activating',
            archive: 'Archiving',
            delete: 'Deleting',
            resolve: 'Resolving',
            close: 'Closing'
        };

        try {
            toast.loading(`${actionLabels[action]} ${ids.length} bug${ids.length > 1 ? 's' : ''}...`, {
                id: 'bulk-action-toast'
            });

            const promises = ids.map(async (id) => {
                const bugRef = doc(db, 'projects', activeProject.id, 'bugs', id);

                switch (action) {
                    case 'resolve':
                        return updateDoc(bugRef, {
                            status: 'Resolved',
                            updatedAt: serverTimestamp()
                        });
                    case 'close':
                        return updateDoc(bugRef, {
                            status: 'Closed',
                            updatedAt: serverTimestamp()
                        });
                    case 'delete':
                        return deleteDoc(bugRef);
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.all(promises);
            await fetchBugs(); // Refresh the list
            setSelectedIds([]); // Clear selection

            toast.success(`Successfully ${action}d ${ids.length} bug${ids.length > 1 ? 's' : ''}`, {
                id: 'bulk-action-toast'
            });

            if (onBulkAction) onBulkAction(action, ids);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} bugs`, { id: 'bulk-action-toast' });
        }
    };

    // Get sort icon
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="w-3 h-3 text-gray-600" /> :
            <ChevronDown className="w-3 h-3 text-gray-600" />;
    };

    // Loading state
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bugs...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bugs</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={() => {
                        toast.loading('Retrying...', { id: 'retry-toast' });
                        fetchBugs().then(() => {
                            toast.success('Successfully refreshed bugs', { id: 'retry-toast' });
                        });
                    }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Empty state
    if (bugs.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🐛</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs found</h3>
                <p className="text-gray-600">
                    {activeProject ?
                        'Create your first bug report to get started' :
                        'Select a project to view bugs'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200">
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('resolve', selectedIds)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                disabled={!hasPermission('write_bugs')}
                            >
                                Resolve
                            </button>
                            <button
                                onClick={() => handleBulkAction('close', selectedIds)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                disabled={!hasPermission('write_bugs')}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete', selectedIds)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                disabled={!hasPermission('write_bugs')}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left border-r border-gray-200">
                                <div className="flex items-center">
                                    {selectedIds.length === bugs.length ? (
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
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Bug Title
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Tags
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Assigned To
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Priority
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('severity')}
                            >
                                <div className="flex items-center gap-1">
                                    Severity
                                    {getSortIcon('severity')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Evidence
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Reporter
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Source
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Environment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Device/Browser
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Due Date
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center gap-1">
                                    Created
                                    {getSortIcon('createdAt')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Frequency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* New row for adding bugs */}
                        {isNewRow && newRowData && (
                            <BugTableRow
                                bug={newRowData}
                                selectedBugs={selectedIds}
                                selectedBug={selectedBug}
                                onToggleSelection={(id) => handleSelectItem(id, !selectedIds.includes(id))}
                                onDragStart={onDragStart}
                                onUpdateBugStatus={onUpdateBugStatus}
                                onUpdateBugSeverity={onUpdateBugSeverity}
                                onUpdateBugAssignment={onUpdateBugAssignment}
                                onUpdateBugEnvironment={onUpdateBugEnvironment}
                                onBugSelect={onBugSelect}
                                teamMembers={teamMembers}
                                environments={environments}
                                isUpdating={isUpdating}
                                editingTitle={editingTitle}
                                titleValue={titleValue}
                                onTitleEdit={onTitleEdit}
                                onTitleSave={onTitleSave}
                                onTitleChange={onTitleChange}
                                onTitleKeyDown={onTitleKeyDown}
                                isNewRow={true}
                                onCreateBug={onCreateBug}
                            />
                        )}

                        {/* Existing bugs */}
                        {sortedBugs.map((bug) => (
                            <BugTableRow
                                key={bug.id}
                                bug={bug}
                                selectedBugs={selectedIds}
                                selectedBug={selectedBug}
                                onToggleSelection={(id) => handleSelectItem(id, !selectedIds.includes(id))}
                                onDragStart={onDragStart}
                                onUpdateBugStatus={onUpdateBugStatus}
                                onUpdateBugSeverity={onUpdateBugSeverity}
                                onUpdateBugAssignment={onUpdateBugAssignment}
                                onUpdateBugEnvironment={onUpdateBugEnvironment}
                                onBugSelect={onBugSelect}
                                teamMembers={teamMembers}
                                environments={environments}
                                isUpdating={isUpdating}
                                editingTitle={editingTitle}
                                titleValue={titleValue}
                                onTitleEdit={onTitleEdit}
                                onTitleSave={onTitleSave}
                                onTitleChange={onTitleChange}
                                onTitleKeyDown={onTitleKeyDown}
                                isNewRow={false}
                                onCreateBug={onCreateBug}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}