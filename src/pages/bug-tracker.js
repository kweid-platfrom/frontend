"use client"
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Filter, Users, Settings, MessageSquare } from "lucide-react";
import BugDetailsModal from "../components/BugDetailsModal";
import SelectionActionsModal from "../components/SelectionActionsModal";

const BugTracker = () => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedBug, setSelectedBug] = useState(null);
    const [groupColors, setGroupColors] = useState({});
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [teamMembers, setTeamMembers] = useState([
        "John Doe",
        "Jane Smith",
        "Alice Brown",
        "Bob Johnson",
        "Carla Rodriguez"
    ]);

    

    // Extended bug data with all required fields
    const [bugsData, setBugsData] = useState({
        "04/2025": [
            {
                id: "BUG-001",
                title: "Login button unresponsive",
                category: "UI",
                assignedTo: "John Doe",
                status: "Open",
                priority: "High",
                severity: "Critical",
                epic: "User Authentication",
                testCase: "TC-045",
                caseStatus: "Failed",
                dueDate: "04/15/2025",
                automated: "Yes",
                automationLink: "https://github.com/company/repo/tests/login-tests.js",
                creationLog: "04/01/2025 by Admin",
                comments: [
                    { id: 1, author: "John Doe", text: "This needs urgent fixing.", timestamp: "04/02/2025, 10:15 AM", replies: [] },
                    {
                        id: 2, author: "Jane Smith", text: "Looking into it now.", timestamp: "04/02/2025, 10:20 AM", replies: [
                            { id: 3, author: "John Doe", text: "Thanks for the quick response.", timestamp: "04/02/2025, 10:25 AM" }
                        ]
                    }
                ]
            },
            {
                id: "BUG-002",
                title: "API request timeout",
                category: "Backend",
                assignedTo: "Jane Smith",
                status: "In Progress",
                priority: "Medium",
                severity: "Major",
                epic: "Data Retrieval",
                testCase: "TC-067",
                caseStatus: "Failed",
                dueDate: "04/10/2025",
                automated: "Yes",
                automationLink: "https://github.com/company/repo/tests/api-tests.js",
                creationLog: "04/02/2025 by QA Team",
                comments: [
                    { id: 1, author: "Jane Smith", text: "Investigating the API endpoint now.", timestamp: "04/03/2025, 09:15 AM", replies: [] }
                ]
            }
        ],
        "03/2025": [
            {
                id: "BUG-003",
                title: "Mobile layout issue",
                category: "UI",
                assignedTo: "Alice Brown",
                status: "Resolved",
                priority: "Low",
                severity: "Minor",
                epic: "Mobile Experience",
                testCase: "TC-032",
                caseStatus: "Passed",
                dueDate: "03/20/2025",
                automated: "No",
                automationLink: "",
                creationLog: "03/15/2025 by UX Team",
                comments: [
                    { id: 1, author: "Alice Brown", text: "Fixed the CSS issues with mobile layout.", timestamp: "03/16/2025, 11:30 AM", replies: [] },
                    { id: 2, author: "QA Team", text: "Verified the fix. Works well now.", timestamp: "03/17/2025, 09:45 AM", replies: [] }
                ]
            }
        ]
    });

    // Initialize group colors from localStorage or set defaults if not available
    useEffect(() => {
        const savedColors = localStorage.getItem('bugTrackerGroupColors');
        if (savedColors) {
            setGroupColors(JSON.parse(savedColors));
        } else {
            const defaultColors = {
                "04/2025": "#3498db",
                "03/2025": "#2ecc71",
            };
            setGroupColors(defaultColors);
            localStorage.setItem('bugTrackerGroupColors', JSON.stringify(defaultColors));
        }
    }, []);

    // Status, Priority, and Severity options
    const statusOptions = ["Open", "In Progress", "Resolved", "Closed", "Under Review", "Needs Info"];
    const priorityOptions = ["High", "Medium", "Low"];
    const severityOptions = ["Critical", "Major", "Minor", "Cosmetic"];

    const toggleGroup = (date) => {
        setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const openBugDetails = (bug) => {
        setSelectedBug(bug);
    };

    const closeBugDetails = () => {
        setSelectedBug(null);
    };

    const handleTitleEdit = (bugId, groupDate, e) => {
        const updatedBugsData = { ...bugsData };
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].title = e.target.value;
            setBugsData(updatedBugsData);
        }
    };

    const handleTitleEditStart = (bugId) => {
        setEditingTitle(bugId);
    };

    const handleTitleEditEnd = () => {
        setEditingTitle(null);
    };

    const changeGroupColor = (date) => {
        // Generate a random color
        const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        const updatedColors = { ...groupColors, [date]: randomColor };
        setGroupColors(updatedColors);

        // Save to localStorage for persistence
        localStorage.setItem('bugTrackerGroupColors', JSON.stringify(updatedColors));
    };

    const handleBugSelection = (bugId, groupDate) => {
        const selectionKey = `${groupDate}-${bugId}`;

        if (selectedBugs.includes(selectionKey)) {
            setSelectedBugs(selectedBugs.filter(id => id !== selectionKey));
        } else {
            setSelectedBugs([...selectedBugs, selectionKey]);
        }
    };

    const handleSelectAllInGroup = (groupDate, isChecked) => {
        const updatedSelection = [...selectedBugs];

        if (isChecked) {
            // Add all bugs from this group that aren't already selected
            bugsData[groupDate].forEach(bug => {
                const selectionKey = `${groupDate}-${bug.id}`;
                if (!updatedSelection.includes(selectionKey)) {
                    updatedSelection.push(selectionKey);
                }
            });
        } else {
            // Remove all bugs from this group
            return selectedBugs.filter(selectionKey => !selectionKey.startsWith(groupDate));
        }

        setSelectedBugs(updatedSelection);
    };

    const isAllInGroupSelected = (groupDate) => {
        // Check if all bugs in group are selected
        return bugsData[groupDate].every(bug =>
            selectedBugs.includes(`${groupDate}-${bug.id}`)
        );
    };

    const clearAllSelections = () => {
        setSelectedBugs([]);
    };

    const handleStatusChange = (bugId, groupDate, newStatus) => {
        const updatedBugsData = { ...bugsData };
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].status = newStatus;
            setBugsData(updatedBugsData);
        }
    };

    const handlePriorityChange = (bugId, groupDate, newPriority) => {
        const updatedBugsData = { ...bugsData };
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].priority = newPriority;
            setBugsData(updatedBugsData);
        }
    };

    const handleSeverityChange = (bugId, groupDate, newSeverity) => {
        const updatedBugsData = { ...bugsData };
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].severity = newSeverity;
            setBugsData(updatedBugsData);
        }
    };

    const handleAssigneeChange = (bugId, groupDate, newAssignee) => {
        const updatedBugsData = { ...bugsData };
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].assignedTo = newAssignee;
            setBugsData(updatedBugsData);
        }
    };

    // Helper function to determine status color
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'bg-blue-500';
            case 'in progress': return 'bg-yellow-500';
            case 'resolved': return 'bg-green-500';
            case 'closed': return 'bg-gray-500';
            case 'under review': return 'bg-purple-500';
            case 'needs info': return 'bg-orange-500';
            default: return 'bg-blue-500';
        }
    };

    // Helper function to determine priority color
    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-red-600';
            case 'medium': return 'bg-orange-500';
            case 'low': return 'bg-green-600';
            default: return 'bg-gray-500';
        }
    };

    // Helper function to determine severity color
    const getSeverityColor = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'bg-purple-700';
            case 'major': return 'bg-red-500';
            case 'minor': return 'bg-yellow-600';
            case 'cosmetic': return 'bg-blue-400';
            default: return 'bg-gray-500';
        }
    };

    // Update bug details from modal
    const updateBugDetails = (updatedBug) => {
        const updatedBugsData = { ...bugsData };

        // Find which group this bug belongs to
        for (const [date, bugs] of Object.entries(updatedBugsData)) {
            const bugIndex = bugs.findIndex(b => b.id === updatedBug.id);
            if (bugIndex !== -1) {
                updatedBugsData[date][bugIndex] = updatedBug;
                setBugsData(updatedBugsData);
                setSelectedBug(updatedBug);
                break;
            }
        }
    };

    // Handle bulk status changes for selected bugs
    const handleBulkStatusChange = (newStatus) => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].status = newStatus;
            }
        });

        setBugsData(updatedBugsData);
    };

    // Handle bulk status changes for selected bugs
    const handleBulkPriorityChange = (newPriority) => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].priority = newPriority;
            }
        });

        setBugsData(updatedBugsData);
    };

    // Handle bulk status changes for selected bugs
    const handleBulkSeverityChange = (newSeverity) => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].severity = newSeverity;
            }
        });

        setBugsData(updatedBugsData);
    };

    // Handle bulk assignee changes
    const handleBulkAssigneeChange = (newAssignee) => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].assignedTo = newAssignee;
            }
        });

        setBugsData(updatedBugsData);
    };

    // Handle moving bugs to a different group
    const handleMoveToGroup = (targetGroup) => {
        const updatedBugsData = { ...bugsData };

        // If the target group doesn't exist, create it
        if (!updatedBugsData[targetGroup]) {
            updatedBugsData[targetGroup] = [];
        }

        // Process each selected bug
        selectedBugs.forEach(selectionKey => {
            const [sourceGroup, bugId] = selectionKey.split('-');

            // Skip if trying to move to the same group
            if (sourceGroup === targetGroup) return;

            // Find the bug in the source group
            const bugIndex = updatedBugsData[sourceGroup].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                // Add to target group
                const bugToMove = { ...updatedBugsData[sourceGroup][bugIndex] };
                updatedBugsData[targetGroup].push(bugToMove);

                // Remove from source group
                updatedBugsData[sourceGroup].splice(bugIndex, 1);
            }
        });

        // Clean up empty groups (optional)
        Object.keys(updatedBugsData).forEach(group => {
            if (updatedBugsData[group].length === 0) {
                delete updatedBugsData[group];
            }
        });

        setBugsData(updatedBugsData);
        setSelectedBugs([]); // Clear selections after move
    };

    // Handle delete selected bugs
    const handleDeleteSelected = () => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate].splice(bugIndex, 1);
            }
        });

        // Clean up empty groups
        Object.keys(updatedBugsData).forEach(group => {
            if (updatedBugsData[group].length === 0) {
                delete updatedBugsData[group];
            }
        });

        setBugsData(updatedBugsData);
        setSelectedBugs([]); // Clear selections after delete
    };

    // Export selected bugs
    const handleExport = (format) => {
        const selectedBugsData = [];

        // Collect all selected bugs
        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            const bug = bugsData[groupDate].find(b => b.id === bugId);
            if (bug) {
                selectedBugsData.push({ ...bug, group: groupDate });
            }
        });

        // Mock export functionality (in a real app, this would generate and download the file)
        console.log(`Exporting ${selectedBugsData.length} bugs to ${format} format`);
        console.log(selectedBugsData);

        // Would call an API endpoint here in a real implementation
        alert(`${selectedBugsData.length} bugs prepared for export to ${format} format. Check console for details.`);
    };
    

    return (
        <div className="p-4 min-h-screen">
            {/* Secondary Header */}
            <div className="flex justify-between items-center bg-white p-3 shadow-md mb-9 sticky top-0 z-10">
                <h1 className="text-xl font-bold">Bug Tracker</h1>
                <div className="flex space-x-2">
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors">
                        <Filter size={16} className="mr-2" /> Filter
                    </button>
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors">
                        <Users size={16} className="mr-2" /> Person Filter
                    </button>
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors">
                        <Settings size={16} className="mr-2" /> Settings
                    </button>
                </div>
            </div>

            {/* Bug Groups */}
            <div className="space-y-9 pb-10">
                {Object.entries(bugsData).map(([date, bugs]) => (
                    <div
                        key={date}
                        className="bg-white shadow rounded overflow-hidden"
                        style={{
                            borderLeft: `6px solid ${groupColors[date] || '#cccccc'}`
                        }}
                    >
                        <div
                            className="flex items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors"
                            style={{ backgroundColor: `${groupColors[date] || '#cccccc'}20` }}
                        >
                            {expandedGroups[date] ?
                                <ChevronDown
                                    size={20}
                                    className="cursor-pointer mr-2"
                                    onClick={() => toggleGroup(date)}
                                /> :
                                <ChevronRight
                                    size={20}
                                    className="cursor-pointer mr-2"
                                    onClick={() => toggleGroup(date)}
                                />
                            }
                            <div
                                className="w-4 h-4 mr-2 cursor-pointer border border-gray-400"
                                style={{ backgroundColor: groupColors[date] || '#cccccc' }}
                                onClick={() => changeGroupColor(date)}
                            ></div>
                            <h3
                                className="text-lg font-bold"
                                style={{ color: groupColors[date] || '#cccccc' }}
                                onClick={() => toggleGroup(date)}
                            >
                                Issues {date}
                            </h3>
                        </div>

                        {expandedGroups[date] && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-white text-sm">
                                            <th className="border border-gray-400 p-1 whitespace-nowrap w-8">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4"
                                                    checked={isAllInGroupSelected(date)}
                                                    onChange={(e) => handleSelectAllInGroup(date, e.target.checked)}
                                                />
                                            </th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Bug/Defect Title</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Issue ID</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Issue Category</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Assign To</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Status</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Priority</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap min-w-[120px]">Severity</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Epic</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Test Case</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Case Status</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Due Date</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Automated</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Link to Automated Scripts</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Creation Log</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bugs.map(bug => (
                                            <tr key={bug.id} className="hover:bg-gray-100 text-xs">
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4"
                                                        checked={selectedBugs.includes(`${date}-${bug.id}`)}
                                                        onChange={() => handleBugSelection(bug.id, date)}
                                                    />
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {editingTitle === bug.id ? (
                                                            <input
                                                                type="text"
                                                                className="border border-gray-300 p-1 mr-2 flex-grow"
                                                                value={bug.title}
                                                                onChange={(e) => handleTitleEdit(bug.id, date, e)}
                                                                onBlur={handleTitleEditEnd}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleTitleEditEnd()}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                className="mr-2 cursor-pointer"
                                                                onDoubleClick={() => handleTitleEditStart(bug.id)}
                                                            >
                                                                {bug.title}
                                                            </span>
                                                        )}
                                                        <MessageSquare
                                                            size={16}
                                                            className="text-gray-500 cursor-pointer hover:text-blue-500"
                                                            onClick={() => openBugDetails(bug)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.id}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.category}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <select
                                                        className="p-1 w-full"
                                                        value={bug.assignedTo}
                                                        onChange={(e) => handleAssigneeChange(bug.id, date, e.target.value)}
                                                    >
                                                        {teamMembers.map(member => (
                                                            <option key={member} value={member}>{member}</option>
                                                        ))}
                                                        <option value="unassigned">Unassigned</option>
                                                    </select>
                                                </td>
                                                <td className={`border border-gray-300 p-0 whitespace-nowrap ${getStatusColor(bug.status)}`}>
                                                    <select
                                                        className={`p-1 text-white w-full ${getStatusColor(bug.status)}`}
                                                        value={bug.status}
                                                        onChange={(e) => handleStatusChange(bug.id, date, e.target.value)}
                                                    >
                                                        {statusOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                        <option value="custom">+ Add New Status</option>
                                                    </select>
                                                </td>
                                                <td className={`border border-gray-300 p-0 whitespace-nowrap ${getPriorityColor(bug.priority)}`}>
                                                    <select
                                                        className={`p-1 text-white w-full ${getPriorityColor(bug.priority)}`}
                                                        value={bug.priority}
                                                        onChange={(e) => handlePriorityChange(bug.id, date, e.target.value)}
                                                    >
                                                        {priorityOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className={`border border-gray-300 p-0 whitespace-nowrap ${getSeverityColor(bug.severity)}`}>
                                                    <select
                                                        className={`p-1 text-white w-full ${getSeverityColor(bug.severity)}`}
                                                        value={bug.severity}
                                                        onChange={(e) => handleSeverityChange(bug.id, date, e.target.value)}
                                                    >
                                                        {severityOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.epic}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.testCase}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.caseStatus}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.dueDate}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.automated}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    {bug.automationLink ? (
                                                        <a href={bug.automationLink} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                                            View Script
                                                        </a>
                                                    ) : "N/A"}
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.creationLog}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Bug Details Modal */}
            {selectedBug && (
                <BugDetailsModal
                    bug={selectedBug}
                    onClose={closeBugDetails}
                    onUpdate={updateBugDetails}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getSeverityColor={getSeverityColor}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers}
                />
            )}

            {/* Selection Actions Modal */}
            {selectedBugs.length > 0 && (
                <SelectionActionsModal
                    selectedCount={selectedBugs.length}
                    onClose={clearAllSelections}
                    onStatusChange={handleBulkStatusChange}
                    onPriorityChange={handleBulkPriorityChange}
                    onSeverityChange={handleBulkSeverityChange}
                    onAssigneeChange={handleBulkAssigneeChange}
                    onMoveToGroup={handleMoveToGroup}
                    onDelete={handleDeleteSelected}
                    onExport={handleExport}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    groups={Object.keys(bugsData)}
                    teamMembers={teamMembers}
                />
            )};
        </div>
    );
};

export default BugTracker;