/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import { useState, Suspense, lazy, memo, useCallback, useEffect, useRef } from 'react';
import { useSuite } from '../../context/SuiteContext';
import Header from './header';
import Sidebar from './sidebar';
import '../../app/globals.css';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const BugTracker = lazy(() => import('../pages/BugTrackerPage'));
const TestScripts = lazy(() => import('../pages/TestScriptsPage'));
const AutoScripts = lazy(() => import('../pages/AutoScriptsPage'));
const Reports = lazy(() => import('../pages/ReportsPage'));
const Recordings = lazy(() => import('../pages/ReportsPage'));
const UserProfile = lazy(() => import('../../components/UserProfile'));
const Upgrade = lazy(() => import('../pages/UpgradePage.js'));

// Optimized loading skeleton component
const LoadingSkeleton = memo(() => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
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
    const [activePage, setActivePage] = useState('dashboard');
    const { isLoading } = useSuite();
    
    // Use ref to track if we've loaded from storage to prevent infinite loops
    const hasLoadedFromStorage = useRef(false);
    const isInitialized = useRef(false);

    // Load saved active page from localStorage on mount - FIXED VERSION
    useEffect(() => {
        // Only run once when component mounts
        if (!isInitialized.current && typeof window !== 'undefined') {
            try {
                const savedPage = localStorage.getItem('activePage');
                if (savedPage && savedPage !== activePage) {
                    setActivePage(savedPage);
                }
                hasLoadedFromStorage.current = true;
            } catch (error) {
                console.warn('Failed to load saved page from localStorage:', error);
                // Fallback to default page if localStorage fails
            }
            isInitialized.current = true;
        }
    }, []); // Empty dependency array - only run once

    // Save to localStorage when activePage changes (but not on initial load)
    useEffect(() => {
        if (hasLoadedFromStorage.current && typeof window !== 'undefined') {
            try {
                localStorage.setItem('activePage', activePage);
            } catch (error) {
                console.warn('Failed to save page to localStorage:', error);
            }
        }
    }, [activePage]); // Only depend on activePage

    // Memoize callbacks to prevent unnecessary re-renders
    const handleMenuClick = useCallback(() => setSidebarOpen(true), []);
    const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
    
    // Memoize setActivePage to prevent child re-renders
    const handleSetActivePage = useCallback((page) => {
        setActivePage(page);
    }, []);

    // Render the appropriate page component based on activePage
    const renderPageContent = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard />;
            case 'bug-tracker':
                return <BugTracker />;
            case 'test-scripts':
                return <TestScripts />;
            case 'auto-scripts':
                return <AutoScripts />;
            case 'reports':
                return <Reports />;
            case 'recordings':
                return <Recordings />;
            case 'settings':
                return <UserProfile />;
            case 'upgrade':
                return <Upgrade />;
            default:
                return children || <Dashboard />;
        }
    };

    // Show loading state immediately
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Load immediately, no lazy loading */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={handleSidebarClose}
                setActivePage={handleSetActivePage}
                activePage={activePage}
            />

            {/* Main Content - Load immediately */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - Keep immediate loading for critical UI */}
                <Header
                    onMenuClick={handleMenuClick}
                    setActivePage={handleSetActivePage}
                />

                {/* Main Content Area with optimized rendering */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Suspense fallback={<PageLoadingFallback />}>
                        {renderPageContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;