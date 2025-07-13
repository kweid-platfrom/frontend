// components/AppWrapper.js - Enhanced Main App Layout Wrapper
'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, useAppAuth, useAppSuites, useAppNavigation, useAppNotifications } from '../../contexts/AppProvider';

// Component imports
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppBreadcrumbs from './AppBreadcrumbs';
import NotificationCenter from '../notifications/NotificationCenter';
import UpgradePrompt from '../subscription/UpgradePrompt';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import TrialBanner from '../subscription/TrialBanner';

// Constants
const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/reset-password', '/'];
const MINIMAL_LAYOUT_PATHS = ['/settings', '/profile'];
const PROTECTED_PATHS = ['/dashboard', '/bugs', '/testcases', '/recordings', '/automation', '/reports'];

// Main app wrapper component
const AppWrapper = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const app = useApp();
    const { isAuthenticated, user, loading: authLoading, error: authError } = useAppAuth();
    const { activeSuite, suites, error: suitesError } = useAppSuites();
    const {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule
    } = useAppNavigation();
    const { notifications, addNotification } = useAppNotifications();

    // Local state
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    // Derived state
    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    const isMinimalLayout = MINIMAL_LAYOUT_PATHS.includes(pathname);
    const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
    const unreadCount = notifications.filter(n => !n.read).length;

    // Retry mechanism - defined first to avoid circular dependency
    const handleRetry = useCallback(async () => {
        setIsRetrying(true);
        try {
            await app.refreshAll();
            addNotification({
                type: 'success',
                title: 'Retry Successful',
                message: 'Application data has been refreshed.'
            });
            setRetryCount(0);
        } catch (error) {
            // Handle retry error directly here to avoid circular dependency
            console.error('AppWrapper retry error:', error);
            addNotification({
                type: 'error',
                title: 'Retry Failed',
                message: error?.message || 'Failed to refresh application data',
                persistent: true
            });
        } finally {
            setIsRetrying(false);
        }
    }, [app, addNotification]);

    // Error handling with retry logic - defined after handleRetry
    const handleError = useCallback((error, context = 'application') => {
        console.error(`AppWrapper ${context} error:`, error);
        
        const errorMessage = error?.message || 'An unexpected error occurred';
        const isRetryable = error?.retryable || 
            ['unavailable', 'deadline-exceeded', 'aborted'].includes(error?.code);

        addNotification({
            type: 'error',
            title: `${context.charAt(0).toUpperCase() + context.slice(1)} Error`,
            message: errorMessage,
            persistent: !isRetryable,
            action: isRetryable && retryCount < 3 ? {
                label: 'Retry',
                onClick: handleRetry
            } : undefined
        });

        if (isRetryable && retryCount < 3) {
            setRetryCount(prev => prev + 1);
        }
    }, [addNotification, handleRetry, retryCount]);

    // Handle authentication errors
    useEffect(() => {
        if (authError) {
            handleError(authError, 'authentication');
        }
    }, [authError, handleError]);

    // Handle suites errors
    useEffect(() => {
        if (suitesError) {
            handleError(suitesError, 'test suites');
        }
    }, [suitesError, handleError]);

    // Handle general app errors
    useEffect(() => {
        if (app.error) {
            handleError(app.error, 'application');
        }
    }, [app.error, handleError]);

    // Enhanced upgrade prompt logic
    useEffect(() => {
        if (app.userCapabilities && isAuthenticated) {
            const { isTrialActive, trialDaysRemaining, hasActiveSubscription } = app.userCapabilities;
            
            // Show upgrade prompt based on trial status and usage
            const shouldShowUpgrade = !hasActiveSubscription && (
                (isTrialActive && trialDaysRemaining <= 7) ||
                (!isTrialActive && !hasActiveSubscription)
            );

            setShowUpgradePrompt(shouldShowUpgrade);

            // Show trial warning notifications
            if (isTrialActive) {
                if (trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
                    addNotification({
                        type: 'warning',
                        title: 'Trial Ending Soon',
                        message: `Your trial expires in ${trialDaysRemaining} day${trialDaysRemaining > 1 ? 's' : ''}. Upgrade to continue using all features.`,
                        persistent: true,
                        action: {
                            label: 'Upgrade Now',
                            onClick: () => router.push('/upgrade')
                        }
                    });
                } else if (trialDaysRemaining === 0) {
                    addNotification({
                        type: 'error',
                        title: 'Trial Expired',
                        message: 'Your trial has expired. Upgrade to continue using premium features.',
                        persistent: true,
                        action: {
                            label: 'Upgrade Now',
                            onClick: () => router.push('/upgrade')
                        }
                    });
                }
            }
        }
    }, [app.userCapabilities, isAuthenticated, addNotification, router]);

    // Enhanced redirect logic with error handling
    useEffect(() => {
        // Don't redirect while auth is loading or during retry
        if (authLoading || isRetrying) return;

        try {
            // Handle authenticated users on public paths
            if (isAuthenticated && isPublicPath && pathname !== '/') {
                const targetPath = localStorage.getItem('redirectAfterAuth') || '/dashboard';
                localStorage.removeItem('redirectAfterAuth');
                router.replace(targetPath);
                return;
            }

            // Handle unauthenticated users on protected paths
            if (!isAuthenticated && !isPublicPath && !authLoading) {
                // Store intended destination
                if (isProtectedPath) {
                    localStorage.setItem('redirectAfterAuth', pathname);
                }
                router.replace('/login');
                return;
            }
        } catch (error) {
            handleError(error, 'navigation');
        }
    }, [isAuthenticated, authLoading, isPublicPath, isProtectedPath, pathname, router, isRetrying, handleError]);

    // Loading state management
    const shouldShowLoading = authLoading || (isAuthenticated && !app.isInitialized) || isRetrying;

    if (shouldShowLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">
                        {authLoading ? 'Checking authentication...' : 
                         isRetrying ? 'Retrying connection...' : 
                         'Loading your workspace...'}
                    </p>
                    {retryCount > 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                            Attempt {retryCount} of 3
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Show initialization loading for authenticated users
    if (isAuthenticated && app.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading your workspace...</p>
                    <div className="mt-4 space-y-2">
                        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-sm text-gray-500">
                            Setting up your environment...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Public layout for unauthenticated users
    if (!isAuthenticated || isPublicPath) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ErrorBoundary
                    fallback={
                        <div className="min-h-screen flex items-center justify-center">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                    Something went wrong
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    We&apos;re having trouble loading the page. Please try again.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    }
                >
                    <NotificationCenter />
                    <div className="flex flex-col min-h-screen">
                        <Suspense fallback={<LoadingSpinner />}>
                            {children}
                        </Suspense>
                    </div>
                </ErrorBoundary>
            </div>
        );
    }

    // Minimal layout for settings and profile pages
    if (isMinimalLayout) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ErrorBoundary>
                    <NotificationCenter />
                    
                    {/* Trial Banner */}
                    {app.userCapabilities?.isTrialActive && (
                        <TrialBanner
                            daysRemaining={app.userCapabilities.trialDaysRemaining}
                            subscriptionType={app.subscription?.plan}
                            onUpgradeClick={() => router.push('/upgrade')}
                        />
                    )}

                    {/* Header */}
                    <AppHeader
                        user={user}
                        activeSuite={activeSuite}
                        notificationCount={unreadCount}
                        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        userCapabilities={app.userCapabilities}
                    />

                    {/* Main Content */}
                    <main className="flex-1 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <Suspense fallback={<LoadingSpinner />}>
                                {children}
                            </Suspense>
                        </div>
                    </main>
                </ErrorBoundary>
            </div>
        );
    }

    // Full app layout with sidebar
    return (
        <div className="min-h-screen bg-gray-50">
            <ErrorBoundary>
                <NotificationCenter />

                {/* Trial Banner */}
                {app.userCapabilities?.isTrialActive && (
                    <TrialBanner
                        daysRemaining={app.userCapabilities.trialDaysRemaining}
                        subscriptionType={app.subscription?.plan}
                        onUpgradeClick={() => router.push('/upgrade')}
                    />
                )}

                {/* Main App Layout */}
                <div className="flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <AppSidebar
                        open={!sidebarCollapsed}
                        onClose={() => setSidebarCollapsed(true)}
                        user={user}
                        activeSuite={activeSuite}
                        suites={suites}
                        userCapabilities={app.userCapabilities}
                        subscription={app.subscription}
                        currentPath={pathname}
                        activeModule={activeModule}
                        onNavigate={navigateToModule}
                        onError={(error) => handleError(error, 'sidebar')}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header */}
                        <AppHeader
                            user={user}
                            activeSuite={activeSuite}
                            notificationCount={unreadCount}
                            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            onSuiteChange={app.setActiveSuite}
                            suites={suites}
                            userCapabilities={app.userCapabilities}
                            onError={(error) => handleError(error, 'header')}
                        />

                        {/* Breadcrumbs */}
                        <AppBreadcrumbs
                            breadcrumbs={breadcrumbs}
                            canGoBack={breadcrumbs.length > 1}
                            onGoBack={() => window.history.back()}
                        />

                        {/* Main Content */}
                        <main className="flex-1 overflow-y-auto bg-white">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                <Suspense 
                                    fallback={
                                        <div className="flex items-center justify-center py-12">
                                            <LoadingSpinner />
                                        </div>
                                    }
                                >
                                    {children}
                                </Suspense>
                            </div>
                        </main>
                    </div>
                </div>

                {/* Upgrade Prompt Modal */}
                {showUpgradePrompt && (
                    <UpgradePrompt
                        isOpen={showUpgradePrompt}
                        onClose={() => setShowUpgradePrompt(false)}
                        subscription={app.subscription}
                        userCapabilities={app.userCapabilities}
                        onError={(error) => handleError(error, 'upgrade prompt')}
                    />
                )}
            </ErrorBoundary>
        </div>
    );
};

export default AppWrapper;