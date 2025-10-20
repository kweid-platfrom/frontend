'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useApp } from '../../context/AppProvider';
import {
    Lightbulb,
    Plus,
    Search,
    SlidersHorizontal,
    LayoutGrid,
    List,
    X
} from 'lucide-react';

import RecommendationCards from '../recommend/RecommendationCards';
import RecommendationTable from '../recommend/RecommendationTable';
import RecommendationModal from '../recommend/RecommendationModal';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';
import Pagination from '../common/Pagination';
import GroupedView from '../GroupedView';
import GroupSelect from '../common/GroupSelect';
import { getGroupingOptions } from '@/utils/groupingUtils';

// Safe date formatting helper
const safeFormatDate = (dateValue, formatType = 'relative') => {
    if (!dateValue) return 'No date';

    let date;

    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
        date = dateValue;
    } else {
        return 'Invalid date';
    }

    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    try {
        if (formatType === 'relative') {
            return formatDistanceToNow(date, { addSuffix: true });
        } else if (formatType === 'short') {
            return format(date, 'MMM d, yyyy');
        } else {
            return format(date, 'MMM d, yyyy');
        }
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Date error';
    }
};

const FeatureRecommendationsPage = () => {
    // Get state from useApp hook
    const { currentUser, activeSuite, state, actions, isLoading } = useApp();

    // Local state for selection, pagination, and grouping
    const [selectedRecommendations, setSelectedRecommendations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [loadingActions, setLoadingActions] = useState([]);
    const [groupBy, setGroupBy] = useState(null);

    // Safely destructure recommendations state with fallbacks
    const recommendationsState = state?.recommendations || {};
    const {
        recommendations = [],
        filters = {
            search: '',
            status: 'all',
            priority: 'all',
            category: 'all',
            impact: 'all',
            effort: 'all'
        },
        sortConfig = {
            key: 'created_at',
            direction: 'desc'
        },
        viewMode = 'cards',
        isModalOpen = false,
        selectedRecommendation = null,
        loading: recommendationsLoading = false
    } = recommendationsState;

    // Safely get recommendation actions with fallbacks
    const recommendationActions = actions?.recommendations || {};
    const {
        updateRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        deleteRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        archiveRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        voteOnRecommendation = async () => ({ success: false, error: { message: 'Recommendations not available' } }),
        setFilters = () => { },
        setSortConfig = () => { },
        setViewMode = () => { },
        openModal = () => { },
        closeModal = () => { },
    } = recommendationActions;

    // Check if recommendations feature is available
    const recommendationsAvailable = state?.recommendations !== undefined &&
        actions?.recommendations !== undefined;

    // Get grouping options with metadata
    const groupingOptions = useMemo(() => {
        const globalSprints = state?.sprints?.sprints || [];
        return getGroupingOptions('recommendations', {
            sprints: globalSprints,
            modules: [],
            users: []
        });
    }, [state?.sprints?.sprints]);

    // Metadata for grouped view
    const groupMetadata = useMemo(() => {
        const globalSprints = state?.sprints?.sprints || [];
        return {
            sprints: globalSprints,
            modules: [],
            users: []
        };
    }, [state?.sprints?.sprints]);

    // Filter and sort recommendations
    const filteredRecommendations = useMemo(() => {
        if (!recommendationsAvailable || !Array.isArray(recommendations)) {
            return [];
        }

        let filtered = [...recommendations];

        // Apply filters
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter((rec) => {
                const searchableFields = [
                    rec.title?.toLowerCase() || '',
                    rec.description?.toLowerCase() || '',
                    rec.rationale?.toLowerCase() || '',
                    ...(rec.tags || []).map((tag) => tag.toLowerCase()),
                ];
                return searchableFields.some((field) => field.includes(searchTerm));
            });
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter((rec) => rec.status === filters.status);
        }

        if (filters.priority !== 'all') {
            filtered = filtered.filter((rec) => rec.priority === filters.priority);
        }

        if (filters.category !== 'all') {
            filtered = filtered.filter((rec) => rec.category === filters.category);
        }

        if (filters.impact !== 'all') {
            filtered = filtered.filter((rec) => rec.impact === filters.impact);
        }

        if (filters.effort !== 'all') {
            filtered = filtered.filter((rec) => rec.effort === filters.effort);
        }

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (['created_at', 'updated_at'].includes(sortConfig.key)) {
                    let aDate, bDate;

                    if (aValue && typeof aValue === 'object' && aValue.toDate) {
                        aDate = aValue.toDate();
                    } else if (aValue && typeof aValue === 'object' && aValue.seconds) {
                        aDate = new Date(aValue.seconds * 1000);
                    } else {
                        aDate = new Date(aValue);
                    }

                    if (bValue && typeof bValue === 'object' && bValue.toDate) {
                        bDate = bValue.toDate();
                    } else if (bValue && typeof bValue === 'object' && bValue.seconds) {
                        bDate = new Date(bValue.seconds * 1000);
                    } else {
                        bDate = new Date(bValue);
                    }

                    if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
                    if (isNaN(aDate.getTime())) return 1;
                    if (isNaN(bDate.getTime())) return -1;
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }

                if (sortConfig.key === 'votes') {
                    const aVotes = (a.upvotes || 0) - (a.downvotes || 0);
                    const bVotes = (b.upvotes || 0) - (b.downvotes || 0);
                    return sortConfig.direction === 'asc' ? aVotes - bVotes : bVotes - aVotes;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [recommendations, filters, sortConfig, recommendationsAvailable]);

    // Count active filters
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.status !== 'all') count++;
        if (filters.priority !== 'all') count++;
        if (filters.category !== 'all') count++;
        if (filters.impact !== 'all') count++;
        if (filters.effort !== 'all') count++;
        return count;
    }, [filters]);

    // Paginated recommendations
    const paginatedRecommendations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredRecommendations.slice(startIndex, endIndex);
    }, [filteredRecommendations, currentPage, itemsPerPage]);

    // Selection handlers
    const handleSelectRecommendation = useCallback((recId, selected) => {
        setSelectedRecommendations(prev => {
            if (selected) {
                return [...prev, recId];
            } else {
                return prev.filter(id => id !== recId);
            }
        });
    }, []);

    const handleSelectAll = useCallback((selected) => {
        if (selected) {
            const currentPageIds = paginatedRecommendations.map(rec => rec.id);
            setSelectedRecommendations(prev => {
                const newSelection = new Set([...prev, ...currentPageIds]);
                return Array.from(newSelection);
            });
        } else {
            const currentPageIds = new Set(paginatedRecommendations.map(rec => rec.id));
            setSelectedRecommendations(prev => prev.filter(id => !currentPageIds.has(id)));
        }
    }, [paginatedRecommendations]);

    const handleClearSelection = useCallback(() => {
        setSelectedRecommendations([]);
    }, []);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setFilters({
            search: filters.search,
            status: 'all',
            priority: 'all',
            category: 'all',
            impact: 'all',
            effort: 'all'
        });
    }, [setFilters, filters.search]);

    // Bulk action handler
    const handleBulkAction = async (actionId, selectedIds, actionConfig, selectedOption) => {
        const assetType = 'recommendations';

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
                case 'delete':
                    console.log('🗑️ Deleting recommendations...');
                    let deleteCount = 0;
                    for (const id of selectedIds) {
                        const result = await deleteRecommendation(id);
                        if (result.success) deleteCount++;
                    }
                    
                    if (deleteCount > 0) {
                        actions?.ui?.showNotification?.({
                            id: 'bulk-delete-success',
                            type: 'success',
                            message: `${deleteCount} recommendation(s) deleted`,
                            duration: 3000
                        });
                    }
                    break;

                case 'archive':
                    console.log('📦 Archiving recommendations...');
                    let archiveCount = 0;
                    for (const id of selectedIds) {
                        const result = await archiveRecommendation(id);
                        if (result.success) archiveCount++;
                    }
                    
                    if (archiveCount > 0) {
                        actions?.ui?.showNotification?.({
                            id: 'bulk-archive-success',
                            type: 'success',
                            message: `${archiveCount} recommendation(s) archived`,
                            duration: 3000
                        });
                    }
                    break;

                case 'add-to-sprint':
                    if (!selectedOption || !selectedOption.id) {
                        console.error('❌ No sprint selected');
                        actions?.ui?.showNotification?.({
                            id: 'no-sprint-selected',
                            type: 'error',
                            message: 'Please select a sprint',
                            duration: 3000
                        });
                        return;
                    }

                    console.log('📌 Adding recommendations to sprint:', {
                        sprintId: selectedOption.id,
                        sprintName: selectedOption.label,
                        itemCount: selectedIds.length
                    });

                    const recResult = await actions?.linking?.addRecommendationsToSprint?.(
                        selectedOption.id,
                        selectedIds
                    );

                    console.log('Recommendation result:', recResult);

                    if (recResult?.success) {
                        const addResults = recResult.data;
                        if (addResults.added > 0) {
                            actions?.ui?.showNotification?.({
                                id: 'bulk-add-to-sprint-success',
                                type: 'success',
                                message: `${addResults.added} recommendation(s) added to ${selectedOption.label}`,
                                duration: 3000
                            });
                        }

                        if (addResults.failed > 0) {
                            actions?.ui?.showNotification?.({
                                id: 'bulk-add-to-sprint-partial',
                                type: 'warning',
                                message: `${addResults.failed} recommendation(s) failed to add`,
                                duration: 5000
                            });
                        }
                    } else {
                        throw new Error(recResult?.error?.message || 'Failed to add recommendations to sprint');
                    }
                    break;

                default:
                    console.warn('Unhandled action:', actionId);
            }

            setSelectedRecommendations([]);
        } catch (error) {
            console.error('💥 Bulk action failed:', error);
            actions?.ui?.showNotification?.({
                id: 'bulk-action-error',
                type: 'error',
                message: `Failed to ${actionId}: ${error.message}`,
                duration: 5000
            });
        } finally {
            setLoadingActions(prev => prev.filter(id => id !== actionId));
        }
    };

    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        setSelectedRecommendations([]);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
        setSelectedRecommendations([]);
    }, []);

    // Standard handlers
    const handleCreateRecommendation = useCallback(() => {
        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }
        openModal(null);
    }, [openModal, recommendationsAvailable, actions?.ui]);

    const handleEditRecommendation = useCallback((rec) => {
        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }
        openModal(rec);
    }, [openModal, recommendationsAvailable, actions?.ui]);

    const handleVote = useCallback(async (recId, voteType) => {
        if (!currentUser?.uid) {
            actions?.ui?.showNotification?.({
                id: 'vote-no-auth',
                type: 'error',
                message: 'You must be logged in to vote',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const result = await voteOnRecommendation(recId, voteType);
            if (result && result.success === false) {
                actions?.ui?.showNotification?.({
                    id: 'vote-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to vote on recommendation',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error voting:', error);
            actions?.ui?.showNotification?.({
                id: 'vote-error',
                type: 'error',
                message: 'Failed to vote on recommendation',
                duration: 3000
            });
        }
    }, [voteOnRecommendation, currentUser, actions?.ui, recommendationsAvailable]);

    const handleStatusUpdate = useCallback(async (recId, newStatus) => {
        if (!currentUser?.uid) {
            actions?.ui?.showNotification?.({
                id: 'status-no-auth',
                type: 'error',
                message: 'You must be logged in to update status',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const recommendation = recommendations.find(r => r.id === recId);
            if (!recommendation) {
                throw new Error('Recommendation not found');
            }

            const updateData = {
                id: recId,
                status: newStatus,
                updated_at: new Date().toISOString(),
                title: recommendation.title,
                description: recommendation.description,
                priority: recommendation.priority,
                category: recommendation.category,
                impact: recommendation.impact,
                effort: recommendation.effort
            };

            const result = await updateRecommendation(updateData);

            if (result && result.success === false) {
                actions?.ui?.showNotification?.({
                    id: 'status-update-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to update recommendation status',
                    duration: 3000
                });
                return result;
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error('Error updating status:', error);
            actions?.ui?.showNotification?.({
                id: 'status-update-error',
                type: 'error',
                message: 'Failed to update recommendation status',
                duration: 3000
            });
            return { success: false, error };
        }
    }, [updateRecommendation, recommendations, currentUser, actions?.ui, recommendationsAvailable]);

    const handleDeleteRecommendation = useCallback(async (recId) => {
        if (!currentUser?.uid) {
            actions?.ui?.showNotification?.({
                id: 'delete-no-auth',
                type: 'error',
                message: 'You must be logged in to delete Suggestions',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Suggestions feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const result = await deleteRecommendation(recId);

            if (result && result.success === false) {
                actions?.ui?.showNotification?.({
                    id: 'delete-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to delete Suggestion',
                    duration: 3000
                });
            } else {
                actions?.ui?.showNotification?.({
                    id: 'delete-success',
                    type: 'success',
                    message: 'Suggestion deleted successfully',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error deleting Suggestion:', error);
            actions?.ui?.showNotification?.({
                id: 'delete-error',
                type: 'error',
                message: 'Failed to delete suggestion',
                duration: 3000
            });
        }
    }, [deleteRecommendation, currentUser, actions?.ui, recommendationsAvailable]);

    const handleArchiveRecommendation = useCallback(async (recId) => {
        if (!currentUser?.uid) {
            actions?.ui?.showNotification?.({
                id: 'archive-no-auth',
                type: 'error',
                message: 'You must be logged in to archive suggestions',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions?.ui?.showNotification?.({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Suggestions feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const result = await archiveRecommendation(recId);

            if (result && result.success === false) {
                actions?.ui?.showNotification?.({
                    id: 'archive-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to archive suggestion',
                    duration: 3000
                });
            } else {
                actions?.ui?.showNotification?.({
                    id: 'archive-success',
                    type: 'success',
                    message: 'Suggestion archived successfully',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error archiving suggestion:', error);
            actions?.ui?.showNotification?.({
                id: 'archive-error',
                type: 'error',
                message: 'Failed to archive suggestion',
                duration: 3000
            });
        }
    }, [archiveRecommendation, currentUser, actions?.ui, recommendationsAvailable]);

    // Render function for recommendation items in grouped view
    const renderRecommendationItem = useCallback((rec, index, isSelected) => {
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
                className={`grid grid-cols-12 gap-4 items-center w-full py-2 px-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                    isSelected ? 'bg-primary/10' : ''
                }`}
                onClick={(e) => {
                    if (!e.target.closest('input[type="checkbox"]')) {
                        handleEditRecommendation(rec);
                    }
                }}
            >
                <div className="col-span-12 sm:col-span-5 lg:col-span-4 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                        {rec.title}
                    </h4>
                    {rec.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {rec.description}
                        </p>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-2 lg:col-span-2">
                    {rec.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${rec.status === 'under-review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            rec.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            rec.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            rec.status === 'in-development' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            rec.status === 'completed' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                            {rec.status}
                        </span>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-2 lg:col-span-2">
                    {rec.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${rec.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            rec.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                            {rec.priority}
                        </span>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-2 lg:col-span-2">
                    {rec.impact && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${rec.impact === 'high' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            rec.impact === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
                            {rec.impact}
                        </span>
                    )}
                </div>

                <div className="col-span-4 sm:col-span-1 lg:col-span-2 text-right">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(rec.created_at)}
                    </span>
                </div>
            </div>
        );
    }, [handleEditRecommendation]);

    // Show loading state
    if (isLoading || recommendationsLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading feature suggestions...</p>
                </div>
            </div>
        );
    }

    // Show feature unavailable message
    if (!recommendationsAvailable) {
        return (
            <div className="min-h-screen bg-background">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                            <Lightbulb className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-card-foreground mb-2">
                            Recommendations Feature Unavailable
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            The suggestions feature is currently not available. This might be due to missing configuration or permissions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20">
                                <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                        Feature Suggestions
                                    </h1>
                                    <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium text-muted-foreground">
                                        {filteredRecommendations.length}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Manage and track feature requests
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreateRecommendation}
                            className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Suggestion
                        </button>
                    </div>
                </div>

                {/* Search and Controls Bar */}
                <div className="mb-6">
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                        <div className="flex flex-col lg:flex-row gap-3">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search suggestions..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ search: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground placeholder:text-muted-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between lg:justify-start gap-2">
                                {/* Filter Toggle Button */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                                        showFilters || activeFiltersCount > 0
                                            ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800'
                                            : 'bg-background text-foreground border-border hover:bg-accent'
                                    }`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-teal-600 rounded-full dark:bg-teal-500">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>

                                {/* Group By Dropdown */}
                                <GroupSelect
                                    value={groupBy}
                                    onChange={setGroupBy}
                                    options={groupingOptions}
                                    placeholder="Group by..."
                                    className="min-w-[140px]"
                                />

                                {/* View Mode Toggle */}
                                <div className="inline-flex rounded-lg border border-border bg-background shadow-sm ml-auto lg:ml-0">
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-l-lg transition-all ${
                                            viewMode === 'cards'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                        title="Cards view"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`inline-flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-r-lg border-l border-border transition-all ${
                                            viewMode === 'table'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        }`}
                                        title="Table view"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-foreground">Advanced Filters</h3>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent hover:bg-accent/80 rounded-md transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => setFilters({ status: e.target.value })}
                                            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="under-review">Under Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="in-development">In Development</option>
                                            <option value="completed">Completed</option>
                                            <option value="on-hold">On Hold</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Priority</label>
                                        <select
                                            value={filters.priority}
                                            onChange={(e) => setFilters({ priority: e.target.value })}
                                            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
                                        >
                                            <option value="all">All Priority</option>
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Category</label>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => setFilters({ category: e.target.value })}
                                            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
                                        >
                                            <option value="all">All Categories</option>
                                            <option value="ui-ux">UI/UX</option>
                                            <option value="performance">Performance</option>
                                            <option value="security">Security</option>
                                            <option value="integration">Integration</option>
                                            <option value="analytics">Analytics</option>
                                            <option value="accessibility">Accessibility</option>
                                            <option value="automation">Automation</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Impact</label>
                                        <select
                                            value={filters.impact}
                                            onChange={(e) => setFilters({ impact: e.target.value })}
                                            className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm transition-all"
                                        >
                                            <option value="all">All Impact</option>
                                            <option value="high">High Impact</option>
                                            <option value="medium">Medium Impact</option>
                                            <option value="low">Low Impact</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    {groupBy ? (
                        <div className="p-6">
                            <GroupedView
                                items={filteredRecommendations}
                                groupBy={groupBy}
                                renderItem={renderRecommendationItem}
                                emptyMessage="No suggestions to display"
                                groupMetadata={groupMetadata}
                                defaultExpanded={true}
                                selectedItems={selectedRecommendations}
                                onSelectionChange={(selectedIds) => {
                                    setSelectedRecommendations(selectedIds);
                                }}
                            />
                        </div>
                    ) : viewMode === 'cards' ? (
                        <div className="p-6">
                            <RecommendationCards
                                recommendations={paginatedRecommendations}
                                selectedRecommendations={selectedRecommendations}
                                onSelectRecommendation={handleSelectRecommendation}
                                onSelectAll={handleSelectAll}
                                onEdit={handleEditRecommendation}
                                onVote={handleVote}
                                onStatusUpdate={handleStatusUpdate}
                                onDelete={handleDeleteRecommendation}
                                onArchive={handleArchiveRecommendation}
                                currentUser={currentUser}
                                safeFormatDate={safeFormatDate}
                            />
                        </div>
                    ) : (
                        <RecommendationTable
                            recommendations={paginatedRecommendations}
                            selectedRecommendations={selectedRecommendations}
                            onSelectRecommendation={handleSelectRecommendation}
                            onSelectAll={handleSelectAll}
                            onEdit={handleEditRecommendation}
                            onVote={handleVote}
                            onStatusUpdate={handleStatusUpdate}
                            onDelete={handleDeleteRecommendation}
                            onArchive={handleArchiveRecommendation}
                            currentUser={currentUser}
                            onSort={(key) => setSortConfig({
                                key,
                                direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
                            })}
                            sortConfig={sortConfig}
                            safeFormatDate={safeFormatDate}
                        />
                    )}

                    {/* Pagination - Only show when not grouping */}
                    {!groupBy && filteredRecommendations.length > 0 && (
                        <div className="border-t border-border">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={filteredRecommendations.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredRecommendations.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                <Search className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No suggestions found
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                                {filters.search || activeFiltersCount > 0
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "Get started by creating your first feature suggestion."}
                            </p>
                            {(filters.search || activeFiltersCount > 0) && (
                                <button
                                    onClick={() => {
                                        setFilters({
                                            search: '',
                                            status: 'all',
                                            priority: 'all',
                                            category: 'all',
                                            impact: 'all',
                                            effort: 'all'
                                        });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <EnhancedBulkActionsBar
                selectedItems={selectedRecommendations}
                onClearSelection={handleClearSelection}
                pageTitle="recommendation"
                pageIcon="Lightbulb"
                assetType="recommendations"
                onAction={handleBulkAction}
                loadingActions={loadingActions}
            />

            {/* Modal for creating/editing recommendations */}
            {isModalOpen && (
                <RecommendationModal
                    recommendation={selectedRecommendation}
                    onSave={async (data) => {
                        if (selectedRecommendation) {
                            return await actions?.recommendations?.updateRecommendation(data);
                        } else {
                            return await actions?.recommendations?.createRecommendation(data);
                        }
                    }}
                    onClose={closeModal}
                    currentUser={currentUser}
                    actions={actions}
                />
            )}
        </div>
    );
};

export default FeatureRecommendationsPage;