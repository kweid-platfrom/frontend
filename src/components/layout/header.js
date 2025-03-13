"use client"
import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Play, UserPlus, FileText, Plus } from "lucide-react";
// import Image from "next/image";
import ScreenRecorderButton from "../bug-report/ScreenRecorder";
import BugReportButton from "../BugReport";
import UserAvatar from "../UserAvatar";
import AddUserDropdown from "../modals/AddUserDropdown"

const Header = ({ setShowBugForm }) => {
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);

    // Toggle user dropdown
    const toggleAddUserDropdown = () => {
        setShowAddUserDropdown(!showAddUserDropdown);
    };

    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);

    // Current user information (would typically come from auth context)
    const currentUser = {
        name: "John Doe",
        email: "john.doe@example.com",
        image: "/dummyimage.com/300.png/09f/fff",
        role: "Developer",
        subscription: "Pro",
        company: "Tech Solutions Inc."
    };

    const reportButtonRef = useRef(null);
    const testCaseButtonRef = useRef(null);
    const reportDropdownRef = useRef(null);
    const testCaseDropdownRef = useRef(null);

    // State for dropdown positions
    const [reportDropdownPosition, setReportDropdownPosition] = useState({ top: 0, left: 0 });
    const [testCaseDropdownPosition, setTestCaseDropdownPosition] = useState({ top: 0, left: 0 });

    // Handle recording completion
    const handleRecordingComplete = (recordingData) => {
        // In a real app, you might want to store this data or pass it to the bug form
        console.log('Recording completed:', recordingData);

        // Automatically open bug report form with recording data
        setShowBugForm(true);
    };

    // Calculate dropdown positions when toggling
    useEffect(() => {
        if (showReportOptions && reportButtonRef.current) {
            const rect = reportButtonRef.current.getBoundingClientRect();
            setReportDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left
            });
        }
    }, [showReportOptions]);

    useEffect(() => {
        if (showTestCaseOptions && testCaseButtonRef.current) {
            const rect = testCaseButtonRef.current.getBoundingClientRect();
            setTestCaseDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left
            });
        }
    }, [showTestCaseOptions]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target) &&
                reportButtonRef.current && !reportButtonRef.current.contains(event.target)) {
                setShowReportOptions(false);
            }
            if (testCaseDropdownRef.current && !testCaseDropdownRef.current.contains(event.target) &&
                testCaseButtonRef.current && !testCaseButtonRef.current.contains(event.target)) {
                setShowTestCaseOptions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showReportOptions, showTestCaseOptions]);

    return (
        <header className="bg-[#fff] shadow-sm z-10 py-3 px-4 md:px-6 overflow-visible">
            <div className="flex items-center justify-between space-x-2">

                {/* Search Bar */}
                <div className="relative flex-1 max-w-xs md:max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-600" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-400 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00897B] focus:border-[#00897B]"
                        placeholder="Search test cases, bugs, reports..."
                    />
                </div>

                {/* Buttons Container */}
                <div className="flex items-center space-x-3 overflow-x-auto whitespace-nowrap rounded-sm px-3 py-2 bg-white">

                    {/* Run Tests */}
                    <button className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-[#2d3142] transition">
                        <Play className="h-4 w-4" />
                        <span className="hidden md:inline">Run Tests</span>
                    </button>

                    {/* Report Bug */}
                    <BugReportButton className="text-[#2D3142] hover:bg-[rgb(165,214,167)] hover:text-[#2D3142] cursor-pointer" />


                    {/* Enhanced Screen Recorder Button */}
                    <div className="cursor-pointer">
                        <ScreenRecorderButton onRecordingComplete={handleRecordingComplete} />
                    </div>
                    {/* Generate Report Dropdown */}
                    <div className="relative">
                        <button
                            ref={reportButtonRef}
                            onClick={() => setShowReportOptions(!showReportOptions)}
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-[#2D3142] transition"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline cursor-pointer">Generate Report</span>
                        </button>
                    </div>

                    {/* Add Test Case Dropdown */}
                    <div className="relative">
                        <button
                            ref={testCaseButtonRef}
                            onClick={() => setShowTestCaseOptions(!showTestCaseOptions)}
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5d6a7] hover:text-[#2D3142] transition cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">Add Test Case</span>
                        </button>
                    </div>
                    {/* Add Team Member Button */}
                    <div className="relative">
                        <button
                            onClick={toggleAddUserDropdown}
                            className="relative text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-1 hover:bg-[#A5d6a7] transition mr-2 cursor-pointer z-50" 

                        >
                            <UserPlus className="h-4 w-4" />
                        </button>
                        {showAddUserDropdown && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-300 shadow-lg rounded-md z-[9999]">
                                <AddUserDropdown onClose={() => setShowAddUserDropdown(false)} />
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <button className="p-1 rounded-full text-gray-600 hover:text-gray-800 relative cursor-pointer">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center">
                        <UserAvatar user={currentUser} size={40} />
                    </div>


                </div>
            </div>

            {/* Report Options Dropdown - Fixed Position */}
            {showReportOptions && (
                <div
                    ref={reportDropdownRef}
                    className="fixed bg-white border border-gray-300 shadow-lg rounded-md text-sm z-50"
                    style={{
                        top: `${reportDropdownPosition.top}px`,
                        left: `${reportDropdownPosition.left}px`,
                        minWidth: '160px'
                    }}
                >
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Bug Summary</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Bug Report</button>
                </div>
            )}

            {/* Test Case Options Dropdown - Fixed Position */}
            {showTestCaseOptions && (
                <div
                    ref={testCaseDropdownRef}
                    className="fixed bg-white border border-gray-300 shadow-lg rounded-md text-sm z-50"
                    style={{
                        top: `${testCaseDropdownPosition.top}px`,
                        left: `${testCaseDropdownPosition.left}px`,
                        minWidth: '160px'
                    }}
                >
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">New Test Case</button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Import Test Cases</button>
                </div>
            )}
        </header>
    );
};

export default Header;