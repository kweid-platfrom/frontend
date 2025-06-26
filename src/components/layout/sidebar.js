/* eslint-disable react-hooks/exhaustive-deps */
// components/layout/Sidebar.js
'use client'
import { useState, useEffect } from 'react';
import '../../app/globals.css';
import { useSuite } from '../../context/SuiteContext';
import SuiteCreationForm from '../onboarding/SuiteCreationForm';
import UserAvatarClip from '../side-pane/UserAvatarClip'
import TrialBanner from '../side-pane/TrialBanner';
import SuiteSelector from '../side-pane/SuiteSelector';
import { getUserPermissions } from '../../services/permissionService';
import {
    HomeIcon,
    DocumentTextIcon,
    BugAntIcon,
    VideoCameraIcon,
    BeakerIcon,
    ChartBarIcon,
    CogIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

// Enhanced Suite Creation Drawer - content-based height instead of full height
const SuiteCreationDrawer = ({ isOpen, onClose }) => {
    const { currentOrganization } = useSuite();

    if (!isOpen) return null;

    return (
        <>

            {/* Drawer with content-based height and proper spacing */}
            <div className="absolute left-72 top-24 max-w-2xl w-auto bg-white shadow-2xl border border-gray-200 rounded-lg z-50 overflow-hidden">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-white">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-900">Create New Suite</h2>
                            {currentOrganization && (
                                <p className="text-sm text-gray-500 truncate">in {currentOrganization.name}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-4"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content (form + optional footer) */}
                    <div className="px-6 py-4">
                        <SuiteCreationForm
                            isOnboarding={false}
                            onComplete={(suiteId) => {
                                console.log('Suite created:', suiteId);
                                onClose();
                            }}
                            onCancel={onClose}
                            organizationId={currentOrganization?.id}
                        />
                    </div>
                </div>
            </div>


        </>
    );
};

const Sidebar = ({ isOpen, onClose, setActivePage, activePage }) => {
    const {
        userProfile,
        hasFeatureAccess,
        updateUserProfile,
        subscriptionStatus
    } = useSuite();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showCreateDrawer, setShowCreateDrawer] = useState(false);
    const [actualSubscriptionState, setActualSubscriptionState] = useState(null);

    // Handle mounting and localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedCollapsed = localStorage.getItem("sidebarCollapsed");
            if (storedCollapsed !== null) {
                setIsCollapsed(JSON.parse(storedCollapsed));
            }

            const storedPage = localStorage.getItem("activePage");
            if (storedPage && setActivePage) {
                setActivePage(storedPage);
            }
        }
        setMounted(true);
    }, []);

    // Helper function to safely parse date
    const parseDate = (dateValue) => {
        if (!dateValue) return null;

        // Handle Firestore Timestamp objects
        if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
        }

        // Handle string dates
        if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? null : parsed;
        }

        // Handle Date objects
        if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? null : dateValue;
        }

        return null;
    };

    // Calculate actual subscription state based on 30-day trial from registration - Fixed display text
    useEffect(() => {
        if (!userProfile || !mounted) return;

        const calculateActualSubscriptionState = () => {
            const now = new Date();
            const registrationDate = parseDate(userProfile.createdAt) || now;
            const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
            const trialDaysRemaining = Math.max(0, 30 - daysSinceRegistration);

            const actualState = {
                isTrialActive: trialDaysRemaining > 0 && (!userProfile.subscriptionType || userProfile.subscriptionType === 'free'),
                trialDaysRemaining,
                trialExpired: trialDaysRemaining === 0 && (!userProfile.subscriptionType || userProfile.subscriptionType === 'free'),
                subscriptionType: userProfile.subscriptionType || 'free',
                isPaid: userProfile.subscriptionType && userProfile.subscriptionType !== 'free',
                registrationDate: registrationDate.toISOString(),
                daysSinceRegistration,
                // // Fixed: Remove days completely from display text
                // displayText: trialDaysRemaining > 0 ? 'Trial' : 'Free',
                // planDisplayName: trialDaysRemaining > 0 ? 'Trial' : 'Free',
                // // Don't include trialDaysRemaining in the display logic
                // showTrialDays: false
            };

            return actualState;
        };

        try {
            const newState = calculateActualSubscriptionState();
            setActualSubscriptionState(newState);

            // Update user profile if trial status has significantly changed
            if (userProfile.isTrialActive !== newState.isTrialActive ||
                Math.abs((userProfile.trialDaysRemaining || 0) - newState.trialDaysRemaining) > 1) {
                updateUserProfile({
                    ...userProfile,
                    isTrialActive: newState.isTrialActive,
                    trialDaysRemaining: newState.trialDaysRemaining,
                    trialExpired: newState.trialExpired
                });
            }
        } catch (error) {
            console.error('Error calculating subscription state:', error);
            // Set a fallback state
            setActualSubscriptionState({
                isTrialActive: false,
                trialDaysRemaining: 0,
                trialExpired: true,
                subscriptionType: userProfile.subscriptionType || 'free',
                isPaid: userProfile.subscriptionType && userProfile.subscriptionType !== 'free',
                registrationDate: new Date().toISOString(),
                daysSinceRegistration: 0,
                displayText: 'Free',
                planDisplayName: 'Free',
                showTrialDays: false
            });
        }
    }, [userProfile?.createdAt, userProfile?.subscriptionType, mounted, updateUserProfile]);

    // Save collapsed state to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        }
    }, [isCollapsed, mounted]);

    // Save active page to localStorage
    useEffect(() => {
        if (mounted && activePage) {
            localStorage.setItem("activePage", activePage);
        }
    }, [activePage, mounted]);

    // Get user permissions using the permission service
    const userPermissions = getUserPermissions(userProfile);

    const navigation = [
        {
            name: 'Dashboard',
            icon: HomeIcon,
            page: 'dashboard',
            permission: 'canViewDashboard'
        },
        {
            name: 'Bug Tracker',
            icon: BugAntIcon,
            page: 'bug-tracker',
            permission: 'canReadBugs'
        },
        {
            name: 'Test Scripts',
            icon: DocumentTextIcon,
            page: 'test-scripts',
            permission: 'canReadSuites'
        },
        {
            name: 'Automated Scripts',
            icon: BeakerIcon,
            page: 'auto-scripts',
            requiresFeature: 'automation',
            permission: 'canReadSuites'
        },
        {
            name: 'Reports',
            icon: ChartBarIcon,
            page: 'reports',
            requiresFeature: 'advancedReports',
            permission: 'canViewReports'
        },
        {
            name: 'Recordings',
            icon: VideoCameraIcon,
            page: 'recordings',
            permission: 'canReadSuites'
        },
        {
            name: 'Settings',
            icon: CogIcon,
            page: 'settings',
            permission: 'canViewSettings'
        },
    ];

    // Enhanced premium access check using actual subscription state
    const hasPremiumAccess = () => {
        if (!actualSubscriptionState) return false;
        return actualSubscriptionState.isTrialActive || actualSubscriptionState.isPaid;
    };

    // Check if feature is accessible - Fixed permission logic
    const isFeatureAccessible = (item) => {
        // First check if user has the required permission
        if (item.permission && !userPermissions[item.permission]) {
            return false;
        }

        // If there's a specific feature requirement, check it
        if (item.requiresFeature) {
            // During trial or paid subscription, all features are accessible
            if (hasPremiumAccess()) {
                return true;
            }
            // For free tier users, check specific feature access
            return hasFeatureAccess(item.requiresFeature);
        }

        // If no specific feature requirement, just check the permission
        return true;
    };

    const handlePageChange = (item) => {
        // Check if feature is accessible before allowing navigation
        if (!isFeatureAccessible(item)) {
            if (setActivePage) {
                setActivePage('upgrade');
            }
        } else {
            if (setActivePage) {
                setActivePage(item.page);
            }
        }

        // Close mobile sidebar on page change
        if (onClose) {
            onClose();
        }
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const handleUpgradeClick = () => {
        if (setActivePage) {
            setActivePage('upgrade');
        }
        if (onClose) {
            onClose();
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600/75 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-out
                lg:translate-x-0 lg:static lg:inset-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
                w-64 flex flex-col
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center h-16 px-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                            <BeakerIcon className="h-8 w-8 text-teal-700" />
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-xl font-bold text-gray-900 whitespace-nowrap bg-gradient-to-r from-accent-600 to-teal-700 bg-clip-text text-transparent">
                                QA Suite
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
                                    <ChevronRightIcon className="h-4 w-4 text-gray-600" /> :
                                    <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                                }
                            </div>
                        </button>

                        {/* Mobile close button */}
                        <button
                            onClick={onClose}
                            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Trial Banner - using actual subscription state with fixed display */}
                <TrialBanner
                    isCollapsed={isCollapsed}
                    trialStatus={actualSubscriptionState || userProfile}
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Suite Selector */}
                <SuiteSelector
                    isCollapsed={isCollapsed}
                    setShowCreateModal={setShowCreateDrawer} 
                    trialStatus={actualSubscriptionState || subscriptionStatus}
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Navigation */}
                <nav className="flex-1 py-4 space-y-2 px-4">
                    {navigation.map((item) => {
                        const isActive = activePage === item.page;
                        const isAccessible = isFeatureAccessible(item);
                        const showLock = !isAccessible;

                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => handlePageChange(item)}
                                    className={`
                                        group/btn flex items-center w-full h-12 text-sm rounded transition-all duration-200 hover:scale-[1.02]
                                        ${isCollapsed ? 'px-2 justify-center' : 'px-3 justify-start'}
                                        ${isActive
                                            ? 'border-r-4 border-r-teal-500 text-teal-700 shadow-md shadow-teal-500/20'
                                            : showLock
                                                ? 'text-gray-400 hover:bg-gray-50 hover:text-gray-500 cursor-pointer'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                        }
                                    `}
                                >
                                    {/* Icon container - fixed width to prevent shifting */}
                                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                                        <item.icon
                                            className={`h-5 w-5 transition-all duration-200 ${isActive
                                                ? 'text-teal-700'
                                                : showLock
                                                    ? 'text-gray-400'
                                                    : 'text-teal-700 group-hover/btn:text-gray-600'
                                                }`}
                                        />
                                    </div>

                                    {/* Text container with consistent spacing */}
                                    <div className={`
                                        flex items-center justify-between min-w-0 flex-1
                                        ${isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'}
                                        transition-all duration-300 ease-out
                                    `}>
                                        <span className={`whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'}`}>
                                            {item.name}
                                        </span>
                                        {showLock && (
                                            <LockClosedIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-0 ml-6 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-[60] pointer-events-none transition-all duration-200">
                                        <div className="relative">
                                            {item.name}
                                            {showLock && (
                                                <span className="block text-xs opacity-75 mt-1">
                                                    Upgrade Required
                                                </span>
                                            )}
                                            {/* Tooltip arrow */}
                                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile Section */}
                {userProfile && (
                    <UserAvatarClip
                        isCollapsed={isCollapsed}
                        trialStatus={actualSubscriptionState || userProfile}
                    />
                )}
            </div>

            {/* Suite Creation Drawer - Fixed positioning and sizing */}
            {showCreateDrawer && (
                <SuiteCreationDrawer
                    isOpen={showCreateDrawer}
                    onClose={() => setShowCreateDrawer(false)}
                />
            )}
        </>
    );
};

export default Sidebar;