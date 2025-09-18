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

// Table Row Component with Actions
const RecommendationTableRow = ({ 
    recommendation, 
    onEdit, 
    onVote,
    onDelete,
    onArchive,
    currentUser,
    safeFormatDate
}) => {
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    
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

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
                <div className="max-w-xs">
                    <div className="text-sm font-medium text-gray-900 truncate">
                        {recommendation.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
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
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                    >
                        <ThumbsUp className="w-3 h-3" />
                    </button>
                    <span className={`text-sm font-medium min-w-[24px] text-center ${
                        netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                        {netVotes > 0 ? '+' : ''}{netVotes}
                    </span>
                    <button
                        onClick={() => onVote(recommendation.id, 'down')}
                        disabled={actionLoading}
                        className={`p-1 rounded-full transition-colors disabled:opacity-50 ${
                            hasUserVoted === 'down' 
                                ? 'bg-red-100 text-red-600' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
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
            <td className="px-6 py-4 text-sm text-gray-500">
                {safeFormatDate(recommendation.created_at, 'short')}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(recommendation)}
                        className="text-teal-600 hover:text-teal-900 text-sm font-medium"
                    >
                        Edit
                    </button>
                    
                    {/* Actions Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showActionsDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
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
            </td>
        </tr>
    );
};

// Main Recommendation Table Component
const RecommendationTable = ({ 
    recommendations, 
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
            return <ChevronUp className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-600" />
        );
    };

    if (recommendations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
                <p className="text-gray-600">Try adjusting your filters or create a new recommendation.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => onSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    Title
                                    {getSortIcon('title')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => onSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => onSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {getSortIcon('priority')}
                                </div>
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => onSort('votes')}
                            >
                                <div className="flex items-center gap-1">
                                    Votes
                                    {getSortIcon('votes')}
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Impact/Effort
                            </th>
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => onSort('created_at')}
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
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecommendationTable;