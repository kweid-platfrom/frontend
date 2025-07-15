'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useApp } from '@/contexts/AppProvider';
import { useSuite } from '@/contexts/SuiteContext';
import { useUserProfile } from '@/contexts/userProfileContext';
import { Loader2, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import CreateTestSuiteModal from '@/components/modals/CreateTestSuiteModal';

const PageLayout = ({ title, children, toolbar = null, requiresTestSuite = false }) => {
    const {
        isLoading: appLoading,
        error: appError,
        breadcrumbs,
        isAuthenticated
    } = useApp();

    const {
        suites,
        isLoading: suiteLoading,
        error: suiteError,
        refetchSuites,
        createTestSuite,
        canCreateSuite,
        shouldFetchSuites,
        hasEverCreatedSuite // This should come from the context/backend
    } = useSuite();

    const {
        userProfile,
        isLoading: profileLoading,
        error: profileError,
        isNewUser,
        isProfileLoaded
    } = useUserProfile();

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);

    // Ref to prevent multiple checks in the same session
    const firstSuiteCheckRef = useRef(false);

    const pageTitle = title || breadcrumbs?.[breadcrumbs.length - 1] || 'QA Platform';

    // Helper function to check if we're in registration mode
    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    // Enhanced loading state that considers all dependencies
    const isSystemInitializing = React.useMemo(() => {
        // App is still loading
        if (appLoading) return true;
        
        // Registration is in progress
        if (isRegistering()) return true;
        
        // User profile is still loading or not loaded
        if (profileLoading || !isProfileLoaded) return true;
        
        // If we require test suite access and suites are loading
        if (requiresTestSuite && suiteLoading) return true;
        
        // If authenticated but profile is not available yet (and not a new user)
        if (isAuthenticated && !isNewUser && !userProfile && !profileError) return true;
        
        return false;
    }, [
        appLoading,
        isRegistering,
        profileLoading,
        isProfileLoaded,
        requiresTestSuite,
        suiteLoading,
        isAuthenticated,
        isNewUser,
        userProfile,
        profileError
    ]);

    // Determine if we should show permission denied (only after system is initialized)
    const shouldShowPermissionDenied = React.useMemo(() => {
        // Never show permission denied during initialization
        if (isSystemInitializing) return false;
        
        // Only show for authenticated users
        if (!isAuthenticated) return false;
        
        // Only show when test suite is required
        if (!requiresTestSuite) return false;
        
        // Only show when profile is loaded and not a new user
        if (!isProfileLoaded || isNewUser) return false;
        
        // Show permission denied only if we definitively don't have access
        return !shouldFetchSuites;
    }, [
        isSystemInitializing,
        isAuthenticated,
        requiresTestSuite,
        isProfileLoaded,
        isNewUser,
        shouldFetchSuites
    ]);

    // Check if user needs a test suite and has never created one
    const shouldShowFirstSuiteModal = React.useMemo(() => {
        // Only show first suite modal if system is fully initialized
        if (isSystemInitializing) return false;
        
        // Only show first suite modal if:
        // 1. This page requires a test suite
        // 2. User is authenticated
        // 3. User profile is loaded
        // 4. User is not a new user (has completed registration)
        // 5. User has permission to fetch suites
        // 6. We're not currently loading suites
        // 7. User currently has no suites
        // 8. User can create a suite
        // 9. We haven't already checked this session
        // 10. User has NEVER created a suite before (this is the key check)
        return requiresTestSuite &&
            isAuthenticated &&
            isProfileLoaded &&
            !isNewUser &&
            shouldFetchSuites &&
            !suiteLoading &&
            Array.isArray(suites) &&
            suites.length === 0 &&
            canCreateSuite &&
            !firstSuiteCheckRef.current &&
            hasEverCreatedSuite === false; // This should be explicitly false, not just falsy
    }, [
        isSystemInitializing,
        requiresTestSuite,
        isAuthenticated,
        isProfileLoaded,
        isNewUser,
        shouldFetchSuites,
        suiteLoading,
        suites,
        canCreateSuite,
        hasEverCreatedSuite
    ]);

    // Show first suite modal when conditions are met
    useEffect(() => {
        if (shouldShowFirstSuiteModal) {
            setShowFirstSuiteModal(true);
            firstSuiteCheckRef.current = true;
        }
    }, [shouldShowFirstSuiteModal]);

    // Handlers
    const handleCreateNewSuite = useCallback(() => {
        if (!canCreateSuite) {
            alert('Suite creation limit reached. Please upgrade your subscription.');
            return;
        }
        setIsCreateModalOpen(true);
    }, [canCreateSuite]);

    const handleCreateModalClose = useCallback(() => {
        setIsCreateModalOpen(false);
    }, []);

    const handleFirstSuiteSuccess = useCallback(async (suiteData) => {
        console.log('First suite created successfully');

        try {
            await createTestSuite(suiteData);
            setShowFirstSuiteModal(false);
            // The context should now update hasEverCreatedSuite to true

            if (refetchSuites) {
                await refetchSuites(true);
            }
        } catch (error) {
            console.error('Error creating first suite:', error);
            // Handle error appropriately
        }
    }, [createTestSuite, refetchSuites]);

    const handleNewSuiteSuccess = useCallback(async (suiteData) => {
        console.log('New suite created successfully');

        try {
            await createTestSuite(suiteData);
            setIsCreateModalOpen(false);

            if (refetchSuites) {
                await refetchSuites(true);
            }
        } catch (error) {
            console.error('Error creating new suite:', error);
        }
    }, [createTestSuite, refetchSuites]);

    // Combined loading state
    const isLoading = isSystemInitializing;
    const error = appError || suiteError || profileError;

    // Show loading screen while system is initializing
    if (isLoading) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-2">Loading QA Platform</p>
                        <p className="text-sm text-gray-500">
                            {requiresTestSuite ? 'Checking your test suites...' : 'Please wait...'}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // Authentication check
    if (!isAuthenticated) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-blue-800 mb-2">Authentication Required</h2>
                            <p className="text-blue-600 mb-4">Please sign in to access the QA Platform.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Test suite access check - only show after system is initialized
    if (shouldShowPermissionDenied) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-8">
                            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-orange-800 mb-2">Access Restricted</h2>
                            <p className="text-orange-600 mb-4">You don&apos;t have permission to access test suites.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // First suite modal (blocks access to dashboard) - ONLY for first-time users
    if (showFirstSuiteModal) {
        return (
            <>
                <Head>
                    <title>Create Your First Test Suite - QA Platform</title>
                </Head>
                <div className="min-h-screen bg-gray-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center max-w-md mb-8">
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-teal-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to QA Platform!</h2>
                                <p className="text-gray-600 mb-4">
                                    To get started, you need to create your first test suite.
                                    This will be your working environment for managing QA activities.
                                </p>
                            </div>
                        </div>
                    </div>
                    <CreateTestSuiteModal
                        isOpen={showFirstSuiteModal}
                        onClose={() => { }} // Prevent closing for first suite
                        isFirstSuite={true}
                        onSuccess={handleFirstSuiteSuccess}
                    />
                </div>
            </>
        );
    }

    // Error state
    if (error) {
        return (
            <>
                <Head>
                    <title>Error - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                            >
                                <Loader2 className="w-4 h-4 inline mr-2" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Main page layout - Show even if no suites (for existing users)
    return (
        <>
            <Head>
                <title>{pageTitle} - QA Platform</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Enhanced Toolbar with Suite Management */}
                    {toolbar && (
                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                {/* Suite Info */}
                                {requiresTestSuite && suites && suites.length > 0 && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{suites.length}</span> Test Suite{suites.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                {/* Create New Suite Button */}
                                {requiresTestSuite && (
                                    <button
                                        onClick={handleCreateNewSuite}
                                        disabled={!canCreateSuite}
                                        className={`px-4 py-2 rounded-md flex items-center shadow-md hover:shadow-lg transition-all duration-200 ${canCreateSuite
                                                ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-700 hover:to-blue-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        title={!canCreateSuite ? 'Suite creation limit reached' : 'Create new test suite'}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Suite
                                    </button>
                                )}
                                {/* Original Toolbar */}
                                {toolbar}
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="w-full">
                        {/* Show empty state for existing users with no suites */}
                        {requiresTestSuite && suites && suites.length === 0 && hasEverCreatedSuite === true ? (
                            <div className="flex items-center justify-center min-h-[60vh]">
                                <div className="text-center max-w-md">
                                    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Test Suites</h3>
                                        <p className="text-gray-600 mb-4">
                                            You don&apos;t have any test suites at the moment. Create a new one to get started.
                                        </p>
                                        <button
                                            onClick={handleCreateNewSuite}
                                            disabled={!canCreateSuite}
                                            className={`px-4 py-2 rounded-md flex items-center mx-auto ${canCreateSuite
                                                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Test Suite
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">
                                {children}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Regular Create Test Suite Modal */}
            <CreateTestSuiteModal
                isOpen={isCreateModalOpen}
                onClose={handleCreateModalClose}
                isFirstSuite={false}
                onSuccess={handleNewSuiteSuccess}
            />
        </>
    );
};

export default PageLayout;