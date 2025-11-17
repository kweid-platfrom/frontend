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
import { 
    calculateSprintProgress, 
    getSprintAssetCounts,
    formatDate,
    getDaysRemaining,
    getSprintStatusInfo
} from '../../utils/sprintUtils';

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

    // Get all assets from global state
    const allTestCases = state?.testCases?.testCases || [];
    const allBugs = state?.bugs?.bugs || [];
    const allRecommendations = state?.recommendations?.recommendations || [];

    // Debug logging
    useEffect(() => {
        console.log('🔍 SprintsPage mounted with:', {
            hasLoadingActions: typeof setLoadingActions === 'function',
            loadingActionsCount: loadingActions.length,
            selectedItemsCount: selectedItems.length,
            activeSuiteId: activeSuite?.id,
            sprintsCount: sprints.length
        });
    }, [loadingActions, selectedItems, activeSuite, sprints]);

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
        const info = getSprintStatusInfo(status);
        let icon;
        switch (status) {
            case 'active':
                icon = Play;
                break;
            case 'completed':
                icon = CheckCircle;
                break;
            case 'on-hold':
                icon = Pause;
                break;
            case 'planning':
            default:
                icon = Clock;
                break;
        }
        return { ...info, icon };
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
        console.log('🎯 Bulk action triggered:', {
            actionId,
            selectedIds,
            selectedOption,
            suiteId: activeSuite?.id,
            hasSetLoadingActions: typeof setLoadingActions === 'function',
            actionConfig
        });

        // Validation checks
        if (!activeSuite?.id) {
            console.error('❌ No active suite ID');
            actions.ui?.showNotification?.({
                id: 'no-suite-error',
                type: 'error',
                message: 'No active suite selected',
                duration: 3000
            });
            return;
        }

        if (!selectedIds || selectedIds.length === 0) {
            console.error('❌ No items selected');
            return;
        }

        if (!actions.sprints) {
            console.error('❌ Sprint actions not available');
            actions.ui?.showNotification?.({
                id: 'actions-unavailable',
                type: 'error',
                message: 'Sprint actions are not available',
                duration: 3000
            });
            return;
        }

        console.log('✅ Available sprint actions:', Object.keys(actions.sprints));

        // Add action to loading state
        setLoadingActions(prev => {
            console.log('📝 Adding to loading actions:', actionId, 'Current:', prev);
            return [...prev, actionId];
        });

        try {
            let successCount = 0;
            let failCount = 0;

            switch (actionId) {
                case 'delete':
                    console.log('🗑️ Deleting sprints:', selectedIds);
                    if (!actions.sprints?.deleteSprint) {
                        throw new Error('deleteSprint action not available');
                    }
                    for (const sprintId of selectedIds) {
                        try {
                            const result = await actions.sprints.deleteSprint(sprintId, activeSuite.id);
                            console.log(`Delete result for ${sprintId}:`, result);
                            if (result?.success !== false) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (err) {
                            console.error(`Failed to delete sprint ${sprintId}:`, err);
                            failCount++;
                        }
                    }
                    break;

                case 'archive':
                    console.log('📦 Archiving sprints:', selectedIds);
                    if (!actions.sprints?.archiveSprint) {
                        throw new Error('archiveSprint action not available');
                    }
                    for (const sprintId of selectedIds) {
                        try {
                            const result = await actions.sprints.archiveSprint(activeSuite.id, sprintId, 'Bulk archive');
                            console.log(`Archive result for ${sprintId}:`, result);
                            if (result?.success !== false) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (err) {
                            console.error(`Failed to archive sprint ${sprintId}:`, err);
                            failCount++;
                        }
                    }
                    break;

                case 'start':
                    console.log('▶️ Starting sprints:', selectedIds);
                    if (!actions.sprints?.updateSprint) {
                        throw new Error('updateSprint action not available');
                    }
                    for (const sprintId of selectedIds) {
                        try {
                            const result = await actions.sprints.updateSprint(sprintId, { status: 'active' }, activeSuite.id);
                            console.log(`Start result for ${sprintId}:`, result);
                            if (result?.success !== false) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (err) {
                            console.error(`Failed to start sprint ${sprintId}:`, err);
                            failCount++;
                        }
                    }
                    break;

                case 'complete':
                    console.log('✅ Completing sprints:', selectedIds);
                    if (!actions.sprints?.updateSprint) {
                        throw new Error('updateSprint action not available');
                    }
                    for (const sprintId of selectedIds) {
                        try {
                            const result = await actions.sprints.updateSprint(sprintId, { status: 'completed' }, activeSuite.id);
                            console.log(`Complete result for ${sprintId}:`, result);
                            if (result?.success !== false) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (err) {
                            console.error(`Failed to complete sprint ${sprintId}:`, err);
                            failCount++;
                        }
                    }
                    break;

                case 'close':
                    console.log('🔒 Closing sprints:', selectedIds);
                    if (!actions.sprints?.updateSprint) {
                        throw new Error('updateSprint action not available');
                    }
                    for (const sprintId of selectedIds) {
                        try {
                            const result = await actions.sprints.updateSprint(sprintId, { status: 'closed' }, activeSuite.id);
                            console.log(`Close result for ${sprintId}:`, result);
                            if (result?.success !== false) {
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch (err) {
                            console.error(`Failed to close sprint ${sprintId}:`, err);
                            failCount++;
                        }
                    }
                    break;

                default:
                    console.warn('Unhandled action:', actionId);
                    throw new Error(`Unknown action: ${actionId}`);
            }

            // Show appropriate notification based on results
            if (successCount > 0 && failCount === 0) {
                actions.ui?.showNotification?.({
                    id: `bulk-${actionId}-success`,
                    type: 'success',
                    message: `${successCount} sprint(s) ${actionId === 'delete' ? 'deleted' : actionId === 'archive' ? 'archived' : 'updated'} successfully`,
                    duration: 3000
                });
            } else if (successCount > 0 && failCount > 0) {
                actions.ui?.showNotification?.({
                    id: `bulk-${actionId}-partial`,
                    type: 'warning',
                    message: `${successCount} succeeded, ${failCount} failed`,
                    duration: 4000
                });
            } else if (failCount > 0) {
                throw new Error(`All ${failCount} operations failed`);
            }

            // Clear selection after successful action
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
            setLoadingActions(prev => {
                console.log('🧹 Removing from loading actions:', actionId, 'Current:', prev);
                return prev.filter(id => id !== actionId);
            });
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
                        
                        // Calculate progress using utility
                        const progressPercentage = calculateSprintProgress(
                            sprint,
                            allTestCases,
                            allBugs,
                            allRecommendations
                        );

                        // Get asset counts using utility
                        const assetCounts = getSprintAssetCounts(
                            sprint.id,
                            allTestCases,
                            allBugs,
                            allRecommendations
                        );
                        
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

                                    {/* Display asset counts */}
                                    {assetCounts.total > 0 && (
                                        <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-border text-xs">
                                            {assetCounts.testCases > 0 && (
                                                <span className="flex items-center space-x-1">
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium">{assetCounts.testCases}</span>
                                                    <span className="text-muted-foreground">tests</span>
                                                </span>
                                            )}
                                            {assetCounts.bugs > 0 && (
                                                <span className="flex items-center space-x-1">
                                                    <span className="text-red-600 dark:text-red-400 font-medium">{assetCounts.bugs}</span>
                                                    <span className="text-muted-foreground">bugs</span>
                                                </span>
                                            )}
                                            {assetCounts.recommendations > 0 && (
                                                <span className="flex items-center space-x-1">
                                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{assetCounts.recommendations}</span>
                                                    <span className="text-muted-foreground">recommendations</span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar - using utility */}
                                {assetCounts.total > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border ml-8">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">Progress</span>
                                            <span className="text-xs font-medium text-foreground">
                                                {progressPercentage}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${progressPercentage}%` }}
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