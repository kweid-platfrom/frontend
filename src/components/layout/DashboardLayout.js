'use client'
import { useState, Suspense, lazy } from 'react';
import { useProject } from '../../context/ProjectContext';
import Header from './header';
import '../../app/globals.css';

// Lazy load heavy components
const Sidebar = lazy(() => import('./sidebar'));
const CreateProjectOnboarding = lazy(() => import('../onboarding/CreateProjectOnboarding'));

// Lazy load page components
const DashboardPage = lazy(() => import('../dashboard/DashboardPage'));
const BugTrackerPage = lazy(() => import('../bug-tracker/BugTrackerPage'));
const TestScriptsPage = lazy(() => import('../test-scripts/TestScriptsPage'));
const AutoScriptsPage = lazy(() => import('../auto-scripts/AutoScriptsPage'));
const ReportsPage = lazy(() => import('../reports/ReportsPage'));
const RecordingsPage = lazy(() => import('../recordings/RecordingsPage'));
const SettingsPage = lazy(() => import('../settings/SettingsPage'));
const CreateProjectPage = lazy(() => import('../../components/modals/CreateProjectModal'));
const UpgradePage = lazy(() => import('../../pages/upgrade/UpgradePage'));

// Optimized loading skeleton component
const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your workspace...</p>
        </div>
    </div>
);

// Sidebar loading fallback
const SidebarFallback = () => (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 animate-pulse">
        <div className="p-4 space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded"></div>
                ))}
            </div>
        </div>
    </div>
);

// Page content loading fallback
const PageLoadingFallback = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
    </div>
);

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState('dashboard'); // Add page state management
    const { needsOnboarding, isLoading } = useProject();
    
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
            {/* Lazy-loaded Sidebar with fallback */}
            <Suspense fallback={sidebarOpen ? <SidebarFallback /> : null}>
                <Sidebar 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)}
                    activePage={activePage}
                    setActivePage={setActivePage}
                />
            </Suspense>

            {/* Main Content - Load immediately */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Keep immediate loading for critical UI */}
                <Header 
                    onMenuClick={() => setSidebarOpen(true)}
                    activePage={activePage} // Optional: pass to header if needed
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