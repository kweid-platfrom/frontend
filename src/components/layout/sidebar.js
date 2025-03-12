import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
    LayoutDashboard,
    FileCode,
    BarChart3,
    Video,
    Bug,
    GitPullRequest,
    Settings,
    HelpCircle,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
    ScrollText
} from "lucide-react";

const Sidebar = ({ setActivePage }) => {
    // Initialize from localStorage to prevent flashing issue
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return JSON.parse(localStorage.getItem("isCollapsed")) ?? false;
    });

    const [selectedPage, setSelectedPage] = useState(() => {
        return localStorage.getItem("activePage") || "dashboard";
    });

    useEffect(() => {
        setActivePage(selectedPage); // Ensure active page state is updated
    }, [selectedPage, setActivePage]);

    const handlePageChange = (page) => {
        setSelectedPage(page);
        localStorage.setItem("activePage", page);
    };

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const newState = !prev;
            localStorage.setItem("isCollapsed", JSON.stringify(newState));
            return newState;
        });
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", page: "dashboard" },
        { icon: Bug, label: "Bug Tracker", page: "bug-tracker" },
        { icon: ScrollText, label: "Test Scripts", page: "test-scripts" },
        { icon: FileCode, label: "Automated Scripts", page: "auto-scripts" },
        { icon: BarChart3, label: "Reports", page: "reports" },
        { icon: Video, label: "Recordings", page: "recordings" },
        { icon: GitPullRequest, label: "Pull Requests", page: "pull-requests" },
        { icon: Settings, label: "Settings", page: "settings" },
        { icon: HelpCircle, label: "Help", page: "help" },
    ];

    return (
        <div className={`bg-[#00897B] text-white ${isCollapsed ? "w-20" : "w-55"} flex-shrink-0 hidden md:flex flex-col transition-all duration-300`}>
            {/* Sidebar Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-[#2D3142] flex items-center justify-center">
                        <span className="text-xl font-bold">QA</span>
                    </div>
                    {!isCollapsed && <h1 className="ml-3 text-xl text-[#2D3142] font-bold">TestTracker</h1>}
                </div>

                {/* Toggle Button */}
                <button onClick={toggleCollapse} className="text-[#2D3142]">
                    {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="mt-5 px-2 flex-1">
                <div className="space-y-1">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handlePageChange(item.page)}
                            className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xs transition-all
                                ${selectedPage === item.page ? "bg-[#A5D6A7] text-[#00897B]" : "text-white hover:bg-[#00796B]"}
                            `}
                        >
                            <item.icon className="h-5 w-5" />
                            {!isCollapsed && <span className="ml-3">{item.label}</span>}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-[#00897B] flex items-center">
                <Image
                    className="h-8 w-8 rounded-full bg-[#2D3142]"
                    src="/api/placeholder/32/32"
                    width={32}
                    height={32}
                    alt="User avatar"
                />
                {!isCollapsed && (
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">Alex Johnson</p>
                        <p className="text-xs font-medium text-[#2D3142]">QA Engineer</p>
                    </div>
                )}
                <button className="ml-auto text-[#2D3142] hover:text-white">
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
