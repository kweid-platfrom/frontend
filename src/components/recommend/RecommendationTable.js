import React, { useState } from 'react';
import {
    TrendingUp,
    Clock,
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    ThumbsDown,
    Lightbulb,
    Trash2,
    Archive,
    MoreHorizontal
} from 'lucide-react';

// Utility functions for styling (same as cards)
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

// Table Row Component with Actions and Selection
const RecommendationTableRow = ({ 
    recommendation, 
    onEdit, 
    onVote,
    onDelete,
    onArchive,
    currentUser,
    safeFormatDate,
    selectedRecommendations,
    onSelectRecommendation
}) => {
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    
    const isSelected = selectedRecommendations.includes(recommendation.id);
    const netVotes = (recommendation.upvotes || 0) - (recommendation.downvotes || 0);
    const hasUserVoted = recommendation.userVotes && currentUser && 
        recommendation.userVotes[currentUser.uid];

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
        <tr className={`transition-colors ${
            isSelected 
                ? 'bg-teal-50 border-teal-200' 
                : 'hover:bg-accent'
        }`}>
            {/* Selection Checkbox Column */}
            <td className="px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleSelectChange}
                    className="w-4 h-4 text-teal-600 border-input rounded focus:ring-teal-500 focus:ring-2"
                />
            </td>
            <td className="px-6 py-4">
                <div className="max-w-xs">
                    <div className="text-sm font-medium text-card-foreground truncate">
                        {recommendation.title}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                        {recommendation.description}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(recommendation.status)}`}>
                    {recommendation.status?.replace('-', ' ')?.toUpperCase() || 'UNDER REVIEW'}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getPriorityBadge(recommendation.priority)}`}>
                    {recommendation.priority?.toUpperCase() || 'MEDIUM'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onVote(recommendation.id, 'up')}
                        disabled={actionLoading}
                        className={`p-1 rounded-full transition-colors disabled:opacity-50 ${
                            hasUserVoted === 'up' 
                                ? 'bg-green-100 text-green-600' 
                                : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'
                        }`}
                    >
                        <ThumbsUp className="w-3 h-3" />
                    </button>
                    <span className={`text-sm font-medium min-w-[24px] text-center ${
                        netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                        {netVotes > 0 ? '+' : ''}{netVotes}
                    </span>
                    <button
                        onClick={() => onVote(recommendation.id, 'down')}
                        disabled={actionLoading}
                        className={`p-1 rounded-full transition-colors disabled:opacity-50 ${
                            hasUserVoted === 'down' 
                                ? 'bg-red-100 text-red-600' 
                                : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
                        }`}
                    >
                        <ThumbsDown className="w-3 h-3" />
                    </button>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className={getImpactIndicator(recommendation.impact)}>
                            {recommendation.impact || 'Medium'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getEffortIndicator(recommendation.effort)}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
                {safeFormatDate(recommendation.created_at, 'short')}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(recommendation)}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
                    >
                        Edit
                    </button>
                    
                    {/* Actions Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="p-1 text-muted-foreground hover:text-card-foreground rounded-full hover:bg-accent"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showActionsDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-32 bg-popover border border-border rounded-md shadow-theme-lg z-10">
                                <button
                                    onClick={handleArchive}
                                    disabled={actionLoading === onArchive}
                                    className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-accent flex items-center gap-2 disabled:opacity-50"
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
            </td>
        </tr>
    );
};

// Main Recommendation Table Component
const RecommendationTable = ({ 
    recommendations, 
    selectedRecommendations,
    onSelectRecommendation,
    onSelectAll,
    onEdit, 
    onVote,
    onDelete,
    onArchive,
    currentUser,
    onSort,
    sortConfig,
    safeFormatDate
}) => {
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp className="w-3 h-3 text-muted-foreground" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-card-foreground" />
        ) : (
            <ChevronDown className="w-3 h-3 text-card-foreground" />
        );
    };

    // Calculate select all state
    const allSelected = recommendations.length > 0 && 
        recommendations.every(rec => selectedRecommendations.includes(rec.id));
    const someSelected = selectedRecommendations.length > 0 && !allSelected;

    const handleSelectAllChange = (e) => {
        onSelectAll(e.target.checked);
    };

    if (recommendations.length === 0) {
        return (
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-12 text-center">
                <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-card-foreground mb-2">No recommendations found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or create a new recommendation.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg shadow-theme-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                        <tr>
                            {/* Select All Checkbox */}
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = someSelected;
                                    }}
                                    onChange={handleSelectAllChange}
                                    className="w-4 h-4 text-teal-600 border-input rounded focus:ring-teal-500 focus:ring-2"
                                />
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => onSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Title
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => onSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => onSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => onSort('votes')}
                            >
                                <div className="flex items-center gap-1">
                                    Votes
                                    {getSortIcon('votes')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Impact/Effort
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => onSort('created_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Created
                                    {getSortIcon('created_at')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {recommendations.map((rec) => (
                            <RecommendationTableRow
                                key={rec.id}
                                recommendation={rec}
                                onEdit={onEdit}
                                onVote={onVote}
                                onDelete={onDelete}
                                onArchive={onArchive}
                                currentUser={currentUser}
                                safeFormatDate={safeFormatDate}
                                selectedRecommendations={selectedRecommendations}
                                onSelectRecommendation={onSelectRecommendation}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecommendationTable;