'use client';

import React, { Suspense } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { AppProvider } from '@/context/AppProvider';
import AppProviderWrapper from '@/components/AppProviderWrapper';
import PageLayout from '@/components/layout/PageLayout';
import { Poppins, Montserrat, Noto_Sans_Hebrew } from 'next/font/google';
import { Toaster } from 'sonner';
import LoadingScreen from '@/components/common/LoadingScreen';
import '@/app/globals.css';

// Create Emotion cache
const cache = createCache({ key: 'css', prepend: true });

// Font configurations
const poppins = Poppins({
    subsets: ['latin', 'latin-ext'],
    weight: ['300', '400', '600', '700'],
    display: 'swap',
    variable: '--font-poppins',
});

const montserrat = Montserrat({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '500', '600'],
    display: 'swap',
    variable: '--font-montserrat',
});

const sansHebrew = Noto_Sans_Hebrew({
    subsets: ['hebrew'],
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-sans-hebrew',
});

// Toaster configuration
const toasterConfig = {
    richColors: true,
    closeButton: true,
    position: 'top-center',
    expand: true,
    visibleToasts: 3,
    toastOptions: {
        style: {
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            fontFamily: 'var(--font-poppins), system-ui, sans-serif',
            padding: '12px 16px',
        },
        className: 'font-medium text-sm',
        duration: 3500,
        error: { style: { borderLeft: '4px solid #ef4444' } },
        success: { style: { borderLeft: '4px solid #22c55e' } },
    },
    theme: 'system',
};

export default function RootLayout({ children }) {
    return (
        <CacheProvider value={cache}>
            <html
                lang="en"
                className={`${poppins.variable} ${montserrat.variable} ${sansHebrew.variable}`}
                suppressHydrationWarning
            >
                <head>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="description" content="QA Platform for efficient test management" />
                    <title>QA Platform</title>
                    <link rel="dns-prefetch" href="//fonts.gstatic.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                </head>
                <body className={`${poppins.className} antialiased bg-gray-50 text-gray-900 min-h-screen`}>
                    <AppProvider>
                        <AppProviderWrapper>
                            <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                                <PageLayout>{children}</PageLayout>
                            </Suspense>
                        </AppProviderWrapper>
                        <Toaster {...toasterConfig} />
                    </AppProvider>
                </body>
            </html>
        </CacheProvider>
    );
}