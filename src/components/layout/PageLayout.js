'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { Loader2, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import FeatureAccessBanner from '../common/FeatureAccessBanner';
import NotificationBanner from '../notifications/NotificationBanner';

const PageLayout = ({ title, children, toolbar = null, requiresTestSuite = false }) => {
    const pathname = usePathname();
    const { state, actions } = useApp();
    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);
    const [isCreatingFirstSuite, setIsCreatingFirstSuite] = useState(false);
    const [firstSuiteCreated, setFirstSuiteCreated] = useState(false);
    const modalTriggeredRef = useRef(false);

    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicRoute = publicRoutes.includes(pathname);

    const pageTitle = useMemo(() => title || 'QA Platform', [title]);

    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    const isProfileReady = useMemo(() => {
        return state.auth.currentUser && !state.auth.loading && !isRegistering();
    }, [state.auth.currentUser, state.auth.loading, isRegistering]);

    const isSystemInitializing = useMemo(() => {
        return state.auth.loading ||
            isRegistering() ||
            (state.auth.isAuthenticated && !state.auth.currentUser) ||
            isCreatingFirstSuite ||
            state.suites.loading;
    }, [state.auth.loading, isRegistering, state.auth.isAuthenticated, state.auth.currentUser, isCreatingFirstSuite, state.suites.loading]);

    const canAccessSuites = useMemo(() => {
        if (!state.auth.isAuthenticated || !state.auth.currentUser) return false;
        const userProfile = state.auth.currentUser;
        const hasIndividualAccess = userProfile.accountType === 'individual';
        const hasOrgAdminAccess = userProfile.account_memberships?.some(
            membership => membership.status === 'active' && membership.role === 'Admin'
        );
        return hasIndividualAccess || hasOrgAdminAccess;
    }, [state.auth.isAuthenticated, state.auth.currentUser]);

    const shouldShowPermissionDenied = useMemo(() => {
        if (isSystemInitializing || !state.auth.isAuthenticated || !requiresTestSuite || !isProfileReady) return false;
        return !canAccessSuites;
    }, [isSystemInitializing, state.auth.isAuthenticated, requiresTestSuite, isProfileReady, canAccessSuites]);

    const canCreateSuite = useMemo(() => {
        if (!state.auth.isAuthenticated || !state.auth.currentUser) return false;
        const userProfile = state.auth.currentUser;
        if (userProfile.accountType === 'individual') return true;
        return userProfile.account_memberships?.some(
            membership => membership.status === 'active' && membership.role === 'Admin'
        ) || false;
    }, [state.auth.isAuthenticated, state.auth.currentUser]);

    const needsFirstSuite = useMemo(() => {
        if (!requiresTestSuite || !state.auth.isAuthenticated || !isProfileReady || !canAccessSuites || !canCreateSuite) return false;
        return Array.isArray(state.suites.suites) && state.suites.suites.length === 0 && !firstSuiteCreated;
    }, [requiresTestSuite, state.auth.isAuthenticated, isProfileReady, canAccessSuites, canCreateSuite, state.suites.suites, firstSuiteCreated]);

    const shouldShowBlockingModal = useMemo(() => {
        return !isSystemInitializing && pathname === '/dashboard' && needsFirstSuite;
    }, [isSystemInitializing, pathname, needsFirstSuite]);

    const needsUpgrade = state.subscription.currentPlan === 'free' && !state.subscription.isTrialActive;

    const handleFirstSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                setIsCreatingFirstSuite(true);
                console.log('Creating first test suite:', suiteData.name);

                // Use the new context actions to create suite
                const newSuite = await actions.suites.createSuite(suiteData);
                if (!newSuite) throw new Error('Failed to create test suite');

                console.log('First suite created successfully:', newSuite);
                setFirstSuiteCreated(true);
                setShowFirstSuiteModal(false);

                if (!state.suites.activeSuite) {
                    await actions.suites.setActiveSuite(newSuite.id);
                }

                // Show success notification using new context
                actions.ui.showNotification('success', `Test suite "${suiteData.name}" created successfully!`);
                console.log('Dashboard should now be accessible');
            } catch (error) {
                console.error('Error creating first suite:', error);
                actions.ui.showNotification('error', 'Failed to create test suite. Please try again.', true);
                setShowFirstSuiteModal(true);
            } finally {
                setIsCreatingFirstSuite(false);
            }
        },
        [actions.suites, actions.ui, state.suites.activeSuite]
    );

    const handleModalClose = useCallback(() => {
        if (firstSuiteCreated || (Array.isArray(state.suites.suites) && state.suites.suites.length > 0)) {
            setShowFirstSuiteModal(false);
        }
    }, [firstSuiteCreated, state.suites.suites]);

    // All useEffect hooks must be called before any conditional returns
    useEffect(() => {
        if (!isPublicRoute && shouldShowBlockingModal && !modalTriggeredRef.current && !showFirstSuiteModal) {
            console.log('Showing first suite modal - blocking dashboard access');
            setShowFirstSuiteModal(true);
            modalTriggeredRef.current = true;
        }
    }, [isPublicRoute, shouldShowBlockingModal, showFirstSuiteModal]);

    useEffect(() => {
        if (!isPublicRoute && Array.isArray(state.suites.suites) && state.suites.suites.length > 0 && !firstSuiteCreated) {
            console.log('User has suites, resetting modal states');
            setShowFirstSuiteModal(false);
            setFirstSuiteCreated(false);
            modalTriggeredRef.current = false;
        }
    }, [isPublicRoute, state.suites.suites, firstSuiteCreated]);

    // Don't render layout for public routes
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // System initializing state
    if (isSystemInitializing) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-gray-50">
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

    // Not authenticated state
    if (!state.auth.isAuthenticated) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-gray-50">
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

    // Permission denied state
    if (shouldShowPermissionDenied) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-gray-50">
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
                            {state.auth.currentUser?.accountType === 'organization' && (
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

    // First suite creation modal (blocking)
    if (showFirstSuiteModal && needsFirstSuite) {
        return (
            <>
                <Head>
                    <title>Create Your First Test Suite - Assura</title>
                </Head>
                <div className="fixed inset-0 z-50 h-screen bg-gray-50 flex items-center justify-center overflow-y-auto">
                    <div className="max-w-2xl w-full mx-4 my-8">
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
                        {/* CreateTestSuiteModal component */}
                        <div className="bg-white rounded-lg shadow-xl p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Test Suite Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter test suite name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={(e) => {
                                        const input = e.target.closest('.bg-white').querySelector('input');
                                        const suiteName = input.value.trim();
                                        if (suiteName) {
                                            handleFirstSuiteSuccess({ name: suiteName });
                                        }
                                    }}
                                    disabled={isCreatingFirstSuite}
                                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingFirstSuite ? 'Creating...' : 'Create Test Suite'}
                                </button>
                                <button
                                    onClick={handleModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Error state
    if (state.auth.error || state.suites.error) {
        const error = state.auth.error || state.suites.error;
        return (
            <>
                <Head>
                    <title>Error - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-gray-50">
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

    // Check if dashboard is empty (has suites but no content)
    const isDashboardEmpty = Array.isArray(state.suites.suites) &&
        state.suites.suites.length > 0 &&
        (!children || (Array.isArray(children) && children.length === 0));

    // Main layout render
    return (
        <>
            <Head>
                <title>{pageTitle} - Assura</title>
            </Head>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                {/* Sidebar */}
                <AppSidebar />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <AppHeader />

                    {/* Notification banner */}
                    <NotificationBanner />

                    {/* Conditional upgrade banner */}
                    {needsUpgrade && (
                        <FeatureAccessBanner
                            message="Upgrade to Pro to unlock all features!"
                        />
                    )}

                    {/* Main content area */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            {/* Page header with toolbar */}
                            {(toolbar || (requiresTestSuite && Array.isArray(state.suites.suites) && state.suites.suites.length > 0)) && (
                                <div className="mb-6 flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                                            {requiresTestSuite && Array.isArray(state.suites.suites) && state.suites.suites.length > 0 && (
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
                                                    aria-label={`Number of test suites: ${state.suites.suites.length}`}
                                                >
                                                    {state.suites.suites.length} suite{state.suites.suites.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {/* Active Suite Indicator */}
                                            {state.suites.activeSuite && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-100 text-teal-800">
                                                    Active: {state.suites.activeSuite.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {toolbar && (
                                        <div className="flex items-center space-x-3">{toolbar}</div>
                                    )}
                                </div>
                            )}

                            {/* Content area */}
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
                    </main>
                </div>
            </div>
        </>
    );
};

export default PageLayout;