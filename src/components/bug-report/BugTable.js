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

const BugTable = ({ 
    bugs, 
    selectedBugs, 
    onBugSelect, 
    selectedBug, 
    toggleBugSelection, 
    toggleGroupSelection, 
    allGroupSelected, 
    isGroupSelected, 
    handleDragStart, 
    getSeverityColor, 
    getStatusColor, 
    getPriorityColor,
    formatDate, 
    getTeamMemberName, 
    updateBugStatus,
    updateBugSeverity,
    updateBugAssignment,
    teamMembers = []
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

    const getSourceColor = (source) => {
        switch (source) {
            case 'manual':
                return 'bg-blue-100 text-blue-800';
            case 'automated':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getFrequencyColor = (frequency) => {
        switch (frequency?.toLowerCase()) {
            case 'always':
                return 'bg-red-100 text-red-800';
            case 'often':
                return 'bg-orange-100 text-orange-800';
            case 'sometimes':
                return 'bg-yellow-100 text-yellow-800';
            case 'rarely':
                return 'bg-green-100 text-green-800';
            case 'once':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getEnvironmentColor = (environment) => {
        switch (environment?.toLowerCase()) {
            case 'production':
                return 'bg-red-100 text-red-800';
            case 'staging':
                return 'bg-yellow-100 text-yellow-800';
            case 'development':
                return 'bg-green-100 text-green-800';
            case 'testing':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isPastDue = (dueDate) => {
        if (!dueDate) return false;
        const date = dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
        return date < new Date();
    };

    // Auto-determine priority based on severity
    const getPriorityFromSeverity = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return 'High';
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

    const handleSeverityChange = (bugId, newSeverity) => {
        const newPriority = getPriorityFromSeverity(newSeverity);
        if (updateBugSeverity) {
            updateBugSeverity(bugId, newSeverity, newPriority);
        }
    };

    // Get auto-assigned user (creator) or assigned user
    const getAssignedUser = (bug) => {
        return bug.assignedTo || bug.reportedByEmail || bug.createdBy;
    };

    // Fixed row height to ensure alignment - using flex for better control
    const ROW_HEIGHT = 'h-16'; // Fixed height for all rows

    return (
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Fixed Left Columns */}
            <div className="flex-shrink-0 border-r border-gray-200">
                <table className="divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-12"> {/* Fixed header height */}
                            <th scope="col" className="w-10 p-3">
                                {toggleGroupSelection && (
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                        onChange={toggleGroupSelection}
                                        checked={allGroupSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = isGroupSelected && !allGroupSelected;
                                        }}
                                    />
                                )}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[300px] min-w-[300px] max-w-[300px]">
                                Bug Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map((bug) => (
                            <tr
                                key={bug.id}
                                className={`${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${
                                    selectedBug?.id === bug.id ? 'bg-blue-50' : ''
                                } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart && handleDragStart(e, bug)}
                            >
                                <td className="p-3 align-top">
                                    <input
                                        type="checkbox"
                                        checked={selectedBugs.includes(bug.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleBugSelection(bug.id);
                                        }}
                                        className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                    />
                                </td>
                                
                                {/* Bug Details - Cleaned up title without tags */}
                                <td 
                                    className="px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] cursor-pointer hover:bg-blue-50"
                                    onClick={() => onBugSelect(bug)}
                                >
                                    <div className="flex flex-col justify-center h-full space-y-2">
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
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-12"> {/* Fixed header height to match left table */}
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Bug ID
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Tags
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Priority
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Severity
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Status
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Environment
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Frequency
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Evidence
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Assigned To
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Reporter
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Source
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Device/Browser
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Due Date
                            </th>
                            <th scope="col" className="border-r border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                Created
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-8">
                                
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs.map((bug) => {
                            const totalAttachments = bug.attachments?.length || 0;
                            const evidenceCount = [
                                bug.hasAttachments,
                                bug.hasVideoEvidence,
                                bug.hasConsoleLogs,
                                bug.hasNetworkLogs
                            ].filter(Boolean).length;
                            
                            return (
                                <tr
                                    key={bug.id}
                                    className={`${ROW_HEIGHT} hover:bg-gray-50 transition-colors ${
                                        selectedBug?.id === bug.id ? 'bg-blue-50' : ''
                                    } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                #{bug.id?.slice(-6) || 'N/A'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* New Tags Column */}
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            {bug.tags && bug.tags.length > 0 ? (
                                                <div className="flex items-center gap-1 overflow-hidden max-w-32">
                                                    {bug.tags.slice(0, 2).map((tag, index) => (
                                                        <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 flex-shrink-0">
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

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor ? getPriorityColor(getPriorityFromSeverity(bug.severity)) : 'bg-gray-100 text-gray-800'}`}>
                                                {getPriorityFromSeverity(bug.severity)}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <select
                                                value={bug.severity || 'Low'}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleSeverityChange(bug.id, e.target.value);
                                                }}
                                                className={`text-xs px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-[#00897B] cursor-pointer ${getSeverityColor ? getSeverityColor(bug.severity) : 'bg-gray-100 text-gray-800'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Critical">Critical</option>
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            {updateBugStatus ? (
                                                <select
                                                    value={bug.status || 'New'}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateBugStatus(bug.id, e.target.value);
                                                    }}
                                                    className={`text-xs px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-[#00897B] cursor-pointer ${getStatusColor ? getStatusColor(bug.status) : 'bg-gray-100 text-gray-800'}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="New">New</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Blocked">Blocked</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor ? getStatusColor(bug.status) : 'bg-gray-100 text-gray-800'}`}>
                                                    {bug.status || 'New'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnvironmentColor(bug.environment)}`}>
                                                {bug.environment || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(bug.frequency)}`}>
                                                {bug.frequency || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Evidence Column */}
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center space-x-1">
                                                {bug.hasAttachments && totalAttachments > 0 && (
                                                    <div className="flex items-center bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
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

                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            {updateBugAssignment ? (
                                                <select
                                                    value={getAssignedUser(bug) || ''}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateBugAssignment(bug.id, e.target.value);
                                                    }}
                                                    className="text-xs px-2 py-1 rounded border-gray-300 focus:ring-2 focus:ring-[#00897B] focus:border-[#00897B] max-w-32 cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map((member) => (
                                                        <option key={member.id} value={member.email}>
                                                            {member.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex items-center">
                                                    <User className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span className="truncate max-w-24">
                                                        {getTeamMemberName(getAssignedUser(bug))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <div className="truncate max-w-24" title={bug.reportedByEmail}>
                                                {bug.reportedByEmail?.split('@')[0] || 'Unknown'}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getSourceColor(bug.source)}`}>
                                                {getSourceIcon(bug.source)}
                                                <span className="ml-1 capitalize">{bug.source || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center">
                                                <Monitor className="h-3 w-3 mr-1 text-gray-400" />
                                                <div>
                                                    <div className="truncate max-w-20">{bug.browserInfo || 'Unknown'}</div>
                                                    <div className="text-gray-500 truncate max-w-20">{bug.deviceInfo?.split(',')[0] || ''}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            {bug.dueDate ? (
                                                <div className={`flex items-center ${isPastDue(bug.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">{formatDate(bug.dueDate)}</span>
                                                    {isPastDue(bug.dueDate) && (
                                                        <AlertTriangle className="h-3 w-3 ml-1 text-red-500" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No due date</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 border-r border-gray-200">
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDate(bug.createdAt)}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
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