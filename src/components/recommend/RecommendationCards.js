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
        'on-hold': 'bg-muted text-muted-foreground border-border',
    };
    return statusConfig[status?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
};

const getPriorityBadge = (priority) => {
    const priorityConfig = {
        'critical': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'low': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return priorityConfig[priority?.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
};

const getImpactIndicator = (impact) => {
    const impactColors = {
        'high': 'text-green-500',
        'medium': 'text-yellow-500',
        'low': 'text-muted-foreground',
    };
    return impactColors[impact?.toLowerCase()] || 'text-muted-foreground';
};

const getEffortIndicator = (effort) => {
    const effortConfig = {
        'small': { dots: 1, color: 'text-green-500' },
        'medium': { dots: 2, color: 'text-yellow-500' },
        'large': { dots: 3, color: 'text-red-500' },
    };
    const config = effortConfig[effort?.toLowerCase()] || { dots: 1, color: 'text-muted-foreground' };
    
    return (
        <div className={`flex gap-1 ${config.color}`}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                        i < config.dots ? 'bg-current' : 'bg-muted'
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
        <div className={`bg-card rounded-lg shadow-theme-sm border transition-all flex flex-col h-full ${
            isSelected 
                ? 'border-teal-500 ring-2 ring-teal-200' 
                : 'border-border hover:shadow-theme-md'
        }`}>
            {/* Header Section */}
            <div className="p-5 border-b border-border">
                <div className="flex items-start gap-3 mb-4">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-0.5 flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={handleSelectChange}
                            className="w-4 h-4 text-teal-600 border-input rounded focus:ring-teal-500 focus:ring-2"
                        />
                    </div>
                    
                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-card-foreground mb-2 break-words line-clamp-2">
                            {recommendation.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                            {recommendation.description}
                        </p>
                    </div>
                    
                    {/* Actions Dropdown */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="p-1.5 text-muted-foreground hover:text-card-foreground rounded-md hover:bg-accent transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showActionsDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-popover border border-border rounded-md shadow-theme-lg z-10">
                                <button
                                    onClick={() => {
                                        onEdit(recommendation);
                                        setShowActionsDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center gap-2 first:rounded-t-md whitespace-nowrap transition-colors"
                                >
                                    <Edit className="w-4 h-4 flex-shrink-0" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={handleArchive}
                                    disabled={actionLoading === onArchive}
                                    className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center gap-2 disabled:opacity-50 whitespace-nowrap transition-colors"
                                >
                                    <Archive className="w-4 h-4 flex-shrink-0" />
                                    <span>{actionLoading === onArchive ? 'Archiving...' : 'Archive'}</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading === onDelete}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-md disabled:opacity-50 whitespace-nowrap transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                                    <span>{actionLoading === onDelete ? 'Deleting...' : 'Delete'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${getStatusBadge(recommendation.status)}`}
                        >
                            <span>{recommendation.status?.replace('-', ' ')?.toUpperCase() || 'UNDER REVIEW'}</span>
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        </button>
                        
                        {showStatusDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-theme-lg z-10">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onStatusUpdate(recommendation.id, option.value);
                                            setShowStatusDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent first:rounded-t-md last:rounded-b-md whitespace-nowrap transition-colors"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Priority Badge */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border whitespace-nowrap ${getPriorityBadge(recommendation.priority)}`}>
                        {recommendation.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Impact:</span>
                        <span className={getImpactIndicator(recommendation.impact)}>
                            {recommendation.impact || 'Medium'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Effort:</span>
                        {getEffortIndicator(recommendation.effort)}
                    </div>
                </div>

                {/* Tags */}
                {recommendation.tags && recommendation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {recommendation.tags.slice(0, 3).map((tag, index) => (
                            <span 
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground whitespace-nowrap"
                            >
                                <Tag className="w-3 h-3 flex-shrink-0" />
                                <span>{tag}</span>
                            </span>
                        ))}
                        {recommendation.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground whitespace-nowrap">
                                +{recommendation.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Section */}
            <div className="p-5 border-t border-border mt-auto">
                <div className="flex items-center justify-between gap-3">
                    {/* Voting Section */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onVote(recommendation.id, 'up')}
                                disabled={actionLoading}
                                className={`p-1.5 rounded-md transition-colors disabled:opacity-50 flex-shrink-0 ${
                                    hasUserVoted === 'up' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'
                                }`}
                            >
                                <ThumbsUp className="w-4 h-4" />
                            </button>
                            <span className={`min-w-[2rem] text-center text-sm font-medium ${
                                netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                                {netVotes}
                            </span>
                            <button
                                onClick={() => onVote(recommendation.id, 'down')}
                                disabled={actionLoading}
                                className={`p-1.5 rounded-md transition-colors disabled:opacity-50 flex-shrink-0 ${
                                    hasUserVoted === 'down' 
                                        ? 'bg-red-100 text-red-600' 
                                        : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
                                }`}
                            >
                                <ThumbsDown className="w-4 h-4" />
                            </button>
                        </div>
                        {recommendation.comments && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{recommendation.comments.length}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
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
        <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center flex-shrink-0">
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                        if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAllChange}
                    className="w-4 h-4 text-teal-600 border-input rounded focus:ring-teal-500 focus:ring-2"
                />
            </div>
            <span className="text-sm text-muted-foreground">
                {selectedRecommendations.length === 0 
                    ? `Select suggestions (${recommendations.length} total)`
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
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-12 text-center">
                <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-card-foreground mb-2">No recommendations found</h3>
                <p className="text-muted-foreground mb-6">Create your first feature recommendation to get started.</p>
                <button
                    onClick={() => onEdit(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-theme-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-teal-500 transition-colors"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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