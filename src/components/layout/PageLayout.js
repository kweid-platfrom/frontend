'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { Loader2, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import FeatureAccessBanner from '../common/FeatureAccessBanner';
import NotificationCenter from '../notifications/NotificationCenter';

const PageLayout = ({ title, children, toolbar = null, requiresTestSuite = false, disableNavigation = false }) => {
    const pathname = usePathname();
    const { state, actions } = useApp();
    const [showFirstSuiteModal, setShowFirstSuiteModal] = useState(false);
    const [isCreatingFirstSuite, setIsCreatingFirstSuite] = useState(false);
    const [firstSuiteCreated, setFirstSuiteCreated] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Determine if navigation should be disabled
    const shouldDisableNavigation = disableNavigation || needsFirstSuite;

    const needsUpgrade = state.subscription.currentPlan === 'free' && !state.subscription.isTrialActive;

    // Handle sidebar toggle - disabled when navigation is disabled
    const handleSidebarToggle = useCallback(() => {
        if (!shouldDisableNavigation) {
            setSidebarOpen(prev => !prev);
        }
    }, [shouldDisableNavigation]);

    const handleSidebarClose = useCallback(() => {
        if (!shouldDisableNavigation) {
            setSidebarOpen(false);
        }
    }, [shouldDisableNavigation]);

    const handleFirstSuiteSuccess = useCallback(
        async (suiteData) => {
            try {
                setIsCreatingFirstSuite(true);
                console.log('Creating first test suite:', suiteData.name);

                const newSuite = await actions.suites.createSuite(suiteData);
                if (!newSuite) throw new Error('Failed to create test suite');

                console.log('First suite created successfully:', newSuite);
                setFirstSuiteCreated(true);
                setShowFirstSuiteModal(false);

                if (!state.suites.activeSuite) {
                    await actions.suites.setActiveSuite(newSuite.id);
                }

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

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (isSystemInitializing) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-background p-4">
                    <div className="text-center max-w-md w-full">
                        <Loader2
                            className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-4"
                            aria-label="Loading"
                        />
                        <p className="text-base sm:text-lg text-foreground mb-2">
                            {isCreatingFirstSuite ? 'Creating your test suite...' : 'Loading your workspace'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {requiresTestSuite ? 'Setting up your test environment...' : 'Please wait...'}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    if (!state.auth.isAuthenticated) {
        return (
            <>
                <Head>
                    <title>{pageTitle} - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-background p-4">
                    <div className="text-center max-w-md w-full">
                        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-theme">
                            <AlertCircle
                                className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500 mx-auto mb-4"
                                aria-label="Authentication required"
                            />
                            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                                Authentication Required
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">Please sign in to access Assura.</p>
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
                <div className="flex items-center justify-center h-screen bg-background p-4">
                    <div className="text-center max-w-md w-full">
                        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-theme">
                            <AlertTriangle
                                className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-4"
                                aria-label="Access restricted"
                            />
                            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Access Restricted</h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">
                                You don&apos;t have permission to access test suites.
                            </p>
                            {state.auth.currentUser?.accountType === 'organization' && (
                                <p className="text-xs sm:text-sm text-orange-400">
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
                <div className="fixed inset-0 z-50 h-screen bg-background flex items-center justify-center overflow-y-auto p-4">
                    <div className="max-w-2xl w-full mx-auto my-8">
                        <div className="bg-card rounded-lg shadow-theme-xl p-6 sm:p-8 text-center mb-6 sm:mb-8">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-teal-800" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Welcome to Assura!</h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                                Let&apos;s get you started by creating your first test suite.
                                This will organize your test cases and help you track your QA activities.
                            </p>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                You need at least one test suite to access the dashboard.
                            </div>
                        </div>
                        <div className="bg-card rounded-lg shadow-theme-xl p-6 sm:p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Test Suite Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter test suite name"
                                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder-muted-foreground text-sm sm:text-base"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={(e) => {
                                        const input = e.target.closest('.bg-card').querySelector('input');
                                        const suiteName = input.value.trim();
                                        if (suiteName) {
                                            handleFirstSuiteSuccess({ name: suiteName });
                                        }
                                    }}
                                    disabled={isCreatingFirstSuite}
                                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                >
                                    {isCreatingFirstSuite ? 'Creating...' : 'Create Test Suite'}
                                </button>
                                <button
                                    onClick={handleModalClose}
                                    className="px-4 py-2 border border-border rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm sm:text-base"
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

    if (state.auth.error || state.suites.error) {
        const error = state.auth.error || state.suites.error;
        return (
            <>
                <Head>
                    <title>Error - Assura</title>
                </Head>
                <div className="flex items-center justify-center h-screen bg-background p-4">
                    <div className="text-center max-w-md w-full">
                        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-theme">
                            <AlertTriangle
                                className="w-8 h-8 sm:w-12 sm:h-12 text-destructive mx-auto mb-4"
                                aria-label="Connection error"
                            />
                            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Connection Error</h2>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive transition-colors text-sm sm:text-base"
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

    const isDashboardEmpty = Array.isArray(state.suites.suites) &&
        state.suites.suites.length > 0 &&
        (!children || (Array.isArray(children) && children.length === 0));

    return (
        <>
            <Head>
                <title>{pageTitle} - Assura</title>
            </Head>
            <div className="flex h-screen bg-background overflow-hidden">
                {/* Sidebar - Always render but pass disabled state */}
                <AppSidebar 
                    open={sidebarOpen}
                    onClose={handleSidebarClose}
                    activeModule={pathname.split('/')[1] || 'dashboard'}
                    onNavigate={() => {}}
                    disabled={shouldDisableNavigation}
                />

                <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${shouldDisableNavigation ? 'w-full' : ''}`}>
                    {/* Header - Always render but pass disabled state */}
                    <AppHeader 
                        onMenuClick={handleSidebarToggle}
                        setShowBugForm={() => {}}
                        setActivePage={() => {}}
                        disabled={shouldDisableNavigation}
                    />

                    <NotificationCenter />

                    {needsUpgrade && !shouldDisableNavigation && (
                        <FeatureAccessBanner
                            message="Upgrade to Pro to unlock all features!"
                        />
                    )}

                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                            {(toolbar || (requiresTestSuite && Array.isArray(state.suites.suites) && state.suites.suites.length > 0)) && !shouldDisableNavigation && (
                                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
                                            {requiresTestSuite && Array.isArray(state.suites.suites) && state.suites.suites.length > 0 && (
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800"
                                                    aria-label={`Number of test suites: ${state.suites.suites.length}`}
                                                >
                                                    {state.suites.suites.length} suite{state.suites.suites.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {state.suites.activeSuite && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 max-w-[120px] sm:max-w-none truncate">
                                                    Active: {state.suites.activeSuite.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {toolbar && (
                                        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-2 sm:pb-0">
                                            {toolbar}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="w-full">
                                {requiresTestSuite && isDashboardEmpty && !shouldDisableNavigation ? (
                                    <div className="flex items-center justify-center min-h-[60vh] p-4">
                                        <div className="text-center max-w-full">
                                            <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-theme">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Plus
                                                        className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground"
                                                        aria-label="Empty dashboard"
                                                    />
                                                </div>
                                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                                                    Your Test Suite is Ready
                                                </h3>
                                                <p className="text-sm sm:text-base text-muted-foreground mb-4">
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