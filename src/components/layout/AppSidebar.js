'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import AccountSection from '../AccountSection';
import {
    Video, 
    Zap, 
    BarChart3, 
    Settings, 
    CreditCard, 
    X,
    Crown,
    Users,
    Database,
    ChevronLeft,
    ChevronRight,
    FileText
} from 'lucide-react';
import {
    HomeIcon,
    BugAntIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

const AppSidebar = ({ 
    open, 
    onClose, 
    activeModule,
    onNavigate,
    disabled = false
}) => {
    const router = useRouter();
    const { state } = useApp();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    
    // Extract state from context
    const { isTrialActive, hasActiveSubscription, trialDaysRemaining } = state.subscription;
    
    // Handle mounting and localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCollapsed = localStorage.getItem("sidebarCollapsed");
            if (storedCollapsed !== null) {
                setIsCollapsed(JSON.parse(storedCollapsed));
            }
            // Set initial current path
            setCurrentPath(window.location.pathname);
        }
        setMounted(true);
    }, []);

    // Track pathname changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }
    }, [router]);

    // Save collapse state to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        }
    }, [isCollapsed, mounted]);
    
    const navigationItems = [
        {
            name: 'Dashboard',
            icon: HomeIcon,
            path: '/dashboard',
            module: 'dashboard'
        },
        {
            name: 'Bug Tracker',
            icon: BugAntIcon,
            path: '/bugs',
            module: 'bugs'
        },
        {
            name: 'Test Cases',
            icon: BeakerIcon,
            path: '/testcases',
            module: 'testcases'
        },
        {
            name: 'Recordings',
            icon: Video,
            path: '/recordings',
            module: 'recordings'
        },
        {
            name: 'Test Data',
            icon: Database,
            path: '/testdata',
            module: 'testdata'
        },
        {
            name: 'Documents',
            icon: FileText,
            path: '/documents',
            module: 'documents'
        },
        {
            name: 'Automation',
            icon: Zap,
            path: '/automation',
            module: 'automation'
        },
        {
            name: 'Reports',
            icon: BarChart3,
            path: '/reports',
            module: 'reports'
        },
        {
            name: 'Team',
            icon: Users,
            path: '/team',
            module: 'team'
        }
    ];
    
    const handleNavigation = useCallback((item) => {
        if (disabled) return;
        
        onNavigate?.(item.module);
        router.push(item.path, { scroll: false });
        setCurrentPath(item.path);
        onClose?.();
    }, [onNavigate, router, onClose, disabled]);

    const toggleCollapse = useCallback(() => {
        if (disabled) return;
        setIsCollapsed(prev => !prev);
    }, [disabled]);

    const handleUpgradeClick = useCallback(() => {
        if (disabled) return;
        router.push('/upgrade', { scroll: false });
        onClose?.();
    }, [router, onClose, disabled]);

    const handleSettingsClick = useCallback(() => {
        if (disabled) return;
        router.push('/profile-settings', { scroll: false });
        onClose?.();
    }, [router, onClose, disabled]);
    
    const isPremiumUser = hasActiveSubscription;
    const isTrialUser = isTrialActive;

    if (!mounted) {
        return null;
    }

    // Don't render sidebar if disabled
    if (disabled) {
        return null;
    }
    
    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div 
                    className="fixed inset-0 z-40 bg-background/50 lg:hidden transition-opacity duration-300 ease-in-out"
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-nav shadow-theme-xl transform transition-all duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:inset-0
                ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
                w-64 sm:w-72 md:w-64 flex flex-col min-w-[64px] max-h-screen overflow-hidden
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center h-14 sm:h-16 px-3 sm:px-4 border-b border-border bg-nav flex-shrink-0">
                    <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-200 to-teal-700 rounded-lg flex items-center justify-center shadow-lg">
                                <BeakerIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                            </div>
                        </div>
                        <div className={`ml-2 sm:ml-3 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap bg-gradient-to-r from-purple-600 to-teal-700 bg-clip-text">
                                Assura
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Desktop collapse button */}
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <div className="transition-all duration-300">
                                {isCollapsed ?
                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /> :
                                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                                }
                            </div>
                        </button>

                        {/* Mobile close button */}
                        <button
                            onClick={onClose}
                            className="lg:hidden flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                </div>
                
                {/* Account Section */}
                <div className={`
                    bg-secondary/30 border-b border-border
                    transition-all duration-300 ease-in-out flex-shrink-0
                    ${isCollapsed ? 'h-14 sm:h-16 px-2' : 'min-h-[68px] sm:min-h-[76px] px-3 sm:px-4'}
                    flex items-center
                `}>
                    <AccountSection isCollapsed={isCollapsed} />
                </div>
                
                {/* Navigation - This should be scrollable and flexible */}
                <nav className="flex-1 py-3 sm:py-4 space-y-1 px-3 sm:px-4 overflow-y-auto min-h-0">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        // Check both activeModule prop and current path for active state
                        const isActive = activeModule === item.module || currentPath === item.path;
                        
                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => handleNavigation(item)}
                                    className={`
                                        group/btn flex items-center w-full h-10 sm:h-12 text-xs sm:text-sm rounded-lg transition-all duration-300 ease-in-out
                                        ${isCollapsed ? 'px-2 justify-center' : 'px-2 sm:px-3 justify-start'}
                                        ${isActive
                                            ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-md shadow-teal-500/20'
                                            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                                        }
                                    `}
                                >
                                    {/* Icon container */}
                                    <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                                        <Icon
                                            className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ease-in-out ${isActive
                                                ? 'text-teal-800'
                                                : 'text-muted-foreground group-hover/btn:text-foreground'
                                                }`}
                                        />
                                    </div>

                                    {/* Text container */}
                                    <div className={`
                                        flex items-center justify-between min-w-0 flex-1
                                        ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-2 sm:ml-3 w-auto opacity-100'}
                                        transition-all duration-300 ease-in-out
                                    `}>
                                        <span className={`whitespace-nowrap text-xs sm:text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-4 sm:ml-6 px-2 sm:px-3 py-1 sm:py-2 bg-background/90 text-foreground text-xs sm:text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200 ease-in-out shadow-theme">
                                        <div className="relative">
                                            {item.name}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-background/90 rotate-45 transform"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
                
                {/* Subscription Status */}
                <div className={`
                    border-t border-border bg-nav
                    ${isCollapsed ? 'px-2' : 'px-3 sm:px-4'}
                    transition-all duration-300 ease-in-out
                    py-2 sm:py-3 flex-shrink-0
                `}>
                    <div className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                    `}>
                        {isPremiumUser ? (
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-500">
                                <Crown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="font-medium">Premium Plan</span>
                            </div>
                        ) : isTrialUser ? (
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-500">
                                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="font-medium">Trial Active</span>
                                </div>
                                <div className="text-xs text-blue-400 ml-4 sm:ml-6">
                                    {trialDaysRemaining || 0} days remaining
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                                <span className="font-medium">Free Plan</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer */}
                <div className={`
                    border-t border-border
                    ${isCollapsed ? 'px-2' : 'px-3 sm:px-4'}
                    transition-all duration-300 ease-in-out
                    py-2 flex-shrink-0
                `}>
                    <div className="space-y-1">
                        <div className="relative group">
                            <button
                                onClick={handleSettingsClick}
                                className={`
                                    group/btn flex items-center w-full h-8 sm:h-10 text-xs sm:text-sm rounded-lg transition-all duration-300 ease-in-out
                                    ${isCollapsed ? 'px-2 justify-center' : 'px-2 sm:px-3 justify-start'}
                                    ${currentPath === '/profile-settings'
                                        ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-md shadow-teal-500/20'
                                        : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                                    <Settings className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300 ease-in-out ${
                                        currentPath === '/profile-settings'
                                            ? 'text-teal-800'
                                            : 'text-muted-foreground group-hover/btn:text-foreground'
                                    }`} />
                                </div>
                                <span className={`
                                    whitespace-nowrap text-xs sm:text-sm
                                    ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-2 sm:ml-3 w-auto opacity-100'}
                                    ${currentPath === '/profile-settings' ? 'font-semibold' : 'font-medium'}
                                    transition-all duration-300 ease-in-out
                                `}>
                                    Settings
                                </span>
                            </button>

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="hidden lg:group-hover:block absolute left-full top-0 ml-4 sm:ml-6 px-2 sm:px-3 py-1 sm:py-2 bg-background/90 text-foreground text-xs sm:text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200 ease-in-out shadow-theme">
                                    <div className="relative">
                                        Settings
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-background/90 rotate-45 transform"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {!isPremiumUser && (
                            <div className="relative group">
                                <button
                                    onClick={handleUpgradeClick}
                                    className={`
                                        group/btn flex items-center w-full h-8 sm:h-10 text-xs sm:text-sm rounded-lg transition-all duration-300 ease-in-out
                                        ${isCollapsed ? 'px-2 justify-center' : 'px-2 sm:px-3 justify-start'}
                                        text-muted-foreground hover:bg-secondary/80 hover:text-foreground
                                    `}
                                >
                                    <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                                        <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover/btn:text-foreground transition-colors duration-300 ease-in-out" />
                                    </div>
                                    <span className={`
                                        font-medium whitespace-nowrap text-xs sm:text-sm
                                        ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-2 sm:ml-3 w-auto opacity-100'}
                                        transition-all duration-300 ease-in-out
                                    `}>
                                        Upgrade
                                    </span>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-4 sm:ml-6 px-2 sm:px-3 py-1 sm:py-2 bg-background/90 text-foreground text-xs sm:text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200 ease-in-out shadow-theme">
                                        <div className="relative">
                                            Upgrade
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-background/90 rotate-45 transform"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AppSidebar;