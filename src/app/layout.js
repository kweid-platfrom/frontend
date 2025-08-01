'use client';

import React, { Suspense } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import AppProviderWrapper from '@/components/AppProviderWrapper';
import { Poppins, Montserrat, Noto_Sans_Hebrew } from 'next/font/google';
import LoadingScreen from '@/components/common/LoadingScreen';
import '@/app/globals.css';

const cache = createCache({ key: 'css', prepend: true });

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
                    <meta name="description" content="Assura for efficient test management" />
                    <title>Assura</title>
                    <link rel="dns-prefetch" href="//fonts.gstatic.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                </head>
                <body className={`${poppins.className} antialiased min-h-screen transition-colors duration-200`}>
                    <AppProviderWrapper>
                        <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                            {children}
                        </Suspense>
                    </AppProviderWrapper>
                </body>
            </html>
        </CacheProvider>
    );
}