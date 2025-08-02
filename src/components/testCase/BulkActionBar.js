'use client';

import { CheckCircle, XCircle, Shield, Play, Trash2, Archive, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const BulkActionBar = ({ selectedCount, onBulkAction, selectedTestCases }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (selectedCount === 0) return null;

    const handleBulkActionClick = (action) => {
        if (action === 'delete') {
            setShowDeleteConfirm(true); // Show confirmation for delete
        } else if (onBulkAction) {
            onBulkAction(action, selectedTestCases);
        }
    };

    const confirmDelete = () => {
        if (onBulkAction) {
            onBulkAction('delete', selectedTestCases);
        }
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className="bg-background border-b border-border px-6 py-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium" role="status">
                    {selectedCount} test case{selectedCount > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Execution Actions */}
                    <div className="flex items-center gap-1 border-r border-border pr-2" role="group" aria-label="Execution actions">
                        <button
                            onClick={() => handleBulkActionClick('pass')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-success-700 bg-success-100 hover:bg-success-200 transition-colors"
                            title="Mark as Passed"
                            aria-label="Mark selected test cases as passed"
                        >
                            <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                            Pass
                        </button>
                        <button
                            onClick={() => handleBulkActionClick('fail')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-error-700 bg-error-100 hover:bg-error-200 transition-colors"
                            title="Mark as Failed"
                            aria-label="Mark selected test cases as failed"
                        >
                            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                            Fail
                        </button>
                        <button
                            onClick={() => handleBulkActionClick('block')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-warning-700 bg-warning-100 hover:bg-warning-200 transition-colors"
                            title="Mark as Blocked"
                            aria-label="Mark selected test cases as blocked"
                        >
                            <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
                            Block
                        </button>
                    </div>

                    {/* Test Actions */}
                    <div className="flex items-center gap-1 border-r border-border pr-2" role="group" aria-label="Test actions">
                        <button
                            onClick={() => handleBulkActionClick('run')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-accent-700 border border-accent-500 hover:bg-accent-50 transition-colors"
                            title="Run Tests"
                            aria-label="Run selected test cases"
                        >
                            <Play className="w-3 h-3 mr-1" aria-hidden="true" />
                            Run
                        </button>
                        <button
                            onClick={() => handleBulkActionClick('reset')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-accent-700 border border-accent-500 hover:bg-accent-50 transition-colors"
                            title="Reset to Draft & Not Executed"
                            aria-label="Reset selected test cases to draft status and not executed"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
                            Reset
                        </button>
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center gap-1 border-r border-border pr-2" role="group" aria-label="Status actions">
                        <button
                            onClick={() => handleBulkActionClick('activate')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-accent-700 border border-accent-500 hover:bg-accent-50 transition-colors"
                            title="Set Test Cases to Active"
                            aria-label="Set selected test cases to active status"
                        >
                            Active
                        </button>
                        <button
                            onClick={() => handleBulkActionClick('archive')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-accent-700 border border-accent-500 hover:bg-accent-50 transition-colors"
                            title="Archive Test Cases"
                            aria-label="Archive selected test cases"
                        >
                            <Archive className="w-3 h-3 mr-1" aria-hidden="true" />
                            Archive
                        </button>
                    </div>

                    {/* Destructive Actions */}
                    <div className="flex items-center gap-1 border-r border-border pr-2" role="group" aria-label="Destructive actions">
                        <button
                            onClick={() => handleBulkActionClick('delete')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-accent-700 border border-accent-500 hover:bg-accent-50 transition-colors"
                            title="Delete Test Cases"
                            aria-label="Delete selected test cases"
                        >
                            <Trash2 className="w-3 h-3 mr-1" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Confirm Deletion</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete {selectedCount} test case{selectedCount > 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-md"
                                aria-label="Cancel deletion"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-md"
                                aria-label="Confirm deletion"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkActionBar;