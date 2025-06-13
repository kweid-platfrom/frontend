/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo } from "react";
import { 
    Calendar, 
    User, 
    AlertTriangle, 
    ChevronDown, 
    ChevronRight,
    Users, 
    Clock,
    Flag,
    AlertCircle,
    Plus,
    GripVertical
} from "lucide-react";
import { BugAntIcon } from "@heroicons/react/24/outline";
import GroupCreationModal from '../modals/GroupCreationModal';
import BugTable from './BugTable';

const BugList = ({ 
    bugs, 
    onBugSelect, 
    selectedBug, 
    getSeverityColor, 
    getStatusColor, 
    getPriorityFromSeverity,
    formatDate,
    teamMembers = [],
    updateBugStatus,
    viewMode = 'list',
    groupBy = 'none',
    subGroupBy = 'none', // New prop for sub-grouping
    sprints = [], // New prop for sprint data
    onCreateSprint, // New prop for creating sprints
    onUpdateBug, // New prop for updating bugs
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [draggedBug, setDraggedBug] = useState(null);
    const [dragOverGroup, setDragOverGroup] = useState(null);

    // Enhanced grouping logic with sub-grouping support
    const groupedBugs = useMemo(() => {
        if (groupBy === 'none') {
            return [{
                id: 'all',
                type: 'all',
                label: 'All Bugs',
                bugs: bugs,
                count: bugs.length,
                subGroups: []
            }];
        }

        const groups = {};
        
        bugs.forEach(bug => {
            let groupKey, groupLabel, groupType;
            
            switch (groupBy) {
                case 'month':
                    const date = bug.createdAt?.seconds ? 
                        new Date(bug.createdAt.seconds * 1000) : 
                        new Date(bug.createdAt);
                    groupKey = `${date.getFullYear()}-${date.getMonth()}`;
                    groupLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    groupType = 'month';
                    break;
                    
                case 'sprint':
                    const sprint = sprints.find(s => s.id === bug.sprintId);
                    groupKey = bug.sprintId || 'no-sprint';
                    groupLabel = sprint ? sprint.name : 'No Sprint';
                    groupType = 'sprint';
                    break;
                    
                case 'assignee':
                    groupKey = bug.assignedTo || 'unassigned';
                    groupLabel = getTeamMemberName(bug.assignedTo) || 'Unassigned';
                    groupType = 'assignee';
                    break;
                    
                case 'status':
                    groupKey = bug.status || 'new';
                    groupLabel = (bug.status || 'new').charAt(0).toUpperCase() + (bug.status || 'new').slice(1);
                    groupType = 'status';
                    break;
                    
                case 'severity':
                    groupKey = bug.severity || 'low';
                    groupLabel = (bug.severity || 'low').charAt(0).toUpperCase() + (bug.severity || 'low').slice(1);
                    groupType = 'severity';
                    break;
                    
                default:
                    groupKey = 'all';
                    groupLabel = 'All Bugs';
                    groupType = 'all';
            }
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    id: groupKey,
                    type: groupType,
                    label: groupLabel,
                    bugs: [],
                    count: 0,
                    subGroups: []
                };
            }
            
            groups[groupKey].bugs.push(bug);
            groups[groupKey].count++;
        });

        // Apply sub-grouping for sprints
        if (groupBy === 'sprint' && subGroupBy !== 'none') {
            Object.values(groups).forEach(group => {
                if (group.type === 'sprint' && group.bugs.length > 0) {
                    group.subGroups = createSubGroups(group.bugs, subGroupBy);
                }
            });
        }
        
        return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
    }, [bugs, sprints, groupBy, subGroupBy, teamMembers]);

    const createSubGroups = (bugs, subGroupType) => {
        const subGroups = {};
        
        bugs.forEach(bug => {
            let subGroupKey, subGroupLabel;
            
            switch (subGroupType) {
                case 'week':
                    const weekNumber = getWeekNumber(new Date(bug.createdAt?.seconds ? bug.createdAt.seconds * 1000 : bug.createdAt));
                    subGroupKey = `week-${weekNumber}`;
                    subGroupLabel = `Week ${weekNumber}`;
                    break;
                case 'month':
                    const date = new Date(bug.createdAt?.seconds ? bug.createdAt.seconds * 1000 : bug.createdAt);
                    subGroupKey = `${date.getFullYear()}-${date.getMonth()}`;
                    subGroupLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    break;
                default:
                    return [];
            }
            
            if (!subGroups[subGroupKey]) {
                subGroups[subGroupKey] = {
                    id: subGroupKey,
                    label: subGroupLabel,
                    bugs: []
                };
            }
            
            subGroups[subGroupKey].bugs.push(bug);
        });
        
        return Object.values(subGroups);
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const isPastDue = (dueDate) => {
        if (!dueDate) return false;
        const date = dueDate.seconds ? new Date(dueDate.seconds * 1000) : new Date(dueDate);
        return date < new Date();
    };

    const getTeamMemberName = (memberId) => {
        if (!memberId) return 'Unassigned';
        const member = teamMembers.find(m => m.id === memberId || m.userId === memberId);
        return member ? (member.name || member.displayName || member.email) : 'Unassigned';
    };

    const toggleGroupCollapse = (groupId) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const toggleSelectAll = () => {
        if (selectedBugs.length === bugs.length) {
            setSelectedBugs([]);
        } else {
            setSelectedBugs(bugs.map(bug => bug.id));
        }
    };

    const toggleBugSelection = (bugId) => {
        setSelectedBugs(prev => 
            prev.includes(bugId) 
                ? prev.filter(id => id !== bugId) 
                : [...prev, bugId]
        );
    };

    const toggleGroupSelection = (group) => {
        const groupBugIds = group.bugs.map(bug => bug.id);
        const allSelected = groupBugIds.every(id => selectedBugs.includes(id));
        
        if (allSelected) {
            setSelectedBugs(prev => prev.filter(id => !groupBugIds.includes(id)));
        } else {
            setSelectedBugs(prev => [...new Set([...prev, ...groupBugIds])]);
        }
    };

    const handleDragStart = (e, bug) => {
        setDraggedBug(bug);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(e, bug);
    };

    const handleDragOver = (e, groupId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroup(groupId);
        if (onDragOver) onDragOver(e);
    };

    const handleDragLeave = () => {
        setDragOverGroup(null);
    };

    const handleDrop = (e, targetGroupId) => {
        e.preventDefault();
        setDragOverGroup(null);
        
        if (!draggedBug || !onUpdateBug) return;
        
        // Update bug based on target group
        const updatedBug = { ...draggedBug };
        
        if (groupBy === 'sprint') {
            updatedBug.sprintId = targetGroupId === 'no-sprint' ? null : targetGroupId;
        } else if (groupBy === 'assignee') {
            updatedBug.assignedTo = targetGroupId === 'unassigned' ? null : targetGroupId;
        } else if (groupBy === 'status') {
            updatedBug.status = targetGroupId;
        } else if (groupBy === 'severity') {
            updatedBug.severity = targetGroupId;
        }
        
        onUpdateBug(updatedBug);
        setDraggedBug(null);
        
        if (onDrop) onDrop(e, targetGroupId);
    };

    const moveSelectedBugs = (targetGroupId) => {
        if (selectedBugs.length === 0 || !onUpdateBug) return;
        
        selectedBugs.forEach(bugId => {
            const bug = bugs.find(b => b.id === bugId);
            if (!bug) return;
            
            const updatedBug = { ...bug };
            
            if (groupBy === 'sprint') {
                updatedBug.sprintId = targetGroupId === 'no-sprint' ? null : targetGroupId;
            } else if (groupBy === 'assignee') {
                updatedBug.assignedTo = targetGroupId === 'unassigned' ? null : targetGroupId;
            } else if (groupBy === 'status') {
                updatedBug.status = targetGroupId;
            } else if (groupBy === 'severity') {
                updatedBug.severity = targetGroupId;
            }
            
            onUpdateBug(updatedBug);
        });
        
        setSelectedBugs([]);
    };

    const getGroupIcon = (type) => {
        switch (type) {
            case 'month':
                return <Calendar className="h-4 w-4" />;
            case 'sprint':
                return <Flag className="h-4 w-4" />;
            case 'assignee':
                return <User className="h-4 w-4" />;
            case 'status':
                return <Clock className="h-4 w-4" />;
            case 'severity':
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getGroupColor = (type) => {
        switch (type) {
            case 'month':
                return 'bg-blue-500';
            case 'sprint':
                return 'bg-green-500';
            case 'assignee':
                return 'bg-purple-500';
            case 'status':
                return 'bg-orange-500';
            case 'severity':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (bugs.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <BugAntIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-lg">No bugs found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Group Creation Controls */}
            {(groupBy === 'month' || groupBy === 'sprint') && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-brand-300 text-white rounded hover:bg-brand-400 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Create {groupBy === 'month' ? 'Month' : 'Sprint'}
                    </button>
                </div>
            )}

            {/* Selected Items Actions */}
            {selectedBugs.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedBugs.length} bug{selectedBugs.length !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <select 
                                onChange={(e) => e.target.value && moveSelectedBugs(e.target.value)}
                                className="px-2 py-1 text-xs border border-blue-300 rounded"
                                defaultValue=""
                            >
                                <option value="">Move to...</option>
                                {groupedBugs.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setSelectedBugs([])}
                                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global selection controls when grouped */}
            {groupBy !== 'none' && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                            onChange={toggleSelectAll}
                            checked={selectedBugs.length === bugs.length && bugs.length > 0}
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Select All ({bugs.length} bugs)
                        </span>
                    </div>
                    {selectedBugs.length > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {selectedBugs.length} selected
                        </span>
                    )}
                </div>
            )}

            {/* Render groups */}
            {groupedBugs.map((group) => {
                const isCollapsed = collapsedGroups[group.id];
                const isGroupSelected = group.bugs.some(bug => selectedBugs.includes(bug.id));
                const allGroupSelected = group.bugs.length > 0 && group.bugs.every(bug => selectedBugs.includes(bug.id));
                const isDragOver = dragOverGroup === group.id;

                return (
                    <div 
                        key={group.id} 
                        className={`border rounded-lg overflow-hidden shadow-sm transition-all ${
                            isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onDragOver={(e) => handleDragOver(e, group.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, group.id)}
                    >
                        {/* Group Header - only show if grouped */}
                        {groupBy !== 'none' && (
                            <div className="flex items-center bg-gray-50 border-b">
                                <div className={`${getGroupColor(group.type)} w-1 self-stretch`}></div>
                                <button 
                                    className="p-4 flex items-center flex-grow hover:bg-gray-100 transition-colors"
                                    onClick={() => toggleGroupCollapse(group.id)}
                                >
                                    {isCollapsed ? 
                                        <ChevronRight className="h-4 w-4 mr-2 text-gray-500" /> : 
                                        <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                                    }
                                    <div className="flex items-center mr-3">
                                        {getGroupIcon(group.type)}
                                    </div>
                                    <div className="flex-grow text-left">
                                        <h3 className="font-semibold text-gray-900">{group.label}</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                                            {group.count} {group.count === 1 ? 'bug' : 'bugs'}
                                        </span>
                                        {isGroupSelected && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                {selectedBugs.filter(id => group.bugs.find(bug => bug.id === id)).length} selected
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Group Content */}
                        {(!isCollapsed || groupBy === 'none') && (
                            <div className="bg-white">
                                {group.bugs.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No bugs in this {group.type}</p>
                                        <p className="text-sm mt-1">Drag bugs here or create new ones</p>
                                    </div>
                                ) : group.subGroups && group.subGroups.length > 0 ? (
                                    // Sub-groups
                                    <div className="space-y-2 p-2">
                                        {group.subGroups.map(subGroup => (
                                            <div key={subGroup.id} className="border border-gray-100 rounded">
                                                <div className="bg-gray-25 p-2 border-b">
                                                    <h4 className="font-medium text-sm text-gray-700">{subGroup.label}</h4>
                                                </div>
                                                <div className="p-2">
                                                    {viewMode === 'table' ? (
                                                        <BugTable 
                                                            bugs={subGroup.bugs}
                                                            selectedBugs={selectedBugs}
                                                            onBugSelect={onBugSelect}
                                                            selectedBug={selectedBug}
                                                            toggleBugSelection={toggleBugSelection}
                                                            handleDragStart={handleDragStart}
                                                            getSeverityColor={getSeverityColor}
                                                            getStatusColor={getStatusColor}
                                                            getPriorityFromSeverity={getPriorityFromSeverity}
                                                            formatDate={formatDate}
                                                            getTeamMemberName={getTeamMemberName}
                                                            updateBugStatus={updateBugStatus}
                                                        />
                                                    ) : (
                                                        // List view for sub-groups
                                                        <div className="divide-y divide-gray-100">
                                                            {subGroup.bugs.map(bug => (
                                                                <BugCard 
                                                                    key={bug.id}
                                                                    bug={bug}
                                                                    selectedBugs={selectedBugs}
                                                                    selectedBug={selectedBug}
                                                                    onBugSelect={onBugSelect}
                                                                    toggleBugSelection={toggleBugSelection}
                                                                    handleDragStart={handleDragStart}
                                                                    getSeverityColor={getSeverityColor}
                                                                    getStatusColor={getStatusColor}
                                                                    formatDate={formatDate}
                                                                    getTeamMemberName={getTeamMemberName}
                                                                    isPastDue={isPastDue}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : viewMode === 'table' ? (
                                    <BugTable 
                                        bugs={group.bugs}
                                        selectedBugs={selectedBugs}
                                        onBugSelect={onBugSelect}
                                        selectedBug={selectedBug}
                                        toggleBugSelection={toggleBugSelection}
                                        toggleGroupSelection={() => toggleGroupSelection(group)}
                                        allGroupSelected={allGroupSelected}
                                        isGroupSelected={isGroupSelected}
                                        handleDragStart={handleDragStart}
                                        getSeverityColor={getSeverityColor}
                                        getStatusColor={getStatusColor}
                                        getPriorityFromSeverity={getPriorityFromSeverity}
                                        formatDate={formatDate}
                                        getTeamMemberName={getTeamMemberName}
                                        updateBugStatus={updateBugStatus}
                                    />
                                ) : (
                                    // List View
                                    <div className="divide-y divide-gray-100">
                                        {group.bugs.map(bug => (
                                            <BugCard 
                                                key={bug.id}
                                                bug={bug}
                                                selectedBugs={selectedBugs}
                                                selectedBug={selectedBug}
                                                onBugSelect={onBugSelect}
                                                toggleBugSelection={toggleBugSelection}
                                                handleDragStart={handleDragStart}
                                                getSeverityColor={getSeverityColor}
                                                getStatusColor={getStatusColor}
                                                formatDate={formatDate}
                                                getTeamMemberName={getTeamMemberName}
                                                isPastDue={isPastDue}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Group Creation Modal */}
            <GroupCreationModal 
                show={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                groupBy={groupBy}
                onCreateSprint={onCreateSprint}
            />
        </div>
    );
};

// Bug Card Component for List View
const BugCard = ({ 
    bug, 
    selectedBugs, 
    selectedBug,
    onBugSelect,
    toggleBugSelection, 
    handleDragStart, 
    getSeverityColor, 
    getStatusColor, 
    formatDate, 
    getTeamMemberName,
    isPastDue
}) => {
    return (
        <div
            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedBug?.id === bug.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            } ${selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''}`}
            onClick={() => onBugSelect(bug)}
            draggable
            onDragStart={(e) => handleDragStart(e, bug)}
        >
            <div className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    checked={selectedBugs.includes(bug.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleBugSelection(bug.id);
                    }}
                    className="mt-1 rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                />
                
                <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-grow">
                            <h4 className="font-medium text-gray-900 truncate">
                                {bug.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {bug.description}
                            </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                                {bug.severity}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)}`}>
                                {bug.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                            <span>#{bug.id?.slice(-6) || 'N/A'}</span>
                            <span>{getTeamMemberName(bug.assignedTo)}</span>
                            {bug.dueDate && (
                                <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(bug.dueDate)}
                                </span>
                            )}
                            {isPastDue(bug.dueDate) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Overdue
                                </span>
                            )}
                        </div>
                        <span>{formatDate(bug.createdAt)}</span>
                    </div>
                </div>
                
                <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
            </div>
        </div>
    );
};

export default BugList;