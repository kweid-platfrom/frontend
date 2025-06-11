'use client'
import { useState, Suspense, lazy, memo, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import Header from './header';
import Sidebar from './sidebar';
import '../../app/globals.css';

// Lazy load onboarding
const CreateProjectOnboarding = lazy(() => import('../onboarding/ProjectCreationForm'));

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
    <div className="animate-pulse space-y-4 p-6">
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Load immediately, no lazy loading */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={handleSidebarClose}
            />

            {/* Main Content - Load immediately */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Keep immediate loading for critical UI */}
                <Header onMenuClick={handleMenuClick} />

                {/* Main Content Area with optimized rendering */}
                <main className="flex-1 overflow-y-auto">
                    <Suspense fallback={<PageLoadingFallback />}>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;