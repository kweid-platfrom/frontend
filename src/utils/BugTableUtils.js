import {
    getStatusColor,
    getPriorityColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    formatDate,
    getTeamMemberName,
    getEvidenceCount,
} from '@/utils/bugUtils';

// Constants
export const VALID_BUG_STATUSES = ['New', 'In Progress', 'Blocked', 'Resolved', 'Closed'];
export const VALID_BUG_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];

// Utility to safely extract device info
export const getDeviceInfoDisplay = (deviceInfo) => {
    if (!deviceInfo) return 'Unknown';
    if (typeof deviceInfo === 'string') return deviceInfo.split(',')[0] || 'Unknown';
    if (typeof deviceInfo === 'object' && deviceInfo !== null) {
        return (
            deviceInfo.device ||
            deviceInfo.name ||
            deviceInfo.model ||
            deviceInfo.browser ||
            deviceInfo.version ||
            'Unknown'
        );
    }
    return String(deviceInfo).split(',')[0] || 'Unknown';
};

// Utility to format bug ID
export const getUserFriendlyBugId = (bugId) => {
    if (!bugId) return 'Unknown';
    return `BUG-${bugId.slice(-6).toUpperCase()}`;
};

// Utility to safely format dates
export const formatDateSafe = (date) => {
    if (!date) return 'Not set';
    try {
        if (date.toDate) return formatDate(date.toDate());
        if (date instanceof Date) return formatDate(date);
        if (typeof date === 'string') return formatDate(new Date(date));
        return 'Invalid date';
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

// Utility to get reporter's first name
export const getReporterFirstName = (reporterData) => {
    if (!reporterData) return 'Unknown';
    if (typeof reporterData === 'string') {
        const emailMatch = reporterData.split('@')[0];
        return emailMatch.split('.')[0].replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() + emailMatch.split('.')[0].slice(1) || 'Unknown';
    }
    if (typeof reporterData === 'object' && reporterData !== null) {
        return (
            reporterData.first_name ||
            reporterData.name?.split(' ')[0] ||
            reporterData.email?.split('@')[0]?.split('.')[0]?.replace(/[^a-zA-Z]/g, '')?.charAt(0).toUpperCase() +
                reporterData.email?.split('@')[0]?.split('.')[0]?.slice(1) ||
            'Unknown'
        );
    }
    return 'Unknown';
};

// Utility to sort bugs
export const sortBugs = (bugs, sortConfig) => {
    return [...bugs].sort((a, b) => {
        if (sortConfig.key) {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
            if (['updated_at', 'created_at', 'due_date'].includes(sortConfig.key)) {
                const aDate = aValue instanceof Date ? aValue : new Date(aValue);
                const bDate = bValue instanceof Date ? bValue : new Date(bValue);
                if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
                if (isNaN(aDate.getTime())) return 1;
                if (isNaN(bDate.getTime())) return -1;
                return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
};

// Re-export imported utilities
export {
    getStatusColor,
    getPriorityColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    formatDate,
    getTeamMemberName,
    getEvidenceCount,
};