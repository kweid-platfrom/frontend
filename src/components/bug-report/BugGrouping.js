/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

const BugGrouping = () => {
    // Sample data
    const [bugs, setBugs] = useState([
        {
            id: 'bug-1',
            title: 'Login page not responsive',
            description: 'The login form breaks on mobile devices',
            severity: 'high',
            status: 'new',
            assignedTo: 'user-1',
            category: 'UI/UX',
            createdAt: new Date('2024-01-15'),
            dueDate: new Date('2024-02-01'),
            sprintId: 'sprint-1'
        },
        {
            id: 'bug-2',
            title: 'Database connection timeout',
            description: 'Random connection timeouts during peak hours',
            severity: 'critical',
            status: 'in progress',
            assignedTo: 'user-2',
            category: 'Backend',
            createdAt: new Date('2024-01-20'),
            dueDate: new Date('2024-01-25'),
            sprintId: 'sprint-2'
        },
        {
            id: 'bug-3',
            title: 'Button color inconsistency',
            description: 'Primary buttons have different colors across pages',
            severity: 'low',
            status: 'new',
            assignedTo: 'user-1',
            category: 'UI/UX',
            createdAt: new Date('2024-02-05'),
            dueDate: new Date('2024-02-15'),
            sprintId: null
        }
    ]);

    const [sprints, setSprints] = useState([
        {
            id: 'sprint-1',
            name: 'Sprint 1',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-14'),
            status: 'completed'
        },
        {
            id: 'sprint-2',
            name: 'Sprint 2',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-01-28'),
            status: 'active'
        }
    ]);

    const [teamMembers] = useState([
        { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' }
    ]);

    const [selectedBugs, setSelectedBugs] = useState([]);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [groupBy, setGroupBy] = useState('month');
    const [subGroupBy, setSubGroupBy] = useState('none'); // For sprint sub-grouping
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
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
                    const date = new Date(bug.createdAt);
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
    }, [bugs, sprints, groupBy, subGroupBy]);

    const createSubGroups = (bugs, subGroupType) => {
        const subGroups = {};
        
        bugs.forEach(bug => {
            let subGroupKey, subGroupLabel;
            
            switch (subGroupType) {
                case 'week':
                    const weekNumber = getWeekNumber(new Date(bug.createdAt));
                    subGroupKey = `week-${weekNumber}`;
                    subGroupLabel = `Week ${weekNumber}`;
                    break;
                case 'month':
                    const date = new Date(bug.createdAt);
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

    const getTeamMemberName = (memberId) => {
        if (!memberId) return 'Unassigned';
        const member = teamMembers.find(m => m.id === memberId);
        return member ? member.name : 'Unassigned';
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in progress': return 'bg-purple-100 text-purple-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const toggleGroupCollapse = (groupId) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleDragStart = (e, bug) => {
        setDraggedBug(bug);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    };

    const handleDragOver = (e, groupId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroup(groupId);
    };

    const handleDragLeave = () => {
        setDragOverGroup(null);
    };

    const handleDrop = (e, targetGroupId) => {
        e.preventDefault();
        setDragOverGroup(null);
        
        if (!draggedBug) return;
        
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
        
        setBugs(prev => prev.map(bug => 
            bug.id === draggedBug.id ? updatedBug : bug
        ));
        
        setDraggedBug(null);
    };

    const createNewGroup = () => {
        if (!newGroupName.trim()) return;
        
        if (groupBy === 'sprint') {
            const newSprint = {
                id: `sprint-${Date.now()}`,
                name: newGroupName,
                startDate: new Date(),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
                status: 'planning'
            };
            setSprints(prev => [...prev, newSprint]);
        } else if (groupBy === 'month') {
            // For month grouping, we could create a placeholder month
            // This would typically involve creating bugs or tasks for future months
            console.log('Creating new month group:', newGroupName);
        }
        
        setNewGroupName('');
        setShowCreateGroup(false);
    };

    const moveSelectedBugs = (targetGroupId) => {
        if (selectedBugs.length === 0) return;
        
        setBugs(prev => prev.map(bug => {
            if (!selectedBugs.includes(bug.id)) return bug;
            
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
            
            return updatedBug;
        }));
        
        setSelectedBugs([]);
    };

    const getGroupIcon = (type) => {
        switch (type) {
            case 'month': return <Calendar className="h-4 w-4" />;
            case 'sprint': return <Flag className="h-4 w-4" />;
            case 'assignee': return <User className="h-4 w-4" />;
            case 'status': return <Clock className="h-4 w-4" />;
            case 'severity': return <AlertTriangle className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const getGroupColor = (type) => {
        switch (type) {
            case 'month': return 'bg-blue-500';
            case 'sprint': return 'bg-green-500';
            case 'assignee': return 'bg-purple-500';
            case 'status': return 'bg-orange-500';
            case 'severity': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Enhanced Bug Grouping System</h1>
                
                {/* Group Controls */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Group by:</label>
                        <select 
                            value={groupBy} 
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">None</option>
                            <option value="month">Month</option>
                            <option value="sprint">Sprint</option>
                            <option value="assignee">Assignee</option>
                            <option value="status">Status</option>
                            <option value="severity">Severity</option>
                        </select>
                    </div>
                    
                    {groupBy === 'sprint' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Sub-group by:</label>
                            <select 
                                value={subGroupBy} 
                                onChange={(e) => setSubGroupBy(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="none">None</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                            </select>
                        </div>
                    )}
                    
                    {(groupBy === 'month' || groupBy === 'sprint') && (
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Create {groupBy === 'month' ? 'Month' : 'Sprint'}
                        </button>
                    )}
                </div>

                {/* Selected Items Actions */}
                {selectedBugs.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
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
            </div>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">
                            Create New {groupBy === 'month' ? 'Month' : 'Sprint'}
                        </h3>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder={`Enter ${groupBy} name`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && createNewGroup()}
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowCreateGroup(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createNewGroup}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grouped Bug List */}
            <div className="space-y-4">
                {groupedBugs.map((group) => {
                    const isCollapsed = collapsedGroups[group.id];
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
                            {/* Group Header */}
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
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Group Content */}
                            {(!isCollapsed || groupBy === 'none') && (
                                <div className="bg-white">
                                    {/* Sub-groups */}
                                    {group.subGroups && group.subGroups.length > 0 ? (
                                        <div className="space-y-2 p-2">
                                            {group.subGroups.map(subGroup => (
                                                <div key={subGroup.id} className="border border-gray-100 rounded">
                                                    <div className="bg-gray-25 p-2 border-b">
                                                        <h4 className="font-medium text-sm text-gray-700">{subGroup.label}</h4>
                                                    </div>
                                                    <div className="p-2">
                                                        {subGroup.bugs.map(bug => (
                                                            <BugCard 
                                                                key={bug.id} 
                                                                bug={bug} 
                                                                selectedBugs={selectedBugs}
                                                                setSelectedBugs={setSelectedBugs}
                                                                onDragStart={handleDragStart}
                                                                getSeverityColor={getSeverityColor}
                                                                getStatusColor={getStatusColor}
                                                                formatDate={formatDate}
                                                                getTeamMemberName={getTeamMemberName}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        // Regular bug list
                                        <div className="divide-y divide-gray-100">
                                            {group.bugs.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500">
                                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No bugs in this {group.type}</p>
                                                    <p className="text-sm mt-1">Drag bugs here or create new ones</p>
                                                </div>
                                            ) : (
                                                group.bugs.map(bug => (
                                                    <BugCard 
                                                        key={bug.id} 
                                                        bug={bug} 
                                                        selectedBugs={selectedBugs}
                                                        setSelectedBugs={setSelectedBugs}
                                                        onDragStart={handleDragStart}
                                                        getSeverityColor={getSeverityColor}
                                                        getStatusColor={getStatusColor}
                                                        formatDate={formatDate}
                                                        getTeamMemberName={getTeamMemberName}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Bug Card Component
const BugCard = ({ 
    bug, 
    selectedBugs, 
    setSelectedBugs, 
    onDragStart, 
    getSeverityColor, 
    getStatusColor, 
    formatDate, 
    getTeamMemberName 
}) => {
    const toggleBugSelection = (bugId) => {
        setSelectedBugs(prev => 
            prev.includes(bugId) 
                ? prev.filter(id => id !== bugId) 
                : [...prev, bugId]
        );
    };

    return (
        <div
            className={`p-4 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing ${
                selectedBugs.includes(bug.id) ? 'bg-blue-50' : ''
            }`}
            draggable
            onDragStart={(e) => onDragStart(e, bug)}
        >
            <div className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    checked={selectedBugs.includes(bug.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleBugSelection(bug.id);
                    }}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                            <span>#{bug.id.slice(-6)}</span>
                            <span>{getTeamMemberName(bug.assignedTo)}</span>
                            {bug.dueDate && (
                                <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(bug.dueDate)}
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

export default BugGrouping;