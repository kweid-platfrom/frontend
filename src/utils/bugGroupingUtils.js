// utils/bugGroupingUtils.js
import { format, startOfMonth } from 'date-fns';

/**
 * Group bugs by month of creation
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by month
 */
export const groupBugsByMonth = (bugs) => {
    const grouped = {};
    
    bugs.forEach(bug => {
        const createdDate = bug.createdAt?.seconds 
            ? new Date(bug.createdAt.seconds * 1000) 
            : new Date(bug.createdAt) || new Date();
            
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
    const grouped = {};
    
    // Create groups for each sprint
    sprints.forEach(sprint => {
        grouped[sprint.id] = {
            label: sprint.name,
            sprint: sprint,
            bugs: [],
            count: 0
        };
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
        const sprintId = bug.sprintId || 'unassigned';
        
        if (grouped[sprintId]) {
            grouped[sprintId].bugs.push(bug);
            grouped[sprintId].count++;
        } else {
            // If sprint doesn't exist, add to unassigned
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
 * Group bugs by status with month breakdown
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Grouped bugs by status and month
 */
export const groupBugsByStatusAndMonth = (bugs) => {
    const grouped = {};
    
    bugs.forEach(bug => {
        const status = bug.status || 'Open';
        const createdDate = bug.createdAt?.seconds 
            ? new Date(bug.createdAt.seconds * 1000) 
            : new Date(bug.createdAt) || new Date();
            
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
    });
    
    return grouped;
};

/**
 * Get bug statistics for reporting
 * @param {Array} bugs - Array of bug objects
 * @returns {Object} - Bug statistics
 */
export const getBugStatistics = (bugs) => {
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
        // Status count
        const status = bug.status || 'Open';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        // Severity count
        const severity = bug.severity || 'Medium';
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
        
        // Month count
        const createdDate = bug.createdAt?.seconds 
            ? new Date(bug.createdAt.seconds * 1000) 
            : new Date(bug.createdAt) || new Date();
        const monthKey = format(startOfMonth(createdDate), 'yyyy-MM');
        stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;
        
        // Trends
        if (monthKey === thisMonth) {
            stats.trends.thisMonth++;
        }
        if (monthKey === lastMonth) {
            stats.trends.lastMonth++;
        }
        if (status.toLowerCase().includes('resolved') || status.toLowerCase().includes('closed')) {
            stats.trends.resolved++;
        } else {
            stats.trends.open++;
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
    return bugs.filter(bug => {
        const createdDate = bug.createdAt?.seconds 
            ? new Date(bug.createdAt.seconds * 1000) 
            : new Date(bug.createdAt) || new Date();
            
        return createdDate >= startDate && createdDate <= endDate;
    });
};