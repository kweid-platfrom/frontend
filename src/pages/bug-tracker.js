"use client"
import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Filter, Users, Settings, MessageSquare, X } from "lucide-react";
import BugDetailsModal from "../components/BugDetailsModal"

const BugTracker = () => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedBug, setSelectedBug] = useState(null);
    const [groupColors, setGroupColors] = useState({
        "04/2025": "#3498db", // Default blue
        "03/2025": "#2ecc71", // Default green
    });
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    
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
                    { id: 2, author: "Jane Smith", text: "Looking into it now.", timestamp: "04/02/2025, 10:20 AM", replies: [
                        { id: 3, author: "John Doe", text: "Thanks for the quick response.", timestamp: "04/02/2025, 10:25 AM" }
                    ] }
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
        const updatedBugsData = {...bugsData};
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
        const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);
        setGroupColors(prev => ({ ...prev, [date]: randomColor }));
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
        const updatedBugsData = {...bugsData};
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].status = newStatus;
            setBugsData(updatedBugsData);
        }
    };

    const handlePriorityChange = (bugId, groupDate, newPriority) => {
        const updatedBugsData = {...bugsData};
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].priority = newPriority;
            setBugsData(updatedBugsData);
        }
    };

    const handleSeverityChange = (bugId, groupDate, newSeverity) => {
        const updatedBugsData = {...bugsData};
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex !== -1) {
            updatedBugsData[groupDate][bugIndex].severity = newSeverity;
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
        const updatedBugsData = {...bugsData};
        
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

    return (
        <div className="p-4 min-h-screen">
            {/* Secondary Header */}
            <div className="flex justify-between items-center bg-white p-3 shadow-md mb-4 sticky top-0 z-10">
                <h1 className="text-xl font-bold">Bug Tracker</h1>
                <div className="flex space-x-2">
                    <button className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                        <Plus size={16} className="mr-2" /> New Bug
                    </button>
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
            <div className="space-y-12 pb-10">
                {Object.entries(bugsData).map(([date, bugs]) => (
                    <div 
                        key={date} 
                        className="bg-white shadow rounded overflow-hidden"
                        style={{ 
                            borderLeft: `6px solid ${groupColors[date] || ''}`
                        }}
                    >
                        <div 
                            className="flex items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors" 
                            style={{ backgroundColor: `${groupColors[date]}20` }}
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
                                style={{ backgroundColor: groupColors[date] }}
                                onClick={() => changeGroupColor(date)}
                            ></div>
                            <h3 
                                className="text-lg font-bold"
                                style={{ color: groupColors[date] }}
                                onClick={() => toggleGroup(date)}
                            >
                                Bugs/Defects {date}
                            </h3>
                        </div>
                        
                        {expandedGroups[date] && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-white text-sm">
                                            <th className="border border-gray-400 p-2 whitespace-nowrap w-8">
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
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Status</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Priority</th>
                                            <th className="border border-gray-400 p-2 whitespace-nowrap">Severity</th>
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
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">{bug.assignedTo}</td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <select 
                                                        className={`p-1 text-white ${getStatusColor(bug.status)}`}
                                                        value={bug.status}
                                                        onChange={(e) => handleStatusChange(bug.id, date, e.target.value)}
                                                    >
                                                        {statusOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                        <option value="custom">+ Add New Status</option>
                                                    </select>
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <select 
                                                        className={`p-1 text-white ${getPriorityColor(bug.priority)}`}
                                                        value={bug.priority}
                                                        onChange={(e) => handlePriorityChange(bug.id, date, e.target.value)}
                                                    >
                                                        {priorityOptions.map(option => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="border border-gray-300 p-2 whitespace-nowrap">
                                                    <select 
                                                        className={`p-1 text-white ${getSeverityColor(bug.severity)}`}
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

            {/* Bug Details Modal (extracted to component) */}
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
                />
            )}

            {/* Selection Actions Modal */}
            {selectedBugs.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t border-gray-300 flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="font-bold mr-4">{selectedBugs.length} items selected</span>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Set Status</button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Set Priority</button>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Assign To</button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                    </div>
                    <button 
                        className="text-gray-600 hover:text-gray-800"
                        onClick={clearAllSelections}
                    >
                        <X size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default BugTracker;