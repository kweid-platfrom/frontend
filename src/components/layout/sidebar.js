import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import SignOutButton from "@/components/auth/SignOutButton";
import {
    LayoutDashboard, FileCode, BarChart3, Video, Bug, GitPullRequest, 
    Settings, HelpCircle, ChevronsLeft, ChevronsRight, ScrollText
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Sidebar = ({ setActivePage }) => {
    // Refs
    const initialRenderRef = useRef(true);
    
    // State
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Try to get from localStorage during initial render
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("sidebarCollapsed");
            return stored !== null ? JSON.parse(stored) : false;
        }
        return false;
    });
    const [selectedPage, setSelectedPage] = useState("dashboard");
    const [user, setUser] = useState(null);

    // Effect for auth and localStorage
    useEffect(() => {
        // Handle page from localStorage
        if (typeof window !== 'undefined') {
            const storedPage = localStorage.getItem("activePage");
            if (storedPage) {
                setSelectedPage(storedPage);
            }
        }

        // Auth listener
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // If user just logged in, set dashboard as active
            if (currentUser && initialRenderRef.current) {
                setSelectedPage("dashboard");
                localStorage.setItem("activePage", "dashboard");
                initialRenderRef.current = false;
            }
        });

        return () => unsubscribe();
    }, []);

    // Update active page in parent component
    useEffect(() => {
        setActivePage(selectedPage);
    }, [selectedPage, setActivePage]);

    // Save collapsed state to localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        }
    }, [isCollapsed]);

    const handlePageChange = (page) => {
        setSelectedPage(page);
        localStorage.setItem("activePage", page);
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
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

    return (
        <>
            {/* Desktop Sidebar - No conditional rendering to prevent flash */}
            <div 
                className={`bg-[#2D3142] text-white h-screen hidden md:flex flex-col transition-all duration-300 ease-in-out ${
                    isCollapsed ? "w-20" : "w-56"
                }`}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-[#00897B]">QA</span>
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-300 ease-in-out ${
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}>
                            <h1 className="text-xl text-white font-bold whitespace-nowrap">TestTracker</h1>
                        </div>
                    </div>
                    <button 
                        onClick={toggleCollapse} 
                        className="text-white flex-shrink-0"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
                    </button>
                </div>

                <nav className="mt-5 px-2 flex-1">
                    <div className="space-y-1">
                        <TooltipProvider>
                            {navItems.map((item, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handlePageChange(item.page)}
                                            className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded transition-colors duration-200
                                                ${selectedPage === item.page ? "bg-[#00897B] text-white" : "text-white hover:bg-[#00796B]"}
                                            `}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className={`ml-3 whitespace-nowrap transition-all duration-300 ease-in-out ${
                                                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 inline"
                                            }`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right" className="bg-[#2D3142] text-white border-[#00897B]">
                                            {item.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-[#00897B] flex items-center">
                    {user?.photoURL ? (
                        <Image
                            className="h-8 w-8 rounded-full flex-shrink-0"
                            src={user.photoURL}
                            width={32}
                            height={32}
                            alt="User avatar"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-[#00897B] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {getInitials(user?.displayName)}
                        </div>
                    )}
                    <div className={`ml-3 transition-all duration-300 ease-in-out overflow-hidden ${
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}>
                        <p className="text-sm font-medium text-white truncate">{user?.displayName || "Guest User"}</p>
                        <p className="text-xs font-medium text-[#A5D6A7] truncate">{user?.email || "No email available"}</p>
                    </div>
                    <div className={`ml-auto transition-opacity duration-300`}>
                        <SignOutButton variant="icon" className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar - Only shows icons when collapsed */}
            <div className="md:hidden flex flex-col fixed top-0 left-0 h-full z-40">
                {/* Mobile Collapsed Bar (Always Visible) */}
                <div className="bg-[#2D3142] h-full w-16 flex flex-col items-center py-4">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-6">
                        <span className="text-xl font-bold text-[#00897B]">QA</span>
                    </div>
                    
                    <div className="flex flex-col space-y-6 items-center">
                        <TooltipProvider>
                            {navItems.map((item, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handlePageChange(item.page)}
                                            className={`flex items-center justify-center h-10 w-10 rounded-md transition-colors
                                                ${selectedPage === item.page ? "bg-[#00897B] text-white" : "text-white hover:bg-[#00796B]"}
                                            `}
                                        >
                                            <item.icon className="h-5 w-5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#2D3142] text-white border-[#00897B]">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </TooltipProvider>
                    </div>
                    
                    <div className="mt-auto">
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
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;