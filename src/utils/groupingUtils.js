/**
 * Utility functions for grouping items
 */

/**
 * Get available grouping options for a specific asset type
 * @param {string} assetType - The type of asset (bugs, testCases, recommendations, etc.)
 * @param {object} metadata - Additional metadata like sprints, modules, users
 * @returns {array} Array of grouping options
 */
export const getGroupingOptions = (assetType, metadata = {}) => {
  const { sprints = [], modules = [] } = metadata;

  const baseOptions = {
    bugs: [
      { id: 'status', label: 'Status', description: 'Group by bug status' },
      { id: 'severity', label: 'Severity', description: 'Group by severity level' },
      { id: 'priority', label: 'Priority', description: 'Group by priority' },
      { id: 'assignee', label: 'Assignee', description: 'Group by assigned person' },
      { id: 'category', label: 'Category', description: 'Group by category' },
      { id: 'date', label: 'Date Created', description: 'Group by creation date' },
    ],
    testCases: [
      { id: 'status', label: 'Status', description: 'Group by test status' },
      { id: 'priority', label: 'Priority', description: 'Group by priority' },
      { id: 'category', label: 'Category', description: 'Group by category' },
      { id: 'assignee', label: 'Assignee', description: 'Group by assigned person' },
      { id: 'date', label: 'Date Created', description: 'Group by creation date' },
    ],
    recommendations: [
      { id: 'status', label: 'Status', description: 'Group by status' },
      { id: 'priority', label: 'Priority', description: 'Group by priority' },
      { id: 'category', label: 'Category', description: 'Group by category' },
      { id: 'impact', label: 'Impact', description: 'Group by impact level' },
      { id: 'date', label: 'Date Created', description: 'Group by creation date' },
    ],
    sprints: [
      { id: 'status', label: 'Status', description: 'Group by sprint status' },
      { id: 'date', label: 'Date Range', description: 'Group by date range' },
    ],
    recordings: [
      { id: 'date', label: 'Date Recorded', description: 'Group by recording date' },
      { id: 'category', label: 'Category', description: 'Group by category' },
    ]
  };

  const options = baseOptions[assetType] || [];

  // Add sprint grouping if sprints are available
  if (sprints.length > 0 && ['bugs', 'testCases', 'recommendations'].includes(assetType)) {
    options.unshift({
      id: 'sprint',
      label: 'Sprint',
      description: 'Group by sprint',
      count: sprints.length
    });
  }

  // Add module grouping if modules are available
  if (modules.length > 0 && ['bugs', 'testCases', 'recommendations'].includes(assetType)) {
    options.splice(1, 0, {
      id: 'module',
      label: 'Module',
      description: 'Group by module/feature',
      count: modules.length
    });
  }

  return options;
};

/**
 * Get the display name for a group value
 * @param {string} groupBy - The grouping criteria
 * @param {string} value - The group value
 * @param {object} metadata - Additional metadata
 * @returns {string} Display name for the group
 */
export const getGroupDisplayName = (groupBy, value, metadata = {}) => {
  if (!value) return 'Unknown';

  switch (groupBy) {
    case 'sprint':
      const sprint = metadata.sprints?.find(s => s.id === value);
      return sprint?.name || `Sprint ${value.slice(0, 8)}`;
    
    case 'module':
      const moduleData = metadata.modules?.find(m => m.id === value);
      return moduleData?.name || `Module ${value.slice(0, 8)}`;
    
    case 'assignee':
      const user = metadata.users?.find(u => u.id === value || u.uid === value);
      return user?.displayName || user?.name || user?.email || 'Unknown User';
    
    case 'status':
    case 'priority':
    case 'severity':
    case 'category':
    case 'impact':
      return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
    
    case 'date':
      try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return 'Invalid Date';
      }
    
    default:
      return value;
  }
};

/**
 * Sort groups based on common sorting logic
 * @param {array} groups - Array of group keys
 * @param {string} groupBy - The grouping criteria
 * @returns {array} Sorted group keys
 */
export const sortGroups = (groups, groupBy) => {
  const priorityOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  };

  const statusOrder = {
    'open': 0,
    'in-progress': 1,
    'pending': 2,
    'resolved': 3,
    'closed': 4,
    'passed': 0,
    'failed': 1,
    'blocked': 2
  };

  return groups.sort((a, b) => {
    // Sort by priority/severity
    if (groupBy === 'priority' || groupBy === 'severity') {
      const orderA = priorityOrder[a.toLowerCase()] ?? 999;
      const orderB = priorityOrder[b.toLowerCase()] ?? 999;
      return orderA - orderB;
    }

    // Sort by status
    if (groupBy === 'status') {
      const orderA = statusOrder[a.toLowerCase()] ?? 999;
      const orderB = statusOrder[b.toLowerCase()] ?? 999;
      return orderA - orderB;
    }

    // Sort by date (newest first)
    if (groupBy === 'date') {
      return new Date(b) - new Date(a);
    }

    // Default alphabetical sort
    return a.localeCompare(b);
  });
};

export default {
  getGroupingOptions,
  getGroupDisplayName,
  sortGroups
};