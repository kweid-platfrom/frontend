'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import BugTableHeader from './BugTableHeader';
import BugRow from './BugTableRow';
import { sortBugs } from '../../utils/BugTableUtils';

// Main Component: BugTable
const BugTable = ({
    bugs = [],
    testCases = [],
    relationships = {},
    teamMembers = [],
    environments = [],
    loading = false,
    onBulkAction,
    onView,
    onLinkTestCase,
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedIds(bugs.map((bug) => bug.id));
            toast.info(`Selected all ${bugs.length} bugs`);
        } else {
            setSelectedIds([]);
            toast.info('Cleared selection');
        }
    }, [bugs]);

    const handleSelectItem = useCallback((id, checked) => {
        setSelectedIds((prev) => {
            const newSelection = checked ? [...prev, id] : prev.filter((selectedId) => selectedId !== id);
            if (checked && newSelection.length === 1) toast.info('1 bug selected');
            return newSelection;
        });
    }, []);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => {
            const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
            toast.info(`Sorted by ${key} (${direction}ending)`);
            return { key, direction };
        });
    }, []);

    const handleBulkActionClick = useCallback((action) => {
        if (onBulkAction) onBulkAction(action, selectedIds);
    }, [onBulkAction, selectedIds]);

    const handleStatusChange = useCallback(async (bugId, newStatus) => {
        try {
            await onBulkAction('update', [bugId], { status: newStatus });
            toast.success('Status updated');
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
        }
    }, [onBulkAction]);

    const handleSeverityChange = useCallback(async (bugId, newSeverity) => {
        try {
            await onBulkAction('update', [bugId], {
                severity: newSeverity,
                priority: getPriorityFromSeverity(newSeverity),
            });
            toast.success('Severity updated');
        } catch (error) {
            console.error('Failed to update severity:', error);
            toast.error('Failed to update severity');
        }
    }, [onBulkAction]);

    const handleAssignmentChange = useCallback(async (bugId, newAssignee) => {
        try {
            await onBulkAction('update', [bugId], { assigned_to: newAssignee });
            toast.success('Assignee updated');
        } catch (error) {
            console.error('Failed to update assignee:', error);
            toast.error('Failed to update assignee');
        }
    }, [onBulkAction]);

    const handleEnvironmentChange = useCallback(async (bugId, newEnvironment) => {
        try {
            await onBulkAction('update', [bugId], { environment: newEnvironment });
            toast.success('Environment updated');
        } catch (error) {
            console.error('Failed to update environment:', error);
            toast.error('Failed to update environment');
        }
    }, [onBulkAction]);

    const handleFrequencyChange = useCallback(async (bugId, newFrequency) => {
        try {
            await onBulkAction('update', [bugId], { frequency: newFrequency });
            toast.success('Frequency updated');
        } catch (error) {
            console.error('Failed to update frequency:', error);
            toast.error('Failed to update frequency');
        }
    }, [onBulkAction]);

    const testCaseOptions = Array.isArray(testCases)
        ? testCases.map((tc) => ({
              value: tc.id || tc.testCaseId || `tc_${Math.random().toString(36).slice(2)}`,
              label: tc.title || `Test Case ${tc.id?.slice(-6) || tc.testCaseId?.slice(-6) || 'Unknown'}`,
          }))
        : [];

    const sortedBugs = sortBugs(bugs, sortConfig);

    return (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200 relative">
            {selectedIds.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-200 px-6 py-3 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-teal-700 font-medium">
                            {selectedIds.length} bug{selectedIds.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkActionClick('open')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Open
                            </button>
                            <button
                                onClick={() => handleBulkActionClick('close')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleBulkActionClick('delete')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <BugTableHeader
                        sortConfig={sortConfig}
                        handleSort={handleSort}
                        handleSelectAll={handleSelectAll}
                        selectedIds={selectedIds}
                        bugs={bugs}
                    />
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={18} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Loading bugs...
                                </td>
                            </tr>
                        ) : sortedBugs.length === 0 ? (
                            <tr>
                                <td colSpan={18} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No bugs found
                                </td>
                            </tr>
                        ) : (
                            sortedBugs.map((bug) => (
                                <BugRow
                                    key={bug.id}
                                    bug={bug}
                                    isSelected={selectedIds.includes(bug.id)}
                                    handleSelectItem={handleSelectItem}
                                    onChatClick={onView}
                                    onLinkTestCase={onLinkTestCase}
                                    teamMembers={teamMembers}
                                    environments={environments}
                                    testCaseOptions={testCaseOptions}
                                    handleStatusChange={handleStatusChange}
                                    handleSeverityChange={handleSeverityChange}
                                    handleAssignmentChange={handleAssignmentChange}
                                    handleEnvironmentChange={handleEnvironmentChange}
                                    handleFrequencyChange={handleFrequencyChange}
                                    relationships={relationships}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BugTable;