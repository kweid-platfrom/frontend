// components/layout/AppHeader.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppAuth, useAppNotifications } from '../../contexts/AppProvider';
import { 
    Bell, 
    Menu, 
    ChevronDown, 
    User, 
    Settings, 
    LogOut, 
    TestTube2,
    Search
} from 'lucide-react';

const AppHeader = ({ 
    user, 
    activeSuite, 
    notificationCount = 0, 
    onMenuClick, 
    onSuiteChange,
    suites = [] 
}) => {
    const router = useRouter();
    const { signOut } = useAppAuth();
    const { notifications } = useAppNotifications();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSuiteSelector, setShowSuiteSelector] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const userMenuRef = useRef(null);
    const suiteSelectorRef = useRef(null);
    const notificationsRef = useRef(null);
    
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (suiteSelectorRef.current && !suiteSelectorRef.current.contains(event.target)) {
                setShowSuiteSelector(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    const handleSuiteChange = (suite) => {
        onSuiteChange?.(suite);
        setShowSuiteSelector(false);
    };
    
    const recentNotifications = notifications.slice(0, 5);
    
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left side - Menu and Suite Selector */}
                <div className="flex items-center space-x-4">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    
                    {/* Suite Selector */}
                    <div className="relative" ref={suiteSelectorRef}>
                        <button
                            onClick={() => setShowSuiteSelector(!showSuiteSelector)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                            <TestTube2 className="h-4 w-4" />
                            <span>{activeSuite?.name || 'Select Suite'}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {showSuiteSelector && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="py-1">
                                    {suites.map((suite) => (
                                        <button
                                            key={suite.id}
                                            onClick={() => handleSuiteChange(suite)}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                                activeSuite?.id === suite.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                            }`}
                                        >
                                            <div className="font-medium">{suite.name}</div>
                                            <div className="text-xs text-gray-500">{suite.description}</div>
                                        </button>
                                    ))}
                                    {suites.length === 0 && (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                            No test suites available
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Center - Search */}
                <div className="hidden md:flex flex-1 max-w-lg mx-8">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tests, bugs, or suites..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                
                {/* Right side - Notifications and User Menu */}
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full"
                        >
                            <Bell className="h-6 w-6" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="py-2">
                                    <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                                        Notifications
                                    </div>
                                    {recentNotifications.length > 0 ? (
                                        <div className="max-h-64 overflow-y-auto">
                                            {recentNotifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${
                                                        !notification.read ? 'bg-blue-50' : ''
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {notification.message}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {new Date(notification.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                            No notifications
                                        </div>
                                    )}
                                    <div className="px-4 py-2 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                router.push('/notifications');
                                            }}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-2 p-2 text-sm rounded-full hover:bg-gray-100"
                        >
                            {user?.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt={user.displayName || user.email}
                                    className="h-8 w-8 rounded-full"
                                />
                            ) : (
                                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                </div>
                            )}
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="py-1">
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user?.displayName || 'User'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user?.email}
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            router.push('/profile');
                                        }}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>Profile</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(false);
                                            router.push('/settings');
                                        }}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Settings</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;