import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import SignOutButton from "@/components/auth/SignOutButton";
import {
    LayoutDashboard, FileCode, BarChart3, Video, Bug, GitPullRequest, 
    Settings, HelpCircle, ChevronsLeft, ChevronsRight, ScrollText, Menu, X
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Sidebar = ({ setActivePage }) => {
    // Better SSR handling with a stronger initial state
    const [mounted, setMounted] = useState(false);
    const initialSelectedPage = useRef(null);
    
    // State declarations with server-safe defaults
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState("dashboard");
    const [user, setUser] = useState(null);
    const initialRenderRef = useRef(true);

    // First effect - only handle initial mounting and data loading
    useEffect(() => {
        // Get saved active page first to avoid flashing
        if (typeof window !== 'undefined') {
            const storedPage = localStorage.getItem("activePage");
            if (storedPage) {
                initialSelectedPage.current = storedPage;
                setSelectedPage(storedPage);
                // Update parent component immediately
                setActivePage(storedPage);
            }
            
            // Get saved sidebar state
            const storedCollapsed = localStorage.getItem("sidebarCollapsed");
            if (storedCollapsed !== null) {
                setIsCollapsed(JSON.parse(storedCollapsed));
            }
        }
        
        setMounted(true);
    }, []);

    // Separate effect for auth handling to avoid conflicts
    useEffect(() => {
        if (!mounted) return;
        
        // Auth listener
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            
            // If user just logged in and we're still in initial render state
            if (currentUser && initialRenderRef.current) {
                // Only set to dashboard if no specific page was already saved
                if (!initialSelectedPage.current) {
                    setSelectedPage("dashboard");
                    setActivePage("dashboard");
                    localStorage.setItem("activePage", "dashboard");
                }
                initialRenderRef.current = false;
            }
        });

        return () => unsubscribe();
    }, [mounted, setActivePage]);

    // Save collapsed state to localStorage when it changes
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        }
    }, [isCollapsed, mounted]);

    // Update parent component whenever selectedPage changes
    useEffect(() => {
        if (mounted && selectedPage) {
            setActivePage(selectedPage);
            // Save to localStorage when page changes
            localStorage.setItem("activePage", selectedPage);
        }
    }, [selectedPage, setActivePage, mounted]);

    // Close mobile menu on page change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [selectedPage]);

    // Close mobile menu when window resizes to larger than mobile breakpoint
    useEffect(() => {
        if (!mounted) return;
        
        const handleResize = () => {
            if (window.innerWidth >= 768) { // md breakpoint
                setIsMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mounted]);

    const handlePageChange = (page) => {
        setSelectedPage(page);
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
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

    // Display nothing during SSR to prevent layout shifts
    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Mobile Toggle Button - Always visible on mobile */}
            <button
                onClick={toggleMobileMenu}
                className="md:hidden fixed top-4 left-4 z-50 bg-[#2D3142] text-white p-2 rounded-md"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Desktop Sidebar */}
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
                            {navItems.map((item) => (
                                <Tooltip key={item.page}>
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

            {/* Mobile Sidebar - Improved for better overlay */}
            <div 
                className={`md:hidden fixed inset-0 z-40 ${
                    isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
            >
                {/* Backdrop with proper z-index */}
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                        isMobileMenuOpen ? "opacity-50" : "opacity-0"
                    }`}
                    onClick={toggleMobileMenu}
                    aria-hidden="true"
                />
                
                {/* Mobile sidebar with proper z-index and transition */}
                <div 
                    className={`absolute top-0 left-0 h-full w-16 bg-[#2D3142] transform transition-transform duration-300 ease-in-out ${
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex flex-col items-center py-4 pt-16">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-6">
                            <span className="text-xl font-bold text-[#00897B]">QA</span>
                        </div>
                        
                        <div className="flex flex-col space-y-6 items-center">
                            <TooltipProvider>
                                {navItems.map((item) => (
                                    <Tooltip key={item.page}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handlePageChange(item.page)}
                                                className={`flex items-center justify-center h-10 w-10 rounded-md transition-colors
                                                    ${selectedPage === item.page ? "bg-[#00897B] text-white" : "text-white hover:bg-[#00796B]"}
                                                `}
                                                aria-label={item.label}
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
            </div>
        </>
    );
};

export default Sidebar;