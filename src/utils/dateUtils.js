// utils/dateUtils.js
import { formatDistanceToNow, format } from 'date-fns';

export const safeFormatDate = (dateValue, formatType = 'relative') => {
    if (!dateValue) return 'No date';
    
    let date;
    
    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        // Handle Firestore timestamp format {seconds, nanoseconds}
        date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
        date = dateValue;
    } else {
        return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    
    try {
        if (formatType === 'relative') {
            return formatDistanceToNow(date, { addSuffix: true });
        } else if (formatType === 'short') {
            return format(date, 'MMM d, yyyy');
        } else {
            return format(date, 'MMM d, yyyy');
        }
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Date error';
    }
};

// utils/badgeUtils.js
export const getStatusBadge = (status) => {
    const statusConfig = {
        'under-review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'in-development': 'bg-blue-100 text-blue-800 border-blue-200',
        'completed': 'bg-purple-100 text-purple-800 border-purple-200',
        'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusConfig[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getPriorityBadge = (priority) => {
    const priorityConfig = {
        'critical': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'low': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return priorityConfig[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getImpactIndicator = (impact) => {
    const impactColors = {
        'high': 'text-green-500',
        'medium': 'text-yellow-500',
        'low': 'text-gray-400',
    };
    return impactColors[impact?.toLowerCase()] || 'text-gray-400';
};

export const getEffortIndicator = (effort) => {
    const effortConfig = {
        'small': { dots: 1, color: 'text-green-500' },
        'medium': { dots: 2, color: 'text-yellow-500' },
        'large': { dots: 3, color: 'text-red-500' },
    };
    const config = effortConfig[effort?.toLowerCase()] || { dots: 1, color: 'text-gray-400' };
    
    return (
        <div className={`flex gap-1 ${config.color}`}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                        i < config.dots ? 'bg-current' : 'bg-gray-200'
                    }`}
                />
            ))}
        </div>
    );
};
