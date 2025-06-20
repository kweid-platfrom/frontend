// utils/bugGroupingUtils.js
import { format, startOfMonth } from 'date-fns';

/**
 * Group bugs by month of creation
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by month
 */
export const groupBugsByMonth = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsByMonth: Invalid bugs array provided');
        return {};
    }

    const grouped = {};
    
    bugs.forEach(bug => {
        try {
            let createdDate;
            
            // Handle different date formats more robustly
            if (bug.createdAt?.seconds) {
                // Firestore timestamp
                createdDate = new Date(bug.createdAt.seconds * 1000);
            } else if (bug.createdAt?.toDate) {
                // Firestore timestamp object with toDate method
                createdDate = bug.createdAt.toDate();
            } else if (bug.createdAt) {
                // Regular date string or Date object
                createdDate = new Date(bug.createdAt);
            } else {
                // Fallback to current date
                createdDate = new Date();
                console.warn(`Bug ${bug.id} has no createdAt date, using current date`);
            }
            
            // Validate the date
            if (isNaN(createdDate.getTime())) {
                createdDate = new Date();
                console.warn(`Bug ${bug.id} has invalid createdAt date, using current date`);
            }
            
            const monthKey = format(startOfMonth(createdDate), 'yyyy-MM');
            const monthLabel = format(createdDate, 'MMMM yyyy');
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    label: monthLabel,
                    bugs: [],
                    count: 0
                };
            }
            
            grouped[monthKey].bugs.push(bug);
            grouped[monthKey].count++;
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsByMonth:`, error);
        }
    });
    
    // Sort by month (newest first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
    });
    
    return sortedGrouped;
};

/**
 * Group bugs by sprint
 * @param {Array} bugs - Array of bug objects
 * @param {Array} sprints - Array of sprint objects
 * @returns {Object} - Grouped bugs by sprint
 */
export const groupBugsBySprint = (bugs, sprints) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsBySprint: Invalid bugs array provided');
        return {};
    }
    
    if (!sprints || !Array.isArray(sprints)) {
        console.warn('groupBugsBySprint: Invalid sprints array provided');
        sprints = [];
    }

    const grouped = {};
    
    // Create groups for each sprint
    sprints.forEach(sprint => {
        if (sprint && sprint.id) {
            grouped[sprint.id] = {
                label: sprint.name || `Sprint ${sprint.id}`,
                sprint: sprint,
                bugs: [],
                count: 0
            };
        }
    });
    
    // Add unassigned group
    grouped['unassigned'] = {
        label: 'Unassigned',
        sprint: null,
        bugs: [],
        count: 0
    };
    
    // Group bugs
    bugs.forEach(bug => {
        try {
            let sprintId = bug.sprintId || bug.sprint_id || bug.sprint?.id || 'unassigned';
            
            // Handle case where sprintId might be an object
            if (typeof sprintId === 'object' && sprintId.id) {
                sprintId = sprintId.id;
            }
            
            // Ensure sprintId is a string
            sprintId = String(sprintId);
            
            if (grouped[sprintId]) {
                grouped[sprintId].bugs.push(bug);
                grouped[sprintId].count++;
            } else {
                // If sprint doesn't exist, add to unassigned
                grouped['unassigned'].bugs.push(bug);
                grouped['unassigned'].count++;
                console.warn(`Bug ${bug.id} assigned to unknown sprint ${sprintId}, moved to unassigned`);
            }
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsBySprint:`, error);
            // Add to unassigned on error
            grouped['unassigned'].bugs.push(bug);
            grouped['unassigned'].count++;
        }
    });
    
    // Remove empty sprint groups (except unassigned)
    Object.keys(grouped).forEach(key => {
        if (key !== 'unassigned' && grouped[key].count === 0) {
            delete grouped[key];
        }
    });
    
    return grouped;
};

/**
 * Group bugs by status
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by status
 */
export const groupBugsByStatus = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsByStatus: Invalid bugs array provided');
        return {};
    }

    const grouped = {};
    
    bugs.forEach(bug => {
        try {
            const status = bug.status || 'Open';
            
            if (!grouped[status]) {
                grouped[status] = {
                    label: status,
                    bugs: [],
                    count: 0
                };
            }
            
            grouped[status].bugs.push(bug);
            grouped[status].count++;
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsByStatus:`, error);
        }
    });
    
    return grouped;
};

/**
 * Group bugs by severity
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by severity
 */
export const groupBugsBySeverity = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsBySeverity: Invalid bugs array provided');
        return {};
    }

    const grouped = {};
    const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
    
    bugs.forEach(bug => {
        try {
            const severity = bug.severity || 'Medium';
            
            if (!grouped[severity]) {
                grouped[severity] = {
                    label: severity,
                    bugs: [],
                    count: 0
                };
            }
            
            grouped[severity].bugs.push(bug);
            grouped[severity].count++;
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsBySeverity:`, error);
        }
    });
    
    // Sort by severity order
    const sortedGrouped = {};
    severityOrder.forEach(severity => {
        if (grouped[severity]) {
            sortedGrouped[severity] = grouped[severity];
        }
    });
    
    // Add any remaining severities not in the standard order
    Object.keys(grouped).forEach(severity => {
        if (!severityOrder.includes(severity)) {
            sortedGrouped[severity] = grouped[severity];
        }
    });
    
    return sortedGrouped;
};

/**
 * Group bugs by assignee
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by assignee
 */
export const groupBugsByAssignee = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsByAssignee: Invalid bugs array provided');
        return {};
    }

    const grouped = {};
    
    bugs.forEach(bug => {
        try {
            const assignee = bug.assignedTo || bug.assigned_to || 'Unassigned';
            
            if (!grouped[assignee]) {
                grouped[assignee] = {
                    label: assignee,
                    bugs: [],
                    count: 0
                };
            }
            
            grouped[assignee].bugs.push(bug);
            grouped[assignee].count++;
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsByAssignee:`, error);
        }
    });
    
    return grouped;
};

/**
 * Group bugs by status with month breakdown
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by status and month
 */
export const groupBugsByStatusAndMonth = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsByStatusAndMonth: Invalid bugs array provided');
        return {};
    }

    const grouped = {};
    
    bugs.forEach(bug => {
        try {
            const status = bug.status || 'Open';
            
            let createdDate;
            if (bug.createdAt?.seconds) {
                createdDate = new Date(bug.createdAt.seconds * 1000);
            } else if (bug.createdAt?.toDate) {
                createdDate = bug.createdAt.toDate();
            } else if (bug.createdAt) {
                createdDate = new Date(bug.createdAt);
            } else {
                createdDate = new Date();
            }
            
            if (isNaN(createdDate.getTime())) {
                createdDate = new Date();
            }
            
            const monthKey = format(startOfMonth(createdDate), 'yyyy-MM');
            const monthLabel = format(createdDate, 'MMM yyyy');
            
            if (!grouped[status]) {
                grouped[status] = {};
            }
            
            if (!grouped[status][monthKey]) {
                grouped[status][monthKey] = {
                    label: monthLabel,
                    bugs: [],
                    count: 0
                };
            }
            
            grouped[status][monthKey].bugs.push(bug);
            grouped[status][monthKey].count++;
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in groupBugsByStatusAndMonth:`, error);
        }
    });
    
    return grouped;
};

/**
 * Generic grouping function
 * @param {Array} bugs - Array of bug objects
 * @param {string} groupBy - Field to group by
 * @returns {Object} - Grouped bugs
 */
export const groupBugsBy = (bugs, groupBy) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('groupBugsBy: Invalid bugs array provided');
        return {};
    }

    if (!groupBy) {
        console.warn('groupBugsBy: No groupBy field specified');
        return { all: { label: 'All Bugs', bugs, count: bugs.length } };
    }

    switch (groupBy.toLowerCase()) {
        case 'month':
            return groupBugsByMonth(bugs);
        case 'sprint':
            console.warn('groupBugsBy: Sprint grouping requires sprints array, use groupBugsBySprint instead');
            return {};
        case 'status':
            return groupBugsByStatus(bugs);
        case 'severity':
            return groupBugsBySeverity(bugs);
        case 'assignee':
        case 'assigned_to':
        case 'assignedto':
            return groupBugsByAssignee(bugs);
        default:
            // Generic grouping by any field
            const grouped = {};
            
            bugs.forEach(bug => {
                try {
                    let groupValue = bug[groupBy];
                    
                    // Handle nested properties (e.g., 'user.name')
                    if (groupBy.includes('.')) {
                        const keys = groupBy.split('.');
                        groupValue = keys.reduce((obj, key) => obj?.[key], bug);
                    }
                    
                    groupValue = groupValue || 'Other';
                    
                    if (!grouped[groupValue]) {
                        grouped[groupValue] = {
                            label: groupValue,
                            bugs: [],
                            count: 0
                        };
                    }
                    
                    grouped[groupValue].bugs.push(bug);
                    grouped[groupValue].count++;
                } catch (error) {
                    console.error(`Error processing bug ${bug.id} in generic grouping:`, error);
                }
            });
            
            return grouped;
    }
};

/**
 * Get bug statistics for reporting
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Bug statistics
 */
export const getBugStatistics = (bugs) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('getBugStatistics: Invalid bugs array provided');
        return {
            total: 0,
            byStatus: {},
            bySeverity: {},
            byMonth: {},
            trends: { thisMonth: 0, lastMonth: 0, resolved: 0, open: 0 }
        };
    }

    const stats = {
        total: bugs.length,
        byStatus: {},
        bySeverity: {},
        byMonth: {},
        trends: {
            thisMonth: 0,
            lastMonth: 0,
            resolved: 0,
            open: 0
        }
    };
    
    const thisMonth = format(new Date(), 'yyyy-MM');
    const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM');
    
    bugs.forEach(bug => {
        try {
            // Status count
            const status = bug.status || 'Open';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            // Severity count
            const severity = bug.severity || 'Medium';
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
            
            // Month count
            let createdDate;
            if (bug.createdAt?.seconds) {
                createdDate = new Date(bug.createdAt.seconds * 1000);
            } else if (bug.createdAt?.toDate) {
                createdDate = bug.createdAt.toDate();
            } else if (bug.createdAt) {
                createdDate = new Date(bug.createdAt);
            } else {
                createdDate = new Date();
            }
            
            if (isNaN(createdDate.getTime())) {
                createdDate = new Date();
            }
            
            const monthKey = format(startOfMonth(createdDate), 'yyyy-MM');
            stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
            
            // Trends
            if (monthKey === thisMonth) {
                stats.trends.thisMonth++;
            }
            if (monthKey === lastMonth) {
                stats.trends.lastMonth++;
            }
            if (status.toLowerCase().includes('resolved') || 
                status.toLowerCase().includes('closed') || 
                status.toLowerCase().includes('fixed')) {
                stats.trends.resolved++;
            } else {
                stats.trends.open++;
            }
        } catch (error) {
            console.error(`Error processing bug ${bug.id} in getBugStatistics:`, error);
        }
    });
    
    return stats;
};

/**
 * Filter bugs by date range
 * @param {Array} bugs - Array of bug objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Filtered bugs
 */
export const filterBugsByDateRange = (bugs, startDate, endDate) => {
    if (!bugs || !Array.isArray(bugs)) {
        console.warn('filterBugsByDateRange: Invalid bugs array provided');
        return [];
    }

    if (!startDate || !endDate) {
        console.warn('filterBugsByDateRange: Invalid date range provided');
        return bugs;
    }

    return bugs.filter(bug => {
        try {
            let createdDate;
            if (bug.createdAt?.seconds) {
                createdDate = new Date(bug.createdAt.seconds * 1000);
            } else if (bug.createdAt?.toDate) {
                createdDate = bug.createdAt.toDate();
            } else if (bug.createdAt) {
                createdDate = new Date(bug.createdAt);
            } else {
                return false; // Skip bugs without creation date
            }
            
            if (isNaN(createdDate.getTime())) {
                return false; // Skip bugs with invalid dates
            }
            
            return createdDate >= startDate && createdDate <= endDate;
        } catch (error) {
            console.error(`Error filtering bug ${bug.id} by date range:`, error);
            return false;
        }
    });
};