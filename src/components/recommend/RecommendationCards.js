import React, { useState } from 'react';
import {
    Plus,
    TrendingUp,
    Clock,
    ChevronDown,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Tag,
    Edit,
    Trash2,
    Archive,
    MoreHorizontal,
    Lightbulb
} from 'lucide-react';

// Utility functions for styling
const getStatusBadge = (status) => {
    const statusConfig = {
        'under-review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'in-development': 'bg-blue-100 text-blue-800 border-blue-200',
        'completed': 'bg-purple-100 text-purple-800 border-purple-200',
        'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusConfig[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getPriorityBadge = (priority) => {
    const priorityConfig = {
        'critical': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'low': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return priorityConfig[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getImpactIndicator = (impact) => {
    const impactColors = {
        'high': 'text-green-500',
        'medium': 'text-yellow-500',
        'low': 'text-gray-400',
    };
    return impactColors[impact?.toLowerCase()] || 'text-gray-400';
};

const getEffortIndicator = (effort) => {
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
};

// Individual Recommendation Card with Enhanced Actions and Selection
const RecommendationCard = ({ 
    recommendation, 
    onEdit, 
    onVote, 
    onStatusUpdate,
    onDelete,
    onArchive,
    currentUser,
    safeFormatDate,
    selectedRecommendations,
    onSelectRecommendation
}) => {
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    
    const isSelected = selectedRecommendations.includes(recommendation.id);
    const netVotes = (recommendation.upvotes || 0) - (recommendation.downvotes || 0);
    const hasUserVoted = recommendation.userVotes && currentUser && 
        recommendation.userVotes[currentUser.uid];

    const statusOptions = [
        { value: 'under-review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'in-development', label: 'In Development' },
        { value: 'completed', label: 'Completed' },
        { value: 'on-hold', label: 'On Hold' }
    ];

    const handleAction = async (action, ...args) => {
        setActionLoading(action);
        try {
            await action(...args);
        } finally {
            setActionLoading(null);
            setShowActionsDropdown(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this recommendation? This action cannot be undone.')) {
            handleAction(onDelete, recommendation.id);
        }
    };

    const handleArchive = () => {
        if (window.confirm('Are you sure you want to archive this recommendation?')) {
            handleAction(onArchive, recommendation.id);
        }
    };

    const handleSelectChange = (e) => {
        onSelectRecommendation(recommendation.id, e.target.checked);
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border transition-all ${
            isSelected 
                ? 'border-teal-500 ring-2 ring-teal-200' 
                : 'border-gray-200 hover:shadow-md'
        }`}>
            <div className="p-6">
                {/* Header with Selection Checkbox */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        {/* Selection Checkbox */}
                        <div className="flex items-center pt-1">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={handleSelectChange}
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                            />
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                {recommendation.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                                {/* Status Badge with Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border cursor-pointer hover:opacity-80 ${getStatusBadge(recommendation.status)}`}
                                    >
                                        {recommendation.status?.replace('-', ' ')?.toUpperCase() || 'UNDER REVIEW'}
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                    
                                    {showStatusDropdown && (
                                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        onStatusUpdate(recommendation.id, option.value);
                                                        setShowStatusDropdown(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(recommendation.priority)}`}>
                                    {recommendation.priority?.toUpperCase() || 'MEDIUM'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Actions Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showActionsDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                    onClick={() => {
                                        onEdit(recommendation);
                                        setShowActionsDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleArchive}
                                    disabled={actionLoading === onArchive}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Archive className="w-3 h-3" />
                                    {actionLoading === onArchive ? 'Archiving...' : 'Archive'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading === onDelete}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-md disabled:opacity-50"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    {actionLoading === onDelete ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>
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
                                disabled={actionLoading}
                                className={`p-1.5 rounded-full transition-colors disabled:opacity-50 ${
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
                                disabled={actionLoading}
                                className={`p-1.5 rounded-full transition-colors disabled:opacity-50 ${
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
                        {safeFormatDate(recommendation.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Bulk Selection Header Component
const BulkSelectionHeader = ({ 
    recommendations, 
    selectedRecommendations, 
    onSelectAll 
}) => {
    if (recommendations.length === 0) return null;
    
    const allSelected = recommendations.length > 0 && 
        recommendations.every(rec => selectedRecommendations.includes(rec.id));
    const someSelected = selectedRecommendations.length > 0 && !allSelected;

    const handleSelectAllChange = (e) => {
        onSelectAll(e.target.checked);
    };

    return (
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                        if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAllChange}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                />
            </div>
            <span className="text-sm text-gray-600">
                {selectedRecommendations.length === 0 
                    ? `Select recommendations (${recommendations.length} total)`
                    : `${selectedRecommendations.length} of ${recommendations.length} selected`
                }
            </span>
        </div>
    );
};

// Recommendation Cards Component
const RecommendationCards = ({ 
    recommendations, 
    selectedRecommendations,
    onSelectRecommendation,
    onSelectAll,
    onEdit, 
    onVote, 
    onStatusUpdate,
    onDelete,
    onArchive,
    currentUser,
    safeFormatDate
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
        <div>
            {/* Bulk Selection Header */}
            <BulkSelectionHeader
                recommendations={recommendations}
                selectedRecommendations={selectedRecommendations}
                onSelectAll={onSelectAll}
            />
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                    <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onEdit={onEdit}
                        onVote={onVote}
                        onStatusUpdate={onStatusUpdate}
                        onDelete={onDelete}
                        onArchive={onArchive}
                        currentUser={currentUser}
                        safeFormatDate={safeFormatDate}
                        selectedRecommendations={selectedRecommendations}
                        onSelectRecommendation={onSelectRecommendation}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecommendationCards;