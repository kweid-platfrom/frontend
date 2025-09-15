import React, { useState, useEffect, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trash2, Archive, Download, Share, Edit3, Copy, Play, Pause, 
  CheckCircle, XCircle, RotateCcw, FileText, Bug, TestTube, 
  Video, BarChart3, Lightbulb, Zap, Shield, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

// Page configurations for different contexts
const PAGE_CONFIGS = {
  testCases: {
    icon: TestTube,
    color: 'blue',
    actions: [
      { group: 'execution', items: [
        { id: 'pass', label: 'Pass', icon: CheckCircle, color: 'green' },
        { id: 'fail', label: 'Fail', icon: XCircle, color: 'red' },
        { id: 'block', label: 'Block', icon: Shield, color: 'yellow' }
      ]},
      { group: 'test', items: [
        { id: 'run', label: 'Run', icon: Play, color: 'blue' },
        { id: 'reset', label: 'Reset', icon: RefreshCw, color: 'blue' }
      ]},
      { group: 'status', items: [
        { id: 'activate', label: 'Activate', icon: Eye, color: 'green' },
        { id: 'archive', label: 'Archive', icon: Archive, color: 'gray' }
      ]},
      { group: 'actions', items: [
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  bugs: {
    icon: Bug,
    color: 'red',
    actions: [
      { group: 'status', items: [
        { id: 'open', label: 'Reopen', icon: RotateCcw, color: 'blue' },
        { id: 'resolved', label: 'Resolve', icon: CheckCircle, color: 'green' },
        { id: 'closed', label: 'Close', icon: XCircle, color: 'red' }
      ]},
      { group: 'actions', items: [
        { id: 'archive', label: 'Archive', icon: Archive, color: 'gray' },
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  recordings: {
    icon: Video,
    color: 'purple',
    actions: [
      { group: 'playback', items: [
        { id: 'download', label: 'Download', icon: Download, color: 'blue' }
      ]},
      { group: 'actions', items: [
        { id: 'archive', label: 'Archive', icon: Archive, color: 'gray' },
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  reports: {
    icon: BarChart3,
    color: 'green',
    actions: [
      { group: 'export', items: [
        { id: 'pdf', label: 'Export PDF', icon: FileText, color: 'red' },
        { id: 'csv', label: 'Export CSV', icon: Download, color: 'green' }
      ]},
      { group: 'actions', items: [
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  recommendations: {
    icon: Lightbulb,
    color: 'yellow',
    actions: [
      { group: 'status', items: [
        { id: 'approve', label: 'Approve', icon: CheckCircle, color: 'green' },
        { id: 'reject', label: 'Reject', icon: XCircle, color: 'red' }
      ]},
      { group: 'actions', items: [
        { id: 'archive', label: 'Archive', icon: Archive, color: 'gray' },
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  archive: {
    icon: Archive,
    color: 'gray',
    actions: [
      { group: 'restore', items: [
        { id: 'restore', label: 'Restore', icon: RotateCcw, color: 'blue' }
      ]},
      { group: 'actions', items: [
        { id: 'permanent-delete', label: 'Delete Forever', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  trash: {
    icon: Trash2,
    color: 'red',
    actions: [
      { group: 'restore', items: [
        { id: 'restore', label: 'Restore', icon: RotateCcw, color: 'blue' }
      ]},
      { group: 'actions', items: [
        { id: 'permanent-delete', label: 'Delete Forever', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  },
  sprints: {
    icon: Zap,
    color: 'indigo',
    actions: [
      { group: 'status', items: [
        { id: 'start', label: 'Start', icon: Play, color: 'green' },
        { id: 'complete', label: 'Complete', icon: CheckCircle, color: 'green' }
      ]},
      { group: 'actions', items: [
        { id: 'archive', label: 'Archive', icon: Archive, color: 'gray' },
        { id: 'delete', label: 'Delete', icon: Trash2, color: 'red', requiresConfirm: true }
      ]}
    ]
  }
};

// Color classes
const COLOR_CLASSES = {
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    button: 'bg-red-100 hover:bg-red-200 text-red-700',
    destructive: 'bg-red-600 hover:bg-red-700 text-white'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800', 
    text: 'text-green-800 dark:text-green-200',
    button: 'bg-green-100 hover:bg-green-200 text-green-700'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-200',
    button: 'bg-purple-100 hover:bg-purple-200 text-purple-700'
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-800 dark:text-gray-200',
    button: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-800 dark:text-indigo-200',
    button: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
  }
};

// Bulk Actions Context
const BulkActionsContext = createContext();

// Portal component for bulk actions with inline confirmation
const BulkActionsPortal = () => {
  const context = useContext(BulkActionsContext);
  const [confirmingAction, setConfirmingAction] = useState(null);

  if (!context?.bulkActions) return null;

  const { selectedItems, currentPageType, portalContainer, clearBulkSelection, executeBulkAction } = context.bulkActions;

  if (!portalContainer || selectedItems.length === 0 || !currentPageType) {
    return null;
  }

  const config = PAGE_CONFIGS[currentPageType];
  if (!config) return null;

  const colorClass = COLOR_CLASSES[config.color];
  const PageIcon = config.icon;

  const handleAction = (actionId, requiresConfirm) => {
    if (requiresConfirm && confirmingAction !== actionId) {
      setConfirmingAction(actionId);
      // Reset confirmation state after 3 seconds
      setTimeout(() => {
        setConfirmingAction(null);
      }, 3000);
    } else {
      executeBulkAction(actionId, selectedItems);
      clearBulkSelection();
      setConfirmingAction(null);
    }
  };

  const handleCancel = () => {
    clearBulkSelection();
    setConfirmingAction(null);
  };

  return createPortal(
    <div className={`${colorClass.bg} ${colorClass.border} border-t px-4 py-3 shadow-lg backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PageIcon className={`w-5 h-5 ${colorClass.text}`} />
          <span className={`text-sm font-medium ${colorClass.text}`}>
            {selectedItems.length} {currentPageType.replace(/([A-Z])/g, ' $1').toLowerCase()}{selectedItems.length > 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-1 flex-wrap">
          {config.actions.map((group, groupIndex) => (
            <div key={group.group} className="flex items-center space-x-1">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const itemColorClass = COLOR_CLASSES[item.color];
                const isConfirming = confirmingAction === item.id;
                const isDestructive = item.requiresConfirm || item.id === 'delete' || item.id === 'permanent-delete';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAction(item.id, item.requiresConfirm)}
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                      isDestructive
                        ? isConfirming
                          ? 'bg-red-700 text-white animate-pulse'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        : itemColorClass?.button || 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={isConfirming ? 'Click again to confirm' : item.label}
                  >
                    <ItemIcon className="w-3 h-3 mr-1" />
                    {isConfirming ? 'Confirm' : item.label}
                  </button>
                );
              })}
              {groupIndex < config.actions.length - 1 && (
                <div className={`w-px h-4 ${colorClass.border} border-l mx-1`} />
              )}
            </div>
          ))}
          
          <button
            onClick={handleCancel}
            className="ml-2 px-3 py-1 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  );
};

// Enhanced AppProvider integration
export const withBulkActions = (WrappedAppProvider) => {
  return ({ children, ...props }) => {
    const [bulkActions, setBulkActions] = useState({
      selectedItems: [],
      currentPageType: '',
      portalContainer: null,
      onBulkAction: null
    });

    useEffect(() => {
      // Create portal container
      let container = document.getElementById('bulk-actions-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'bulk-actions-portal';
        container.className = 'fixed bottom-0 left-0 right-0 z-50';
        document.body.appendChild(container);
      }
      setBulkActions(prev => ({ ...prev, portalContainer: container }));

      return () => {
        const existingContainer = document.getElementById('bulk-actions-portal');
        if (existingContainer && existingContainer.children.length === 0) {
          document.body.removeChild(existingContainer);
        }
      };
    }, []);

    // Bulk actions methods that integrate with your existing AppProvider actions
    const bulkActionMethods = {
      registerPageBulkActions: (pageType, onBulkAction) => {
        setBulkActions(prev => ({
          ...prev,
          currentPageType: pageType,
          onBulkAction
        }));
      },

      updateBulkSelection: (items) => {
        setBulkActions(prev => ({
          ...prev,
          selectedItems: Array.isArray(items) ? items : []
        }));
      },

      clearBulkSelection: () => {
        setBulkActions(prev => ({
          ...prev,
          selectedItems: []
        }));
      },

      // Integration with your existing AppProvider actions
      executeBulkAction: async (actionId, items) => {
        const { currentPageType, onBulkAction } = bulkActions;
        
        // Call the page-specific bulk action handler if provided
        if (onBulkAction) {
          await onBulkAction(actionId, items);
          return;
        }

        // Default bulk action handling using your existing AppProvider actions
        return await executeBulkActionDefault(actionId, items, currentPageType);
      }
    };

    // Default bulk action execution using your AppProvider context
    const executeBulkActionDefault = async (actionId, items, pageType) => {
      // This will be called from within the AppProvider context where all actions are available
      // The actual implementation will be injected by the AppProvider
      console.log(`Bulk action ${actionId} for ${pageType}:`, items);
    };

    const contextValue = {
      bulkActions: {
        ...bulkActions,
        ...bulkActionMethods
      }
    };

    return (
      <BulkActionsContext.Provider value={contextValue}>
        <WrappedAppProvider {...props}>
          {children}
          <BulkActionsPortal />
        </WrappedAppProvider>
      </BulkActionsContext.Provider>
    );
  };
};

// Hook for pages to register and manage bulk actions
export const useBulkActions = () => {
  const context = useContext(BulkActionsContext);
  if (!context?.bulkActions) {
    throw new Error('useBulkActions must be used within BulkActionsProvider');
  }
  return context.bulkActions;
};

// Bulk action handlers that integrate with your AppProvider actions
export const createBulkActionHandlers = (appActions, activeSuite) => {
  const handleTestCaseBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const testCaseId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'pass':
          return appActions.testCases.updateTestCase(testCaseId, { status: 'passed' });
        case 'fail':
          return appActions.testCases.updateTestCase(testCaseId, { status: 'failed' });
        case 'block':
          return appActions.testCases.updateTestCase(testCaseId, { status: 'blocked' });
        case 'run':
          // Implement test case run logic
          console.log('Running test case:', testCaseId);
          return { success: true };
        case 'archive':
          return appActions.archive.archiveTestCase(activeSuite.id, testCaseId, null, 'Bulk archive');
        case 'delete':
          return appActions.testCases.deleteTestCase(testCaseId, activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-testcases-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} test case${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-testcases-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleBugBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const bugId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'open':
          return appActions.bugs.updateBug(bugId, { status: 'open' });
        case 'resolved':
          return appActions.bugs.updateBug(bugId, { status: 'resolved' });
        case 'closed':
          return appActions.bugs.updateBug(bugId, { status: 'closed' });
        case 'archive':
          return appActions.archive.archiveBug(activeSuite.id, bugId, null, 'Bulk archive');
        case 'delete':
          return appActions.bugs.deleteBug(bugId, activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-bugs-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} bug${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-bugs-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleRecordingBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const recordingId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'download':
          // Implement bulk download logic
          console.log('Downloading recording:', recordingId);
          return { success: true };
        case 'archive':
          return appActions.archive.archiveRecording(activeSuite.id, recordingId, null, 'Bulk archive');
        case 'delete':
          return appActions.recordings.deleteRecording(recordingId, activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-recordings-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} recording${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-recordings-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleReportBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const reportId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'pdf':
          // Implement PDF export
          console.log('Exporting report to PDF:', reportId);
          return { success: true };
        case 'csv':
          // Implement CSV export
          console.log('Exporting report to CSV:', reportId);
          return { success: true };
        case 'delete':
          return appActions.reports.deleteReport(reportId, activeSuite.organizationId || activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-reports-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} report${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-reports-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleRecommendationBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const recommendationId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'approve':
          return appActions.recommendations.updateRecommendation(recommendationId, { status: 'approved' });
        case 'reject':
          return appActions.recommendations.updateRecommendation(recommendationId, { status: 'rejected' });
        case 'archive':
          return appActions.archive.archiveRecommendation(activeSuite.id, recommendationId, null, 'Bulk archive');
        case 'delete':
          return appActions.recommendations.deleteRecommendation(recommendationId, activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-recommendations-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} recommendation${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-recommendations-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleArchiveBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const itemId = typeof item === 'string' ? item : item.id;
      const assetType = typeof item === 'object' ? item.type : 'unknown';
      
      switch (action) {
        case 'restore':
          return appActions.archive.unarchiveItem(activeSuite.id, assetType, itemId);
        case 'permanent-delete':
          return appActions.archive.permanentlyDelete(activeSuite.id, assetType, itemId);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-archive-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} item${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-archive-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleTrashBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const itemId = typeof item === 'string' ? item : item.id;
      const assetType = typeof item === 'object' ? item.type : 'unknown';
      
      switch (action) {
        case 'restore':
          return appActions.archive.restoreFromTrash(activeSuite.id, assetType, itemId);
        case 'permanent-delete':
          return appActions.archive.permanentlyDelete(activeSuite.id, assetType, itemId);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-trash-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} item${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-trash-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  const handleSprintBulkAction = async (action, items) => {
    const promises = items.map(async (item) => {
      const sprintId = typeof item === 'string' ? item : item.id;
      
      switch (action) {
        case 'start':
          return appActions.sprints.updateSprint(sprintId, { status: 'active' });
        case 'complete':
          return appActions.sprints.updateSprint(sprintId, { status: 'completed' });
        case 'archive':
          return appActions.archive.archiveSprint(activeSuite.id, sprintId, 'Bulk archive');
        case 'delete':
          return appActions.sprints.deleteSprint(sprintId, activeSuite.id);
        default:
          return { success: false, error: { message: `Unknown action: ${action}` } };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      appActions.ui.showNotification({
        id: `bulk-sprints-${action}-success`,
        type: 'success',
        message: `Successfully ${action}ed ${successCount} sprint${successCount > 1 ? 's' : ''}`,
        duration: 3000,
      });
    } else {
      appActions.ui.showNotification({
        id: `bulk-sprints-${action}-partial`,
        type: 'warning',
        message: `${successCount} succeeded, ${failCount} failed for ${action}`,
        duration: 5000,
      });
    }

    return { success: failCount === 0, results };
  };

  return {
    testCases: handleTestCaseBulkAction,
    bugs: handleBugBulkAction,
    recordings: handleRecordingBulkAction,
    reports: handleReportBulkAction,
    recommendations: handleRecommendationBulkAction,
    archive: handleArchiveBulkAction,
    trash: handleTrashBulkAction,
    sprints: handleSprintBulkAction,
  };
};