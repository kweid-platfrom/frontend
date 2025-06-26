// components/layout/ProjectSelector.js
'use client'
import { useState, useEffect } from 'react';
import { useProject } from '../../context/SuiteContext';
import {
    FolderIcon,
    PlusIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    ClockIcon,
    ArrowUpIcon
} from '@heroicons/react/24/outline';

const ProjectSelector = ({ isCollapsed, setShowCreateModal, trialStatus, onUpgradeClick }) => {
    const {
        projects,
        activeProject,
        setActiveProject,
        canCreateProject,
        refetchProjects,
        subscriptionStatus,
        getFeatureLimits
    } = useProject();

    const [showProjectList, setShowProjectList] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Close project list when collapsing
    useEffect(() => {
        if (isCollapsed) {
            setShowProjectList(false);
        }
    }, [isCollapsed]);

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setShowProjectList(false);
    };

    const handleCreateProject = () => {
        if (canCreateProject) {
            setShowCreateModal(true);
            setShowProjectList(false);
        }
    };

    const handleUpgrade = () => {
        if (onUpgradeClick) {
            onUpgradeClick();
        } else {
            window.dispatchEvent(new CustomEvent('navigateToUpgrade'));
        }
        setShowProjectList(false);
    };

    const handleRefreshProjects = async () => {
        setIsRefreshing(true);
        await refetchProjects();
        setIsRefreshing(false);
    };

    const getSubscriptionBadge = () => {
        // Use trialStatus prop if available, otherwise fall back to subscriptionStatus
        const currentStatus = trialStatus || subscriptionStatus;
        
        if (!currentStatus) return null;

        const { subscriptionType, isTrialActive, trialDaysRemaining } = currentStatus;

        if (isTrialActive) {
            const isUrgent = trialDaysRemaining <= 3;
            return (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isUrgent
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Trial
                </span>
            );
        }

        if (subscriptionType && subscriptionType !== 'free') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Free
            </span>
        );
    };

    const getProjectLimitInfo = () => {
        const limits = getFeatureLimits();
        if (!limits) return '0/1';

        const maxProjects = limits.projects === -1 ? '∞' : limits.projects;
        return `${projects.length}/${maxProjects}`;
    };

    // Use trialStatus prop if available, otherwise fall back to subscriptionStatus
    const currentStatus = trialStatus || subscriptionStatus;

    return (
        <div className={`p-4 border-b border-gray-200/50 transition-all duration-300 ${isCollapsed ? 'lg:px-2' : 'px-4'}`}>
            <div className="relative group">
                <button
                    onClick={() => !isCollapsed && setShowProjectList(!showProjectList)}
                    disabled={isCollapsed}
                    className={`w-full flex items-center p-3 text-left bg-gray-50/80 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] ${isCollapsed ? 'lg:justify-center lg:px-2 lg:cursor-default' : 'justify-between'}`}
                    title={isCollapsed ? activeProject?.name || 'Select Project' : ''}
                >
                    <div className="min-w-0 flex-1 flex items-center">
                        <FolderIcon className="h-5 w-5 text-teal-500 flex-shrink-0" />
                        <div className={`ml-3 min-w-0 transition-all duration-300 ease-out ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
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
                    <svg className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100 w-4'} ${showProjectList ? 'rotate-180' : 'rotate-0'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Trial Countdown - Only show when trial is active and sidebar is not collapsed */}
                {currentStatus?.isTrialActive && !isCollapsed && (
                    <div className="mt-2 px-3 py-2 backdrop-blur-sm rounded border border-[#FFF675]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <ClockIcon className={`h-3 w-3 mr-1.5 ${
                                    currentStatus.trialDaysRemaining <= 3 ? 'text-red-500' : 'text-teal-500'
                                }`} />
                                <span className={`text-xs font-medium ${
                                    currentStatus.trialDaysRemaining <= 3 ? 'text-red-700' : 'text-teal-700'
                                }`}>
                                    Trial: {currentStatus.trialDaysRemaining || 0} days left
                                </span>
                            </div>
                            {currentStatus.trialDaysRemaining <= 7 && (
                                <button
                                    onClick={handleUpgrade}
                                    className={`text-xs font-medium px-2 py-1 rounded transition-all duration-200 hover:scale-105 ${
                                        currentStatus.trialDaysRemaining <= 3 
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                            : 'bg-blue-100 text-teal-700 hover:bg-blue-200'
                                    }`}
                                >
                                    Upgrade
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Project Dropdown */}
                <div className={`absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-lg z-10 transition-all duration-300 origin-top ${showProjectList && !isCollapsed
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-3 px-2">
                            <span className="text-xs font-semibold text-gray-600">Your Suites</span>
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

                        {/* Create Project Button */}
                        {canCreateProject ? (
                            <button
                                onClick={handleCreateProject}
                                className="w-full flex items-center p-2.5 text-left rounded-lg hover:bg-gray-50 text-gray-600 border-t border-gray-100 mt-3 pt-3 transition-all duration-200 hover:scale-[1.01]"
                            >
                                <PlusIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                <span className="text-sm font-medium">New Suite</span>
                            </button>
                        ) : (
                            <div className="text-xs text-gray-500 p-2.5 border-t border-gray-100 mt-3 pt-3 text-center">
                                Suites limit reached for your plan.
                            </div>
                        )}

                        {/* Upgrade Button - Only show if trial is ending soon or expired */}
                        {currentStatus?.isTrialActive && currentStatus?.trialDaysRemaining <= 7 && (
                            <div className="border-t border-gray-100 mt-3 pt-3">
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full flex items-center justify-center p-2.5 text-center rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 text-amber-700 transition-all duration-200 hover:scale-[1.01] group"
                                >
                                    <ArrowUpIcon className="h-4 w-4 mr-2 flex-shrink-0 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
                                    <div className="text-center">
                                        <div className="text-sm font-medium">Upgrade Now</div>
                                        <div className="text-xs opacity-75">
                                            {currentStatus.trialDaysRemaining <= 3 
                                                ? `Only ${currentStatus.trialDaysRemaining} days left!` 
                                                : 'Secure your access'
                                            }
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Free tier users - simple upgrade option */}
                        {!currentStatus?.isTrialActive && currentStatus?.subscriptionType === 'free' && (
                            <div className="border-t border-gray-100 mt-3 pt-3">
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full flex items-center justify-center p-2.5 text-center rounded bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white transition-all duration-200 hover:scale-[1.02] font-medium"
                                >
                                    <ArrowUpIcon className="h-4 w-4 mr-2" />
                                    <span className="text-sm">Upgrade Plan</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelector;