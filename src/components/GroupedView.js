import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Reusable GroupedView Component
 * Displays items grouped and organized in collapsible sections
 */
const GroupedView = ({
  items = [],
  groupBy = null,
  renderItem,
  emptyMessage = "No items to display",
  className = "",
  defaultExpanded = true,
  groupMetadata = {}, // Additional data for groups (sprints, modules, etc.)
  onSelectionChange = null, // Callback when selection changes
  selectedItems: externalSelectedItems = null // External selection control
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [internalSelectedItems, setInternalSelectedItems] = useState(new Set());
  
  // Use external selection if provided, otherwise use internal
  const selectedItems = externalSelectedItems !== null 
    ? new Set(externalSelectedItems) 
    : internalSelectedItems;

  // Group items based on the groupBy criteria
  const groupedItems = useMemo(() => {
    if (!groupBy || !items.length) {
      return { ungrouped: items };
    }

    const groups = {};

    items.forEach(item => {
      let groupKey;
      let groupLabel;
      let groupColor;
      let groupIcon;

      switch (groupBy) {
        case 'sprint':
          groupKey = item.sprint_id || item.sprintId || 'no-sprint';
          if (groupKey === 'no-sprint') {
            groupLabel = 'No Sprint';
            groupColor = 'gray';
          } else {
            const sprint = groupMetadata.sprints?.find(s => s.id === groupKey);
            groupLabel = sprint?.name || `Sprint ${groupKey.slice(0, 8)}`;
            groupColor = 'purple';
            groupIcon = '🎯';
          }
          break;

         case 'module':
          groupKey = item.module_id || item.moduleId || 'no-module';
          if (groupKey === 'no-module') {
            groupLabel = 'No Module';
            groupColor = 'gray';
          } else {
            const moduleData = groupMetadata.modules?.find(m => m.id === groupKey);
            groupLabel = moduleData?.name || `Module ${groupKey.slice(0, 8)}`;
            groupColor = 'indigo';
            groupIcon = '📁';
          }
          break;

        case 'status':
          groupKey = item.status || 'no-status';
          groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace('-', ' ');
          groupColor = {
            'open': 'red',
            'in-progress': 'blue',
            'resolved': 'green',
            'closed': 'gray',
            'pending': 'yellow',
            'passed': 'green',
            'failed': 'red',
            'blocked': 'orange'
          }[groupKey] || 'gray';
          break;

        case 'priority':
          groupKey = item.priority || 'no-priority';
          groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
          groupColor = {
            'critical': 'red',
            'high': 'orange',
            'medium': 'yellow',
            'low': 'green'
          }[groupKey] || 'gray';
          groupIcon = '🚩';
          break;

        case 'severity':
          groupKey = item.severity || 'no-severity';
          groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
          groupColor = {
            'critical': 'red',
            'high': 'orange',
            'medium': 'yellow',
            'low': 'green'
          }[groupKey] || 'gray';
          groupIcon = '⚠️';
          break;

        case 'category':
          groupKey = item.category || 'no-category';
          groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace('-', ' ');
          groupColor = 'teal';
          groupIcon = '📂';
          break;

        case 'date':
          const date = item.created_at || item.createdAt;
          if (date) {
            const d = date.toDate ? date.toDate() : new Date(date);
            groupKey = d.toISOString().split('T')[0];
            groupLabel = d.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          } else {
            groupKey = 'no-date';
            groupLabel = 'No Date';
          }
          groupColor = 'blue';
          groupIcon = '📅';
          break;

        case 'assignee':
          groupKey = item.assignee || item.assigned_to || 'unassigned';
          if (groupKey === 'unassigned') {
            groupLabel = 'Unassigned';
            groupColor = 'gray';
          } else {
            const user = groupMetadata.users?.find(u => u.id === groupKey || u.uid === groupKey);
            groupLabel = user?.displayName || user?.name || user?.email || groupKey;
            groupColor = 'blue';
            groupIcon = '👤';
          }
          break;

        default:
          groupKey = 'all';
          groupLabel = 'All Items';
          groupColor = 'gray';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupLabel,
          color: groupColor,
          icon: groupIcon,
          items: []
        };
      }

      groups[groupKey].items.push(item);
    });

    return groups;
  }, [items, groupBy, groupMetadata]);

  // Initialize expanded state for all groups
  useMemo(() => {
    const initialExpanded = {};
    Object.keys(groupedItems).forEach(key => {
      if (expandedGroups[key] === undefined) {
        initialExpanded[key] = defaultExpanded;
      }
    });
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedGroups(prev => ({ ...prev, ...initialExpanded }));
    }
  }, [groupedItems, defaultExpanded]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const toggleItemSelection = (itemId, e) => {
    e?.stopPropagation();
    
    const newSelection = selectedItems.has(itemId)
      ? Array.from(selectedItems).filter(id => id !== itemId)
      : [...Array.from(selectedItems), itemId];
    
    if (externalSelectedItems !== null) {
      // Externally controlled - just notify parent
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
    } else {
      // Internally controlled
      setInternalSelectedItems(new Set(newSelection));
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
    }
  };

  const toggleGroupSelection = (groupKey, e) => {
    e?.stopPropagation();
    const group = groupedItems[groupKey];
    const groupItemIds = group.items.map(item => item.id);
    const allSelected = groupItemIds.every(id => selectedItems.has(id));

    if (externalSelectedItems !== null) {
      // Externally controlled
      let newSelection;
      if (allSelected) {
        newSelection = Array.from(selectedItems).filter(id => !groupItemIds.includes(id));
      } else {
        const currentSelection = Array.from(selectedItems);
        newSelection = [...new Set([...currentSelection, ...groupItemIds])];
      }
      
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
    } else {
      // Internally controlled
      setInternalSelectedItems(prev => {
        const newSet = new Set(prev);
        if (allSelected) {
          groupItemIds.forEach(id => newSet.delete(id));
        } else {
          groupItemIds.forEach(id => newSet.add(id));
        }
        
        if (onSelectionChange) {
          onSelectionChange(Array.from(newSet));
        }
        
        return newSet;
      });
    }
  };

  const selectAll = () => {
    const allItemIds = items.map(item => item.id);
    
    if (externalSelectedItems !== null) {
      if (onSelectionChange) {
        onSelectionChange(allItemIds);
      }
    } else {
      const newSet = new Set(allItemIds);
      setInternalSelectedItems(newSet);
      
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSet));
      }
    }
  };

  const deselectAll = () => {
    if (externalSelectedItems !== null) {
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    } else {
      setInternalSelectedItems(new Set());
      
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      teal: 'bg-teal-500',
      gray: 'bg-gray-400'
    };
    return colorMap[color] || colorMap.gray;
  };

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const groupKeys = Object.keys(groupedItems);
  const allSelected = items.length > 0 && items.every(item => selectedItems.has(item.id));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Select All Button */}
      {items.length > 0 && (
        <div className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={allSelected ? deselectAll : selectAll}
              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">
              {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select all'}
            </span>
          </div>
          {selectedItems.size > 0 && (
            <button
              onClick={deselectAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {groupKeys.map(groupKey => {
        const group = groupedItems[groupKey];
        const isExpanded = expandedGroups[groupKey] ?? defaultExpanded;
        const colorClass = getColorClasses(group.color);
        const groupItemIds = group.items.map(item => item.id);
        const allGroupSelected = groupItemIds.every(id => selectedItems.has(id));
        const someGroupSelected = groupItemIds.some(id => selectedItems.has(id)) && !allGroupSelected;

        return (
          <div key={groupKey} className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Group Header */}
            <div className="relative">
              {/* Colored left edge */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
              
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full pl-5 pr-4 py-3 flex items-center justify-between bg-muted hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    ref={input => {
                      if (input) input.indeterminate = someGroupSelected;
                    }}
                    onChange={(e) => toggleGroupSelection(groupKey, e)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                  />
                  <div className="transition-transform duration-200">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  {group.icon && (
                    <span className="text-lg">{group.icon}</span>
                  )}
                  <h3 className="font-semibold text-base text-foreground">
                    {group.label}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-background rounded-full text-sm font-medium text-foreground">
                  {group.items.length}
                </span>
              </button>
            </div>

            {/* Group Content */}
            {isExpanded && (
              <div className="bg-background relative">
                {group.items.map((item, index) => {
                  const isSelected = selectedItems.has(item.id);
                  
                  return (
                    <div 
                      key={item.id || index}
                      className="relative"
                    >
                      {/* Border line container - spans full width */}
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <div className="w-full h-px bg-border" />
                      </div>

                      {/* Content container */}
                      <div className="relative flex items-center">
                        {/* Checkbox with background to break the line */}
                        <div className="flex items-center pl-5 pr-4 py-4 bg-background z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleItemSelection(item.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                          />
                        </div>

                        {/* Item content - takes remaining width */}
                        <div className="flex-1 bg-background z-10 pr-4">
                          {renderItem(item, index, isSelected)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupedView;