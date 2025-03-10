"use client"
import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Play, Bug, FileText, Plus } from "lucide-react";
import Image from "next/image";
import ScreenRecorderButton from "../bug-report/ScreenRecorder";

const Header = ({ setShowBugForm }) => {
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);
    
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
        <header className="bg-[#fff] shadow-sm z-10 py-3 px-4 md:px-6">
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
                    <button className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition">
                        <Play className="h-4 w-4" />
                        <span className="hidden md:inline">Run Tests</span>
                    </button>

                    {/* Report Bug */}
                    <button 
                        className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-[#2D3142] transition"
                        onClick={() => setShowBugForm(true)}
                    >
                        <Bug className="h-4 w-4" />
                        <span className="hidden md:inline">Report Bug</span>
                    </button>

                    {/* Enhanced Screen Recorder Button */}
                    <ScreenRecorderButton onRecordingComplete={handleRecordingComplete} />

                    {/* Generate Report Dropdown */}
                    <div className="relative">
                        <button
                            ref={reportButtonRef}
                            onClick={() => setShowReportOptions(!showReportOptions)}
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline">Generate Report</span>
                        </button>
                    </div>

                    {/* Add Test Case Dropdown */}
                    <div className="relative">
                        <button
                            ref={testCaseButtonRef}
                            onClick={() => setShowTestCaseOptions(!showTestCaseOptions)}
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#E1E2E6] hover:text-white transition"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">Add Test Case</span>
                        </button>
                    </div>

                    {/* Notification Bell */}
                    <button className="p-1 rounded-full text-gray-600 hover:text-gray-800 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center">
                        <Image
                            className="h-8 w-8 rounded-full bg-indigo-500"
                            src="/api/placeholder/32/32"
                            alt="User avatar"
                            width={32}
                            height={32}
                        />
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