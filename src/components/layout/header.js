/* eslint-disable @next/next/no-img-element */
// components/layout/Header.js
'use client'
import { useState, useRef, useEffect } from 'react';
import { useSuite } from '../../context/SuiteContext';
import { useUserProfile } from '../../context/userProfileContext';
import { signOut } from 'firebase/auth';
import '../../app/globals.css';
import {
    Bars3Icon,
    MagnifyingGlassIcon,
    PlayIcon,
    UserPlusIcon,
    DocumentTextIcon,
    PlusIcon,
    UserIcon,
    CogIcon
} from '@heroicons/react/24/outline';
import { X } from 'lucide-react';

// Import your existing components
import SignOutButton from "../auth/SignOutButton";
import ScreenRecorderButton from "../bug-report/ScreenRecorder";
import UserAvatar from '../UserAvatar';
import AddUserDropdown from "../modals/AddUserDropdown";
import NotificationsDropdown from "../NotificationsDropdown";
import TeamInviteFormMain from "../TeamInviteFormMain";
import BugReportButton from "../BugReportButton"; 

const Header = ({ onMenuClick, setShowBugForm, setActivePage }) => {
    // Get user data from both contexts for comprehensive profile info
    const { user, userProfile: suiteUserProfile } = useSuite();
    const { 
        userProfile: contextUserProfile, 
        displayName: contextDisplayName,
        email: contextEmail,
        accountType,
        isAdmin,
        hasAdminPermission
    } = useUserProfile();

    // Use the most complete user profile data available
    const userProfile = contextUserProfile || suiteUserProfile;
    const userDisplayName = contextDisplayName;
    const userEmail = contextEmail || user?.email;

    // Debug log to check what data we have
    console.log('Header Debug - User Data:', {
        user: user?.email,
        contextUserProfile: contextUserProfile?.firstName,
        suiteUserProfile: suiteUserProfile?.firstName,
        contextDisplayName,
        contextEmail,
        userProfile: userProfile?.firstName
    });

    // State management for all dropdowns
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);

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

    // Toggle dropdown function
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

    // Enhanced user display name function with profile context data
    const getUserDisplayName = () => {
        // Priority: contextDisplayName > profile firstName+lastName > profile displayName > user displayName > extract from email > 'User'
        if (userDisplayName) {
            console.log('Using contextDisplayName:', userDisplayName);
            return userDisplayName;
        }
        
        if (userProfile?.firstName && userProfile?.lastName) {
            const fullName = `${userProfile.firstName} ${userProfile.lastName}`;
            console.log('Using profile firstName+lastName:', fullName);
            return fullName;
        }
        if (userProfile?.displayName) {
            console.log('Using userProfile.displayName:', userProfile.displayName);
            return userProfile.displayName;
        }
        if (userProfile?.name) {
            console.log('Using userProfile.name:', userProfile.name);
            return userProfile.name;
        }
        if (user?.displayName) {
            console.log('Using user.displayName:', user.displayName);
            return user.displayName;
        }
        
        if (userEmail) {
            // Extract name from email (part before @)
            const emailName = userEmail.split('@')[0];
            // Convert to title case and replace dots/underscores with spaces
            const extractedName = emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            console.log('Using extracted email name:', extractedName);
            return extractedName;
        }
        
        console.log('Fallback to "User"');
        return 'User';
    };

    // Get user role/account type display
    const getUserRole = () => {
        if (isAdmin) return 'Admin';
        if (hasAdminPermission) return 'Team Admin';
        if (accountType) return accountType;
        return 'Member';
    };

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        const displayName = getUserDisplayName();
        const names = displayName.split(' ');
        
        if (names.length >= 2) {
            // First letter of first name + first letter of last name
            return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        } else if (names.length === 1) {
            // First two letters of single name
            return names[0].substring(0, 2).toUpperCase();
        }
        return 'U'; // Ultimate fallback
    };

    // Get user avatar with enhanced logic
    const getUserAvatar = () => {
        // Check if user has a profile image
        const hasProfileImage = user?.photoURL || userProfile?.avatar || userProfile?.photoURL;
        
        if (hasProfileImage) {
            // If there's a profile image, use UserAvatar component or img tag
            if (user) {
                return <UserAvatar user={user} userProfile={userProfile} className="h-8 w-8" />;
            }
            return (
                <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={userProfile?.avatar || userProfile?.photoURL || user?.photoURL}
                    alt="User avatar"
                />
            );
        }
        
        // No profile image - show initials
        return (
            <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
            </div>
        );
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
            const dropdownWidth = 160;
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
            const dropdownWidth = 160;
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
        if (setShowBugForm) {
            setShowBugForm(true);
        }
    };

    // Enhanced invite handlers
    const handleInviteClick = () => {
        // Close all other dropdowns
        setShowUserMenu(false);
        setShowAddUserDropdown(false);
        setShowReportOptions(false);
        setShowTestCaseOptions(false);

        // Check permissions before opening invite modal
        if (!hasAdminPermission && !isAdmin) {
            console.warn('User does not have permission to invite team members');
            // You could show a toast notification here
            return;
        }

        setShowInviteModal(true);
    };

    const handleSendInvites = async (emails) => {
        try {
            setInviteLoading(true);
            console.log('Header - Invites sent to:', emails);

            // Close the modal
            setShowInviteModal(false);

            // Emit event to notify parent components
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('usersInvited', {
                    detail: { emails, invitedBy: userEmail }
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

    // Navigation handlers
    const handleProfileClick = () => {
        setShowUserMenu(false);
        setActivePage('profile'); // Updated to use 'profile' instead of 'settings'
    };

    const handleSettingsClick = () => {
        setShowUserMenu(false);
        setActivePage('settings');
    };

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

                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md ml-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Search test cases, bugs, reports..."
                                />
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center space-x-2">
                            {/* Action Buttons Container */}
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">

                                {/* Report Bug Button */}
                                <BugReportButton />

                                {/* Run Tests */}
                                <button className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-green-100 hover:text-green-700 transition-colors">
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden md:inline">Run Tests</span>
                                </button>

                                {/* Screen Recorder */}
                                <div className="cursor-pointer">
                                    <ScreenRecorderButton onRecordingComplete={handleRecordingComplete} />
                                </div>

                                {/* Generate Report Dropdown */}
                                <div className="relative">
                                    <button
                                        ref={reportButtonRef}
                                        onClick={() => toggleDropdown('report')}
                                        className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span className="hidden md:inline">Generate Report</span>
                                    </button>
                                </div>

                                {/* Add Test Case Dropdown */}
                                <div className="relative">
                                    <button
                                        ref={testCaseButtonRef}
                                        onClick={() => toggleDropdown('testCase')}
                                        className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        <span className="hidden md:inline">Add Test Case</span>
                                    </button>
                                </div>

                                {/* Add Team Member Button - With permission check */}
                                {(hasAdminPermission || isAdmin) && (
                                    <button
                                        onClick={handleInviteClick}
                                        className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
                                        title="Invite Team Members"
                                    >
                                        <UserPlusIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Notifications */}
                            <NotificationsDropdown />

                            {/* User Menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                                >
                                    {getUserAvatar()}
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                        <div className="p-2">
                                            {/* Enhanced user info section */}
                                            <div className="px-3 py-3 border-b border-gray-200 mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-8 w-8">
                                                            {getUserAvatar()}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {getUserDisplayName()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {userEmail}
                                                        </p>
                                                        <p className="text-xs text-teal-600 font-medium">
                                                            {getUserRole()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu items */}
                                            <button
                                                onClick={handleProfileClick}
                                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                            >
                                                <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                My Profile
                                            </button>

                                            <button
                                                onClick={handleSettingsClick}
                                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                            >
                                                <CogIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                Settings
                                            </button>

                                            {/* Sign out */}
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

                {/* Report Options Dropdown */}
                {showReportOptions && (
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
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Bug Summary</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Bug Report</button>
                        </div>
                    </div>
                )}

                {/* Test Case Options Dropdown */}
                {showTestCaseOptions && (
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
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">New Test Case</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Import Test Cases</button>
                        </div>
                    </div>
                )}

                {/* Add User Dropdown (Legacy - Hidden) */}
                {showAddUserDropdown && (
                    <div
                        ref={addUserDropdownRef}
                        className="absolute top-16 right-4 sm:right-16 bg-white border border-gray-200 shadow-lg rounded-lg z-50 w-64 max-w-[calc(100vw-2rem)]"
                    >
                        <AddUserDropdown onClose={() => setShowAddUserDropdown(false)} />
                    </div>
                )}
            </header>

            {/* Enhanced Invite Modal */}
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
                            userEmail={userEmail}
                            inviterName={getUserDisplayName()}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;