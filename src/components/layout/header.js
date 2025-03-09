import React, { useState } from "react";
import { Bell, Search, Play, Bug, FileText, Video, Plus } from "lucide-react";
import Image from "next/image";

const Header = () => {
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);

    return (
        <header className="bg-[#E1E2E6] shadow-sm z-10 py-3 px-4 md:px-6">
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
                <div className="flex items-center space-x-3 overflow-x-auto whitespace-nowrap border border-gray-400 rounded-lg px-3 py-2 bg-white">
                    
                    {/* Run Tests */}
                    <button className="text-[#00897B] px-3 py-2 text-sm rounded-lg flex items-center space-x-2 hover:bg-[#00897B] hover:text-white transition">
                        <Play className="h-4 w-4" />
                        <span className="hidden md:inline">Run Tests</span>
                    </button>

                    {/* Report Bug */}
                    <button className="text-[#A5D6A7] px-3 py-2 text-sm rounded-lg flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-[#2D3142] transition">
                        <Bug className="h-4 w-4" />
                        <span className="hidden md:inline">Report Bug</span>
                    </button>

                    {/* Screen Record */}
                    <button className="text-[#2D3142] px-3 py-2 text-sm rounded-lg flex items-center space-x-2 hover:bg-[#2D3142] hover:text-white transition">
                        <Video className="h-4 w-4" />
                        <span className="hidden md:inline">Screen Record</span>
                    </button>

                    {/* Generate Report Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowReportOptions(!showReportOptions)}
                            className="text-[#2D3142] px-3 py-2 text-sm rounded-lg flex items-center space-x-2 hover:bg-[#2D3142] hover:text-white transition"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline">Generate Report</span>
                        </button>

                        {showReportOptions && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 shadow-lg rounded-md text-sm">
                                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Bug Summary (PDF/CSV)</button>
                                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Bug Report (PDF/CSV)</button>
                            </div>
                        )}
                    </div>

                    {/* Add Test Case Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTestCaseOptions(!showTestCaseOptions)}
                            className="text-[#00897B] px-3 py-2 text-sm rounded-lg flex items-center space-x-2 hover:bg-[#00897B] hover:text-white transition"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">+ Add Test Case</span>
                        </button>

                        {showTestCaseOptions && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 shadow-lg rounded-md text-sm">
                                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">New Test Case</button>
                                <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">Import Test Cases</button>
                            </div>
                        )}
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
        </header>
    );
};

export default Header;