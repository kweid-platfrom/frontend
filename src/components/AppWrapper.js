'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, useAppNavigation, useAppNotifications } from '../contexts/AppProvider';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorBoundary from './common/ErrorBoundary';
import NotificationCenter from './notifications/NotificationCenter';
import AppHeader from './layout/AppHeader';
import AppSidebar from './layout/AppSidebar';
import AppBreadcrumbs from './layout/AppBreadcrumbs';
import TrialBanner from './subscription/TrialBanner';
import UpgradePrompt from './subscription/UpgradePrompt';

// Public pages that don't require authentication
const PUBLIC_PAGES = ['/', '/login', '/register', '/verify-email', '/reset-password', '/forgot-password'];
const MINIMAL_LAYOUT_PATHS = ['/settings', '/profile'];
const NO_AUTH_CHECK_PAGES = ['/login', '/register'];

// Utility to debounce a function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Error display component
const ErrorDisplay = ({ error, onRetry, canRetry }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
                <p className="text-gray-600 mb-6">{error || 'An unexpected error occurred.'}</p>
                {canRetry && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    </div>
);

const AppWrapper = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const {
        isAuthenticated,
        currentUser,
        loading: authLoading,
        authError,
        userProfile,
        isInitialized,
        isLoading: appLoading,
        error: appError,
        accountSummary,
        userCapabilities,
        suites,
        activeSuite,
        setActiveSuite,
        refreshAll,
        clearError,
    } = useApp();
    const {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
    } = useAppNavigation();
    const { notifications, addNotification } = useAppNotifications();

    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const isPublicPage = useMemo(() => PUBLIC_PAGES.includes(pathname), [pathname]);
    const isMinimalLayout = useMemo(() => MINIMAL_LAYOUT_PATHS.includes(pathname), [pathname]);
    const skipAuthCheck = useMemo(() => NO_AUTH_CHECK_PAGES.includes(pathname), [pathname]);
    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

    // Retry mechanism
    const handleRetry = useCallback(async () => {
        setIsRetrying(true);
        try {
            await refreshAll();
            addNotification({
                type: 'success',
                title: 'Retry Successful',
                message: 'Application data has been refreshed.',
            });
            setRetryCount(0);
            clearError();
        } catch (error) {
            console.error('AppWrapper retry error:', error);
            addNotification({
                type: 'error',
                title: 'Retry Failed',
                message: error?.message || 'Failed to refresh application data',
                persistent: true,
            });
        } finally {
            setIsRetrying(false);
        }
    }, [refreshAll, addNotification, clearError]);

    // Error handling
    const handleError = useCallback(
        (error, context = 'application') => {
            console.error(`AppWrapper ${context} error:`, error);
            const errorMessage = error?.message || 'An unexpected error occurred';
            const isRetryable =
                error?.retryable ||
                ['unavailable', 'deadline-exceeded', 'aborted'].includes(error?.code);

            addNotification({
                type: 'error',
                title: `${context.charAt(0).toUpperCase() + context.slice(1)} Error`,
                message: errorMessage,
                persistent: !isRetryable,
                action: isRetryable && retryCount < 3 ? { label: 'Retry', onClick: handleRetry } : undefined,
            });

            if (isRetryable && retryCount < 3) {
                setRetryCount((prev) => prev + 1);
            }
        },
        [addNotification, handleRetry, retryCount],
    );

    // Handle authentication errors
    useEffect(() => {
        if (authError) handleError(authError, 'authentication');
    }, [authError, handleError]);

    // Handle general app errors
    useEffect(() => {
        if (appError) handleError(appError, 'application');
    }, [appError, handleError]);

    // Authentication guard and redirect
    useEffect(() => {
        const handleAuthRedirect = debounce(() => {
            if (!isPublicPage && isInitialized && !isAuthenticated && !authLoading && !skipAuthCheck) {
                const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0', 10);
                if (redirectCount > 2) {
                    console.warn('Redirect loop detected. Stopping redirect to login.');
                    addNotification({
                        type: 'error',
                        title: 'Redirect Error',
                        message: 'Too many redirects. Please try logging in again.',
                        persistent: true,
                    });
                    return;
                }

                localStorage.setItem('redirectCount', (redirectCount + 1).toString());
                localStorage.setItem('redirectAfterAuth', pathname);
                router.replace('/login');
            } else if (
                isPublicPage &&
                isInitialized &&
                isAuthenticated &&
                currentUser &&
                currentUser.emailVerified &&
                !skipAuthCheck
            ) {
                const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0', 10);
                if (redirectCount > 2) {
                    console.warn('Redirect loop detected. Stopping redirect.');
                    addNotification({
                        type: 'error',
                        title: 'Redirect Error',
                        message: 'Too many redirects. Please try refreshing the page.',
                        persistent: true,
                    });
                    return;
                }

                const redirectTo = localStorage.getItem('redirectAfterAuth') || '/dashboard';
                localStorage.setItem('redirectCount', (redirectCount + 1).toString());
                localStorage.removeItem('redirectAfterAuth');
                addNotification({
                    type: 'info',
                    title: 'Already Signed In',
                    message: 'You are already signed in. Redirecting to your dashboard.',
                    persistent: false,
                });
                router.replace(redirectTo);
            } else {
                localStorage.setItem('redirectCount', '0');
            }
        }, 300);

        if (typeof window !== 'undefined') {
            handleAuthRedirect();
        }
    }, [
        isPublicPage,
        isInitialized,
        isAuthenticated,
        authLoading,
        currentUser,
        pathname,
        router,
        addNotification,
        skipAuthCheck,
    ]);

    // Upgrade prompt logic
    useEffect(() => {
        if (userCapabilities && isAuthenticated && !isPublicPage) {
            const { isTrialActive, trialDaysRemaining, hasActiveSubscription } = userCapabilities;
            const shouldShowUpgrade =
                !hasActiveSubscription &&
                ((isTrialActive && trialDaysRemaining <= 7) || (!isTrialActive && !hasActiveSubscription));

            setShowUpgradePrompt(shouldShowUpgrade);

            if (isTrialActive) {
                if (trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
                    addNotification({
                        type: 'warning',
                        title: 'Trial Ending Soon',
                        message: `Your trial expires in ${trialDaysRemaining} day${
                            trialDaysRemaining > 1 ? 's' : ''
                        }.`,
                        persistent: true,
                        action: { label: 'Upgrade Now', onClick: () => router.push('/upgrade') },
                    });
                } else if (trialDaysRemaining === 0) {
                    addNotification({
                        type: 'error',
                        title: 'Trial Expired',
                        message: 'Your trial has expired. Upgrade to continue using premium features.',
                        persistent: true,
                        action: { label: 'Upgrade Now', onClick: () => router.push('/upgrade') },
                    });
                }
            }
        }
    }, [userCapabilities, isAuthenticated, isPublicPage, addNotification, router]);

    // Loading state
    const shouldShowLoading = useMemo(
        () =>
            skipAuthCheck
                ? false
                : isPublicPage
                ? false
                : authLoading ||
                  (isAuthenticated && !isInitialized) ||
                  (isAuthenticated && appLoading) ||
                  isRetrying,
        [skipAuthCheck, isPublicPage, authLoading, isAuthenticated, isInitialized, appLoading, isRetrying],
    );

    if (shouldShowLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">
                        {authLoading
                            ? 'Authenticating...'
                            : !isInitialized
                            ? 'Initializing workspace...'
                            : appLoading
                            ? 'Loading your data...'
                            : isRetrying
                            ? 'Retrying connection...'
                            : 'Loading...'}
                    </p>
                    {retryCount > 0 && (
                        <p className="mt-2 text-sm text-gray-500">Attempt {retryCount} of 3</p>
                    )}
                </div>
            </div>
        );
    }

    // Error state
    if (appError && !isPublicPage) {
        return <ErrorDisplay error={appError} onRetry={handleRetry} canRetry={retryCount < 3} />;
    }

    // Public page layout
    if (isPublicPage) {
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    }
                >
                    <NotificationCenter />
                    <div className="flex flex-col min-h-screen">
                        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
                    </div>
                </ErrorBoundary>
            </div>
        );
    }

    // Minimal layout for authenticated settings/profile pages
    if (isMinimalLayout) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ErrorBoundary>
                    <NotificationCenter />
                    {userCapabilities?.isTrialActive && (
                        <TrialBanner
                            daysRemaining={userCapabilities.trialDaysRemaining || 0}
                            subscriptionType={accountSummary?.subscription?.plan || 'individual_free'}
                            onUpgradeClick={() => router.push('/upgrade')}
                        />
                    )}
                    <AppHeader
                        user={currentUser}
                        userProfile={userProfile}
                        activeSuite={activeSuite}
                        notificationCount={unreadCount}
                        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        userCapabilities={userCapabilities || {}}
                        accountSummary={accountSummary || {}}
                    />
                    <main className="flex-1 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
                        </div>
                    </main>
                </ErrorBoundary>
            </div>
        );
    }

    // Full authenticated layout
    return (
        <div className="min-h-screen bg-gray-50">
            <ErrorBoundary>
                <NotificationCenter />
                {userCapabilities?.isTrialActive && (
                    <TrialBanner
                        daysRemaining={userCapabilities.trialDaysRemaining || 0}
                        subscriptionType={accountSummary?.subscription?.plan || 'individual_free'}
                        onUpgradeClick={() => router.push('/upgrade')}
                    />
                )}
                <div className="flex h-screen overflow-hidden">
                    <AppSidebar
                        open={!sidebarCollapsed}
                        onClose={() => setSidebarCollapsed(true)}
                        user={currentUser}
                        userProfile={userProfile}
                        activeSuite={activeSuite}
                        suites={suites || []}
                        userCapabilities={userCapabilities || {}}
                        subscription={accountSummary?.subscription || {}}
                        currentPath={pathname}
                        activeModule={activeModule}
                        onNavigate={navigateToModule}
                        onError={(error) => handleError(error, 'sidebar')}
                        accountSummary={accountSummary || {}}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <AppHeader
                            user={currentUser}
                            userProfile={userProfile}
                            activeSuite={activeSuite}
                            notificationCount={unreadCount}
                            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            onSuiteChange={setActiveSuite}
                            suites={suites || []}
                            userCapabilities={userCapabilities || {}}
                            onError={(error) => handleError(error, 'header')}
                            accountSummary={accountSummary || {}}
                        />
                        <AppBreadcrumbs
                            breadcrumbs={breadcrumbs || []}
                            canGoBack={breadcrumbs?.length > 1}
                            onGoBack={() => window.history.back()}
                        />
                        <main className="flex-1 overflow-y-auto bg-white">
                            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {showUpgradePrompt && (
                    <UpgradePrompt
                        isOpen={showUpgradePrompt}
                        onClose={() => setShowUpgradePrompt(false)}
                        subscription={accountSummary?.subscription || {}}
                        userCapabilities={userCapabilities || {}}
                        onError={(error) => handleError(error, 'upgrade prompt')}
                    />
                )}
            </ErrorBoundary>
        </div>
    );
};

export default AppWrapper;