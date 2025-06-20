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
    getFrequencyColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    formatDate,
    getTeamMemberName,
    getAssignedUser,
    getEvidenceCount,
    getShortBugId,
    VALID_BUG_STATUSES,
    VALID_BUG_SEVERITIES
} from '../../utils/bugUtils';

const BugTableRow = ({
    bug,
    selectedBug,
    selectedIds,
    onToggleSelection,
    onDragStart,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onShowBugDetails,
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    editingTitle,
    titleValue,
    onTitleEdit,
    onTitleSave,
    onTitleChange,
    onTitleKeyDown,
}) => {
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

    const handleSeverityChange = async (bugId, newSeverity, event) => {
        event.stopPropagation();

        if (isUpdating.has(bugId)) {
            console.log(`Update already in progress for bug ${bugId}`);
            return;
        }

        if (onUpdateBugSeverity) {
            try {
                await onUpdateBugSeverity(bugId, newSeverity);
            } catch (error) {
                console.error('Failed to update severity:', error);
            }
        }
    };

    const handleStatusChange = async (bugId, newStatus, event) => {
        event.stopPropagation();

        if (isUpdating.has(bugId)) {
            console.log(`Update already in progress for bug ${bugId}`);
            return;
        }

        if (onUpdateBugStatus) {
            try {
                await onUpdateBugStatus(bugId, newStatus);
                console.log(`[DEBUG] Status update completed for bug ${bugId}`);
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
    };

    const handleAssignmentChange = async (bugId, newAssignee, event) => {
        event.stopPropagation();

        if (isUpdating.has(bugId)) {
            console.log(`Update already in progress for bug ${bugId}`);
            return;
        }

        if (onUpdateBugAssignment) {
            try {
                await onUpdateBugAssignment(bugId, newAssignee);
            } catch (error) {
                console.error('Failed to update assignment:', error);
            }
        }
    };

    const handleEnvironmentChange = async (bugId, newEnvironment, event) => {
        event.stopPropagation();

        if (isUpdating.has(bugId)) {
            console.log(`Update already in progress for bug ${bugId}`);
            return;
        }

        if (onUpdateBugEnvironment) {
            try {
                await onUpdateBugEnvironment(bugId, newEnvironment);
            } catch (error) {
                console.error('Failed to update environment:', error);
            }
        }
    };

    const handleCheckboxClick = (event) => {
        event.stopPropagation();
        const isChecked = selectedIds.includes(bug.id);
        onToggleSelection(bug.id, !isChecked);
    };

    const handleTitleClick = (event) => {
        event.stopPropagation();
        if (onTitleEdit) {
            onTitleEdit(bug.id, bug.title);
        }
    };

    // New handler for the chat icon that opens BugDetailsPanel
    const handleChatIconClick = (event) => {
        event.stopPropagation();
        if (onShowBugDetails) {
            onShowBugDetails(bug);
        }
    };

    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    const assignedUser = getAssignedUser(bug);
    const bugIsUpdating = bug?.id && isUpdating.has(bug.id);
    const isEditing = editingTitle === bug?.id;
    const isSelected = selectedIds.includes(bug.id);
    const ROW_HEIGHT = 'h-12';
    const CELL_VERTICAL_ALIGN = 'align-middle';

    const rowClassName = `${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${
        selectedBug?.id === bug?.id ? 'bg-blue-50' : ''
    } ${isSelected ? 'bg-blue-50' : ''} ${bugIsUpdating ? 'opacity-60' : ''}`;

    return (
        <tr
            key={`bug-${bug.id}`}
            className={rowClassName}
            draggable={true}
            onDragStart={(e) => onDragStart && onDragStart(e, bug)}
            // Removed onClick handler completely to prevent unwanted panel opening
        >
            {/* Checkbox - Sticky */}
            <td className={`w-10 px-2 py-4 border-r border-gray-200 sticky left-0 bg-white z-10 ${CELL_VERTICAL_ALIGN} ${isSelected ? 'bg-blue-50' : ''} ${selectedBug?.id === bug?.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-center h-full">
                    {isSelected ? (
                        <CheckSquare
                            className="w-4 h-4 text-teal-600 cursor-pointer"
                            onClick={handleCheckboxClick}
                        />
                    ) : (
                        <Square
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                            onClick={handleCheckboxClick}
                        />
                    )}
                </div>
            </td>

            {/* Bug Title - Sticky */}
            <td className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 sticky left-10 bg-white z-10 ${CELL_VERTICAL_ALIGN} ${isSelected ? 'bg-blue-50' : ''} ${selectedBug?.id === bug?.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center space-x-2 h-full">
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <input
                                type="text"
                                value={titleValue || ''}
                                onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                                onBlur={() => onTitleSave && onTitleSave(bug.id)}
                                onKeyDown={(e) => onTitleKeyDown && onTitleKeyDown(e, bug.id)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                autoFocus
                            />
                        ) : (
                            <div className="flex flex-col justify-center space-y-1">
                                <div
                                    className="font-medium text-gray-900 truncate text-sm leading-tight cursor-pointer hover:text-[#00897B] transition-colors"
                                    onClick={handleTitleClick}
                                    title={bug.title}
                                >
                                    {bug.title}
                                </div>
                                {/* Comments count */}
                                {bug.comments && bug.comments.length > 0 && (
                                    <div className="flex items-center text-xs text-gray-400">
                                        <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span className="flex-shrink-0">{bug.comments.length} comment{bug.comments.length !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        <button
                            onClick={handleChatIconClick}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-[#00897B] transition-colors"
                            title="View bug details"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>

            {/* Bug ID */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-20 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center h-full">
                    <span className="font-mono text-xs px-2 py-1 rounded">
                        #{getShortBugId(bug.id)}
                    </span>
                </div>
            </td>

            {/* Tags Column */}
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

            {/* Status Column - Editable Dropdown */}
            <td className={`whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center px-2">
                    <select
                        value={bug?.status || 'New'}
                        onChange={(e) => {
                            console.log(`[DEBUG] Status dropdown change detected:`, e.target.value);
                            handleStatusChange(bug.id, e.target.value, e);
                        }}
                        disabled={bugIsUpdating}
                        className={`text-xs px-2 py-1 rounded border-none focus:ring focus:ring-teal-700 cursor-pointer w-full ${getStatusColor(bug?.status)} ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_BUG_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </td>

            {/* Assigned To Column - Editable Dropdown */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-32 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={assignedUser || ''}
                        onChange={(e) => {
                            handleAssignmentChange(bug.id, e.target.value, e);
                        }}
                        disabled={bugIsUpdating}
                        className={`text-xs px-2 py-1 rounded border-gray-300 focus:ring-1 focus:ring-[#00897B] focus:border-[#00897B] w-full cursor-pointer bg-white ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                            <option key={member.id} value={member.email || member.id}>
                                {getTeamMemberName(member.id, teamMembers)}
                            </option>
                        ))}
                    </select>
                </div>
            </td>

            {/* Priority Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-20 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(bug.severity))}`}>
                        {getPriorityFromSeverity(bug.severity)}
                    </span>
                </div>
            </td>

            {/* Severity Column - Editable Dropdown */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.severity || 'Low'}
                        onChange={(e) => {
                            handleSeverityChange(bug.id, e.target.value, e);
                        }}
                        disabled={bugIsUpdating}
                        className={`text-xs px-2 py-1 rounded border-none focus:ring-1 focus:ring-[#00897B] cursor-pointer w-full ${getSeverityColor(bug?.severity)} ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_BUG_SEVERITIES.map(severity => (
                            <option key={severity} value={severity}>{severity}</option>
                        ))}
                    </select>
                </div>
            </td>

            {/* Evidence Column */}
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

            {/* Reporter Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="truncate w-full text-center" title={bug.reportedByEmail}>
                        {bug.reportedByEmail?.split('@')[0] || 'Unknown'}
                    </div>
                </div>
            </td>

            {/* Source Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                        {getSourceIcon(bug.source)}
                        <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                    </div>
                </div>
            </td>

            {/* Environment Column - Editable Dropdown */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.environment || 'Unknown'}
                        onChange={(e) => {
                            handleEnvironmentChange(bug.id, e.target.value, e);
                        }}
                        disabled={bugIsUpdating}
                        className={`text-xs px-2 py-1 rounded border-gray-300 focus:ring-2 focus:ring-[#00897B] focus:border-[#00897B] cursor-pointer w-full bg-white ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {environments.map(env => (
                            <option key={env} value={env}>{env}</option>
                        ))}
                    </select>
                </div>
            </td>

            {/* Device/Browser Column - Read Only */}
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

            {/* Due Date Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {bug.dueDate ? (
                        <div className={`flex items-center ${isPastDue(bug.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs">{formatDate(bug.dueDate)}</span>
                            {isPastDue(bug.dueDate) && (
                                <AlertTriangle className="h-3 w-3 ml-1 text-red-500 flex-shrink-0" />
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">No due date</span>
                    )}
                </div>
            </td>

            {/* Created Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDate(bug.createdAt)}</span>
                    </div>
                </div>
            </td>

            {/* Frequency Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyColor(bug.frequency)}`}>
                        {bug.frequency || 'Unknown'}
                    </span>
                </div>
            </td>

            {/* Drag Handle */}
            <td className={`px-4 py-3 whitespace-nowrap w-8 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                </div>
            </td>
        </tr>
    );
};

export default BugTableRow;