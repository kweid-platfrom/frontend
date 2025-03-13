"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
    const [colorScheme, setColorScheme] = useState({});
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showBugDetailsModal, setShowBugDetailsModal] = useState(false);

    // Initialize bug data from localStorage or use default data
    const [bugsData, setBugsData] = useState({});

    // Initialize color scheme
    useEffect(() => {
        // Ensure colorScheme is initialized before using it
        const scheme = getColorScheme() || {};
        setColorScheme(scheme);
    }, []);

    // Initialize bug data
    useEffect(() => {
        const initBugsData = () => {
            try {
                const savedBugs = localStorage.getItem('bugsData');
                if (savedBugs) {
                    const parsedData = JSON.parse(savedBugs);
                    if (parsedData && typeof parsedData === 'object') {
                        setBugsData(parsedData);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to load saved bugs data", e);
            }

            // Default bug data if no saved data exists
            const defaultData = {
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
            setBugsData(defaultData);
        };

        initBugsData();
    }, []);

    // Save bugs data to localStorage whenever it changes
    useEffect(() => {
        // Only save if bugsData is properly initialized
        if (bugsData && Object.keys(bugsData).length > 0) {
            localStorage.setItem('bugsData', JSON.stringify(bugsData));
        }
    }, [bugsData]);

    // Keep selectedBug in sync with bugsData
    useEffect(() => {
        if (selectedBug) {
            // Find the current version of the bug in bugsData
            let updatedBug = null;

            // Make sure bugsData is defined before iterating
            if (bugsData) {
                for (const [, bugs] of Object.entries(bugsData)) {
                    if (bugs && Array.isArray(bugs)) {
                        const foundBug = bugs.find(b => b.id === selectedBug.id);
                        if (foundBug) {
                            updatedBug = foundBug;
                            break;
                        }
                    }
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
        if (bugsData && Object.keys(bugsData).length > 0) {
            const initialExpandedState = {};
            Object.keys(bugsData).forEach(date => {
                initialExpandedState[date] = true;  // Set all to true for expanded by default
            });
            setExpandedGroups(initialExpandedState);
        }
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


    const isAllInGroupSelected = useCallback((groupDate) => {
        if (!bugsData || !bugsData[groupDate] || bugsData[groupDate].length === 0) return false;
        return bugsData[groupDate].every(bug =>
            selectedBugs.includes(`${groupDate}-${bug.id}`)
        );
    }, [bugsData, selectedBugs]);

    const clearAllSelections = () => {
        setSelectedBugs([]);
    };

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
        if (!bugsData || !bugsData[groupDate]) return;

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
        if (!colorScheme) return;

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
        if (!bugsData || !bugsData[groupDate]) return;

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

    // Bug field updates
    const handleStatusChange = (bugId, groupDate, newStatus) => {
        if (!bugsData || !bugsData[groupDate]) return;

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
        if (!bugsData || !bugsData[groupDate]) return;

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
        if (!bugsData || !bugsData[groupDate]) return;

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
        if (!bugsData || !bugsData[groupDate]) return;

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
    const getStatusColorForBug = (status) => getStatusColor(status, colorScheme || {});
    const getPriorityColorForBug = (priority) => getPriorityColor(priority, colorScheme || {});
    const getSeverityColorForBug = (severity) => getSeverityColor(severity, colorScheme || {});

    // Update bug details from modal
    const handleUpdateBug = (updatedBug) => {
        if (!bugsData) return;

        const updatedBugsData = { ...bugsData };

        // Find which group this bug belongs to
        for (const [date, bugs] of Object.entries(updatedBugsData)) {
            if (!bugs || !Array.isArray(bugs)) continue;

            const bugIndex = bugs.findIndex(b => b.id === updatedBug.id);
            if (bugIndex !== -1) {
                updatedBugsData[date][bugIndex] = updatedBug;
                setBugsData(updatedBugsData);
                break;
            }
        }
    };

    // Handle bulk operations for selected bugs
    const handleUpdateMultipleBugs = (updates) => {
        if (!bugsData) return;

        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const parts = selectionKey.split('-');
            if (parts.length < 2) return;

            const groupDate = parts[0];
            const bugId = parts.slice(1).join('-'); // Handles case where bugId might contain hyphens

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
        if (!bugsData) return;

        const updatedBugsData = { ...bugsData };

        // If the target group doesn't exist, create it
        if (!updatedBugsData[targetGroup]) {
            updatedBugsData[targetGroup] = [];
        }

        // Process each selected bug
        selectedBugs.forEach(selectionKey => {
            const parts = selectionKey.split('-');
            if (parts.length < 2) return;

            const sourceGroup = parts[0];
            const bugId = parts.slice(1).join('-'); // Handles case where bugId might contain hyphens

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
        if (!bugsData) return;

        const updatedBugsData = { ...bugsData };

        selectedBugs.forEach(selectionKey => {
            const parts = selectionKey.split('-');
            if (parts.length < 2) return;

            const groupDate = parts[0];
            const bugId = parts.slice(1).join('-'); // Handles case where bugId might contain hyphens

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
        if (!commentText || !author || !bugsData || !bugsData[groupDate]) return;

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



    // Check if data is ready to render
    const isDataReady = useMemo(() => {
        return bugsData && Object.keys(bugsData).length > 0;
    }, [bugsData]);

    // If data is not ready, show loading state
    if (!isDataReady) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <SecondaryHeader
                    title="Bug Tracker"
                    actions={[]}
                />
                <main className="flex-1 p-4 flex items-center justify-center">
                    <p>Loading bug tracker data...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <SecondaryHeader
                title="Bug Tracker"

            />

            <main className="flex-1 p-4">

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
                {Object.entries(bugsData).length > 0 ? (
                    Object.entries(bugsData)
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
                                handleStatusChange={(bugId, newStatus) => handleStatusChange(bugId, date, newStatus)}
                                handlePriorityChange={(bugId, newPriority) => handlePriorityChange(bugId, date, newPriority)}
                                handleSeverityChange={(bugId, newSeverity) => handleSeverityChange(bugId, date, newSeverity)}
                                handleAssigneeChange={(bugId, newAssignee) => handleAssigneeChange(bugId, date, newAssignee)}
                                changeGroupColor={() => changeGroupColor(date)}
                                statusOptions={statusOptions}
                                priorityOptions={priorityOptions}
                                severityOptions={severityOptions}
                                getStatusColor={getStatusColorForBug}
                                getPriorityColor={getPriorityColorForBug}
                                getSeverityColor={getSeverityColorForBug}
                                selectedBugs={selectedBugs}
                                handleBugSelection={(bugId) => handleBugSelection(bugId, date)}
                                isAllSelected={isAllInGroupSelected(date)}
                                handleSelectAll={(isChecked) => handleSelectAllInGroup(date, isChecked)}
                                addComment={(bugId, comment, author) => addComment(bugId, date, comment, author)}
                            />
                        ))
                ) : (
                    <div className="p-4 bg-white rounded-lg shadow text-center">
                        <p>No bugs found. {dateFilter ? "Try clearing the filter." : "Add a new bug to get started."}</p>
                    </div>
                )}
            </main>

            {/* Bug details modal */}
            {showBugDetailsModal && selectedBug && (
                <BugDetailsModal
                    bug={selectedBug}
                    onClose={closeBugDetails}
                    onUpdate={handleUpdateBug}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers}
                />
            )}

            {/* Selection actions modal */}
            {showSelectionModal && (
                <SelectionActionsModal
                    onClose={() => setShowSelectionModal(false)}
                    selectedCount={selectedBugs.length}
                    onUpdateMultiple={handleUpdateMultipleBugs}
                    onDeleteSelected={handleDeleteSelectedBugs}
                    onMoveToGroup={handleMoveToGroup}
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers}
                    availableGroups={Object.keys(bugsData)}
                />
            )}

        </div>
    );
};

export default BugTracker;