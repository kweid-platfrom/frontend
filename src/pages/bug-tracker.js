// pages/bug-management-demo.js or app/bug-management/page.js
"use client"
import React, { useState, useEffect } from "react";
import BugGroup from "../components/bug-report/bugGroup";
import { X } from "lucide-react";

const BugTracker = () => {
    // Mock data for demonstration
    const initialBugs = [
        {
            id: "BUG-001",
            title: "Login button not working on mobile devices",
            category: "UI/UX",
            assignedTo: "1", // John Doe
            status: "Open",
            priority: "High",
            severity: "Major",
            epic: "User Authentication",
            testCase: "TC-123",
            caseStatus: "Failed",
            dueDate: "2025-03-20",
            automated: "No",
            automationLink: null,
            creationLog: "Created on 2025-03-10 by Admin",
            creationDate: "2025-03-10 09:30:00",
            description: "Users report that the login button doesn't respond on iOS devices smaller than iPhone 12."
        },
        {
            id: "BUG-002",
            title: "Database timeout during high traffic periods",
            category: "Backend",
            assignedTo: "2", // Jane Smith
            status: "In Progress",
            priority: "Critical",
            severity: "Blocker",
            epic: "System Performance",
            testCase: "TC-456",
            caseStatus: "Failed",
            dueDate: "2025-03-15",
            automated: "Yes",
            automationLink: "https://github.com/example/tests/performance",
            creationLog: "Created on 2025-03-10 by Admin",
            creationDate: "2025-03-10 14:45:00",
            description: "The system experiences database timeouts when concurrent users exceed 1000."
        },
        {
            id: "BUG-003",
            title: "Incorrect calculation in invoice totals",
            category: "Business Logic",
            assignedTo: "3", // Alex Johnson
            status: "Done",
            priority: "Medium",
            severity: "Major",
            epic: "Billing System",
            testCase: "TC-789",
            caseStatus: "Passed",
            dueDate: "2025-03-12",
            automated: "Yes",
            automationLink: "https://github.com/example/tests/billing",
            creationLog: "Created on 2025-03-11 by Admin",
            creationDate: "2025-03-11 11:20:00",
            description: "The invoice total doesn't match the sum of line items when discounts are applied."
        },
        {
            id: "BUG-004",
            title: "Session timeout occurring too quickly",
            category: "Security",
            assignedTo: "unassigned",
            status: "Open",
            priority: "Low",
            severity: "Minor",
            epic: "User Sessions",
            testCase: "TC-234",
            caseStatus: "Failed",
            dueDate: "2025-03-25",
            automated: "No",
            automationLink: null,
            creationLog: "Created on 2025-03-12 by Admin",
            creationDate: "2025-03-12 13:15:00",
            description: "Users are being logged out after only 5 minutes of inactivity instead of the specified 30 minutes."
        },
        {
            id: "BUG-005",
            title: "Report export fails with large datasets",
            category: "Reporting",
            assignedTo: "1", // John Doe
            status: "Blocked",
            priority: "High",
            severity: "Critical",
            epic: "Analytics Platform",
            testCase: "TC-567",
            caseStatus: "Failed",
            dueDate: "2025-03-18",
            automated: "Yes",
            automationLink: "https://github.com/example/tests/reporting",
            creationLog: "Created on 2025-03-12 by Admin",
            creationDate: "2025-03-12 16:40:00",
            description: "When exporting reports with more than 10,000 rows, the system crashes."
        }
    ];

    // State management
    const [bugs, setBugs] = useState(initialBugs);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [groupColors, setGroupColors] = useState({});
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const statusOptions = ["Open", "In Progress", "Blocked", "Done", "Closed"];
    const priorityOptions = ["Low", "Medium", "High", "Critical"];
    const severityOptions = ["Minor", "Major", "Critical", "Blocker"];
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    // Team members
    const teamMembers = [
        { id: "1", firstName: "John", lastName: "Doe", avatar: "/api/placeholder/30/30" },
        { id: "2", firstName: "Jane", lastName: "Smith", avatar: "/api/placeholder/30/30" },
        { id: "3", firstName: "Alex", lastName: "Johnson", avatar: "/api/placeholder/30/30" }
    ];

    // Group bugs by date
    const groupedBugs = bugs.reduce((acc, bug) => {
        const date = bug.creationDate.split(' ')[0]; // Get just the date part
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(bug);
        return acc;
    }, {});

    useEffect(() => {
        const initialExpandedState = {};
        const groupDates = Object.keys(groupedBugs);
        groupDates.forEach(date => {
            initialExpandedState[date] = true;
        });
        setExpandedGroups(initialExpandedState);
        // Only run this effect once on component mount
    }, [groupedBugs]);

    // Show selection modal when bugs are selected
    useEffect(() => {
        setShowSelectionModal(selectedBugs.length > 0);
    }, [selectedBugs]);

    // Toggle group expansion
    const toggleGroup = (date) => {
        setExpandedGroups(prevState => ({
            ...prevState,
            [date]: !prevState[date]
        }));
    };

    // Change group color
    const changeGroupColor = (date) => {
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        setGroupColors(prevColors => ({
            ...prevColors,
            [date]: randomColor
        }));
    };

    // Check if all bugs in a group are selected
const isAllInGroupSelected = (date) => {
    // Make sure groupedBugs[date] exists and is an array
    const groupBugs = groupedBugs[date] || [];
    
    // If there are no bugs in this group, return false
    if (groupBugs.length === 0) return false;
    
    // Make sure selectedBugs is an array before using includes
    if (!Array.isArray(selectedBugs)) return false;
    
    // Check if every bug in the group is selected
    return groupBugs.every(bug => {
        // Create the bug key the same way it's created in handleBugSelection
        const bugKey = `${date}-${bug.id}`;
        return selectedBugs.includes(bugKey);
    });
};

    // Handle selecting all bugs in a group
    const handleSelectAllInGroup = (date, isChecked) => {
        const groupBugs = groupedBugs[date] || [];

        if (isChecked) {
            // Add all bugs from this group that aren't already selected
            const newSelectedBugs = [...selectedBugs];
            groupBugs.forEach(bug => {
                const bugKey = `${date}-${bug.id}`;
                if (!newSelectedBugs.includes(bugKey)) {
                    newSelectedBugs.push(bugKey);
                }
            });
            setSelectedBugs(newSelectedBugs);
        } else {
            // Remove all bugs from this group
            setSelectedBugs(selectedBugs.filter(bugKey => !bugKey.startsWith(`${date}-`)));
        }
    };

    // Handle individual bug selection
    const handleBugSelection = (bugId, date) => {
        const bugKey = `${date}-${bugId}`;

        if (selectedBugs.includes(bugKey)) {
            setSelectedBugs(selectedBugs.filter(key => key !== bugKey));
        } else {
            setSelectedBugs([...selectedBugs, bugKey]);
        }
    };

    // Handle title editing
    const handleTitleEditStart = (bugId) => {
        setEditingTitle(bugId);
    };

    const handleTitleEdit = (bugId, date, e) => {
        const newTitle = e.target.value;
        setBugs(prevBugs => prevBugs.map(bug =>
            bug.id === bugId ? { ...bug, title: newTitle } : bug
        ));
    };

    const handleTitleEditEnd = () => {
        setEditingTitle(null);
    };

    // Handle assignee change
    const handleAssigneeChange = (bugId, date, assigneeId) => {
        setBugs(prevBugs => prevBugs.map(bug =>
            bug.id === bugId ? { ...bug, assignedTo: assigneeId } : bug
        ));
    };

    // Handle status change
    const handleStatusChange = (bugId, date, status) => {
        setBugs(prevBugs => prevBugs.map(bug =>
            bug.id === bugId ? { ...bug, status: status } : bug
        ));
    };

    // Handle priority change
    const handlePriorityChange = (bugId, date, priority) => {
        setBugs(prevBugs => prevBugs.map(bug =>
            bug.id === bugId ? { ...bug, priority: priority } : bug
        ));
    };

    // Handle severity change
    const handleSeverityChange = (bugId, date, severity) => {
        setBugs(prevBugs => prevBugs.map(bug =>
            bug.id === bugId ? { ...bug, severity: severity } : bug
        ));
    };

    // Handle bulk actions
    const handleBulkAction = (action) => {
        let updatedBugs = [...bugs];

        selectedBugs.forEach(bugKey => {
            const bugId = bugKey.split('-')[1];

            switch (action) {
                case 'delete':
                    updatedBugs = updatedBugs.filter(bug => bug.id !== bugId);
                    break;
                case 'markDone':
                    updatedBugs = updatedBugs.map(bug =>
                        bug.id === bugId ? { ...bug, status: 'Done' } : bug
                    );
                    break;
                case 'markBlocked':
                    updatedBugs = updatedBugs.map(bug =>
                        bug.id === bugId ? { ...bug, status: 'Blocked' } : bug
                    );
                    break;
                case 'setPriorityHigh':
                    updatedBugs = updatedBugs.map(bug =>
                        bug.id === bugId ? { ...bug, priority: 'High' } : bug
                    );
                    break;
                default:
                    break;
            }
        });

        setBugs(updatedBugs);
        setSelectedBugs([]);
    };

    // Clear all selections
    const clearSelections = () => {
        setSelectedBugs([]);
    };

    return (
        <div className="p-4 max-w-screen-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Bug Management Demo</h1>

            {/* Selection modal */}
            {showSelectionModal && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg z-50 flex items-center gap-4">
                    <span className="font-medium">{selectedBugs.length} items selected</span>
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => handleBulkAction('markDone')}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                        Mark Done
                    </button>
                    <button
                        onClick={() => handleBulkAction('markBlocked')}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                    >
                        Mark Blocked
                    </button>
                    <button
                        onClick={() => handleBulkAction('setPriorityHigh')}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                    >
                        Set High Priority
                    </button>
                    <button
                        onClick={clearSelections}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Bug groups */}
{Object.entries(groupedBugs).map(([date, bugs]) => (
    <BugGroup
    key={date}
    date={date}
    bugs={bugs}
    expanded={expandedGroups[date]}
    groupColor={groupColors[date]}
    onToggleExpand={() => toggleGroup(date)}
    onChangeColor={() => changeGroupColor(date)}
    teamMembers={teamMembers}
    editingTitle={editingTitle}
    onTitleEditStart={handleTitleEditStart}
    onTitleEdit={(bugId, e) => handleTitleEdit(bugId, date, e)}
    onTitleEditEnd={handleTitleEditEnd}
    onAssigneeChange={(bugId, assigneeId) => handleAssigneeChange(bugId, date, assigneeId)}
    onStatusChange={(bugId, status) => handleStatusChange(bugId, date, status)}
    onPriorityChange={(bugId, priority) => handlePriorityChange(bugId, date, priority)}
    onSeverityChange={(bugId, severity) => handleSeverityChange(bugId, date, severity)}
    statusOptions={statusOptions}
    priorityOptions={priorityOptions}
    severityOptions={severityOptions}
    selectedBugs={selectedBugs}
    onBugSelection={(bugId) => handleBugSelection(bugId, date)}
    isAllSelected={isAllInGroupSelected(date)}
    onSelectAll={(isChecked) => handleSelectAllInGroup(date, isChecked)}
/>
))}
        </div>
    );
};

export default BugTracker;