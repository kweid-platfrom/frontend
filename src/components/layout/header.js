/* eslint-disable @next/next/no-img-element */
// components/layout/Header.js
'use client'
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useUserProfile } from '../../context/userProfileContext';
import { useSuite } from '../../context/SuiteContext'; // Add this import
import { signOut } from 'firebase/auth';
import '../../app/globals.css';
import {
    Bars3Icon,
    UserCircleIcon,
    MagnifyingGlassIcon,
    PlayIcon,
    UserPlusIcon,
    DocumentTextIcon,
    PlusIcon,
    UserIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { X } from 'lucide-react';

// Import your existing components
import SignOutButton from "../auth/SignOutButton";
import ScreenRecorderButton from "../bug-report/ScreenRecorder";
import BugReportButton from "../BugReport";
import UserAvatar from '../UserAvatar';
import AddUserDropdown from "../modals/AddUserDropdown";
import NotificationsDropdown from "../NotificationsDropdown";
import TeamInviteFormMain from "../TeamInviteFormMain";

const Header = ({ onMenuClick, setActivePage }) => {
    const { user } = useAuth();
    const { displayName, email } = useUserProfile();
    const { activeSuite, suites, isLoading } = useSuite(); // Add suite context

    // State management for all dropdowns
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);
    const [showSuiteWarning, setShowSuiteWarning] = useState(false);

    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Refs for dropdown positioning
    const userMenuRef = useRef(null);
    const addUserDropdownRef = useRef(null);
    const reportDropdownRef = useRef(null);
    const testCaseDropdownRef = useRef(null);
    const reportButtonRef = useRef(null);
    const testCaseButtonRef = useRef(null);

    // Dropdown positions
    const [reportDropdownPosition, setReportDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const [testCaseDropdownPosition, setTestCaseDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });

    // Suite validation helper
    const isSuiteSelected = activeSuite && activeSuite.suite_id;
    const hasAvailableSuites = suites && suites.length > 0;

    // Handle suite-specific action validation
    const handleSuiteAction = (actionType, callback) => {
        if (!isSuiteSelected) {
            setShowSuiteWarning(true);
            setTimeout(() => setShowSuiteWarning(false), 3000);
            return;
        }
        callback();
    };

    // Toggle dropdown function with suite validation
    const toggleDropdown = (type) => {
        const action = () => {
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

        handleSuiteAction(type, action);
    };

    // Handle Run Tests with validation
    const handleRunTests = () => {
        handleSuiteAction('runTests', () => {
            console.log('Running tests for suite:', activeSuite.suite_id);
            // Add your run tests logic here
        });
    };

    // Get user display name with fallback logic - now using the context
    const getUserDisplayName = () => {
        // Use the displayName from context first
        if (displayName) return displayName;
        
        // Fallback to extracting from email if available
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

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target) &&
                reportButtonRef.current && !reportButtonRef.current.contains(event.target)) {
                setShowReportOptions(false);
            }
            if (testCaseDropdownRef.current && !testCaseDropdownRef.current.contains(event.target) &&
                testCaseButtonRef.current && !testCaseButtonRef.current.contains(event.target)) {
                setShowTestCaseOptions(false);
            }
            if (addUserDropdownRef.current && !addUserDropdownRef.current.contains(event.target) &&
                !event.target.closest('.add-user-button')) {
                setShowAddUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown positions
    useEffect(() => {
        if (showReportOptions && reportButtonRef.current) {
            const rect = reportButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 160; // minimum width
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setReportDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showReportOptions]);

    useEffect(() => {
        if (showTestCaseOptions && testCaseButtonRef.current) {
            const rect = testCaseButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 160; // minimum width
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setTestCaseDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showTestCaseOptions]);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Sign-out failed:", error);
        }
    };

    const handleRecordingComplete = (recordingData) => {
        console.log('Recording completed:', recordingData);
        // The BugReportButton will handle its own modal state
        // If you need to coordinate between components, you can use a context or callback
    };

    // Invite handlers
    const handleInviteClick = () => {
        // Close all other dropdowns
        setShowUserMenu(false);
        setShowAddUserDropdown(false);
        setShowReportOptions(false);
        setShowTestCaseOptions(false);

        // Open invite modal
        setShowInviteModal(true);
    };

    const handleSendInvites = async (emails) => {
        try {
            setInviteLoading(true);
            console.log('Header - Invites sent to:', emails);

            // Close the modal
            setShowInviteModal(false);

            // You can emit an event or call a callback to notify parent components
            // that users were invited (for updating user lists, etc.)
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('usersInvited', {
                    detail: { emails }
                }));
            }

        } catch (error) {
            console.error('Header - Error handling invites:', error);
        } finally {
            setInviteLoading(false);
        }
    };

    const handleSkipInvites = async () => {
        setShowInviteModal(false);
    };

    // Show loading or return null if no user is authenticated
    if (!user) {
        return null; // or a loading spinner
    }

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 relative z-50 overflow-visible">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left Section */}
                        <div className="flex items-center flex-1">
                            {/* Mobile menu button */}
                            <button
                                onClick={onMenuClick}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            {/* Search Bar - now with more space since project selector is removed */}
                            <div className="relative flex-1 max-w-md ml-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Search test cases, bugs, reports..."
                                    disabled={!isSuiteSelected}
                                />
                            </div>

                            {/* Suite Status Indicator */}
                            {!isLoading && (
                                <div className="ml-4 flex items-center">
                                    {isSuiteSelected ? (
                                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                            <span className="hidden sm:inline">Suite: {activeSuite.metadata?.name}</span>
                                            <span className="sm:hidden">Suite Active</span>
                                        </div>
                                    ) : hasAvailableSuites ? (
                                        <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">No Suite Selected</span>
                                            <span className="sm:hidden">No Suite</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                            <span className="hidden sm:inline">No Suites Available</span>
                                            <span className="sm:hidden">No Suites</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Section - All buttons always visible for authenticated users */}
                        <div className="flex items-center space-x-2">
                            {/* Action Buttons Container - Always visible for authenticated users */}
                            <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1.5">
                                {/* Run Tests - Disabled when no suite selected */}
                                <button 
                                    onClick={handleRunTests}
                                    disabled={!isSuiteSelected}
                                    className={`px-2 py-1.5 text-sm rounded-md flex items-center space-x-1.5 transition-colors ${
                                        isSuiteSelected 
                                            ? 'text-gray-700 hover:bg-green-100 hover:text-green-700 cursor-pointer' 
                                            : 'text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                                    title={isSuiteSelected ? "Run Tests" : "Select a suite to run tests"}
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden lg:inline text-xs">Run Tests</span>
                                </button>

                                {/* Bug Report Button - Requires suite context */}
                                <div className="flex-shrink-0">
                                    <div className={`${!isSuiteSelected ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <BugReportButton 
                                            className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                                                isSuiteSelected
                                                    ? 'text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                                                    : 'text-gray-400 cursor-not-allowed'
                                            }`}
                                            disabled={!isSuiteSelected}
                                            title={isSuiteSelected ? "Report Bug" : "Select a suite to report bugs"}
                                        />
                                    </div>
                                </div>

                                {/* Screen Recorder - Can work without suite but better with context */}
                                <div className="flex-shrink-0">
                                    <ScreenRecorderButton 
                                        onRecordingComplete={handleRecordingComplete}
                                        className="text-gray-700 px-2 py-1.5 text-sm rounded-md hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                        suiteContext={activeSuite}
                                    />
                                </div>

                                {/* Generate Report Dropdown - Requires suite */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        ref={reportButtonRef}
                                        onClick={() => toggleDropdown('report')}
                                        disabled={!isSuiteSelected}
                                        className={`px-2 py-1.5 text-sm rounded-md flex items-center space-x-1.5 transition-colors ${
                                            isSuiteSelected
                                                ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer'
                                                : 'text-gray-400 cursor-not-allowed opacity-50'
                                        }`}
                                        title={isSuiteSelected ? "Generate Report" : "Select a suite to generate reports"}
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span className="hidden lg:inline text-xs">Generate Report</span>
                                    </button>
                                </div>

                                {/* Add Test Case Dropdown - Requires suite */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        ref={testCaseButtonRef}
                                        onClick={() => toggleDropdown('testCase')}
                                        disabled={!isSuiteSelected}
                                        className={`px-2 py-1.5 text-sm rounded-md flex items-center space-x-1.5 transition-colors ${
                                            isSuiteSelected
                                                ? 'text-gray-700 hover:bg-purple-100 hover:text-purple-700 cursor-pointer'
                                                : 'text-gray-400 cursor-not-allowed opacity-50'
                                        }`}
                                        title={isSuiteSelected ? "Add Test Case" : "Select a suite to add test cases"}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        <span className="hidden lg:inline text-xs">Add Test Case</span>
                                    </button>
                                </div>

                                {/* Add Team Member Button - Always available */}
                                <button
                                    onClick={handleInviteClick}
                                    className="text-gray-700 px-2 py-1.5 text-sm rounded-md flex items-center hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer flex-shrink-0"
                                    title="Invite Team Members"
                                >
                                    <UserPlusIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Notifications - Always visible */}
                            <NotificationsDropdown />

                            {/* User Menu - Always visible */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                                    title={`User menu for ${getUserDisplayName()}`}
                                >
                                    {user ? (
                                        <UserAvatar user={user} />
                                    ) : user?.photoURL ? (
                                        <img
                                            className="h-8 w-8 rounded-full"
                                            src={user.photoURL}
                                            alt="User avatar"
                                        />
                                    ) : (
                                        <UserCircleIcon className="h-8 w-8" />
                                    )}
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-sm border-b border-gray-200 mb-2">
                                                <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                                                <p className="text-xs text-gray-500 truncate">{email || user?.email}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    setActivePage('settings');
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                            >
                                                <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                Profile
                                            </button>
                                            <div onClick={handleSignOut} className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
                                                <SignOutButton variant="text" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suite Warning Toast */}
                {showSuiteWarning && (
                    <div className="fixed top-20 right-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
                        <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Suite Required</p>
                                <p className="text-xs mt-1">Please select a test suite to perform this action.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Options Dropdown - Only show when suite is selected */}
                {showReportOptions && isSuiteSelected && (
                    <div
                        ref={reportDropdownRef}
                        className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                        style={{
                            top: `${reportDropdownPosition.top}px`,
                            left: reportDropdownPosition.left !== 'auto' ? `${reportDropdownPosition.left}px` : 'auto',
                            right: reportDropdownPosition.right !== 'auto' ? `${reportDropdownPosition.right}px` : 'auto',
                            minWidth: '160px'
                        }}
                    >
                        <div className="py-1">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                                Bug Summary
                            </button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                                Bug Report
                            </button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                                Test Results Report
                            </button>
                        </div>
                    </div>
                )}

                {/* Test Case Options Dropdown - Only show when suite is selected */}
                {showTestCaseOptions && isSuiteSelected && (
                    <div
                        ref={testCaseDropdownRef}
                        className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                        style={{
                            top: `${testCaseDropdownPosition.top}px`,
                            left: testCaseDropdownPosition.left !== 'auto' ? `${testCaseDropdownPosition.left}px` : 'auto',
                            right: testCaseDropdownPosition.right !== 'auto' ? `${testCaseDropdownPosition.right}px` : 'auto',
                            minWidth: '160px'
                        }}
                    >
                        <div className="py-1">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                                New Test Case
                            </button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                                Import Test Cases
                            </button>
                        </div>
                    </div>
                )}

                {/* Add User Dropdown - Responsive positioning (Legacy - Hidden) */}
                {showAddUserDropdown && (
                    <div
                        ref={addUserDropdownRef}
                        className="absolute top-16 right-4 sm:right-16 bg-white border border-gray-200 shadow-lg rounded-lg z-50 w-64 max-w-[calc(100vw-2rem)]"
                    >
                        <AddUserDropdown onClose={() => setShowAddUserDropdown(false)} />
                    </div>
                )}
            </header>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold">Invite Team Members</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                                disabled={inviteLoading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <TeamInviteFormMain
                            onSendInvites={handleSendInvites}
                            onSkip={handleSkipInvites}
                            isLoading={inviteLoading}
                            userEmail={email || user?.email}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;