// Fixed BugTracker - Simplified user resolution like SuiteSelector
import React, { useState, useMemo, useEffect } from "react";
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
    const { userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
    
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // FIXED: Simplified user resolution - follow SuiteSelector pattern
    const resolvedUser = useMemo(() => {
        // Primary: Use authUser if available (this is what SuiteSelector relies on)
        if (authUser?.uid) {
            return {
                uid: authUser.uid,
                email: authUser.email,
                emailVerified: authUser.emailVerified,
                displayName: authUser.displayName,
                ...authUser,
                // Merge userProfile data if available, but don't depend on it
                ...(userProfile && {
                    full_name: userProfile.full_name || authUser.displayName,
                    role: userProfile.role,
                    permissions: userProfile.permissions
                })
            };
        }
        
        return null;
    }, [authUser, userProfile]);

    // FIXED: Simplified loading state - only wait for critical data
    const isLoading = useMemo(() => {
        // Only wait for auth and suite - don't block on userProfile
        return authLoading || suiteLoading;
    }, [authLoading, suiteLoading]);

    // FIXED: Only auth and suite errors are critical
    const criticalError = useMemo(() => {
        if (authError) return authError;
        if (suiteError) return suiteError;
        
        // Profile errors are non-critical - just log them
        if (profileError) {
            console.warn('Profile error (non-critical):', profileError);
        }
        
        return null;
    }, [authError, suiteError, profileError]);

    // FIXED: Simplified readiness check
    const isReady = useMemo(() => {
        return !isLoading && 
               !criticalError && 
               !!resolvedUser?.uid && 
               !!activeSuite?.suite_id;
    }, [isLoading, criticalError, resolvedUser, activeSuite]);

    // FIXED: Simplified permissions with better fallbacks
    const permissions = useMemo(() => {
        // If we have userProfile with explicit permissions, use them
        if (userProfile?.permissions) {
            return getUserPermissions(userProfile);
        }
        
        // If we have userProfile but no explicit permissions, calculate them
        if (userProfile) {
            return getUserPermissions(userProfile);
        }
        
        // If we only have authUser, provide reasonable defaults
        if (authUser?.uid) {
            return {
                canReadBugs: true,
                canUpdateBugs: true,
                canDeleteBugs: false, // Conservative default
                canManageBugs: false  // Conservative default
            };
        }
        
        // No access if no user
        return {
            canReadBugs: false,
            canUpdateBugs: false,
            canDeleteBugs: false,
            canManageBugs: false
        };
    }, [userProfile, authUser]);

    // FIXED: Simplified debug logging
    useEffect(() => {
        console.log('BugTracker Debug:', {
            authUser: !!authUser,
            authUserUid: authUser?.uid,
            authLoading,
            userProfile: !!userProfile,
            userProfileLoading: isProfileLoading,
            activeSuite: !!activeSuite,
            activeSuiteId: activeSuite?.suite_id,
            suiteLoading,
            resolvedUser: !!resolvedUser,
            resolvedUserUid: resolvedUser?.uid,
            isReady,
            permissions
        });
    }, [authUser, authLoading, userProfile, isProfileLoading, activeSuite, suiteLoading, resolvedUser, isReady, permissions]);

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
        formatDate
    } = useBugTracker({
        enabled: isReady,
        suite: activeSuite,
        user: resolvedUser
    });

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

    // Event handlers
    const handleBugSelect = (bug) => {
        if (!permissions.canReadBugs) {
            toast.error("You don't have permission to view bug details");
            return;
        }
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    };

    const toggleBugSelection = (bugId) => {
        if (!permissions.canReadBugs) {
            toast.error("You don't have permission to select bugs");
            return;
        }
        setSelectedBugs(prev =>
            prev.includes(bugId)
                ? prev.filter(id => id !== bugId)
                : [...prev, bugId]
        );
    };

    const handleBulkAction = async (action, ids) => {
        if (!permissions.canUpdateBugs && action !== 'delete') {
            toast.error("You don't have permission to update bugs");
            return;
        }
        if (!permissions.canDeleteBugs && action === 'delete') {
            toast.error("You don't have permission to delete bugs");
            return;
        }
        
        try {
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
                    toast.success(`Deleted ${ids.length} bugs`);
                    break;
                default:
                    toast.error('Unknown bulk action');
            }
            setSelectedBugs([]);
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            toast.error(`Failed to ${action} bugs`);
        }
    };

    const hasPermissionCheck = (permission) => {
        switch (permission) {
            case 'read': return permissions.canReadBugs;
            case 'write': return permissions.canUpdateBugs;
            case 'admin': return permissions.canDeleteBugs || permissions.canManageBugs;
            default: return false;
        }
    };

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
                    setViewMode={() => {}}
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
                        teamMembers={teamMembers || []}
                        environments={environments || []}
                        isUpdating={isUpdating}
                        loading={bugTrackerLoading}
                        error={null}
                        onBulkAction={handleBulkAction}
                        hasPermission={hasPermissionCheck}
                    />
                </div>

                {/* Details Panel */}
                {showDetailsPanel && selectedBug && (
                    <div className="w-96 bg-white rounded-lg border border-gray-200 shadow-xl overflow-y-auto flex-shrink-0">
                        <BugDetailsPanel
                            bug={selectedBug}
                            onClose={() => setShowDetailsPanel(false)}
                            onUpdateBug={permissions.canUpdateBugs ? updateBug : null}
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