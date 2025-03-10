import React, { useState } from "react";
import Image from "next/image";
import {
    LayoutDashboard,
    Beaker,
    Bug,
    GitPullRequest,
    Settings,
    HelpCircle,
    LogOut,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", active: true },
        { icon: Beaker, label: "Test Runs" },
        { icon: Bug, label: "Bug Tracker" },
        { icon: GitPullRequest, label: "Pull Requests" },
        { icon: Settings, label: "Settings" },
        { icon: HelpCircle, label: "Help" },
    ];

    return (
        <div className={`bg-[#A5D6A7] text-white ${isCollapsed ? "w-20" : "w-55"} flex-shrink-0 hidden md:flex flex-col transition-all duration-300`}>
            {/* Sidebar Header */}
            <div className="p-4 flex items-center justify-between">
                {/* Logo Always Visible */}
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-[#2D3142] flex items-center justify-center">
                        <span className="text-xl font-bold">QA</span>
                    </div>
                    {!isCollapsed && <h1 className="ml-3 text-xl text-[#2D3142] font-bold">TestTracker</h1>}
                </div>

                {/* Toggle Button */}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-[#2D3142]">
                    {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="mt-5 px-2 flex-1">
                <div className="space-y-1">
                    {navItems.map((item, index) => (
                        <a
                            key={index}
                            href="#"
                            className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xs 
                                ${item.active ? "bg-[#00897B] text-white" : "text-[#2D3142] hover:bg-[#00897B]"}
                            `}
                        >
                            <item.icon className="h-5 w-5" />
                            {!isCollapsed && <span className="ml-3">{item.label}</span>}
                        </a>
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
