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

// Import utility functions
import {
    getStatusColor,
    getSeverityColor,
    getPriorityColor,
    getEnvironmentColor,
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
    VALID_BUG_SEVERITIES,
    VALID_ENVIRONMENTS // Add this to your utils if not already there
} from '../../utils/bugUtils';

// Default environment options if not available in utils
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

const BugTable = ({
    bugs,
    selectedBugs,
    onBugSelect,
    selectedBug,
    onToggleSelection, // Fixed prop name
    onToggleGroupSelection, // Fixed prop name
    allGroupSelected,
    isGroupSelected,
    onDragStart, // Fixed prop name
    onUpdateBugStatus, // Fixed prop name
    onUpdateBugSeverity, // Fixed prop name
    onUpdateBugAssignment, // Fixed prop name
    onUpdateBugEnvironment, // New prop for environment updates
    teamMembers = [],
    environments = VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS, // New prop for environment options
    isUpdating = new Set() // Track updating bugs
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

        console.log(`[DEBUG] Severity change requested for bug ${bugId}: ${newSeverity}`);

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

        console.log(`[DEBUG] Status change requested for bug ${bugId}: ${newStatus}`);

        if (onUpdateBugStatus) {
            try {
                await onUpdateBugStatus(bugId, newStatus);
                console.log(`[DEBUG] Status update completed for bug ${bugId}`);
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        } else {
            console.warn('[DEBUG] onUpdateBugStatus callback not provided');
        }
    };

    const handleAssignmentChange = async (bugId, newAssignee, event) => {
        event.stopPropagation();

        if (isUpdating.has(bugId)) {
            console.log(`Update already in progress for bug ${bugId}`);
            return;
        }

        console.log(`[DEBUG] Assignment change requested for bug ${bugId}: ${newAssignee}`);

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

        console.log(`[DEBUG] Environment change requested for bug ${bugId}: ${newEnvironment}`);

        if (onUpdateBugEnvironment) {
            try {
                await onUpdateBugEnvironment(bugId, newEnvironment);
            } catch (error) {
                console.error('Failed to update environment:', error);
            }
        }
    };

    // Fixed row height with proper alignment
    const ROW_HEIGHT = 'h-12';
    const CELL_VERTICAL_ALIGN = 'align-middle';

    return (
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Fixed Left Columns */}
            <div className="flex-shrink-0 border-r border-gray-200">
                <table className="table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-12">
                            <th scope="col" className="w-10 p-3 align-middle">
                                <div className="flex items-center justify-center h-full">
                                    {onToggleGroupSelection && (
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                            onChange={onToggleGroupSelection}
                                            checked={allGroupSelected}
                                            ref={(input) => {
                                                if (input) input.indeterminate = isGroupSelected && !allGroupSelected;
                                            }}
                                        />
                                    )}
                                </div>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[300px] min-w-[300px] max-w-[300px] align-middle">
                                <div className="flex items-center h-full">
                                    Bug Title
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map((bug) => (
                            <tr
                                key={`bug-${bug.id}`}
                                className={`${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${selectedBug?.id === bug.id ? 'bg-blue-50' : ''
                                    } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''}`}
                                draggable
                                onDragStart={(e) => onDragStart && onDragStart(e, bug)}
                            >
                                <td className={`p-3 ${CELL_VERTICAL_ALIGN}`}>
                                    <div className="flex items-center justify-center h-full">
                                        <input
                                            type="checkbox"
                                            checked={selectedBugs.includes(bug.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                onToggleSelection(bug.id);
                                            }}
                                            className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                        />
                                    </div>
                                </td>

                                {/* Bug Details */}
                                <td
                                    className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] cursor-pointer hover:bg-blue-50 ${CELL_VERTICAL_ALIGN}`}
                                    onClick={() => onBugSelect(bug)}
                                >
                                    <div className="flex flex-col justify-center h-full space-y-1">
                                        <div className="font-medium text-gray-900 truncate text-sm leading-tight">
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Scrollable Right Columns */}
            <div className="flex-1 overflow-x-auto">
                <table className="table-fixed min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-12">
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-20 align-middle">
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32 align-middle">
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Status</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32 align-middle">
                                <div className="flex items-center h-full">Assigned To</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-20 align-middle">
                                <div className="flex items-center h-full">Priority</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Severity</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28 align-middle">
                                <div className="flex items-center h-full">Evidence</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28 align-middle">
                                <div className="flex items-center h-full">Environment</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32 align-middle">
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28 align-middle">
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24 align-middle">
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-8 align-middle">
                                <div className="flex items-center h-full"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map((bug) => {
                            const totalAttachments = bug.attachments?.length || 0;
                            const evidenceCount = getEvidenceCount(bug);
                            const assignedUser = getAssignedUser(bug);
                            const bugIsUpdating = isUpdating.has(bug.id);

                            return (
                                <tr
                                    key={`bug-row-${bug.id}`}
                                    className={`${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${selectedBug?.id === bug.id ? 'bg-blue-50' : ''
                                        } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''} ${bugIsUpdating ? 'opacity-60' : ''}`}
                                >
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
                                        <div className="flex items-center justify-center h-full px-2">
                                            <select
                                                value={bug.status || 'New'}
                                                onChange={(e) => {
                                                    console.log(`[DEBUG] Status dropdown change detected:`, e.target.value);
                                                    handleStatusChange(bug.id, e.target.value, e);
                                                }}
                                                disabled={bugIsUpdating}
                                                className={`text-xs px-2 py-1 rounded border-none focus:ring focus:ring-teal-700 cursor-pointer w-full ${getStatusColor(bug.status)} ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        <div className="flex items-center justify-center h-full">
                                            <select
                                                value={assignedUser || ''}
                                                onChange={(e) => handleAssignmentChange(bug.id, e.target.value, e)}
                                                disabled={bugIsUpdating}
                                                className={`text-xs px-2 py-1 rounded border-gray-300 focus:ring-2 focus:ring-[#00897B] focus:border-[#00897B] w-full cursor-pointer bg-white ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        <div className="flex items-center justify-center h-full">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(bug.severity))}`}>
                                                {getPriorityFromSeverity(bug.severity)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Severity Column - Editable Dropdown */}
                                    <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                                        <div className="flex items-center justify-center h-full">
                                            <select
                                                value={bug.severity || 'Low'}
                                                onChange={(e) => handleSeverityChange(bug.id, e.target.value, e)}
                                                disabled={bugIsUpdating}
                                                className={`text-xs px-2 py-1 rounded border-none focus:ring-2 focus:ring-[#00897B] cursor-pointer w-full ${getSeverityColor(bug.severity)} ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        <div className="flex items-center justify-center h-full">
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
                                        <div className="flex items-center justify-center h-full">
                                            <div className="truncate w-full text-center" title={bug.reportedByEmail}>
                                                {bug.reportedByEmail?.split('@')[0] || 'Unknown'}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Source Column - Read Only */}
                                    <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                                        <div className="flex items-center justify-center h-full">
                                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                                                {getSourceIcon(bug.source)}
                                                <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Environment Column - Editable Dropdown */}
                                    <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                                        <div className="flex items-center justify-center h-full">
                                            <select
                                                value={bug.environment || 'Unknown'}
                                                onChange={(e) => handleEnvironmentChange(bug.id, e.target.value, e)}
                                                disabled={bugIsUpdating}
                                                className={`text-xs px-2 py-1 rounded border-none focus:ring-2 focus:ring-[#00897B] cursor-pointer w-full ${getEnvironmentColor(bug.environment)} ${bugIsUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                        <div className="flex items-center justify-center h-full">
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
                                        <div className="flex items-center justify-center h-full">
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
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{formatDate(bug.createdAt)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Frequency Column - Read Only */}
                                    <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                                        <div className="flex items-center justify-center h-full">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyColor(bug.frequency)}`}>
                                                {bug.frequency || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Drag Handle */}
                                    <td className={`px-4 py-3 whitespace-nowrap w-8 ${CELL_VERTICAL_ALIGN}`}>
                                        <div className="flex items-center justify-center h-full">
                                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BugTable;