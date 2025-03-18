import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import SignOutButton from "@/components/auth/SignOutButton";
import {
    LayoutDashboard, FileCode, BarChart3, Video, Bug, GitPullRequest, 
    Settings, HelpCircle, ChevronsLeft, ChevronsRight, ScrollText
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

const Sidebar = ({ setActivePage }) => {
    const [isCollapsed, setIsCollapsed] = useState(null);
    const [selectedPage, setSelectedPage] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        setIsMounted(true);
        const storedCollapsed = localStorage.getItem("sidebarCollapsed");
        const storedPage = localStorage.getItem("activePage");
        setIsCollapsed(storedCollapsed !== null ? JSON.parse(storedCollapsed) : false);
        setSelectedPage(storedPage || "dashboard");

        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isMounted && selectedPage) {
            setActivePage(selectedPage);
        }
    }, [selectedPage, setActivePage, isMounted]);

    const handlePageChange = (page) => {
        setSelectedPage(page);
        localStorage.setItem("activePage", page);
        setIsMobileOpen(false);
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

    const getInitials = (name) => {
        if (!name) return "U";
        const names = name.split(" ");
        return names.map((n) => n[0]).join("").toUpperCase();
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
            <div className={`bg-[#2D3142] text-white ${isCollapsed ? "w-20" : "w-56"} hidden md:flex flex-col transition-all duration-300`}>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                            <span className="text-xl font-bold text-[#00897B]">QA</span>
                        </div>
                        {!isCollapsed && <h1 className="ml-3 text-xl text-white font-bold">TestTracker</h1>}
                    </div>
                    <button onClick={toggleCollapse} className="text-white">
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
                                        ${selectedPage === item.page ? "bg-[#00897B] text-white" : "text-white hover:bg-[#00796B]"}
                                    `}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-[#00897B] flex items-center">
                    {user?.photoURL ? (
                        <Image
                            className="h-8 w-8 rounded-full"
                            src={user.photoURL}
                            width={32}
                            height={32}
                            alt="User avatar"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-[#00897B] flex items-center justify-center text-white font-bold">
                            {getInitials(user?.displayName)}
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.displayName || "Guest User"}</p>
                            <p className="text-xs font-medium text-[#A5D6A7]">{user?.email || "No email available"}</p>
                        </div>
                    )}
                    <div className="ml-auto">
                        <SignOutButton variant="icon" className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-[#2D3142] text-white w-64 transform z-50 transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:hidden`}>
                <div className="p-4 flex items-center justify-between">
                    <h1 className="text-xl text-white font-bold">TestTracker</h1>
                    <button onClick={toggleMobileSidebar} className="text-white">
                        <ChevronsLeft />
                    </button>
                </div>

                <nav className="mt-5 px-2 flex-1">
                    <div className="space-y-1">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(item.page)}
                                className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded transition-all
                                    ${selectedPage === item.page ? "bg-[#2D3142] text-white" : "text-white hover:bg-[#00796B]"}
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
