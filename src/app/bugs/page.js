/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BugTable from '@/components/bug-report/BugTable';
import BugList from '@/components/bug-report/BugList';
import BugReportButton from '@/components/modals/BugReportButton';
import BugFilterBar from '@/components/bug-report/BugFilterBar';
import BugDetailsModal from '@/components/modals/BugDetailsModal';
import { useBugs } from '@/hooks/useBugs';
import { useUI } from '@/hooks/useUI';

const Bugs = () => {
    const bugsHook = useBugs();
    const uiHook = useUI();

    useEffect(() => {
        console.log('🔍 Bugs Hook Debug:', {
            hasUpdateBug: !!bugsHook.updateBug,
            updateBugType: typeof bugsHook.updateBug,
            hasCreateBug: !!bugsHook.createBug,
            hasDeleteBug: !!bugsHook.deleteBug,
            bugsCount: bugsHook.bugs?.length || 0,
            loading: bugsHook.loading,
            bugsLocked: bugsHook.bugsLocked,
            activeSuiteId: bugsHook.activeSuite?.id,
        });
    }, [bugsHook.updateBug, bugsHook.createBug, bugsHook.deleteBug, bugsHook.bugs?.length, bugsHook.loading, bugsHook.bugsLocked, bugsHook.activeSuite]);

    const [filteredBugs, setFilteredBugs] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [, setIsTraceabilityOpen] = useState(false);
    const [, setIsImportModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        severity: 'all',
        priority: 'all',
        assignee: 'all',
        tags: [],
        reporter: 'all',
        lastUpdated: 'all',
    });

    const applyFilters = useCallback((currentBugs, currentFilters) => {
        if (!Array.isArray(currentBugs)) return [];

        let filtered = [...currentBugs];

        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filtered = filtered.filter((bug) => {
                const searchableFields = [
                    bug.title?.toLowerCase() || '',
                    bug.description?.toLowerCase() || '',
                    bug.steps_to_reproduce?.toLowerCase() || '',
                    ...(bug.tags || []).map((tag) => tag.toLowerCase()),
                ];
                return searchableFields.some((field) => field.includes(searchTerm));
            });
        }

        if (currentFilters.status !== 'all') {
            filtered = filtered.filter((bug) => bug.status === currentFilters.status);
        }

        if (currentFilters.severity !== 'all') {
            filtered = filtered.filter((bug) => bug.severity === currentFilters.severity);
        }

        if (currentFilters.priority !== 'all') {
            filtered = filtered.filter((bug) => bug.priority === currentFilters.priority);
        }

        if (currentFilters.assignee !== 'all') {
            filtered = filtered.filter((bug) =>
                bug.assignee === currentFilters.assignee ||
                (!bug.assignee && currentFilters.assignee === '')
            );
        }

        if (currentFilters.reporter !== 'all') {
            filtered = filtered.filter((bug) =>
                bug.reporter === currentFilters.reporter ||
                (!bug.reporter && currentFilters.reporter === '')
            );
        }

        if (currentFilters.tags?.length > 0) {
            filtered = filtered.filter((bug) =>
                bug.tags && currentFilters.tags.every((tag) => bug.tags.includes(tag))
            );
        }

        if (currentFilters.lastUpdated !== 'all') {
            const now = new Date();
            filtered = filtered.filter((bug) => {
                const updatedAt = bug.updated_at instanceof Date ? bug.updated_at : new Date(bug.updated_at);
                if (isNaN(updatedAt.getTime())) return false;

                switch (currentFilters.lastUpdated) {
                    case 'today':
                        return updatedAt.toDateString() === now.toDateString();
                    case 'week':
                        return updatedAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month':
                        return updatedAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    case 'quarter':
                        return updatedAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, []);

    // FIXED: Better filter management to prevent bugs disappearing
    useEffect(() => {
        // Only apply filters if we have bugs data
        if (bugsHook.bugs && bugsHook.bugs.length >= 0) {
            const newFilteredBugs = applyFilters(bugsHook.bugs, filters);
            setFilteredBugs(newFilteredBugs);
        }
    }, [bugsHook.bugs, filters, applyFilters]);

    // FIXED: Reset filtered bugs when filters are cleared
    const handleFiltersChange = useCallback((newFilters) => {
        setFilters(newFilters);
        
        // Check if all filters are cleared (reset to default)
        const isFiltersCleared = 
            newFilters.search === '' &&
            newFilters.status === 'all' &&
            newFilters.severity === 'all' &&
            newFilters.priority === 'all' &&
            newFilters.assignee === 'all' &&
            newFilters.reporter === 'all' &&
            newFilters.lastUpdated === 'all' &&
            (!newFilters.tags || newFilters.tags.length === 0);
        
        // If filters are cleared, immediately reset to show all bugs
        if (isFiltersCleared && bugsHook.bugs) {
            setFilteredBugs([...bugsHook.bugs]);
        }
    }, [bugsHook.bugs]);

    const handleError = useCallback((error, context) => {
        console.error(`Error in ${context}:`, error);
        uiHook.addNotification?.({
            type: 'error',
            title: 'Error',
            message: `Failed to ${context}: ${error.message}`,
            persistent: true,
        });
    }, [uiHook.addNotification]);

    const handleUpdateBug = useCallback(async (bugId, updates) => {
        try {
            console.log('🔄 Updating bug:', { bugId, updates, suiteId: bugsHook.activeSuite?.id });
            
            if (!bugsHook.updateBug) {
                throw new Error('Update function not available');
            }

            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const result = await bugsHook.updateBug(bugId, {
                ...updates,
                updated_at: new Date(),
            });

            if (result.success) {
                console.log('✅ Bug updated successfully:', result);
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug updated successfully',
                });
            } else {
                throw new Error(result.error.message);
            }

            return result;
        } catch (error) {
            console.error('❌ Error updating bug:', error);
            handleError(error, 'update bug');
            throw error;
        }
    }, [bugsHook.updateBug, bugsHook.bugsLocked, bugsHook.activeSuite, uiHook.addNotification, handleError]);

    const handleSaveBug = useCallback(async (bugData) => {
        try {
            console.log('💾 Saving bug:', { title: bugData.title, isEdit: !!selectedBug });

            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();

            if (selectedBug) {
                await handleUpdateBug(selectedBug.id, {
                    ...bugData,
                    updated_at: timestamp,
                });
            } else {
                const result = await bugsHook.createBug({
                    ...bugData,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
                console.log('✅ Bug created:', result);
                uiHook.addNotification?.({
                    type: 'success',
                    title: 'Success',
                    message: 'Bug created successfully',
                });
            }

            setIsModalOpen(false);
            setSelectedBug(null);
        } catch (error) {
            console.error('❌ Error saving bug:', error);
            handleError(error, 'save bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.createBug, bugsHook.activeSuite, selectedBug, handleUpdateBug, uiHook.addNotification, handleError]);

    const handleLinkTestCase = useCallback(async (bugId, newTestCaseIds) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const existingTestCases = bugsHook.relationships?.bugToTestCases?.[bugId] || [];
            const toAdd = newTestCaseIds.filter((id) => !existingTestCases.includes(id));
            const toRemove = existingTestCases.filter((id) => !newTestCaseIds.includes(id));

            await Promise.all([
                ...toAdd.map((testCaseId) => bugsHook.linkTestCaseToBug?.(bugId, testCaseId)),
                ...toRemove.map((testCaseId) => bugsHook.unlinkTestCaseFromBug?.(bugId, testCaseId)),
            ]);

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `Linked ${newTestCaseIds.length} test case${newTestCaseIds.length > 1 ? 's' : ''} to bug`,
            });
        } catch (error) {
            handleError(error, 'link test cases');
        }
    }, [
        bugsHook.bugsLocked,
        bugsHook.linkTestCaseToBug,
        bugsHook.unlinkTestCaseFromBug,
        bugsHook.relationships,
        uiHook.addNotification,
        handleError
    ]);

    const handleViewBug = useCallback((bug) => {
        if (bugsHook.bugsLocked) {
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: 'Bugs are locked. Upgrade to access.',
            });
            return;
        }
        setSelectedBug(bug);
        setIsDetailsModalOpen(true);
    }, [bugsHook.bugsLocked, uiHook.addNotification]);

    const handleEditBug = useCallback((bug) => {
        if (bugsHook.bugsLocked) {
            uiHook.addNotification?.({
                type: 'error',
                title: 'Error',
                message: 'Bugs are locked. Upgrade to access.',
            });
            return;
        }
        setSelectedBug(bug);
        setIsModalOpen(true);
    }, [bugsHook.bugsLocked, uiHook.addNotification]);

    const handleDeleteBug = useCallback(async (id) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            await bugsHook.deleteBug(id);
            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Bug deleted successfully',
            });
        } catch (error) {
            handleError(error, 'delete bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.deleteBug, uiHook.addNotification, handleError]);

    const handleDuplicateBug = useCallback(async (bug) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            const timestamp = new Date();
            await bugsHook.createBug({
                ...bug,
                title: `${bug.title} (Copy)`,
                created_at: timestamp,
                updated_at: timestamp,
            });

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: 'Bug duplicated successfully',
            });
        } catch (error) {
            handleError(error, 'duplicate bug');
        }
    }, [bugsHook.bugsLocked, bugsHook.createBug, uiHook.addNotification, handleError]);

    const handleBulkAction = useCallback(async (action, selectedIds) => {
        try {
            if (bugsHook.bugsLocked) {
                throw new Error('Bugs are locked. Upgrade to access.');
            }

            if (action === 'delete') {
                await Promise.all(selectedIds.map((id) => bugsHook.deleteBug(id)));
            } else {
                const timestamp = new Date();
                await Promise.all(
                    selectedIds.map((id) =>
                        handleUpdateBug(id, {
                            status: action,
                            updated_at: timestamp,
                        })
                    )
                );
            }

            uiHook.addNotification?.({
                type: 'success',
                title: 'Success',
                message: `${selectedIds.length} bug${selectedIds.length > 1 ? 's' : ''} ${action}d`,
            });
        } catch (error) {
            handleError(error, 'bulk action');
        }
    }, [
        bugsHook.bugsLocked,
        bugsHook.deleteBug,
        handleUpdateBug,
        uiHook.addNotification,
        handleError
    ]);

    const handleCloseModal = useCallback(() => {
        console.log('🔒 Closing bug modal');
        setIsModalOpen(false);
        setIsDetailsModalOpen(false);
        setSelectedBug(null);
    }, []);

    if (bugsHook.loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bugs...</p>
                </div>
            </div>
        );
    }

    if (bugsHook.bugsLocked) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Bugs</h1>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <p className="text-gray-600">Bugs are locked. Upgrade to access.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bugs</h1>
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                            {filteredBugs.length} {filteredBugs.length === 1 ? 'bug' : 'bugs'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <button
                            onClick={() => setIsTraceabilityOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            Traceability
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 whitespace-nowrap"
                        >
                            Import
                        </button>
                        <BugReportButton
                            bug={null}
                            onSave={handleSaveBug}
                            onClose={handleCloseModal}
                            activeSuite={bugsHook.activeSuite || { id: 'default', name: 'Default Suite' }}
                            currentUser={bugsHook.currentUser || { uid: 'anonymous', email: 'anonymous' }}
                        />
                    </div>
                </div>

                <BugFilterBar
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    bugs={bugsHook.bugs}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div className="transition-opacity duration-300">
                    {viewMode === 'table' ? (
                        <BugTable
                            bugs={filteredBugs}
                            testCases={bugsHook.testCases}
                            relationships={bugsHook.relationships}
                            selectedBugs={bugsHook.selectedBugs}
                            onSelectBugs={bugsHook.selectBugs}
                            onEdit={handleEditBug}
                            onDuplicate={handleDuplicateBug}
                            onBulkAction={handleBulkAction}
                            onView={handleViewBug}
                            onLinkTestCase={handleLinkTestCase}
                            onUpdateBug={handleUpdateBug}
                        />
                    ) : (
                        <BugList
                            bugs={filteredBugs}
                            testCases={bugsHook.testCases}
                            relationships={bugsHook.relationships}
                            selectedBugs={bugsHook.selectedBugs}
                            onSelectBugs={bugsHook.selectBugs}
                            onEdit={handleEditBug}
                            onDelete={handleDeleteBug}
                            onDuplicate={handleDuplicateBug}
                            onBulkAction={handleBulkAction}
                            onView={handleViewBug}
                            onLinkTestCase={handleLinkTestCase}
                        />
                    )}
                </div>

                {isDetailsModalOpen && selectedBug && (
                    <BugDetailsModal
                        bug={selectedBug}
                        teamMembers={bugsHook.teamMembers || []}
                        onUpdateBug={handleUpdateBug}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    );
};

export default Bugs;