'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useBugTracker } from '../hooks/useBugTracker';
import BugTable from './bug-report/BugTable';
import BugDetailsModal from './modals/BugDetailsModal';
import BugFilters from './bug-report/BugFilters';
import firestoreService from '../services/firestoreService';

const BugTracker = ({ showFilters, onCreateBug, bugs, filteredBugs }) => {
    const { user: resolvedUser, isAuthenticated, isLoading: appLoading, addNotification } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const { teamMembers, sprints, environments, filters, setFilters, isUpdating, error, loading, updateBugStatus, updateBugSeverity, updateBugAssignment, updateBugEnvironment, updateBugFrequency, updateBug, updateBugTitle, refetchBugs } = useBugTracker({
        enabled: isAuthenticated && !!resolvedUser?.uid && !!activeSuite?.suite_id && !appLoading && !suiteLoading,
        suite: activeSuite,
        user: resolvedUser
    });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleBugSelect = (bug) => {
        setSelectedBug(bug);
        setShowDetailsModal(true);
    };

    const handleChatIconClick = (bug, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!bug || !bug.id) {
            console.error('Invalid bug object passed to chat icon click');
            return;
        }
        setSelectedBug(bug);
        setShowDetailsModal(true);
        addNotification({
            type: 'success',
            title: 'Bug Details',
            message: `Opening details for Bug #${bug.id.slice(-6)}`
        });
    };

    const toggleBugSelection = (bugId) => {
        setSelectedBugs(prev => prev.includes(bugId) ? prev.filter(id => id !== bugId) : [...prev, bugId]);
    };

    const handleBulkAction = async (action, ids) => {
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
                <div className="w-full overflow-auto">
                    <BugTable
                        bugs={filteredBugs || []}
                        selectedBugs={selectedBugs}
                        onBugSelect={handleBugSelect}
                        selectedBug={selectedBug}
                        onToggleSelection={toggleBugSelection}
                        onUpdateBugStatus={updateBugStatus}
                        onUpdateBugSeverity={updateBugSeverity}
                        onUpdateBugAssignment={updateBugAssignment}
                        onUpdateBugEnvironment={updateBugEnvironment}
                        onUpdateBugFrequency={updateBugFrequency}
                        onUpdateBugTitle={updateBugTitle}
                        onShowBugDetails={handleBugSelect}
                        onCreateBug={onCreateBug}
                        onRetryFetch={refetchBugs}
                        teamMembers={teamMembers || []}
                        environments={environments || []}
                        isUpdating={isUpdating}
                        loading={loading}
                        error={error}
                        onBulkAction={handleBulkAction}
                        onChatIconClick={handleChatIconClick}
                    />
                </div>
                {showDetailsModal && selectedBug && (
                    <BugDetailsModal
                        bug={selectedBug}
                        teamMembers={teamMembers || []}
                        onUpdateBug={updateBug}
                        onClose={() => setShowDetailsModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default BugTracker;