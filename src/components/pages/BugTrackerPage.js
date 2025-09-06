/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import BugTable from '@/components/bug-report/BugTable';
import MinimalBugTable from '@/components/bug-report/MinimalBugTable';
import BugList from '@/components/bug-report/BugList';
import FeatureRecommendationsPage from '@/components/bug-report/FeatureRecommendationsPage';
import BugReportButton from '@/components/modals/BugReportButton';
import BugFilterBar from '@/components/bug-report/BugFilterBar';
import BugDetailsModal from '@/components/modals/BugDetailsModal';
import { useBugs } from '@/hooks/useBugs';
import { useUI } from '@/hooks/useUI';
import { 
    Bug, 
    Lightbulb, 
    Table, 
    List, 
    Minimize, 
    Maximize,
    ToggleLeft,
    ToggleRight 
} from 'lucide-react';

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

const BugTrackerPage = () => {
    const bugsHook = useBugs();
    const uiHook = useUI();

    // FIXED: Use stable refs like the test cases page
    const bugsRef = useRef(bugsHook.bugs || []);
    const testCasesRef = useRef(bugsHook.testCases || []);
    const relationshipsRef = useRef(bugsHook.relationships || { bugToTestCases: {} });
    const hasInitializedRef = useRef(false);

    // FIXED: Update refs when data changes (exactly like test cases page)
    useEffect(() => {
        bugsRef.current = bugsHook.bugs || [];
    }, [bugsHook.bugs]);

    useEffect(() => {
        testCasesRef.current = bugsHook.testCases || [];
    }, [bugsHook.testCases]);

    useEffect(() => {
        relationshipsRef.current = bugsHook.relationships || { bugToTestCases: {} };
    }, [bugsHook.relationships]);
    
    // FIXED: Use separate state for filtered bugs (like test cases page does)
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    // FIXED: Initialize states from localStorage with fallbacks
    const [viewMode, setViewMode] = useState(() => getStoredViewMode());
    const [pageMode, setPageMode] = useState(() => getStoredPageMode());
    const [bugViewType, setBugViewType] = useState(() => getStoredBugViewType());
    
    const [isTraceabilityOpen, setIsTraceabilityOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // FIXED: Stable filter state
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

    // Mock recommendations data
    const [recommendations, setRecommendations] = useState([
        {
            id: 'rec1',
            title: 'Improve Dashboard Performance',
            description: 'The main dashboard takes too long to load when there are many test cases. We should implement pagination and lazy loading.',
            rationale: 'Better user experience and reduced server load',
            status: 'under-review',
            priority: 'high',
            category: 'performance',
            impact: 'high',
            effort: 'medium',
            created_by: 'user1',
            created_at: new Date('2024-01-15'),
            updated_at: new Date('2024-01-20'),
            upvotes: 8,
            downvotes: 1,
            tags: ['dashboard', 'performance', 'ux'],
        },
        {
            id: 'rec2',
            title: 'Dark Mode Support',
            description: 'Add dark mode theme option for better user experience during night work sessions.',
            rationale: 'Many users work late hours and dark mode reduces eye strain',
            status: 'approved',
            priority: 'medium',
            category: 'ui-ux',
            impact: 'medium',
            effort: 'small',
            created_by: 'user2',
            created_at: new Date('2024-01-10'),
            updated_at: new Date('2024-01-25'),
            upvotes: 15,
            downvotes: 2,
            tags: ['ui', 'accessibility', 'theme'],
        },
    ]);

    // FIXED: Persist view mode changes to localStorage
    const handleViewModeChange = useCallback((newViewMode) => {
        setViewMode(newViewMode);
        setStoredViewMode(newViewMode);
    }, []);

    const handlePageModeChange = useCallback((newPageMode) => {
        setPageMode(newPageMode);
        setStoredPageMode(newPageMode);
    }, []);

    const handleBugViewTypeChange = useCallback((newBugViewType) => {
        setBugViewType(newBugViewType);
        setStoredBugViewType(newBugViewType);
    }, []);

    // FIXED: Stable filter function (exactly like test cases page)
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
    }, []); // Empty deps - pure function

    // FIXED: Apply filters effect using refs (exactly like test cases page)
    useEffect(() => {
        const newFilteredBugs = applyFiltersStable(bugsRef.current, filters);
        setFilteredBugs(newFilteredBugs);
    }, [bugsHook.bugs, filters, applyFiltersStable]);

    // FIXED: Stable error handler
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

    // FIXED: Simplified save handler (matching test cases pattern exactly)
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

    // FIXED: All handlers with stable dependencies (matching test cases pattern)
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

    const handleDuplicateBug = useCallback(async (bug) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();
            await bugsHook.createBug({
                ...bug,
                title: `${bug.title} (Copy)`,
                created_at: timestamp,
                updated_at: timestamp,
            });

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Bug duplicated successfully',
            });
        } catch (error) {
            handleError(error, 'duplicate bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.createBug, uiHook.addNotification, handleError]);

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

    // FIXED: Simplified bulk action handler (matching test cases pattern)
    const handleBulkAction = useCallback(async (action, selectedIds) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            switch (action) {
                case 'delete':
                    await Promise.all(selectedIds.map((id) => bugsHook.deleteBug(id)));
                    break;
                default:
                    // Process sequentially like test cases page
                    for (const id of selectedIds) {
                        await bugsHook.updateBug(id, {
                            status: action,
                            updated_at: timestamp,
                        });
                    }
                    break;
            }

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} updated`,
            });
        } catch (error) {
            handleError(error, 'bulk action');
        }
    }, [
        bugsHook.bugsLocked,
        bugsHook.deleteBug,
        bugsHook.updateBug,
        uiHook.addNotification,
        handleError
    ]);

    const handleCloseModal = useCallback(() => {
        console.log('Closing bug modal');
        setIsModalOpen(false);
        setIsDetailsModalOpen(false);
        setSelectedBug(null);
    }, []);

    // FIXED: Simple update handler without complex return logic
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

            // Update selectedBug if it's the one being updated
            if (selectedBug && selectedBug.id === bugId) {
                setSelectedBug(prev => ({ ...prev, ...updates, updated_at: timestamp }));
            }
            
            // Only show notification for significant updates
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

    // Recommendation handlers
    const handleCreateRecommendation = useCallback(async (recData) => {
        try {
            const newRec = {
                ...recData,
                id: `rec-${Date.now()}`,
                created_at: new Date(),
                updated_at: new Date(),
                upvotes: 0,
                downvotes: 0,
            };
            setRecommendations(prev => [...prev, newRec]);
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Feature recommendation created successfully',
            });
        } catch (error) {
            handleError(error, 'create recommendation');
        }
    }, [uiHook.addNotification, handleError]);

    const handleUpdateRecommendation = useCallback(async (recData) => {
        try {
            setRecommendations(prev => 
                prev.map(rec => rec.id === recData.id ? { ...rec, ...recData, updated_at: new Date() } : rec)
            );
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Feature recommendation updated successfully',
            });
        } catch (error) {
            handleError(error, 'update recommendation');
        }
    }, [uiHook.addNotification, handleError]);

    const handleVote = useCallback(async (recId, voteType, userId) => {
        try {
            setRecommendations(prev => 
                prev.map(rec => {
                    if (rec.id === recId) {
                        const currentVote = rec.userVotes?.[userId];
                        const updatedRec = { ...rec };
                        
                        if (!updatedRec.userVotes) {
                            updatedRec.userVotes = {};
                        }
                        
                        if (currentVote === 'up') {
                            updatedRec.upvotes = (updatedRec.upvotes || 1) - 1;
                        } else if (currentVote === 'down') {
                            updatedRec.downvotes = (updatedRec.downvotes || 1) - 1;
                        }
                        
                        if (currentVote === voteType) {
                            delete updatedRec.userVotes[userId];
                        } else {
                            updatedRec.userVotes[userId] = voteType;
                            if (voteType === 'up') {
                                updatedRec.upvotes = (updatedRec.upvotes || 0) + 1;
                            } else {
                                updatedRec.downvotes = (updatedRec.downvotes || 0) + 1;
                            }
                        }
                        
                        return updatedRec;
                    }
                    return rec;
                })
            );
        } catch (error) {
            handleError(error, 'vote on recommendation');
        }
    }, [handleError]);

    // FIXED: Only run debug logging once (like test cases page)
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
                pageMode
            });
            hasInitializedRef.current = true;
        }
    }, [bugsHook.updateBug, bugsHook.createBug, bugsHook.deleteBug, bugsHook.bugs?.length, bugsHook.loading, bugsHook.bugsLocked, bugsHook.activeSuite, viewMode, bugViewType, pageMode]);

    // FIXED: Memoize components with stable dependencies (like test cases page)
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
                onDuplicate={handleDuplicateBug}
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
        handleDuplicateBug,
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
            onDuplicate={handleDuplicateBug}
            onBulkAction={handleBulkAction}
            onView={handleViewBug}
            onLinkTestCase={handleLinkTestCase}
        />
    ), [
        filteredBugs,
        bugsHook.selectedBugs,
        bugsHook.selectBugs,
        handleEditBug,
        handleDeleteBug,
        handleDuplicateBug,
        handleBulkAction,
        handleViewBug,
        handleLinkTestCase
    ]);

    // Show loading state
    if (bugsHook.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        {pageMode === 'bugs' ? 'Loading bugs...' : 'Loading recommendations...'}
                    </p>
                </div>
            </div>
        );
    }

    // Show locked state
    if (bugsHook.bugsLocked && pageMode === 'bugs') {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Bugs Tracker</h1>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <p className="text-gray-600">Bugs are locked. Upgrade to access.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show Recommendations page
    if (pageMode === 'recommendations') {
        return (
            <div className="min-h-screen">
                {/* Page Mode Toggle */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-full mx-auto px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handlePageModeChange('bugs')}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        pageMode === 'bugs'
                                            ? 'bg-teal-100 text-teal-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Bug className="w-4 h-4 mr-2" />
                                    Bug Reports
                                </button>
                                <button
                                    onClick={() => handlePageModeChange('recommendations')}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        pageMode === 'recommendations'
                                            ? 'bg-teal-100 text-teal-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Lightbulb className="w-4 h-4 mr-2" />
                                    Feature Recommendations
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <FeatureRecommendationsPage
                    recommendations={recommendations}
                    loading={false}
                    onCreateRecommendation={handleCreateRecommendation}
                    onUpdateRecommendation={handleUpdateRecommendation}
                    onVote={handleVote}
                    currentUser={bugsHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                    teamMembers={bugsHook.teamMembers || []}
                />
            </div>
        );
    }

    // Main Bugs page
    return (
        <div className="min-h-screen">
            {/* Page Mode Toggle */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-full mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handlePageModeChange('bugs')}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    pageMode === 'bugs'
                                        ? 'bg-teal-100 text-teal-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <Bug className="w-4 h-4 mr-2" />
                                Bug Reports
                            </button>
                            <button
                                onClick={() => handlePageModeChange('recommendations')}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    pageMode === 'recommendations'
                                        ? 'bg-teal-100 text-teal-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Feature Recommendations
                            </button>
                        </div>
                        
                        {/* Bug View Type Toggle */}
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">View:</span>
                                <button
                                    onClick={() => handleBugViewTypeChange(bugViewType === 'full' ? 'minimal' : 'full')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                        bugViewType === 'minimal'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
                    </div>
                </div>
            </div>

            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Bug Tracker {bugViewType === 'minimal' ? '- Minimal View' : ''}
                        </h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
                        </span>
                        {bugViewType === 'minimal' && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Developer Focus Mode
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        {bugViewType === 'full' && (
                            <>
                                <button
                                    onClick={() => setIsTraceabilityOpen(true)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                                >
                                    Traceability
                                </button>
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
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
                </div>

                {/* Show filter bar only for full view */}
                {bugViewType === 'full' && (
                    <BugFilterBar
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        bugs={bugsRef.current}
                        viewMode={viewMode}
                        setViewMode={handleViewModeChange}
                    />
                )}

                <div className="transition-opacity duration-300">
                    {viewMode === 'table' ? tableComponent : listComponent}
                </div>

                {isDetailsModalOpen && selectedBug && (
                    <BugDetailsModal
                        bug={selectedBug}
                        teamMembers={bugsHook.teamMembers || []}
                        onUpdateBug={handleUpdateBug}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    );
};

export default BugTrackerPage;