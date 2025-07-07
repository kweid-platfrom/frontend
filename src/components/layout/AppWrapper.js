// components/AppWrapper.js - Main App Layout Wrapper
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, useAppAuth, useAppSuites, useAppNavigation, useAppNotifications } from '../contexts/AppProvider';

// Component imports
import AppHeader from './layout/AppHeader';
import AppSidebar from './layout/AppSidebar';
import AppBreadcrumbs from './layout/AppBreadcrumbs';
import NotificationCenter from './notifications/NotificationCenter';
import UpgradePrompt from './subscription/UpgradePrompt';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorBoundary from './common/ErrorBoundary';
import TrialBanner from './subscription/TrialBanner';

// Main app wrapper component
const AppWrapper = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const app = useApp();
    const { isAuthenticated, user } = useAppAuth();
    const { activeSuite, suites } = useAppSuites();
    const { 
        activeModule, 
        breadcrumbs, 
        sidebarCollapsed, 
        setSidebarCollapsed, 
        navigateToModule 
    } = useAppNavigation();
    const { notifications } = useAppNotifications();
    
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    
    // Calculate unread notifications count
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Paths that don't need the full app layout
    const publicPaths = ['/login', '/register', '/verify-email', '/reset-password', '/'];
    const isPublicPath = publicPaths.includes(pathname);
    
    // Paths that need minimal layout (no sidebar)
    const minimalLayoutPaths = ['/settings', '/profile'];
    const isMinimalLayout = minimalLayoutPaths.includes(pathname);
    
    // Handle upgrade prompt display
    useEffect(() => {
        if (app.userCapabilities && !app.userCapabilities.hasActiveSubscription) {
            // Show upgrade prompt for certain features
            const shouldShowUpgrade = app.userCapabilities.isTrialActive && 
                                    app.userCapabilities.trialDaysRemaining < 7;
            setShowUpgradePrompt(shouldShowUpgrade);
        }
    }, [app.userCapabilities]);
    
    // Redirect logic for authenticated users
    useEffect(() => {
        if (isAuthenticated && isPublicPath && pathname !== '/') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isPublicPath, pathname, router]);
    
    // Show loading screen while app is initializing
    if (!app.isInitialized || app.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading your workspace...</p>
                </div>
            </div>
        );
    }
    
    // Show public layout for unauthenticated users
    if (!isAuthenticated || isPublicPath) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ErrorBoundary>
                    <NotificationCenter />
                    <div className="flex flex-col min-h-screen">
                        {children}
                    </div>
                </ErrorBoundary>
            </div>
        );
    }
    
    // Show minimal layout for specific pages
    if (isMinimalLayout) {
        return (
            <div className="min-h-screen bg-gray-50">
                <ErrorBoundary>
                    <NotificationCenter />
                    {app.userCapabilities?.isTrialActive && (
                        <TrialBanner 
                            daysRemaining={app.userCapabilities.trialDaysRemaining}
                            subscriptionType={app.subscription?.plan}
                        />
                    )}
                    <AppHeader 
                        user={user}
                        activeSuite={activeSuite}
                        notificationCount={unreadCount}
                        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
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
    
    // Show full app layout with sidebar
    return (
        <div className="min-h-screen bg-gray-50">
            <ErrorBoundary>
                <NotificationCenter />
                
                {/* Trial Banner */}
                {app.userCapabilities?.isTrialActive && (
                    <TrialBanner 
                        daysRemaining={app.userCapabilities.trialDaysRemaining}
                        subscriptionType={app.subscription?.plan}
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
                                <Suspense fallback={<LoadingSpinner />}>
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
                    />
                )}
            </ErrorBoundary>
        </div>
    );
};

export default AppWrapper;