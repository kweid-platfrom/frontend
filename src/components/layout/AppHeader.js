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
import { X, Bell, Building2, Calendar } from 'lucide-react';

// Import components
import BugReportButton from '../modals/BugReportButton';
import TeamInviteButton from '../buttons/TeamInviteButton';
import ScreenRecorderButton from '../buttons/ScreenRecorderButton';
import ReportDropdown from '../ReportDropdown';
import TestCaseDropdown from '../TestCaseDropdown';
import CreateSuiteModal from '../modals/createSuiteModal';
import UserMenuDropdown from '../UserMenuDropdown';
import { safeArray, safeLength, safeMap } from '../../utils/safeArrayUtils';

const AppHeader = ({ onMenuClick, setShowBugForm, setActivePage, disabled = false }) => {
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

    // Toggle dropdown helper - disabled when header is disabled
    const toggleDropdown = (type) => {
        if (disabled) return;
        
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
        if (disabled) return;
        
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
    }, [disabled]);

    // Calculate dropdown positions
    useEffect(() => {
        if (disabled) return;
        
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
    }, [showSuiteSelector, disabled]);

    useEffect(() => {
        if (disabled) return;
        
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
    }, [showNotifications, disabled]);

    const handleSignOut = async () => {
        if (disabled) return;
        
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
        if (disabled) return;
        
        actions.suites.activateSuite(suite);
        setShowSuiteSelector(false);
        actions.ui.showNotification('info', `Switched to suite: ${suite.name}`, 2000);
    };

    const handleCreateSuite = () => {
        if (disabled) return;
        
        setShowSuiteSelector(false);
        setShowCreateSuiteModal(true);
    };

    const handleSuiteCreated = (suite) => {
        if (disabled) return;
        
        actions.suites.activateSuite(suite);
        setShowCreateSuiteModal(false);
        actions.ui.showNotification('success', `Suite "${suite.name}" created successfully!`, 3000);
        if (!hasCreatedSuite) {
            router.push('/dashboard');
        }
    };

    // Sprint creation handler
    const handleCreateSprint = () => {
        if (disabled) return;
        
        if (setActivePage) {
            setActivePage('sprints');
        }
        actions.ui.showNotification('info', 'Opening sprint creation...', 2000);
    };

    // Get unread notifications count
    const unreadNotificationsCount = safeNotifications.filter((n) => !n.read).length;

    // Handle notification actions
    const handleMarkAsRead = (notificationId) => {
        if (disabled) return;
        actions.ui.markNotificationAsRead(notificationId);
    };

    const handleMarkAllAsRead = () => {
        if (disabled) return;
        actions.ui.markAllNotificationsAsRead();
    };

    const handleClearNotification = (notificationId) => {
        if (disabled) return;
        actions.ui.clearNotification(notificationId);
    };

    return (
        <>
            <header className={`bg-nav border-b border-border relative z-50 overflow-visible shadow-theme ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Top Layer */}
                <div className="px-4 sm:px-6 lg:px-8 border-b border-border">
                    <div className="flex justify-between items-center h-14">
                        {/* Left Section */}
                        <div className="flex items-center flex-1">
                            <button
                                onClick={disabled ? undefined : onMenuClick}
                                className={`lg:hidden p-2 rounded-md text-muted-foreground transition-colors ${
                                    disabled 
                                        ? 'cursor-not-allowed' 
                                        : 'hover:text-foreground hover:bg-secondary/80'
                                }`}
                                disabled={disabled}
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>

                            {isAuthenticated && (
                                <div className="relative ml-2 lg:ml-4">
                                    <button
                                        ref={suiteSelectorButtonRef}
                                        onClick={() => toggleDropdown('suite')}
                                        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg border border-border transition-colors ${
                                            disabled 
                                                ? 'cursor-not-allowed opacity-50' 
                                                : 'hover:bg-secondary/80'
                                        }`}
                                        disabled={disabled}
                                    >
                                        <Building2 className="h-4 w-4 text-primary" />
                                        <span className="max-w-24 sm:max-w-32 lg:max-w-48 truncate">
                                            {activeSuite ? activeSuite.name : 'Select Suite'}
                                        </span>
                                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleCreateSprint}
                                className={`hidden sm:flex items-center space-x-2 ml-4 px-3 py-2 text-sm rounded-md text-secondary-foreground bg-secondary border border-border transition-colors ${
                                    disabled 
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'hover:bg-secondary/80'
                                }`}
                                title="Create Sprint"
                                disabled={disabled}
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="hidden lg:inline">Create Sprint</span>
                            </button>
                        </div>

                        {/* Right Section - Top Layer */}
                        <div className="flex items-center space-x-2">
                            {isOrganizationAdmin && (
                                <TeamInviteButton 
                                    currentUser={currentUser} 
                                    actions={actions} 
                                    disabled={disabled}
                                />
                            )}

                            <div className="relative">
                                <button
                                    ref={notificationsButtonRef}
                                    onClick={() => toggleDropdown('notifications')}
                                    className={`relative p-2 text-muted-foreground rounded-md transition-colors ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'hover:text-foreground hover:bg-secondary/80'
                                    }`}
                                    disabled={disabled}
                                >
                                    <Bell className="h-5 w-5" />
                                    {unreadNotificationsCount > 0 && (
                                        <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
                                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {isAuthenticated && (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => {
                                            if (disabled) return;
                                            setShowUserMenu(!showUserMenu);
                                            setShowSuiteSelector(false);
                                            setShowNotifications(false);
                                        }}
                                        className={`flex items-center space-x-2 p-2 text-muted-foreground rounded-md transition-colors ${
                                            disabled 
                                                ? 'cursor-not-allowed opacity-50' 
                                                : 'hover:text-foreground hover:bg-secondary/80'
                                        }`}
                                        disabled={disabled}
                                    >
                                        {currentUser?.photoURL ? (
                                            <img
                                                className="h-8 w-8 rounded-full object-cover"
                                                src={currentUser.photoURL}
                                                alt={currentUser.displayName || 'User'}
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                                {(currentUser?.displayName || currentUser?.email || 'U')
                                                    .split(' ')
                                                    .map(name => name.charAt(0))
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </button>
                                    {showUserMenu && !disabled && (
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
                                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 rounded-md border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background ${
                                        disabled ? 'cursor-not-allowed opacity-50' : ''
                                    }`}
                                    placeholder="Search test cases, bugs, reports..."
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="sm:hidden">
                                <button 
                                    className={`p-2 text-muted-foreground rounded-md transition-colors ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'hover:text-foreground hover:bg-secondary/80'
                                    }`}
                                    disabled={disabled}
                                >
                                    <Bars3Icon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center space-x-1 lg:space-x-2">
                                <button 
                                    className={`px-2 lg:px-3 py-2 text-sm rounded-md flex items-center space-x-1 lg:space-x-2 text-secondary-foreground bg-secondary border border-border transition-colors ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'hover:bg-secondary/80'
                                    }`}
                                    disabled={disabled}
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    <span className="hidden lg:inline">Run Tests</span>
                                </button>

                                <BugReportButton 
                                    className={`px-2 lg:px-3 py-2 text-sm rounded-md text-secondary-foreground bg-secondary border border-border transition-colors ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'hover:bg-secondary/80'
                                    }`}
                                    disabled={disabled}
                                />

                                <ScreenRecorderButton 
                                    setShowBugForm={setShowBugForm} 
                                    actions={actions} 
                                    disabled={disabled}
                                />

                                <ReportDropdown disabled={disabled} />

                                <TestCaseDropdown disabled={disabled} />

                                <button
                                    onClick={handleCreateSprint}
                                    className={`sm:hidden flex items-center space-x-1 px-2 py-2 text-sm rounded-md text-secondary-foreground bg-secondary border border-border transition-colors ${
                                        disabled 
                                            ? 'cursor-not-allowed opacity-50' 
                                            : 'hover:bg-secondary/80'
                                    }`}
                                    title="Create Sprint"
                                    disabled={disabled}
                                >
                                    <Calendar className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suite Selector Dropdown */}
                {showSuiteSelector && !disabled && (
                    <div
                        ref={suiteSelectorRef}
                        className="fixed bg-card border border-border shadow-theme-lg rounded-lg z-50"
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
                                className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-teal-50 hover:text-teal-800 rounded-md border-b border-border mb-2"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Create New Suite
                            </button>

                            <div className="max-h-64 overflow-y-auto">
                                {safeLength(safeSuites) === 0 ? (
                                    <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                                        <Building2 className="h-8 w-8 mx-auto mb-2 text-muted" />
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
                                                        ? 'bg-teal-50 text-teal-800 font-medium'
                                                        : 'text-foreground hover:bg-secondary/80'
                                                }`}
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                                        activeSuite?.id === suite.id ? 'bg-primary' : 'bg-muted'
                                                    }`}
                                                ></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate" title={suite.name}>
                                                        {suite.name}
                                                    </p>
                                                    {suite.description && (
                                                        <p className="text-xs text-muted-foreground truncate" title={suite.description}>
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
                {showNotifications && !disabled && (
                    <div
                        ref={notificationsRef}
                        className="fixed bg-card border border-border shadow-theme-lg rounded-lg z-50"
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
                                <h3 className="text-sm font-medium text-foreground">Notifications</h3>
                                {safeLength(safeNotifications) > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-primary hover:text-teal-800"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {safeLength(safeNotifications) === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <Bell className="h-8 w-8 mx-auto mb-2 text-muted" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {safeMap(safeNotifications, (notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-3 rounded-lg border transition-colors ${
                                                    notification.read
                                                        ? 'bg-secondary border-border'
                                                        : 'bg-teal-50 border-teal-300'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p
                                                            className={`text-sm ${
                                                                notification.read ? 'text-foreground' : 'text-teal-800 font-medium'
                                                            }`}
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        {notification.timestamp && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(notification.timestamp).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 ml-2">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-xs text-primary hover:text-teal-800"
                                                            >
                                                                Read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleClearNotification(notification.id)}
                                                            className="text-muted-foreground hover:text-foreground"
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
                isOpen={showCreateSuiteModal && !disabled}
                onSuiteCreated={handleSuiteCreated}
                onCancel={() => setShowCreateSuiteModal(false)}
            />
        </>
    );

}

export default  AppHeader;