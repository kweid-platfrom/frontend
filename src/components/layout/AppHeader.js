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
    ChevronDownIcon,
    
    
} from '@heroicons/react/24/outline';
import { X, Bell, Building2, Calendar, } from 'lucide-react';

// Import components
import BugReportButton from '../modals/BugReportButton';
import TeamInviteButton from '../buttons/TeamInviteButton';
import ScreenRecorderButton from '../buttons/ScreenRecorderButton';
import ReportDropdown from '../ReportDropdown';
import TestCaseDropdown from '../TestCaseDropdown';
import CreateSuiteModal from '../modals/createSuiteModal';
import UserMenuDropdown from '../UserMenuDropdown';
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
            if (actions.auth && typeof actions.auth.signOut === 'function') {
                await actions.auth.signOut();
            }
            await signOut(auth);
            actions.clearState();
            actions.ui.showNotification('success', 'Successfully signed out', 2000);
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
                            <button
                                onClick={onMenuClick}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

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
                            {isOrganizationAdmin && (
                                <TeamInviteButton currentUser={currentUser} actions={actions} />
                            )}

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
                                                alt={currentUser.displayName || 'User'}
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                                                {(currentUser?.displayName || currentUser?.email || 'U')
                                                    .split(' ')
                                                    .map(name => name.charAt(0))
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                    {showUserMenu && (
                                        <UserMenuDropdown
                                            currentUser={currentUser}
                                            accountType={accountType}
                                            userRole={userRole}
                                            setActivePage={setActivePage}
                                            handleSignOut={handleSignOut}
                                            setShowUserMenu={setShowUserMenu}
                                            actions={actions}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Layer */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-12">
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

                        <div className="flex items-center">
                            <div className="sm:hidden">
                                <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
                                    <Bars3Icon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center space-x-1 lg:space-x-2">
                                <button className="text-gray-700 px-2 lg:px-3 py-2 text-sm rounded-md flex items-center space-x-1 lg:space-x-2 hover:bg-green-100 hover:text-green-700 transition-colors">
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden lg:inline">Run Tests</span>
                                </button>

                                <BugReportButton className="text-gray-700 hover:bg-orange-100 hover:text-orange-700 cursor-pointer px-2 lg:px-3 py-2 rounded-md transition-colors" />

                                <ScreenRecorderButton setShowBugForm={setShowBugForm} actions={actions} />

                                <ReportDropdown />

                                <TestCaseDropdown />

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
                            <button
                                onClick={handleCreateSuite}
                                className="w-full flex items-center px-3 py-2 text-sm text-teal-700 hover:bg-teal-50 rounded-md border-b border-gray-100 mb-2"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create New Suite
                            </button>

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

            <CreateSuiteModal
                isOpen={showCreateSuiteModal}
                onSuiteCreated={handleSuiteCreated}
                onCancel={() => setShowCreateSuiteModal(false)}
            />
        </>
    );
};

export default AppHeader;