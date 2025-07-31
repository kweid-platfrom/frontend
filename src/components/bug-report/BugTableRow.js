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
import { useState, useEffect } from 'react';
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
    // Local state to track loading states for each dropdown
    const [loadingStates, setLoadingStates] = useState({
        status: false,
        severity: false,
        assignment: false,
        environment: false,
        frequency: false,
    });

    // Local state to track the current values to prevent flickering
    const [currentValues, setCurrentValues] = useState({
        status: bug.status || 'New',
        severity: bug.severity || 'Low',
        assignment: bug.assigned_to || '',
        environment: bug.environment || 'Production',
        frequency: bug.frequency || 'Sometimes',
    });

    const createdAt = bug.created_at instanceof Date ? bug.created_at : new Date(bug.created_at);
    const dueDate = bug.due_date ? (bug.due_date instanceof Date ? bug.due_date : new Date(bug.due_date)) : null;
    const linkedTestCaseIds =
        relationships[bug.id] ||
        (bug.linkedTestCases?.map((tc) => (typeof tc === 'string' ? tc : tc.id || tc.testCaseId)).filter(Boolean)) ||
        [];
    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    const reporterName = getReporterFirstName(bug.created_by || bug.reportedByEmail) || 'Unknown';

    // Generic handler factory with improved error handling and optimistic updates
    const createChangeHandler = (field, handler) => async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const newValue = e.target.value;
        const originalValue = currentValues[field];

        // Don't proceed if value hasn't changed
        if (newValue === originalValue) {
            return;
        }

        // Optimistic update - immediately update the UI
        setCurrentValues(prev => ({ ...prev, [field]: newValue }));

        // Set loading state
        setLoadingStates(prev => ({ ...prev, [field]: true }));

        try {
            await handler(bug.id, newValue);
            // Success - the optimistic update is kept
            console.log(`✅ ${field} updated successfully:`, newValue);
        } catch (error) {
            console.error(`❌ ${field} change failed:`, error);
            // Revert optimistic update on error
            setCurrentValues(prev => ({ ...prev, [field]: originalValue }));

            // Show user-friendly error message specific to the field
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            toast.error(`Failed to update ${fieldName.toLowerCase()}: ${error.message}`);
        } finally {
            // Clear loading state
            setLoadingStates(prev => ({ ...prev, [field]: false }));
        }
    };
    // Update current values when bug prop changes (from parent re-render)
    useEffect(() => {
        setCurrentValues({
            status: bug.status || 'New',
            severity: bug.severity || 'Low',
            assignment: bug.assigned_to || '',
            environment: bug.environment || 'Production',
            frequency: bug.frequency || 'Sometimes',
        });
    }, [bug.status, bug.severity, bug.assigned_to, bug.environment, bug.frequency]);

    // Enhanced event handlers
    const handleStatusChangeWithPrevention = createChangeHandler('status', handleStatusChange);
    const handleSeverityChangeWithPrevention = createChangeHandler('severity', handleSeverityChange);
    const handleAssignmentChangeWithPrevention = createChangeHandler('assignment', handleAssignmentChange);
    const handleEnvironmentChangeWithPrevention = createChangeHandler('environment', handleEnvironmentChange);
    const handleFrequencyChangeWithPrevention = createChangeHandler('frequency', handleFrequencyChange);

    const handleTestCaseLinkChange = async (newTestCases) => {
        try {
            if (onLinkTestCase) {
                await onLinkTestCase(bug.id, newTestCases);
            }
        } catch (error) {
            console.error('Test case linking failed:', error);
        }
    };

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
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(bug.id, false);
                            }}
                        />
                    ) : (
                        <Square
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(bug.id, true);
                            }}
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
                        value={currentValues.status}
                        onChange={handleStatusChangeWithPrevention}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={loadingStates.status}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full transition-opacity ${loadingStates.status ? 'opacity-50 cursor-not-allowed' : ''
                            } ${getStatusColor(currentValues.status)}`}
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
                        value={currentValues.assignment}
                        onChange={handleAssignmentChangeWithPrevention}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={loadingStates.assignment}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white transition-opacity ${loadingStates.assignment ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(getPriorityFromSeverity(currentValues.severity))}`}
                    >
                        {getPriorityFromSeverity(currentValues.severity) || 'Low'}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 min-w-[96px] align-middle">
                <div className="flex items-center">
                    <select
                        value={currentValues.severity}
                        onChange={handleSeverityChangeWithPrevention}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={loadingStates.severity}
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full transition-opacity ${loadingStates.severity ? 'opacity-50 cursor-not-allowed' : ''
                            } ${getStatusColor(currentValues.severity)}`}
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
                        value={currentValues.environment}
                        onChange={handleEnvironmentChangeWithPrevention}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={loadingStates.environment}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white transition-opacity ${loadingStates.environment ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                        value={currentValues.frequency}
                        onChange={handleFrequencyChangeWithPrevention}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={loadingStates.frequency}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white transition-opacity ${loadingStates.frequency ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
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
                    onChange={handleTestCaseLinkChange}
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