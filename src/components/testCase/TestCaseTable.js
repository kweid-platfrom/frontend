// components/TestCases/TestCaseTable.js
'use client'

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
    Edit3, 
    Copy, 
    Trash2, 
    Play, 
    Eye, 
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
    addDoc,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { useSuite } from '../../context/SuiteContext';
import { useAuth } from '../../context/AuthProvider';

export default function TestCaseTable({ 
    onEdit, 
    onDelete, 
    onDuplicate, 
    onBulkAction,
    onView,
    onRun,
    refreshTrigger = 0
}) {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
    const [error, setError] = useState(null);
    
    const { activeSuite } = useSuite();
    const { currentUser, hasPermission } = useAuth();

    // Fetch test cases from Firestore subcollection
    const fetchTestCases = useCallback(async () => {
        if (!activeSuite?.id) {
            setTestCases([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Query the subcollection: suites/{suiteId}/testCases
            const testCasesRef = collection(db, 'suites', activeSuite.id, 'testCases');
            const q = query(
                testCasesRef,
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const testCaseList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }));

            setTestCases(testCaseList);
            
            if (testCaseList.length === 0) {
                toast.info('No test cases found for this suite');
            } else {
                toast.success(`Loaded ${testCaseList.length} test case${testCaseList.length > 1 ? 's' : ''}`);
            }
        } catch (error) {
            console.error('Error fetching test cases:', error);
            const errorMessage = error.code === 'permission-denied' 
                ? 'You do not have permission to view test cases for this suite'
                : 'Failed to load test cases. Please try again.';
            
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [activeSuite?.id]);

    // Fetch test cases on component mount and when activeSuite changes
    useEffect(() => {
        fetchTestCases();
    }, [fetchTestCases, refreshTrigger]);

    // Handle select all checkbox
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(testCases.map(tc => tc.id));
            toast.info(`Selected all ${testCases.length} test cases`);
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
                    toast.info('1 test case selected');
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

    // Sort test cases
    const sortedTestCases = [...testCases].sort((a, b) => {
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

    // Handle individual test case deletion
    const handleDelete = async (testCaseId, testCaseTitle) => {
        if (!hasPermission('write_tests')) {
            toast.error('You do not have permission to delete test cases');
            return;
        }

        // Show confirmation toast
        toast.custom((t) => (
            <div className="flex flex-col gap-2 p-4 bg-white border border-red-200 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-gray-900">Delete Test Case</span>
                </div>
                <p className="text-sm text-gray-600">
                    Are you sure you want to delete &quot;{testCaseTitle}&quot;?
                </p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t);
                            try {
                                toast.loading('Deleting test case...', { id: 'delete-toast' });
                                
                                // Delete from subcollection
                                await deleteDoc(doc(db, 'suites', activeSuite.id, 'testCases', testCaseId));
                                await fetchTestCases(); // Refresh the list
                                
                                toast.success('Test case deleted successfully', { id: 'delete-toast' });
                                if (onDelete) onDelete(testCaseId);
                            } catch (error) {
                                console.error('Error deleting test case:', error);
                                toast.error('Failed to delete test case', { id: 'delete-toast' });
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    // Handle test case duplication
    const handleDuplicate = async (testCase) => {
        if (!hasPermission('write_tests')) {
            toast.error('You do not have permission to duplicate test cases');
            return;
        }

        try {
            toast.loading('Duplicating test case...', { id: 'duplicate-toast' });
            
            const duplicatedTestCase = {
                ...testCase,
                title: `${testCase.title} (Copy)`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser.uid,
                status: 'draft'
            };
            
            // Remove the original id
            delete duplicatedTestCase.id;
            
            // Add to subcollection
            await addDoc(collection(db, 'suites', activeSuite.id, 'testCases'), duplicatedTestCase);
            await fetchTestCases(); // Refresh the list
            
            toast.success(`Test case "${testCase.title}" duplicated successfully`, { id: 'duplicate-toast' });
            if (onDuplicate) onDuplicate(testCase);
        } catch (error) {
            console.error('Error duplicating test case:', error);
            toast.error('Failed to duplicate test case', { id: 'duplicate-toast' });
        }
    };

    // Handle bulk actions
    const handleBulkAction = async (action, ids) => {
        if (!hasPermission('write_tests')) {
            toast.error('You do not have permission to perform bulk actions');
            return;
        }

        const actionLabels = {
            activate: 'Activating',
            archive: 'Archiving',
            delete: 'Deleting'
        };

        try {
            toast.loading(`${actionLabels[action]} ${ids.length} test case${ids.length > 1 ? 's' : ''}...`, { 
                id: 'bulk-action-toast' 
            });
            
            const promises = ids.map(async (id) => {
                const testCaseRef = doc(db, 'suites', activeSuite.id, 'testCases', id);
                
                switch (action) {
                    case 'activate':
                        return updateDoc(testCaseRef, { 
                            status: 'active', 
                            updatedAt: serverTimestamp() 
                        });
                    case 'archive':
                        return updateDoc(testCaseRef, { 
                            status: 'archived', 
                            updatedAt: serverTimestamp() 
                        });
                    case 'delete':
                        return deleteDoc(testCaseRef);
                    default:
                        return Promise.resolve();
                }
            });

            await Promise.all(promises);
            await fetchTestCases(); // Refresh the list
            setSelectedIds([]); // Clear selection
            
            toast.success(`Successfully ${action}d ${ids.length} test case${ids.length > 1 ? 's' : ''}`, { 
                id: 'bulk-action-toast' 
            });
            
            if (onBulkAction) onBulkAction(action, ids);
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            toast.error(`Failed to ${action} test cases`, { id: 'bulk-action-toast' });
        }
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const statusConfig = {
            active: 'bg-green-100 text-green-800 border-green-200',
            draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200',
            deprecated: 'bg-red-100 text-red-800 border-red-200'
        };
        return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get priority badge styling
    const getPriorityBadge = (priority) => {
        const priorityConfig = {
            high: 'bg-red-100 text-red-800 border-red-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return priorityConfig[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
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
                <p className="mt-4 text-gray-600">Loading test cases...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-200 text-6xl mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Test Cases</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                    onClick={() => {
                        toast.loading('Retrying...', { id: 'retry-toast' });
                        fetchTestCases().then(() => {
                            toast.success('Successfully refreshed test cases', { id: 'retry-toast' });
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
    if (testCases.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
                <p className="text-gray-600">
                    {activeSuite ? 
                        'Create your first test case to get started' : 
                        'Select a suite to view test cases'
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
                            {selectedIds.length} test case{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction('activate', selectedIds)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                disabled={!hasPermission('write_tests')}
                            >
                                Activate
                            </button>
                            <button
                                onClick={() => handleBulkAction('archive', selectedIds)}
                                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                                disabled={!hasPermission('write_tests')}
                            >
                                Archive
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete', selectedIds)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                disabled={!hasPermission('write_tests')}
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
                                    {selectedIds.length === testCases.length ? (
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
                                    Test Case
                                    {getSortIcon('title')}
                                </div>
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
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Tags
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Assignee
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200"
                                onClick={() => handleSort('updatedAt')}
                            >
                                <div className="flex items-center gap-1">
                                    Updated
                                    {getSortIcon('updatedAt')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTestCases.map((testCase) => (
                            <tr key={testCase.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div className="flex items-center">
                                        {selectedIds.includes(testCase.id) ? (
                                            <CheckSquare 
                                                className="w-4 h-4 text-teal-600 cursor-pointer" 
                                                onClick={() => handleSelectItem(testCase.id, false)}
                                            />
                                        ) : (
                                            <Square 
                                                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600" 
                                                onClick={() => handleSelectItem(testCase.id, true)}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {testCase.title}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {testCase.description}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(testCase.status)}`}>
                                        {testCase.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(testCase.priority)}`}>
                                        {testCase.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-200">
                                    <div className="flex flex-wrap gap-1">
                                        {testCase.tags?.slice(0, 2).map((tag, index) => (
                                            <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded border border-gray-200">
                                                {tag}
                                            </span>
                                        ))}
                                        {testCase.tags?.length > 2 && (
                                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded border border-gray-200">
                                                +{testCase.tags.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                                    {testCase.assignee || 'Unassigned'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">
                                    {testCase.updatedAt ? 
                                        formatDistanceToNow(testCase.updatedAt, { addSuffix: true }) :
                                        'Never'
                                    }
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (onView) onView(testCase);
                                                toast.info(`Viewing "${testCase.title}"`);
                                            }}
                                            className="p-1 text-teal-600 hover:text-teal-900 hover:bg-blue-50 rounded transition-colors"
                                            title="View Test Case"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onRun) onRun(testCase);
                                                toast.loading(`Running "${testCase.title}"...`);
                                            }}
                                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                                            title="Run Test Case"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                        {hasPermission('write_tests') && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (onEdit) onEdit(testCase);
                                                        toast.info(`Editing "${testCase.title}"`);
                                                    }}
                                                    className="p-1 text-teal-600 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors"
                                                    title="Edit Test Case"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(testCase)}
                                                    className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                                    title="Duplicate Test Case"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(testCase.id, testCase.title)}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Test Case"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}