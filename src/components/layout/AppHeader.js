/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import '../../app/globals.css';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { X, Bell } from 'lucide-react';

// Import components
import { Button } from '../ui/button';
import CreateSprintModal from '../modals/CreateSprintModal';
import UserMenuDropdown from '../UserMenuDropdown';
import SuiteSelector from './head/SuiteSelector';
import CalendarTime from './head/CalendarTime';
import HeaderSearch from './head/HeaderSearch';
import HeaderButtons from './head//HeaderButtons';
import AddUserButton from './head/AddUserButton';
import { safeArray, safeLength, safeMap } from '../../utils/safeArrayUtils';


const AppHeader = ({ onMenuClick, setShowBugForm, setActivePage, disabled = false }) => {
    const { state, actions } = useApp();
    const router = useRouter();

    // Extract state from context
    const { isAuthenticated, currentUser } = state.auth;
    const { testSuites, activeSuite, hasCreatedSuite } = state.suites;
    const { accountType, userRole } = state.subscription;
    const { notifications } = state.notifications || { notifications: [] };

    // State management for dropdowns
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);

    // Notification dropdown position
    const [notificationsPosition, setNotificationsPosition] = useState({ 
        top: 0, 
        left: 0, 
        right: 'auto' 
    });

    // Refs for dropdown positioning
    const userMenuRef = useRef(null);
    const notificationsRef = useRef(null);
    const notificationsButtonRef = useRef(null);

    // Safe arrays
    const safeNotifications = safeArray(notifications);

    // Toggle notification dropdown
    const toggleNotifications = () => {
        if (disabled) return;
        setShowNotifications(!showNotifications);
        setShowUserMenu(false);
    };

    // Close menus when clicking outside
    useEffect(() => {
        if (disabled) return;
        
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
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

    // Calculate notification dropdown position
    useEffect(() => {
        if (disabled) return;
        
        if (showNotifications && notificationsButtonRef.current) {
            const rect = notificationsButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 320;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setNotificationsPosition({
                top: rect.bottom + window.scrollY + 4,
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

    // Sprint creation handlers
    const handleCreateSprint = () => {
        if (disabled) return;
        
        if (!activeSuite) {
            actions.ui.showError('Please select a test suite first');
            return;
        }
        
        setShowCreateSprintModal(true);
    };

    const handleSprintCreated = (sprint) => {
        if (disabled) return;
        
        // Set the new sprint as active
        actions.sprints?.setActiveSprint?.(sprint);
        setShowCreateSprintModal(false);
        actions.ui.showNotification('success', `Sprint "${sprint.name}" created successfully!`, 3000);
    };

    // Document creation handler
    const handleCreateDocument = () => {
        if (disabled) return;
        router.push('/documents/create');
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
            <header className={`bg-background border-b border-border relative z-50 overflow-visible shadow-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Top Layer - Fixed height and proper flex distribution */}
                <div className="px-4 sm:px-6 lg:px-8 border-b border-border">
                    <div className="flex items-center h-14 min-h-[3.5rem]">
                        {/* Left Section - Fixed width for mobile menu */}
                        <div className="flex items-center flex-1 min-w-0 pr-4">
                            <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={disabled ? undefined : onMenuClick}
                                className="lg:hidden text-foreground hover:bg-accent/50 flex-shrink-0 mr-2"
                                disabled={disabled}
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </Button>

                            {/* Suite Selector - Allow natural width but constrain overflow */}
                            {isAuthenticated && (
                                <div className="min-w-0 flex-shrink-0">
                                    <SuiteSelector
                                        testSuites={testSuites}
                                        activeSuite={activeSuite}
                                        hasCreatedSuite={hasCreatedSuite}
                                        actions={actions}
                                        router={router}
                                        disabled={disabled}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Section - Fixed width components */}
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            {/* Calendar & Time - Responsive component */}
                            <div className="flex-shrink-0">
                                <CalendarTime disabled={disabled} />
                            </div>

                            {/* Add User Button */}
                            <div className="flex-shrink-0">
                                <AddUserButton
                                    accountType={accountType}
                                    userRole={userRole}
                                    currentUser={currentUser}
                                    actions={actions}
                                    disabled={disabled}
                                />
                            </div>

                            {/* Notifications */}
                            <div className="relative flex-shrink-0">
                                <Button
                                    ref={notificationsButtonRef}
                                    variant="ghost"
                                    size="iconSm"
                                    onClick={toggleNotifications}
                                    disabled={disabled}
                                    className="relative text-foreground hover:bg-accent/50"
                                >
                                    <Bell className="h-5 w-5" />
                                    {unreadNotificationsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                                        </span>
                                    )}
                                </Button>
                            </div>

                            {/* User Menu - Fixed size to prevent layout shift */}
                            {isAuthenticated && (
                                <div className="relative flex-shrink-0" ref={userMenuRef}>
                                    <Button
                                        variant="ghost"
                                        size="iconSm"
                                        onClick={() => {
                                            if (disabled) return;
                                            setShowUserMenu(!showUserMenu);
                                            setShowNotifications(false);
                                        }}
                                        disabled={disabled}
                                        className="p-1 hover:bg-accent/50 w-10 h-10 flex items-center justify-center"
                                    >
                                        {currentUser?.photoURL ? (
                                            <img
                                                className="h-8 w-8 rounded-full object-cover"
                                                src={currentUser.photoURL}
                                                alt={currentUser.displayName || 'User'}
                                                loading="lazy"
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
                                    </Button>
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

                {/* Bottom Layer - Fixed height and proper flex distribution */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-12 min-h-[3rem]">
                        {/* Search Section - Takes available space */}
                        <div className="flex items-center flex-1 min-w-0 pr-4">
                            <HeaderSearch disabled={disabled} />
                        </div>

                        {/* Action Buttons - Fixed width */}
                        <div className="flex-shrink-0">
                            <HeaderButtons
                                onCreateSprint={handleCreateSprint}
                                onCreateDocument={handleCreateDocument}
                                setShowBugForm={setShowBugForm}
                                actions={actions}
                                activeSuite={activeSuite}
                                firestoreService={actions?.firestore}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications Dropdown */}
                {showNotifications && !disabled && (
                    <div
                        ref={notificationsRef}
                        className="fixed bg-card border border-border shadow-lg rounded-lg z-50"
                        style={{
                            top: `${notificationsPosition.top}px`,
                            left: notificationsPosition.left !== 'auto' ? `${notificationsPosition.left}px` : 'auto',
                            right: notificationsPosition.right !== 'auto' ? `${notificationsPosition.right}px` : 'auto',
                            minWidth: '320px',
                            maxWidth: window.innerWidth < 640 ? '90vw' : '400px',
                        }}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-foreground">Notifications</h3>
                                {safeLength(safeNotifications) > 0 && (
                                    <Button
                                        variant="link"
                                        size="xs"
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Mark all as read
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {safeLength(safeNotifications) === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <Bell className="h-11 w-11 mx-auto mb-2 text-muted" />
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
                                                        : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`text-sm ${
                                                                notification.read ? 'text-foreground' : 'text-blue-800 font-medium dark:text-blue-200'
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
                                                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                                                        {!notification.read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                                                            >
                                                                Read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleClearNotification(notification.id)}
                                                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
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

            {/* Create Sprint Modal */}
            <CreateSprintModal
                isOpen={showCreateSprintModal && !disabled}
                onSprintCreated={handleSprintCreated}
                onCancel={() => setShowCreateSprintModal(false)}
                suiteId={activeSuite?.id}
            />
        </>
    );

};

export default AppHeader;