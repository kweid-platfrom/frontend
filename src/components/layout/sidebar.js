/* eslint-disable react-hooks/exhaustive-deps */
// components/layout/Sidebar.js - CLEANED: Simplified subscription logic and better permission handling
'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import '../../app/globals.css';
import { useSuite } from '../../context/SuiteContext';
import { useUserProfile } from '../../context/userProfileContext';
import { useSuiteActionGuard } from '../../hooks/useSuiteActionGuard';
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
    const suiteContext = useSuite();
    const { userProfile, updateProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
    const { guardAction } = useSuiteActionGuard();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [subscriptionState, setSubscriptionState] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Prevent update loops
    const updateTimeoutRef = useRef(null);
    const lastUpdateKeyRef = useRef(null);

    // Simplified subscription calculation
    const calculateSubscriptionState = useCallback(() => {
        if (!userProfile) return null;

        const now = new Date();
        let registrationDate = now;

        // Parse registration date
        if (userProfile.createdAt) {
            if (typeof userProfile.createdAt.toDate === 'function') {
                registrationDate = userProfile.createdAt.toDate();
            } else if (userProfile.createdAt instanceof Date) {
                registrationDate = userProfile.createdAt;
            } else if (typeof userProfile.createdAt === 'string') {
                const parsed = new Date(userProfile.createdAt);
                if (!isNaN(parsed.getTime())) {
                    registrationDate = parsed;
                }
            }
        }

        const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
        const trialDaysRemaining = Math.max(0, 30 - daysSinceRegistration);

        // Simplified trial logic
        const hasActivePaidPlan = userProfile.subscriptionStatus === 'active' &&
            userProfile.subscriptionPlan &&
            !userProfile.subscriptionPlan.includes('free');

        const isInTrialPeriod = (userProfile.subscriptionStatus === 'trial' ||
            userProfile.subscriptionPlan?.includes('trial') ||
            daysSinceRegistration <= 30) &&
            trialDaysRemaining > 0;

        const isTrialActive = isInTrialPeriod && !hasActivePaidPlan;

        return {
            isTrialActive,
            trialDaysRemaining,
            trialExpired: trialDaysRemaining === 0 && !hasActivePaidPlan,
            isPaid: hasActivePaidPlan,
            hasPremiumAccess: isTrialActive || hasActivePaidPlan,
            subscriptionType: userProfile.subscriptionPlan || 'individual_free',
            daysSinceRegistration
        };
    }, [userProfile?.createdAt, userProfile?.subscriptionStatus, userProfile?.subscriptionPlan]);

    // Check premium feature access
    const checkPremiumAccess = useCallback((feature) => {
        if (!subscriptionState) return false;

        // Premium features
        const premiumFeatures = ['automation', 'advancedReports', 'apiTesting', 'cicdIntegration'];

        if (premiumFeatures.includes(feature)) {
            return subscriptionState.hasPremiumAccess;
        }

        // Free features available to everyone
        return true;
    }, [subscriptionState]);

    // Check user permissions
    const checkPermission = useCallback((permission) => {
        if (!userProfile) return true; // Default allow if no profile

        const permissions = getUserPermissions(userProfile);
        return permissions[permission] ?? true;
    }, [userProfile]);

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

    // Calculate subscription state
    useEffect(() => {
        if (!userProfile || !mounted) return;

        try {
            const newState = calculateSubscriptionState();
            if (newState) {
                setSubscriptionState(newState);
            }
        } catch (error) {
            console.error('Error calculating subscription state:', error);
            setSubscriptionState({
                isTrialActive: false,
                trialDaysRemaining: 0,
                trialExpired: true,
                isPaid: false,
                hasPremiumAccess: false,
                subscriptionType: 'individual_free'
            });
        }
    }, [userProfile?.createdAt, userProfile?.subscriptionStatus, userProfile?.subscriptionPlan, mounted, calculateSubscriptionState]);

    // Update profile with debounced approach
    useEffect(() => {
        if (!subscriptionState || !userProfile || !mounted || !updateProfile) {
            return;
        }

        const updateKey = `${subscriptionState.isTrialActive}-${subscriptionState.trialDaysRemaining}-${subscriptionState.trialExpired}`;

        // Check if update is needed
        const needsUpdate = (
            userProfile.isTrialActive !== subscriptionState.isTrialActive ||
            Math.abs((userProfile.trialDaysRemaining || 0) - subscriptionState.trialDaysRemaining) > 1 ||
            userProfile.trialExpired !== subscriptionState.trialExpired
        );

        if (needsUpdate && lastUpdateKeyRef.current !== updateKey) {
            lastUpdateKeyRef.current = updateKey;

            // Clear existing timeout
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            // Debounce updates with 500ms delay
            updateTimeoutRef.current = setTimeout(async () => {
                try {
                    await updateProfile({
                        isTrialActive: subscriptionState.isTrialActive,
                        trialDaysRemaining: subscriptionState.trialDaysRemaining,
                        trialExpired: subscriptionState.trialExpired
                    });
                } catch (error) {
                    console.error('Failed to update profile trial status:', error);
                }
            }, 500);
        }

        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [subscriptionState, userProfile?.isTrialActive, userProfile?.trialDaysRemaining, userProfile?.trialExpired, mounted, updateProfile]);

    // Save states to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
        }
    }, [isCollapsed, mounted]);

    useEffect(() => {
        if (mounted && activePage) {
            localStorage.setItem("activePage", activePage);
        }
    }, [activePage, mounted]);

    const navigation = [
        {
            name: 'Dashboard',
            icon: HomeIcon,
            page: 'dashboard',
            permission: 'canViewDashboard',
            requiresSuite: false
        },
        {
            name: 'Bug Tracker',
            icon: BugAntIcon,
            page: 'bug-tracker',
            permission: 'canReadBugs',
            requiresSuite: true,
            action: 'view'
        },
        {
            name: 'Test Scripts',
            icon: DocumentTextIcon,
            page: 'test-scripts',
            permission: 'canReadSuites',
            requiresSuite: true,
            action: 'view'
        },
        {
            name: 'Automated Scripts',
            icon: BeakerIcon,
            page: 'auto-scripts',
            permission: 'canReadSuites',
            requiresFeature: 'automation',
            requiresSuite: true,
            action: 'view'
        },
        {
            name: 'Reports',
            icon: ChartBarIcon,
            page: 'reports',
            permission: 'canViewReports',
            requiresFeature: 'advancedReports',
            requiresSuite: true,
            action: 'view'
        },
        {
            name: 'Recordings',
            icon: VideoCameraIcon,
            page: 'recordings',
            permission: 'canReadSuites',
            requiresSuite: true,
            action: 'view'
        },
        {
            name: 'Settings',
            icon: CogIcon,
            page: 'settings',
            permission: 'canViewSettings',
            requiresSuite: false
        },
    ];

    // Check if navigation item is accessible
    const isNavItemAccessible = useCallback((item) => {
        // Check user permission
        if (item.permission && !checkPermission(item.permission)) {
            return { accessible: false, reason: 'permission' };
        }

        // Check premium feature access
        if (item.requiresFeature && !checkPremiumAccess(item.requiresFeature)) {
            return { accessible: false, reason: 'premium' };
        }

        // Check suite requirement and action permission
        if (item.requiresSuite && item.action) {
            const actionResult = guardAction(item.action, { silent: true, returnValidation: true });
            if (!actionResult.allowed) {
                return { accessible: false, reason: 'suite', details: actionResult };
            }
        }

        return { accessible: true };
    }, [checkPermission, checkPremiumAccess, guardAction]);

    const handlePageChange = useCallback((item) => {
        const accessCheck = isNavItemAccessible(item);

        if (!accessCheck.accessible) {
            console.log(`Access denied for ${item.name}:`, accessCheck.reason);

            // Redirect to appropriate page based on reason
            if (accessCheck.reason === 'premium') {
                setActivePage?.('upgrade');
            } else if (accessCheck.reason === 'suite') {
                // Could redirect to suite selection or show message
                console.warn('Suite required for this action');
            }
        } else {
            setActivePage?.(item.page);
        }

        onClose?.();
    }, [isNavItemAccessible, setActivePage, onClose]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleUpgradeClick = useCallback(() => {
        setActivePage?.('upgrade');
        onClose?.();
    }, [setActivePage, onClose]);

    const handleCreateSuiteSuccess = useCallback(() => {
        setShowCreateModal(false);
    }, []);

    // Loading state
    if (isProfileLoading && !userProfile) {
        return (
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600">Loading profile...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (profileError) {
        return (
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <div className="text-sm text-gray-600">Profile Error</div>
                    <div className="text-xs text-red-500 mt-1">{profileError}</div>
                </div>
            </div>
        );
    }

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
                    trialStatus={subscriptionState || userProfile}
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Suite Selector */}
                <SuiteSelector
                    isCollapsed={isCollapsed}
                    setShowCreateModal={setShowCreateModal}
                    trialStatus={subscriptionState || suiteContext?.subscriptionStatus}
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Navigation */}
                <nav className="flex-1 py-4 space-y-2 px-4">
                    {navigation.map((item) => {
                        const isActive = activePage === item.page;
                        const accessCheck = isNavItemAccessible(item);
                        const isAccessible = accessCheck.accessible;
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
                                                    {accessCheck.reason === 'premium' ? 'Upgrade Required' :
                                                        accessCheck.reason === 'suite' ? 'Suite Required' :
                                                            'Access Denied'}
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
                        trialStatus={subscriptionState || userProfile}
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