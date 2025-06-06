// components/layout/Sidebar.js
'use client'
import { useState } from 'react';
import '../../app/globals.css';
import { useRouter, usePathname } from 'next/navigation';
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
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
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

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Test Cases', href: '/dashboard/test-cases', icon: DocumentTextIcon },
        { name: 'Bug Reports', href: '/dashboard/bugs', icon: BugAntIcon },
        { name: 'Screen Recorder', href: '/dashboard/recorder', icon: VideoCameraIcon },
        { name: 'Automation', href: '/dashboard/automation', icon: BeakerIcon },
        { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
        { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
    ];

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setShowProjectList(false);
        router.push('/dashboard');
    };

    const handleCreateProject = () => {
        router.push('/dashboard/projects/new');
        setShowProjectList(false);
    };

    const handleRefreshProjects = async () => {
        setIsRefreshing(true);
        await refetchProjects();
        setIsRefreshing(false);
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
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[subscriptionType] || colors.free}`}>
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

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:inset-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <BeakerIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <span className="ml-2 text-xl font-semibold text-gray-900">QA Suite</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Project Selector */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <button
                            onClick={() => setShowProjectList(!showProjectList)}
                            className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center">
                                    <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {activeProject?.name || 'Select Project'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getProjectLimitInfo()} projects • {getSubscriptionBadge()}
                                </p>
                            </div>
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Project Dropdown */}
                        {showProjectList && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="p-2">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <span className="text-xs font-medium text-gray-500">Your Projects</span>
                                        <button
                                            onClick={handleRefreshProjects}
                                            className="p-1 hover:bg-gray-100 rounded"
                                            disabled={isRefreshing}
                                        >
                                            <ArrowPathIcon className={`h-3 w-3 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectSwitch(project)}
                                            className={`w-full flex items-center p-2 text-left rounded-md hover:bg-gray-50 ${
                                                activeProject?.id === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                                            }`}
                                        >
                                            <FolderIcon className="h-4 w-4 mr-2" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-sm truncate block">{project.name}</span>
                                                {project.description && (
                                                    <span className="text-xs text-gray-500 truncate block">{project.description}</span>
                                                )}
                                            </div>
                                            {activeProject?.id === project.id && (
                                                <CheckCircleIcon className="h-4 w-4 ml-2 text-blue-600 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                    
                                    {canCreateProject() && (
                                        <button
                                            onClick={handleCreateProject}
                                            className="w-full flex items-center p-2 text-left rounded-md hover:bg-gray-50 text-gray-600 border-t border-gray-100 mt-2 pt-3"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            <span className="text-sm">Create New Project</span>
                                        </button>
                                    )}
                                    
                                    {!canCreateProject() && (
                                        <div className="text-xs text-gray-500 p-2 border-t border-gray-100 mt-2 pt-3">
                                            Project limit reached. Upgrade to create more.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.name}
                                onClick={() => router.push(item.href)}
                                className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 ${
                                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                    }`}
                                />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;