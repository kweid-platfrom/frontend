/* eslint-disable react-hooks/exhaustive-deps */
// components/layout/Sidebar.js
'use client'
import { useState, useEffect } from 'react';
import '../../app/globals.css';
import { useProject } from '../../context/ProjectContext';
import {
    HomeIcon,
    DocumentTextIcon,
    BugAntIcon,
    VideoCameraIcon,
    BeakerIcon,
    ChartBarIcon,
    CogIcon,
    PlusIcon,
    FolderIcon,
    CheckCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    StarIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose, setActivePage, activePage }) => {
    const { 
        projects, 
        activeProject, 
        setActiveProject, 
        canCreateProject,
        userProfile,
        refetchProjects
    } = useProject();
    
    const [showProjectList, setShowProjectList] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Handle mounting and localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get saved collapsed state
            const storedCollapsed = localStorage.getItem("sidebarCollapsed");
            if (storedCollapsed !== null) {
                setIsCollapsed(JSON.parse(storedCollapsed));
            }
            
            // Get saved active page
            const storedPage = localStorage.getItem("activePage");
            if (storedPage && setActivePage) {
                setActivePage(storedPage);
            }
        }
        setMounted(true);
    }, []);

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

    // Close project list when collapsing
    useEffect(() => {
        if (isCollapsed) {
            setShowProjectList(false);
        }
    }, [isCollapsed]);

    const navigation = [
        { name: 'Dashboard', icon: HomeIcon, page: 'dashboard' },
        { name: 'Bug Tracker', icon: BugAntIcon, page: 'bug-tracker' },
        { name: 'Test Scripts', icon: DocumentTextIcon, page: 'test-scripts' },
        { name: 'Automated Scripts', icon: BeakerIcon, page: 'auto-scripts' },
        { name: 'Reports', icon: ChartBarIcon, page: 'reports' },
        { name: 'Recordings', icon: VideoCameraIcon, page: 'recordings' },
        { name: 'Settings', icon: CogIcon, page: 'settings' },
    ];

    // Check if user has premium features (team/enterprise subscriptions)
    const isPremiumUser = () => {
        return userProfile?.subscriptionType === 'team' || userProfile?.subscriptionType === 'enterprise';
    };

    // Check if user can create projects (function or boolean)
    const canUserCreateProject = () => {
        if (typeof canCreateProject === 'function') {
            return canCreateProject();
        }
        return canCreateProject === true;
    };

    const handleProjectSwitch = (project) => {
        if (isPremiumUser()) {
            setActiveProject(project);
            setShowProjectList(false);
            // Optionally switch to dashboard when changing projects
            if (setActivePage) {
                setActivePage('dashboard');
            }
        }
    };

    const handleCreateProject = () => {
        if (canUserCreateProject()) {
            if (setActivePage) {
                setActivePage('create-project');
            }
            setShowProjectList(false);
        }
    };

    const handleUpgrade = () => {
        if (setActivePage) {
            setActivePage('upgrade');
        }
        setShowProjectList(false);
    };

    const handleRefreshProjects = async () => {
        setIsRefreshing(true);
        await refetchProjects();
        setIsRefreshing(false);
    };

    const handlePageChange = (item) => {
        // Smooth page transition - no URL changes, just state updates
        if (setActivePage) {
            setActivePage(item.page);
        }
        
        // Close mobile sidebar on page change
        if (onClose) {
            onClose();
        }
    };

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const getSubscriptionBadge = () => {
        if (!userProfile) return null;
        
        const { subscriptionType } = userProfile;
        const colors = {
            free: 'bg-gray-100 text-gray-800',
            individual: 'bg-blue-100 text-blue-800',
            team: 'bg-green-100 text-green-800',
            enterprise: 'bg-purple-100 text-purple-800'
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${colors[subscriptionType] || colors.free}`}>
                {subscriptionType?.charAt(0).toUpperCase() + subscriptionType?.slice(1) || 'Free'}
            </span>
        );
    };

    const getProjectLimitInfo = () => {
        if (!userProfile) return '';
        
        const { subscriptionType } = userProfile;
        const limits = {
            free: 1,
            individual: 1,
            team: 5,
            enterprise: '∞'
        };
        
        return `${projects.length}/${limits[subscriptionType] || 1}`;
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
                w-64
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center h-16 px-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                            <BeakerIcon className="h-8 w-8 text-[#36590B]" />
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-300 ease-out ${
                            isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                        }`}>
                            <span className="text-xl font-bold text-gray-900 whitespace-nowrap bg-gradient-to-r from-teal-400 to-accent-500 bg-clip-text text-transparent">
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

                {/* Project Selector */}
                <div className={`p-4 border-b border-gray-200/50 transition-all duration-300 ${
                    isCollapsed ? 'lg:px-2' : 'px-4'
                }`}>
                    <div className="relative group">
                        <button
                            onClick={() => !isCollapsed && setShowProjectList(!showProjectList)}
                            disabled={isCollapsed}
                            className={`w-full flex items-center p-3 text-left bg-gray-50/80 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] ${
                                isCollapsed ? 'lg:justify-center lg:px-2 lg:cursor-default' : 'justify-between'
                            }`}
                            title={isCollapsed ? activeProject?.name || 'Select Project' : ''}
                        >
                            <div className="min-w-0 flex-1 flex items-center">
                                <FolderIcon className="h-5 w-5 text-teal-500 flex-shrink-0" />
                                <div className={`ml-3 min-w-0 transition-all duration-300 ease-out ${
                                    isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                                }`}>
                                    <span className="text-sm font-semibold text-gray-900 truncate block">
                                        {activeProject?.name || 'My Project'}
                                    </span>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                        <span>{getProjectLimitInfo()} projects</span>
                                        <span>•</span>
                                        {getSubscriptionBadge()}
                                    </div>
                                </div>
                            </div>
                            <svg className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-all duration-300 ${
                                isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100 w-4'
                            } ${showProjectList ? 'rotate-180' : 'rotate-0'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Project Dropdown with smooth animation */}
                        <div className={`absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-lg z-10 transition-all duration-300 origin-top ${
                            showProjectList && !isCollapsed 
                                ? 'opacity-100 scale-100 translate-y-0' 
                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                        }`}>
                            <div className="p-3">
                                {isPremiumUser() ? (
                                    <>
                                        {/* Premium User - Full Project Management */}
                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <span className="text-xs font-semibold text-gray-600">Your Projects</span>
                                            <button
                                                onClick={handleRefreshProjects}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
                                                disabled={isRefreshing}
                                            >
                                                <ArrowPathIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            {projects.map((project) => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleProjectSwitch(project)}
                                                    className={`w-full flex items-center p-2.5 text-left rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-[1.01] ${
                                                        activeProject?.id === project.id ? 'bg-blue-50 text-teal-700 ring-1 ring-blue-200' : 'text-gray-900'
                                                    }`}
                                                >
                                                    <FolderIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm font-medium truncate block">{project.name}</span>
                                                        {project.description && (
                                                            <span className="text-xs text-gray-500 truncate block mt-0.5">{project.description}</span>
                                                        )}
                                                    </div>
                                                    {activeProject?.id === project.id && (
                                                        <CheckCircleIcon className="h-4 w-4 ml-2 text-teal-700 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {canUserCreateProject() && (
                                            <button
                                                onClick={handleCreateProject}
                                                className="w-full flex items-center p-2.5 text-left rounded-lg hover:bg-gray-50 text-gray-600 border-t border-gray-100 mt-3 pt-3 transition-all duration-200 hover:scale-[1.01]"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                <span className="text-sm font-medium">Create New Project</span>
                                            </button>
                                        )}
                                        
                                        {!canUserCreateProject() && (
                                            <div className="text-xs text-gray-500 p-2.5 border-t border-gray-100 mt-3 pt-3 text-center">
                                                Project limit reached for your plan.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Free/Individual User - Upgrade Prompt */}
                                        <div className="text-center py-4">
                                            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-teal-400 to-accent-500 rounded-full flex items-center justify-center mb-3">
                                                <StarIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Multiple Projects</h3>
                                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                                Upgrade to Team or Enterprise to manage multiple projects and unlock advanced features.
                                            </p>
                                            
                                            {/* Current project display */}
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <div className="flex items-center justify-center">
                                                    <FolderIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm text-gray-600">Current Project</span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 mt-1">
                                                    {activeProject?.name || 'My Project'}
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={handleUpgrade}
                                                className="w-full bg-gradient-to-r from-teal-400 to-accent-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-teal-400 hover:to-accent-500 transition-all duration-200 hover:scale-[1.02] shadow-sm"
                                            >
                                                Upgrade Now
                                            </button>
                                            
                                            <div className="mt-3 text-xs text-gray-400">
                                                <LockClosedIcon className="h-3 w-3 inline mr-1" />
                                                Team: 5 projects • Enterprise: Unlimited
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Collapsed state tooltip */}
                        {isCollapsed && (
                            <div className="hidden lg:group-hover:block absolute left-full top-0 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                                <div className="font-medium">{activeProject?.name || 'My Project'}</div>
                                <div className="text-xs opacity-75 mt-1">
                                    {getProjectLimitInfo()} projects • {userProfile?.subscriptionType || 'Free'}
                                </div>
                                {!isPremiumUser() && (
                                    <div className="text-xs opacity-75 mt-1 text-yellow-300">
                                        <StarIcon className="h-3 w-3 inline mr-1" />
                                        Upgrade for multiple projects
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 py-4 space-y-1 transition-all duration-300 ${
                    isCollapsed ? 'px-2' : 'px-4'
                }`}>
                    {navigation.map((item) => {
                        const isActive = activePage === item.page;
                        return (
                            <div key={item.name} className="relative group">
                                <button
                                    onClick={() => handlePageChange(item)}
                                    className={`group/btn flex items-center w-full px-3 py-2.5 text-sm font-normal rounded transition-all duration-200 hover:scale-[1.02] ${
                                        isActive
                                            ? 'border-r-4 border-r-teal-500 text-teal-700 shadow-md shadow-teal-500/25'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                                >
                                    <item.icon
                                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                                            isActive ? 'text-white' : 'text-gray-400 group-hover/btn:text-gray-600'
                                        }`}
                                    />
                                    <span className={`ml-3 transition-all duration-300 ease-out font-semibold ${
                                        isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                                    }`}>
                                        {item.name}
                                    </span>
                                </button>
                                
                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                                        {item.name}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* User Profile Section */}
                {userProfile && (
                    <div className={`p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white transition-all duration-300 ${
                        isCollapsed ? 'px-2' : 'px-4'
                    }`}>
                        <div className={`flex items-center p-2 rounded-xl hover:bg-gray-50/80 transition-all duration-200 hover:scale-[1.02] cursor-pointer group ${
                            isCollapsed ? 'lg:justify-center' : ''
                        }`}>
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-400 to-accent-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                    <span className="text-sm font-bold text-white">
                                        {userProfile.name?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </div>
                            <div className={`ml-3 min-w-0 transition-all duration-300 ease-out ${
                                isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
                            }`}>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {userProfile.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {userProfile.email}
                                </p>
                            </div>
                        </div>
                        
                        {/* Collapsed state tooltip for user profile */}
                        {isCollapsed && (
                            <div className="hidden group-hover:block absolute left-full bottom-4 ml-3 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none transition-all duration-200">
                                <div className="font-medium">{userProfile.name || 'User'}</div>
                                <div className="text-xs opacity-75">{userProfile.email}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;