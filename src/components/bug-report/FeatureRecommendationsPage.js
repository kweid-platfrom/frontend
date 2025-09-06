'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
    Lightbulb,
    Plus,
    Search,
    Filter,
    Star,
    TrendingUp,
    Users,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    ArrowUpCircle,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Eye,
    MoreHorizontal,
    ChevronDown,
    ChevronUp,
    Tag,
} from 'lucide-react';

const FeatureRecommendationsPage = ({ 
    recommendations = [], 
    loading = false,
    onCreateRecommendation,
    onUpdateRecommendation,
    onDeleteRecommendation,
    onVote,
    currentUser,
    teamMembers = [],
}) => {
    const [filteredRecommendations, setFilteredRecommendations] = useState([]);
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('cards');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        priority: 'all',
        category: 'all',
        impact: 'all',
        effort: 'all',
    });

    // Apply filters and search
    const applyFilters = useCallback((recs, currentFilters) => {
        if (!Array.isArray(recs)) return [];

        let filtered = [...recs];

        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
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

        if (currentFilters.status !== 'all') {
            filtered = filtered.filter((rec) => rec.status === currentFilters.status);
        }

        if (currentFilters.priority !== 'all') {
            filtered = filtered.filter((rec) => rec.priority === currentFilters.priority);
        }

        if (currentFilters.category !== 'all') {
            filtered = filtered.filter((rec) => rec.category === currentFilters.category);
        }

        if (currentFilters.impact !== 'all') {
            filtered = filtered.filter((rec) => rec.impact === currentFilters.impact);
        }

        if (currentFilters.effort !== 'all') {
            filtered = filtered.filter((rec) => rec.effort === currentFilters.effort);
        }

        return filtered;
    }, []);

    useEffect(() => {
        const newFilteredRecs = applyFilters(recommendations, filters);
        setFilteredRecommendations(newFilteredRecs);
    }, [recommendations, filters, applyFilters]);

    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            'under-review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'approved': 'bg-green-100 text-green-800 border-green-200',
            'rejected': 'bg-red-100 text-red-800 border-red-200',
            'in-development': 'bg-blue-100 text-blue-800 border-blue-200',
            'completed': 'bg-purple-100 text-purple-800 border-purple-200',
            'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return statusConfig[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getPriorityBadge = useCallback((priority) => {
        const priorityConfig = {
            'critical': 'bg-red-100 text-red-800 border-red-200',
            'high': 'bg-orange-100 text-orange-800 border-orange-200',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'low': 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return priorityConfig[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    }, []);

    const getImpactIndicator = useCallback((impact) => {
        const impactColors = {
            'high': 'text-green-500',
            'medium': 'text-yellow-500',
            'low': 'text-gray-400',
        };
        return impactColors[impact?.toLowerCase()] || 'text-gray-400';
    }, []);

    const getEffortIndicator = useCallback((effort) => {
        const effortConfig = {
            'small': { dots: 1, color: 'text-green-500' },
            'medium': { dots: 2, color: 'text-yellow-500' },
            'large': { dots: 3, color: 'text-red-500' },
        };
        const config = effortConfig[effort?.toLowerCase()] || { dots: 1, color: 'text-gray-400' };
        
        return (
            <div className={`flex gap-1 ${config.color}`}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                            i < config.dots ? 'bg-current' : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>
        );
    }, []);

    const handleCreateRecommendation = useCallback(() => {
        setSelectedRecommendation(null);
        setIsModalOpen(true);
    }, []);

    const handleEditRecommendation = useCallback((rec) => {
        setSelectedRecommendation(rec);
        setIsModalOpen(true);
    }, []);

    const handleVote = useCallback(async (recId, voteType) => {
        if (onVote) {
            await onVote(recId, voteType, currentUser?.uid);
        }
    }, [onVote, currentUser]);

    const sortedRecommendations = useMemo(() => {
        return [...filteredRecommendations].sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (['created_at', 'updated_at'].includes(sortConfig.key)) {
                    const aDate = aValue instanceof Date ? aValue : new Date(aValue);
                    const bDate = bValue instanceof Date ? bValue : new Date(bValue);
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
            }
            return 0;
        });
    }, [filteredRecommendations, sortConfig]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading feature recommendations...</p>
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
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
                                    className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                                        viewMode === 'cards'
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Cards
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                                        viewMode === 'table'
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
                        recommendations={sortedRecommendations}
                        onEdit={handleEditRecommendation}
                        onVote={handleVote}
                        getStatusBadge={getStatusBadge}
                        getPriorityBadge={getPriorityBadge}
                        getImpactIndicator={getImpactIndicator}
                        getEffortIndicator={getEffortIndicator}
                        currentUser={currentUser}
                    />
                ) : (
                    <RecommendationTable 
                        recommendations={sortedRecommendations}
                        onEdit={handleEditRecommendation}
                        onVote={handleVote}
                        getStatusBadge={getStatusBadge}
                        getPriorityBadge={getPriorityBadge}
                        getImpactIndicator={getImpactIndicator}
                        getEffortIndicator={getEffortIndicator}
                        currentUser={currentUser}
                        sortConfig={sortConfig}
                        setSortConfig={setSortConfig}
                    />
                )}
            </div>

            {/* Modal for creating/editing recommendations */}
            {isModalOpen && (
                <RecommendationModal
                    recommendation={selectedRecommendation}
                    onSave={selectedRecommendation ? onUpdateRecommendation : onCreateRecommendation}
                    onClose={() => setIsModalOpen(false)}
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                />
            )}
        </div>
    );
};

// Recommendation Cards Component
const RecommendationCards = ({ 
    recommendations, 
    onEdit, 
    onVote, 
    getStatusBadge, 
    getPriorityBadge, 
    getImpactIndicator, 
    getEffortIndicator,
    currentUser 
}) => {
    if (recommendations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
                <p className="text-gray-600 mb-6">Create your first feature recommendation to get started.</p>
                <button
                    onClick={() => onEdit(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Recommendation
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
                <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onEdit={onEdit}
                    onVote={onVote}
                    getStatusBadge={getStatusBadge}
                    getPriorityBadge={getPriorityBadge}
                    getImpactIndicator={getImpactIndicator}
                    getEffortIndicator={getEffortIndicator}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
};

// Individual Recommendation Card
const RecommendationCard = ({ 
    recommendation, 
    onEdit, 
    onVote, 
    getStatusBadge, 
    getPriorityBadge, 
    getImpactIndicator, 
    getEffortIndicator,
    currentUser 
}) => {
    const netVotes = (recommendation.upvotes || 0) - (recommendation.downvotes || 0);
    const hasUserVoted = recommendation.userVotes && currentUser && 
        recommendation.userVotes[currentUser.uid];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {recommendation.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(recommendation.status)}`}>
                                {recommendation.status?.replace('-', ' ')?.toUpperCase() || 'UNDER REVIEW'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(recommendation.priority)}`}>
                                {recommendation.priority?.toUpperCase() || 'MEDIUM'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => onEdit(recommendation)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {recommendation.description}
                </p>

                {/* Metrics */}
                <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Impact:</span>
                            <div className={getImpactIndicator(recommendation.impact)}>
                                {recommendation.impact || 'Medium'}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Effort:</span>
                            {getEffortIndicator(recommendation.effort)}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {recommendation.tags && recommendation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {recommendation.tags.slice(0, 3).map((tag, index) => (
                            <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                        {recommendation.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                                +{recommendation.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onVote(recommendation.id, 'up')}
                                className={`p-1.5 rounded-full transition-colors ${
                                    hasUserVoted === 'up' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                            >
                                <ThumbsUp className="w-4 h-4" />
                            </button>
                            <span className={`text-sm font-medium ${
                                netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {netVotes}
                            </span>
                            <button
                                onClick={() => onVote(recommendation.id, 'down')}
                                className={`p-1.5 rounded-full transition-colors ${
                                    hasUserVoted === 'down' 
                                        ? 'bg-red-100 text-red-600' 
                                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                            >
                                <ThumbsDown className="w-4 h-4" />
                            </button>
                        </div>
                        {recommendation.comments && (
                            <div className="flex items-center gap-1 text-gray-500">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">{recommendation.comments.length}</span>
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(recommendation.created_at), { addSuffix: true })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Recommendation Table Component (simplified for space)
const RecommendationTable = ({ 
    recommendations, 
    onEdit, 
    getStatusBadge, 
    getPriorityBadge,
    sortConfig,
    setSortConfig
}) => {
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, [setSortConfig]);

    const getSortIcon = useCallback((columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-600" />
        );
    }, [sortConfig]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('title')}
                        >
                            <div className="flex items-center gap-1">
                                Title
                                {getSortIcon('title')}
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                        >
                            <div className="flex items-center gap-1">
                                Status
                                {getSortIcon('status')}
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('priority')}
                        >
                            <div className="flex items-center gap-1">
                                Priority
                                {getSortIcon('priority')}
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('votes')}
                        >
                            <div className="flex items-center gap-1">
                                Votes
                                {getSortIcon('votes')}
                            </div>
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('created_at')}
                        >
                            <div className="flex items-center gap-1">
                                Created
                                {getSortIcon('created_at')}
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {recommendations.map((rec) => {
                        const netVotes = (rec.upvotes || 0) - (rec.downvotes || 0);
                        
                        return (
                            <tr key={rec.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="max-w-xs">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {rec.title}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate">
                                            {rec.description}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(rec.status)}`}>
                                        {rec.status?.replace('-', ' ')?.toUpperCase() || 'UNDER REVIEW'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(rec.priority)}`}>
                                        {rec.priority?.toUpperCase() || 'MEDIUM'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-medium ${
                                        netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                        {netVotes > 0 ? '+' : ''}{netVotes}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {format(new Date(rec.created_at), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onEdit(rec)}
                                        className="text-teal-600 hover:text-teal-900 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Basic Modal Component (you'd need to implement this based on your modal system)
const RecommendationModal = ({ recommendation, onSave, onClose, currentUser, teamMembers }) => {
    const [formData, setFormData] = useState({
        title: recommendation?.title || '',
        description: recommendation?.description || '',
        rationale: recommendation?.rationale || '',
        status: recommendation?.status || 'under-review',
        priority: recommendation?.priority || 'medium',
        category: recommendation?.category || 'ui-ux',
        impact: recommendation?.impact || 'medium',
        effort: recommendation?.effort || 'medium',
        assignee: recommendation?.assignee || '',
        tags: recommendation?.tags || [],
        due_date: recommendation?.due_date || '',
    });

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: recommendation?.id,
            created_by: recommendation?.created_by || currentUser?.uid,
            created_at: recommendation?.created_at || new Date(),
            updated_at: new Date(),
        });
        onClose();
    }, [formData, recommendation, currentUser, onSave, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {recommendation ? 'Edit Recommendation' : 'New Feature Recommendation'}
                    </h3>
                </div>
                
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Brief title for the feature recommendation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Detailed description of the feature or improvement..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Impact
                            </label>
                            <select
                                value={formData.impact}
                                onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="high">High Impact</option>
                                <option value="medium">Medium Impact</option>
                                <option value="low">Low Impact</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Development Effort
                            </label>
                            <select
                                value={formData.effort}
                                onChange={(e) => setFormData(prev => ({ ...prev, effort: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="small">Small (1-2 days)</option>
                                <option value="medium">Medium (1-2 weeks)</option>
                                <option value="large">Large (1+ months)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assignee
                            </label>
                            <select
                                value={formData.assignee}
                                onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map((member) => (
                                    <option key={member.uid} value={member.uid}>
                                        {member.displayName || member.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Rationale
                        </label>
                        <textarea
                            rows={3}
                            value={formData.rationale}
                            onChange={(e) => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Why is this feature important? What business value does it provide?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={formData.tags.join(', ')}
                            onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g. mobile, dashboard, user-experience"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Date
                        </label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            {recommendation ? 'Update' : 'Create'} Recommendation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeatureRecommendationsPage;