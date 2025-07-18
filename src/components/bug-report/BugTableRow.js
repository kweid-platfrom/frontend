'use client';
import React, { useState } from 'react';
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
    Square,
    ChevronDown
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
import { toast } from 'sonner';

const VALID_FREQUENCIES = ['Always', 'Often', 'Sometimes', 'Rarely', 'Once'];

const MultiSelectDropdown = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const validOptions = Array.isArray(options) ? options.filter(opt => opt?.value && opt?.label) : [];

    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleDropdownClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (e, optionValue) => {
        e.stopPropagation();
        e.preventDefault();
        handleToggle(optionValue);
    };

    const handleCheckboxChange = (e, optionValue) => {
        e.stopPropagation();
        e.preventDefault();
        handleToggle(optionValue);
    };

    console.log('MultiSelectDropdown options in BugTableRow:', {
        validOptions,
        value,
        optionsLength: validOptions.length,
        valueLength: value.length
    });

    return (
        <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <div
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white flex items-center justify-between"
                onClick={handleDropdownClick}
            >
                <span className="truncate">
                    {value.length > 0 && validOptions.length > 0
                        ? value.map(v => validOptions.find(o => o.value === v)?.label).filter(Boolean).join(', ')
                        : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {validOptions.length > 0 ? (
                        validOptions.map(option => (
                            <div
                                key={option.value}
                                className="flex items-center px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => handleOptionClick(e, option.value)}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={(e) => handleCheckboxChange(e, option.value)}
                                    className="mr-2"
                                />
                                <span className="truncate">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">
                            No test cases available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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
    onUpdateBugFrequency,
    onShowBugDetails,
    onChatClick,
    teamMembers = [],
    environments = [],
    testCases = [],
    onLinkTestCase
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

    const getFirstName = (user) => {
        if (!user) return 'Unknown';
        if (typeof user === 'string') {
            if (user.includes('@')) {
                return user.split('@')[0];
            }
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

    const getUserFriendlyBugId = (bugId) => {
        if (!bugId) return 'Unknown';
        return `BUG-${bugId.slice(-6).toUpperCase()}`;
    };

    const formatDateSafe = (date) => {
        if (!date) return 'Not set';
        try {
            if (date.toDate) {
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

    const handleTestCaseLink = async (newTestCases) => {
        console.log('Linking test cases:', { bugId: bug.id, newTestCases });
        if (onLinkTestCase) {
            try {
                await onLinkTestCase(bug.id, newTestCases);
                toast.success(`Updated test case links for bug`);
            } catch (error) {
                console.error('Failed to link test cases:', error);
                toast.error('Failed to link test cases');
            }
        } else {
            console.warn('onLinkTestCase function not provided');
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
        if (onChatClick) {
            onChatClick(bug, event);
        } else if (onShowBugDetails) {
            onShowBugDetails(bug);
        } else {
            console.warn('Neither onChatClick nor onShowBugDetails function provided');
        }
    };

    const totalAttachments = bug?.attachments?.length || 0;
    const evidenceCount = getEvidenceCount(bug);
    
    const getAssignedUser = () => {
        if (bug.assigned_to) return bug.assigned_to;
        if (bug.created_by) return bug.created_by;
        if (bug.reportedByEmail) return bug.reportedByEmail;
        return '';
    };
    
    const assignedUser = getAssignedUser();
    const isSelected = selectedIds.includes(bug.id);
    const ROW_HEIGHT = 'h-12';
    const CELL_VERTICAL_ALIGN = 'align-middle';
    
    const reporterName = getFirstName(bug.created_by || bug.reportedByEmail);

    const rowClassName = `${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${
        selectedBug?.id === bug?.id ? 'bg-blue-50' : ''
    } ${isSelected ? 'bg-blue-50' : ''}`;

    // Create test case options with proper structure
    const testCaseOptions = Array.isArray(testCases)
        ? testCases.map(tc => ({
              value: tc.id || tc.testCaseId || `tc_${Math.random().toString(36).slice(2)}`,
              label: tc.title || `Test Case ${tc.id?.slice(-6) || tc.testCaseId?.slice(-6) || 'Unknown'}`
          }))
        : [];

    // Get current linked test cases - handle both array of IDs and array of objects
    const currentLinkedTestCases = bug?.linkedTestCases || [];
    const linkedTestCaseIds = Array.isArray(currentLinkedTestCases) 
        ? currentLinkedTestCases.map(tc => typeof tc === 'string' ? tc : tc.id || tc.testCaseId).filter(Boolean)
        : [];

    console.log('BugTableRow props:', { 
        bugId: bug.id, 
        testCases: testCases?.length || 0, 
        testCaseOptions: testCaseOptions?.length || 0, 
        linkedTestCases: bug?.linkedTestCases,
        linkedTestCaseIds 
    });

    return (
        <tr
            key={`bug-${bug.id}`}
            className={rowClassName}
            draggable={true}
            onDragStart={(e) => onDragStart && onDragStart(e, bug)}
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
                                className="font-medium text-gray-900 truncate text-sm leading-tight"
                                title={bug.title}
                            >
                                {bug.title || 'Untitled Bug'}
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
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getStatusColor(bug?.status)}`}
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
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full cursor-pointer bg-white`}
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
                        className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-teal-500 cursor-pointer w-full ${getSeverityColor(bug?.severity)}`}
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
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white`}
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
                    {bug.due_date ? (
                        <div className={`flex items-center ${isPastDue(bug.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="text-xs">{formatDateSafe(bug.due_date)}</span>
                            {isPastDue(bug.due_date) && (
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
                        <span className="truncate">{formatDateSafe(bug.created_at)}</span>
                    </div>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-24 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <select
                        value={bug?.frequency || 'Sometimes'}
                        onChange={(e) => handleFrequencyChange(bug.id, e.target.value, e)}
                        className={`text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 cursor-pointer w-full bg-white`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {VALID_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                        ))}
                    </select>
                </div>
            </td>
            <td className={`px-4 py-3 whitespace-nowrap border-r border-gray-200 w-28 ${CELL_VERTICAL_ALIGN}`}>
                <div className="flex items-center">
                    <MultiSelectDropdown
                        options={testCaseOptions}
                        value={linkedTestCaseIds}
                        onChange={handleTestCaseLink}
                        placeholder="Link Test Cases..."
                    />
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