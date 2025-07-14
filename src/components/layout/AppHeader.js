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
    Search,
    Play,
    UserPlus,
    FileText,
    Plus,
    MonitorSpeaker
} from 'lucide-react';

const AppHeader = ({ 
    user, 
    activeSuite, 
    notificationCount = 0, 
    onMenuClick, 
    onSuiteChange,
    suites = [],
    setShowBugForm,
    setActivePage,
    hasAdminPermission = false,
    isAdmin = false,
    onInviteClick,
    onCreateSuite // Add this prop for creating new suites
}) => {
    const router = useRouter();
    const { signOut } = useAppAuth();
    const { notifications } = useAppNotifications();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSuiteSelector, setShowSuiteSelector] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    
    const userMenuRef = useRef(null);
    const suiteSelectorRef = useRef(null);
    const notificationsRef = useRef(null);
    const reportDropdownRef = useRef(null);
    const testCaseDropdownRef = useRef(null);
    const reportButtonRef = useRef(null);
    const testCaseButtonRef = useRef(null);
    
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
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target) &&
                reportButtonRef.current && !reportButtonRef.current.contains(event.target)) {
                setShowReportOptions(false);
            }
            if (testCaseDropdownRef.current && !testCaseDropdownRef.current.contains(event.target) &&
                testCaseButtonRef.current && !testCaseButtonRef.current.contains(event.target)) {
                setShowTestCaseOptions(false);
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

    const handleCreateSuite = () => {
        setShowSuiteSelector(false);
        onCreateSuite?.();
    };

    const handleProfileClick = () => {
        setShowUserMenu(false);
        setActivePage?.('profile');
    };

    const handleSettingsClick = () => {
        setShowUserMenu(false);
        setActivePage?.('settings');
    };

    const handleBugReportClick = () => {
        console.log('Bug report clicked');
        setShowBugForm?.(true);
    };

    const handleRunTests = () => {
        console.log('Running tests...');
        // Add your run tests logic here
        // Example: You might want to trigger a test suite run
        // or navigate to a test execution page
    };

    // Enhanced Screen Recorder Implementation
    const handleScreenRecorder = async () => {
        if (isRecording) {
            // Stop recording
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
            return;
        }

        try {
            console.log('Starting screen recording...');
            
            // Request screen sharing permission
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true // Include system audio if available
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Clean up
                URL.revokeObjectURL(url);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setMediaRecorder(null);
                
                console.log('Screen recording saved');
            };

            recorder.onerror = (event) => {
                console.error('Recording error:', event);
                setIsRecording(false);
                setMediaRecorder(null);
            };

            // Handle user ending screen share
            stream.getVideoTracks()[0].onended = () => {
                if (isRecording) {
                    recorder.stop();
                }
            };

            setMediaRecorder(recorder);
            setIsRecording(true);
            recorder.start();
            
            console.log('Screen recording started');
            
        } catch (error) {
            console.error('Error starting screen recording:', error);
            
            // User-friendly error messages
            if (error.name === 'NotAllowedError') {
                alert('Screen recording permission denied. Please allow screen sharing to use this feature.');
            } else if (error.name === 'NotSupportedError') {
                alert('Screen recording is not supported in this browser.');
            } else {
                alert('Failed to start screen recording. Please try again.');
            }
        }
    };

    const toggleDropdown = (type) => {
        switch (type) {
            case 'report':
                setShowReportOptions(!showReportOptions);
                setShowTestCaseOptions(false);
                break;
            case 'testCase':
                setShowTestCaseOptions(!showTestCaseOptions);
                setShowReportOptions(false);
                break;
            default:
                break;
        }
    };

    const handleReportOption = (option) => {
        console.log('Generate report:', option);
        setShowReportOptions(false);
        
        // Add your report generation logic here
        switch (option) {
            case 'bug-summary':
                // Navigate to bug summary report or trigger generation
                break;
            case 'bug-report':
                // Navigate to bug report or trigger generation
                break;
            case 'test-results':
                // Navigate to test results report or trigger generation
                break;
            default:
                break;
        }
    };

    const handleTestCaseOption = (option) => {
        console.log('Test case action:', option);
        setShowTestCaseOptions(false);
        
        // Add your test case logic here
        switch (option) {
            case 'new-test-case':
                // Navigate to new test case creation
                setActivePage?.('create-test-case');
                break;
            case 'import-test-cases':
                // Open import dialog or navigate to import page
                break;
            case 'bulk-create':
                // Navigate to bulk creation page
                break;
            default:
                break;
        }
    };

    const getUserDisplayName = () => {
        if (user?.displayName) return user.displayName;
        if (user?.email) {
            const emailName = user.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return 'User';
    };

    const getUserInitials = () => {
        const displayName = getUserDisplayName();
        const names = displayName.split(' ');
        
        if (names.length >= 2) {
            return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        } else if (names.length === 1) {
            return names[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    };
    
    const recentNotifications = notifications.slice(0, 5);
    
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
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
                                    {/* Add New Suite Button */}
                                    <div className="border-t border-gray-200 mt-1">
                                        <button
                                            onClick={handleCreateSuite}
                                            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Plus className="h-4 w-4" />
                                                <span className="font-medium">New Suite</span>
                                            </div>
                                        </button>
                                    </div>
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
                            placeholder="Search test cases, bugs, reports..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                
                {/* Right side - Action Buttons and User Menu */}
                <div className="flex items-center space-x-2">
                    {/* Action Buttons Container */}
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                        
                        {/* Report Bug Button */}
                        <button
                            onClick={handleBugReportClick}
                            className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-red-100 hover:text-red-700 transition-colors"
                            title="Report Bug"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="hidden lg:inline">Report Bug</span>
                        </button>

                        {/* Run Tests */}
                        <button
                            onClick={handleRunTests}
                            className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Run Tests"
                        >
                            <Play className="h-4 w-4" />
                            <span className="hidden lg:inline">Run Tests</span>
                        </button>

                        {/* Screen Recorder */}
                        <button
                            onClick={handleScreenRecorder}
                            className={`text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 transition-colors ${
                                isRecording 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'hover:bg-purple-100 hover:text-purple-700'
                            }`}
                            title={isRecording ? "Stop Recording" : "Start Screen Recording"}
                        >
                            <MonitorSpeaker className="h-4 w-4" />
                            <span className="hidden lg:inline">
                                {isRecording ? 'Stop Recording' : 'Record'}
                            </span>
                            {isRecording && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></div>
                            )}
                        </button>

                        {/* Generate Report Dropdown */}
                        <div className="relative">
                            <button
                                ref={reportButtonRef}
                                onClick={() => toggleDropdown('report')}
                                className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                title="Generate Report"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden lg:inline">Generate Report</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            
                            {showReportOptions && (
                                <div
                                    ref={reportDropdownRef}
                                    className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                                >
                                    <div className="py-1">
                                        <button 
                                            onClick={() => handleReportOption('bug-summary')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            Bug Summary
                                        </button>
                                        <button 
                                            onClick={() => handleReportOption('bug-report')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            Bug Report
                                        </button>
                                        <button 
                                            onClick={() => handleReportOption('test-results')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            Test Results
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Test Case Dropdown */}
                        <div className="relative">
                            <button
                                ref={testCaseButtonRef}
                                onClick={() => toggleDropdown('testCase')}
                                className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                title="Add Test Case"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden lg:inline">Add Test Case</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            
                            {showTestCaseOptions && (
                                <div
                                    ref={testCaseDropdownRef}
                                    className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                                >
                                    <div className="py-1">
                                        <button 
                                            onClick={() => handleTestCaseOption('new-test-case')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            New Test Case
                                        </button>
                                        <button 
                                            onClick={() => handleTestCaseOption('import-test-cases')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            Import Test Cases
                                        </button>
                                        <button 
                                            onClick={() => handleTestCaseOption('bulk-create')}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                        >
                                            Bulk Create
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Team Member Button - With permission check */}
                        {(hasAdminPermission || isAdmin) && (
                            <button
                                onClick={onInviteClick}
                                className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                title="Invite Team Members"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden lg:inline">Invite</span>
                            </button>
                        )}
                    </div>

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
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 rounded-full"
                                />
                            ) : (
                                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {getUserInitials()}
                                </div>
                            )}
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <div className="py-1">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                {user?.photoURL ? (
                                                    <Image
                                                        src={user.photoURL}
                                                        alt={user.displayName || user.email}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {getUserInitials()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {getUserDisplayName()}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {user?.email}
                                                </div>
                                                {(isAdmin || hasAdminPermission) && (
                                                    <div className="text-xs text-blue-600 font-medium">
                                                        {isAdmin ? 'Admin' : 'Team Admin'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={handleProfileClick}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <User className="h-4 w-4" />
                                        <span>My Profile</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleSettingsClick}
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