// components/layout/PageLayout.js
'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import AppSidebar from './AppSidebar';
import { useApp } from '@/contexts/AppProvider';
import { Loader2, AlertTriangle } from 'lucide-react';

const PageLayout = ({ title, children, toolbar = null }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const {
        isLoading,
        error,
        breadcrumbs,
        activeSuite,
        userCapabilities,
        activeModule,
        navigateToModule
    } = useApp();

    const pageTitle = title || breadcrumbs?.[breadcrumbs.length - 1] || 'QA Platform';

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar */}
            <AppSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeSuite={activeSuite}
                userCapabilities={userCapabilities}
                activeModule={activeModule}
                onNavigate={navigateToModule}
            />

            {/* Main Panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                {/* Head Metadata */}
                <Head>
                    <title>{pageTitle} - QA Platform</title>
                </Head>

                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                    {/* Mobile menu */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-600 hover:text-black"
                        >
                            ☰
                        </button>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex-1 px-2 hidden sm:flex items-center text-sm text-gray-600 space-x-2 truncate">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className="text-gray-400">/</span>}
                                <span className="truncate">{crumb}</span>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Optional Toolbar */}
                    {toolbar && <div className="ml-auto">{toolbar}</div>}
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {/* Error or Loading state */}
                    {error ? (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 p-4 rounded-md">
                            <AlertTriangle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center h-full text-blue-600">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Loading...</span>
                        </div>
                    ) : (
                        children
                    )}
                </main>
            </div>
        </div>
    );
};

export default PageLayout;
