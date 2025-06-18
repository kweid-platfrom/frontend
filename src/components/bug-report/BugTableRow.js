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
    Globe
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
    selectedBugs,
    selectedBug,
    onToggleSelection,
    onDragStart,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onBugSelect, // Changed from onShowBugDetails to match old implementation
    teamMembers = [],
    environments = [],
    isUpdating = new Set(),
    editingTitle,
    titleValue,
    onTitleEdit,
    onTitleSave,
    onTitleChange,
    onTitleKeyDown,
    isNewRow = false,
    onCreateBug
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

        if (isNewRow) {
            // For new row, just update the local state
            if (onUpdateBugSeverity) {
                onUpdateBugSeverity(bugId, newSeverity);
            }
            return;
        }

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

        if (isNewRow) {
            // For new row, just update the local state
            if (onUpdateBugStatus) {
                onUpdateBugStatus(bugId, newStatus);
            }
            return;
        }

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

        if (isNewRow) {
            // For new row, just update the local state
            if (onUpdateBugAssignment) {
                onUpdateBugAssignment(bugId, newAssignee);
            }
            return;
        }

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

        if (isNewRow) {
            // For new row, just update the local state
            if (onUpdateBugEnvironment) {
                onUpdateBugEnvironment(bugId, newEnvironment);
            }
            return;
        }

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

    // Handle creating new bug
    const handleCreateBug = () => {
        if (onCreateBug && titleValue && titleValue.trim()) {
            onCreateBug({
                title: titleValue.trim(),
                status: bug?.status || 'New',
                severity: bug?.severity || 'Low',
                assignedTo: bug?.assignedTo || '',
                environment: bug?.environment || 'Unknown'
            });
        }
    };

    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    const assignedUser = getAssignedUser(bug);
    const bugIsUpdating = bug?.id && isUpdating.has(bug.id);
    const isEditing = editingTitle === bug?.id || editingTitle === 'new';
    const ROW_HEIGHT = 'h-12';
    const CELL_VERTICAL_ALIGN = 'align-middle';

    // For new row styling
    const rowClassName = isNewRow
        ? `${ROW_HEIGHT} bg-gray-50 border-dashed border-2 border-gray-300 transition-all duration-200`
        : `${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${selectedBug?.id === bug?.id ? 'bg-blue-50' : ''
        } ${selectedBugs.includes(bug?.id) ? 'bg-blue-50' : ''} ${bugIsUpdating ? 'opacity-60' : ''
        }`;

    return (
        <tr
            key={`bug-${bug?.id || 'new'}`}
            className={rowClassName}
            draggable={!isNewRow}
            onDragStart={(e) => !isNewRow && onDragStart && onDragStart(e, bug)}
        >
            {/* Checkbox */}
            <td className={`p-6 border-r border-gray-200 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center h-full">
                    {!isNewRow && (
                        <input
                            type="checkbox"
                            checked={selectedBugs.includes(bug.id)}
                            onChange={(e) => {
                                e.stopPropagation();
                                onToggleSelection(bug.id);
                            }}
                            className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                        />
                    )}
                </div>
            </td>

            {/* Bug Title */}
            <td className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center space-x-2 h-full">
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <input
                                type="text"
                                value={titleValue || ''}
                                onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                                onBlur={() => {
                                    if (isNewRow) {
                                        handleCreateBug();
                                    } else {
                                        if (onTitleSave) {
                                            onTitleSave(bug.id);
                                        }
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (isNewRow) {
                                            handleCreateBug();
                                        } else {
                                            if (onTitleKeyDown) {
                                                onTitleKeyDown(e, bug.id);
                                            }
                                        }
                                    } else if (e.key === 'Escape') {
                                        if (onTitleKeyDown) {
                                            onTitleKeyDown(e, bug?.id);
                                        }
                                    }
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                                placeholder={isNewRow ? "Enter bug title..." : ""}
                                autoFocus
                            />
                        ) : (
                            <div className="flex flex-col justify-center space-y-1">
                                <div
                                    className="font-medium text-gray-900 truncate text-sm leading-tight cursor-pointer hover:text-[#00897B] transition-colors"
                                    onClick={() => onTitleEdit && onTitleEdit(bug.id, bug.title)}
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
                    {!isEditing && !isNewRow && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onBugSelect) onBugSelect(bug); // Changed from onShowBugDetails to onBugSelect
                            }}
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
                    {!isNewRow && (
                        <span className="font-mono text-xs px-2 py-1 rounded">
                            #{getShortBugId(bug.id)}
                        </span>
                    )}
                </div>
            </td>

            {/* Tags Column */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center justify-center h-full">
                    {!isNewRow && bug.tags && bug.tags.length > 0 ? (
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
                            if (!isNewRow) {
                                handleStatusChange(bug.id, e.target.value, e);
                            }
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
                            if (!isNewRow) {
                                handleAssignmentChange(bug.id, e.target.value, e);
                            }
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
                    {!isNewRow && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(bug.severity))}`}>
                            {getPriorityFromSeverity(bug.severity)}
                        </span>
                    )}
                </div>
            </td>

            {/* Severity Column - Editable Dropdown */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.severity || 'Low'}
                        onChange={(e) => {
                            if (!isNewRow) {
                                handleSeverityChange(bug.id, e.target.value, e);
                            }
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
                    {!isNewRow ? (
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
                    ) : (
                        <span className="text-xs text-gray-400">None</span>
                    )}
                </div>
            </td>

            {/* Reporter Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {!isNewRow && (
                        <div className="truncate w-full text-center" title={bug.reportedByEmail}>
                            {bug.reportedByEmail?.split('@')[0] || 'Unknown'}
                        </div>
                    )}
                </div>
            </td>

            {/* Source Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {!isNewRow && (
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                            {getSourceIcon(bug.source)}
                            <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Environment Column - Editable Dropdown */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.environment || 'Unknown'}
                        onChange={(e) => {
                            if (!isNewRow) {
                                handleEnvironmentChange(bug.id, e.target.value, e);
                            }
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
                    {!isNewRow && (
                        <div className="flex items-center w-full">
                            <Monitor className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="truncate text-xs">{bug.browserInfo || 'Unknown'}</div>
                                <div className="text-gray-500 truncate text-xs">{bug.deviceInfo?.split(',')[0] || ''}</div>
                            </div>
                        </div>
                    )}
                </div>
            </td>

            {/* Due Date Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {!isNewRow && bug.dueDate ? (
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
                    {!isNewRow && (
                        <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{formatDate(bug.createdAt)}</span>
                        </div>
                    )}
                </div>
            </td>

            {/* Frequency Column - Read Only */}
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {!isNewRow && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyColor(bug.frequency)}`}>
                            {bug.frequency || 'Unknown'}
                        </span>
                    )}
                </div>
            </td>

            {/* Drag Handle / Add Button */}
            <td className={`px-4 py-3 whitespace-nowrap w-8 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    {isNewRow ? (
                        <button
                            onClick={handleCreateBug}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00897B] text-white hover:bg-[#00796B] transition-colors"
                            title="Add new bug"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    ) : (
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    )}
                </div>
            </td>
        </tr>
    );
};

export default BugTableRow;