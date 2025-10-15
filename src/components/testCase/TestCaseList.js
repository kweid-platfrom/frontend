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
    ArrowUpDown,
    Calendar,
    User as UserIcon,
    Tag,
    Settings,
} from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';
import TestCaseSideModal from '../testCase/TestCaseSideModal';

const TestCaseList = ({
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
    const { actions: { } } = useApp();
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
    const [sideModalOpen, setSideModalOpen] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [showSortMenu, setShowSortMenu] = useState(false);

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
        setCurrentPage(1);
        setShowSortMenu(false);
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
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTestCases = sortedTestCases.slice(startIndex, endIndex);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
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

    const getSeverityBadge = useCallback((severity) => {
        const severityConfig = {
            critical: 'bg-destructive/20 text-destructive-foreground border border-destructive',
            high: 'bg-orange-100 text-orange-800 border border-orange-200',
            medium: 'bg-warning/20 text-warning border border-border',
            low: 'bg-info/20 text-info border border-border',
        };
        return severityConfig[severity?.toLowerCase()] || 'bg-muted text-muted-foreground border border-border';
    }, []);

    const getExecutionStatusBadge = useCallback((status) => {
        const statusConfig = {
            passed: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', icon: CheckCircle },
            failed: { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive', icon: XCircle },
            blocked: { bg: 'bg-warning/20', text: 'text-warning', border: 'border-border', icon: Shield },
            not_executed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', icon: Clock },
        };
        const config = statusConfig[status] || statusConfig.not_executed;
        const IconComponent = config.icon;

        return (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                <IconComponent className="w-3.5 h-3.5" />
                <span>{status?.replace('_', ' ') || 'Not Executed'}</span>
            </div>
        );
    }, []);

    const getAutomationBadge = useCallback((isAutomated) => {
        if (isAutomated) {
            return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-info/20 text-info border-info">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Automated</span>
                </div>
            );
        }
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
                <User className="w-3.5 h-3.5" />
                <span>Manual</span>
            </div>
        );
    }, []);

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

    const sortOptions = [
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'severity', label: 'Severity' },
        { key: 'executionStatus', label: 'Execution Status' },
        { key: 'assignee', label: 'Assignee' },
        { key: 'lastExecuted', label: 'Last Run' },
        { key: 'updated_at', label: 'Last Updated' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Enhanced Bulk Actions Bar */}
            <EnhancedBulkActionsBar
                selectedItems={selectedTestCases}
                onClearSelection={() => onSelectTestCases([])}
                assetType="testCases"
                pageTitle="test case"
                onAction={onBulkAction}
                loadingActions={[]}
            />

            <div className="mx-auto">
                {/* Modern Header */}
                <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Selection Controls */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    {isAllSelected ? (
                                        <CheckSquare
                                            className="w-5 h-5 text-primary cursor-pointer hover:text-primary/80 transition-colors"
                                            onClick={() => handleSelectAll(false)}
                                        />
                                    ) : (
                                        <Square
                                            className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => handleSelectAll(true)}
                                        />
                                    )}
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedTestCases.length > 0 
                                            ? `${selectedTestCases.length} selected` 
                                            : 'Select All'
                                        }
                                    </span>
                                </div>
                                {totalItems > 0 && (
                                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {totalItems} test cases
                                    </div>
                                )}
                            </div>

                            {/* Sort Controls */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortMenu(!showSortMenu)}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                                >
                                    <ArrowUpDown className="w-4 h-4" />
                                    Sort by {sortOptions.find(opt => opt.key === sortConfig.key)?.label || 'Updated'}
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {showSortMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-theme-lg z-40">
                                        <div className="py-2">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.key}
                                                    onClick={() => handleSort(option.key)}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center justify-between ${
                                                        sortConfig.key === option.key ? 'text-primary bg-primary/5' : 'text-foreground'
                                                    }`}
                                                >
                                                    <span>{option.label}</span>
                                                    {sortConfig.key === option.key && (
                                                        sortConfig.direction === 'asc' ? 
                                                        <ChevronUp className="w-3 h-3" /> : 
                                                        <ChevronDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="px-6 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <div className="text-foreground">Loading test cases...</div>
                            </div>
                        </div>
                    ) : paginatedTestCases.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Settings className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="text-foreground text-lg font-medium mb-2">No test cases found</div>
                                <div className="text-muted-foreground">Try adjusting your filters or create a new test case</div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {paginatedTestCases.map((testCase) => {
                                const updatedAt = testCase.updated_at instanceof Date ? testCase.updated_at : new Date(testCase.updated_at);
                                const lastExecuted = testCase.lastExecuted instanceof Date ? testCase.lastExecuted : new Date(testCase.lastExecuted);
                                const linkedBugs = relationships.testCaseToBugs[testCase.id] || [];

                                return (
                                    <div
                                        key={testCase.id}
                                        className="group bg-card rounded-xl border border-border shadow-theme-sm hover:shadow-theme-md hover:border-primary/50 transition-all duration-200"
                                    >
                                        {/* Card Header */}
                                        <div className="p-6 border-b border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    {selectedTestCases.includes(testCase.id) ? (
                                                        <CheckSquare
                                                            className="w-5 h-5 text-primary cursor-pointer mt-0.5 flex-shrink-0"
                                                            onClick={() => handleSelectItem(testCase.id, false)}
                                                        />
                                                    ) : (
                                                        <Square
                                                            className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors mt-0.5 flex-shrink-0"
                                                            onClick={() => handleSelectItem(testCase.id, true)}
                                                        />
                                                    )}
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold text-foreground mb-2 truncate" title={testCase.title}>
                                                            {testCase.title || 'Untitled Test Case'}
                                                        </h3>
                                                        
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(testCase.status)}`}>
                                                                {testCase.status || 'Draft'}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(testCase.priority)}`}>
                                                                {testCase.priority || 'Low'} Priority
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadge(testCase.severity)}`}>
                                                                {testCase.severity || 'Low'} Severity
                                                            </span>
                                                            {getAutomationBadge(testCase.is_automated || testCase.automation_status === 'automated')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleChatClick(testCase)}
                                                    className="p-2.5 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 group-hover:bg-primary/10"
                                                    title="View/Edit Test Case"
                                                >
                                                    <MessageSquare className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Execution Status Section */}
                                        <div className="px-6 py-4 bg-muted/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-foreground">Execution Status:</span>
                                                    {getExecutionStatusBadge(testCase.executionStatus)}
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground mr-2">Quick Update:</span>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'passed')}
                                                        className="p-2 rounded-lg bg-card border border-success/20 text-success hover:bg-success/10 transition-all duration-200"
                                                        title="Mark as Passed"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'failed')}
                                                        className="p-2 rounded-lg bg-card border border-destructive/20 text-error hover:bg-destructive/10 transition-all duration-200"
                                                        title="Mark as Failed"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExecutionStatusChange(testCase.id, 'blocked')}
                                                        className="p-2 rounded-lg bg-card border border-warning/20 text-warning hover:bg-warning/10 transition-all duration-200"
                                                        title="Mark as Blocked"
                                                    >
                                                        <Shield className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="p-6 pt-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        <UserIcon className="w-3.5 h-3.5" />
                                                        Assignee
                                                    </div>
                                                    <div className="text-sm text-foreground font-medium truncate" title={testCase.assignee}>
                                                        {testCase.assignee || 'Unassigned'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        Component
                                                    </div>
                                                    <div className="text-sm text-foreground font-medium truncate" title={testCase.component}>
                                                        {testCase.component || 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Test Type</div>
                                                    <div className="text-sm text-foreground font-medium truncate">
                                                        {testCase.testType || 'Functional'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Environment</div>
                                                    <div className="text-sm text-foreground font-medium truncate">
                                                        {testCase.environment || 'Testing'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Est. Time
                                                    </div>
                                                    <div className="text-sm text-foreground font-medium">
                                                        {testCase.estimatedTime ? `${testCase.estimatedTime} min` : 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Last Run
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {isValidDate(lastExecuted) && testCase.lastExecuted
                                                            ? formatDistanceToNow(lastExecuted, { addSuffix: true })
                                                            : 'Never'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Updated</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {isValidDate(updatedAt)
                                                            ? formatDistanceToNow(updatedAt, { addSuffix: true })
                                                            : 'Invalid Date'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Linked Bugs Section */}
                                            <div className="pt-4 border-t border-border">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        Linked Bugs ({linkedBugs.length})
                                                    </label>
                                                    <MultiSelectDropdown
                                                        options={bugOptions}
                                                        value={linkedBugs}
                                                        onChange={(newBugs) => onLinkBug(testCase.id, newBugs)}
                                                        placeholder="Link bugs to this test case..."
                                                        type="bugs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalItems > 0 && (
                        <div className="mt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close sort menu */}
            {showSortMenu && (
                <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowSortMenu(false)}
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

export default TestCaseList;