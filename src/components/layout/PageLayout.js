'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
        isAuthenticated,
        userCapabilities,
        accountSummary,
    } = useApp();

    const {
        suites,
        isLoading: suiteLoading,
        error: suiteError,
        refetchSuites,
        createTestSuite,
        canCreateSuite,
        shouldFetchSuites,
        hasEverCreatedSuite,
    } = useSuite();

    const {
        userProfile,
        isLoading: profileLoading,
        error: profileError,
        isNewUser,
        isProfileLoaded,
    } = useUserProfile();

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);

    // Ref to prevent multiple checks in the same session
    const firstSuiteCheckRef = useRef(false);

    const pageTitle = useMemo(
        () => title || breadcrumbs?.[breadcrumbs.length - 1] || 'QA Platform',
        [title, breadcrumbs],
    );

    // Helper function to check if we're in registration mode
    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    // Enhanced loading state
    const isSystemInitializing = useMemo(() => {
        if (appLoading) return true;
        if (isRegistering()) return true;
        if (profileLoading || !isProfileLoaded) return true;
        if (requiresTestSuite && suiteLoading) return true;
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
        profileError,
    ]);

    // Permission denied state
    const shouldShowPermissionDenied = useMemo(() => {
        if (isSystemInitializing) return false;
        if (!isAuthenticated) return false;
        if (!requiresTestSuite) return false;
        if (!isProfileLoaded || isNewUser) return false;
        return !shouldFetchSuites;
    }, [
        isSystemInitializing,
        isAuthenticated,
        requiresTestSuite,
        isProfileLoaded,
        isNewUser,
        shouldFetchSuites,
    ]);

    // First suite modal logic
    const shouldShowFirstSuiteModal = useMemo(() => {
        if (isSystemInitializing) return false;
        return (
            requiresTestSuite &&
            isAuthenticated &&
            isProfileLoaded &&
            !isNewUser &&
            shouldFetchSuites &&
            !suiteLoading &&
            Array.isArray(suites) &&
            suites.length === 0 &&
            canCreateSuite &&
            !firstSuiteCheckRef.current &&
            hasEverCreatedSuite === false
        );
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
        hasEverCreatedSuite,
    ]);

    // Show first suite modal
    useEffect(() => {
        if (shouldShowFirstSuiteModal) {
            setShowFirstSuiteModal(true);
            firstSuiteCheckRef.current = true;
        }
    }, [shouldShowFirstSuiteModal]);

    // Handlers
    const handleCreateModalClose = useCallback(() => {
        setIsCreateModalOpen(false);
    }, []);

    const handleFirstSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                await createTestSuite(suiteData);
                setShowFirstSuiteModal(false);
                if (refetchSuites) {
                    await refetchSuites(true);
                }
            } catch (error) {
                console.error('Error creating first suite:', error);
                // Notification handled by AppProvider
            }
        },
        [createTestSuite, refetchSuites],
    );

    const handleNewSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                await createTestSuite(suiteData);
                setIsCreateModalOpen(false);
                if (refetchSuites) {
                    await refetchSuites(true);
                }
            } catch (error) {
                console.error('Error creating new suite:', error);
                // Notification handled by AppProvider
            }
        },
        [createTestSuite, refetchSuites],
    );

    // Combined error state
    const error = useMemo(() => appError || suiteError || profileError, [appError, suiteError, profileError]);

    // Loading state
    if (isSystemInitializing) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Loader2
                            className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4"
                            aria-label="Loading"
                        />
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
                            <AlertCircle
                                className="w-12 h-12 text-blue-500 mx-auto mb-4"
                                aria-label="Authentication required"
                            />
                            <h2 className="text-lg font-semibold text-blue-800 mb-2">
                                Authentication Required
                            </h2>
                            <p className="text-blue-600 mb-4">Please sign in to access the QA Platform.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Permission denied
    if (shouldShowPermissionDenied) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-8">
                            <AlertTriangle
                                className="w-12 h-12 text-orange-500 mx-auto mb-4"
                                aria-label="Access restricted"
                            />
                            <h2 className="text-lg font-semibold text-orange-800 mb-2">Access Restricted</h2>
                            <p className="text-orange-600 mb-4">
                                You don&apos;t have permission to access test suites.
                            </p>
                            {accountSummary?.profile?.accountType === 'organization' && (
                                <p className="text-sm text-orange-500">
                                    Contact your organization admin to gain access.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // First suite modal
    if (shouldShowFirstSuiteModal) {
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
                                    <Plus className="w-8 h-8 text-teal-600" aria-label="Create test suite" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    Welcome to QA Platform!
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    To get started, you need to create your first test suite. This will be your working
                                    environment for managing QA activities.
                                </p>
                            </div>
                        </div>
                    </div>
                    <CreateTestSuiteModal
                        isOpen={showFirstSuiteModal}
                        onClose={() => {}} // Prevent closing for first suite
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
                            <AlertTriangle
                                className="w-12 h-12 text-red-500 mx-auto mb-4"
                                aria-label="Connection error"
                            />
                            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
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

    // Main page layout
    return (
        <>
            <Head>
                <title>{pageTitle} - QA Platform</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {toolbar && (
                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                                    {requiresTestSuite && suites?.length > 0 && (
                                        <span
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
                                            aria-label={`Number of test suites: ${suites.length}`}
                                        >
                                            {suites.length} suite{suites.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">{toolbar}</div>
                        </div>
                    )}
                    <div className="w-full">
                        {requiresTestSuite && suites?.length === 0 && hasEverCreatedSuite === true ? (
                            <div className="flex items-center justify-center min-h-[60vh]">
                                <div className="text-center max-w-full">
                                    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus
                                                className="w-8 h-8 text-gray-400"
                                                aria-label="Create test suite"
                                            />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            No Test Suites
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            You don&apos;t have any test suites at the moment. Create a new one to get
                                            started.
                                        </p>
                                        {userCapabilities?.canCreateSuite && (
                                            <button
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                                            >
                                                Create Test Suite
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">{children}</div>
                        )}
                    </div>
                </div>
            </div>
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