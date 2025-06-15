/* eslint-disable react-hooks/exhaustive-deps */
// components/layout/Sidebar.js
'use client'
import { useState, useEffect } from 'react';
import '../../app/globals.css';
import { useProject } from '../../context/ProjectContext';
import { accountService } from '../../services/accountService';
import ProjectCreationForm from '../onboarding/ProjectCreationForm';
import UserAvatarClip from '../side-pane/UserAvatarClip'
import TrialBanner from '../side-pane/TrialBanner';
import ProjectSelector from '../side-pane/ProjectSelector';
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

// Modal wrapper for ProjectCreationForm
const CreateProjectModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform transition-all max-w-md w-full">
                    <ProjectCreationForm
                        isOnboarding={false}
                        onComplete={(projectId) => {
                            console.log('Project created:', projectId);
                            onClose();
                        }}
                        onCancel={onClose}
                        className="shadow-2xl"
                    />
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose, setActivePage, activePage }) => {
    const {
        userProfile,
        hasFeatureAccess,
        updateUserProfile,
        subscriptionStatus
    } = useProject();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

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

    // Check and update trial status when component mounts or userProfile changes
    useEffect(() => {
        let hasChecked = false;

        const checkTrialStatus = async () => {
            if (!userProfile || !mounted || hasChecked) return;

            hasChecked = true;

            try {
                const updatedStatus = await accountService.checkAndUpdateTrialStatus(userProfile, true);

                const isChanged =
                    updatedStatus?.isTrialActive !== userProfile?.isTrialActive ||
                    updatedStatus?.trialDaysRemaining !== userProfile?.trialDaysRemaining;

                if (isChanged && updateUserProfile) {
                    await updateUserProfile(updatedStatus);
                }

                console.log('Trial status checked:', {
                    isTrialActive: updatedStatus?.isTrialActive,
                    trialDaysRemaining: updatedStatus?.trialDaysRemaining,
                    trialExpired: updatedStatus?.trialExpired
                });
            } catch (error) {
                console.error('Error checking trial status:', error);
            }
        };

        checkTrialStatus();
    }, [userProfile?.uid, mounted, updateUserProfile]);

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

    const navigation = [
        { name: 'Dashboard', icon: HomeIcon, page: 'dashboard' },
        { name: 'Bug Tracker', icon: BugAntIcon, page: 'bug-tracker' },
        { name: 'Test Scripts', icon: DocumentTextIcon, page: 'test-scripts' },
        { name: 'Automated Scripts', icon: BeakerIcon, page: 'auto-scripts', requiresFeature: 'automation' },
        { name: 'Reports', icon: ChartBarIcon, page: 'reports', requiresFeature: 'advancedReports' },
        { name: 'Recordings', icon: VideoCameraIcon, page: 'recordings' },
        { name: 'Settings', icon: CogIcon, page: 'settings' },
    ];

    // Simplified premium access check - use userProfile directly
    const hasPremiumAccess = () => {
        if (!userProfile) return false;

        return userProfile.isTrialActive ||
            (userProfile.subscriptionType && userProfile.subscriptionType !== 'free');
    };

    // Check if feature is accessible
    const isFeatureAccessible = (featureName) => {
        if (!featureName) return true;

        // During trial or paid subscription, all features are accessible
        if (hasPremiumAccess()) {
            return true;
        }

        // For free tier users, check specific feature access
        return hasFeatureAccess(featureName);
    };

    const handlePageChange = (item) => {
        // Check if feature is accessible before allowing navigation
        if (item.requiresFeature && !isFeatureAccessible(item.requiresFeature)) {
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

                {/* Trial Banner - pass userProfile as trialStatus */}
                <TrialBanner
                    isCollapsed={isCollapsed}
                    trialStatus={userProfile} // Pass userProfile directly
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Project Selector */}
                <ProjectSelector
                    isCollapsed={isCollapsed}
                    setShowCreateModal={setShowCreateModal}
                    trialStatus={subscriptionStatus} // ✅ FIXED
                    onUpgradeClick={handleUpgradeClick}
                />

                {/* Navigation */}
                <nav className={`flex-1 py-4 space-y-1 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {navigation.map((item) => {
                        const isActive = activePage === item.page;
                        const isAccessible = isFeatureAccessible(item.requiresFeature);
                        const showLock = item.requiresFeature && !isAccessible;

                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => handlePageChange(item)}
                                    className={`group/btn flex items-center w-full px-3 py-2.5 text-sm rounded transition-all duration-200 hover:scale-[1.02] ${isActive
                                        ? 'border-r-4 border-r-teal-500 text-teal-700 shadow-md shadow-teal-500/20'
                                        : showLock
                                            ? 'text-gray-400 hover:bg-gray-50 hover:text-gray-500 cursor-pointer'
                                            : 'text-gray-500 font-light hover:bg-gray-50 hover:text-gray-800'
                                        } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                                >
                                    <div className="flex items-center min-w-0">
                                        <item.icon
                                            className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${isActive
                                                ? 'text-teal-700'
                                                : showLock
                                                    ? 'text-gray-400'
                                                    : 'text-teal-700 group-hover/btn:text-gray-600'
                                                }`}
                                        />
                                        <span className={`ml-3 transition-all duration-300 ease-out font-semibold ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    {showLock && (
                                        <LockClosedIcon className={`h-4 w-4 flex-shrink-0 text-gray-400 ml-auto transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100 w-4'}`} />
                                    )}
                                </button>

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                                        {item.name}
                                        {showLock && (
                                            <span className="block text-xs opacity-75 mt-1">
                                                Upgrade Required
                                            </span>
                                        )}
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
                        trialStatus={userProfile} // Pass userProfile directly
                    />
                )}
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </>
    );
};

export default Sidebar;