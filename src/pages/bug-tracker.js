"use client"
import React, { useState, useEffect } from 'react';
import BugGroup from '../components/BugGroup';
import MassActionBar from '../components/MassActionBar';

const BugTracker = () => {
    const [bugs, setBugs] = useState([]);
    const [groupedBugs, setGroupedBugs] = useState({});
    const [groupColors, setGroupColors] = useState({});
    const [selectedBugs, setSelectedBugs] = useState([]);

    // Sample bug data - in a real app, this would come from an API
    useEffect(() => {
        const initialBugs = [
            {
                id: 1,
                title: "Login page crashes on invalid credentials",
                description: "When entering invalid credentials, the login page crashes instead of showing an error message",
                status: "Open",
                priority: "High",
                severity: "Critical",
                assignedTo: "John Doe",
                reportedBy: "Jane Smith",
                createdAt: "2025-03-10T10:00:00",
                isAutomated: true,
                automatedTestLink: "https://tests.example.com/login-test-suite",
                environment: "Production",
                browser: "Chrome 123",
                os: "Windows 11",
                stepsToReproduce: "1. Go to login page\n2. Enter invalid credentials\n3. Click login",
                actualResult: "Page crashes with JS error",
                expectedResult: "Error message displayed",
                source: "Bug reporting modal"
            },
            {
                id: 2,
                title: "Search results not displaying images",
                description: "Search results are returning correct data but product images are not loading",
                status: "In Progress",
                priority: "Medium",
                severity: "Major",
                assignedTo: "Alice Johnson",
                reportedBy: "Bob Williams",
                createdAt: "2025-03-15T14:30:00",
                isAutomated: false,
                automatedTestLink: "",
                environment: "Staging",
                browser: "Firefox 102",
                os: "macOS Ventura",
                stepsToReproduce: "1. Go to search page\n2. Search for any product\n3. Observe search results",
                actualResult: "Product details show but images are missing",
                expectedResult: "Product details and images display correctly",
                source: "Error captured in network tab during video recording"
            },
            {
                id: 3,
                title: "Checkout process fails at payment step",
                description: "Users cannot complete checkout when selecting credit card payment",
                status: "Open",
                priority: "High",
                severity: "Critical",
                assignedTo: "Sarah Lee",
                reportedBy: "Mike Brown",
                createdAt: "2025-02-25T09:15:00",
                isAutomated: true,
                automatedTestLink: "https://tests.example.com/checkout-test-suite",
                environment: "Production",
                browser: "Safari 16",
                os: "iOS 18",
                stepsToReproduce: "1. Add item to cart\n2. Proceed to checkout\n3. Select credit card payment\n4. Enter payment details\n5. Click submit",
                actualResult: "Error message appears: 'Payment processing failed'",
                expectedResult: "Payment processes successfully and order confirmation displays",
                source: "Bug reporting modal"
            },
            {
                id: 4,
                title: "Notification bell not showing new messages",
                description: "Notification counter not updating when new messages arrive",
                status: "Open",
                priority: "Low",
                severity: "Minor",
                assignedTo: "Unassigned",
                reportedBy: "Chris Taylor",
                createdAt: "2025-02-10T16:45:00",
                isAutomated: false,
                automatedTestLink: "",
                environment: "Development",
                browser: "Edge 115",
                os: "Windows 10",
                stepsToReproduce: "1. Have another user send a message\n2. Observe notification bell",
                actualResult: "Counter does not increment",
                expectedResult: "Counter increments and shows correct number of unread messages",
                source: "Bug reporting modal"
            }
        ];

        setBugs(initialBugs);
    }, []);

    // Group bugs by month
    useEffect(() => {
        if (!bugs.length) return;

        const groups = {};
        const colors = {};

        bugs.forEach(bug => {
            const date = new Date(bug.createdAt);
            const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            const groupKey = `Defects ${monthYear}`;

            if (!groups[groupKey]) {
                groups[groupKey] = [];
                // Assign default colors if not already set
                if (!colors[groupKey]) {
                    colors[groupKey] = getDefaultColor(Object.keys(groups).length);
                }
            }

            groups[groupKey].push(bug);
        });

        // Sort bugs within each group by date (newest first)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });

        setGroupedBugs(groups);

        // Set default colors for any new groups
        const updatedColors = { ...groupColors };
        Object.keys(groups).forEach(key => {
            if (!updatedColors[key]) {
                updatedColors[key] = getDefaultColor(Object.keys(groups).indexOf(key));
            }
        });

        setGroupColors(updatedColors);
    }, [bugs, groupColors]);

    // Default colors for groups
    const getDefaultColor = (index) => {
        const colors = [
            "#3B82F6", // Blue
            "#EF4444", // Red
            "#10B981", // Green
            "#F59E0B", // Yellow
            "#8B5CF6", // Purple
            "#EC4899", // Pink
        ];
        return colors[index % colors.length];
    };

    // Update group color
    const updateGroupColor = (groupKey, color) => {
        setGroupColors({
            ...groupColors,
            [groupKey]: color
        });
    };

    // Handle bug selection
    const handleBugSelection = (bugId, selected) => {
        if (selected) {
            setSelectedBugs([...selectedBugs, bugId]);
        } else {
            setSelectedBugs(selectedBugs.filter(id => id !== bugId));
        }
    };

    // Handle group selection (select all bugs in a group)
    const handleGroupSelection = (groupKey, selected) => {
        const groupBugIds = groupedBugs[groupKey].map(bug => bug.id);

        if (selected) {
            // Add all bugs from this group that aren't already selected
            const newSelectedBugs = [...selectedBugs];
            groupBugIds.forEach(id => {
                if (!newSelectedBugs.includes(id)) {
                    newSelectedBugs.push(id);
                }
            });
            setSelectedBugs(newSelectedBugs);
        } else {
            // Remove all bugs from this group
            setSelectedBugs(selectedBugs.filter(id => !groupBugIds.includes(id)));
        }
    };

    // Clear all selections
    const clearSelections = () => {
        setSelectedBugs([]);
    };

    return (
        <div className="space-y-6">
            {Object.keys(groupedBugs).length > 0 ? (
                <>
                    {Object.keys(groupedBugs).sort().reverse().map(groupKey => (
                        <BugGroup
                            key={groupKey}
                            title={groupKey}
                            bugs={groupedBugs[groupKey]}
                            groupColor={groupColors[groupKey]}
                            onColorChange={(color) => updateGroupColor(groupKey, color)}
                            selectedBugs={selectedBugs}
                            onBugSelection={handleBugSelection}
                            onGroupSelection={handleGroupSelection}
                        />
                    ))}

                    {selectedBugs.length > 0 && (
                        <MassActionBar
                            selectedCount={selectedBugs.length}
                            onClearSelections={clearSelections}
                        />
                    )}
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <p>No bugs found. Create some bugs to get started.</p>
                </div>
            )}
        </div>
    );
};

export default BugTracker;