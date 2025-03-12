"use client"
import React, { useState, useEffect, useMemo } from "react";
import { Filter, Users, Settings, Plus, UserPlus } from "lucide-react";
import BugDetailsModal from "../components/BugDetailsModal";
import SelectionActionsModal from "../components/SelectionActionsModal";
import SecondaryHeader from "../components/layout/secondaryHeader";
import BugGroup from "../components/bug-report/bugGroup";
import {
    getColorScheme,
    saveColorScheme,
    getStatusColor,
    getPriorityColor,
    getSeverityColor,
    updateGroupColor
} from "../utils/colorConfig";

const BugTracker = () => {
    // Initialize all groups to be expanded by default
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedBug, setSelectedBug] = useState(null);
    const [colorScheme, setColorScheme] = useState(getColorScheme());
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showBugDetailsModal, setShowBugDetailsModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState([
        "John Doe",
        "Jane Smith",
        "Alice Brown",
        "Bob Johnson",
        "Carla Rodriguez"
    ]);
    const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
    const [newTeamMember, setNewTeamMember] = useState("");
    const [dateFilter, setDateFilter] = useState(null);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    // Initialize bug data from localStorage or use default data
    const [bugsData, setBugsData] = useState(() => {
        const savedBugs = localStorage.getItem('bugsData');
        if (savedBugs) {
            try {
                return JSON.parse(savedBugs);
            } catch (e) {
                console.error("Failed to load saved bugs data", e);
            }
        }
        
        // Default bug data if no saved data exists
        return {
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
        };
    });

    // Save bugs data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('bugsData', JSON.stringify(bugsData));
    }, [bugsData]);

    // Keep selectedBug in sync with bugsData
    useEffect(() => {
        if (selectedBug) {
            // Find the current version of the bug in bugsData
            let updatedBug = null;
            for (const [, bugs] of Object.entries(bugsData)) {
                const foundBug = bugs.find(b => b.id === selectedBug.id);
                if (foundBug) {
                    updatedBug = foundBug;
                    break;
                }
            }
            
            // If bug still exists, update the selected bug
            if (updatedBug) {
                setSelectedBug(updatedBug);
            } else {
                // If bug was deleted, close the modal
                setShowBugDetailsModal(false);
                setSelectedBug(null);
            }
        }
    }, [bugsData, selectedBug]);

    // Set all groups to be expanded by default
    useEffect(() => {
        const initialExpandedState = {};
        Object.keys(bugsData).forEach(date => {
            initialExpandedState[date] = true;  // Set all to true for expanded by default
        });
        setExpandedGroups(initialExpandedState);
    }, [bugsData]);

    // Update selection modal visibility based on selections
    useEffect(() => {
        if (selectedBugs.length > 0) {
            setShowSelectionModal(true);
        } else {
            setShowSelectionModal(false);
        }
    }, [selectedBugs]);

    // Status, Priority, and Severity options
    const statusOptions = ["Open", "In Progress", "Resolved", "Closed", "Under Review", "Needs Info"];
    const priorityOptions = ["High", "Medium", "Low"];
    const severityOptions = ["Critical", "Major", "Minor", "Cosmetic"];

    // Header actions with implemented functionality
    const headerActions = [
        { icon: Filter, label: "Filter", onClick: () => setFilterMenuOpen(true) },
        { icon: Users, label: "Person Filter", onClick: () => handlePersonFilter() },
        { icon: Settings, label: "Settings", onClick: () => console.log("Settings clicked") },
        { icon: UserPlus, label: "Add Team Member", onClick: () => setShowTeamMemberModal(true) }
    ];

    // Get the current date in MM/YYYY format for new bugs
    const getCurrentDateGroup = () => {
        const today = new Date();
        return `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    };

    // Generate a unique bug ID
    const generateBugId = () => {
        // Find the highest existing ID number
        let maxNum = 0;
        Object.values(bugsData).forEach(bugs => {
            bugs.forEach(bug => {
                const idNum = parseInt(bug.id.replace("BUG-", ""), 10);
                if (!isNaN(idNum) && idNum > maxNum) {
                    maxNum = idNum;
                }
            });
        });
        return `BUG-${String(maxNum + 1).padStart(3, '0')}`;
    };

    // Memoize derived data for performance and actually use it
    const groupsWithSelection = useMemo(() => {
        return Object.keys(bugsData).map(date => ({
            date,
            isAllSelected: isAllInGroupSelected(date),
            bugsCount: bugsData[date]?.length || 0,
            selectedCount: selectedBugs.filter(key => key.startsWith(`${date}-`)).length
        }));
    }, [bugsData, isAllInGroupSelected, selectedBugs]);

    // Group toggling
    const toggleGroup = (date) => {
        setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }));
    };

    // Bug details modal
    const openBugDetails = (bug) => {
        setSelectedBug(bug);
        setShowBugDetailsModal(true);
    };

    const closeBugDetails = () => {
        setSelectedBug(null);
        setShowBugDetailsModal(false);
    };

    // Title editing
    const handleTitleEdit = (bugId, groupDate, e) => {
        const updatedBugsData = { ...bugsData };
        const groupBugs = updatedBugsData[groupDate];
        if (groupBugs) {
            const bugIndex = groupBugs.findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].title = e.target.value;
                setBugsData(updatedBugsData);
            }
        }
    };

    const handleTitleEditStart = (bugId) => {
        setEditingTitle(bugId);
    };

    const handleTitleEditEnd = () => {
        setEditingTitle(null);
    };

    // Group color management
    const changeGroupColor = (date) => {
        // Generate a random color
        const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
        const updatedColorScheme = updateGroupColor(date, randomColor, colorScheme);
        setColorScheme(updatedColorScheme);
        saveColorScheme(updatedColorScheme);
    };

    // Bug selection handling
    const handleBugSelection = (bugId, groupDate) => {
        const selectionKey = `${groupDate}-${bugId}`;

        setSelectedBugs(prev => {
            if (prev.includes(selectionKey)) {
                return prev.filter(id => id !== selectionKey);
            } else {
                return [...prev, selectionKey];
            }
        });
    };

    const handleSelectAllInGroup = (groupDate, isChecked) => {
        setSelectedBugs(prev => {
            // Create a new selection array without bugs from this group
            const filteredSelection = prev.filter(key => !key.startsWith(`${groupDate}-`));
            
            if (isChecked && bugsData[groupDate]) {
                // Add all bugs from this group
                const groupSelections = bugsData[groupDate].map(bug => `${groupDate}-${bug.id}`);
                return [...filteredSelection, ...groupSelections];
            } else {
                // Just return the filtered selection without this group's bugs
                return filteredSelection;
            }
        });
    };

    const isAllInGroupSelected = useCallback((groupDate) => {
        if (!bugsData[groupDate] || bugsData[groupDate].length === 0) return false;
        return bugsData[groupDate].every(bug => 
            selectedBugs.includes(`${groupDate}-${bug.id}`)
        );
    }, [bugsData, selectedBugs]);

    const clearAllSelections = () => {
        setSelectedBugs([]);
    };

    // Bug field updates
    const handleStatusChange = (bugId, groupDate, newStatus) => {
        const updatedBugsData = { ...bugsData };
        if (updatedBugsData[groupDate]) {
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].status = newStatus;
                setBugsData(updatedBugsData);
            }
        }
    };

    const handlePriorityChange = (bugId, groupDate, newPriority) => {
        const updatedBugsData = { ...bugsData };
        if (updatedBugsData[groupDate]) {
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].priority = newPriority;
                setBugsData(updatedBugsData);
            }
        }
    };

    const handleSeverityChange = (bugId, groupDate, newSeverity) => {
        const updatedBugsData = { ...bugsData };
        if (updatedBugsData[groupDate]) {
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].severity = newSeverity;
                setBugsData(updatedBugsData);
            }
        }
    };

    const handleAssigneeChange = (bugId, groupDate, newAssignee) => {
        const updatedBugsData = { ...bugsData };
        if (updatedBugsData[groupDate]) {
            const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
                updatedBugsData[groupDate][bugIndex].assignedTo = newAssignee;
                setBugsData(updatedBugsData);
            }
        }
    };

    // Color helper functions
    const getStatusColorForBug = (status) => getStatusColor(status, colorScheme);
    const getPriorityColorForBug = (priority) => getPriorityColor(priority, colorScheme);
    const getSeverityColorForBug = (severity) => getSeverityColor(severity, colorScheme);

    // Update bug details from modal
    const handleUpdateBug = (updatedBug) => {
        const updatedBugsData = { ...bugsData };

        // Find which group this bug belongs to
        for (const [date, bugs] of Object.entries(updatedBugsData)) {
            const bugIndex = bugs.findIndex(b => b.id === updatedBug.id);
            if (bugIndex !== -1) {
                updatedBugsData[date][bugIndex] = updatedBug;
                setBugsData(updatedBugsData);
                break;
            }
        }
    };

    // Add a new bug
    const addNewBug = () => {
        const groupDate = getCurrentDateGroup();
        const newBugId = generateBugId();
        const today = new Date();
        
        const newBug = {
            id: newBugId,
            title: "New Bug",
            category: "UI",
            assignedTo: "",
            status: "Open",
            priority: "Medium",
            severity: "Minor",
            epic: "",
            testCase: "",
            caseStatus: "",
            dueDate: "",
            automated: "No",
            automationLink: "",
            creationLog: `${today.toLocaleDateString()} by User`,
            comments: []
        };

        const updatedBugsData = { ...bugsData };

        // If the group doesn't exist, create it
        if (!updatedBugsData[groupDate]) {
            updatedBugsData[groupDate] = [];
        }

        // Add the new bug to the group
        updatedBugsData[groupDate].push(newBug);
        setBugsData(updatedBugsData);
        
        // Open the bug details modal for the new bug
        setSelectedBug(newBug);
        setShowBugDetailsModal(true);
    };

    // Handle bulk operations for selected bugs
    const handleUpdateMultipleBugs = (updates) => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            if (updatedBugsData[groupDate]) {
                const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
                
                if (bugIndex !== -1) {
                    // Apply all provided updates
                    Object.keys(updates).forEach(field => {
                        if (updates[field] !== undefined && updates[field] !== null) {
                            updatedBugsData[groupDate][bugIndex][field] = updates[field];
                        }
                    });
                }
            }
        });

        setBugsData(updatedBugsData);
        setShowSelectionModal(false);
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

            // Make sure the source group exists
            if (updatedBugsData[sourceGroup]) {
                // Find the bug in the source group
                const bugIndex = updatedBugsData[sourceGroup].findIndex(bug => bug.id === bugId);
                if (bugIndex !== -1) {
                    // Add to target group
                    const bugToMove = { ...updatedBugsData[sourceGroup][bugIndex] };
                    updatedBugsData[targetGroup].push(bugToMove);

                    // Remove from source group
                    updatedBugsData[sourceGroup] = updatedBugsData[sourceGroup].filter(bug => bug.id !== bugId);

                    // If source group is now empty, remove it
                    if (updatedBugsData[sourceGroup].length === 0) {
                        delete updatedBugsData[sourceGroup];
                    }
                }
            }
        });

        // Clear selections and update state
        setSelectedBugs([]);
        setBugsData(updatedBugsData);
    };

    // Handle deleting selected bugs
    const handleDeleteSelectedBugs = () => {
        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const [groupDate, bugId] = selectionKey.split('-');
            if (updatedBugsData[groupDate]) {
                updatedBugsData[groupDate] = updatedBugsData[groupDate].filter(bug => bug.id !== bugId);

                // Remove empty groups
                if (updatedBugsData[groupDate].length === 0) {
                    delete updatedBugsData[groupDate];
                }
            }
        });

        setBugsData(updatedBugsData);
        setSelectedBugs([]);
        setShowSelectionModal(false);
    };

    // Add a comment to a bug
    const addComment = (bugId, groupDate, commentText, author) => {
        if (!commentText || !author) return;
        
        const updatedBugsData = { ...bugsData };
        if (!updatedBugsData[groupDate]) return;
        
        const bugIndex = updatedBugsData[groupDate].findIndex(bug => bug.id === bugId);
        if (bugIndex === -1) return;

        const newComment = {
            id: Date.now(), // Use timestamp as a simple unique ID
            author: author,
            text: commentText,
            timestamp: new Date().toLocaleString(),
            replies: []
        };

        if (!updatedBugsData[groupDate][bugIndex].comments) {
            updatedBugsData[groupDate][bugIndex].comments = [];
        }

        updatedBugsData[groupDate][bugIndex].comments.push(newComment);
        setBugsData(updatedBugsData);
    };

    // Implement team members management functionality
    const handleAddTeamMember = () => {
        if (newTeamMember.trim() !== '' && !teamMembers.includes(newTeamMember.trim())) {
            setTeamMembers([...teamMembers, newTeamMember.trim()]);
            setNewTeamMember('');
            setShowTeamMemberModal(false);
        }
    };

    const handleRemoveTeamMember = (memberToRemove) => {
        setTeamMembers(teamMembers.filter(member => member !== memberToRemove));
    };

    // Implement date filtering
    const applyDateFilter = (date) => {
        setDateFilter(date);
        setFilterMenuOpen(false);
    };

    const clearDateFilter = () => {
        setDateFilter(null);
        setFilterMenuOpen(false);
    };

    // Implement person filter 
    const handlePersonFilter = () => {
        const assigneeCount = {};
        
        // Count bugs per assignee
        Object.values(bugsData).flat().forEach(bug => {
            if (bug.assignedTo) {
                assigneeCount[bug.assignedTo] = (assigneeCount[bug.assignedTo] || 0) + 1;
            }
        });
        
        // Log assignee distribution
        console.log("Bugs by assignee:", assigneeCount);
        
        // For demo purposes, just show an alert with assignee stats
        alert("Assignee distribution logged to console.");
    };

    // Filter bugs based on date filter
    const filteredBugsData = useMemo(() => {
        if (!dateFilter) return bugsData;
        
        const filtered = {};
        if (bugsData[dateFilter]) {
            filtered[dateFilter] = bugsData[dateFilter];
        }
        return filtered;
    }, [bugsData, dateFilter]);

    // Group statistics for the dashboard
    const groupStats = useMemo(() => {
        return groupsWithSelection.map(group => {
            // Find all bugs for this group
            const bugs = bugsData[group.date] || [];
            
            // Count bugs by status
            const statusCount = {};
            bugs.forEach(bug => {
                statusCount[bug.status] = (statusCount[bug.status] || 0) + 1;
            });
            
            // Calculate priority distribution
            const priorityCount = {};
            bugs.forEach(bug => {
                priorityCount[bug.priority] = (priorityCount[bug.priority] || 0) + 1;
            });
            
            return {
                ...group,
                statusCount,
                priorityCount,
                totalBugs: bugs.length
            };
        });
    }, [groupsWithSelection, bugsData]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <SecondaryHeader
                title="Bug Tracker"
                actions={headerActions}
            />

            <main className="flex-1 p-4">
                {/* Add New Bug button */}
                <div className="mb-4 flex justify-between items-center">
                    <button 
                        onClick={addNewBug}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                    >
                        <Plus size={16} className="mr-2" />
                        Add New Bug
                    </button>
                    
                    {dateFilter && (
                        <div className="flex items-center bg-blue-100 px-3 py-1 rounded">
                            <span className="mr-2">Filtered: {dateFilter}</span>
                            <button 
                                onClick={clearDateFilter}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* Dashboard with group statistics */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {groupStats.slice(0, 3).map((stat) => (
                        <div 
                            key={stat.date} 
                            className="bg-white p-4 rounded-lg shadow"
                            onClick={() => applyDateFilter(stat.date)}
                        >
                            <h3 className="font-bold mb-2">{stat.date}</h3>
                            <p>Total bugs: {stat.totalBugs}</p>
                            <p>Selected: {stat.selectedCount}</p>
                            <div className="mt-2">
                                <h4 className="text-sm font-medium">Status:</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(stat.statusCount).map(([status, count]) => (
                                        <span 
                                            key={status}
                                            className="px-2 py-1 text-xs rounded"
                                            style={{ backgroundColor: getStatusColorForBug(status) }}
                                        >
                                            {status}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected bugs count and actions */}
                {selectedBugs.length > 0 && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                        <span className="font-medium">{selectedBugs.length} bug(s) selected</span>
                        <button
                            onClick={clearAllSelections}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {/* Bug groups */}
                {Object.entries(filteredBugsData).length > 0 ? (
                    Object.entries(filteredBugsData)
                        .sort((a, b) => {
                            // Sort by date (newest first)
                            const dateA = new Date(a[0].split('/').reverse().join('/'));
                            const dateB = new Date(b[0].split('/').reverse().join('/'));
                            return dateB - dateA;
                        })
                        .map(([date, bugs]) => (
                            <BugGroup
                                key={date}
                                date={date}
                                bugs={bugs}
                                expanded={expandedGroups[date] || false}
                                toggleGroup={() => toggleGroup(date)}
                                openBugDetails={openBugDetails}
                                editingTitle={editingTitle}
                                handleTitleEdit={(bugId, e) => handleTitleEdit(bugId, date, e)}
                                handleTitleEditStart={handleTitleEditStart}
                                handleTitleEditEnd={handleTitleEditEnd}
                                getStatusColor={getStatusColorForBug}
                                getPriorityColor={getPriorityColorForBug}
                                getSeverityColor={getSeverityColorForBug}
                                handleStatusChange={(bugId, newStatus) => handleStatusChange(bugId, date, newStatus)}
                                handlePriorityChange={(bugId, newPriority) => handlePriorityChange(bugId, date, newPriority)}
                                handleSeverityChange={(bugId, newSeverity) => handleSeverityChange(bugId, date, newSeverity)}
                                handleAssigneeChange={(bugId, newAssignee) => handleAssigneeChange(bugId, date, newAssignee)}
                                statusOptions={statusOptions}
                                priorityOptions={priorityOptions}
                                severityOptions={severityOptions}
                                teamMembers={teamMembers}
                                selectedBugs={selectedBugs}
                                handleBugSelection={(bugId) => handleBugSelection(bugId, date)}
                                isAllSelected={isAllInGroupSelected(date)}
                                handleSelectAll={(isChecked) => handleSelectAllInGroup(date, isChecked)}
                                changeGroupColor={() => changeGroupColor(date)}
                                groupColor={colorScheme.groups?.[date] || '#f3f4f6'}
                            />
                        ))
                ) : (
                    <div className="p-8 text-center bg-white rounded-lg shadow">
                        <p className="text-gray-500">
                            {dateFilter ? `No bugs found for ${dateFilter}. Try clearing the filter.` : 'No bugs found. Add a new bug to get started.'}
                        </p>
                    </div>
                )}
            </main>

            {/* Bug details modal */}
            {showBugDetailsModal && selectedBug && (
                <BugDetailsModal
                    bug={selectedBug}
                    onClose={closeBugDetails}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers}
                    updateBug={handleUpdateBug}
                    getStatusColor={getStatusColorForBug}
                    getPriorityColor={getPriorityColorForBug}
                    getSeverityColor={getSeverityColorForBug}
                    addComment={(commentText) => {
                        // Find which group this bug belongs to
                        for (const [date, bugs] of Object.entries(bugsData)) {
                            if (bugs.some(b => b.id === selectedBug.id)) {
                                addComment(selectedBug.id, date, commentText, "Current User");
                                break;
                            }
                        }
                    }}
                />
            )}

            {/* Selection actions modal */}
            {showSelectionModal && selectedBugs.length > 0 && (
                <SelectionActionsModal
                    selectedBugs={selectedBugs}
                    onClose={() => setShowSelectionModal(false)}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers}
                    updateMultipleBugs={handleUpdateMultipleBugs}
                    handleMoveToGroup={handleMoveToGroup}
                    handleDeleteSelectedBugs={handleDeleteSelectedBugs}
                    existingGroups={Object.keys(bugsData)}
                />
            )}

            {/* Date filter menu */}
            {filterMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-80">
                        <h3 className="font-bold mb-3">Filter by Date</h3>
                        <div className="max-h-60 overflow-y-auto mb-3">
                            {Object.keys(bugsData)
                                .sort((a, b) => {
                                    // Sort by date (newest first)
                                    const dateA = new Date(a.split('/').reverse().join('/'));
                                    const dateB = new Date(b.split('/').reverse().join('/'));
                                    return dateB - dateA;
                                })
                                .map(date => (
                                    <div 
                                        key={date}
                                        className="py-2 px-3 hover:bg-gray-100 cursor-pointer rounded mb-1"
                                        onClick={() => applyDateFilter(date)}
                                    >
                                        {date} ({bugsData[date].length} bugs)
                                    </div>
                                ))
                            }
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={clearDateFilter}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Clear Filter
                            </button>
                            <button
                                onClick={() => setFilterMenuOpen(false)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Team member modal */}
            {showTeamMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-80">
                        <h3 className="font-bold mb-3">Manage Team Members</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Add New Team Member</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={newTeamMember}
                                    onChange={(e) => setNewTeamMember(e.target.value)}
                                    className="flex-1 border rounded-l px-3 py-2"
                                    placeholder="Enter name"
                                />
                                <button
                                    onClick={handleAddTeamMember}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-r hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-4 max-h-60 overflow-y-auto">
                            <label className="block text-sm font-medium mb-2">Current Team Members</label>
                            {teamMembers.map(member => (
                                <div key={member} className="flex justify-between items-center py-2 border-b">
                                    <span>{member}</span>
                                    <button
                                        onClick={() => handleRemoveTeamMember(member)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowTeamMemberModal(false)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugTracker;