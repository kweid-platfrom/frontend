'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import FeatureAccessBanner from '../common/FeatureAccessBanner';
import NotificationCenter from '../notifications/NotificationCenter';

const PageLayout = ({ 
    title, 
    children, 
    toolbar = null, 
    requiresTestSuite = false, 
    disableNavigation = false,
    onCreateDocument = null 
}) => {
    const pathname = usePathname();
    const { state } = useApp();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [setShowBugForm] = useState(false);

    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicRoute = publicRoutes.includes(pathname);

    const pageTitle = useMemo(() => title || 'QA Platform', [title]);

    const isSystemInitializing = useMemo(() => {
        return state.auth.loading || state.suites.loading;
    }, [state.auth.loading, state.suites.loading]);

    const canAccessSuites = useMemo(() => {
        if (!state.auth.isAuthenticated || !state.auth.currentUser) return false;
        const userProfile = state.auth.currentUser;
        const hasIndividualAccess = userProfile.accountType === 'individual' || userProfile.account_type === 'individual';
        const hasOrgAdminAccess = userProfile.account_memberships?.some(
            membership => membership.status === 'active' && membership.role === 'Admin'
        );
        return hasIndividualAccess || hasOrgAdminAccess;
    }, [state.auth.isAuthenticated, state.auth.currentUser]);

    const shouldShowPermissionDenied = useMemo(() => {
        if (isSystemInitializing || !state.auth.isAuthenticated || !requiresTestSuite) return false;
        return !canAccessSuites;
    }, [isSystemInitializing, state.auth.isAuthenticated, requiresTestSuite, canAccessSuites]);

    const needsUpgrade = state.subscription.currentPlan === 'free' && !state.subscription.isTrialActive;

    // Handle sidebar toggle
    const handleSidebarToggle = useCallback(() => {
        if (!disableNavigation) {
            setSidebarOpen(prev => !prev);
        }
    }, [disableNavigation]);

    const handleSidebarClose = useCallback(() => {
        if (!disableNavigation) {
            setSidebarOpen(false);
        }
    }, [disableNavigation]);

    const handleSetActivePage = useCallback((page) => {
        console.log('Active page:', page);
    }, []);

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
                            Loading your workspace
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Please wait...
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
                            {(state.auth.currentUser?.accountType === 'organization' || state.auth.currentUser?.account_type === 'organization') && (
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

    // Normal page layout rendering
    return (
        <>
            <Head>
                <title>{pageTitle} - Assura</title>
            </Head>
            <div className="flex h-screen bg-background overflow-hidden">
                {/* Sidebar */}
                <AppSidebar
                    open={sidebarOpen}
                    onClose={handleSidebarClose}
                    activeModule={pathname.split('/')[1] || 'dashboard'}
                    onNavigate={() => { }}
                    disabled={disableNavigation}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <AppHeader
                        onMenuClick={handleSidebarToggle}
                        setShowBugForm={setShowBugForm}
                        setActivePage={handleSetActivePage}
                        onCreateDocument={onCreateDocument}
                        disabled={disableNavigation}
                    />

                    <NotificationCenter />

                    {needsUpgrade && (
                        <FeatureAccessBanner
                            message="Upgrade to Pro to unlock all features!"
                        />
                    )}

                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
                            {(toolbar || (requiresTestSuite && Array.isArray(state.suites.testSuites) && state.suites.testSuites.length > 0)) && (
                                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
                                            {requiresTestSuite && Array.isArray(state.suites.testSuites) && state.suites.testSuites.length > 0 && (
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800"
                                                    aria-label={`Number of test suites: ${state.suites.testSuites.length}`}
                                                >
                                                    {state.suites.testSuites.length} suite{state.suites.testSuites.length !== 1 ? 's' : ''}
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
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default PageLayout;