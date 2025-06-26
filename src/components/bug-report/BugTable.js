import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { db } from '../../config/firebase';
import {
    collection,
    query,
    getDocs,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { useProject } from '../../context/SuiteContext';
import { useAuth } from '../../context/AuthProvider';
import { CheckSquare, Square  } from 'lucide-react';
import BugTableRow from './BugTableRow';

// Import utility functions
import {
    VALID_ENVIRONMENTS // Add this to your utils if not already there
} from '../../utils/bugUtils';

// Default environment options if not available in utils
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

const BugTable = ({
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
    environments = VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS,
    isUpdating = new Set()
}) => {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingTitle, setEditingTitle] = useState(null);
    const [titleValue, setTitleValue] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const { activeProject } = useProject();
    const { hasPermission } = useAuth();

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
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }));

            setBugs(bugList);
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
    }, [fetchBugs]);

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

    // Handle bulk actions
    const handleBulkAction = async (action, ids) => {
        if (!hasPermission('write_bugs')) {
            toast.error('You do not have permission to perform bulk actions');
            return;
        }

        try {
            const promises = ids.map(async (id) => {
                const bugRef = doc(db, 'projects', activeProject.id, 'bugs', id);

                switch (action) {
                    case 'close':
                        return updateDoc(bugRef, {
                            status: 'Closed',
                            updatedAt: serverTimestamp()
                        });
                    case 'reopen':
                        return updateDoc(bugRef, {
                            status: 'Open',
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

            toast.success(`Successfully ${action}d ${ids.length} bug${ids.length > 1 ? 's' : ''}`);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} bugs`);
        }
    };

    // Handle immediate bug updates
    const handleImmediateStatusUpdate = async (bugId, newStatus) => {
        try {
            const bugRef = doc(db, 'projects', activeProject.id, 'bugs', bugId);
            await updateDoc(bugRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // Update local state immediately
            setBugs(prev => prev.map(bug =>
                bug.id === bugId ? { ...bug, status: newStatus } : bug
            ));

            if (onUpdateBugStatus) onUpdateBugStatus(bugId, newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleImmediateSeverityUpdate = async (bugId, newSeverity) => {
        try {
            const bugRef = doc(db, 'projects', activeProject.id, 'bugs', bugId);
            await updateDoc(bugRef, {
                severity: newSeverity,
                updatedAt: serverTimestamp()
            });

            // Update local state immediately
            setBugs(prev => prev.map(bug =>
                bug.id === bugId ? { ...bug, severity: newSeverity } : bug
            ));

            if (onUpdateBugSeverity) onUpdateBugSeverity(bugId, newSeverity);
        } catch (error) {
            console.error('Error updating severity:', error);
            toast.error('Failed to update severity');
        }
    };

    const handleImmediateAssignmentUpdate = async (bugId, newAssignee) => {
        try {
            const bugRef = doc(db, 'projects', activeProject.id, 'bugs', bugId);
            await updateDoc(bugRef, {
                assignedTo: newAssignee,
                updatedAt: serverTimestamp()
            });

            // Update local state immediately
            setBugs(prev => prev.map(bug =>
                bug.id === bugId ? { ...bug, assignedTo: newAssignee } : bug
            ));

            if (onUpdateBugAssignment) onUpdateBugAssignment(bugId, newAssignee);
        } catch (error) {
            console.error('Error updating assignment:', error);
            toast.error('Failed to update assignment');
        }
    };

    const handleImmediateEnvironmentUpdate = async (bugId, newEnvironment) => {
        try {
            const bugRef = doc(db, 'projects', activeProject.id, 'bugs', bugId);
            await updateDoc(bugRef, {
                environment: newEnvironment,
                updatedAt: serverTimestamp()
            });

            // Update local state immediately
            setBugs(prev => prev.map(bug =>
                bug.id === bugId ? { ...bug, environment: newEnvironment } : bug
            ));

            if (onUpdateBugEnvironment) onUpdateBugEnvironment(bugId, newEnvironment);
        } catch (error) {
            console.error('Error updating environment:', error);
            toast.error('Failed to update environment');
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-3">
                {/* Optional: replace this with your real skeleton */}
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

    // Error state - Centered on page
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
                        <button
                            onClick={fetchBugs}
                            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                        >
                            Try Again
                        </button>
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
                                disabled={!hasPermission('write_bugs')}
                            >
                                Reopen
                            </button>
                            <button
                                onClick={() => handleBulkAction('close', selectedIds)}
                                className="px-2 py-1 bg-[#fff] text-gray-600 text-xs rounded-full hover:text-teal-800 shadow-md transition-colors"
                                disabled={!hasPermission('write_bugs')}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete', selectedIds)}
                                className="px-2 py-1 bg-[#fff] text-gray-600 text-xs shadow-md rounded-full hover:text-red-500 transition-colors"
                                disabled={!hasPermission('write_bugs')}
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
                            {/* New Chat column for bug details trigger */}
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
                                    onUpdateBugStatus={handleImmediateStatusUpdate}
                                    onUpdateBugSeverity={handleImmediateSeverityUpdate}
                                    onUpdateBugAssignment={handleImmediateAssignmentUpdate}
                                    onUpdateBugEnvironment={handleImmediateEnvironmentUpdate}
                                    onUpdateBugTitle={onUpdateBugTitle}
                                    onShowBugDetails={handleShowBugDetails}
                                    onChatIconClick={handleChatIconClick} // Pass the chat icon click handler
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
                                <td colSpan="18" className="px-6 py-8 text-center"> {/* Updated colspan to 18 for new chat column */}
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