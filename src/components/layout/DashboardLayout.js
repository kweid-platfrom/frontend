'use client'
import { useState, Suspense, lazy } from 'react';
import { useProject } from '../../context/ProjectContext';
import Header from './header';
import '../../app/globals.css';

// Lazy load heavy components
const Sidebar = lazy(() => import('./sidebar'));
const CreateProjectOnboarding = lazy(() => import('../onboarding/CreateProjectOnboarding'));

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

const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState('dashboard');
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Lazy-loaded Sidebar with fallback */}
            <Suspense fallback={sidebarOpen ? <SidebarFallback /> : null}>
                <Sidebar 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)}
                    setActivePage={setActivePage}
                />
            </Suspense>

            {/* Main Content - Load immediately */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Keep immediate loading for critical UI */}
                <Header 
                    onMenuClick={() => setSidebarOpen(true)}
                    activePage={activePage}
                />

                {/* Main Content Area with optimized rendering */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {/* Wrap children in Suspense for better loading */}
                        <Suspense fallback={
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                                </div>
                            </div>
                        }>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;