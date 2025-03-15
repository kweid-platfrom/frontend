
"use client"

// Get color scheme from localStorage or use default
export const getColorScheme = () => {
    if (typeof window !== 'undefined') {
        const savedColors = localStorage.getItem('bugTrackerColorScheme');
        if (savedColors) {
            return JSON.parse(savedColors);
        }
    }

    return {
        groupColors: {
            "04/2025": "#3498db",
            "03/2025": "#2ecc71",
        },
        statusColors: {
            'open': 'bg-blue-500',
            'in progress': 'bg-yellow-500',
            'resolved': 'bg-green-500',
            'closed': 'bg-gray-500',
            'under review': 'bg-purple-500',
            'needs info': 'bg-orange-500',
        },
        priorityColors: {
            'high': 'bg-red-600',
            'medium': 'bg-orange-500',
            'low': 'bg-green-600',
        },
        severityColors: {
            'critical': 'bg-purple-700',
            'major': 'bg-red-500',
            'minor': 'bg-yellow-600',
            'cosmetic': 'bg-blue-400',
        }
    };
};

// Save the entire color scheme to localStorage
export const saveColorScheme = (colorScheme) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('bugTrackerColorScheme', JSON.stringify(colorScheme));
    }
};

// Helper functions to get colors for specific items
export const getStatusColor = (status, colorScheme) => {
    const statusLower = status.toLowerCase();
    return colorScheme.statusColors[statusLower] || 'bg-blue-500';
};

export const getPriorityColor = (priority, colorScheme) => {
    const priorityLower = priority.toLowerCase();
    return colorScheme.priorityColors[priorityLower] || 'bg-gray-500';
};

export const getSeverityColor = (severity, colorScheme) => {
    const severityLower = severity.toLowerCase();
    return colorScheme.severityColors[severityLower] || 'bg-gray-500';
};

// Update a specific color in the scheme
export const updateStatusColor = (status, newColor, colorScheme) => {
    const updatedScheme = {
        ...colorScheme,
        statusColors: {
            ...colorScheme.statusColors,
            [status.toLowerCase()]: newColor
        }
    };
    saveColorScheme(updatedScheme);
    return updatedScheme;
};

export const updatePriorityColor = (priority, newColor, colorScheme) => {
    const updatedScheme = {
        ...colorScheme,
        priorityColors: {
            ...colorScheme.priorityColors,
            [priority.toLowerCase()]: newColor
        }
    };
    saveColorScheme(updatedScheme);
    return updatedScheme;
};

export const updateSeverityColor = (severity, newColor, colorScheme) => {
    const updatedScheme = {
        ...colorScheme,
        severityColors: {
            ...colorScheme.severityColors,
            [severity.toLowerCase()]: newColor
        }
    };
    saveColorScheme(updatedScheme);
    return updatedScheme;
};

export const updateGroupColor = (group, newColor, colorScheme) => {
    const updatedScheme = {
        ...colorScheme,
        groupColors: {
            ...colorScheme.groupColors,
            [group]: newColor
        }
    };
    saveColorScheme(updatedScheme);
    return updatedScheme;
};