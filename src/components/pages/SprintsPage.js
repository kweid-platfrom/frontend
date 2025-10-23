'use client'
import React, { useState, useEffect, useRef } from 'react';
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
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';

const SprintsPage = () => {
    const { state, actions } = useApp();
    const { sprints = [], activeSprint, loading } = state.sprints || {};
    const { activeSuite } = state.suites || {};

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSprint, setSelectedSprint] = useState(null);
    const [view, setView] = useState('list');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showOptions, setShowOptions] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loadingActions, setLoadingActions] = useState([]);
    
    const lastSuiteIdRef = useRef(null);

    useEffect(() => {
        if (activeSuite?.id !== lastSuiteIdRef.current) {
            lastSuiteIdRef.current = activeSuite?.id;
            if (view === 'dashboard') {
                setView('list');
                setSelectedSprint(null);
            }
            setSelectedItems([]);
        }
    }, [activeSuite?.id, view]);

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
        if (filter !== 'all' && sprint.status !== filter) return false;
        if (searchTerm && !sprint.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        return true;
    });

    const handleSprintCreated = (sprint) => {
        setShowCreateModal(false);
        if (actions.sprints?.setActiveSprint) {
            actions.sprints.setActiveSprint(sprint);
        }
    };

    const handleSprintClick = (sprint) => {
        setSelectedSprint(sprint);
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
                setSelectedItems([]);
            }
        } catch (error) {
            console.error('Failed to delete sprint:', error);
        }
    };

    const handleSelectSprint = (sprintId, event) => {
        event.stopPropagation();
        setSelectedItems(prev => {
            if (prev.includes(sprintId)) {
                return prev.filter(id => id !== sprintId);
            } else {
                return [...prev, sprintId];
            }
        });
    };

    const handleBulkAction = async (actionId, selectedIds, actionConfig, selectedOption) => {
        if (!activeSuite?.id) return;

        console.log('🎯 Bulk action triggered:', {
            actionId,
            selectedIds,
            selectedOption,
            suiteId: activeSuite.id
        });

        setLoadingActions(prev => [...prev, actionId]);

        try {
            switch (actionId) {
                case 'delete':
                    console.log('🗑️ Deleting sprints:', selectedIds);
                    for (const sprintId of selectedIds) {
                        const result = await actions.sprints.deleteSprint(sprintId, activeSuite.id);
                        console.log(`Delete result for ${sprintId}:`, result);
                    }
                    actions.ui?.showNotification?.({
                        id: 'bulk-delete-success',
                        type: 'success',
                        message: `${selectedIds.length} sprint(s) deleted successfully`,
                        duration: 3000
                    });
                    break;

                case 'archive':
                    console.log('📦 Archiving sprints:', selectedIds);
                    for (const sprintId of selectedIds) {
                        const result = await actions.sprints.archiveSprint?.(activeSuite.id, sprintId, 'Bulk archive');
                        console.log(`Archive result for ${sprintId}:`, result);
                    }
                    actions.ui?.showNotification?.({
                        id: 'bulk-archive-success',
                        type: 'success',
                        message: `${selectedIds.length} sprint(s) archived successfully`,
                        duration: 3000
                    });
                    break;

                case 'start':
                    console.log('▶️ Starting sprints:', selectedIds);
                    for (const sprintId of selectedIds) {
                        const result = await actions.sprints.updateSprint(sprintId, { status: 'active' }, activeSuite.id);
                        console.log(`Start result for ${sprintId}:`, result);
                    }
                    actions.ui?.showNotification?.({
                        id: 'bulk-start-success',
                        type: 'success',
                        message: `${selectedIds.length} sprint(s) started successfully`,
                        duration: 3000
                    });
                    break;

                case 'complete':
                    console.log('✅ Completing sprints:', selectedIds);
                    for (const sprintId of selectedIds) {
                        const result = await actions.sprints.updateSprint(sprintId, { status: 'completed' }, activeSuite.id);
                        console.log(`Complete result for ${sprintId}:`, result);
                    }
                    actions.ui?.showNotification?.({
                        id: 'bulk-complete-success',
                        type: 'success',
                        message: `${selectedIds.length} sprint(s) completed successfully`,
                        duration: 3000
                    });
                    break;

                case 'close':
                    console.log('🔒 Closing sprints:', selectedIds);
                    for (const sprintId of selectedIds) {
                        const result = await actions.sprints.updateSprint(sprintId, { status: 'closed' }, activeSuite.id);
                        console.log(`Close result for ${sprintId}:`, result);
                    }
                    actions.ui?.showNotification?.({
                        id: 'bulk-close-success',
                        type: 'success',
                        message: `${selectedIds.length} sprint(s) closed successfully`,
                        duration: 3000
                    });
                    break;

                default:
                    console.warn('Unhandled action:', actionId);
            }

            setSelectedItems([]);
        } catch (error) {
            console.error('💥 Bulk action failed:', error);
            actions.ui?.showNotification?.({
                id: 'bulk-action-error',
                type: 'error',
                message: `Failed to ${actionId} sprints: ${error.message}`,
                duration: 5000
            });
        } finally {
            setLoadingActions(prev => prev.filter(id => id !== actionId));
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
                        const isSelected = selectedItems.includes(sprint.id);
                        
                        return (
                            <div
                                key={sprint.id}
                                className={`bg-card rounded-lg border p-4 hover:shadow-theme-md transition-all cursor-pointer relative ${
                                    isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
                                } ${activeSprint?.id === sprint.id ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => handleSprintClick(sprint)}
                            >
                                <div className="absolute top-4 left-4">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleSelectSprint(sprint.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                </div>

                                <div className="flex items-start justify-between mb-3 ml-8">
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

                                <div className="space-y-2 text-sm text-muted-foreground ml-8">
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

                                    {/* Display REAL asset counts from global state - FIXED */}
                                    {(() => {
                                        const allTestCases = state?.testCases?.testCases || [];
                                        const allBugs = state?.bugs?.bugs || [];
                                        const allRecommendations = state?.recommendations?.recommendations || [];
                                        
                                        const sprintTestCases = allTestCases.filter(tc => 
                                            (tc.sprint_id === sprint.id || tc.sprintId === sprint.id) &&
                                            tc.status !== 'deleted' && tc.status !== 'archived'
                                        ).length;
                                        
                                        const sprintBugs = allBugs.filter(bug => 
                                            (bug.sprint_id === sprint.id || bug.sprintId === sprint.id) &&
                                            bug.status !== 'deleted' && bug.status !== 'archived'
                                        ).length;
                                        
                                        const sprintRecs = allRecommendations.filter(rec => 
                                            (rec.sprint_id === sprint.id || rec.sprintId === sprint.id) &&
                                            rec.status !== 'deleted' && rec.status !== 'archived'
                                        ).length;
                                        
                                        const hasAssets = sprintTestCases > 0 || sprintBugs > 0 || sprintRecs > 0;
                                        
                                        return hasAssets && (
                                            <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-border text-xs">
                                                {sprintTestCases > 0 && (
                                                    <span className="flex items-center space-x-1">
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{sprintTestCases}</span>
                                                        <span className="text-muted-foreground">tests</span>
                                                    </span>
                                                )}
                                                {sprintBugs > 0 && (
                                                    <span className="flex items-center space-x-1">
                                                        <span className="text-red-600 dark:text-red-400 font-medium">{sprintBugs}</span>
                                                        <span className="text-muted-foreground">bugs</span>
                                                    </span>
                                                )}
                                                {sprintRecs > 0 && (
                                                    <span className="flex items-center space-x-1">
                                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">{sprintRecs}</span>
                                                        <span className="text-muted-foreground">recommendations</span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {sprint.progress && (
                                    <div className="mt-3 pt-3 border-t border-border ml-8">
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

            <EnhancedBulkActionsBar
                selectedItems={selectedItems}
                onClearSelection={() => setSelectedItems([])}
                assetType="sprints"
                onAction={handleBulkAction}
                loadingActions={loadingActions}
            />

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