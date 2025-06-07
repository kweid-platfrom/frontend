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
    UserCircleIcon,
    CogIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    PlayIcon,
    UserPlusIcon,
    DocumentTextIcon,
    PlusIcon,
    UserIcon
} from '@heroicons/react/24/outline';

// Import your existing components
import SignOutButton from "../auth/SignOutButton";
import ScreenRecorderButton from "../bug-report/ScreenRecorder";
import BugReportButton from "../BugReport";
import UserAvatar from '../UserAvatar';
import AddUserDropdown from "../modals/AddUserDropdown";
import NotificationsDropdown from "../NotificationsDropdown";

const Header = ({ onMenuClick, setShowBugForm }) => {
    const router = useRouter();
    const { user, userProfile, activeProject, projects, setActiveProject } = useProject();
    
    // State management for all dropdowns
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);
    
    // Refs for dropdown positioning
    const userMenuRef = useRef(null);
    const projectMenuRef = useRef(null);
    const addUserDropdownRef = useRef(null);
    const reportDropdownRef = useRef(null);
    const testCaseDropdownRef = useRef(null);
    const reportButtonRef = useRef(null);
    const testCaseButtonRef = useRef(null);
    
    // Dropdown positions
    const [reportDropdownPosition, setReportDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const [testCaseDropdownPosition, setTestCaseDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target)) {
                setShowProjectMenu(false);
            }
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target) &&
                reportButtonRef.current && !reportButtonRef.current.contains(event.target)) {
                setShowReportOptions(false);
            }
            if (testCaseDropdownRef.current && !testCaseDropdownRef.current.contains(event.target) &&
                testCaseButtonRef.current && !testCaseButtonRef.current.contains(event.target)) {
                setShowTestCaseOptions(false);
            }
            if (addUserDropdownRef.current && !addUserDropdownRef.current.contains(event.target) &&
                !event.target.closest('.add-user-button')) {
                setShowAddUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown positions
    useEffect(() => {
        if (showReportOptions && reportButtonRef.current) {
            const rect = reportButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 160; // minimum width
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;
            
            setReportDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showReportOptions]);

    useEffect(() => {
        if (showTestCaseOptions && testCaseButtonRef.current) {
            const rect = testCaseButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 160; // minimum width
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;
            
            setTestCaseDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showTestCaseOptions]);

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            router.push('/auth/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setShowProjectMenu(false);
        router.push('/dashboard');
    };

    const handleRecordingComplete = (recordingData) => {
        console.log('Recording completed:', recordingData);
        if (setShowBugForm) {
            setShowBugForm(true);
        }
    };

    // Toggle functions
    const toggleAddUserDropdown = () => {
        setShowAddUserDropdown(!showAddUserDropdown);
        if (!showAddUserDropdown) {
            setShowUserMenu(false);
            setShowReportOptions(false);
            setShowTestCaseOptions(false);
        }
    };

    const toggleDropdown = (dropdownType) => {
        switch (dropdownType) {
            case 'report':
                setShowReportOptions(!showReportOptions);
                setShowTestCaseOptions(false);
                setShowUserMenu(false);
                setShowAddUserDropdown(false);
                break;
            case 'testCase':
                setShowTestCaseOptions(!showTestCaseOptions);
                setShowReportOptions(false);
                setShowUserMenu(false);
                setShowAddUserDropdown(false);
                break;
            default:
                break;
        }
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-50 overflow-visible">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left Section */}
                    <div className="flex items-center flex-1">
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

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-xs md:max-w-sm ml-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search test cases, bugs, reports..."
                            />
                        </div>
                    </div>

                    {/* Right Section - Enhanced with all old header buttons */}
                    <div className="flex items-center space-x-2">
                        {/* Action Buttons Container */}
                        <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                            {/* Run Tests */}
                            <button className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-green-100 hover:text-green-700 transition-colors">
                                <PlayIcon className="h-4 w-4" />
                                <span className="hidden md:inline">Run Tests</span>
                            </button>

                            {/* Report Bug */}
                            <BugReportButton className="text-gray-700 hover:bg-orange-100 hover:text-orange-700 cursor-pointer px-3 py-2 rounded-md transition-colors" />

                            {/* Screen Recorder */}
                            <div className="cursor-pointer">
                                <ScreenRecorderButton onRecordingComplete={handleRecordingComplete} />
                            </div>

                            {/* Generate Report Dropdown */}
                            <div className="relative">
                                <button
                                    ref={reportButtonRef}
                                    onClick={() => toggleDropdown('report')}
                                    className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                >
                                    <DocumentTextIcon className="h-4 w-4" />
                                    <span className="hidden md:inline">Generate Report</span>
                                </button>
                            </div>

                            {/* Add Test Case Dropdown */}
                            <div className="relative">
                                <button
                                    ref={testCaseButtonRef}
                                    onClick={() => toggleDropdown('testCase')}
                                    className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center space-x-2 hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    <span className="hidden md:inline">Add Test Case</span>
                                </button>
                            </div>

                            {/* Add Team Member Button */}
                            <button
                                onClick={toggleAddUserDropdown}
                                className="text-gray-700 px-3 py-2 text-sm rounded-md flex items-center hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer add-user-button"
                            >
                                <UserPlusIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Notifications */}
                        <NotificationsDropdown />

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
                            >
                                {user ? (
                                    <UserAvatar user={user} />
                                ) : user?.photoURL ? (
                                    <img
                                        className="h-8 w-8 rounded-full"
                                        src={user.photoURL}
                                        alt="User avatar"
                                    />
                                ) : (
                                    <UserCircleIcon className="h-8 w-8" />
                                )}
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                    <div className="p-2">
                                        <div className="px-3 py-2 text-sm border-b border-gray-200 mb-2">
                                            <p className="font-medium text-gray-900">{userProfile?.name || user?.displayName || 'User'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                                            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => router.push('/settings')}
                                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                        >
                                            <CogIcon className="h-4 w-4 mr-2 text-gray-500" />
                                            Settings
                                        </button>
                                        <div onClick={handleSignOut} className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
                                            <SignOutButton variant="text" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Options Dropdown - Fixed Position */}
            {showReportOptions && (
                <div
                    ref={reportDropdownRef}
                    className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                    style={{
                        top: `${reportDropdownPosition.top}px`,
                        left: reportDropdownPosition.left !== 'auto' ? `${reportDropdownPosition.left}px` : 'auto',
                        right: reportDropdownPosition.right !== 'auto' ? `${reportDropdownPosition.right}px` : 'auto',
                        minWidth: '160px'
                    }}
                >
                    <div className="py-1">
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Bug Summary</button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Bug Report</button>
                    </div>
                </div>
            )}

            {/* Test Case Options Dropdown - Fixed Position */}
            {showTestCaseOptions && (
                <div
                    ref={testCaseDropdownRef}
                    className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                    style={{
                        top: `${testCaseDropdownPosition.top}px`,
                        left: testCaseDropdownPosition.left !== 'auto' ? `${testCaseDropdownPosition.left}px` : 'auto',
                        right: testCaseDropdownPosition.right !== 'auto' ? `${testCaseDropdownPosition.right}px` : 'auto',
                        minWidth: '160px'
                    }}
                >
                    <div className="py-1">
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">New Test Case</button>
                        <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Import Test Cases</button>
                    </div>
                </div>
            )}

            {/* Add User Dropdown - Responsive positioning */}
            {showAddUserDropdown && (
                <div 
                    ref={addUserDropdownRef}
                    className="absolute top-16 right-4 sm:right-16 bg-white border border-gray-200 shadow-lg rounded-lg z-50 w-64 max-w-[calc(100vw-2rem)]"
                >
                    <AddUserDropdown onClose={() => setShowAddUserDropdown(false)} />
                </div>
            )}
        </header>
    );
};

export default Header;