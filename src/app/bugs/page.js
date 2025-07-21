'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, useAppEntityData } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import PageLayout from '@/components/layout/PageLayout';
import BugTable from '@/components/bug-report/BugTable';
import BugReportButton from '@/components/modals/BugReportButton';
import BugDetailsModal from '@/components/modals/BugDetailsModal';
import BugFilters from '@/components/bug-report/BugFilters';
import { FileText, Download } from 'lucide-react';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import firestoreService from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';

const BugTrackerPage = () => {
    const { user, userCapabilities, isAuthenticated, isLoading: appLoading } = useApp();
    const { activeSuite, isLoading: suiteLoading } = useSuite();
    const { bugs, testCases, relationships, isLoadingEntities } = useAppEntityData();
    const router = useRouter();
    const [filteredBugs, setFilteredBugs] = useState([]);
    const [groupBy, setGroupBy] = useState('none');
    const [subGroupBy, setSubGroupBy] = useState('none');
    const [viewMode, setViewMode] = useState('table');
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all',
        severity: 'all',
        category: 'all',
        assignedTo: 'all',
        sprint: 'all',
        dueDate: 'all',
    });
    const [fetchError, setFetchError] = useState(null);

    const addNotification = useCallback((notification) => {
        toast[notification.type](notification.title, {
            description: notification.message,
            duration: notification.persistent ? 0 : 5000,
        });
    }, []);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        addNotification({
            type: 'error',
            title: 'Error',
            message: `Failed to ${context}: ${error.message}`,
            persistent: true,
        });
        setFetchError(error.message);
    }, [addNotification]);

    const getOrgId = useCallback(() => {
        return activeSuite?.org_id || user?.org_id || null;
    }, [activeSuite, user]);

    const getAccountType = useCallback(() => {
        return activeSuite?.account_type || user?.account_type || 'individual';
    }, [activeSuite, user]);

    const bugToTestCases = useCallback(() => {
        const bugMap = {};
        Object.entries(relationships.testCaseToBugs || {}).forEach(([testCaseId, bugIds]) => {
            bugIds.forEach((bugId) => {
                if (!bugMap[bugId]) bugMap[bugId] = [];
                bugMap[bugId].push(testCaseId);
            });
        });
        return bugMap;
    }, [relationships.testCaseToBugs]);

    const applyFilters = useCallback(() => {
        if (!bugs || !Array.isArray(bugs)) {
            console.warn('No bugs data available to filter');
            setFilteredBugs([]);
            return;
        }

        let filtered = [...bugs];

        if (filters.searchTerm) {
            filtered = filtered.filter(
                (bug) =>
                    (bug.title?.toLowerCase()?.includes(filters.searchTerm.toLowerCase()) || false) ||
                    (bug.description?.toLowerCase()?.includes(filters.searchTerm.toLowerCase()) || false)
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter((bug) => bug.status === filters.status);
        }

        if (filters.severity !== 'all') {
            filtered = filtered.filter((bug) => bug.severity === filters.severity);
        }

        if (filters.category !== 'all') {
            filtered = filtered.filter((bug) => bug.category === filters.category);
        }

        if (filters.assignedTo !== 'all') {
            filtered = filtered.filter((bug) => bug.assigned_to === filters.assignedTo);
        }

        if (filters.sprint !== 'all') {
            filtered = filtered.filter((bug) => bug.sprint === filters.sprint);
        }

        if (filters.dueDate !== 'all') {
            filtered = filtered.filter((bug) => {
                if (!bug.due_date) return filters.dueDate === 'no-due-date';
                const due = new Date(bug.due_date instanceof Timestamp ? bug.due_date.toDate() : bug.due_date);
                const today = new Date();
                if (filters.dueDate === 'overdue') return due < today;
                if (filters.dueDate === 'today') {
                    return (
                        due.getDate() === today.getDate() &&
                        due.getMonth() === today.getMonth() &&
                        due.getFullYear() === today.getFullYear()
                    );
                }
                if (filters.dueDate === 'this-week') {
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    const weekEnd = new Date(today.setDate(today.getDate() + 6));
                    return due >= weekStart && due <= weekEnd;
                }
                return true;
            });
        }

        console.log('Filtered bugs:', filtered);
        setFilteredBugs(filtered);
    }, [bugs, filters]);

    useEffect(() => {
        console.log('Bugs data:', bugs);
        console.log('Active suite:', activeSuite);
        console.log('User:', user);
        console.log('Is authenticated:', isAuthenticated);
        console.log('User capabilities:', userCapabilities);
        applyFilters();
    }, [bugs, filters, activeSuite, user, isAuthenticated, userCapabilities, applyFilters]);

    const fetchBugs = useCallback(async () => {
        if (!user || !activeSuite) return;
        try {
            const orgId = getOrgId();
            const accountType = getAccountType();
            let bugsCollectionPath;
            if (accountType === 'individual') {
                bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
            } else {
                bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
            }
            console.log('Fetching bugs from:', bugsCollectionPath);
            const bugsData = await firestoreService.getDocuments(bugsCollectionPath);
            console.log('Fetched bugs:', bugsData);
            // Update state or context if necessary, assuming useAppEntityData manages this
        } catch (error) {
            handleError(error, 'fetch bugs');
        }
    }, [user, activeSuite, getOrgId, getAccountType, handleError]);

    useEffect(() => {
        if (isAuthenticated && user && activeSuite && !bugs.length && !isLoadingEntities) {
            fetchBugs();
        }
    }, [isAuthenticated, user, activeSuite, bugs, isLoadingEntities, fetchBugs]);

    const toggleBugSelection = useCallback(
        (id, checked) => {
            if (!userCapabilities.canViewBugs) {
                toast.error("You don't have permission to select bugs");
                return;
            }
            setSelectedBugs((prev) => {
                const newSelection = checked
                    ? [...new Set([...prev, id])]
                    : prev.filter((selectedId) => selectedId !== id);
                toast.info(`${newSelection.length} bug${newSelection.length > 1 ? 's' : ''} selected`);
                return newSelection;
            });
        },
        [userCapabilities]
    );

    const handleBulkAction = useCallback(
        async (action, ids) => {
            if (!userCapabilities.canUpdateBugs && action !== 'delete') {
                toast.error("You don't have permission to update bugs");
                return;
            }
            if (!userCapabilities.canDeleteBugs && action === 'delete') {
                toast.error("You don't have permission to delete bugs");
                return;
            }
            if (!ids || ids.length === 0) {
                toast.error("No bugs selected");
                return;
            }
            try {
                const orgId = getOrgId();
                const accountType = getAccountType();
                let bugsCollectionPath;
                if (accountType === 'individual') {
                    bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
                } else {
                    bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
                }
                if (action === 'delete') {
                    if (!window.confirm(`Are you sure you want to delete ${ids.length} bug${ids.length > 1 ? 's' : ''}?`)) {
                        return;
                    }
                    await Promise.all(ids.map((id) => firestoreService.deleteDocument(bugsCollectionPath, id)));
                } else {
                    await Promise.all(
                        ids.map((id) =>
                            firestoreService.updateDocument(bugsCollectionPath, id, {
                                status: action === 'open' ? 'Open' : 'Closed',
                                updated_at: Timestamp.fromDate(new Date()),
                            })
                        )
                    );
                }
                setSelectedBugs([]);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `${ids.length} bug${ids.length > 1 ? 's' : ''} ${action}d successfully`,
                });
            } catch (error) {
                handleError(error, `bulk ${action}`);
            }
        },
        [userCapabilities, getOrgId, getAccountType, user.uid, activeSuite?.suite_id, addNotification, handleError]
    );

    const handleCreateBug = useCallback(
        async (bugData) => {
            if (!userCapabilities.canCreateBugs) {
                toast.error("You don't have permission to create bugs");
                return;
            }
            try {
                const orgId = getOrgId();
                const accountType = getAccountType();
                let bugsCollectionPath;
                if (accountType === 'individual') {
                    bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
                } else {
                    bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
                }
                const newBug = {
                    ...bugData,
                    created_at: Timestamp.fromDate(new Date()),
                    suite_id: activeSuite.suite_id,
                    status: 'New',
                    severity: bugData.severity || 'Low',
                    priority: bugData.priority || 'Low',
                    environment: bugData.environment || 'Production',
                    created_by: user?.email || 'anonymous',
                };
                const docRef = await firestoreService.createDocument(bugsCollectionPath, newBug);
                addNotification({
                    type: 'success',
                    title: 'Bug Created',
                    message: `Bug #${docRef.id.slice(-6)} created successfully`,
                });
                fetchBugs(); // Refresh bugs after creation
            } catch (error) {
                handleError(error, 'create bug');
            }
        },
        [userCapabilities, getOrgId, getAccountType, activeSuite?.suite_id, user?.email, user.uid, addNotification, handleError, fetchBugs]
    );

    const handleEditBug = useCallback((bug) => {
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, []);

    const handleViewBug = useCallback((bug) => {
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, []);

    const handleSaveBug = useCallback(
        async (bugData) => {
            try {
                const orgId = getOrgId();
                const accountType = getAccountType();
                let bugsCollectionPath;
                if (accountType === 'individual') {
                    bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
                } else {
                    bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
                }
                const timestamp = Timestamp.fromDate(new Date());
                if (selectedBug) {
                    await firestoreService.updateDocument(bugsCollectionPath, selectedBug.id, {
                        ...bugData,
                        updated_at: timestamp,
                    });
                    addNotification({
                        type: 'success',
                        title: 'Success',
                        message: 'Bug updated successfully',
                    });
                    fetchBugs(); // Refresh bugs after update
                }
                setIsDetailsModalOpen(false);
            } catch (error) {
                handleError(error, 'save bug');
            }
        },
        [user, activeSuite, getOrgId, getAccountType, selectedBug, addNotification, handleError, fetchBugs]
    );

    const handleLinkTestCase = useCallback(
        async (bugId, newTestCaseIds) => {
            try {
                const orgId = getOrgId();
                const accountType = getAccountType();
                let relationshipsCollectionPath;
                if (accountType === 'individual') {
                    relationshipsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/relationships`;
                } else {
                    relationshipsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/relationships`;
                }
                const existingTestCases = relationships.testCaseToBugs?.[bugId] || [];
                const toAdd = newTestCaseIds.filter((id) => !existingTestCases.includes(id));
                const toRemove = existingTestCases.filter((id) => !newTestCaseIds.includes(id));
                const promises = [];

                toAdd.forEach((testCaseId) => {
                    promises.push(
                        firestoreService.createDocument(relationshipsCollectionPath, {
                            suiteId: activeSuite.suite_id,
                            sourceType: 'bug',
                            sourceId: bugId,
                            targetType: 'testCase',
                            targetId: testCaseId,
                            created_at: Timestamp.fromDate(new Date()),
                            created_by: user?.email || 'anonymous',
                        })
                    );
                });

                toRemove.forEach((testCaseId) => {
                    promises.push(
                        firestoreService.deleteDocumentByQuery(relationshipsCollectionPath, [
                            where('suiteId', '==', activeSuite.suite_id),
                            where('sourceType', '==', 'bug'),
                            where('sourceId', '==', bugId),
                            where('targetType', '==', 'testCase'),
                            where('targetId', '==', testCaseId),
                        ])
                    );
                });

                await Promise.all(promises);
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Linked ${newTestCaseIds.length} test case${newTestCaseIds.length > 1 ? 's' : ''} to bug`,
                });
                fetchBugs(); // Refresh bugs after linking
            } catch (error) {
                handleError(error, 'link test cases');
            }
        },
        [user, activeSuite, getOrgId, getAccountType, relationships.testCaseToBugs, addNotification, handleError, fetchBugs]
    );

    const handleExportBugs = useCallback(async () => {
        try {
            // Implement export logic (e.g., CSV export)
            addNotification({
                type: 'success',
                title: 'Bugs Exported',
                message: 'Bugs exported successfully',
            });
        } catch (error) {
            handleError(error, 'export bugs');
        }
    }, [addNotification, handleError]);

    const handleGenerateReport = useCallback(() => {
        addNotification({
            type: 'info',
            title: 'Report Generation',
            message: 'Report generation is not yet implemented',
        });
    }, [addNotification]);

    const teamMembers = Array.from(new Set(bugs.map((bug) => bug.assigned_to).filter(Boolean))).map((email) => ({
        name: email,
    }));

    const sprints = Array.from(new Set(bugs.map((bug) => bug.sprint).filter(Boolean))).map((sprint) => ({
        id: sprint,
        name: sprint,
    }));

    if (appLoading || isLoadingEntities || suiteLoading) {
        return (
            <PageLayout requiresTestSuite={true}>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                </div>
            </PageLayout>
        );
    }

    if (!isAuthenticated || !user || !activeSuite) {
        addNotification({
            type: 'error',
            title: 'Access Denied',
            message: 'Please log in and select a test suite to access the bug tracker.',
        });
        router.push('/login');
        return null;
    }

    if (!userCapabilities.canViewBugs) {
        addNotification({
            type: 'error',
            title: 'Subscription Required',
            message: 'Your subscription does not allow access to the bug tracker. Please upgrade your plan.',
        });
        router.push('/pricing');
        return null;
    }

    return (
        <PageLayout requiresTestSuite={true}>
            <div className="space-y-6">
                {fetchError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{fetchError}</span>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <BugAntIcon className="h-6 w-6 mr-2" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bug Tracker</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                            onClick={handleExportBugs}
                            disabled={!userCapabilities.canUpdateBugs}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                            onClick={handleGenerateReport}
                            disabled={!userCapabilities.canUpdateBugs}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Generate Report</span>
                        </button>
                        <BugReportButton onCreateBug={handleCreateBug} />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <BugFilters
                        filters={filters}
                        setFilters={setFilters}
                        teamMembers={teamMembers}
                        sprints={sprints}
                        isExpanded={isFiltersExpanded}
                        setIsExpanded={setIsFiltersExpanded}
                        groupBy={groupBy}
                        setGroupBy={setGroupBy}
                        subGroupBy={subGroupBy}
                        setSubGroupBy={setSubGroupBy}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                </div>
                {filteredBugs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No bugs found. Try adjusting the filters or create a new bug.</p>
                    </div>
                ) : (
                    <BugTable
                        bugs={filteredBugs}
                        testCases={testCases}
                        relationships={bugToTestCases()}
                        selectedBugs={selectedBugs}
                        onToggleSelection={toggleBugSelection}
                        onBulkAction={handleBulkAction}
                        onView={handleViewBug}
                        onEdit={handleEditBug}
                        onDuplicate={async (bug) => {
                            try {
                                const orgId = getOrgId();
                                const accountType = getAccountType();
                                let bugsCollectionPath;
                                if (accountType === 'individual') {
                                    bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
                                } else {
                                    bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
                                }
                                const timestamp = Timestamp.fromDate(new Date());
                                const duplicatedBug = {
                                    ...bug,
                                    title: `${bug.title} (Copy)`,
                                    created_at: timestamp,
                                    updated_at: timestamp,
                                    suite_id: activeSuite.suite_id,
                                    created_by: user?.email || 'anonymous',
                                };
                                await firestoreService.createDocument(bugsCollectionPath, duplicatedBug);
                                addNotification({
                                    type: 'success',
                                    title: 'Success',
                                    message: 'Bug duplicated successfully',
                                });
                                fetchBugs(); // Refresh bugs after duplication
                            } catch (error) {
                                handleError(error, 'duplicate bug');
                            }
                        }}
                        onDelete={async (id) => {
                            try {
                                const orgId = getOrgId();
                                const accountType = getAccountType();
                                let bugsCollectionPath;
                                if (accountType === 'individual') {
                                    bugsCollectionPath = `individualAccounts/${user.uid}/testSuites/${activeSuite.suite_id}/bugs`;
                                } else {
                                    bugsCollectionPath = `organizations/${orgId}/testSuites/${activeSuite.suite_id}/bugs`;
                                }
                                await firestoreService.deleteDocument(bugsCollectionPath, id);
                                addNotification({
                                    type: 'success',
                                    title: 'Success',
                                    message: 'Bug deleted successfully',
                                });
                                fetchBugs(); // Refresh bugs after deletion
                            } catch (error) {
                                handleError(error, 'delete bug');
                            }
                        }}
                        onLinkTestCase={handleLinkTestCase}
                    />
                )}
                {isDetailsModalOpen && (
                    <BugDetailsModal
                        bug={selectedBug}
                        onClose={() => setIsDetailsModalOpen(false)}
                        onSave={handleSaveBug}
                    />
                )}
            </div>
        </PageLayout>
    );
};

export default BugTrackerPage;