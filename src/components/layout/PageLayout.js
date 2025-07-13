// components/layout/PageLayout.js
'use client';

import React from 'react';
import Head from 'next/head';
import { useApp } from '@/contexts/AppProvider';
import { Loader2, AlertTriangle } from 'lucide-react';

const PageLayout = ({ title, children, toolbar = null }) => {
    const {
        isLoading,
        error,
        breadcrumbs,
    } = useApp();

    const pageTitle = title || breadcrumbs?.[breadcrumbs.length - 1] || 'QA Platform';

    return (
        <>
            {/* Head Metadata */}
            <Head>
                <title>{pageTitle} - QA Platform</title>
            </Head>

            {/* Optional Toolbar */}
            {toolbar && (
                <div className="mb-4 flex justify-end">
                    {toolbar}
                </div>
            )}

            {/* Page Content */}
            <div className="w-full">
                {/* Error or Loading state */}
                {error ? (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 p-4 rounded-md">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center h-64 text-teal-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </>
    );
};

export default PageLayout;