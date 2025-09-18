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
                    
                    {/* Basic Meta Tags */}
                    <meta name="description" content="Assura - Streamline your test management with our efficient and intuitive platform. Organize, track, and optimize your testing workflows." />
                    <meta name="keywords" content="test management, quality assurance, testing platform, QA tools, test automation, Assura" />
                    <meta name="author" content="Assura Team" />
                    <title>Assura - Efficient Test Management Platform</title>
                    
                    {/* Favicon */}
                    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                    <link rel="manifest" href="/site.webmanifest" />
                    
                    {/* Open Graph Meta Tags for Social Sharing */}
                    <meta property="og:title" content="Assura - Efficient Test Management Platform" />
                    <meta property="og:description" content="Streamline your test management with our efficient and intuitive platform. Organize, track, and optimize your testing workflows." />
                    <meta property="og:type" content="website" />
                    <meta property="og:url" content="https://assura.com" />
                    <meta property="og:image" content="https://assura.com/og-image.png" />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta property="og:image:alt" content="Assura - Test Management Platform Logo" />
                    <meta property="og:site_name" content="Assura" />
                    <meta property="og:locale" content="en_US" />
                    
                    {/* Twitter Card Meta Tags */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content="@assura" />
                    <meta name="twitter:creator" content="@assura" />
                    <meta name="twitter:title" content="Assura - Efficient Test Management Platform" />
                    <meta name="twitter:description" content="Streamline your test management with our efficient and intuitive platform. Organize, track, and optimize your testing workflows." />
                    <meta name="twitter:image" content="https://assura.com/twitter-image.png" />
                    <meta name="twitter:image:alt" content="Assura - Test Management Platform Logo" />
                    
                    {/* Additional Meta Tags */}
                    <meta name="theme-color" content="#3b82f6" />
                    <meta name="msapplication-TileColor" content="#3b82f6" />
                    <meta name="msapplication-config" content="/browserconfig.xml" />
                    
                    {/* DNS Prefetch and Preconnect */}
                    <link rel="dns-prefetch" href="//fonts.gstatic.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    
                    {/* Canonical URL */}
                    <link rel="canonical" href="https://assura.com" />
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