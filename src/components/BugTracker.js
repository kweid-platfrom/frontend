// src/components/BugTracker.js
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useBugTracker } from '../hooks/useBugTracker';
import BugTable from './bug-report/BugTable';
import BugDetailsPanel from './bug-report/BugDetailsPanel';
import BugFilters from './bug-report/BugFilters';
import firestoreService from '../services/firestoreService';

const BugTracker = ({ showFilters, onCreateBug, bugs, filteredBugs }) => {
    const { user: resolvedUser, userCapabilities, isAuthenticated, isLoading: appLoading, addNotification } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const { teamMembers, sprints, environments, filters, setFilters, isUpdating, error, loading, updateBugStatus, updateBugSeverity, updateBugAssignment, updateBugEnvironment, updateBug, updateBugTitle, createSprint, formatDate, refetchBugs } = useBugTracker({
        enabled: isAuthenticated && !!resolvedUser?.uid && !!activeSuite?.suite_id && !appLoading && !suiteLoading,
        suite: activeSuite,
        user: resolvedUser
    });
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBugSelect = (bug) => {
        if (!userCapabilities.canViewBugs) {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You don’t have permission to view bug details'
            });
            return;
        }
        setSelectedBug(bug);
        setShowDetailsPanel(true);
    };

    const toggleBugSelection = (bugId) => {
        if (!userCapabilities.canViewBugs) {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You don’t have permission to select bugs'
            });
            return;
        }
        setSelectedBugs(prev => prev.includes(bugId) ? prev.filter(id => id !== bugId) : [...prev, bugId]);
    };

    const handleBulkAction = async (action, ids) => {
        if (!userCapabilities.canUpdateBugs && action !== 'delete') {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You don’t have permission to update bugs'
            });
            return;
        }
        if (!userCapabilities.canDeleteBugs && action === 'delete') {
            addNotification({
                type: 'error',
                title: 'Permission Denied',
                message: 'You don’t have permission to delete bugs'
            });
            return;
        }

        try {
            switch (action) {
                case 'reopen':
                    await Promise.all(ids.map(id => updateBugStatus(id, 'open')));
                    addNotification({
                        type: 'success',
                        title: 'Bugs Reopened',
                        message: `Successfully reopened ${ids.length} bugs`
                    });
                    break;
                case 'close':
                    await Promise.all(ids.map(id => updateBugStatus(id, 'closed')));
                    addNotification({
                        type: 'success',
                        title: 'Bugs Closed',
                        message: `Successfully closed ${ids.length} bugs`
                    });
                    break;
                case 'delete':
                    const bugsCollectionPath = activeSuite.is_personal
                        ? `individualAccounts/${resolvedUser.uid}/testSuites/${activeSuite.suite_id}/bugs`
                        : `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/bugs`;
                    await Promise.all(ids.map(id => firestoreService.deleteDocument(`${bugsCollectionPath}/${id}`)));
                    addNotification({
                        type: 'success',
                        title: 'Bugs Deleted',
                        message: `Successfully deleted ${ids.length} bugs`
                    });
                    break;
                default:
                    addNotification({
                        type: 'error',
                        title: 'Invalid Action',
                        message: 'Unknown bulk action'
                    });
            }
            setSelectedBugs([]);
        } catch (error) {
            console.error(`Bulk ${action} failed:`, error);
            addNotification({
                type: 'error',
                title: `Bulk ${action} Failed`,
                message: `Failed to ${action} bugs: ${error.message}`
            });
        }
    };

    if (!mounted || !isAuthenticated || !resolvedUser || !activeSuite) {
        return null;
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
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
            <div className="flex-1 flex gap-6 overflow-hidden p-6">
                <div className={`${showDetailsPanel ? 'flex-1' : 'w-full'} overflow-auto`}>
                    <BugTable
                        bugs={filteredBugs || []}
                        selectedBugs={selectedBugs}
                        onBugSelect={userCapabilities.canViewBugs ? handleBugSelect : null}
                        selectedBug={selectedBug}
                        onToggleSelection={userCapabilities.canViewBugs ? toggleBugSelection : null}
                        onUpdateBugStatus={userCapabilities.canUpdateBugs ? updateBugStatus : null}
                        onUpdateBugSeverity={userCapabilities.canUpdateBugs ? updateBugSeverity : null}
                        onUpdateBugAssignment={userCapabilities.canUpdateBugs ? updateBugAssignment : null}
                        onUpdateBugEnvironment={userCapabilities.canUpdateBugs ? updateBugEnvironment : null}
                        onUpdateBugTitle={userCapabilities.canUpdateBugs ? updateBugTitle : null}
                        onShowBugDetails={userCapabilities.canViewBugs ? handleBugSelect : null}
                        onCreateBug={userCapabilities.canCreateBugs ? onCreateBug : null}
                        onRetryFetch={refetchBugs}
                        teamMembers={teamMembers || []}
                        environments={environments || []}
                        isUpdating={isUpdating}
                        loading={loading}
                        error={error}
                        onBulkAction={(userCapabilities.canUpdateBugs || userCapabilities.canDeleteBugs) ? handleBulkAction : null}
                    />
                </div>
                {showDetailsPanel && selectedBug && userCapabilities.canViewBugs && (
                    <div className="w-96 bg-white rounded-lg border border-gray-200 shadow-xl overflow-y-auto flex-shrink-0">
                        <BugDetailsPanel
                            bug={selectedBug}
                            onClose={() => setShowDetailsPanel(false)}
                            onUpdateBug={userCapabilities.canUpdateBugs ? updateBug : null}
                            teamMembers={teamMembers || []}
                            environments={environments || []}
                            sprints={sprints || []}
                            onCreateSprint={userCapabilities.canManageBugs ? createSprint : null}
                            formatDate={formatDate}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugTracker;