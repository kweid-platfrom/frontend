'use client'
import { useState, Suspense, lazy, memo, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import Header from './header';
import Sidebar from './sidebar'; // Remove lazy loading for critical navigation
import '../../app/globals.css';

// Only lazy load heavy components and onboarding
const CreateProjectOnboarding = lazy(() => import('../onboarding/ProjectCreationForm'));

// Lazy load page components
const DashboardPage = lazy(() => import('../../pages/dashboard/DashboardPage'));
const BugTrackerPage = lazy(() => import('../../pages/dashboard/BugTrackerPage'));
const TestScriptsPage = lazy(() => import('../../pages/dashboard/TestScriptsPage'));
const AutoScriptsPage = lazy(() => import('../../pages/dashboard/AutoScriptsPage'));
const ReportsPage = lazy(() => import('../../pages/dashboard/ReportsPage'));
const RecordingsPage = lazy(() => import('../../pages/dashboard/RecordingsPage'));
const SettingsPage = lazy(() => import('../../pages/dashboard/SettingsPage'));
const CreateProjectPage = lazy(() => import('../modals/CreateProjectModal'));
const UpgradePage = lazy(() => import('../../pages/dashboard/UpgradePage'));

// Optimized loading skeleton component
const LoadingSkeleton = memo(() => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your workspace...</p>
        </div>
    </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// Page content loading fallback
const PageLoadingFallback = memo(() => (
    <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
    </div>
));
PageLoadingFallback.displayName = 'PageLoadingFallback';

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState('dashboard');
    const { needsOnboarding, isLoading } = useProject();
    
    // Memoize callbacks to prevent unnecessary re-renders
    const handleMenuClick = useCallback(() => setSidebarOpen(true), []);
    const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
    
    // Show loading state immediately
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    // Handle onboarding with lazy loading
    if (needsOnboarding) {
        return (
            <Suspense fallback={<LoadingSkeleton />}>
                <CreateProjectOnboarding />
            </Suspense>
        );
    }

    // Function to render the active page content
    const renderPageContent = () => {
        // If children are passed, render them (for specific pages)
        if (children) {
            return (
                <Suspense fallback={<PageLoadingFallback />}>
                    {children}
                </Suspense>
            );
        }

        // Otherwise, render based on activePage state
        switch (activePage) {
            case 'dashboard':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <DashboardPage />
                    </Suspense>
                );
            case 'bug-tracker':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <BugTrackerPage />
                    </Suspense>
                );
            case 'test-scripts':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <TestScriptsPage />
                    </Suspense>
                );
            case 'auto-scripts':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <AutoScriptsPage />
                    </Suspense>
                );
            case 'reports':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <ReportsPage />
                    </Suspense>
                );
            case 'recordings':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <RecordingsPage />
                    </Suspense>
                );
            case 'settings':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <SettingsPage />
                    </Suspense>
                );
            case 'create-project':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <CreateProjectPage />
                    </Suspense>
                );
            case 'upgrade':
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <UpgradePage />
                    </Suspense>
                );
            default:
                return (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <DashboardPage />
                    </Suspense>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Load immediately, no lazy loading */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={handleSidebarClose}
                activePage={activePage}
                setActivePage={setActivePage}
            />

            {/* Main Content - Load immediately */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Keep immediate loading for critical UI */}
                <Header 
                    onMenuClick={handleMenuClick}
                    activePage={activePage}
                />

                {/* Main Content Area with optimized rendering */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {renderPageContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;