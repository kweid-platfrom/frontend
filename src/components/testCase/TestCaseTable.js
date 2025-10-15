/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/context/AppProvider';
import {
    CheckSquare,
    Square,
    ChevronUp,
    ChevronDown,
    Bot,
    User,
    MessageSquare,
    CheckCircle,
    XCircle,
    Shield,
    Clock,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';
import TestCaseSideModal from '../testCase/TestCaseSideModal';

const TestCaseTable = ({
    testCases = [],
    bugs = [],
    relationships = { testCaseToBugs: {} },
    loading,
    onEdit,
    onBulkAction,
    selectedTestCases,
    onSelectTestCases,
    onLinkBug,
    onUpdateExecutionStatus,
}) => {
    const { actions: { ui: { showNotification } } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
    const [sideModalOpen, setSideModalOpen] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            onSelectTestCases(testCases.map((tc) => tc.id));
        } else {
            onSelectTestCases([]);
        }
    }, [testCases, onSelectTestCases]);

    const handleSelectItem = useCallback((id, checked) => {
        if (checked) {
            onSelectTestCases([...selectedTestCases, id]);
        } else {
            onSelectTestCases(selectedTestCases.filter((selectedId) => selectedId !== id));
        }
    }, [selectedTestCases, onSelectTestCases]);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
        setCurrentPage(1); // Reset to first page when sorting
    }, []);

    const sortedTestCases = useMemo(() => {
        return [...testCases].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (sortConfig.key === 'updated_at' || sortConfig.key === 'lastExecuted') {
                    const aDate = aValue instanceof Date ? aValue : new Date(aValue);
                    const bDate = bValue instanceof Date ? bValue : new Date(bValue);
                    if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
                    if (isNaN(aDate.getTime())) return 1;
                    if (isNaN(bDate.getTime())) return -1;
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });
    }, [testCases, sortConfig]);

    // Pagination calculations
    const totalItems = sortedTestCases.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTestCases = sortedTestCases.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    const handleChatClick = useCallback((testCase) => {
        setSelectedTestCase(testCase);
        setSideModalOpen(true);
    }, []);

    const handleSideModalClose = useCallback(() => {
        setSideModalOpen(false);
        setSelectedTestCase(null);
    }, []);

    const handleSideModalSave = useCallback((updatedTestCase) => {
        if (onEdit) {
            onEdit(updatedTestCase);
        }
        setSideModalOpen(false);
        setSelectedTestCase(null);
    }, [onEdit]);

    const handleExecutionStatusChange = useCallback((testCaseId, status) => {
        if (onUpdateExecutionStatus) {
            onUpdateExecutionStatus(testCaseId, status);
        }
    }, [onUpdateExecutionStatus]);

    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            active: 'bg-teal-50 text-teal-800 border border-teal-300',
            draft: 'bg-muted text-muted-foreground border border-border',
            archived: 'bg-muted text-muted-foreground border border-border',
            deprecated: 'bg-destructive/20 text-destructive-foreground border border-destructive',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-muted text-muted-foreground border border-border';
    }, []);

    const getPriorityBadge = useCallback((priority) => {
        const priorityConfig = {
            high: 'bg-destructive/20 text-destructive-foreground border border-destructive',
            medium: 'bg-warning/20 text-warning border border-border',
            low: 'bg-info/20 text-info border border-border',
        };
        return priorityConfig[priority?.toLowerCase()] || 'bg-muted text-muted-foreground border border-border';
    }, []);

    const getExecutionStatusBadge = useCallback((status) => {
        const statusConfig = {
            passed: { bg: 'bg-teal-50', text: 'text-teal-800', icon: CheckCircle, border: 'border-teal-300' },
            failed: { bg: 'bg-destructive/20', text: 'text-destructive', icon: XCircle, border: 'border-destructive' },
            blocked: { bg: 'bg-warning/20', text: 'text-warning', icon: Shield, border: 'border-border' },
            not_executed: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock, border: 'border-border' },
        };
        const config = statusConfig[status] || statusConfig.not_executed;
        const IconComponent = config.icon;

        return (
            <div className={`flex items-center gap-1 px-2 py-2 ${config.bg} ${config.text} rounded text-xs font-medium whitespace-nowrap w-28 justify-center border ${config.border}`}>
                <IconComponent className="w-3 h-3" />
                <span>{status?.replace('_', ' ') || 'Not Executed'}</span>
            </div>
        );
    }, []);

    const getAutomationBadge = useCallback((isAutomated) => {
        if (isAutomated) {
            return (
                <div className="flex items-center gap-1 px-2 py-2 bg-info/20 text-info rounded text-xs font-medium whitespace-nowrap border border-info">
                    <Bot className="w-3 h-3" />
                    <span>Automated</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 px-2 py-2 bg-muted text-muted-foreground rounded text-xs font-medium whitespace-nowrap border border-border">
                <User className="w-3 h-3" />
                <span>Manual</span>
            </div>
        );
    }, []);

    const getSeverityBadge = useCallback((severity) => {
        const severityConfig = {
            critical: 'bg-destructive/20 text-destructive-foreground border border-destructive',
            high: 'bg-orange-100 text-orange-800 border border-orange-200',
            medium: 'bg-warning/20 text-warning border border-border',
            low: 'bg-info/20 text-info border border-border',
        };
        return severityConfig[severity?.toLowerCase()] || 'bg-muted text-muted-foreground border border-border';
    }, []);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-muted-foreground" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-foreground" />
        ) : (
            <ChevronDown className="w-3 h-3 text-foreground" />
        );
    }, [sortConfig]);

    const isValidDate = useCallback((date) => {
        return date instanceof Date && !isNaN(date.getTime());
    }, []);

    const bugOptions = useMemo(() =>
        Array.isArray(bugs)
            ? bugs.map((bug) => ({
                value: bug.id || `bug_${Math.random().toString(36).slice(2)}`,
                label: bug.title || `Bug ${bug.id?.slice(-6) || 'Unknown'}`,
            }))
            : [],
        [bugs]
    );

    const isAllSelected = selectedTestCases.length === testCases.length && testCases.length > 0;

    return (
        <div className="relative bg-card shadow-theme-sm rounded-lg border border-border">
            <EnhancedBulkActionsBar
                selectedItems={selectedTestCases}
                onClearSelection={() => onSelectTestCases([])}
                assetType="testCases"
                pageTitle="test case"
                onAction={onBulkAction}
                loadingActions={[]}
            />

            <div className="relative overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted sticky top-0 z-20">
                        <tr>
                            <th className="px-4 py-3 text-left border-r border-border w-12 sticky left-0 bg-muted z-30">
                                <div className="flex items-center">
                                    {isAllSelected ? (
                                        <CheckSquare
                                            className="w-4 h-4 text-primary cursor-pointer"
                                            onClick={() => handleSelectAll(false)}
                                        />
                                    ) : (
                                        <Square
                                            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                            onClick={() => handleSelectAll(true)}
                                        />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-64 sticky left-12 bg-muted z-30"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Test Cases
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('severity')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Severity
                                    {getSortIcon('severity')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-48"
                                onClick={() => handleSort('executionStatus')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Execution Status
                                    {getSortIcon('executionStatus')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('automation_status')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Automation
                                    {getSortIcon('automation_status')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('assignee')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Assignee
                                    {getSortIcon('assignee')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('component')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Component
                                    {getSortIcon('component')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('testType')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Test Type
                                    {getSortIcon('testType')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('environment')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Environment
                                    {getSortIcon('environment')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('estimatedTime')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Est. Time
                                    {getSortIcon('estimatedTime')}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border w-48">
                                <span className="whitespace-nowrap">Linked Bugs</span>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary border-r border-border w-32"
                                onClick={() => handleSort('lastExecuted')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Last Run
                                    {getSortIcon('lastExecuted')}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-secondary w-32"
                                onClick={() => handleSort('updated_at')}
                            >
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                    Last Updated
                                    {getSortIcon('updated_at')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {paginatedTestCases.length === 0 ? (
                            <tr>
                                <td colSpan={15} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                    No test cases found
                                </td>
                            </tr>
                        ) : (
                            paginatedTestCases.map((testCase) => {
                                const updatedAt = testCase.updated_at instanceof Date ? testCase.updated_at : new Date(testCase.updated_at);
                                const lastExecuted = testCase.lastExecuted instanceof Date ? testCase.lastExecuted : new Date(testCase.lastExecuted);
                                const linkedBugs = relationships.testCaseToBugs[testCase.id] || [];

                                return (
                                    <tr key={testCase.id} className="hover:bg-secondary">
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-12 sticky left-0 bg-card z-20">
                                            <div className="flex items-center">
                                                {selectedTestCases.includes(testCase.id) ? (
                                                    <CheckSquare
                                                        className="w-4 h-4 text-primary cursor-pointer"
                                                        onClick={() => handleSelectItem(testCase.id, false)}
                                                    />
                                                ) : (
                                                    <Square
                                                        className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary"
                                                        onClick={() => handleSelectItem(testCase.id, true)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-64 sticky left-12 bg-card z-20">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-foreground truncate max-w-[200px]" title={testCase.title}>
                                                    {testCase.title || 'Untitled Test Case'}
                                                </div>
                                                <div className="flex-shrink-0 border-l border-border pl-2">
                                                    <button
                                                        onClick={() => handleChatClick(testCase)}
                                                        className="ml-1 p-2 rounded focus:outline-none focus:ring-2 focus:ring-ring"
                                                        title="View/Edit Test Case"
                                                    >
                                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <span
                                                className={`px-2.5 py-1.5 inline-flex text-xs w-16 leading-5 font-semibold rounded whitespace-nowrap border ${getStatusBadge(
                                                    testCase.status
                                                )}`}
                                            >
                                                {testCase.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <span
                                                className={`px-2.5 py-1.5 w-20 inline-flex text-xs leading-5 font-semibold rounded whitespace-nowrap border ${getPriorityBadge(
                                                    testCase.priority
                                                )}`}
                                            >
                                                {testCase.priority || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <span
                                                className={`px-2.5 py-1.5 w-20 inline-flex text-xs leading-5 font-semibold rounded whitespace-nowrap border ${getSeverityBadge(
                                                    testCase.severity
                                                )}`}
                                            >
                                                {testCase.severity || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-48">
                                            <div className="flex items-center gap-2">
                                                <div className="w-28 flex justify-start">
                                                    {getExecutionStatusBadge(testCase.executionStatus)}
                                                </div>
                                                <div className="w-px h-6 bg-border"></div>
                                                <div className="w-24 flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'passed')}
                                                        className="p-1.5 text-success hover:bg-teal-50 rounded transition-colors"
                                                        title="Mark as Passed"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'failed')}
                                                        className="p-1.5 text-error hover:bg-destructive/20 rounded transition-colors"
                                                        title="Mark as Failed"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'blocked')}
                                                        className="p-1.5 text-warning hover:bg-warning/20 rounded transition-colors"
                                                        title="Mark as Blocked"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            {getAutomationBadge(testCase.is_automated || testCase.automation_status === 'automated')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-foreground truncate max-w-[120px]" title={testCase.assignee}>
                                                {testCase.assignee || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-foreground truncate max-w-[120px]" title={testCase.component}>
                                                {testCase.component || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-foreground truncate max-w-[120px]" title={testCase.testType}>
                                                {testCase.testType || 'Functional'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-foreground truncate max-w-[120px]" title={testCase.environment}>
                                                {testCase.environment || 'Testing'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-foreground whitespace-nowrap">
                                                {testCase.estimatedTime ? `${testCase.estimatedTime} min` : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-48 relative">
                                            <div className="w-48">
                                                <MultiSelectDropdown
                                                    options={bugOptions}
                                                    value={linkedBugs}
                                                    onChange={(newBugs) => onLinkBug(testCase.id, newBugs)}
                                                    placeholder="Link Bugs..."
                                                    type="bugs"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap border-r border-border w-32">
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {isValidDate(lastExecuted) && testCase.lastExecuted
                                                    ? formatDistanceToNow(lastExecuted, { addSuffix: true })
                                                    : 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap w-32">
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {isValidDate(updatedAt)
                                                    ? formatDistanceToNow(updatedAt, { addSuffix: true })
                                                    : 'Invalid Date'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Global Pagination Component */}
            {!loading && totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            )}

            <TestCaseSideModal
                isOpen={sideModalOpen}
                testCase={selectedTestCase}
                onClose={handleSideModalClose}
                onSave={handleSideModalSave}
            />
        </div>
    );
};

export default TestCaseTable;