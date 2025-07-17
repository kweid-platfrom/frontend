'use client';

import React from 'react';
import {
    GripVertical,
    Paperclip,
    Video,
    Terminal,
    Network,
    User,
    Calendar,
    AlertTriangle,
    Clock,
    Tag,
    MessageSquare,
    Monitor,
    Globe,
    CheckSquare,
    Square
} from 'lucide-react';
import {
    getStatusColor,
    getSeverityColor,
    getPriorityColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    formatDate,
    getTeamMemberName,
    getEvidenceCount,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES
} from '../../utils/bugUtils';

// Add frequency options
const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];

const BugTableRow = ({
    bug,
    selectedBug,
    selectedIds,
    onToggleSelection,
    onDragStart,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugPriority,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onUpdateBugFrequency, // Add this new prop
    onShowBugDetails,
    onChatClick, // Add this prop from BugTable
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
}) => {
    const updatingSet = React.useMemo(() => {
        if (isUpdating instanceof Set) {
            return isUpdating;
        }
        if (Array.isArray(isUpdating)) {
            return new Set(isUpdating);
        }
        return new Set();
    }, [isUpdating]);

    const getSourceIcon = (source) => {
        switch (source) {
            case 'manual':
                return <User className="h-3 w-3" />;
            case 'automated':
                return <Terminal className="h-3 w-3" />;
            default:
                return <Globe className="h-3 w-3" />;
        }
    };

    // Helper function to get user's first name from email or name
    const getFirstName = (user) => {
        if (!user) return 'Unknown';
        if (typeof user === 'string') {
            // If it's an email, extract the part before @
            if (user.includes('@')) {
                return user.split('@')[0];
            }
            // If it's a name, get the first word
            return user.split(' ')[0];
        }
        if (user.displayName) {
            return user.displayName.split(' ')[0];
        }
        if (user.email) {
            return user.email.split('@')[0];
        }
        return 'Unknown';
    };

    // Helper function to generate user-friendly bug ID
    const getUserFriendlyBugId = (bugId) => {
        if (!bugId) return 'Unknown';
        // Take last 6 characters and prefix with BUG-
        return `BUG-${bugId.slice(-6).toUpperCase()}`;
    };

    // Helper function to format date properly
    const formatDateSafe = (date) => {
        if (!date) return 'Not set';
        try {
            if (date.toDate) {
                // Firestore timestamp
                return formatDate(date.toDate());
            }
            if (date instanceof Date) {
                return formatDate(date);
            }
            if (typeof date === 'string') {
                return formatDate(new Date(date));
            }
            return 'Invalid date';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const handleSeverityChange = async (bugId, newSeverity, event) => {
        event.stopPropagation();
        if (updatingSet.has(bugId)) return;
        
        console.log('Updating severity:', { bugId, newSeverity });
        
        if (onUpdateBugSeverity) {
            try {
                await onUpdateBugSeverity(bugId, newSeverity);
                const newPriority = getPriorityFromSeverity(newSeverity);
                if (onUpdateBugPriority) {
                    await onUpdateBugPriority(bugId, newPriority);
                }
            } catch (error) {
                console.error('Failed to update severity:', error);
            }
        } else {
            console.warn('onUpdateBugSeverity function not provided');
        }
    };

    const handleStatusChange = async (bugId, newStatus, event) => {
        event.stopPropagation();
        if (updatingSet.has(bugId)) return;
        
        console.log('Updating status:', { bugId, newStatus });
        
        if (onUpdateBugStatus) {
            try {
                await onUpdateBugStatus(bugId, newStatus);
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        } else {
            console.warn('onUpdateBugStatus function not provided');
        }
    };

    const handleAssignmentChange = async (bugId, newAssignee, event) => {
        event.stopPropagation();
        if (updatingSet.has(bugId)) return;
        
        console.log('Updating assignment:', { bugId, newAssignee });
        
        if (onUpdateBugAssignment) {
            try {
                await onUpdateBugAssignment(bugId, newAssignee);
            } catch (error) {
                console.error('Failed to update assignment:', error);
            }
        } else {
            console.warn('onUpdateBugAssignment function not provided');
        }
    };

    const handleEnvironmentChange = async (bugId, newEnvironment, event) => {
        event.stopPropagation();
        if (updatingSet.has(bugId)) return;
        
        console.log('Updating environment:', { bugId, newEnvironment });
        
        if (onUpdateBugEnvironment) {
            try {
                await onUpdateBugEnvironment(bugId, newEnvironment);
            } catch (error) {
                console.error('Failed to update environment:', error);
            }
        } else {
            console.warn('onUpdateBugEnvironment function not provided');
        }
    };

    const handleFrequencyChange = async (bugId, newFrequency, event) => {
        event.stopPropagation();
        if (updatingSet.has(bugId)) return;
        
        console.log('Updating frequency:', { bugId, newFrequency });
        
        if (onUpdateBugFrequency) {
            try {
                await onUpdateBugFrequency(bugId, newFrequency);
            } catch (error) {
                console.error('Failed to update frequency:', error);
            }
        } else {
            console.warn('onUpdateBugFrequency function not provided');
        }
    };

    const handleCheckboxClick = (event) => {
        event.stopPropagation();
        if (onToggleSelection) {
            const isChecked = selectedIds.includes(bug.id);
            onToggleSelection(bug.id, !isChecked);
        }
    };

    const handleChatIconClick = (event) => {
        event.stopPropagation();
        event.preventDefault();
        
        console.log('Chat icon clicked for bug:', bug);
        
        if (!bug || !bug.id) {
            console.error('Invalid bug object in handleChatIconClick:', bug);
            return;
        }
        
        // Use onChatClick if provided, otherwise fall back to onShowBugDetails
        if (onChatClick) {
            onChatClick(bug, event);
        } else if (onShowBugDetails) {
            onShowBugDetails(bug);
        } else {
            console.warn('Neither onChatClick nor onShowBugDetails function provided');
        }
    };

    const handleRowClick = (event) => {
        if (event.target.tagName === 'SELECT' || 
            event.target.tagName === 'INPUT' || 
            event.target.tagName === 'BUTTON' ||
            event.target.closest('button') ||
            event.target.closest('select') ||
            event.target.closest('input')) {
            return;
        }
        if (onShowBugDetails && bug) {
            onShowBugDetails(bug);
        }
    };

    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    
    // Fix assigned user logic - get current assignee or default to creator
    const getAssignedUser = () => {
        if (bug.assignedTo) return bug.assignedTo;
        if (bug.created_by) return bug.created_by;
        if (bug.reportedByEmail) return bug.reportedByEmail;
        return '';
    };
    
    const assignedUser = getAssignedUser();
    const bugIsUpdating = bug?.id && updatingSet.has(bug.id);
    const isSelected = selectedIds.includes(bug.id);
    const ROW_HEIGHT = 'h-12';
    const CELL_VERTICAL_ALIGN = 'align-middle';
    
    // Fix reporter name - get first name properly
    const reporterName = getFirstName(bug.created_by || bug.reportedByEmail);

    const rowClassName = `${ROW_HEIGHT} hover:bg-gray-50 transition-colors cursor-pointer ${
        selectedBug?.id === bug?.id ? 'bg-blue-50' : ''
    } ${isSelected ? 'bg-blue-50' : ''} ${bugIsUpdating ? 'opacity-60' : ''}`;

    return (
        <tr
            key={`bug-${bug.id}`}
            className={rowClassName}
            draggable={true}
            onDragStart={(e) => onDragStart && onDragStart(e, bug)}
            onClick={handleRowClick}
        >
            <td className={`w-10 px-2 py-4 border-r border-gray-200 sticky left-0 bg-white z-20 ${CELL_VERTICAL_ALIGN} ${isSelected ? 'bg-blue-50' : ''} ${selectedBug?.id === bug?.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-center h-full">
                    {isSelected ? (
                        <CheckSquare
                            className="w-4 h-4 text-teal-600 cursor-pointer hover:text-teal-700 transition-colors"
                            onClick={handleCheckboxClick}
                        />
                    ) : (
                        <Square
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600 transition-colors"
                            onClick={handleCheckboxClick}
                        />
                    )}
                </div>
            </td>
            <td className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 sticky left-10 bg-white z-20 ${CELL_VERTICAL_ALIGN} ${isSelected ? 'bg-blue-50' : ''} ${selectedBug?.id === bug?.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center space-x-2 h-full">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col justify-center space-y-1">
                            <div
                                className="font-medium text-gray-900 truncate text-sm leading-tight cursor-pointer hover:text-[#00897B] transition-colors"
                                title={bug.title}
                            >
                                {bug.title}
                            </div>
                            {bug.comments && bug.comments.length > 0 && (
                                <div className="flex items-center text-xs text-gray-400">
                                    <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="flex-shrink-0">{bug.comments.length} comment{bug.comments.length !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleChatIconClick}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-[#00897B] hover:bg-teal-50 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        title="View bug details"
                        aria-label="View bug details"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-20 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center h-full">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {getUserFriendlyBugId(bug.id)}
                    </span>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center h-full">
                    {bug.tags && bug.tags.length > 0 ? (
                        <div className="flex items-center gap-1 overflow-hidden max-w-28">
                            {bug.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-teal-800 flex-shrink-0">
                                    <Tag className="h-2 w-2 mr-1" />
                                    <span className="truncate max-w-16">{tag}</span>
                                </span>
                            ))}
                            {bug.tags.length > 2 && (
                                <span className="text-xs text-gray-400 flex-shrink-0">+{bug.tags.length - 2}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">None</span>
                    )}
                </div>
            </td>
            <td className={`whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center px-2">
                    <select
                        value={bug?.status || 'New'}
                        onChange={(e) => handleStatusChange(bug.id, e.target.value, e)}
                        disabled={bugIsUpdating || !onUpdateBugStatus}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug?.status)} ${(bugIsUpdating || !onUpdateBugStatus) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_BUG_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-32 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={assignedUser}
                        onChange={(e) => handleAssignmentChange(bug.id, e.target.value, e)}
                        disabled={bugIsUpdating || !onUpdateBugAssignment}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white ${(bugIsUpdating || !onUpdateBugAssignment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                            <option key={member.id || member.email} value={member.email || member.id}>
                                {getTeamMemberName(member.id, teamMembers)}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-20 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(bug.severity))}`}>
                        {getPriorityFromSeverity(bug.severity)}
                    </span>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.severity || 'Low'}
                        onChange={(e) => handleSeverityChange(bug.id, e.target.value, e)}
                        disabled={bugIsUpdating || !onUpdateBugSeverity}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getSeverityColor(bug?.severity)} ${(bugIsUpdating || !onUpdateBugSeverity) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_BUG_SEVERITIES.map(severity => (
                            <option key={severity} value={severity}>{severity}</option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="flex items-center space-x-1">
                        {bug.hasAttachments && totalAttachments > 0 && (
                            <div className="flex items-center bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {totalAttachments}
                            </div>
                        )}
                        {bug.hasVideoEvidence && (
                            <div className="bg-purple-100 text-purple-800 p-1 rounded">
                                <Video className="h-3 w-3" />
                            </div>
                        )}
                        {bug.hasConsoleLogs && (
                            <div className="bg-green-100 text-green-800 p-1 rounded">
                                <Terminal className="h-3 w-3" />
                            </div>
                        )}
                        {bug.hasNetworkLogs && (
                            <div className="bg-orange-100 text-orange-800 p-1 rounded">
                                <Network className="h-3 w-3" />
                            </div>
                        )}
                        {evidenceCount === 0 && (
                            <span className="text-xs text-gray-400">None</span>
                        )}
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="truncate w-full text-center" title={bug.created_by || bug.reportedByEmail}>
                        {reporterName}
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                        {getSourceIcon(bug.source)}
                        <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.environment || 'Production'}
                        onChange={(e) => handleEnvironmentChange(bug.id, e.target.value, e)}
                        disabled={bugIsUpdating || !onUpdateBugEnvironment}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white ${(bugIsUpdating || !onUpdateBugEnvironment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {environments.map(env => (
                            <option key={env} value={env}>{env}</option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200 w-32 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="flex items-center w-full">
                        <Monitor className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="truncate text-xs">{bug.browserInfo || 'Unknown'}</div>
                            <div className="text-gray-500 truncate text-xs">{bug.deviceInfo?.split(',')[0] || ''}</div>
                        </div>
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {bug.dueDate ? (
                        <div className={`flex items-center ${isPastDue(bug.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs">{formatDateSafe(bug.dueDate)}</span>
                            {isPastDue(bug.dueDate) && (
                                <AlertTriangle className="h-3 w-3 ml-1 text-red-500 flex-shrink-0" />
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">No due date</span>
                    )}
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDateSafe(bug.createdAt)}</span>
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.frequency || 'Sometimes'}
                        onChange={(e) => handleFrequencyChange(bug.id, e.target.value, e)}
                        disabled={bugIsUpdating || !onUpdateBugFrequency}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white ${(bugIsUpdating || !onUpdateBugFrequency) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap w-8 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                </div>
            </td>
        </tr>
    );
};

export default BugTableRow;