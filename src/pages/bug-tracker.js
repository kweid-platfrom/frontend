// pages/bug-tracker.jsx or app/bug-tracker/page.jsx
"use client"
import React, { useState, useEffect } from "react";
import BugGroup from "../components/bug-report/bugGroup";
import BugDetailsModal from "../components/BugDetailsModal"
import { X, Plus } from "lucide-react";
import SecondaryHeader from "../components/layout/secondaryHeader";

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
            description: "Users report that the login button doesn't respond on iOS devices smaller than iPhone 12.",
            stepsToReproduce: "1. Open app on iPhone SE\n2. Navigate to login screen\n3. Tap login button",
            comments: []
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
            description: "The system experiences database timeouts when concurrent users exceed 1000.",
            stepsToReproduce: "1. Run load test with 1000+ concurrent users\n2. Monitor database connection pool\n3. Observe timeout errors in logs",
            comments: []
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
            description: "The invoice total doesn't match the sum of line items when discounts are applied.",
            stepsToReproduce: "1. Create invoice with multiple items\n2. Apply percentage discount\n3. Check total amount",
            comments: []
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
            description: "Users are being logged out after only 5 minutes of inactivity instead of the specified 30 minutes.",
            stepsToReproduce: "1. Log in to the application\n2. Remain inactive for 5 minutes\n3. Attempt to perform an action",
            comments: []
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
            description: "When exporting reports with more than 10,000 rows, the system crashes.",
            stepsToReproduce: "1. Generate a report with 10,000+ data points\n2. Click export to Excel\n3. Observe system error",
            comments: []
        }
    ];

    // State management
    const [bugs, setBugs] = useState(initialBugs);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [groupColors, setGroupColors] = useState({});
    const [editingTitle, setEditingTitle] = useState(null);
    const [selectedBugs, setSelectedBugs] = useState([]);
    const [statusOptions, setStatusOptions] = useState(["Open", "In Progress", "Blocked", "Done", "Closed"]);
    const priorityOptions = ["Low", "Medium", "High", "Critical"];
    const severityOptions = ["Minor", "Major", "Critical", "Blocker"];
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [bugForDetails, setBugForDetails] = useState(null);

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
        // Initialize all groups as expanded
        const initialExpandedState = {};
        Object.keys(groupedBugs).forEach(date => {
            initialExpandedState[date] = true;
        });
        setExpandedGroups(initialExpandedState);
        
        // Initialize random colors for groups
        const initialColorState = {};
        Object.keys(groupedBugs).forEach(date => {
            initialColorState[date] = getRandomColor();
        });
        setGroupColors(initialColorState);
        
        // Only run this effect once on component mount
    }, [groupedBugs]);

    // Generate a random color
    const getRandomColor = () => {
        const colors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#06b6d4', // cyan
            '#f97316'  // orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

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
        setGroupColors(prevColors => ({
            ...prevColors,
            [date]: getRandomColor()
        }));
    };

    // Check if all bugs in a group are selected
    const isAllInGroupSelected = (date) => {
        const groupBugs = groupedBugs[date] || [];
        if (groupBugs.length === 0) return false;
        return groupBugs.every(bug => selectedBugs.includes(`${date}-${bug.id}`));
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

    // Add a new status option
    const addNewStatus = (status) => {
        if (!statusOptions.includes(status)) {
            setStatusOptions([...statusOptions, status]);
        }
    };

    // Open bug details
    const openBugDetails = (bug) => {
        setBugForDetails(bug);
    };

    // Close bug details
    const closeBugDetails = () => {
        setBugForDetails(null);
    };

    // Update bug after editing in details modal
    const updateBug = (updatedBug) => {
        setBugs(prevBugs => prevBugs.map(bug => 
            bug.id === updatedBug.id ? updatedBug : bug
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
        // Clear selection after bulk action
        setSelectedBugs([]);
    };

    // Helper functions for color coding
    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return '#3b82f6'; // blue
            case 'In Progress': return '#f59e0b'; // amber
            case 'Blocked': return '#ef4444'; // red
            case 'Done': return '#10b981'; // green
            case 'Closed': return '#6b7280'; // gray
            default: return '#3b82f6'; // default blue
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return '#6b7280'; // gray
            case 'Medium': return '#f59e0b'; // amber
            case 'High': return '#f97316'; // orange
            case 'Critical': return '#ef4444'; // red
            default: return '#6b7280'; // default gray
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Minor': return '#6b7280'; // gray
            case 'Major': return '#f59e0b'; // amber
            case 'Critical': return '#ef4444'; // red
            case 'Blocker': return '#7f1d1d'; // dark red
            default: return '#6b7280'; // default gray
        }
    };

    // Create a new bug
    const createNewBug = () => {
        const newBug = {
            id: `BUG-${String(bugs.length + 1).padStart(3, '0')}`,
            title: "New Bug",
            category: "Uncategorized",
            assignedTo: "unassigned",
            status: "Open",
            priority: "Medium",
            severity: "Minor",
            epic: "",
            testCase: "",
            caseStatus: "",
            dueDate: "",
            automated: "No",
            automationLink: null,
            creationLog: `Created on ${new Date().toISOString().split('T')[0]} by User`,
            creationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
            description: "",
            stepsToReproduce: "",
            comments: []
        };

        setBugs([...bugs, newBug]);
        // Scroll to the bottom to show the new bug
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <SecondaryHeader title="Bug Tracker" />
            
            {/* Bug list */}
            <div className="mt-6">
                {Object.keys(groupedBugs).sort().reverse().map(date => (
                    <BugGroup
                        key={date}
                        date={date}
                        bugs={groupedBugs[date]}
                        expanded={expandedGroups[date]}
                        groupColor={groupColors[date]}
                        onToggleExpand={() => toggleGroup(date)}
                        onChangeColor={() => changeGroupColor(date)}
                        teamMembers={teamMembers}
                        statusOptions={statusOptions}
                        priorityOptions={priorityOptions}
                        severityOptions={severityOptions}
                        selectedBugs={selectedBugs}
                        editingTitle={editingTitle}
                        getStatusColor={getStatusColor}
                        getPriorityColor={getPriorityColor}
                        getSeverityColor={getSeverityColor}
                        isAllInGroupSelected={isAllInGroupSelected(date)}
                        handleSelectAllInGroup={handleSelectAllInGroup}
                        handleBugSelection={handleBugSelection}
                        handleTitleEditStart={handleTitleEditStart}
                        handleTitleEdit={handleTitleEdit}
                        handleTitleEditEnd={handleTitleEditEnd}
                        handleAssigneeChange={handleAssigneeChange}
                        handleStatusChange={handleStatusChange}
                        handlePriorityChange={handlePriorityChange}
                        handleSeverityChange={handleSeverityChange}
                        openBugDetails={openBugDetails}
                        addNewStatus={addNewStatus}
                    />
                ))}
            </div>
            
            {/* Create bug button */}
            <div className="fixed bottom-6 right-6">
                <button
                    onClick={createNewBug}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
                >
                    <Plus size={24} />
                </button>
            </div>
            
            {/* Selection modal for bulk actions */}
            {showSelectionModal && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md px-4 py-3 flex items-center space-x-4 border border-gray-200">
                    <span className="font-medium">{selectedBugs.length} bug(s) selected</span>
                    
                    <button
                        onClick={() => handleBulkAction('markDone')}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                    >
                        Mark Done
                    </button>
                    
                    <button
                        onClick={() => handleBulkAction('markBlocked')}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
                    >
                        Mark Blocked
                    </button>
                    
                    <button
                        onClick={() => handleBulkAction('setPriorityHigh')}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm"
                    >
                        Set High Priority
                    </button>
                    
                    <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm"
                    >
                        Delete
                    </button>
                    
                    <button
                        onClick={() => setSelectedBugs([])}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
            
            {/* Bug details modal */}
            {bugForDetails && (
                <BugDetailsModal 
                    bug={bugForDetails} 
                    onClose={closeBugDetails} 
                    statusOptions={statusOptions}
                    priorityOptions={priorityOptions}
                    severityOptions={severityOptions}
                    teamMembers={teamMembers.map(m => `${m.firstName} ${m.lastName}`).concat(["Unassigned"])}
                    updateBug={updateBug}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                    getSeverityColor={getSeverityColor}
                />
            )}
        </div>
    );
};

export default BugTracker;