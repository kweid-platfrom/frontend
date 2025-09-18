'use client';

import React, { useCallback, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useApp } from '../../context/AppProvider';
import {
    Lightbulb,
    Plus,
    Search,
} from 'lucide-react';

import RecommendationCards from '../recommend/RecommendationCards';
import RecommendationTable from '../recommend/RecommendationTable';
import RecommendationModal from '../recommend/RecommendationModal';

// Safe date formatting helper
const safeFormatDate = (dateValue, formatType = 'relative') => {
    if (!dateValue) return 'No date';

    let date;

    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        // Handle Firestore timestamp format {seconds, nanoseconds}
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
    // Get app state and actions
    const { state, actions, currentUser, isLoading } = useApp();

    // Safely destructure recommendations state with fallbacks
    const recommendationsState = state.recommendations || {};
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
    const recommendationActions = actions.recommendations || {};
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
    const recommendationsAvailable = state.recommendations !== undefined &&
        actions.recommendations !== undefined;

    // Filter and sort recommendations using the store selector
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

                    // Handle various date formats
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

    const handleCreateRecommendation = useCallback(() => {
        if (!recommendationsAvailable) {
            actions.ui.showNotification({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }
        openModal(null);
    }, [openModal, recommendationsAvailable, actions.ui]);

    const handleEditRecommendation = useCallback((rec) => {
        if (!recommendationsAvailable) {
            actions.ui.showNotification({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }
        openModal(rec);
    }, [openModal, recommendationsAvailable, actions.ui]);

    // Fixed voting function - only pass the vote type (string)
    const handleVote = useCallback(async (recId, voteType) => {
        if (!currentUser?.uid) {
            actions.ui.showNotification({
                id: 'vote-no-auth',
                type: 'error',
                message: 'You must be logged in to vote',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions.ui.showNotification({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            console.log('Voting on recommendation:', recId, voteType);
            // Pass only primitive values - the vote type should be just 'up' or 'down'
            const result = await voteOnRecommendation(recId, voteType);

            if (result && result.success === false) {
                actions.ui.showNotification({
                    id: 'vote-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to vote on recommendation',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error voting:', error);
            actions.ui.showNotification({
                id: 'vote-error',
                type: 'error',
                message: 'Failed to vote on recommendation',
                duration: 3000
            });
        }
    }, [voteOnRecommendation, currentUser, actions.ui, recommendationsAvailable]);

    // Fixed status update function - pass only the new status string
    const handleStatusUpdate = useCallback(async (recId, newStatus) => {
        if (!currentUser?.uid) {
            actions.ui.showNotification({
                id: 'status-no-auth',
                type: 'error',
                message: 'You must be logged in to update status',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions.ui.showNotification({
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

            // Create update object with only the fields that need to be updated
            const updateData = {
                id: recId,
                status: newStatus,
                updated_at: new Date().toISOString(),
                // Include other required fields to avoid partial updates
                title: recommendation.title,
                description: recommendation.description,
                priority: recommendation.priority,
                category: recommendation.category,
                impact: recommendation.impact,
                effort: recommendation.effort
            };

            const result = await updateRecommendation(updateData);

            if (result && result.success === false) {
                actions.ui.showNotification({
                    id: 'status-update-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to update recommendation status',
                    duration: 3000
                });
            } else {
                actions.ui.showNotification({
                    id: 'status-update-success',
                    type: 'success',
                    message: 'Recommendation status updated successfully',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            actions.ui.showNotification({
                id: 'status-update-error',
                type: 'error',
                message: 'Failed to update recommendation status',
                duration: 3000
            });
        }
    }, [updateRecommendation, recommendations, currentUser, actions.ui, recommendationsAvailable]);

    // Delete recommendation function
    const handleDeleteRecommendation = useCallback(async (recId) => {
        if (!currentUser?.uid) {
            actions.ui.showNotification({
                id: 'delete-no-auth',
                type: 'error',
                message: 'You must be logged in to delete recommendations',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions.ui.showNotification({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const result = await deleteRecommendation(recId);

            if (result && result.success === false) {
                actions.ui.showNotification({
                    id: 'delete-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to delete recommendation',
                    duration: 3000
                });
            } else {
                actions.ui.showNotification({
                    id: 'delete-success',
                    type: 'success',
                    message: 'Recommendation deleted successfully',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error deleting recommendation:', error);
            actions.ui.showNotification({
                id: 'delete-error',
                type: 'error',
                message: 'Failed to delete recommendation',
                duration: 3000
            });
        }
    }, [deleteRecommendation, currentUser, actions.ui, recommendationsAvailable]);

    // Archive recommendation function
    const handleArchiveRecommendation = useCallback(async (recId) => {
        if (!currentUser?.uid) {
            actions.ui.showNotification({
                id: 'archive-no-auth',
                type: 'error',
                message: 'You must be logged in to archive recommendations',
                duration: 3000
            });
            return;
        }

        if (!recommendationsAvailable) {
            actions.ui.showNotification({
                id: 'recommendations-unavailable',
                type: 'error',
                message: 'Recommendations feature is not available',
                duration: 3000
            });
            return;
        }

        try {
            const result = await archiveRecommendation(recId);

            if (result && result.success === false) {
                actions.ui.showNotification({
                    id: 'archive-error',
                    type: 'error',
                    message: result.error?.message || 'Failed to archive recommendation',
                    duration: 3000
                });
            } else {
                actions.ui.showNotification({
                    id: 'archive-success',
                    type: 'success',
                    message: 'Recommendation archived successfully',
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error archiving recommendation:', error);
            actions.ui.showNotification({
                id: 'archive-error',
                type: 'error',
                message: 'Failed to archive recommendation',
                duration: 3000
            });
        }
    }, [archiveRecommendation, currentUser, actions.ui, recommendationsAvailable]);

    // Show loading state
    if (isLoading || recommendationsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading feature recommendations...</p>
                </div>
            </div>
        );
    }

    // Show feature unavailable message
    if (!recommendationsAvailable) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Recommendations Feature Unavailable
                        </h3>
                        <p className="text-gray-600 mb-6">
                            The recommendations feature is currently not available. This might be due to missing configuration or permissions.
                        </p>
                        <p className="text-sm text-gray-500">
                            Please check your setup or contact support if you believe this is an error.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg">
                                <Lightbulb className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Feature Recommendations
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage feature requests and improvement suggestions
                                </p>
                            </div>
                        </div>
                        <span className="ml-4 px-3 py-1 bg-gray-200 rounded-full text-sm font-normal">
                            {filteredRecommendations.length} recommendations
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCreateRecommendation}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Recommendation
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search recommendations..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ search: e.target.value })}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ status: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="under-review">Under Review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="in-development">In Development</option>
                                    <option value="completed">Completed</option>
                                    <option value="on-hold">On Hold</option>
                                </select>

                                <select
                                    value={filters.priority}
                                    onChange={(e) => setFilters({ priority: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>

                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ category: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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

                                <select
                                    value={filters.impact}
                                    onChange={(e) => setFilters({ impact: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                >
                                    <option value="all">All Impact</option>
                                    <option value="high">High Impact</option>
                                    <option value="medium">Medium Impact</option>
                                    <option value="low">Low Impact</option>
                                </select>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex border border-gray-300 rounded-md">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`px-3 py-2 text-sm font-medium rounded-l-md ${viewMode === 'cards'
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${viewMode === 'table'
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'cards' ? (
                    <RecommendationCards
                        recommendations={filteredRecommendations}
                        onEdit={handleEditRecommendation}
                        onVote={handleVote}
                        onStatusUpdate={handleStatusUpdate}
                        onDelete={handleDeleteRecommendation}
                        onArchive={handleArchiveRecommendation}
                        currentUser={currentUser}
                        safeFormatDate={safeFormatDate}
                    />
                ) : (
                    <RecommendationTable
                        recommendations={filteredRecommendations}
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
            </div>

            {/* Modal for creating/editing recommendations */}
            {isModalOpen && (
                <RecommendationModal
                    recommendation={selectedRecommendation}
                    onSave={async (data) => {
                        // Use the correct action from the AppProvider
                        if (selectedRecommendation) {
                            return await actions.recommendations.updateRecommendation(data);
                        } else {
                            return await actions.recommendations.createRecommendation(data);
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