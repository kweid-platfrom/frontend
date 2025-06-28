/* eslint-disable react-hooks/exhaustive-deps */
// components/layout/Sidebar.js
'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import '../../app/globals.css';
import { useSuite } from '../../context/SuiteContext';
import CreateTestSuiteModal from '../modals/CreateTestSuiteModal';
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

const Sidebar = ({ isOpen, onClose, setActivePage, activePage }) => {
    const {
        userProfile,
        hasFeatureAccess,
        updateUserProfile,
        subscriptionStatus
    } = useSuite();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [actualSubscriptionState, setActualSubscriptionState] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Refs to prevent infinite loops
    const lastUpdateRef = useRef(null);
    const isUpdatingProfile = useRef(false);

    // Helper function to safely parse date
    const parseDate = useCallback((dateValue) => {
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
    }, []);

    // Memoized subscription state calculation
    const calculateActualSubscriptionState = useCallback(() => {
        if (!userProfile) return null;

        const now = new Date();
        const registrationDate = parseDate(userProfile.createdAt) || now;
        const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
        const trialDaysRemaining = Math.max(0, 30 - daysSinceRegistration);

        return {
            isTrialActive: trialDaysRemaining > 0 && (!userProfile.subscriptionType || userProfile.subscriptionType === 'free'),
            trialDaysRemaining,
            trialExpired: trialDaysRemaining === 0 && (!userProfile.subscriptionType || userProfile.subscriptionType === 'free'),
            subscriptionType: userProfile.subscriptionType || 'free',
            isPaid: userProfile.subscriptionType && userProfile.subscriptionType !== 'free',
            registrationDate: registrationDate.toISOString(),
            daysSinceRegistration,
        };
    }, [userProfile?.createdAt, userProfile?.subscriptionType, parseDate]);

    // Handle mounting and localStorage - separate from profile updates
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
    }, []); // Empty dependency array - only run once

    // Calculate subscription state - separated from profile updates
    useEffect(() => {
        if (!userProfile || !mounted) return;

        try {
            const newState = calculateActualSubscriptionState();
            if (newState) {
                setActualSubscriptionState(newState);
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
            });
        }
    }, [userProfile?.createdAt, userProfile?.subscriptionType, mounted, calculateActualSubscriptionState]);

    // Separate effect for profile updates - with debouncing
    useEffect(() => {
        if (!actualSubscriptionState || !userProfile || !mounted || isUpdatingProfile.current) {
            return;
        }

        // Create a unique key for this state to prevent duplicate updates
        const stateKey = `${actualSubscriptionState.isTrialActive}-${actualSubscriptionState.trialDaysRemaining}-${actualSubscriptionState.trialExpired}`;
        
        // Check if we need to update and haven't just updated
        const needsUpdate = (
            userProfile.isTrialActive !== actualSubscriptionState.isTrialActive ||
            Math.abs((userProfile.trialDaysRemaining || 0) - actualSubscriptionState.trialDaysRemaining) > 1 ||
            userProfile.trialExpired !== actualSubscriptionState.trialExpired
        );

        if (needsUpdate && lastUpdateRef.current !== stateKey) {
            lastUpdateRef.current = stateKey;
            isUpdatingProfile.current = true;

            // Use a timeout to debounce updates
            const timeoutId = setTimeout(() => {
                updateUserProfile(prevProfile => ({
                    ...prevProfile,
                    isTrialActive: actualSubscriptionState.isTrialActive,
                    trialDaysRemaining: actualSubscriptionState.trialDaysRemaining,
                    trialExpired: actualSubscriptionState.trialExpired
                }));
                
                // Reset the updating flag after a delay
                setTimeout(() => {
                    isUpdatingProfile.current = false;
                }, 100);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [actualSubscriptionState, userProfile?.isTrialActive, userProfile?.trialDaysRemaining, userProfile?.trialExpired, mounted, updateUserProfile]);

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

    // Memoize user permissions to prevent recalculation
    const userPermissions = useRef(null);
    useEffect(() => {
        userPermissions.current = getUserPermissions(userProfile);
    }, [userProfile]);

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

    // Memoized premium access check
    const hasPremiumAccess = useCallback(() => {
        if (!actualSubscriptionState) return false;
        return actualSubscriptionState.isTrialActive || actualSubscriptionState.isPaid;
    }, [actualSubscriptionState]);

    // Memoized feature accessibility check
    const isFeatureAccessible = useCallback((item) => {
        // First check if user has the required permission
        if (item.permission && userPermissions.current && !userPermissions.current[item.permission]) {
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
    }, [hasPremiumAccess, hasFeatureAccess]);

    const handlePageChange = useCallback((item) => {
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
    }, [isFeatureAccessible, setActivePage, onClose]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleUpgradeClick = useCallback(() => {
        if (setActivePage) {
            setActivePage('upgrade');
        }
        if (onClose) {
            onClose();
        }
    }, [setActivePage, onClose]);

    const handleCreateSuiteSuccess = useCallback(() => {
        setShowCreateModal(false);
    }, []);

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

                {/* Trial Banner */}
                <TrialBanner
                    isCollapsed={isCollapsed}
                    trialStatus={actualSubscriptionState || userProfile}
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Suite Selector */}
                <SuiteSelector
                    isCollapsed={isCollapsed}
                    setShowCreateModal={setShowCreateModal}
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

            {/* Create Test Suite Modal */}
            <CreateTestSuiteModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuiteSuccess}
                isFirstSuite={false}
            />
        </>
    );
};

export default Sidebar;