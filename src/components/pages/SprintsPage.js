'use client'
import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Plus, 
    Filter, 
    Search, 
    MoreVertical,
    Play,
    Pause,
    CheckCircle,
    Clock,
    Edit,
    Trash2,
    Target
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';
import CreateSprintModal from '../modals/CreateSprintModal';
import SprintDashboard from '../SprintDashboard';

const SprintsPage = () => {
    const { state, actions } = useApp();
    const { sprints = [], activeSprint, loading } = state.sprints || {};
    const { activeSuite } = state.suites || {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSprint, setSelectedSprint] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'dashboard'
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(null);

    // Load sprints when component mounts or activeSuite changes
    useEffect(() => {
        if (activeSuite?.id && actions.sprints?.loadSprints && !loading && sprints.length === 0) {
            actions.sprints.loadSprints(activeSuite.id);
        }
    }, [activeSuite?.id, actions.sprints, loading, sprints.length]);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Active' };
            case 'completed':
                return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Completed' };
            case 'on-hold':
                return { icon: Pause, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'On Hold' };
            case 'planning':
            default:
                return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Planning' };
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const filteredSprints = sprints.filter(sprint => {
        // Filter by status
        if (filter !== 'all' && sprint.status !== filter) return false;
        
        // Filter by search term
        if (searchTerm && !sprint.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        
        return true;
    });

    const handleSprintCreated = (sprint) => {
        setShowCreateModal(false);
        // Use correct method name
        if (actions.sprints?.setActiveSprint) {
            actions.sprints.setActiveSprint(sprint);
        }
        // Don't show additional notification here as it's already shown in the action
    };

    const handleSprintClick = (sprint) => {
        setSelectedSprint(sprint);
        // Use correct method name
        if (actions.sprints?.setActiveSprint) {
            actions.sprints.setActiveSprint(sprint);
        }
        setView('dashboard');
    };

    const handleDeleteSprint = async (sprintId) => {
        if (!activeSuite?.id || !actions.sprints?.deleteSprint) return;
        
        try {
            const result = await actions.sprints.deleteSprint(sprintId, activeSuite.id);
            if (result?.success) {
                setShowOptions(null);
                // Don't show additional notification as it's already shown in the action
            }
        } catch (error) {
            console.error('Failed to delete sprint:', error);
        }
    };

    if (!activeSuite) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted" />
                <h3 className="text-lg font-medium mb-2">No Suite Selected</h3>
                <p className="text-sm">Please select a test suite to manage sprints</p>
            </div>
        );
    }

    if (view === 'dashboard' && selectedSprint) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setView('list')}
                        className="flex items-center space-x-2 text-primary hover:text-primary/80"
                    >
                        ← Back to Sprints
                    </button>
                </div>
                <SprintDashboard sprintId={selectedSprint.id} suiteId={activeSuite.id} />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
                    <p className="text-muted-foreground">Manage and track sprint progress for {activeSuite.name}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create Sprint</span>
                </button>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between mb-6 space-x-4">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search sprints..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">All Sprints</option>
                            <option value="planning">Planning</option>
                            <option value="active">Active</option>
                            <option value="on-hold">On Hold</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Sprints List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p>Loading sprints...</p>
                </div>
            ) : filteredSprints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-muted" />
                    <h3 className="text-lg font-medium mb-2">
                        {searchTerm || filter !== 'all' ? 'No sprints match your filters' : 'No sprints yet'}
                    </h3>
                    <p className="text-sm mb-4">
                        {searchTerm || filter !== 'all' 
                            ? 'Try adjusting your search or filter criteria'
                            : 'Create your first sprint to organize your testing work'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSprints.map((sprint) => {
                        const statusInfo = getStatusInfo(sprint.status);
                        const StatusIcon = statusInfo.icon;
                        const daysRemaining = getDaysRemaining(sprint.endDate);
                        
                        return (
                            <div
                                key={sprint.id}
                                className={`bg-card rounded-lg border border-border p-4 hover:shadow-theme-md transition-all cursor-pointer ${
                                    activeSprint?.id === sprint.id ? 'ring-2 ring-primary border-primary' : ''
                                }`}
                                onClick={() => handleSprintClick(sprint)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground mb-1 truncate">{sprint.name}</h3>
                                        {sprint.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {sprint.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor}`}>
                                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                                            <span className={statusInfo.color}>{statusInfo.label}</span>
                                        </div>
                                        
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowOptions(showOptions === sprint.id ? null : sprint.id);
                                                }}
                                                className="p-1 rounded hover:bg-secondary"
                                            >
                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            
                                            {showOptions === sprint.id && (
                                                <div className="absolute right-0 top-8 bg-card border border-border shadow-theme-lg rounded-lg py-1 z-10 min-w-32">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // TODO: Implement edit functionality
                                                            setShowOptions(null);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center space-x-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteSprint(sprint.id);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-secondary text-red-600 flex items-center space-x-2"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {sprint.startDate && sprint.endDate && (
                                        <div className="flex items-center justify-between">
                                            <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                                            {daysRemaining !== null && (
                                                <span className={
                                                    daysRemaining < 0 ? 'text-red-600 font-medium' : 
                                                    daysRemaining <= 7 ? 'text-yellow-600 font-medium' : ''
                                                }>
                                                    {daysRemaining < 0 
                                                        ? `${Math.abs(daysRemaining)}d overdue`
                                                        : daysRemaining === 0 
                                                            ? 'Due today'
                                                            : `${daysRemaining}d left`
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {sprint.goals && (
                                        <div className="flex items-start space-x-1 mt-2">
                                            <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs line-clamp-2">{sprint.goals}</p>
                                        </div>
                                    )}
                                </div>

                                {sprint.progress && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">Progress</span>
                                            <span className="text-xs font-medium text-foreground">
                                                {sprint.progress.percentage || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${sprint.progress.percentage || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateSprintModal
                isOpen={showCreateModal}
                onSprintCreated={handleSprintCreated}
                onCancel={() => setShowCreateModal(false)}
                suiteId={activeSuite?.id}
            />
        </div>
    );
};

export default SprintsPage;