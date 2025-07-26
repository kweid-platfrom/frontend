/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../app/globals.css';
import {
    Bars3Icon,
    MagnifyingGlassIcon,
    PlayIcon,
    PlusIcon,
    UserIcon,
    ChevronDownIcon,
    BuildingOffice2Icon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { X, Building2, Calendar, Bell } from 'lucide-react';

// Import components
import BugReportButton from '../modals/BugReportButton';
import TeamInviteButton from '../buttons/TeamInviteButton';
import ScreenRecorderButton from '../buttons/ScreenRecorderButton';
import ReportDropdown from '../ReportDropdown';
import TestCaseDropdown from '../TestCaseDropdown';
import CreateSuiteModal from '../modals/createSuiteModal';
import { safeArray, safeLength, safeMap } from '../../utils/safeArrayUtils';

const AppHeader = ({ onMenuClick, setShowBugForm, setActivePage }) => {
    const { state, actions } = useApp();
    const router = useRouter();

    // Extract state from context
    const { isAuthenticated, currentUser } = state.auth;
    const { testSuites, activeSuite, hasCreatedSuite } = state.suites;
    const { accountType, userRole } = state.subscription;
    const { notifications } = state.notifications || { notifications: [] };

    // State management for all dropdowns
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSuiteSelector, setShowSuiteSelector] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Modal states
    const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);

    // Refs for dropdown positioning
    const userMenuRef = useRef(null);
    const suiteSelectorRef = useRef(null);
    const notificationsRef = useRef(null);
    const suiteSelectorButtonRef = useRef(null);
    const notificationsButtonRef = useRef(null);

    // Dropdown positions
    const [suiteSelectorPosition, setSuiteSelectorPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const [notificationsPosition, setNotificationsPosition] = useState({ top: 0, left: 0, right: 'auto' });

    // Safe arrays
    const safeSuites = safeArray(testSuites);
    const safeNotifications = safeArray(notifications);

    // Check if user is organization admin
    const isOrganizationAdmin = accountType === 'organization' && userRole === 'admin';

    // Get user display name with fallback logic
    const getUserDisplayName = () => {
        if (currentUser?.displayName) return currentUser.displayName;
        if (currentUser?.email) {
            const emailName = currentUser.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return 'User';
    };

    // Get user initials for avatar fallback
    const getUserInitials = () => {
        const displayName = getUserDisplayName();
        return displayName
            .split(' ')
            .map(name => name.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Toggle dropdown helper
    const toggleDropdown = (type) => {
        switch (type) {
            case 'suite':
                setShowSuiteSelector(!showSuiteSelector);
                setShowUserMenu(false);
                setShowNotifications(false);
                break;
            case 'notifications':
                setShowNotifications(!showNotifications);
                setShowSuiteSelector(false);
                setShowUserMenu(false);
                break;
            default:
                break;
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (
                suiteSelectorRef.current &&
                !suiteSelectorRef.current.contains(event.target) &&
                suiteSelectorButtonRef.current &&
                !suiteSelectorButtonRef.current.contains(event.target)
            ) {
                setShowSuiteSelector(false);
            }
            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target) &&
                notificationsButtonRef.current &&
                !notificationsButtonRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown positions
    useEffect(() => {
        if (showSuiteSelector && suiteSelectorButtonRef.current) {
            const rect = suiteSelectorButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 300;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setSuiteSelectorPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    }, [showSuiteSelector]);

    useEffect(() => {
        if (showNotifications && notificationsButtonRef.current) {
            const rect = notificationsButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 320;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setNotificationsPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    }, [showNotifications]);

    const handleSignOut = async () => {
        try {
            // First attempt context-based sign-out
            if (actions.auth && typeof actions.auth.signOut === 'function') {
                await actions.auth.signOut();
            }
            // Fallback to direct Firebase sign-out
            await signOut(auth);
            // Clear any local state
            actions.clearState();
            // Show success notification
            actions.ui.showNotification('success', 'Successfully signed out', 2000);
            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            actions.ui.showError('Failed to sign out. Please try again.');
        } finally {
            setShowUserMenu(false);
        }
    };

    // Suite handlers
    const handleSelectSuite = (suite) => {
        actions.suites.activateSuite(suite);
        setShowSuiteSelector(false);
        actions.ui.showNotification('info', `Switched to suite: ${suite.name}`, 2000);
    };

    const handleCreateSuite = () => {
        setShowSuiteSelector(false);
        setShowCreateSuiteModal(true);
    };

    const handleSuiteCreated = (suite) => {
        actions.suites.activateSuite(suite);
        setShowCreateSuiteModal(false);
        actions.ui.showNotification('success', `Suite "${suite.name}" created successfully!`, 3000);
        if (!hasCreatedSuite) {
            router.push('/dashboard');
        }
    };

    // Sprint creation handler
    const handleCreateSprint = () => {
        if (setActivePage) {
            setActivePage('sprints');
        }
        actions.ui.showNotification('info', 'Opening sprint creation...', 2000);
    };

    // Get unread notifications count
    const unreadNotificationsCount = safeNotifications.filter((n) => !n.read).length;

    // Handle notification actions
    const handleMarkAsRead = (notificationId) => {
        actions.ui.markNotificationAsRead(notificationId);
    };

    const handleMarkAllAsRead = () => {
        actions.ui.markAllNotificationsAsRead();
    };

    const handleClearNotification = (notificationId) => {
        actions.ui.clearNotification(notificationId);
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 relative z-50 overflow-visible">
                {/* Top Layer */}
                <div className="px-4 sm:px-6 lg:px-8 border-b border-gray-100">
                    <div className="flex justify-between items-center h-14">
                        {/* Left Section */}
                        <div className="flex items-center flex-1">
                            {/* Mobile menu button */}
                            <button
                                onClick={onMenuClick}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            {/* Suite Selector */}
                            {isAuthenticated && (
                                <div className="relative ml-2 lg:ml-4">
                                    <button
                                        ref={suiteSelectorButtonRef}
                                        onClick={() => toggleDropdown('suite')}
                                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        <Building2 className="h-4 w-4 text-teal-600" />
                                        <span className="max-w-24 sm:max-w-32 lg:max-w-48 truncate">
                                            {activeSuite ? activeSuite.name : 'Select Suite'}
                                        </span>
                                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                    </button>
                                </div>
                            )}

                            {/* Create Sprint - Top Layer */}
                            <button
                                onClick={handleCreateSprint}
                                className="hidden sm:flex items-center space-x-2 ml-4 text-gray-700 px-3 py-2 text-sm rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                title="Create Sprint"
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="hidden lg:inline">Create Sprint</span>
                            </button>
                        </div>

                        {/* Right Section - Top Layer */}
                        <div className="flex items-center space-x-2">
                            {/* Add Team Member Button - Only for Organization Admins */}
                            {isOrganizationAdmin && (
                                <TeamInviteButton currentUser={currentUser} actions={actions} />
                            )}

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    ref={notificationsButtonRef}
                                    onClick={() => toggleDropdown('notifications')}
                                    className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                                >
                                    <Bell className="h-5 w-5" />
                                    {unreadNotificationsCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* User Menu */}
                            {isAuthenticated && (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => {
                                            setShowUserMenu(!showUserMenu);
                                            setShowSuiteSelector(false);
                                            setShowNotifications(false);
                                        }}
                                        className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                                    >
                                        {currentUser?.photoURL ? (
                                            <img
                                                className="h-8 w-8 rounded-full object-cover"
                                                src={currentUser.photoURL}
                                                alt={getUserDisplayName()}
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                                {getUserInitials()}
                                            </div>
                                        )}
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                            <div className="p-2">
                                                <div className="px-3 py-2 text-sm border-b border-gray-200 mb-2">
                                                    <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                                                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                                                    {accountType === 'organization' && (
                                                        <div className="flex items-center mt-1">
                                                            <BuildingOffice2Icon className="h-3 w-3 text-gray-400 mr-1" />
                                                            <span className="text-xs text-gray-400">
                                                                Organization {userRole && `(${userRole})`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        setActivePage?.('settings');
                                                    }}
                                                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                                >
                                                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                                    Profile
                                                </button>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                                >
                                                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Layer */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-12">
                        {/* Left Section - Search */}
                        <div className="flex items-center flex-1">
                            <div className="relative flex-1 max-w-md">
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

                        {/* Right Section - Action Buttons */}
                        <div className="flex items-center">
                            {/* Mobile Action Menu */}
                            <div className="sm:hidden">
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
                                    <Bars3Icon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Desktop Action Buttons */}
                            <div className="hidden sm:flex items-center space-x-1 lg:space-x-2">
                                {/* Run Tests */}
                                <button className="text-gray-700 px-2 lg:px-3 py-2 text-sm rounded-md flex items-center space-x-1 lg:space-x-2 hover:bg-green-100 hover:text-green-700 transition-colors">
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden lg:inline">Run Tests</span>
                                </button>

                                {/* Report Bug */}
                                <BugReportButton className="text-gray-700 hover:bg-orange-100 hover:text-orange-700 cursor-pointer px-2 lg:px-3 py-2 rounded-md transition-colors" />

                                {/* Screen Recorder */}
                                <ScreenRecorderButton setShowBugForm={setShowBugForm} actions={actions} />

                                {/* Generate Report Dropdown */}
                                <ReportDropdown />

                                {/* Add Test Case Dropdown */}
                                <TestCaseDropdown />

                                {/* Create Sprint - Mobile */}
                                <button
                                    onClick={handleCreateSprint}
                                    className="sm:hidden flex items-center space-x-1 text-gray-700 px-2 py-2 text-sm rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                    title="Create Sprint"
                                >
                                    <Calendar className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suite Selector Dropdown */}
                {showSuiteSelector && (
                    <div
                        ref={suiteSelectorRef}
                        className="fixed bg-white border border-gray-200 shadow-lg rounded-lg z-50"
                        style={{
                            top: `${suiteSelectorPosition.top}px`,
                            left: suiteSelectorPosition.left !== 'auto' ? `${suiteSelectorPosition.left}px` : 'auto',
                            right: suiteSelectorPosition.right !== 'auto' ? `${suiteSelectorPosition.right}px` : 'auto',
                            minWidth: '300px',
                            maxWidth: '400px',
                        }}
                    >
                        <div className="p-2">
                            {/* Create New Suite Button */}
                            <button
                                onClick={handleCreateSuite}
                                className="w-full flex items-center px-3 py-2 text-sm text-teal-700 hover:bg-teal-50 rounded-md border-b border-gray-100 mb-2"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create New Suite
                            </button>

                            {/* Suite List */}
                            <div className="max-h-64 overflow-y-auto">
                                {safeLength(safeSuites) === 0 ? (
                                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                        <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p>No test suites yet</p>
                                        <p className="text-xs">Create your first suite to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {safeMap(safeSuites, (suite) => (
                                            <button
                                                key={suite.id}
                                                onClick={() => handleSelectSuite(suite)}
                                                className={`w-full flex items-center px-3 py-2 text-sm rounded-md text-left transition-colors ${
                                                    activeSuite?.id === suite.id
                                                        ? 'bg-teal-50 text-teal-700 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                                        activeSuite?.id === suite.id ? 'bg-teal-500' : 'bg-gray-300'
                                                    }`}
                                                ></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate" title={suite.name}>
                                                        {suite.name}
                                                    </p>
                                                    {suite.description && (
                                                        <p className="text-xs text-gray-500 truncate" title={suite.description}>
                                                            {suite.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Dropdown */}
                {showNotifications && (
                    <div
                        ref={notificationsRef}
                        className="fixed bg-white border border-gray-200 shadow-lg rounded-lg z-50"
                        style={{
                            top: `${notificationsPosition.top}px`,
                            left: notificationsPosition.left !== 'auto' ? `${notificationsPosition.left}px` : 'auto',
                            right: notificationsPosition.right !== 'auto' ? `${notificationsPosition.right}px` : 'auto',
                            minWidth: '320px',
                            maxWidth: '400px',
                        }}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                                {safeLength(safeNotifications) > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-teal-600 hover:text-teal-700"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {safeLength(safeNotifications) === 0 ? (
                                    <div className="text-center py-6 text-gray-500">
                                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {safeMap(safeNotifications, (notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-3 rounded-lg border transition-colors ${
                                                    notification.read
                                                        ? 'bg-gray-50 border-gray-200'
                                                        : 'bg-blue-50 border-blue-200'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p
                                                            className={`text-sm ${
                                                                notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                                                            }`}
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        {notification.timestamp && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(notification.timestamp).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 ml-2">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-xs text-blue-600 hover:text-blue-700"
                                                            >
                                                                Read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleClearNotification(notification.id)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Create Suite Modal */}
            <CreateSuiteModal
                isOpen={showCreateSuiteModal}
                onSuiteCreated={handleSuiteCreated}
                onCancel={() => setShowCreateSuiteModal(false)}
            />
        </>
    );
};

export default AppHeader;