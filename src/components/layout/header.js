/* eslint-disable @next/next/no-img-element */
// components/layout/Header.js
'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '../../context/ProjectContext';
import { getAuth, signOut } from 'firebase/auth';
import '../../app/globals.css';
import {
    Bars3Icon,
    VideoCameraIcon,
    BugAntIcon,
    BellIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    CogIcon,
    FolderIcon
} from '@heroicons/react/24/outline';

const Header = ({ onMenuClick }) => {
    const router = useRouter();
    const { user, userProfile, activeProject, projects, setActiveProject } = useProject();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const userMenuRef = useRef(null);
    const projectMenuRef = useRef(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
                setShowProjectMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleStartRecording = () => {
        router.push('/dashboard/recorder');
    };

    const handleReportBug = () => {
        router.push('/dashboard/bugs/new');
    };

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setShowProjectMenu(false);
        router.push('/dashboard');
    };

    const quickActions = [
        {
            name: 'Record Screen',
            icon: VideoCameraIcon,
            onClick: handleStartRecording,
            className: 'bg-red-600 hover:bg-red-700 text-white'
        },
        {
            name: 'Report Bug',
            icon: BugAntIcon,
            onClick: handleReportBug,
            className: 'bg-orange-600 hover:bg-orange-700 text-white'
        }
    ];

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Section */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        {/* Project Context */}
                        <div className="hidden lg:flex items-center ml-4">
                            <div className="relative" ref={projectMenuRef}>
                                <button
                                    onClick={() => setShowProjectMenu(!showProjectMenu)}
                                    className="flex items-center px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <FolderIcon className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="font-medium text-gray-900">{activeProject?.name}</span>
                                    <svg className="ml-2 h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Project Dropdown */}
                                {showProjectMenu && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                        <div className="p-2">
                                            <div className="px-2 py-1 text-xs font-medium text-gray-500 mb-1">
                                                Switch Project
                                            </div>
                                            {projects.map((project) => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleProjectSwitch(project)}
                                                    className={`w-full flex items-center p-2 text-left rounded-md hover:bg-gray-50 ${activeProject?.id === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                                                        }`}
                                                >
                                                    <FolderIcon className="h-4 w-4 mr-2" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm font-medium truncate block">{project.name}</span>
                                                        {project.description && (
                                                            <span className="text-xs text-gray-500 truncate block">{project.description}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-4">
                        {/* Quick Actions */}
                        <div className="hidden sm:flex items-center space-x-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.name}
                                    onClick={action.onClick}
                                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${action.className}`}
                                >
                                    <action.icon className="h-4 w-4 mr-2" />
                                    {action.name}
                                </button>
                            ))}
                        </div>

                        {/* Notifications */}
                        <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
                            <BellIcon className="h-6 w-6" />
                        </button>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                            >
                                {user?.photoURL ? (
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={user.photoURL}
                                        alt=""
                                    />
                                ) : (
                                    <UserCircleIcon className="h-8 w-8" />
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-sm text-gray-700 font-medium border-b">
                                            {userProfile?.name || user?.displayName || 'User'}
                                        </div>
                                        <button
                                            onClick={() => router.push('/settings')}
                                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                        >
                                            <CogIcon className="h-4 w-4 mr-2 text-gray-500" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-red-500" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;