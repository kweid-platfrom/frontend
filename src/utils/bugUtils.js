// utils/bugUtils.js

/**
 * Status color mappings
 */
export const getStatusColor = (status) => {
    const statusColors = {
        'New': 'bg-blue-100 text-blue-800',
        'Open': 'bg-green-100 text-green-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Blocked': 'bg-red-100 text-red-800',
        'Resolved': 'bg-purple-100 text-purple-800',
        'Closed': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Severity color mappings
 */
export const getSeverityColor = (severity) => {
    const severityColors = {
        'Critical': 'bg-red-100 text-red-800',
        'High': 'bg-orange-100 text-orange-800',
        'Medium': 'bg-yellow-100 text-yellow-800',
        'Low': 'bg-green-100 text-green-800'
    };
    return severityColors[severity] || 'bg-gray-100 text-gray-800';
};

/**
 * Priority color mappings
 */
export const getPriorityColor = (priority) => {
    const priorityColors = {
        'Critical': 'bg-red-100 text-red-800',
        'High': 'bg-orange-100 text-orange-800',
        'Medium': 'bg-yellow-100 text-yellow-800',
        'Low': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
};


/**
 * Frequency color mappings
 */
export const getFrequencyColor = (frequency) => {
    const frequencyColors = {
        'Always': 'bg-red-100 text-red-800',
        'always': 'bg-red-100 text-red-800',
        'Often': 'bg-orange-100 text-orange-800',
        'often': 'bg-orange-100 text-orange-800',
        'Sometimes': 'bg-yellow-100 text-yellow-800',
        'sometimes': 'bg-yellow-100 text-yellow-800',
        'Rarely': 'bg-green-100 text-green-800',
        'rarely': 'bg-green-100 text-green-800',
        'Once': 'bg-gray-100 text-gray-800',
        'once': 'bg-gray-100 text-gray-800',
        'Unknown': 'bg-gray-100 text-gray-800',
        'unknown': 'bg-gray-100 text-gray-800'
    };
    return frequencyColors[frequency] || 'bg-gray-100 text-gray-800';
};

/**
 * Source color mappings
 */
export const getSourceColor = (source) => {
    const sourceColors = {
        'manual': 'bg-blue-100 text-blue-800',
        'Manual': 'bg-blue-100 text-blue-800',
        'automated': 'bg-purple-100 text-purple-800',
        'Automated': 'bg-purple-100 text-purple-800'
    };
    return sourceColors[source] || 'bg-gray-100 text-gray-800';
};

/**
 * Auto-determine priority based on severity
 * Updated to map severity directly to priority
 */
export const getPriorityFromSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
        case 'critical':
            return 'Critical';
        case 'high':
            return 'High';
        case 'medium':
            return 'Medium';
        case 'low':
            return 'Low';
        default:
            return 'Medium';
    }
};

/**
 * Check if a date is past due
 */
export const isPastDue = (dueDate) => {
    if (!dueDate) return false;
    const date = dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
    return date < new Date();
};

/**
 * Format date consistently across the app
 */
export const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";

    if (ua.includes("Chrome")) {
        browser = "Chrome";
        version = ua.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Firefox")) {
        browser = "Firefox";
        version = ua.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        browser = "Safari";
        version = ua.match(/Version\/(\d+)/)?.[1] || "Unknown";
    } else if (ua.includes("Edge")) {
        browser = "Edge";
        version = ua.match(/Edge\/(\d+)/)?.[1] || "Unknown";
    }

    return `${browser} ${version}`;
};

/**
 * Get device information
 */
export const getDeviceInfo = () => {
    const platform = navigator.platform || "Unknown";
    const screenResolution = `${screen.width}x${screen.height}`;
    const colorDepth = screen.colorDepth;
    const language = navigator.language || "Unknown";
    
    return `${platform}, ${screenResolution}, ${colorDepth}-bit, ${language}`;
};

/**
 * Find team member name by ID or email
 */
export const getTeamMemberName = (identifier, teamMembers = []) => {
    if (!identifier) return 'Unassigned';
    
    // Try to find by email first
    const memberByEmail = teamMembers.find(member => 
        member.email === identifier
    );
    
    if (memberByEmail) return memberByEmail.name;
    
    // Try to find by ID
    const memberById = teamMembers.find(member => 
        member.id === identifier
    );
    
    if (memberById) return memberById.name;
    
    // If it's an email, return the part before @
    if (typeof identifier === 'string' && identifier.includes('@')) {
        return identifier.split('@')[0];
    }
    
    return identifier || 'Unknown';
};

/**
 * Get assigned user (with fallback logic)
 */
export const getAssignedUser = (bug) => {
    return bug.assignedTo || bug.reportedByName || bug.createdBy;
};

/**
 * Validate bug form data
 */
export const validateBugForm = (formData) => {
    const errors = [];
    
    if (!formData.title?.trim()) {
        errors.push('Title is required');
    }
    
    if (!formData.description?.trim()) {
        errors.push('Description is required');
    }
    
    if (!formData.actualBehavior?.trim()) {
        errors.push('Actual behavior description is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Calculate evidence count from bug data
 */
export const getEvidenceCount = (bug) => {
    return [
        bug.hasAttachments,
        bug.hasVideoEvidence,
        bug.hasConsoleLogs,
        bug.hasNetworkLogs
    ].filter(Boolean).length;
};

/**
 * Generate a short bug ID from full ID
 */
export const getShortBugId = (bugId) => {
    if (!bugId) return 'N/A';
    return bugId.slice(-6);
};

/**
 * Valid bug statuses
 */
export const VALID_BUG_STATUSES = ['New', 'Open', 'In Progress', 'Blocked', 'Resolved', 'Closed'];

/**
 * Valid bug severities (updated order from most to least severe)
 */
export const VALID_BUG_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Valid bug priorities (updated to match severity levels)
 */
export const VALID_BUG_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

/**
 * Valid environments - Updated to use capitalized versions for consistency
 */
export const VALID_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

/**
 * Valid frequencies
 */
export const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once', 'Unknown'];

/**
 * Default form data for bug creation
 */
export const DEFAULT_BUG_FORM_DATA = {
    title: "",
    category: "UI Issue",
    description: "",
    stepsToReproduce: "",
    severity: "Low",
    assignedTo: "",
    source: "Web App",
    hasVideoEvidence: false,
    hasConsoleLogs: false,
    hasNetworkLogs: false,
    environment: "Development",
    browserInfo: "",
    deviceInfo: "",
    userAgent: "",
    expectedBehavior: "",
    actualBehavior: "",
    workaround: "",
    frequency: "Always"
};