'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense, memo, lazy } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, useAppNavigation, useAppNotifications, useAppFeatures } from '../contexts/AppProvider';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorBoundary from './common/ErrorBoundary';
import NotificationCenter from './notifications/NotificationCenter';
import AppHeader from './layout/AppHeader';
import AppBreadcrumbs from './layout/AppBreadcrumbs';

// Lazy load heavy components
const AppSidebar = lazy(() => import('./layout/AppSidebar'));
const TrialBanner = lazy(() => import('./subscription/TrialBanner'));
const UpgradePrompt = lazy(() => import('./subscription/UpgradePrompt'));

// Public pages that don't require authentication
const PUBLIC_PAGES = new Set(['/', '/login', '/register', '/verify-email', '/reset-password', '/forgot-password']);
const MINIMAL_LAYOUT_PATHS = new Set(['/settings', '/profile']);
const NO_AUTH_CHECK_PAGES = new Set(['/login', '/register']);

// Optimized debounce with cleanup
const debounce = (func, wait) => {
    let timeout;
    const debounced = (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
};

// Memoized error display component
const ErrorDisplay = memo(({ error, onRetry, canRetry }) => (
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
));

ErrorDisplay.displayName = 'ErrorDisplay';

// Optimized loading component with progressive states
const LoadingState = memo(({ 
    authLoading, 
    appLoading, 
    isRetrying, 
    retryCount, 
    isInitializing = false 
}) => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const getMessage = () => {
        if (authLoading) return `Authenticating${dots}`;
        if (isInitializing) return `Initializing workspace${dots}`;
        if (appLoading) return `Loading suites${dots}`;
        if (isRetrying) return `Retrying connection${dots}`;
        return `Loading${dots}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">{getMessage()}</p>
                {retryCount > 0 && (
                    <p className="mt-2 text-sm text-gray-500">Attempt {retryCount} of 3</p>
                )}
            </div>
        </div>
    );
});

LoadingState.displayName = 'LoadingState';

const AppWrapper = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const {
        isAuthenticated,
        user,
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
        switchSuite,
        refetchSuites,
        clearError,
        subscriptionStatus,
    } = useApp();
    const {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
    } = useAppNavigation();
    const { notifications, addNotification } = useAppNotifications();
    const { featureFlags } = useAppFeatures();

    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const isPublicPage = useMemo(() => PUBLIC_PAGES.has(pathname), [pathname]);
    const isMinimalLayout = useMemo(() => MINIMAL_LAYOUT_PATHS.has(pathname), [pathname]);
    const skipAuthCheck = useMemo(() => NO_AUTH_CHECK_PAGES.has(pathname), [pathname]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const pageType = useMemo(() => {
        if (isPublicPage) return 'public';
        if (isMinimalLayout) return 'minimal';
        return 'full';
    }, [isPublicPage, isMinimalLayout]);

    const loadingState = useMemo(() => {
        if (skipAuthCheck) return null;
        if (isPublicPage) return null;
        
        const conditions = [
            authLoading,
            isAuthenticated && !isInitialized,
            isAuthenticated && appLoading,
            isRetrying,
            isInitializing && isAuthenticated
        ];
        
        return conditions.some(Boolean) ? {
            authLoading,
            appLoading,
            isRetrying,
            retryCount,
            isInitializing: isInitializing && isAuthenticated
        } : null;
    }, [skipAuthCheck, isPublicPage, authLoading, isAuthenticated, isInitialized, appLoading, isRetrying, isInitializing, retryCount]);

    const handleRetry = useCallback(async () => {
        if (retryCount >= 3) return;
        setIsRetrying(true);
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        
        try {
            await new Promise(resolve => setTimeout(resolve, delay));
            await refetchSuites({ forceRefresh: true });
            addNotification({
                type: 'success',
                title: 'Data Refreshed',
                message: 'Suite data has been successfully refreshed.',
            });
            setRetryCount(0);
            clearError();
        } catch (error) {
            console.error('AppWrapper retry error:', error);
            addNotification({
                type: 'error',
                title: 'Retry Failed',
                message: error?.message || 'Failed to refresh suite data',
                persistent: true,
            });
            setRetryCount(prev => prev + 1);
        } finally {
            setIsRetrying(false);
        }
    }, [refetchSuites, addNotification, clearError, retryCount]);

    const handleError = useCallback(
        (error, context = 'application') => {
            console.error(`AppWrapper ${context} error:`, error);
            const errorMessage = error?.message || 'An unexpected error occurred';
            const isRetryable = error?.retryable || ['unavailable', 'deadline-exceeded', 'aborted'].includes(error?.code);

            addNotification({
                type: 'error',
                title: `${context.charAt(0).toUpperCase() + context.slice(1)} Error`,
                message: errorMessage,
                persistent: !isRetryable,
                action: isRetryable && retryCount < 3 ? { label: 'Retry', onClick: handleRetry } : undefined,
            });
        },
        [addNotification, handleRetry, retryCount],
    );

    useEffect(() => {
        if (authError) handleError(authError, 'authentication');
    }, [authError, handleError]);

    useEffect(() => {
        if (appError) handleError(appError, 'application');
    }, [appError, handleError]);

    useEffect(() => {
        const handleAuthRedirect = debounce(() => {
            if (!isPublicPage && isInitialized && !isAuthenticated && !authLoading && !skipAuthCheck) {
                const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0', 10);
                if (redirectCount > 2) {
                    console.warn('Redirect loop detected.');
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
            } else if (isPublicPage && isInitialized && isAuthenticated && user?.emailVerified && !skipAuthCheck) {
                const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0', 10);
                if (redirectCount > 2) {
                    console.warn('Redirect loop detected.');
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
                    title: 'Authenticated',
                    message: 'Redirecting to your dashboard.',
                });
                router.replace(redirectTo);
            } else {
                localStorage.setItem('redirectCount', '0');
            }
        }, 300);

        handleAuthRedirect();
        return () => handleAuthRedirect.cancel();
    }, [isPublicPage, isInitialized, isAuthenticated, authLoading, user, pathname, router, addNotification, skipAuthCheck]);

    useEffect(() => {
        if (!userCapabilities || !isAuthenticated || isPublicPage) return;

        const { hasActiveSubscription, isTrialActive, trialDaysRemaining } = userCapabilities;

        setShowUpgradePrompt(!hasActiveSubscription && (!isTrialActive || trialDaysRemaining <= 7));

        if (isTrialActive && trialDaysRemaining <= 7) {
            const notificationKey = `trial-warning-${trialDaysRemaining}`;
            if (trialDaysRemaining > 0) {
                addNotification({
                    id: notificationKey,
                    type: 'warning',
                    title: 'Trial Ending Soon',
                    message: `Your trial expires in ${trialDaysRemaining} day${trialDaysRemaining > 1 ? 's' : ''}.`,
                    persistent: true,
                    action: { label: 'Upgrade Now', onClick: () => router.push('/upgrade') },
                });
            } else {
                addNotification({
                    id: 'trial-expired',
                    type: 'error',
                    title: 'Trial Expired',
                    message: 'Your trial has expired. Upgrade to continue using premium features.',
                    persistent: true,
                    action: { label: 'Upgrade Now', onClick: () => router.push('/upgrade') },
                });
            }
        }
    }, [userCapabilities, isAuthenticated, isPublicPage, addNotification, router]);

    useEffect(() => {
        if (isInitialized && isAuthenticated) {
            const timer = setTimeout(() => setIsInitializing(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, isAuthenticated]);

    if (loadingState) {
        return <LoadingState {...loadingState} />;
    }

    if (appError && !isPublicPage) {
        return <ErrorDisplay error={appError} onRetry={handleRetry} canRetry={retryCount < 3} />;
    }

    const renderLayout = () => {
        switch (pageType) {
            case 'public':
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
                                            className="px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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

            case 'minimal':
                return (
                    <div className="min-h-screen bg-gray-50">
                        <ErrorBoundary>
                            <NotificationCenter />
                            <Suspense fallback={<div className="h-2" />}>
                                {subscriptionStatus?.showTrialBanner && (
                                    <TrialBanner
                                        daysRemaining={userCapabilities?.trialDaysRemaining || 0}
                                        subscriptionType={subscriptionStatus?.plan || 'individual_free'}
                                        onUpgradeClick={() => router.push('/upgrade')}
                                    />
                                )}
                            </Suspense>
                            <AppHeader
                                user={user}
                                userProfile={userProfile}
                                activeSuite={activeSuite}
                                notificationCount={unreadCount}
                                onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                userCapabilities={userCapabilities || {}}
                                accountSummary={accountSummary || {}}
                                featureFlags={featureFlags}
                            />
                            <main className="flex-1 bg-white">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                                    <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
                                </div>
                            </main>
                        </ErrorBoundary>
                    </div>
                );

            default:
                return (
                    <div className="min-h-screen bg-gray-50">
                        <ErrorBoundary>
                            <NotificationCenter />
                            <Suspense fallback={<div className="h-2" />}>
                                {subscriptionStatus?.showTrialBanner && (
                                    <TrialBanner
                                        daysRemaining={userCapabilities?.trialDaysRemaining || 0}
                                        subscriptionType={subscriptionStatus?.plan || 'individual_free'}
                                        onUpgradeClick={() => router.push('/upgrade')}
                                    />
                                )}
                            </Suspense>
                            <div className="flex h-screen overflow-hidden">
                                <Suspense fallback={<div className="w-64 bg-gray-900" />}>
                                    <AppSidebar
                                        open={!sidebarCollapsed}
                                        onClose={() => setSidebarCollapsed(true)}
                                        user={user}
                                        userProfile={userProfile}
                                        activeSuite={activeSuite}
                                        suites={suites || []}
                                        userCapabilities={userCapabilities || {}}
                                        subscription={subscriptionStatus || {}}
                                        currentPath={pathname}
                                        activeModule={activeModule}
                                        onNavigate={navigateToModule}
                                        onError={(error) => handleError(error, 'sidebar')}
                                        accountSummary={accountSummary || {}}
                                        featureFlags={featureFlags}
                                    />
                                </Suspense>
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <AppHeader
                                        user={user}
                                        userProfile={userProfile}
                                        activeSuite={activeSuite}
                                        notificationCount={unreadCount}
                                        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        onSuiteChange={switchSuite}
                                        suites={suites || []}
                                        userCapabilities={userCapabilities || {}}
                                        onError={(error) => handleError(error, 'header')}
                                        accountSummary={accountSummary || {}}
                                        featureFlags={featureFlags}
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
                            <Suspense fallback={null}>
                                {showUpgradePrompt && (
                                    <UpgradePrompt
                                        isOpen={showUpgradePrompt}
                                        onClose={() => setShowUpgradePrompt(false)}
                                        subscription={subscriptionStatus || {}}
                                        userCapabilities={userCapabilities || {}}
                                        onError={(error) => handleError(error, 'upgrade prompt')}
                                        featureFlags={featureFlags}
                                    />
                                )}
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                );
        }
    };

    return renderLayout();
};

export default AppWrapper;