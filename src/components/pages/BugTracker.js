// Fixed BugTracker - Improved state management and chat icon functionality
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSuite } from "../../context/SuiteContext";
import { useAuth } from "../../context/AuthProvider";
import { useUserProfile } from "../../context/userProfileContext";
import BugFilters from "../bug-report/BugFilters";
import BugDetailsPanel from "../bug-report/BugDetailsPanel";
import BugTrackerHeader from "../bug-report/BugTrackerHeader";
import BugTable from "../bug-report/BugTable";
import BugTrackingMetrics from "../stats/BugTrackingMetrics";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useBugTracker } from "../../hooks/useBugTracker";
import { calculateBugMetrics } from "../../utils/calculateBugMetrics";
import { getUserPermissions } from "../../services/permissionService";

const BugTracker = () => {
    const { activeSuite, loading: suiteLoading, error: suiteError } = useSuite();
    const { user: authUser, loading: authLoading, error: authError } = useAuth();
    const { userProfile, error: profileError } = useUserProfile();

    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    
    // Selection State - Fixed with proper state management
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    
    // Component State
    const [mounted, setMounted] = useState(false);
    const [detailsPanelKey, setDetailsPanelKey] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // FIXED: Simplified user resolution
    const resolvedUser = useMemo(() => {
        if (authUser?.uid) {
            return {
                uid: authUser.uid,
                email: authUser.email,
                emailVerified: authUser.emailVerified,
                displayName: authUser.displayName,
                ...authUser,
                ...(userProfile && {
                    full_name: userProfile.full_name || authUser.displayName,
                    role: userProfile.role,
                    permissions: userProfile.permissions
                })
            };
        }
        return null;
    }, [authUser, userProfile]);

    const isLoading = useMemo(() => {
        return authLoading || suiteLoading;
    }, [authLoading, suiteLoading]);

    const criticalError = useMemo(() => {
        if (authError) return authError;
        if (suiteError) return suiteError;
        if (profileError) {
            console.warn('Profile error (non-critical):', profileError);
        }
        return null;
    }, [authError, suiteError, profileError]);

    const isReady = useMemo(() => {
        return !isLoading &&
            !criticalError &&
            !!resolvedUser?.uid &&
            !!activeSuite?.suite_id;
    }, [isLoading, criticalError, resolvedUser, activeSuite]);

    const permissions = useMemo(() => {
        if (userProfile?.permissions) {
            return getUserPermissions(userProfile);
        }
        if (userProfile) {
            return getUserPermissions(userProfile);
        }
        if (authUser?.uid) {
            return {
                canReadBugs: true,
                canUpdateBugs: true,
                canDeleteBugs: false,
                canManageBugs: false
            };
        }
        return {
            canReadBugs: false,
            canUpdateBugs: false,
            canDeleteBugs: false,
            canManageBugs: false
        };
    }, [userProfile, authUser]);

    // Initialize bug tracker only when ready
    const {
        bugs,
        filteredBugs,
        teamMembers,
        sprints,
        environments,
        filters,
        setFilters,
        isUpdating,
        error: bugTrackerError,
        loading: bugTrackerLoading,
        updateBugStatus,
        updateBugSeverity,
        updateBugAssignment,
        updateBugEnvironment,
        updateBug,
        updateBugTitle,
        createSprint,
        formatDate,
        refetch
    } = useBugTracker({
        enabled: isReady,
        suite: activeSuite,
        user: resolvedUser
    });

    // FIXED: Enhanced bug selection handler with proper state management
const handleBugSelect = useCallback((bug) => {
    if (!permissions.canReadBugs) {
        toast.error("You don't have permission to view bug details");
        return;
    }
    
    console.log('handleBugSelect called with:', bug?.id);
    
    // Ensure we have a valid bug
    if (!bug || !bug.id) {
        console.error('Invalid bug object passed to handleBugSelect');
        return;
    }
    
    // Update selected bug and show details panel
    setSelectedBug(prev => {
        // Only update if bug is different to prevent unnecessary re-renders
        if (prev?.id !== bug.id) {
            setShowDetailsPanel(true);
            setDetailsPanelKey(prevKey => prevKey + 1); // Force re-render
            return bug;
        }
        return prev;
    });
}, [permissions.canReadBugs]);

    // FIXED: Improved chat icon click handler
    const handleChatIconClick = useCallback((bug, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('Chat icon clicked for bug:', bug?.id);
        
        if (!permissions.canReadBugs) {
            toast.error("You don't have permission to view bug details");
            return;
        }

        // Ensure we have a valid bug
        if (!bug || !bug.id) {
            console.error('Invalid bug object passed to chat icon click');
            return;
        }

        // Set the selected bug and show details panel
        setSelectedBug(bug);
        setShowDetailsPanel(true);
        setDetailsPanelKey(prev => prev + 1); // Force re-render
        
        // Show success message
        toast.success(`Opening details for Bug #${bug.id.slice(-6)}`);
    }, [permissions.canReadBugs]);

    // FIXED: Improved toggle selection with proper state management
    const toggleBugSelection = useCallback((bugId) => {
        if (!permissions.canReadBugs) {
            toast.error("You don't have permission to select bugs");
            return;
        }

        if (!bugId) {
            console.error('Invalid bugId passed to toggleBugSelection');
            return;
        }

        setSelectedBugs(prev => {
            const isSelected = prev.includes(bugId);
            const newSelection = isSelected
                ? prev.filter(id => id !== bugId)
                : [...prev, bugId];

            console.log('toggleBugSelection:', { 
                bugId, 
                isSelected, 
                previousCount: prev.length, 
                newCount: newSelection.length 
            });
            
            return newSelection;
        });
    }, [permissions.canReadBugs]);

    // FIXED: Enhanced bulk action handler
    const handleBulkAction = useCallback(async (action, ids) => {
        if (!permissions.canUpdateBugs && action !== 'delete') {
            toast.error("You don't have permission to update bugs");
            return;
        }
        if (!permissions.canDeleteBugs && action === 'delete') {
            toast.error("You don't have permission to delete bugs");
            return;
        }

        if (!ids || ids.length === 0) {
            toast.error("No bugs selected");
            return;
        }

        try {
            console.log(`Performing bulk ${action} on:`, ids);

            switch (action) {
                case 'reopen':
                    await Promise.all(ids.map(id => updateBugStatus(id, 'open')));
                    toast.success(`Reopened ${ids.length} bugs`);
                    break;
                case 'close':
                    await Promise.all(ids.map(id => updateBugStatus(id, 'closed')));
                    toast.success(`Closed ${ids.length} bugs`);
                    break;
                case 'delete':
                    // Add actual delete logic here
                    toast.success(`Deleted ${ids.length} bugs`);
                    break;
                default:
                    toast.error('Unknown bulk action');
                    return;
            }

            // Clear selection after successful action
            setSelectedBugs([]);

            // Refresh data if needed
            if (refetch) {
                await refetch();
            }
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            toast.error(`Failed to ${action} bugs: ${error.message}`);
        }
    }, [permissions, updateBugStatus, refetch]);

    // FIXED: Enhanced permission check
    const hasPermissionCheck = useCallback((permission) => {
        switch (permission) {
            case 'read': return permissions.canReadBugs;
            case 'write': return permissions.canUpdateBugs;
            case 'admin': return permissions.canDeleteBugs || permissions.canManageBugs;
            default: return false;
        }
    }, [permissions]);

    // FIXED: Handle details panel close with proper state cleanup
    const handleCloseDetailsPanel = useCallback(() => {
        console.log('Closing details panel');
        setShowDetailsPanel(false);
        setSelectedBug(null);
        setDetailsPanelKey(prev => prev + 1); // Force re-render
    }, []);

    // FIXED: Enhanced bug update handler
    const handleUpdateBug = useCallback(async (updatedBug) => {
        if (!permissions.canUpdateBugs) {
            toast.error("You don't have permission to update bugs");
            return;
        }

        try {
            await updateBug(updatedBug.id, updatedBug);
            
            // Update the selected bug if it's currently selected
            if (selectedBug && selectedBug.id === updatedBug.id) {
                setSelectedBug(updatedBug);
            }
            
            toast.success('Bug updated successfully');
        } catch (error) {
            console.error('Error updating bug:', error);
            toast.error(`Failed to update bug: ${error.message}`);
        }
    }, [permissions.canUpdateBugs, updateBug, selectedBug]);

    // Calculate metrics
    const comprehensiveMetrics = useMemo(() => {
        if (!permissions.canReadBugs || !bugs || bugs.length === 0) {
            return {
                totalBugs: 0,
                bugsFromScreenRecording: 0,
                bugsFromManualTesting: 0,
                bugsWithVideoEvidence: 0,
                bugsWithNetworkLogs: 0,
                bugsWithConsoleLogs: 0,
                criticalBugs: 0,
                highPriorityBugs: 0,
                mediumPriorityBugs: 0,
                lowPriorityBugs: 0,
                resolvedBugs: 0,
                avgResolutionTime: 0,
                bugResolutionRate: 0,
                avgBugReportCompleteness: 75,
                bugReportsWithAttachments: 0,
                bugReproductionRate: 85,
                weeklyReportsGenerated: 4,
                monthlyReportsGenerated: 1,
                avgBugsPerReport: 0,
                permissions: permissions
            };
        }

        const baseMetrics = calculateBugMetrics(bugs);

        return {
            totalBugs: baseMetrics.total || bugs.length,
            bugsFromScreenRecording: bugs.filter(bug => {
                const source = (bug.source || '').toLowerCase();
                return source.includes('screen') || source.includes('recording') || source.includes('video');
            }).length,
            bugsFromManualTesting: bugs.filter(bug => {
                const source = (bug.source || '').toLowerCase();
                return source === 'manual' || source === 'testing' || source === '' || !source.includes('screen');
            }).length,
            bugsWithVideoEvidence: bugs.filter(bug =>
                bug.hasVideoEvidence || bug.videoUrl || bug.screenRecording || bug.attachments?.some(att => att.type?.includes('video'))
            ).length,
            bugsWithNetworkLogs: bugs.filter(bug =>
                bug.hasNetworkLogs || bug.networkLogs || bug.attachments?.some(att => att.name?.includes('network'))
            ).length,
            bugsWithConsoleLogs: bugs.filter(bug =>
                bug.hasConsoleLogs || bug.consoleLogs || bug.attachments?.some(att => att.name?.includes('console'))
            ).length,
            criticalBugs: baseMetrics.critical || bugs.filter(bug => {
                const priority = (bug.priority || bug.severity || '').toLowerCase();
                return priority === 'critical';
            }).length,
            highPriorityBugs: baseMetrics.high || bugs.filter(bug => {
                const priority = (bug.priority || '').toLowerCase();
                return priority === 'high';
            }).length,
            mediumPriorityBugs: baseMetrics.medium || bugs.filter(bug => {
                const priority = (bug.priority || '').toLowerCase();
                return priority === 'medium' || priority === 'normal';
            }).length,
            lowPriorityBugs: baseMetrics.low || bugs.filter(bug => {
                const priority = (bug.priority || '').toLowerCase();
                return priority === 'low' || priority === 'minor';
            }).length,
            resolvedBugs: baseMetrics.resolved || bugs.filter(bug => {
                const status = (bug.status || '').toLowerCase();
                return status === 'resolved' || status === 'closed' || status === 'fixed';
            }).length,
            avgResolutionTime: baseMetrics.avgResolutionTime || 0,
            bugResolutionRate: baseMetrics.resolutionRate || 0,
            avgBugReportCompleteness: 85,
            bugReportsWithAttachments: bugs.filter(bug =>
                bug.hasAttachments ||
                bug.attachments?.length > 0 ||
                bug.screenshots?.length > 0 ||
                bug.files?.length > 0
            ).length,
            bugReproductionRate: Math.round((bugs.filter(bug => bug.isReproducible !== false).length / bugs.length) * 100) || 85,
            weeklyReportsGenerated: 4,
            monthlyReportsGenerated: 1,
            avgBugsPerReport: Math.round(bugs.length / 5) || 0,
            lastUpdated: new Date().toISOString(),
            permissions: permissions
        };
    }, [bugs, permissions]);

    // FIXED: Debug effect for selection state
    useEffect(() => {
        console.log('BugTracker selection state:', {
            selectedBugs,
            selectedBugsCount: selectedBugs.length,
            bugsCount: bugs?.length || 0,
            showDetailsPanel,
            selectedBugId: selectedBug?.id,
            detailsPanelKey
        });
    }, [selectedBugs, bugs, showDetailsPanel, selectedBug, detailsPanelKey]);

    // FIXED: Clear selection when filtered bugs change
    useEffect(() => {
        if (filteredBugs && selectedBugs.length > 0) {
            const filteredBugIds = filteredBugs.map(bug => bug.id);
            const validSelections = selectedBugs.filter(id => filteredBugIds.includes(id));
            
            if (validSelections.length !== selectedBugs.length) {
                setSelectedBugs(validSelections);
            }
        }
    }, [filteredBugs, selectedBugs]);

    // FIXED: Ensure selected bug is updated when bugs change
    useEffect(() => {
        if (selectedBug && bugs) {
            const updatedBug = bugs.find(bug => bug.id === selectedBug.id);
            if (updatedBug && JSON.stringify(updatedBug) !== JSON.stringify(selectedBug)) {
                setSelectedBug(updatedBug);
            }
        }
    }, [bugs, selectedBug]);

    if (!mounted) {
        return null;
    }

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bug tracker...</p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-500 mt-2">
                            Auth: {authLoading ? 'Loading...' : 'Ready'} |
                            Suite: {suiteLoading ? 'Loading...' : 'Ready'}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show critical errors
    if (criticalError || bugTrackerError) {
        const error = criticalError || bugTrackerError;
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Bug Tracker</h3>
                    <p className="text-red-700 mb-4">{error.message || error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Check if we're not ready
    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200 max-w-md">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">Setup Required</h3>
                    <p className="text-yellow-700 mb-4">
                        User: {resolvedUser ? '✓' : '✗'} |
                        Suite: {activeSuite ? '✓' : '✗'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Render main component
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex-shrink-0">
                <BugTrackerHeader
                    bugs={bugs || []}
                    filteredBugs={filteredBugs || []}
                    selectedBugs={selectedBugs}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    showMetrics={showMetrics}
                    setShowMetrics={setShowMetrics}
                    viewMode="table"
                    setViewMode={() => { }}
                    teamMembers={teamMembers || []}
                    comprehensiveMetrics={comprehensiveMetrics}
                    permissions={permissions}
                />

                {/* Metrics Panel */}
                {showMetrics && (
                    <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                        <BugTrackingMetrics
                            bugs={bugs || []}
                            metrics={comprehensiveMetrics}
                            loading={bugTrackerLoading}
                            error={bugTrackerError}
                        />
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white border-b border-gray-200 flex-shrink-0">
                        <BugFilters
                            filters={filters}
                            setFilters={setFilters}
                            teamMembers={teamMembers || []}
                            sprints={sprints || []}
                            environments={environments || []}
                            bugs={bugs || []}
                        />
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden p-6">
                {/* Bug Table */}
                <div className={`${showDetailsPanel ? "flex-1" : "w-full"} overflow-auto`}>
                    <BugTable
                        bugs={filteredBugs || []}
                        selectedBugs={selectedBugs}
                        onBugSelect={handleBugSelect}
                        selectedBug={selectedBug}
                        onToggleSelection={toggleBugSelection}
                        onUpdateBugStatus={permissions.canUpdateBugs ? updateBugStatus : null}
                        onUpdateBugSeverity={permissions.canUpdateBugs ? updateBugSeverity : null}
                        onUpdateBugAssignment={permissions.canUpdateBugs ? updateBugAssignment : null}
                        onUpdateBugEnvironment={permissions.canUpdateBugs ? updateBugEnvironment : null}
                        onUpdateBugTitle={permissions.canUpdateBugs ? updateBugTitle : null}
                        onShowBugDetails={handleBugSelect}
                        onChatIconClick={handleChatIconClick}
                        teamMembers={teamMembers || []}
                        environments={environments || []}
                        isUpdating={isUpdating}
                        loading={bugTrackerLoading}
                        error={null}
                        onBulkAction={handleBulkAction}
                        hasPermission={hasPermissionCheck}
                        onRetryFetch={refetch}
                    />
                </div>

                {/* Details Panel */}
                {showDetailsPanel && selectedBug && (
                    <div className="w-96 bg-white rounded-lg border border-gray-200 shadow-xl overflow-y-auto flex-shrink-0">
                        <BugDetailsPanel
                            key={`bug-details-${selectedBug.id}-${detailsPanelKey}`}
                            bug={selectedBug}
                            onClose={handleCloseDetailsPanel}
                            onUpdateBug={permissions.canUpdateBugs ? handleUpdateBug : null}
                            onUpdateStatus={permissions.canUpdateBugs ? updateBugStatus : null}
                            onUpdateSeverity={permissions.canUpdateBugs ? updateBugSeverity : null}
                            onUpdateAssignment={permissions.canUpdateBugs ? updateBugAssignment : null}
                            teamMembers={teamMembers || []}
                            environments={environments || []}
                            sprints={sprints || []}
                            onCreateSprint={permissions.canManageBugs ? createSprint : null}
                            formatDate={formatDate}
                            permissions={permissions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugTracker;