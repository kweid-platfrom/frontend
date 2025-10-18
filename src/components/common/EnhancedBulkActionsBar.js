import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2, Archive, Download, Play, CheckCircle, XCircle, RotateCcw,
  FileText, TestTube, Video, BarChart3, Lightbulb,
  Shield, RefreshCw, Eye, Users, Database, FolderOpen,
  GitBranch, Move, Copy, Star, Lock, Unlock, Mail, Bell,
  Calendar, Clock, Flag, Target, Link2, Bookmark, ChevronDown, X,
  AlertTriangle, Layers
} from 'lucide-react';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { useApp } from '../../context/AppProvider';

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "red" }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmColor === 'red' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
            <AlertTriangle className={`w-6 h-6 ${confirmColor === 'red' ? 'text-red-600' : 'text-yellow-600'
              }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${confirmColor === 'red'
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

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
  RotateCcw, FileText, BugAntIcon, TestTube, Video, BarChart3,
  Lightbulb, Target, Shield, RefreshCw, Eye, Users, Database,
  FolderOpen, GitBranch, Move, Copy, Star, Lock, Unlock,
  Mail, Bell, Calendar, Clock, Flag, Link2, Bookmark,
  ChevronDown, X, Layers
};

// Function to generate dynamic action configs with real sprint data
const generateAssetActionConfig = (assetType, sprints = [], users = [], modules = [], bugs = []) => {
  const sprintOptions = sprints.map(sprint => ({
    id: sprint.id,
    label: sprint.name,
    data: sprint
  }));

  const userOptions = users.map(user => ({
    id: user.id || user.uid,
    label: user.displayName || user.name || user.email,
    data: user
  }));

  const moduleOptions = modules.map(module => ({
    id: module.id,
    label: module.name,
    data: module
  }));

  const bugOptions = bugs.map(bug => ({
    id: bug.id,
    label: bug.title,
    data: bug
  }));

  const groupingOptions = [
    { id: 'sprint', label: 'Group by Sprint' },
    { id: 'module', label: 'Group by Module/Feature' },
    { id: 'date', label: 'Group by Date' },
    { id: 'category', label: 'Group by Category' },
    { id: 'status', label: 'Group by Status' },
    { id: 'priority', label: 'Group by Priority' }
  ];

  const configs = {
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
            ...(sprintOptions.length > 0 ? [{
              id: 'add-to-sprint',
              label: 'Add to Sprint',
              icon: 'Target',
              color: 'purple',
              type: 'select',
              options: sprintOptions
            }] : []),
            ...(moduleOptions.length > 0 ? [{
              id: 'add-to-module',
              label: 'Add to Module',
              icon: 'FolderOpen',
              color: 'indigo',
              type: 'select',
              options: moduleOptions
            }] : []),
            ...(userOptions.length > 0 ? [{
              id: 'assign',
              label: 'Assign',
              icon: 'Users',
              color: 'blue',
              type: 'select',
              options: userOptions
            }] : []),
            {
              id: 'group',
              label: 'Group Items',
              icon: 'Layers',
              color: 'teal',
              type: 'select',
              options: groupingOptions
            }
          ]
        },
        {
          name: 'status',
          actions: [
            { id: 'activate', label: 'Activate', icon: 'Eye', color: 'green' },
            { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true, confirmMessage: 'Archive selected test cases?' }
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Delete selected test cases?' }
          ]
        }
      ]
    },

    bugs: {
      icon: 'BugAntIcon',
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
            ...(userOptions.length > 0 ? [{
              id: 'assign',
              label: 'Assign',
              icon: 'Users',
              color: 'blue',
              type: 'select',
              options: userOptions
            }] : []),
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
            ...(sprintOptions.length > 0 ? [{
              id: 'add-to-sprint',
              label: 'Add to Sprint',
              icon: 'Target',
              color: 'purple',
              type: 'select',
              options: sprintOptions
            }] : []),
            ...(moduleOptions.length > 0 ? [{
              id: 'add-to-module',
              label: 'Add to Module',
              icon: 'FolderOpen',
              color: 'indigo',
              type: 'select',
              options: moduleOptions
            }] : []),
            {
              id: 'group',
              label: 'Group Items',
              icon: 'Layers',
              color: 'teal',
              type: 'select',
              options: groupingOptions
            }
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true, confirmMessage: 'Archive selected bugs?' },
            { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Delete selected bugs?' }
          ]
        }
      ]
    },

    // ✅ UPDATED: Recordings config - NO sprint addition, only bug linking
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
          name: 'linking',
          actions: [
            // Recordings are evidence - they get linked to bugs, not sprints
            ...(bugOptions.length > 0 ? [{
              id: 'link-to-bug',
              label: 'Link to Bug',
              icon: 'Link2',
              color: 'red',
              type: 'select',
              options: bugOptions
            }] : [])
          ]
        },
        {
          name: 'organization',
          actions: [
            { id: 'bookmark', label: 'Bookmark', icon: 'Bookmark', color: 'yellow' },
            {
              id: 'group',
              label: 'Group Items',
              icon: 'Layers',
              color: 'teal',
              type: 'select',
              options: groupingOptions
            }
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true, confirmMessage: 'Archive selected recordings?' },
            { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Delete selected recordings?' }
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
            ...(sprintOptions.length > 0 ? [{
              id: 'add-to-sprint',
              label: 'Add to Sprint',
              icon: 'Target',
              color: 'purple',
              type: 'select',
              options: sprintOptions
            }] : []),
            ...(userOptions.length > 0 ? [{
              id: 'assign',
              label: 'Assign',
              icon: 'Users',
              color: 'blue',
              type: 'select',
              options: userOptions
            }] : []),
            {
              id: 'priority',
              label: 'Set Priority',
              icon: 'Flag',
              color: 'orange',
              type: 'select',
              options: [
                { id: 'critical', label: 'Critical' },
                { id: 'high', label: 'High' },
                { id: 'medium', label: 'Medium' },
                { id: 'low', label: 'Low' }
              ]
            },
            {
              id: 'group',
              label: 'Group Items',
              icon: 'Layers',
              color: 'teal',
              type: 'select',
              options: groupingOptions
            }
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true, confirmMessage: 'Archive selected recommendations?' },
            { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Delete selected recommendations?' }
          ]
        }
      ]
    },

    sprints: {
      icon: 'Target',
      color: 'purple',
      groups: [
        {
          name: 'status',
          actions: [
            { id: 'start', label: 'Start Sprint', icon: 'Play', color: 'green' },
            { id: 'complete', label: 'Complete Sprint', icon: 'CheckCircle', color: 'blue' },
            { id: 'close', label: 'Close Sprint', icon: 'XCircle', color: 'gray' }
          ]
        },
        {
          name: 'organization',
          actions: [
            {
              id: 'group',
              label: 'Group Items',
              icon: 'Layers',
              color: 'teal',
              type: 'select',
              options: [
                { id: 'date', label: 'Group by Date' },
                { id: 'status', label: 'Group by Status' }
              ]
            }
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'archive', label: 'Archive', icon: 'Archive', color: 'gray', requiresConfirm: true, confirmMessage: 'Archive selected sprints?' },
            { id: 'delete', label: 'Delete', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Delete selected sprints?' }
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
            ...(sprintOptions.length > 0 ? [{
              id: 'restore-to-sprint',
              label: 'Restore to Sprint',
              icon: 'Target',
              color: 'purple',
              type: 'select',
              options: sprintOptions
            }] : [])
          ]
        },
        {
          name: 'actions',
          actions: [
            { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Permanently delete selected items? This cannot be undone.' }
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
            { id: 'permanent-delete', label: 'Delete Forever', icon: 'Trash2', color: 'red', destructive: true, confirmMessage: 'Permanently delete selected items? This cannot be undone.' }
          ]
        }
      ]
    }
  };

  return configs[assetType] || { groups: [] };
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
          disabled={disabled || !action.options || action.options.length === 0}
          className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <ChevronDown className={`w-2 h-2 sm:w-3 sm:h-3 absolute -bottom-0.5 -right-0.5 bg-white rounded-full border border-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </Tooltip>

      {isOpen && action.options && action.options.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="py-1">
            {action.options.map((option) => (
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
  selectedItems = [],
  onClearSelection,
  assetType = null,
  actionGroups = [],
  onAction,
  portalId = 'bulk-actions-portal',
  loadingActions = [],
}) => {
  const { state } = useApp();
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [portalContainer, setPortalContainer] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, config: null, option: null });

  useEffect(() => {
    let container = document.getElementById(portalId);
    if (!container) {
      container = document.createElement('div');
      container.id = portalId;
      container.className = 'fixed inset-x-0 bottom-8 pointer-events-none z-50 flex items-center justify-center';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      const existingContainer = document.getElementById(portalId);
      if (existingContainer && existingContainer.children.length === 0) {
        document.body.removeChild(existingContainer);
      }
    };
  }, [portalId]);

  const sprints = useMemo(() => {
    return state.sprints?.sprints || [];
  }, [state.sprints]);

  const teamMembers = useMemo(() => {
    return state.team?.members || [];
  }, [state.team]);

  const modules = useMemo(() => {
    return state.modules?.modules || [];
  }, [state.modules]);

  const config = useMemo(() => {
    if (actionGroups.length > 0) {
      return { groups: actionGroups };
    }

    if (assetType) {
      return generateAssetActionConfig(assetType, sprints, teamMembers, modules);
    }

    return { groups: [] };
  }, [assetType, actionGroups, sprints, teamMembers, modules]);

  if (!portalContainer || config.groups.length === 0 || selectedItems.length === 0) {
    return null;
  }

  const handleAction = async (actionId, actionConfig, selectedOption = null) => {
    const requiresConfirm = actionConfig.requiresConfirm || actionConfig.destructive;

    if (requiresConfirm) {
      setConfirmDialog({
        isOpen: true,
        action: actionId,
        config: actionConfig,
        option: selectedOption
      });
      return;
    }

    executeAction(actionId, actionConfig, selectedOption);
  };

  const executeAction = async (actionId, actionConfig, selectedOption = null) => {
    try {
      await onAction(actionId, selectedItems, actionConfig, selectedOption);
      onClearSelection();
      setOpenDropdowns({});
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleConfirmDialogConfirm = () => {
    const { action, config, option } = confirmDialog;
    setConfirmDialog({ isOpen: false, action: null, config: null, option: null });
    executeAction(action, config, option);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({ isOpen: false, action: null, config: null, option: null });
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
    setOpenDropdowns({});
  };

  return createPortal(
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleConfirmDialogClose}
        onConfirm={handleConfirmDialogConfirm}
        title={confirmDialog.config?.destructive ? "Confirm Deletion" : "Confirm Action"}
        message={confirmDialog.config?.confirmMessage || "Are you sure you want to proceed with this action?"}
        confirmText={confirmDialog.config?.destructive ? "Delete" : "Confirm"}
        confirmColor={confirmDialog.config?.destructive ? "red" : "yellow"}
      />

      <div className="pointer-events-auto mx-2 sm:mx-4">
        <div className="bg-white border border-gray-300 rounded-md shadow-xl px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 mr-3 sm:mr-4">
              <span className="text-xs sm:text-sm font-medium text-gray-800 whitespace-nowrap">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {config.groups.map((group, groupIndex) => (
                <div key={group.name || groupIndex} className="flex items-center space-x-1 sm:space-x-2">
                  {group.actions.map((action) => {
                    const ActionIcon = ICONS[action.icon];
                    const isLoading = loadingActions.includes(action.id);

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

                    return (
                      <Tooltip key={action.id} text={action.label}>
                        <button
                          onClick={() => handleAction(action.id, action)}
                          disabled={isLoading}
                          className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${action.destructive || action.requiresConfirm
                            ? 'text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-1`}
                        >
                          <ActionIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </Tooltip>
                    );
                  })}

                  {groupIndex < config.groups.length - 1 && (
                    <div className="w-px h-4 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1" />
                  )}
                </div>
              ))}

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
      </div>
    </>,
    portalContainer
  );
};

export default EnhancedBulkActionsBar;