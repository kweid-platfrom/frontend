/* eslint-disable @typescript-eslint/no-unused-vars */
// components/AppWrapper.js - Main App Layout Wrapper
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, useAppAuth, useAppSuite, useAppNavigation, useAppNotifications } from './AppProvider';

// Component imports (you'll need to create or import these)
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
    const app = useApp();
    const { isAuthenticated, user } = useAppAuth();
    const { activeSuite } = useAppSuite();
    const { currentPath } = useAppNavigation();
    const { notifications, unreadCount } = useAppNotifications();
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    
    // Paths that don't need the full app layout
    const publicPaths = ['/login', '/register', '/verify-email', '/reset-password', '/'];
    const isPublicPath = publicPaths.includes(currentPath);
    
    // Paths that need minimal layout (no sidebar)
    const minimalLayoutPaths = ['/settings', '/profile'];
    const isMinimalLayout = minimalLayoutPaths.includes(currentPath);
    
    // Handle upgrade prompt display
    useEffect(() => {
        if (app.subscriptionInfo?.shouldShowUpgradePrompts?.general) {
            setShowUpgradePrompt(true);
        }
    }, [app.subscriptionInfo?.shouldShowUpgradePrompts]);
    
    // Redirect logic for authenticated users
    useEffect(() => {
        if (isAuthenticated && isPublicPath && currentPath !== '/') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isPublicPath, currentPath, router]);
    
    // Show loading screen while app is initializing
    if (!app.isAppReady) {
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
                    {app.subscriptionInfo?.showTrialBanner && (
                        <TrialBanner 
                            daysRemaining={app.subscriptionInfo.trialDaysRemaining}
                            subscriptionType={app.subscriptionInfo.type}
                        />
                    )}
                    <AppHeader 
                        user={user}
                        activeSuite={activeSuite}
                        notificationCount={unreadCount}
                        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
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
                {app.subscriptionInfo?.showTrialBanner && (
                    <TrialBanner 
                        daysRemaining={app.subscriptionInfo.trialDaysRemaining}
                        subscriptionType={app.subscriptionInfo.type}
                    />
                )}
                
                {/* Main App Layout */}
                <div className="flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <AppSidebar 
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        user={user}
                        activeSuite={activeSuite}
                        suites={app.suites}
                        userCapabilities={app.userCapabilities}
                        subscriptionInfo={app.subscriptionInfo}
                        currentPath={currentPath}
                    />
                    
                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Header */}
                        <AppHeader 
                            user={user}
                            activeSuite={activeSuite}
                            notificationCount={unreadCount}
                            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                            onSuiteChange={app.actions.setActiveSuite}
                            suites={app.suites}
                        />
                        
                        {/* Breadcrumbs */}
                        <AppBreadcrumbs 
                            breadcrumbs={app.navigationState.breadcrumbs}
                            canGoBack={app.navigationState.canGoBack}
                            onGoBack={app.actions.goBack}
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
                        subscriptionInfo={app.subscriptionInfo}
                        userCapabilities={app.userCapabilities}
                    />
                )}
            </ErrorBoundary>
        </div>
    );
};

export default AppWrapper;
