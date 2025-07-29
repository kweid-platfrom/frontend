import {
    CheckSquare,
    Square,
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
} from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';
import {
    getDeviceInfoDisplay,
    getUserFriendlyBugId,
    formatDateSafe,
    getStatusColor,
    getPriorityColor,
    getSourceColor,
    getPriorityFromSeverity,
    isPastDue,
    getReporterFirstName,
    getEvidenceCount,
} from '../../utils/BugTableUtils';

// Component: BugRow
const BugRow = ({
    bug,
    isSelected,
    handleSelectItem,
    onChatClick,
    onLinkTestCase,
    teamMembers,
    environments,
    testCaseOptions,
    handleStatusChange,
    handleSeverityChange,
    handleAssignmentChange,
    handleEnvironmentChange,
    handleFrequencyChange,
    relationships,
}) => {
    const createdAt = bug.created_at instanceof Date ? bug.created_at : new Date(bug.created_at);
    const dueDate = bug.due_date ? (bug.due_date instanceof Date ? bug.due_date : new Date(bug.due_date)) : null;
    const linkedTestCaseIds =
        relationships[bug.id] ||
        (bug.linkedTestCases?.map((tc) => (typeof tc === 'string' ? tc : tc.id || tc.testCaseId)).filter(Boolean)) ||
        [];
    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    const assignedUser = bug.assigned_to || '';
    const reporterName = getReporterFirstName(bug.created_by || bug.reportedByEmail) || 'Unknown';

    return (
        <tr
            key={`bug-${bug.id}`}
            className={`h-12 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', bug.id)}
        >
            <td className={`w-10 px-2 py-4 border-r border-gray-200 sticky left-0 bg-white z-20 align-middle ${isSelected ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-center h-full">
                    {isSelected ? (
                        <CheckSquare
                            className="w-4 h-4 text-teal-600 cursor-pointer"
                            onClick={() => handleSelectItem(bug.id, false)}
                        />
                    ) : (
                        <Square
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                            onClick={() => handleSelectItem(bug.id, true)}
                        />
                    )}
                </div>
            </td>
            <td className={`px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200 sticky left-10 bg-white z-20 align-middle ${isSelected ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center space-x-2 h-full">
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm leading-tight" title={bug.title}>
                            {bug.title || 'Untitled Bug'}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onChatClick) onChatClick(bug);
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-200"
                        title="View bug details"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-20 min-w-[80px] align-middle">
                <div className="flex items-center justify-center h-full">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{getUserFriendlyBugId(bug.id)}</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 min-w-[128px] align-middle">
                <div className="flex items-center justify-center h-full">
                    {bug.tags && bug.tags.length > 0 ? (
                        <div className="flex items-center gap-1 overflow-hidden max-w-28">
                            {bug.tags.slice(0, 2).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-teal-800 flex-shrink-0"
                                >
                                    <Tag className="h-2 w-2 mr-1" />
                                    <span className="truncate max-w-16">{tag}</span>
                                </span>
                            ))}
                            {bug.tags.length > 2 && <span className="text-xs text-gray-400 flex-shrink-0">+{bug.tags.length - 2}</span>}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">None</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center justify-center">
                    <select
                        value={bug.status || 'New'}
                        onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug.status)}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {['New', 'In Progress', 'Blocked', 'Resolved', 'Closed'].map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-32 min-w-[128px] align-middle">
                <div className="flex items-center">
                    <select
                        value={assignedUser}
                        onChange={(e) => handleAssignmentChange(bug.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                            <option key={member.name} value={member.name}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-20 min-w-[80px] align-middle">
                <div className="flex items-center">
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(bug.severity))}`}
                    >
                        {getPriorityFromSeverity(bug.severity) || 'Low'}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <select
                        value={bug.severity || 'Low'}
                        onChange={(e) => handleSeverityChange(bug.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug.severity)}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {['Low', 'Medium', 'High', 'Critical'].map((severity) => (
                            <option key={severity} value={severity}>
                                {severity}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
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
                    {evidenceCount === 0 && <span className="text-xs text-gray-400">None</span>}
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <div className="truncate w-full text-center" title={reporterName}>
                        {reporterName}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <div className={`inline-flex items-center px-2 py-1 rounded text-xs ${getSourceColor(bug.source)}`}>
                        {(bug.source === 'manual' && <User className="h-3 w-3" />) ||
                            (bug.source === 'automated' && <Terminal className="h-3 w-3" />) || (
                                <Globe className="h-3 w-3" />
                            )}
                        <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 min-w-[112px] align-middle">
                <div className="flex items-center">
                    <select
                        value={bug.environment || 'Production'}
                        onChange={(e) => handleEnvironmentChange(bug.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {environments.map((env) => (
                            <option key={env} value={env}>
                                {env}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200 w-28 min-w-[112px] align-middle">
                <div className="flex items-center">
                    <Monitor className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="truncate text-xs" title={getDeviceInfoDisplay(bug.browserInfo)}>
                            {getDeviceInfoDisplay(bug.browserInfo)}
                        </div>
                        <div className="text-gray-500 truncate text-xs" title={getDeviceInfoDisplay(bug.deviceInfo)}>
                            {getDeviceInfoDisplay(bug.deviceInfo)}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200 w-28 min-w-[112px] align-middle">
                <div className="flex items-center">
                    {bug.due_date ? (
                        <div className={`flex items-center ${isPastDue(bug.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs">{formatDateSafe(dueDate)}</span>
                            {isPastDue(bug.due_date) && <AlertTriangle className="h-3 w-3 ml-1 text-red-500 flex-shrink-0" />}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">No due date</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{formatDateSafe(createdAt)}</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <select
                        value={bug.frequency || 'Sometimes'}
                        onChange={(e) => handleFrequencyChange(bug.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {['Always', 'Often', 'Sometimes', 'Rarely', 'Once'].map((freq) => (
                            <option key={freq} value={freq}>
                                {freq}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 min-w-[112px] align-middle">
                <MultiSelectDropdown
                    options={testCaseOptions}
                    value={linkedTestCaseIds}
                    onChange={(newTestCases) => onLinkTestCase && onLinkTestCase(bug.id, newTestCases)}
                    placeholder="Link Test Cases..."
                />
            </td>
            <td className="px-4 py-3 whitespace-nowrap w-8 min-w-[32px] align-middle">
                <div className="flex items-center justify-center">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                </div>
            </td>
        </tr>
    );
};

export default BugRow;