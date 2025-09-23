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

// AI Components
import {
    AISuggestionPanel,
    AIBugAnalysisModal,
    AIDefectTrendsModal,
    AISeverityAssessmentTooltip,
    AIInsightsCard,
    AIProvider,
    AIErrorBoundary,
    AIActionButton,
    AISeverityBadge,
    useAIModal
} from '../ai';

import { useBugs } from '@/hooks/useBugs';
import { useUI } from '@/hooks/useUI';
import {
    Bug,
    Lightbulb,
    Minimize,
    Maximize,
    Menu,
    X,
    Brain,
    TrendingUp,
    Zap
} from 'lucide-react';

// Helper functions for localStorage (unchanged)
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

    // AI Modal management
    const { openModal, closeModal, getModalState } = useAIModal();

    // Mobile menu state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAISidebar, setShowAISidebar] = useState(false);

    // Existing refs and state (unchanged)
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

    // Existing state
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Initialize states from localStorage
    const [viewMode, setViewMode] = useState(() => getStoredViewMode());
    const [pageMode, setPageMode] = useState(() => getStoredPageMode());
    const [bugViewType, setBugViewType] = useState(() => getStoredBugViewType());

    const [setIsTraceabilityOpen] = useState(false);
    const [setIsImportModalOpen] = useState(false);

    // Filter state
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


    // All existing handlers (unchanged)
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

    // Apply filters effect
    useEffect(() => {
        const newFilteredBugs = applyFiltersStable(bugsRef.current, filters);
        setFilteredBugs(newFilteredBugs);
    }, [bugsHook.bugs, filters, applyFiltersStable]);

    // Error handler
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

    // All existing handlers (unchanged)
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

    // Recommendation handlers (unchanged)
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

    // NEW: AI-specific handlers
    const handleAIBugAnalysis = useCallback((bug) => {
        openModal('bugAnalysis', { bugData: bug });
    }, [openModal]);

    const handleAITrendsAnalysis = useCallback(() => {
        openModal('trendsAnalysis', { defectData: filteredBugs });
    }, [openModal, filteredBugs]);

    const handleAISeverityAssessment = useCallback(async (bug, assessment) => {
        try {
            if (assessment && assessment.assessment) {
                await handleUpdateBug(bug.id, {
                    severity: assessment.assessment.severity,
                    priority: assessment.assessment.priority,
                    ai_assessment: {
                        confidence: assessment.confidence,
                        reasoning: assessment.reasoning,
                        timestamp: new Date().toISOString()
                    }
                });

                uiHook.addNotification?.({
                    type: 'success',
                    title: 'AI Assessment Applied',
                    message: `Bug severity updated to ${assessment.assessment.severity}`,
                });
            }
        } catch (error) {
            handleError(error, 'apply AI assessment');
        }
    }, [handleUpdateBug, uiHook.addNotification, handleError]);

    // Debug logging
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

    // Enhanced Bug Table with AI tooltips
    const EnhancedBugTable = useMemo(() => {
        const TableComponent = bugViewType === 'minimal' ? MinimalBugTable : BugTable;

        return (
            <TableComponent
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
                // AI enhancement props
                renderSeverityCell={(bug) => (
                    <AISeverityAssessmentTooltip
                        bugData={bug}
                        triggerOnHover={true}
                        position="top"
                        onAssessmentComplete={(assessment) => handleAISeverityAssessment(bug, assessment)}
                    >
                        <div className="cursor-help">
                            <AISeverityBadge
                                severity={bug.severity}
                                confidence={bug.ai_assessment?.confidence}
                                showConfidence={!!bug.ai_assessment}
                                size="sm"
                            />
                        </div>
                    </AISeverityAssessmentTooltip>
                )}
                renderActionButtons={(bug) => (
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handleAIBugAnalysis(bug)}
                            className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="AI Analysis"
                        >
                            <Brain className="w-4 h-4" />
                        </button>
                        {/* Other action buttons would go here */}
                    </div>
                )}
            />
        );
    }, [
        bugViewType,
        filteredBugs,
        bugsHook.selectedBugs,
        bugsHook.selectBugs,
        handleEditBug,
        handleDuplicateBug,
        handleBulkAction,
        handleViewBug,
        handleLinkTestCase,
        handleUpdateBug,
        handleAIBugAnalysis,
        handleAISeverityAssessment
    ]);

    // Enhanced Bug List with AI tooltips
    const EnhancedBugList = useMemo(() => (
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
            onUpdateBug={handleUpdateBug}
            // AI enhancements
            renderSeverityBadge={(bug) => (
                <AISeverityAssessmentTooltip
                    bugData={bug}
                    triggerOnHover={true}
                    position="top"
                    onAssessmentComplete={(assessment) => handleAISeverityAssessment(bug, assessment)}
                >
                    <div className="cursor-help">
                        <AISeverityBadge
                            severity={bug.severity}
                            confidence={bug.ai_assessment?.confidence}
                            showConfidence={!!bug.ai_assessment}
                        />
                    </div>
                </AISeverityAssessmentTooltip>
            )}
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
        handleLinkTestCase,
        handleUpdateBug,
        handleAISeverityAssessment
    ]);

    // Enhanced Mobile Action Menu
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
                absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl p-4 space-y-3
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}
            `}>
                <div className="flex items-center justify-between pb-3 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* AI Actions */}
                    <div className="border-b pb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h4>
                        <div className="space-y-2">
                            <AIActionButton
                                onClick={handleAITrendsAnalysis}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                icon={TrendingUp}
                            >
                                Analyze Bug Trends
                            </AIActionButton>
                        </div>
                    </div>

                    {/* Regular Actions */}
                    {bugViewType === 'full' && (
                        <>
                            <button
                                onClick={() => {
                                    setIsTraceabilityOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center px-4 py-3 text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <span className="mr-3">🔗</span>
                                Traceability
                            </button>
                            <button
                                onClick={() => {
                                    setIsImportModalOpen(true);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center px-4 py-3 text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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

    // AI Sidebar Component
    const AISidebar = () => (
        <div className={`
            fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out
            ${showAISidebar ? 'translate-x-0' : 'translate-x-full'}
            lg:relative lg:translate-x-0 lg:w-auto lg:shadow-none lg:bg-transparent
        `}>
            {/* Mobile sidebar header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                <button
                    onClick={() => setShowAISidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* AI Components */}
            <div className="p-4 space-y-4 lg:p-0 lg:space-y-6 overflow-y-auto h-full lg:h-auto">
                <AIInsightsCard
                    title="Bug Insights"
                    showMetrics={true}
                    showSuggestions={true}
                    showTrends={false}
                    maxInsights={5}
                    autoRefresh={true}
                    className="lg:max-w-sm"
                />

                <AISuggestionPanel
                    maxSuggestions={3}
                    showTimestamp={false}
                    filterTypes={['bug-severity', 'test-priority']}
                    className="lg:max-w-sm"
                />

                {/* AI Quick Actions */}
                <div className="bg-white p-4 rounded-lg border lg:max-w-sm">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-purple-600" />
                        AI Analysis
                    </h3>
                    <div className="space-y-2">
                        <AIActionButton
                            onClick={handleAITrendsAnalysis}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            icon={TrendingUp}
                        >
                            Analyze Bug Trends
                        </AIActionButton>

                        <AIActionButton
                            onClick={() => {
                                if (filteredBugs.length === 0) {
                                    uiHook.addNotification?.({
                                        type: 'warning',
                                        title: 'No Bugs',
                                        message: 'No bugs available for bulk analysis',
                                    });
                                    return;
                                }
                                // Analyze bugs without severity
                                const unassessedBugs = filteredBugs.filter(bug => !bug.severity);
                                if (unassessedBugs.length === 0) {
                                    uiHook.addNotification?.({
                                        type: 'info',
                                        title: 'All Assessed',
                                        message: 'All bugs already have severity assessments',
                                    });
                                    return;
                                }
                                openModal('bulkAnalysis', { bugs: unassessedBugs });
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            icon={Zap}
                        >
                            Bulk Severity Analysis
                        </AIActionButton>
                    </div>
                </div>
            </div>
        </div>
    );

    // Show locked state
    if (bugsHook.bugsLocked && pageMode === 'bugs') {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bugs Tracker</h1>
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
            <AIProvider config={{
                insights: { refreshInterval: 10, autoRefresh: true }
            }}>
                <AIErrorBoundary>
                    <div className="min-h-screen bg-gray-50">
                        {/* Page Mode Toggle */}
                        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                            <div className="max-w-full mx-auto px-3 sm:px-6 py-3">
                                <div className="flex items-center justify-between">
                                    {/* Desktop Navigation */}
                                    <div className="hidden sm:flex items-center space-x-1">
                                        <button
                                            onClick={() => handlePageModeChange('bugs')}
                                            className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'bugs'
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Bug className="w-4 h-4 mr-2" />
                                            Bug Reports
                                        </button>
                                        <button
                                            onClick={() => handlePageModeChange('recommendations')}
                                            className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'recommendations'
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Feature Recommendations
                                        </button>
                                    </div>

                                    {/* Mobile Navigation */}
                                    <div className="flex sm:hidden items-center space-x-2">
                                        <select
                                            value={pageMode}
                                            onChange={(e) => handlePageModeChange(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        >
                                            <option value="bugs">Bug Reports</option>
                                            <option value="recommendations">Feature Recommendations</option>
                                        </select>
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
                </AIErrorBoundary>
            </AIProvider>
        );
    }

    // Main Bugs page with AI integration
    return (
        <AIProvider config={{
            insights: {
                refreshInterval: 5,
                autoRefresh: true,
                maxInsights: 8,
                includeMetrics: true
            }
        }}>
            <AIErrorBoundary>
                <div className="min-h-screen bg-gray-50">
                    {/* Page Mode Toggle */}
                    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                        <div className="max-w-full mx-auto px-3 sm:px-6 py-3">
                            <div className="flex items-center justify-between">
                                {/* Desktop Navigation */}
                                <div className="hidden sm:flex items-center space-x-1">
                                    <button
                                        onClick={() => handlePageModeChange('bugs')}
                                        className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'bugs'
                                                ? 'bg-teal-100 text-teal-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Bug className="w-4 h-4 mr-2" />
                                        <span className="hidden md:inline">Bug Reports</span>
                                        <span className="md:hidden">Bugs</span>
                                    </button>
                                    <button
                                        onClick={() => handlePageModeChange('recommendations')}
                                        className={`flex items-center px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${pageMode === 'recommendations'
                                                ? 'bg-teal-100 text-teal-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Lightbulb className="w-4 h-4 mr-2" />
                                        <span className="hidden md:inline">Feature Recommendations</span>
                                        <span className="md:hidden">Features</span>
                                    </button>
                                </div>

                                {/* Mobile Navigation */}
                                <div className="flex sm:hidden items-center space-x-2">
                                    <select
                                        value={pageMode}
                                        onChange={(e) => handlePageModeChange(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="bugs">Bug Reports</option>
                                        <option value="recommendations">Features</option>
                                    </select>
                                </div>

                                {/* Desktop Bug View Type Toggle */}
                                <div className="hidden lg:flex items-center space-x-3">
                                    {/* AI Sidebar Toggle */}
                                    <button
                                        onClick={() => setShowAISidebar(!showAISidebar)}
                                        className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${showAISidebar
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Brain className="w-3 h-3 mr-1" />
                                        AI Assistant
                                    </button>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">View:</span>
                                        <button
                                            onClick={() => handleBugViewTypeChange(bugViewType === 'full' ? 'minimal' : 'full')}
                                            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${bugViewType === 'minimal'
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

                                {/* Mobile View Type Toggle */}
                                <div className="flex lg:hidden items-center space-x-2">
                                    <button
                                        onClick={() => setShowAISidebar(true)}
                                        className="p-2 rounded-lg bg-purple-50 text-purple-700"
                                    >
                                        <Brain className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleBugViewTypeChange(bugViewType === 'full' ? 'minimal' : 'full')}
                                        className={`p-2 rounded-lg transition-all ${bugViewType === 'minimal'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
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

                    {/* Main Content Layout */}
                    <div className="flex">
                        {/* Main Content */}
                        <div className={`flex-1 transition-all duration-300 ${showAISidebar && !window.matchMedia('(max-width: 1024px)').matches ? 'lg:pr-80' : ''}`}>
                            <div className="max-w-full mx-auto py-4 px-3 sm:py-6 sm:px-6 lg:px-4">
                                {/* Header */}
                                <div className="flex flex-col space-y-4 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center flex-wrap">
                                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                                                <span className="hidden sm:inline">Bug Tracker</span>
                                                <span className="sm:hidden">Bugs</span>
                                                {bugViewType === 'minimal' && (
                                                    <span className="hidden sm:inline"> - Minimal View</span>
                                                )}
                                            </h1>
                                            <div className="flex items-center space-x-2 ml-2">
                                                <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                                                    {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
                                                </span>
                                                {bugViewType === 'minimal' && (
                                                    <span className="hidden sm:inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
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

                                            {/* AI Action Button */}
                                            <AIActionButton
                                                onClick={handleAITrendsAnalysis}
                                                variant="secondary"
                                                size="md"
                                                icon={TrendingUp}
                                            >
                                                AI Analysis
                                            </AIActionButton>

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

                                            {bugViewType === 'full' && (
                                                <button
                                                    onClick={() => setIsMobileMenuOpen(true)}
                                                    className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    title="More actions"
                                                >
                                                    <Menu className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Filter Bar */}
                                {bugViewType === 'full' && (
                                    <div className="mb-4">
                                        <BugFilterBar
                                            filters={filters}
                                            onFiltersChange={handleFiltersChange}
                                            bugs={bugsRef.current}
                                            viewMode={viewMode}
                                            setViewMode={handleViewModeChange}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="transition-all duration-300 ease-in-out">
                                    <div className="overflow-hidden">
                                        {viewMode === 'table' ? (
                                            <div className="overflow-x-auto">
                                                {EnhancedBugTable}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {EnhancedBugList}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Sidebar */}
                        <AISidebar />
                    </div>

                    {/* Mobile Action Menu */}
                    <MobileActionMenu />

                    {/* AI Modals */}
                    <AIBugAnalysisModal
                        isOpen={getModalState('bugAnalysis').isOpen}
                        onClose={() => closeModal('bugAnalysis')}
                        bugData={getModalState('bugAnalysis').bugData}
                        analysisType="full"
                    />

                    <AIDefectTrendsModal
                        isOpen={getModalState('trendsAnalysis').isOpen}
                        onClose={() => closeModal('trendsAnalysis')}
                        defectData={getModalState('trendsAnalysis').defectData || filteredBugs}
                        timeframe={30}
                        suiteId={bugsHook.activeSuite?.id}
                    />

                    {/* Enhanced Bug Details Modal */}
                    {isDetailsModalOpen && selectedBug && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-screen items-center justify-center p-4">
                                <BugDetailsModal
                                    bug={selectedBug}
                                    teamMembers={bugsHook.teamMembers || []}
                                    onUpdateBug={handleUpdateBug}
                                    onClose={handleCloseModal}
                                    // AI Enhancement: Add severity assessment tooltip
                                    renderSeverityField={() => (
                                        <AISeverityAssessmentTooltip
                                            bugData={selectedBug}
                                            triggerOnHover={false}
                                            position="right"
                                            onAssessmentComplete={(assessment) => handleAISeverityAssessment(selectedBug, assessment)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <AISeverityBadge
                                                    severity={selectedBug.severity}
                                                    confidence={selectedBug.ai_assessment?.confidence}
                                                    showConfidence={!!selectedBug.ai_assessment}
                                                />
                                                {!selectedBug.severity && (
                                                    <span className="text-xs text-purple-600 cursor-pointer hover:underline">
                                                        Get AI Assessment
                                                    </span>
                                                )}
                                            </div>
                                        </AISeverityAssessmentTooltip>
                                    )}
                                    // AI Enhancement: Add analysis button
                                    renderActionButtons={() => (
                                        <AIActionButton
                                            onClick={() => handleAIBugAnalysis(selectedBug)}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            AI Analysis
                                        </AIActionButton>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </AIErrorBoundary>
        </AIProvider>
    );
};

export default BugTrackerPage;