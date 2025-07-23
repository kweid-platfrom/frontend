'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useApp, useAppNotifications, useAppFeatures } from '@/contexts/AppProvider';
import { Loader2, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import CreateTestSuiteModal from '@/components/modals/CreateTestSuiteModal';

const PageLayout = ({ title, children, toolbar = null, requiresTestSuite = false }) => {
    const pathname = usePathname();
    const {
        isAuthenticated,
        userProfile,
        loading: appLoading,
        error: appError,
        suites,
        activeSuite,
        switchSuite,
        refreshAll,
        createTestSuite,
        checkSuiteNameExists,
        getSuiteLimit,
        availableOrganizations,
    } = useApp();
    const { addNotification } = useAppNotifications();
    useAppFeatures();

    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);
    const [isCreatingFirstSuite, setIsCreatingFirstSuite] = useState(false);
    const [firstSuiteCreated, setFirstSuiteCreated] = useState(false);
    const modalTriggeredRef = useRef(false);

    const pageTitle = useMemo(() => title || 'QA Platform', [title]);

    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    const isProfileReady = useMemo(() => {
        return userProfile && !appLoading && !isRegistering();
    }, [userProfile, appLoading, isRegistering]);

    const isSystemInitializing = useMemo(() => {
        return appLoading || isRegistering() || (isAuthenticated && !userProfile) || isCreatingFirstSuite;
    }, [appLoading, isRegistering, isAuthenticated, userProfile, isCreatingFirstSuite]);

    const canAccessSuites = useMemo(() => {
        if (!isAuthenticated || !userProfile) return false;
        const hasIndividualAccess = userProfile.accountType === 'individual';
        const hasOrgAdminAccess = userProfile.account_memberships?.some(
            membership => membership.status === 'active' && membership.role === 'Admin'
        );
        return hasIndividualAccess || hasOrgAdminAccess;
    }, [isAuthenticated, userProfile]);

    const shouldShowPermissionDenied = useMemo(() => {
        if (isSystemInitializing || !isAuthenticated || !requiresTestSuite || !isProfileReady) return false;
        return !canAccessSuites;
    }, [isSystemInitializing, isAuthenticated, requiresTestSuite, isProfileReady, canAccessSuites]);

    const canCreateSuite = useMemo(() => {
        if (!isAuthenticated || !userProfile) return false;
        if (userProfile.accountType === 'individual') return true;
        return userProfile.account_memberships?.some(
            membership => membership.status === 'active' && membership.role === 'Admin'
        ) || false;
    }, [isAuthenticated, userProfile]);

    const needsFirstSuite = useMemo(() => {
        if (!requiresTestSuite || !isAuthenticated || !isProfileReady || !canAccessSuites || !canCreateSuite) return false;
        return Array.isArray(suites) && suites.length === 0 && !firstSuiteCreated;
    }, [requiresTestSuite, isAuthenticated, isProfileReady, canAccessSuites, canCreateSuite, suites, firstSuiteCreated]);

    const shouldShowBlockingModal = useMemo(() => {
        return !isSystemInitializing && pathname === '/dashboard' && needsFirstSuite;
    }, [isSystemInitializing, pathname, needsFirstSuite]);

    useEffect(() => {
        if (shouldShowBlockingModal && !modalTriggeredRef.current && !showFirstSuiteModal) {
            console.log('Showing first suite modal - blocking dashboard access');
            setShowFirstSuiteModal(true);
            modalTriggeredRef.current = true;
        }
    }, [shouldShowBlockingModal, showFirstSuiteModal]);

    useEffect(() => {
        if (Array.isArray(suites) && suites.length > 0 && !firstSuiteCreated) {
            console.log('User has suites, resetting modal states');
            setShowFirstSuiteModal(false);
            setFirstSuiteCreated(false);
            modalTriggeredRef.current = false;
        }
    }, [suites, firstSuiteCreated]);

    const handleFirstSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                setIsCreatingFirstSuite(true);
                console.log('Creating first test suite:', suiteData.name);
                const newSuite = await createTestSuite(suiteData);
                if (!newSuite) throw new Error('Failed to create test suite');
                console.log('First suite created successfully:', newSuite);
                setFirstSuiteCreated(true);
                setShowFirstSuiteModal(false);
                if (!activeSuite) {
                    await switchSuite(newSuite.suite_id);
                }
                addNotification({
                    type: 'success',
                    title: 'Test Suite Created',
                    message: `"${suiteData.name}" has been created successfully.`,
                });
                await refreshAll();
                console.log('Dashboard should now be accessible');
            } catch (error) {
                console.error('Error creating first suite:', error);
                addNotification({
                    type: 'error',
                    title: 'Failed to Create Test Suite',
                    message: error?.message || 'Could not create test suite. Please try again.',
                    persistent: true,
                });
                setShowFirstSuiteModal(true);
            } finally {
                setIsCreatingFirstSuite(false);
            }
        },
        [createTestSuite, activeSuite, switchSuite, addNotification, refreshAll]
    );

    const handleModalClose = useCallback(() => {
        if (firstSuiteCreated || (Array.isArray(suites) && suites.length > 0)) {
            setShowFirstSuiteModal(false);
        }
    }, [firstSuiteCreated, suites]);

    const error = useMemo(() => appError, [appError]);

    if (isSystemInitializing) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Loader2
                            className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4"
                            aria-label="Loading"
                        />
                        <p className="text-lg text-gray-600 mb-2">
                            {isCreatingFirstSuite ? 'Creating your test suite...' : 'Loading your workspace'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {requiresTestSuite ? 'Setting up your test environment...' : 'Please wait...'}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
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
                            <p className="text-blue-600 mb-4">Please sign in to access Assura.</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (shouldShowPermissionDenied) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
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
                            {userProfile?.accountType === 'organization' && (
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

    if (showFirstSuiteModal && needsFirstSuite) {
        return (
            <>
                <Head>
                    <title>Create Your First Test Suite - Assura</title>
                </Head>
                <div className="fixed inset-0 z-50 min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="max-w-2xl w-full mx-4">
                        <div className="bg-white rounded-lg shadow-xl p-8 text-center mb-8">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-teal-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Assura!</h2>
                            <p className="text-gray-600 mb-6">
                                Let&apos;s get you started by creating your first test suite.
                                This will organize your test cases and help you track your QA activities.
                            </p>
                            <div className="text-sm text-gray-500">
                                You need at least one test suite to access the dashboard.
                            </div>
                        </div>
                        <CreateTestSuiteModal
                            isOpen={true}
                            onClose={handleModalClose}
                            isFirstSuite={true}
                            onSuccess={handleFirstSuiteSuccess}
                            availableOrganizations={availableOrganizations}
                            checkSuiteNameExists={checkSuiteNameExists}
                            getSuiteLimit={getSuiteLimit}
                        />
                    </div>
                </div>
            </>
        );
    }

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

    const isDashboardEmpty = Array.isArray(suites) && suites.length > 0 && 
        (!children || (Array.isArray(children) && children.length === 0));

    return (
        <>
            <Head>
                <title>{pageTitle} - QA Platform</title>
            </Head>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {(toolbar || (requiresTestSuite && Array.isArray(suites) && suites.length > 0)) && (
                        <div className="mb-6 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                                    {requiresTestSuite && Array.isArray(suites) && suites.length > 0 && (
                                        <span
                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
                                            aria-label={`Number of test suites: ${suites.length}`}
                                        >
                                            {suites.length} suite{suites.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {toolbar && (
                                <div className="flex items-center space-x-3">{toolbar}</div>
                            )}
                        </div>
                    )}
                    <div className="w-full">
                        {requiresTestSuite && isDashboardEmpty ? (
                            <div className="flex items-center justify-center min-h-[60vh]">
                                <div className="text-center max-w-full">
                                    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plus
                                                className="w-8 h-8 text-gray-400"
                                                aria-label="Empty dashboard"
                                            />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            Your Test Suite is Ready
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Add test cases to get started with your QA activities.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full">{children}</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PageLayout;