// components/layout/AppSidebar.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    ChevronRight
} from 'lucide-react';
import {
    HomeIcon,
    BugAntIcon,
    BeakerIcon,
} from '@heroicons/react/24/outline';

const AppSidebar = ({ 
    open, 
    onClose, 
    activeSuite, 
    userCapabilities = {},
    activeModule = 'dashboard',
    onNavigate 
}) => {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Handle mounting and localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCollapsed = localStorage.getItem("sidebarCollapsed");
            if (storedCollapsed !== null) {
                setIsCollapsed(JSON.parse(storedCollapsed));
            }
        }
        setMounted(true);
    }, []);

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
        onNavigate?.(item.module);
        router.push(item.path);
        onClose?.();
    }, [onNavigate, router, onClose]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleUpgradeClick = useCallback(() => {
        router.push('/upgrade');
        onClose?.();
    }, [router, onClose]);
    
    const isPremiumUser = userCapabilities?.hasActiveSubscription;
    const isTrialUser = userCapabilities?.isTrialActive;

    if (!mounted) {
        return null;
    }
    
    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-out
                lg:translate-x-0 lg:static lg:inset-0
                ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
                w-64 flex flex-col
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center h-16 px-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-700 rounded-lg flex items-center justify-center shadow-lg">
                                <BeakerIcon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-xl font-bold text-gray-900 whitespace-nowrap bg-gradient-to-r from-blue-600 to-teal-700 bg-clip-text text-transparent">
                                QA Platform
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Desktop collapse button */}
                        <button
                            onClick={toggleCollapse}
                            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 hover:scale-105"
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <div className="transition-all duration-300">
                                {isCollapsed ?
                                    <ChevronRight className="h-4 w-4 text-gray-600" /> :
                                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                                }
                            </div>
                        </button>

                        {/* Mobile close button */}
                        <button
                            onClick={onClose}
                            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>
                
                {/* Trial/Subscription Banner */}
                {isTrialUser && (
                    <div className={`
                        bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/50
                        ${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'}
                        transition-all duration-300 ease-out
                    `}>
                        <div className={`
                            overflow-hidden transition-all duration-300 ease-out
                            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                        `}>
                            <div className="flex items-center space-x-2 text-sm text-blue-700">
                                <Crown className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">Trial Active</span>
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                                {userCapabilities.trialDaysRemaining || 0} days remaining
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Active Suite Info */}
                {activeSuite && (
                    <div className={`
                        bg-gray-50 border-b border-gray-200/50
                        ${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'}
                        transition-all duration-300 ease-out
                    `}>
                        <div className={`
                            overflow-hidden transition-all duration-300 ease-out
                            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                        `}>
                            <div className="text-sm font-medium text-gray-900">
                                Current Suite
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                                {activeSuite.name}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Navigation */}
                <nav className="flex-1 py-4 space-y-2 px-4 overflow-y-auto">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeModule === item.module;
                        
                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => handleNavigation(item)}
                                    className={`
                                        group/btn flex items-center w-full h-12 text-sm rounded transition-all duration-200 hover:scale-[1.02]
                                        ${isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'}
                                        ${isActive
                                            ? 'bg-gradient-to-r from-blue-50 to-teal-50 border-r-4 border-r-teal-500 text-teal-700 shadow-md shadow-teal-500/20'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 cursor-pointer'
                                        }
                                    `}
                                >
                                    {/* Icon container */}
                                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                        <Icon
                                            className={`h-5 w-5 transition-all duration-200 ${isActive
                                                ? 'text-teal-700'
                                                : 'text-teal-700 group-hover/btn:text-gray-600'
                                                }`}
                                        />
                                    </div>

                                    {/* Text container */}
                                    <div className={`
                                        flex items-center justify-between min-w-0 flex-1
                                        ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'}
                                        transition-all duration-300 ease-out
                                    `}>
                                        <span className={`whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-6 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200">
                                        <div className="relative">
                                            {item.name}
                                            {/* Tooltip arrow */}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
                
                {/* Subscription Status */}
                <div className={`
                    border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white
                    ${isCollapsed ? 'px-2 py-3' : 'px-4 py-4'}
                    transition-all duration-300 ease-out
                `}>
                    <div className={`
                        overflow-hidden transition-all duration-300 ease-out
                        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                    `}>
                        {isPremiumUser ? (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                                <Crown className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">Premium Plan</span>
                            </div>
                        ) : isTrialUser ? (
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                                <Crown className="h-4 w-4 flex-shrink-0" />
                                <span className="font-medium">Trial Active</span>
                                <div className="text-xs text-gray-500 ml-auto">
                                    {userCapabilities.trialDaysRemaining || 0} days left
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">Free Plan</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer */}
                <div className={`
                    border-t border-gray-200/50
                    ${isCollapsed ? 'px-2 py-3' : 'px-4 py-4'}
                    transition-all duration-300 ease-out
                `}>
                    <div className="space-y-1">
                        <div className="relative group">
                            <button
                                onClick={() => {
                                    router.push('/settings');
                                    onClose?.();
                                }}
                                className={`
                                    group/btn flex items-center w-full h-10 text-sm rounded transition-all duration-200 hover:scale-[1.02]
                                    ${isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'}
                                    text-gray-500 hover:bg-gray-50 hover:text-gray-800
                                `}
                            >
                                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                    <Settings className="h-5 w-5 text-teal-700 group-hover/btn:text-gray-600 transition-colors duration-200" />
                                </div>
                                <span className={`
                                    font-medium whitespace-nowrap
                                    ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'}
                                    transition-all duration-300 ease-out
                                `}>
                                    Settings
                                </span>
                            </button>

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="hidden lg:group-hover:block absolute left-full top-0 ml-6 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200">
                                    <div className="relative">
                                        Settings
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {!isPremiumUser && (
                            <div className="relative group">
                                <button
                                    onClick={handleUpgradeClick}
                                    className={`
                                        group/btn flex items-center w-full h-10 text-sm rounded transition-all duration-200 hover:scale-[1.02]
                                        ${isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'}
                                        text-gray-500 hover:bg-gray-50 hover:text-gray-800
                                    `}
                                >
                                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                        <CreditCard className="h-5 w-5 text-teal-700 group-hover/btn:text-gray-600 transition-colors duration-200" />
                                    </div>
                                    <span className={`
                                        font-medium whitespace-nowrap
                                        ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'}
                                        transition-all duration-300 ease-out
                                    `}>
                                        Upgrade
                                    </span>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-6 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200">
                                        <div className="relative">
                                            Upgrade
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
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