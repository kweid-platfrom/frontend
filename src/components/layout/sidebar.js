import React, { useState, useEffect } from "react";
import Image from "next/image";
import SignOutButton from "@/components/auth/SignOutButton";
import {
    LayoutDashboard, FileCode, BarChart3, Video, Bug, GitPullRequest, 
    Settings, HelpCircle, ChevronsLeft, ChevronsRight, ScrollText
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip"; // Assuming you use ShadCN for tooltips

const Sidebar = ({ setActivePage }) => {
    const [isCollapsed, setIsCollapsed] = useState(null);
    const [selectedPage, setSelectedPage] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedCollapsed = localStorage.getItem("sidebarCollapsed");
        const storedPage = localStorage.getItem("activePage");
        setIsCollapsed(storedCollapsed !== null ? JSON.parse(storedCollapsed) : false);
        setSelectedPage(storedPage || "dashboard");
    }, []);

    useEffect(() => {
        if (isMounted && selectedPage) {
            setActivePage(selectedPage);
        }
    }, [selectedPage, setActivePage, isMounted]);

    const handlePageChange = (page) => {
        setSelectedPage(page);
        localStorage.setItem("activePage", page);
        setIsMobileOpen(false); // Close mobile sidebar when selecting a page
    };

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const newState = !prev;
            localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
            return newState;
        });
    };

    const toggleMobileSidebar = () => {
        setIsMobileOpen((prev) => !prev);
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

    if (isCollapsed === null || !isMounted) {
        return <div className="bg-[#00897B] w-20 flex-shrink-0 hidden md:block"></div>;
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`bg-[#00897B] text-white ${isCollapsed ? "w-20" : "w-56"} hidden md:flex flex-col transition-all duration-300`}>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-[#2D3142] flex items-center justify-center">
                            <span className="text-xl font-bold">QA</span>
                        </div>
                        {!isCollapsed && <h1 className="ml-3 text-xl text-[#2D3142] font-bold">TestTracker</h1>}
                    </div>
                    <button onClick={toggleCollapse} className="text-[#2D3142]">
                        {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                    </button>
                </div>

                <nav className="mt-5 px-2 flex-1">
                    <div className="space-y-1">
                        {navItems.map((item, index) => (
                            <Tooltip key={index} content={isCollapsed ? item.label : ""} placement="right">
                                <button
                                    onClick={() => handlePageChange(item.page)}
                                    className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xs transition-all
                                        ${selectedPage === item.page ? "bg-[#A5D6A7] text-[#00897B]" : "text-white hover:bg-[#00796B]"}
                                    `}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-[#00897B] flex items-center">
                    <Image className="h-8 w-8 rounded-full bg-[#2D3142]" src="/dummyimage.com/300.png/09f/fff" width={32} height={32} alt="User avatar" />
                    {!isCollapsed && (
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">Alex Johnson</p>
                            <p className="text-xs font-medium text-[#2D3142]">QA Engineer</p>
                        </div>
                    )}
                    <button className="ml-auto text-[#2D3142] hover:text-white">
                        <SignOutButton variant="icon" className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-[#00897B] text-white w-64 transform z-50 transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:hidden`}>
                <div className="p-4 flex items-center justify-between">
                    <h1 className="text-xl text-[#2D3142] font-bold">TestTracker</h1>
                    <button onClick={toggleMobileSidebar} className="text-[#2D3142]">
                        <ChevronsLeft />
                    </button>
                </div>

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
                                <span className="ml-3">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Sidebar Toggle Button (Floating Arrow) */}
            <button onClick={toggleMobileSidebar} className="fixed top-1/2 left-2 md:hidden bg-[#00897B] text-white p-2 rounded-full shadow-lg z-52">
                {isMobileOpen ? <ChevronsLeft /> : <ChevronsRight />}
            </button>
        </>
    );
};

export default Sidebar;
