const EnhancedBulkActionsBar = ({
  // Selection props
  selectedItems = [],
  onClearSelection,
  
  // Display props
  pageTitle = 'items',
  pageIcon = 'TestTube',
  pageColor = 'blue',
  
  // Actions configuration - can use predefined or custom
  assetType = null, // Use predefined config: 'testCases', 'bugs', 'recordings', etc.
  actionGroups = [], // Custom action groups (overrides assetType)
  
  // Action handler
  onAction,
  
  // Portal configuration
  portalId = 'bulk-actions-portal',
  position = 'bottom', // 'top' | 'bottom'
  
  // Loading states
  loadingActions = [],
}) => {
  const [confirmingAction, setConfirmingAction] = useState(null);
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Create or find portal container
    let container = document.getElementById(portalId);
    if (!container) {
      container = document.createElement('div');
      container.id = portalId;
      container.className = `fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50`;
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      // Clean up portal if it's empty
      const existingContainer = document.getElementById(portalId);
      if (existingContainer && existingContainer.children.length === 0) {
        document.body.removeChild(existingContainer);
      }
    };
  }, [portalId, position]);

  // Determine configuration to use
  const config = useMemo(() => {
    console.log('BulkActionsBar config debug:', { assetType, actionGroups });
    
    // If custom actionGroups provided, use them
    if (actionGroups.length > 0) {
      console.log('Using custom actionGroups');
      return {
        icon: pageIcon,
        color: pageColor,
        groups: actionGroups
      };
    }
    
    // Otherwise, use predefined asset config
    if (assetType && ASSET_ACTION_CONFIGS[assetType]) {
      const assetConfig = ASSET_ACTION_CONFIGS[assetType];
      console.log('Using predefined config for:', assetType, assetConfig);
      return {
        icon: pageIcon || assetConfig.icon,
        color: pageColor || assetConfig.color,
        groups: assetConfig.groups
      };
    }

    console.log('Using default config');
    // Default empty config
    return {
      icon: pageIcon,
      color: pageColor,
      groups: []
    };
  }, [assetType, actionGroups, pageIcon, pageColor]);

  // Don't render if no items selected, no portal container, or no actions
  if (!portalContainer || selectedItems.length === 0 || config.groups.length === 0) {
    return null;
  }

  const colorClass = COLOR_CLASSES[config.color] || COLOR_CLASSES.blue;
  const PageIcon = ICONS[config.icon] || ICONS['Bug'];
  
  console.log('Icon selection debug:', {
    configIcon: config.icon,
    selectedIcon: PageIcon?.name || 'unknown',
    availableIcons: Object.keys(ICONS)
  });

  const handleAction = async (actionId, actionConfig) => {
    const requiresConfirm = actionConfig.requiresConfirm || actionConfig.destructive;
    
    if (requiresConfirm && confirmingAction !== actionId) {
      setConfirmingAction(actionId);
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setConfirmingAction(null);
      }, 3000);
      return;
    }

    try {
      await onAction(actionId, selectedItems, actionConfig);
      onClearSelection();
      setConfirmingAction(null);
    } catch (error) {
      console.error(`Error executing bulk action ${actionId}:`, error);
      setConfirmingAction(null);
    }
  };

  const handleCancel = () => {
    onClearSelection();
    setConfirmingAction(null);
  };

  const borderClass = position === 'top' ? 'border-b' : 'border-t';

  return createPortal(
    <div className={`${colorClass.bg} ${colorClass.border} ${borderClass} px-4 py-3 shadow-lg backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Selection info */}
        <div className="flex items-center space-x-3">
          <PageIcon className={`w-5 h-5 ${colorClass.text}`} />
          <span className={`text-sm font-medium ${colorClass.text}`}>
            {selectedItems.length} {pageTitle}{selectedItems.length > 1 ? 's' : ''} selected
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 flex-wrap">
          {config.groups.map((group, groupIndex) => (
            <div key={group.name || groupIndex} className="flex items-center space-x-1">
              {group.actions.map((action) => {
                const ActionIcon = ICONS[action.icon] || TestTube;
                const actionColorClass = COLOR_CLASSES[action.color] || colorClass;
                const isConfirming = confirmingAction === action.id;
                const isLoading = loadingActions.includes(action.id);
                const isDestructive = action.requiresConfirm || action.destructive;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDestructive
                        ? isConfirming
                          ? 'bg-red-700 text-white animate-pulse'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        : actionColorClass?.button || 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={isConfirming ? 'Click again to confirm' : action.label}
                  >
                    <ActionIcon className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Processing...' : isConfirming ? 'Confirm' : action.label}
                  </button>
                );
              })}
              
              {/* Group separator */}
              {groupIndex < config.groups.length - 1 && (
                <div className={`w-px h-4 ${colorClass.border} border-l mx-1`} />
              )}
            </div>
          ))}
          
          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="ml-2 px-3 py-1 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  );
};

// Helper function to get predefined asset config
export const getAssetConfig = (assetType) => {
  return ASSET_ACTION_CONFIGS[assetType] || null;
};

// Helper function to get all available asset types
export const getAvailableAssetTypes = () => {
  return Object.keys(ASSET_ACTION_CONFIGS);
};import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trash2, Archive, Download, Play, CheckCircle, XCircle, RotateCcw, 
  FileText, Bug, TestTube, Video, BarChart3, Lightbulb, Zap, 
  Shield, RefreshCw, Eye, Users, Database, FolderOpen, Tags,
  GitBranch, Move, Copy, Star, Lock, Unlock, Mail, Bell,
  Calendar, Clock, Flag, Target, Link2, Bookmark
} from 'lucide-react';

// Available icons for actions
const ICONS = {
  Trash2, Archive, Download, Play, CheckCircle, XCircle, 
  RotateCcw, FileText, Bug, TestTube, Video, BarChart3, 
  Lightbulb, Zap, Shield, RefreshCw, Eye, Users, Database, 
  FolderOpen, Tags, GitBranch, Move, Copy, Star, Lock, Unlock,
  Mail, Bell, Calendar, Clock, Flag, Target, Link2, Bookmark
};

// Predefined action group configurations for different asset types
export const ASSET_ACTION_CONFIGS = {
  testCases: {
    icon: 'TestTube',
    color: 'blue',
    groups: [
      {
        name: 'execution',
        actions: [
          { id: 'pass', label: 'Pass', icon: 'CheckCircle', color: 'green' },
          { id: 'fail', label: 'Fail', icon: 'XCircle', color: 'red' },
          { id: 'block', label: 'Block', icon: 'Shield', color: 'yellow' }
        ]
      },
      {
        name: 'test',
        actions: [
          { id: 'run', label: 'Run', icon: 'Play', color: 'blue' },
          { id: 'reset', label: 'Reset', icon: 'RefreshCw', color: 'blue' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Zap', color: 'purple' },
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' }
        ]
      },
      {
        name: 'status',
        actions: [
          { id: 'activate', label: 'Activate', icon: 'Eye', color: 'green' },
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  bugs: {
    icon: 'Bug',
    color: 'red',
    groups: [
      {
        name: 'status',
        actions: [
          { id: 'open', label: 'Reopen', icon: 'RotateCcw', color: 'blue' },
          { id: 'resolve', label: 'Resolve', icon: 'CheckCircle', color: 'green' },
          { id: 'close', label: 'Close', icon: 'XCircle', color: 'red' }
        ]
      },
      {
        name: 'assignment',
        actions: [
          { id: 'assign', label: 'Assign', icon: 'Users', color: 'blue' },
          { id: 'priority', label: 'Set Priority', icon: 'Flag', color: 'orange' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Zap', color: 'purple' },
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  recordings: {
    icon: 'Video',
    color: 'purple',
    groups: [
      {
        name: 'playback',
        actions: [
          { id: 'download', label: 'Download', icon: 'Download', color: 'blue' },
          { id: 'share', label: 'Share', icon: 'Link2', color: 'green' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' },
          { id: 'bookmark', label: 'Bookmark', icon: 'Bookmark', color: 'yellow' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  sprints: {
    icon: 'Zap',
    color: 'indigo',
    groups: [
      {
        name: 'status',
        actions: [
          { id: 'start', label: 'Start', icon: 'Play', color: 'green' },
          { id: 'complete', label: 'Complete', icon: 'CheckCircle', color: 'green' },
          { id: 'pause', label: 'Pause', icon: 'Clock', color: 'yellow' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'merge', label: 'Merge', icon: 'GitBranch', color: 'purple' },
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  reports: {
    icon: 'BarChart3',
    color: 'green',
    groups: [
      {
        name: 'export',
        actions: [
          { id: 'pdf', label: 'Export PDF', icon: 'FileText', color: 'red' },
          { id: 'csv', label: 'Export CSV', icon: 'Download', color: 'green' },
          { id: 'excel', label: 'Export Excel', icon: 'FileText', color: 'blue' }
        ]
      },
      {
        name: 'sharing',
        actions: [
          { id: 'share', label: 'Share', icon: 'Link2', color: 'blue' },
          { id: 'email', label: 'Email', icon: 'Mail', color: 'purple' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  documents: {
    icon: 'FileText',
    color: 'blue',
    groups: [
      {
        name: 'access',
        actions: [
          { id: 'download', label: 'Download', icon: 'Download', color: 'blue' },
          { id: 'lock', label: 'Lock', icon: 'Lock', color: 'red' },
          { id: 'unlock', label: 'Unlock', icon: 'Unlock', color: 'green' }
        ]
      },
      {
        name: 'sharing',
        actions: [
          { id: 'share', label: 'Share', icon: 'Link2', color: 'blue' },
          { id: 'email', label: 'Email', icon: 'Mail', color: 'purple' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' },
          { id: 'move', label: 'Move', icon: 'Move', color: 'purple' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' },
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  testData: {
    icon: 'Database',
    color: 'cyan',
    groups: [
      {
        name: 'data',
        actions: [
          { id: 'export', label: 'Export', icon: 'Download', color: 'blue' },
          { id: 'refresh', label: 'Refresh', icon: 'RefreshCw', color: 'green' },
          { id: 'validate', label: 'Validate', icon: 'CheckCircle', color: 'green' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' },
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  team: {
    icon: 'Users',
    color: 'purple',
    groups: [
      {
        name: 'roles',
        actions: [
          { id: 'promote', label: 'Promote', icon: 'Star', color: 'yellow' },
          { id: 'assign-role', label: 'Assign Role', icon: 'Users', color: 'blue' },
          { id: 'permissions', label: 'Set Permissions', icon: 'Shield', color: 'green' }
        ]
      },
      {
        name: 'communication',
        actions: [
          { id: 'notify', label: 'Notify', icon: 'Bell', color: 'blue' },
          { id: 'email', label: 'Email', icon: 'Mail', color: 'purple' },
          { id: 'message', label: 'Message', icon: 'Mail', color: 'green' }
        ]
      },
      {
        name: 'organization',
        actions: [
          { id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Zap', color: 'purple' },
          { id: 'group', label: 'Group', icon: 'FolderOpen', color: 'blue' },
          { id: 'tag', label: 'Tag', icon: 'Tags', color: 'indigo' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'deactivate', label: 'Deactivate', icon: 'Lock', color: 'red' },
          { id: 'remove', label: 'Remove', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  recommendations: {
    icon: 'Lightbulb',
    color: 'yellow',
    groups: [
      {
        name: 'status',
        actions: [
          { id: 'approve', label: 'Approve', icon: 'CheckCircle', color: 'green' },
          { id: 'reject', label: 'Reject', icon: 'XCircle', color: 'red' },
          { id: 'review', label: 'Mark for Review', icon: 'Eye', color: 'blue' }
        ]
      },
      {
        name: 'implementation',
        actions: [
          { id: 'add-to-sprint', label: 'Add to Sprint', icon: 'Zap', color: 'purple' },
          { id: 'assign', label: 'Assign', icon: 'Users', color: 'blue' },
          { id: 'priority', label: 'Set Priority', icon: 'Flag', color: 'orange' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  archive: {
    icon: 'Archive',
    color: 'gray',
    groups: [
      {
        name: 'restore',
        actions: [
          { id: 'restore', label: 'Restore', icon: 'RotateCcw', color: 'blue' },
          { id: 'restore-to-sprint', label: 'Restore to Sprint', icon: 'Zap', color: 'purple' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  trash: {
    icon: 'Trash2',
    color: 'red',
    groups: [
      {
        name: 'restore',
        actions: [
          { id: 'restore', label: 'Restore', icon: 'RotateCcw', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
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
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-800 dark:text-cyan-200',
    button: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-200',
    button: 'bg-orange-100 hover:bg-orange-200 text-orange-700'
  }
};

const BulkActionsBar = ({
  // Selection props
  selectedItems = [],
  onClearSelection,
  
  // Display props
  pageTitle = 'items',
  pageIcon = 'TestTube',
  pageColor = 'blue',
  
  // Actions configuration
  actionGroups = [],
  
  // Action handler
  onAction,
  
  // Portal configuration
  portalId = 'bulk-actions-portal',
  position = 'bottom', // 'top' | 'bottom'
  
  // Loading states
  loadingActions = [],
}) => {
  const [confirmingAction, setConfirmingAction] = useState(null);
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Create or find portal container
    let container = document.getElementById(portalId);
    if (!container) {
      container = document.createElement('div');
      container.id = portalId;
      container.className = `fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50`;
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      // Clean up portal if it's empty
      const existingContainer = document.getElementById(portalId);
      if (existingContainer && existingContainer.children.length === 0) {
        document.body.removeChild(existingContainer);
      }
    };
  }, [portalId, position]);

  // Don't render if no items selected or no portal container
  if (!portalContainer || selectedItems.length === 0 || actionGroups.length === 0) {
    return null;
  }

  const colorClass = COLOR_CLASSES[pageColor] || COLOR_CLASSES.blue;
  const PageIcon = ICONS[pageIcon] || TestTube;

  const handleAction = async (actionId, actionConfig) => {
    const requiresConfirm = actionConfig.requiresConfirm || actionConfig.destructive;
    
    if (requiresConfirm && confirmingAction !== actionId) {
      setConfirmingAction(actionId);
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setConfirmingAction(null);
      }, 3000);
      return;
    }

    try {
      await onAction(actionId, selectedItems);
      onClearSelection();
      setConfirmingAction(null);
    } catch (error) {
      console.error(`Error executing bulk action ${actionId}:`, error);
      setConfirmingAction(null);
    }
  };

  const handleCancel = () => {
    onClearSelection();
    setConfirmingAction(null);
  };

  const borderClass = position === 'top' ? 'border-b' : 'border-t';

  return createPortal(
    <div className={`${colorClass.bg} ${colorClass.border} ${borderClass} px-4 py-3 shadow-lg backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Selection info */}
        <div className="flex items-center space-x-3">
          <PageIcon className={`w-5 h-5 ${colorClass.text}`} />
          <span className={`text-sm font-medium ${colorClass.text}`}>
            {selectedItems.length} {pageTitle}{selectedItems.length > 1 ? 's' : ''} selected
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 flex-wrap">
          {actionGroups.map((group, groupIndex) => (
            <div key={group.name || groupIndex} className="flex items-center space-x-1">
              {group.actions.map((action) => {
                const ActionIcon = ICONS[action.icon] || TestTube;
                const actionColorClass = COLOR_CLASSES[action.color] || colorClass;
                const isConfirming = confirmingAction === action.id;
                const isLoading = loadingActions.includes(action.id);
                const isDestructive = action.requiresConfirm || action.destructive;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDestructive
                        ? isConfirming
                          ? 'bg-red-700 text-white animate-pulse'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        : actionColorClass?.button || 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={isConfirming ? 'Click again to confirm' : action.label}
                  >
                    <ActionIcon className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Processing...' : isConfirming ? 'Confirm' : action.label}
                  </button>
                );
              })}
              
              {/* Group separator */}
              {groupIndex < actionGroups.length - 1 && (
                <div className={`w-px h-4 ${colorClass.border} border-l mx-1`} />
              )}
            </div>
          ))}
          
          {/* Cancel button */}
          <button
            onClick={handleCancel}
            className="ml-2 px-3 py-1 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  );
};

export default EnhancedBulkActionsBar;