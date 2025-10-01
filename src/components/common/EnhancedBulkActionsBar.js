
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2, Archive, Download, Play, CheckCircle, XCircle, RotateCcw,
  FileText, Bug, TestTube, Video, BarChart3, Lightbulb,
  Shield, RefreshCw, Eye, Users, Database, FolderOpen,
  GitBranch, Move, Copy, Star, Lock, Unlock, Mail, Bell,
  Calendar, Clock, Flag, Target, Link2, Bookmark, ChevronDown, X
} from 'lucide-react';

// Custom Tooltip component
const Tooltip = ({ children, text, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled) return children;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-50">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};
const ICONS = {
  Trash2, Archive, Download, Play, CheckCircle, XCircle,
  RotateCcw, FileText, Bug, TestTube, Video, BarChart3,
  Lightbulb, Target, Shield, RefreshCw, Eye, Users, Database,
  FolderOpen, GitBranch, Move, Copy, Star, Lock, Unlock,
  Mail, Bell, Calendar, Clock, Flag, Target, Link2, Bookmark,
  ChevronDown, X
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
          {
            id: 'add-to-sprint',
            label: 'Add to Sprint',
            icon: 'Target',
            color: 'purple',
            type: 'select',
            options: [
              { id: 'sprint-1', label: 'Sprint 1' },
              { id: 'sprint-2', label: 'Sprint 2' },
              { id: 'sprint-3', label: 'Sprint 3' }
            ]
          },
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          },
          {
            id: 'assign',
            label: 'Assign',
            icon: 'Users',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'user-1', label: 'John Doe' },
              { id: 'user-2', label: 'Jane Smith' },
              { id: 'user-3', label: 'Mike Johnson' }
            ]
          }
        ]
      },
      {
        name: 'status',
        actions: [
          { id: 'activate', label: 'Activate', icon: 'Eye', color: 'green' },
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true }
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
          {
            id: 'assign',
            label: 'Assign',
            icon: 'Users',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'user-1', label: 'John Doe' },
              { id: 'user-2', label: 'Jane Smith' },
              { id: 'user-3', label: 'Mike Johnson' }
            ]
          },
          {
            id: 'severity',
            label: 'Set Severity',
            icon: 'Flag',
            color: 'orange',
            type: 'select',
            options: [
              { id: 'critical', label: 'Critical' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
              { id: 'low', label: 'Low' }
            ]
          }
        ]
      },
      {
        name: 'organization',
        actions: [
          {
            id: 'add-to-sprint',
            label: 'Add to Sprint',
            icon: 'Target',
            color: 'purple',
            type: 'select',
            options: [
              { id: 'sprint-1', label: 'Sprint 1' },
              { id: 'sprint-2', label: 'Sprint 2' },
              { id: 'sprint-3', label: 'Sprint 3' }
            ]
          },
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-critical', label: 'Critical Bugs' },
              { id: 'group-ui', label: 'UI Issues' },
              { id: 'group-backend', label: 'Backend Issues' }
            ]
          }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
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
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          },
          { id: 'bookmark', label: 'Bookmark', icon: 'Bookmark', color: 'yellow' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
          { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true }
        ]
      }
    ]
  },

  sprints: {
    icon: 'Target',
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
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
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
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          }
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
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          },
          { id: 'move', label: 'Move', icon: 'Move', color: 'purple' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' },
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
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
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          },
          { id: 'duplicate', label: 'Duplicate', icon: 'Copy', color: 'blue' }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
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
          {
            id: 'assign-role',
            label: 'Assign Role',
            icon: 'Users',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'role-admin', label: 'Admin' },
              { id: 'role-tester', label: 'Tester' },
              { id: 'role-viewer', label: 'Viewer' }
            ]
          },
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
          {
            id: 'add-to-sprint',
            label: 'Add to Sprint',
            icon: 'Target',
            color: 'purple',
            type: 'select',
            options: [
              { id: 'sprint-1', label: 'Sprint 1' },
              { id: 'sprint-2', label: 'Sprint 2' },
              { id: 'sprint-3', label: 'Sprint 3' }
            ]
          },
          {
            id: 'group',
            label: 'Group',
            icon: 'FolderOpen',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'group-regression', label: 'Regression Tests' },
              { id: 'group-smoke', label: 'Smoke Tests' },
              { id: 'group-integration', label: 'Integration Tests' }
            ]
          }
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
          {
            id: 'add-to-sprint',
            label: 'Add to Sprint',
            icon: 'Target',
            color: 'purple',
            type: 'select',
            options: [
              { id: 'sprint-1', label: 'Sprint 1' },
              { id: 'sprint-2', label: 'Sprint 2' },
              { id: 'sprint-3', label: 'Sprint 3' }
            ]
          },
          {
            id: 'assign',
            label: 'Assign',
            icon: 'Users',
            color: 'blue',
            type: 'select',
            options: [
              { id: 'user-1', label: 'John Doe' },
              { id: 'user-2', label: 'Jane Smith' },
              { id: 'user-3', label: 'Mike Johnson' }
            ]
          },
          {
            id: 'severity',
            label: 'Set Severity',
            icon: 'Flag',
            color: 'orange',
            type: 'select',
            options: [
              { id: 'critical', label: 'Critical' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
              { id: 'low', label: 'Low' }
            ]
          }
        ]
      },
      {
        name: 'actions',
        actions: [
          { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true },
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
          {
            id: 'restore-to-sprint',
            label: 'Restore to Sprint',
            icon: 'Target',
            color: 'purple',
            type: 'select',
            options: [
              { id: 'sprint-1', label: 'Sprint 1' },
              { id: 'sprint-2', label: 'Sprint 2' },
              { id: 'sprint-3', label: 'Sprint 3' }
            ]
          }
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

// Dropdown component for select actions
const ActionDropdown = ({ action, onSelect, isOpen, onToggle, disabled }) => {
  const dropdownRef = useRef(null);
  const ActionIcon = ICONS[action.icon] || TestTube;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip text={action.label} disabled={isOpen}>
        <button
          onClick={() => onToggle(!isOpen)}
          disabled={disabled}
          className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <ChevronDown className={`w-2 h-2 sm:w-3 sm:h-3 absolute -bottom-0.5 -right-0.5 bg-white rounded-full border border-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {action.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelect(action.id, option)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Loading states
  loadingActions = [],
}) => {
  const [confirmingActions, setConfirmingActions] = useState(new Set());
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Create or find portal container
    let container = document.getElementById(portalId);
    if (!container) {
      container = document.createElement('div');
      container.id = portalId;
      // Changed positioning to center the bar in the middle of the page
      container.className = 'fixed inset-x-0 bottom-8 pointer-events-none z-50 flex items-center justify-center';
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
  }, [portalId]);

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

  const PageIcon = ICONS[config.icon] || ICONS['Bug'];

  console.log('Icon selection debug:', {
    configIcon: config.icon,
    selectedIcon: PageIcon?.name || 'unknown',
    availableIcons: Object.keys(ICONS)
  });

  const handleAction = async (actionId, actionConfig, selectedOption = null) => {
    const requiresConfirm = actionConfig.requiresConfirm || actionConfig.destructive;

    if (requiresConfirm && !confirmingActions.has(actionId)) {
      setConfirmingActions(prev => new Set([...prev, actionId]));
      // Reset confirmation after 3 seconds
      setTimeout(() => {
        setConfirmingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionId);
          return newSet;
        });
      }, 3000);
      return;
    }

    try {
      await onAction(actionId, selectedItems, actionConfig, selectedOption);
      onClearSelection();
      setConfirmingActions(new Set());
      setOpenDropdowns({});
    } catch (error) {
      console.error(`Error executing bulk action ${actionId}:`, error);
      setConfirmingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const handleDropdownSelect = (actionId, selectedOption) => {
    const action = config.groups
      .flatMap(group => group.actions)
      .find(act => act.id === actionId);

    if (action) {
      handleAction(actionId, action, selectedOption);
    }

    setOpenDropdowns(prev => ({ ...prev, [actionId]: false }));
  };

  const handleDropdownToggle = (actionId, isOpen) => {
    setOpenDropdowns(prev => ({ ...prev, [actionId]: isOpen }));
  };

  const handleCancel = () => {
    onClearSelection();
    setConfirmingActions(new Set());
    setOpenDropdowns({});
  };

  return createPortal(
    <div className="pointer-events-auto mx-2 sm:mx-4">
      <div className="bg-white border border-gray-300 rounded-xl shadow-xl px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Selection info */}
          <div className="flex items-center space-x-2 mr-3 sm:mr-4">
            <span className="text-xs sm:text-sm font-medium text-gray-800 whitespace-nowrap">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {config.groups.map((group, groupIndex) => (
              <div key={group.name || groupIndex} className="flex items-center space-x-1 sm:space-x-2">
                {group.actions.map((action) => {
                  const ActionIcon = ICONS[action.icon];
                  const isConfirming = confirmingActions.has(action.id);
                  const isLoading = loadingActions.includes(action.id);
                  const requiresConfirm = action.requiresConfirm || action.destructive;

                  // Handle select type actions
                  if (action.type === 'select') {
                    return (
                      <ActionDropdown
                        key={action.id}
                        action={action}
                        onSelect={handleDropdownSelect}
                        isOpen={openDropdowns[action.id] || false}
                        onToggle={(isOpen) => handleDropdownToggle(action.id, isOpen)}
                        disabled={isLoading}
                      />
                    );
                  }

                  // Regular action buttons
                  return (
                    <Tooltip key={action.id} text={isConfirming ? 'Click again to confirm' : action.label}>
                      <button
                        onClick={() => handleAction(action.id, action)}
                        disabled={isLoading}
                        className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${requiresConfirm
                            ? isConfirming
                              ? 'bg-red-600 text-white shadow-md animate-pulse'
                              : 'text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                          } focus:outline-none focus:ring-2 focus:ring-offset-1`}
                      >
                        <ActionIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </Tooltip>
                  );
                })}

                {/* Group separator */}
                {groupIndex < config.groups.length - 1 && (
                  <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
                )}
              </div>
            ))}

            {/* Cancel button */}
            <Tooltip text="Cancel selection">
              <button
                onClick={handleCancel}
                className="ml-2 sm:ml-4 w-8 h-8 sm:w-10 sm:h-10 inline-flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </Tooltip>
          </div>
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
};

export default EnhancedBulkActionsBar;