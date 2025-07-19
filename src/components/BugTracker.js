'use client';

import { useState } from 'react';
import BugTable from './bug-report/BugTable';
import BugDetailsModal from './modals/BugDetailsModal';
import BugFilters from './bug-report/BugFilters';
import { useAppNotifications } from '@/contexts/AppProvider';
import firestoreService from '@/services/firestoreService';
import { where } from 'firebase/firestore';


const BugTracker = ({
    bugs = [],
    filteredBugs = [],
    testCases = [],
    relationships = {},
    selectedBugs = [],
    onToggleSelection,
    onBulkAction,
    showFilters,
    onCreateBug,
    teamMembers = [],
    sprints = [],
    environments = [],
    filters,
    setFilters,
    activeSuite
}) => {
    const { addNotification } = useAppNotifications();
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);

    const handleBugSelect = (bug) => {
        setSelectedBug(bug);
        setShowDetailsModal(true);
        addNotification({
            type: 'success',
            title: 'Bug Details',
            message: `Opening details for Bug #${bug.id.slice(-6)}`
        });
    };

    const handleChatIconClick = (bug, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!bug || !bug.id) {
            console.error('Invalid bug object passed to chat icon click');
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Invalid bug data'
            });
            return;
        }
        handleBugSelect(bug);
    };

    const updateBug = async (bugId, updates) => {
        try {
            await firestoreService.updateDocument(
                `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/bugs`,
                bugId,
                updates
            );
            addNotification({
                type: 'success',
                title: 'Bug Updated',
                message: `Bug #${bugId.slice(-6)} updated successfully`
            });
        } catch (error) {
            console.error('Failed to update bug:', error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to update bug: ${error.message}`
            });
        }
    };

    const handleLinkTestCase = async (bugId, newTestCases) => {
        try {
            const existingTestCases = relationships[bugId] || [];
            const toAdd = newTestCases.filter(id => !existingTestCases.includes(id));
            const toRemove = existingTestCases.filter(id => !newTestCases.includes(id));

            const promises = [];
            toAdd.forEach(testCaseId => {
                promises.push(
                    firestoreService.createDocument(
                        `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/relationships`,
                        {
                            suiteId: activeSuite.suite_id,
                            sourceType: 'bug',
                            sourceId: bugId,
                            targetType: 'testCase',
                            targetId: testCaseId,
                            created_at: new Date()
                        }
                    )
                );
            });
            toRemove.forEach(testCaseId => {
                promises.push(
                    firestoreService.deleteDocumentByQuery(
                        `organizations/${activeSuite.org_id}/testSuites/${activeSuite.suite_id}/relationships`,
                        [
                            where('suiteId', '==', activeSuite.suite_id),
                            where('sourceType', '==', 'bug'),
                            where('sourceId', '==', bugId),
                            where('targetType', '==', 'testCase'),
                            where('targetId', '==', testCaseId)
                        ]
                    )
                );
            });

            await Promise.all(promises);
            addNotification({
                type: 'success',
                title: 'Test Cases Linked',
                message: `Linked ${newTestCases.length} test case${newTestCases.length > 1 ? 's' : ''} to bug`
            });
        } catch (error) {
            console.error('Failed to link test cases:', error);
            addNotification({
                type: 'error',
                title: 'Error',
                message: `Failed to link test cases: ${error.message}`
            });
        }
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {showFilters && (
                <div className="bg-white border-b border-gray-200 flex-shrink-0">
                    <BugFilters
                        filters={filters}
                        setFilters={setFilters}
                        teamMembers={teamMembers}
                        sprints={sprints}
                        environments={environments}
                        bugs={bugs}
                    />
                </div>
            )}
            <div className="flex-1 flex gap-6 overflow-hidden p-6">
                <div className="w-full overflow-auto">
                    <BugTable
                        bugs={filteredBugs}
                        testCases={testCases}
                        relationships={relationships}
                        selectedBugs={selectedBugs}
                        onToggleSelection={onToggleSelection}
                        onShowBugDetails={handleBugSelect}
                        onCreateBug={onCreateBug}
                        onChatIconClick={handleChatIconClick}
                        onBulkAction={onBulkAction}
                        onUpdateBug={updateBug}
                        onLinkTestCase={handleLinkTestCase}
                        teamMembers={teamMembers}
                        environments={environments}
                        loading={false}
                        error={null}
                    />
                </div>
                {showDetailsModal && selectedBug && (
                    <BugDetailsModal
                        bug={selectedBug}
                        teamMembers={teamMembers}
                        onUpdateBug={updateBug}
                        onClose={() => setShowDetailsModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default BugTracker;