// components/layout/AppSidebar.js
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
    Home, 
    Bug, 
    TestTube2, 
    Video, 
    Zap, 
    BarChart3, 
    Settings, 
    CreditCard, 
    X,
    Crown,
    Users,
    Database
} from 'lucide-react';

const AppSidebar = ({ 
    open, 
    onClose, 
    activeSuite, 
    userCapabilities = {},
    activeModule = 'dashboard',
    onNavigate 
}) => {
    const router = useRouter();
    
    const navigationItems = [
        {
            name: 'Dashboard',
            icon: Home,
            path: '/dashboard',
            module: 'dashboard',
            available: true
        },
        {
            name: 'Bug Tracker',
            icon: Bug,
            path: '/bugs',
            module: 'bugs',
            available: true
        },
        {
            name: 'Test Cases',
            icon: TestTube2,
            path: '/testcases',
            module: 'testcases',
            available: true
        },
        {
            name: 'Recordings',
            icon: Video,
            path: '/recordings',
            module: 'recordings',
            available: true
        },
        {
            name: 'Test Data',
            icon: Database,
            path: '/testdata',
            module: 'testdata',
            available: userCapabilities?.hasActiveSubscription
        },
        {
            name: 'Automation',
            icon: Zap,
            path: '/automation',
            module: 'automation',
            available: userCapabilities?.limits?.automation !== 0,
            premium: true
        },
        {
            name: 'Reports',
            icon: BarChart3,
            path: '/reports',
            module: 'reports',
            available: true
        },
        {
            name: 'Team',
            icon: Users,
            path: '/team',
            module: 'team',
            available: userCapabilities?.hasActiveSubscription,
            premium: true
        }
    ];
    
    const handleNavigation = (item) => {
        if (!item.available) return;
        
        onNavigate?.(item.module);
        router.push(item.path);
        onClose?.();
    };
    
    const isPremiumUser = userCapabilities?.hasActiveSubscription;
    const isTrialUser = userCapabilities?.isTrialActive;
    
    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${open ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <TestTube2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900">QA Platform</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Active Suite Info */}
                    {activeSuite && (
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="text-sm font-medium text-gray-900">
                                Current Suite
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                                {activeSuite.name}
                            </div>
                        </div>
                    )}
                    
                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeModule === item.module;
                            const isAvailable = item.available;
                            
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item)}
                                    disabled={!isAvailable}
                                    className={`
                                        group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors
                                        ${isActive 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : isAvailable 
                                                ? 'text-gray-700 hover:bg-gray-100' 
                                                : 'text-gray-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    <div className="flex items-center">
                                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                        <span>{item.name}</span>
                                    </div>
                                    {item.premium && !isPremiumUser && (
                                        <Crown className="h-4 w-4 text-amber-500" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                    
                    {/* Subscription Status */}
                    <div className="p-4 border-t border-gray-200">
                        {isPremiumUser ? (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                                <Crown className="h-4 w-4" />
                                <span>Premium Plan</span>
                            </div>
                        ) : isTrialUser ? (
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm text-blue-600">
                                    <Crown className="h-4 w-4" />
                                    <span>Trial Active</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {userCapabilities.trialDaysRemaining} days remaining
                                </div>
                                <button
                                    onClick={() => {
                                        router.push('/upgrade');
                                        onClose?.();
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">Free Plan</div>
                                <button
                                    onClick={() => {
                                        router.push('/upgrade');
                                        onClose?.();
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Upgrade to Premium
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    router.push('/settings');
                                    onClose?.();
                                }}
                                className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                            >
                                <Settings className="mr-3 h-5 w-5" />
                                Settings
                            </button>
                            
                            {!isPremiumUser && (
                                <button
                                    onClick={() => {
                                        router.push('/upgrade');
                                        onClose?.();
                                    }}
                                    className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                                >
                                    <CreditCard className="mr-3 h-5 w-5" />
                                    Upgrade
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AppSidebar;