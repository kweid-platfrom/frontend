/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import BugTable from '@/components/bug-report/BugTable';
import MinimalBugTable from '@/components/bug-report/MinimalBugTable';
import BugList from '@/components/bug-report/BugList';
import FeatureRecommendationsPage from '@/components/bug-report/FeatureRecommendationsPage';
import BugReportButton from '@/components/modals/BugReportButton';
import BugFilterBar from '@/components/bug-report/BugFilterBar';
import BugDetailsModal from '@/components/modals/BugDetailsModal';
import BugImportModal from '@/components/modals/BugImportModal';
import GroupedView from '@/components/GroupedView';
import { getGroupingOptions } from '@/utils/groupingUtils';
import { useBugs } from '@/hooks/useBugs';
import { useUI } from '@/hooks/useUI';
import { useApp } from '@/context/AppProvider';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import {
    Lightbulb,
    Minimize,
    Maximize,
    Menu,
    X
} from 'lucide-react';
import { BugAntIcon } from '@heroicons/react/24/outline';

// Helper functions for localStorage
const getStoredViewMode = () => {
    try {
        return localStorage.getItem('bugTracker_viewMode') || 'table';
    } catch {
        return 'table';
    }
};

const setStoredViewMode = (mode) => {
    try {
        localStorage.setItem('bugTracker_viewMode', mode);
    } catch {
        // Silently fail if localStorage is not available
    }
};

const getStoredBugViewType = () => {
    try {
        return localStorage.getItem('bugTracker_bugViewType') || 'full';
    } catch {
        return 'full';
    }
};

const setStoredBugViewType = (type) => {
    try {
        localStorage.setItem('bugTracker_bugViewType', type);
    } catch {
        // Silently fail if localStorage is not available
    }
};

const getStoredPageMode = () => {
    try {
        return localStorage.getItem('bugTracker_pageMode') || 'bugs';
    } catch {
        return 'bugs';
    }
};

const setStoredPageMode = (mode) => {
    try {
        localStorage.setItem('bugTracker_pageMode', mode);
    } catch {
        // Silently fail if localStorage is not available
    }
};

const getStoredGroupBy = () => {
    try {
        return localStorage.getItem('bugTracker_groupBy') || null;
    } catch {
        return null;
    }
};

const setStoredGroupBy = (groupBy) => {
    try {
        if (groupBy) {
            localStorage.setItem('bugTracker_groupBy', groupBy);
        } else {
            localStorage.removeItem('bugTracker_groupBy');
        }
    } catch {
        // Silently fail if localStorage is not available
    }
};

const BugTrackerPage = () => {
    const router = useRouter();
    const bugsHook = useBugs();
    const uiHook = useUI();
    const { currentUser, activeSuite, actions, state } = useApp();

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loadingActions, setLoadingActions] = useState([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_selectedItems, setSelectedItems] = useState([]);

    // Stable refs
    const bugsRef = useRef(bugsHook.bugs || []);
    const testCasesRef = useRef(bugsHook.testCases || []);
    const relationshipsRef = useRef(bugsHook.relationships || { bugToTestCases: {} });
    const hasInitializedRef = useRef(false);

    // Update refs when data changes
    useEffect(() => {
        bugsRef.current = bugsHook.bugs || [];
    }, [bugsHook.bugs]);

    useEffect(() => {
        testCasesRef.current = bugsHook.testCases || [];
    }, [bugsHook.testCases]);

    useEffect(() => {
        relationshipsRef.current = bugsHook.relationships || { bugToTestCases: {} };
    }, [bugsHook.relationships]);

    // Handle shared bug URLs
    useEffect(() => {
        if (typeof window !== 'undefined' && bugsHook.bugs && bugsHook.bugs.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const bugId = urlParams.get('id');

            if (bugId) {
                // Find the bug with this ID
                const sharedBug = bugsHook.bugs.find(bug => bug.id === bugId);

                if (sharedBug) {
                    // Open the bug details modal
                    handleViewBug(sharedBug);

                    // Clean up the URL (optional - removes the ?id= param)
                    window.history.replaceState({}, '', '/bugs');
                } else {
                    // Bug not found - show notification
                    uiHook.addNotification?.({
                        type: 'warning',
                        title: 'Bug Not Found',
                        message: 'The shared bug could not be found or you may not have access to it.',
                        duration: 5000,
                    });

                    // Clean up the URL
                    window.history.replaceState({}, '', '/bugs');
                }
            }
        }
    }, [bugsHook.bugs]);

    // State for filtered bugs
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Initialize states from localStorage
    const [viewMode, setViewMode] = useState(() => getStoredViewMode());
    const [pageMode, setPageMode] = useState(() => getStoredPageMode());
    const [bugViewType, setBugViewType] = useState(() => getStoredBugViewType());
    const [groupBy, setGroupBy] = useState(() => getStoredGroupBy());

    // Modal states - only Import now
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Stable filter state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        severity: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        reporter: 'all',
        lastUpdated: 'all',
    });

    // Get grouping options with metadata
    const groupingOptions = useMemo(() => {
        // Get sprints from global state like BugDetailsModal does
        const globalSprints = state?.sprints?.sprints || [];

        console.log('🔍 Computing grouping options:', {
            globalSprintsCount: globalSprints.length,
            globalSprints: globalSprints.map(s => ({ id: s.id, name: s.name })),
            bugsHookSprintsCount: (bugsHook.sprints || []).length,
            modulesCount: (bugsHook.modules || []).length,
            hasSprintOption: globalSprints.length > 0
        });

        return getGroupingOptions('bugs', {
            sprints: globalSprints.length > 0 ? globalSprints : (bugsHook.sprints || []),
            modules: bugsHook.modules || [],
            users: bugsHook.teamMembers || []
        });
    }, [state?.sprints?.sprints, bugsHook.sprints, bugsHook.modules, bugsHook.teamMembers]);

    // Metadata for grouped view
    const groupMetadata = useMemo(() => {
        // Use global state for sprints to ensure consistency
        const globalSprints = state?.sprints?.sprints || [];

        return {
            sprints: globalSprints.length > 0 ? globalSprints : (bugsHook.sprints || []),
            modules: bugsHook.modules || [],
            users: bugsHook.teamMembers || []
        };
    }, [state?.sprints?.sprints, bugsHook.sprints, bugsHook.modules, bugsHook.teamMembers]);

    // Persist view mode changes to localStorage
    const handleViewModeChange = useCallback((newViewMode) => {
        setViewMode(newViewMode);
        setStoredViewMode(newViewMode);
    }, []);

    const handlePageModeChange = useCallback((newPageMode) => {
        setPageMode(newPageMode);
        setStoredPageMode(newPageMode);
        setIsMobileMenuOpen(false);
    }, []);

    const handleBugViewTypeChange = useCallback((newBugViewType) => {
        setBugViewType(newBugViewType);
        setStoredBugViewType(newBugViewType);
    }, []);

    const handleGroupByChange = useCallback((newGroupBy) => {
        setGroupBy(newGroupBy);
        setStoredGroupBy(newGroupBy);
    }, []);

    // Stable filter function
    const applyFiltersStable = useCallback((currentBugs, currentFilters) => {
        if (!Array.isArray(currentBugs)) return [];

        let filtered = [...currentBugs];

        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filtered = filtered.filter((bug) => {
                const searchableFields = [
                    bug.title?.toLowerCase() || '',
                    bug.description?.toLowerCase() || '',
                    bug.steps_to_reproduce?.toLowerCase() || '',
                    ...(bug.tags || []).map((tag) => tag.toLowerCase()),
                ];
                return searchableFields.some((field) => field.includes(searchTerm));
            });
        }

        if (currentFilters.status !== 'all') {
            filtered = filtered.filter((bug) => bug.status === currentFilters.status);
        }

        if (currentFilters.severity !== 'all') {
            filtered = filtered.filter((bug) => bug.severity === currentFilters.severity);
        }

        if (currentFilters.priority !== 'all') {
            filtered = filtered.filter((bug) => bug.priority === currentFilters.priority);
        }

        if (currentFilters.assignee !== 'all') {
            filtered = filtered.filter((bug) =>
                bug.assignee === currentFilters.assignee ||
                (!bug.assignee && currentFilters.assignee === '')
            );
        }

        if (currentFilters.reporter !== 'all') {
            filtered = filtered.filter((bug) =>
                bug.reporter === currentFilters.reporter ||
                (!bug.reporter && currentFilters.reporter === '')
            );
        }

        if (currentFilters.tags?.length > 0) {
            filtered = filtered.filter((bug) =>
                bug.tags && currentFilters.tags.every((tag) => bug.tags.includes(tag))
            );
        }

        if (currentFilters.lastUpdated !== 'all') {
            const now = new Date();
            filtered = filtered.filter((bug) => {
                const updatedAt = bug.updated_at instanceof Date ? bug.updated_at : new Date(bug.updated_at);
                if (isNaN(updatedAt.getTime())) return false;

                switch (currentFilters.lastUpdated) {
                    case 'today':
                        return updatedAt.toDateString() === now.toDateString();
                    case 'week':
                        return updatedAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month':
                        return updatedAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    case 'quarter':
                        return updatedAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, []);

    // Apply filters effect using refs
    useEffect(() => {
        const newFilteredBugs = applyFiltersStable(bugsRef.current, filters);
        setFilteredBugs(newFilteredBugs);
    }, [bugsHook.bugs, filters, applyFiltersStable]);

    // Stable error handler
    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);

        if (uiHook.addNotification) {
            uiHook.addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to ${context}: ${error.message}`,
                persistent: true,
            });
        }
    }, [uiHook.addNotification]);

    // Simplified save handler
    const handleSaveBug = useCallback(async (bugData) => {
        try {
            console.log('Saving bug:', { title: bugData.title, isEdit: !!selectedBug });

            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            if (selectedBug) {
                await bugsHook.updateBug(selectedBug.id, {
                    ...bugData,
                    updated_at: timestamp,
                });
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug updated successfully',
                });
            } else {
                const result = await bugsHook.createBug({
                    ...bugData,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
                console.log('Bug created:', result);
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug created successfully',
                });
            }

            setIsModalOpen(false);
            setSelectedBug(null);
        } catch (error) {
            console.error('Error saving bug:', error);
            handleError(error, 'save bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.updateBug, bugsHook.createBug, selectedBug, uiHook.addNotification, handleError]);

    // All handlers with stable dependencies
    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);

    const handleViewBug = useCallback((bug) => {
        if (bugsHook.bugsLocked) {
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: 'Bugs are locked. Upgrade to access.',
            });
            return;
        }
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, [bugsHook.bugsLocked, uiHook.addNotification]);

    const handleEditBug = useCallback((bug) => {
        if (bugsHook.bugsLocked) {
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: 'Bugs are locked. Upgrade to access.',
            });
            return;
        }
        setSelectedBug(bug);
        setIsModalOpen(true);
    }, [bugsHook.bugsLocked, uiHook.addNotification]);

    const handleDeleteBug = useCallback(async (id) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            await bugsHook.deleteBug(id);
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Bug deleted successfully',
            });
        } catch (error) {
            handleError(error, 'delete bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.deleteBug, uiHook.addNotification, handleError]);

    const handleLinkTestCase = useCallback(async (bugId, newTestCaseIds) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const existingTestCases = relationshipsRef.current.bugToTestCases[bugId] || [];
            const toAdd = newTestCaseIds.filter((id) => !existingTestCases.includes(id));
            const toRemove = existingTestCases.filter((id) => !newTestCaseIds.includes(id));

            await Promise.all([
                ...toAdd.map((testCaseId) => bugsHook.linkTestCaseToBug?.(bugId, testCaseId)),
                ...toRemove.map((testCaseId) => bugsHook.unlinkTestCaseFromBug?.(bugId, testCaseId)),
            ]);

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `Linked ${newTestCaseIds.length} test case${newTestCaseIds.length > 1 ? 's' : ''} to bug`,
            });
        } catch (error) {
            handleError(error, 'link test cases');
        }
    }, [
        bugsHook.bugsLocked,
        bugsHook.linkTestCaseToBug,
        bugsHook.unlinkTestCaseFromBug,
        uiHook.addNotification,
        handleError
    ]);

    const handleBulkAction = useCallback(async (actionId, selectedIds, actionConfig, selectedOption) => {
        const assetType = 'bugs';

        console.log('🎯 Bulk action triggered:', {
            actionId,
            assetType,
            selectedIds,
            selectedOption,
            suiteId: activeSuite?.id
        });

        setLoadingActions(prev => [...prev, actionId]);

        try {
            switch (actionId) {
                case 'add-to-sprint':
                    if (!selectedOption || !selectedOption.id) {
                        console.error('❌ No sprint selected');
                        actions.ui?.showNotification?.({
                            id: 'no-sprint-selected',
                            type: 'error',
                            message: 'Please select a sprint',
                            duration: 3000
                        });
                        return;
                    }

                    const bugResult = await actions.linking.addBugsToSprint(
                        selectedOption.id,
                        selectedIds
                    );

                    if (bugResult.success) {
                        actions.ui?.showNotification?.({
                            id: 'bulk-add-to-sprint-success',
                            type: 'success',
                            message: `${bugResult.data.added} item(s) added to ${selectedOption.label}`,
                            duration: 3000
                        });
                    }
                    break;

                default:
                    console.warn('Unhandled action:', actionId);
            }

            setSelectedItems([]);
        } catch (error) {
            console.error('💥 Bulk action failed:', error);
            actions.ui?.showNotification?.({
                id: 'bulk-action-error',
                type: 'error',
                message: `Failed to ${actionId}: ${error.message}`,
                duration: 5000
            });
        } finally {
            setLoadingActions(prev => prev.filter(id => id !== actionId));
        }
    }, [activeSuite, actions.linking, actions.ui]);

    const handleCloseModal = useCallback(() => {
        console.log('Closing bug modal');
        setIsModalOpen(false);
        setIsDetailsModalOpen(false);
        setSelectedBug(null);
    }, []);

    const handleUpdateBug = useCallback(async (bugId, updates) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();
            await bugsHook.updateBug(bugId, {
                ...updates,
                updated_at: timestamp,
            });

            if (selectedBug && selectedBug.id === bugId) {
                setSelectedBug(prev => ({ ...prev, ...updates, updated_at: timestamp }));
            }

            if (Object.keys(updates).length > 1 || (!updates.status && !updates.priority && !updates.severity)) {
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug updated successfully',
                });
            }

        } catch (error) {
            handleError(error, 'update bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.updateBug, selectedBug, uiHook.addNotification, handleError]);

    const handleOpenTraceability = useCallback(() => {
        router.push('/bugs/bug-trace');
    }, [router]);

    // Render function for bug items in grouped view
    const renderBugItem = useCallback((bug, index, isSelected) => {
        const formatDate = (date) => {
            if (!date) return 'N/A';
            const d = date.toDate ? date.toDate() : new Date(date);
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        };

        return (
            <div
                className={`grid grid-cols-12 gap-4 items-center w-full py-2 px-2 cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? 'bg-primary/10' : ''
                    }`}
                onClick={(e) => {
                    if (!e.target.closest('input[type="checkbox"]')) {
                        handleViewBug(bug);
                    }
                }}
            >
                <div className="col-span-12 sm:col-span-5 lg:col-span-4 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                        {bug.title}
                    </h4>
                    {bug.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {bug.description}
                        </p>
                    )}
                </div>

                <div className="col-span-3 sm:col-span-2 lg:col-span-2 hidden sm:block">
                    <span className="text-xs text-muted-foreground font-mono truncate block">
                        {bug.id?.slice(0, 8) || 'N/A'}
                    </span>
                </div>

                <div className="col-span-4 sm:col-span-2 lg:col-span-2">
                    {bug.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${bug.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                bug.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                    bug.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                            {bug.status}
                        </span>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-2 lg:col-span-2">
                    {bug.severity && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${bug.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                bug.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                    bug.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {bug.severity}
                        </span>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-1 lg:col-span-2 text-right">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(bug.created_at)}
                    </span>
                </div>
            </div>
        );
    }, [handleViewBug]);


    useEffect(() => {
        if (!hasInitializedRef.current) {
            console.log('Bugs Hook Debug:', {
                hasUpdateBug: !!bugsHook.updateBug,
                hasCreateBug: !!bugsHook.createBug,
                hasDeleteBug: !!bugsHook.deleteBug,
                bugsCount: bugsHook.bugs?.length || 0,
                loading: bugsHook.loading,
                bugsLocked: bugsHook.bugsLocked,
                activeSuiteId: bugsHook.activeSuite?.id,
                viewMode,
                bugViewType,
                pageMode,
                groupBy
            });
            hasInitializedRef.current = true;
        }
    }, [bugsHook.updateBug, bugsHook.createBug, bugsHook.deleteBug, bugsHook.bugs?.length, bugsHook.loading, bugsHook.bugsLocked, bugsHook.activeSuite, viewMode, bugViewType, pageMode, groupBy]);

    // Memoize components
    const tableComponent = useMemo(() => (
        bugViewType === 'minimal' ? (
            <MinimalBugTable
                bugs={filteredBugs}
                loading={bugsHook.loading}
                onBulkAction={handleBulkAction}
                onView={handleViewBug}
                selectedBugs={bugsHook.selectedBugs}
                onSelectBugs={bugsHook.selectBugs}
                onUpdateBug={handleUpdateBug}
            />
        ) : (
            <BugTable
                bugs={filteredBugs}
                testCases={testCasesRef.current}
                relationships={relationshipsRef.current}
                selectedBugs={bugsHook.selectedBugs}
                onSelectBugs={bugsHook.selectBugs}
                onEdit={handleEditBug}
                onBulkAction={handleBulkAction}
                onView={handleViewBug}
                onLinkTestCase={handleLinkTestCase}
                onUpdateBug={handleUpdateBug}
            />
        )
    ), [
        bugViewType,
        filteredBugs,
        bugsHook.loading,
        bugsHook.selectedBugs,
        bugsHook.selectBugs,
        handleBulkAction,
        handleViewBug,
        handleEditBug,
        handleLinkTestCase,
        handleUpdateBug
    ]);

    const listComponent = useMemo(() => (
        <BugList
            bugs={filteredBugs}
            testCases={testCasesRef.current}
            relationships={relationshipsRef.current}
            selectedBugs={bugsHook.selectedBugs}
            onSelectBugs={bugsHook.selectBugs}
            onEdit={handleEditBug}
            onDelete={handleDeleteBug}
            onBulkAction={handleBulkAction}
            onView={handleViewBug}
            onLinkTestCase={handleLinkTestCase}
            onUpdateBug={handleUpdateBug}
        />
    ), [
        filteredBugs,
        bugsHook.selectedBugs,
        bugsHook.selectBugs,
        handleEditBug,
        handleDeleteBug,
        handleBulkAction,
        handleViewBug,
        handleLinkTestCase,
        handleUpdateBug
    ]);

    // Replace your groupedComponent:
    const groupedComponent = useMemo(() => (
        <GroupedView
            items={filteredBugs}
            groupBy={groupBy}
            renderItem={renderBugItem}
            emptyMessage="No bugs to display"
            groupMetadata={groupMetadata}
            defaultExpanded={true}
            selectedItems={bugsHook.selectedBugs || []}
            onSelectionChange={(selectedIds) => {
                bugsHook.selectBugs?.(selectedIds);
            }}
        />
    ), [filteredBugs, groupBy, renderBugItem, groupMetadata, bugsHook.selectedBugs, bugsHook.selectBugs]);

    const MobileActionMenu = () => (
        <div className={`
            fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className={`
                absolute bottom-0 left-0 right-0 bg-card rounded-t-lg shadow-theme-xl p-4 space-y-3
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}
            `}>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Actions</h3>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-accent rounded-full"
                    >
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>

                <div className="space-y-3">
                    {bugViewType === 'full' && (
                        <>
                            <button
                                onClick={() => {
                                    handleOpenTraceability();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center px-4 py-3 text-left text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
                            >
                                <span className="mr-3">🔗</span>
                                Traceability
                            </button>
                            <button
                                onClick={() => {
                                    setIsImportModalOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center px-4 py-3 text-left text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
                            >
                                <span className="mr-3">📥</span>
                                Import
                            </button>
                        </>
                    )}

                    <div className="pt-2">
                        <BugReportButton
                            bug={null}
                            onSave={handleSaveBug}
                            onClose={() => {
                                handleCloseModal();
                                setIsMobileMenuOpen(false);
                            }}
                            activeSuite={bugsHook.activeSuite || { id: 'default', name: 'Default Suite' }}
                            currentUser={bugsHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    if (bugsHook.bugsLocked && pageMode === 'bugs') {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bugs Tracker</h1>
                    </div>
                    <div className="bg-card shadow-theme rounded-lg p-6 border border-border">
                        <p className="text-muted-foreground">Bugs are locked. Upgrade to access.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (pageMode === 'recommendations') {
        return (
            <div className="min-h-screen bg-background">
                <div className="bg-card border-b border-border sticky top-0 z-40">
                    <div className="max-w-full mx-auto px-3 sm:px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="hidden sm:flex items-center space-x-1">
                                <button
                                    onClick={() => handlePageModeChange('bugs')}
                                    className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'bugs'
                                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                        : 'text-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                >
                                    <BugAntIcon className="w-4 h-4 mr-2" />
                                    Bug Reports
                                </button>
                                <button
                                    onClick={() => handlePageModeChange('recommendations')}
                                    className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'recommendations'
                                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                        : 'text-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                >
                                    <Lightbulb className="w-4 h-4 mr-2" />
                                    Suggestions
                                </button>
                            </div>

                            <div className="flex sm:hidden items-center space-x-2">
                                <select
                                    value={pageMode}
                                    onChange={(e) => handlePageModeChange(e.target.value)}
                                    className="px-3 py-2 border border-border rounded-lg text-sm font-medium bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="bugs">Bug Reports</option>
                                    <option value="recommendations">Suggestions</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <FeatureRecommendationsPage />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Responsive Page Mode Toggle */}
            <div className="bg-card border-b border-border sticky top-0 z-40">
                <div className="max-w-full mx-auto px-3 sm:px-6 py-3">
                    <div className="flex items-center justify-between">
                        {/* Desktop Navigation */}
                        <div className="hidden sm:flex items-center space-x-1">
                            <button
                                onClick={() => handlePageModeChange('bugs')}
                                className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'bugs'
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                    : 'text-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                <BugAntIcon className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Bug Reports</span>
                                <span className="md:hidden">Bugs</span>
                            </button>
                            <button
                                onClick={() => handlePageModeChange('recommendations')}
                                className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'recommendations'
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                    : 'text-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                            >
                                <Lightbulb className="w-4 h-4 mr-2" />
                                <span className="hidden md:inline">Suggestions</span>
                                <span className="md:hidden">Suggestions</span>
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="flex sm:hidden items-center space-x-2">
                            <select
                                value={pageMode}
                                onChange={(e) => handlePageModeChange(e.target.value)}
                                className="px-3 py-2 border border-border rounded-lg text-sm font-medium bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="bugs">Bug Reports</option>
                                <option value="recommendations">Features</option>
                            </select>
                        </div>

                        {/* Desktop Bug View Type Toggle */}
                        <div className="hidden lg:flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">View:</span>
                                <button
                                    onClick={() => handleBugViewTypeChange(bugViewType === 'full' ? 'minimal' : 'full')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${bugViewType === 'minimal'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                        : 'bg-muted text-foreground border-border hover:bg-accent'
                                        }`}
                                >
                                    {bugViewType === 'minimal' ? (
                                        <>
                                            <Minimize className="w-3 h-3 mr-1" />
                                            Minimal
                                        </>
                                    ) : (
                                        <>
                                            <Maximize className="w-3 h-3 mr-1" />
                                            Full Details
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mobile View Type Toggle */}
                        <div className="flex lg:hidden items-center">
                            <button
                                onClick={() => handleBugViewTypeChange(bugViewType === 'full' ? 'minimal' : 'full')}
                                className={`p-2 rounded-lg transition-all ${bugViewType === 'minimal'
                                    ? 'bg-blue-50 text-primary dark:bg-blue-900/30'
                                    : 'bg-muted text-foreground hover:bg-accent'
                                    }`}
                                title={`Switch to ${bugViewType === 'full' ? 'minimal' : 'full'} view`}
                            >
                                {bugViewType === 'minimal' ? (
                                    <Minimize className="w-4 h-4" />
                                ) : (
                                    <Maximize className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-full mx-auto py-4 px-3 sm:py-6 sm:px-6 lg:px-4">
                {/* Responsive Header */}
                <div className="flex flex-col space-y-4 mb-6">
                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center flex-wrap">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                                <span className="hidden sm:inline">Bug Tracker</span>
                                <span className="sm:hidden">Bugs</span>
                                {bugViewType === 'minimal' && (
                                    <span className="hidden sm:inline"> - Minimal View</span>
                                )}
                            </h1>
                            <div className="flex items-center space-x-2 ml-2">
                                <span className="px-2 py-1 bg-muted rounded-full text-xs font-normal text-foreground">
                                    {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
                                </span>
                                {bugViewType === 'minimal' && (
                                    <span className="hidden sm:inline-flex px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-medium">
                                        Developer Focus Mode
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden lg:flex items-center space-x-2">
                            {bugViewType === 'full' && (
                                <>
                                    <button
                                        onClick={handleOpenTraceability}
                                        className="inline-flex items-center px-3 py-2 border border-border shadow-theme-sm text-sm leading-4 font-medium rounded text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
                                    >
                                        Traceability
                                    </button>
                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="inline-flex items-center px-3 py-2 border border-border shadow-theme-sm text-sm leading-4 font-medium rounded text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
                                    >
                                        Import
                                    </button>
                                </>
                            )}
                            <BugReportButton
                                bug={null}
                                onSave={handleSaveBug}
                                onClose={handleCloseModal}
                                activeSuite={bugsHook.activeSuite || { id: 'default', name: 'Default Suite' }}
                                currentUser={bugsHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                            />
                        </div>

                        {/* Mobile/Tablet Actions */}
                        <div className="flex lg:hidden items-center space-x-2">
                            {/* Quick Bug Report Button for mobile */}
                            <div className="sm:block">
                                <BugReportButton
                                    bug={null}
                                    onSave={handleSaveBug}
                                    onClose={handleCloseModal}
                                    activeSuite={bugsHook.activeSuite || { id: 'default', name: 'Default Suite' }}
                                    currentUser={bugsHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                                    compact={true}
                                />
                            </div>

                            {/* Mobile Menu Button */}
                            {bugViewType === 'full' && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="p-2 border border-border rounded-lg bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                                    title="More actions"
                                >
                                    <Menu className="w-4 h-4 text-foreground" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Responsive Filter Bar with Grouping */}
                {bugViewType === 'full' && (
                    <div className="mb-4">
                        <BugFilterBar
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            bugs={bugsRef.current}
                            viewMode={viewMode}
                            setViewMode={handleViewModeChange}
                            groupBy={groupBy}
                            onGroupByChange={handleGroupByChange}
                            groupingOptions={groupingOptions}
                        />
                    </div>
                )}

                <EnhancedBulkActionsBar
                    selectedItems={bugsHook.selectedBugs || []}
                    onClearSelection={() => bugsHook.selectBugs([])}
                    assetType="bugs"
                    onAction={handleBulkAction}
                    loadingActions={loadingActions}
                />

                {/* Content with smooth transitions */}
                <div className="transition-all duration-300 ease-in-out">
                    <div className="overflow-hidden">
                        {groupBy ? (
                            <div className="isolate">
                                {groupedComponent}
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className="overflow-x-auto">
                                {tableComponent}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {listComponent}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Action Menu */}
                <MobileActionMenu />

                {/* Modals - using React Portal for proper rendering */}
                {isDetailsModalOpen && selectedBug && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <BugDetailsModal
                                bug={selectedBug}
                                teamMembers={bugsHook.teamMembers || []}
                                onUpdateBug={handleUpdateBug}
                                onClose={handleCloseModal}
                                sprints={bugsHook.sprints || []}
                                modules={bugsHook.modules || []}
                            />
                        </div>
                    </div>,
                    document.body
                )}

                {isImportModalOpen && typeof document !== 'undefined' && createPortal(
                    <BugImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        activeSuite={activeSuite}
                        currentUser={currentUser}
                        bugsHook={bugsHook}
                    />,
                    document.body
                )}
            </div>
        </div>
    );
};

export default BugTrackerPage;