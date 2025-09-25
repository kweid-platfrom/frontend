import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/context/AppProvider';
import { 
  Trash2, Archive, Download, Play, CheckCircle, XCircle, RotateCcw, 
  FileText, Bug, TestTube, Video, BarChart3, Lightbulb, Zap, 
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
  Lightbulb, Zap, Shield, RefreshCw, Eye, Users, Database, 
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
        name: 'status',
        actions: [
          { id: 'activate', label: 'Activate', icon: 'Eye', color: 'green' },
          { id: 'draft', label: 'Draft', icon: 'FileText', color: 'gray' }
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
          className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
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
  // Selection props - can be overridden by app context
  selectedItems: propSelectedItems,
  onClearSelection: propOnClearSelection,
  
  // Display props
  pageTitle = 'items',
  pageColor = 'blue',
  
  // Actions configuration - can use predefined or custom
  assetType = null, // Use predefined config: 'testCases', 'bugs', 'recordings', etc.
  actionGroups = [], // Custom action groups (overrides assetType)
  
  // Action handler - can be overridden by app context
  onAction: propOnAction,
  
  // Portal configuration
  portalId = 'bulk-actions-portal',
}) => {
  const [confirmingActions, setConfirmingActions] = useState(new Set());
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [portalContainer, setPortalContainer] = useState(null);

  // Use app context for bulk actions integration
  const { 
    state, 
    actions,
  } = useApp();

  // Get bulk actions from app context
  const {
    selectedItems: contextSelectedItems = [],
  } = state.bulkActions || {};

  const {
    clearBulkSelection,
    executeBulkAction
  } = actions.bulk || {};

  // Determine which selection and handlers to use
  const selectedItems = propSelectedItems || contextSelectedItems;
  const onClearSelection = propOnClearSelection || clearBulkSelection || (() => {});
  const onAction = propOnAction || executeBulkAction || (() => {});

  useEffect(() => {
    // Create or find portal container
    let container = document.getElementById(portalId);
    if (!container) {
      container = document.createElement('div');
      container.id = portalId;
      container.className = 'fixed inset-0 pointer-events-none z-50 flex items-end justify-center pb-8';
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
        color: pageColor,
        groups: actionGroups
      };
    }
    
    // Otherwise, use predefined asset config
    if (assetType && ASSET_ACTION_CONFIGS[assetType]) {
      const assetConfig = ASSET_ACTION_CONFIGS[assetType];
      console.log('Using predefined config for:', assetType, assetConfig);
      return {
        icon: assetConfig.icon,
        color: pageColor || assetConfig.color,
        groups: assetConfig.groups
      };
    }

    console.log('Using default config');
    // Default empty config
    return {
      color: pageColor,
      groups: []
    };
  }, [assetType, actionGroups, pageColor]);

  // Don't render if no items selected, no portal container, or no actions
  if (!portalContainer || selectedItems.length === 0 || config.groups.length === 0) {
    return null;
  }


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
      }, 5000);
      return;
    }

    try {
      // Show loading notification
      if (actions.ui?.showNotification) {
        actions.ui.showNotification({
          id: `bulk-action-${actionId}-${Date.now()}`,
          type: 'info',
          message: `Executing ${actionConfig.label.toLowerCase()} on ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}...`,
          duration: 2000,
        });
      }

      await onAction(actionId, selectedItems, actionConfig, selectedOption);
      onClearSelection();
      setConfirmingActions(new Set());
      setOpenDropdowns({});

      // Show success notification
      if (actions.ui?.showNotification) {
        actions.ui.showNotification({
          id: `bulk-action-success-${actionId}-${Date.now()}`,
          type: 'success',
          message: `Successfully ${actionConfig.label.toLowerCase()}${actionConfig.label.endsWith('e') ? 'd' : 'ed'} ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error(`Error executing bulk action ${actionId}:`, error);
      
      // Show error notification
      if (actions.ui?.showNotification) {
        actions.ui.showNotification({
          id: `bulk-action-error-${actionId}-${Date.now()}`,
          type: 'error',
          message: `Failed to ${actionConfig.label.toLowerCase()}: ${error.message}`,
          duration: 5000,
        });
      }
      
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
          <div className="flex items-center space-x-2 mr-8 sm:mr-4">
            <span className="text-xs sm:text-sm font-medium text-gray-800 whitespace-nowrap mr-8">
              {selectedItems.length} {pageTitle}{selectedItems.length > 1 ? 's' : ''} selected
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {config.groups.map((group, groupIndex) => (
              <div key={group.name || groupIndex} className="flex items-center space-x-1 sm:space-x-2">
                {group.actions.map((action) => {
                  const ActionIcon = ICONS[action.icon] || TestTube;
                  const isConfirming = confirmingActions.has(action.id);
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
                        disabled={false}
                      />
                    );
                  }

                  // Regular action buttons
                  return (
                    <Tooltip key={action.id} text={isConfirming ? 'Click again to confirm' : action.label}>
                      <button
                        onClick={() => handleAction(action.id, action)}
                        disabled={false}
                        className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                          requiresConfirm
                            ? isConfirming
                              ? 'bg-red-600 text-white shadow-md animate-pulse'
                              : 'text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-primary'
                        } focus:outline-none focus:ring-2 focus:ring-offset-1`}
                      >
                        <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4" />
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