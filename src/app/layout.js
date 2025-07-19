"use client";
import React, { Suspense } from "react";
import { AppProvider } from "../contexts/AppProvider";
import AppWrapper from "../components/AppWrapper";
import { Poppins, Montserrat, Noto_Sans_Hebrew } from "next/font/google";
import { Toaster } from "sonner";

// Optimized font loading with display swap and preload
const poppins = Poppins({ 
    subsets: ["latin"], 
    weight: ["400", "700"],
    display: 'swap',
    preload: true,
    variable: '--font-poppins'
});

const montserrat = Montserrat({ 
    subsets: ["latin"], 
    weight: ["400", "600"],
    display: 'swap',
    preload: true,
    variable: '--font-montserrat'
});

const sansHebrew = Noto_Sans_Hebrew({ 
    subsets: ["hebrew"], 
    weight: ["400", "700"],
    display: 'swap',
    preload: false,
    variable: '--font-sans-hebrew'
});

// Optimized Toaster configuration
const toasterConfig = {
    richColors: true,
    closeButton: false,
    position: "top-center",
    expand: true,
    visibleToasts: 4,
    toastOptions: {
        style: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "5px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            fontFamily: "var(--font-poppins), system-ui, sans-serif",
        },
        className: "font-medium",
        duration: 4000,
        error: {
            icon: null,
        },
    },
    theme: "light"
};

// Minimal loading fallback
const AppFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
    </div>
);

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${poppins.variable} ${montserrat.variable} ${sansHebrew.variable}`}>
            <head>
                {/* Only keep DNS prefetch and preconnect for Google Fonts optimization */}
                <link rel="dns-prefetch" href="//fonts.gstatic.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`${poppins.className} antialiased`}>
                <Suspense fallback={<AppFallback />}>
                    <AppProvider>
                        <AppWrapper>
                            {children}
                        </AppWrapper>
                        <div id="modal-root" />
                        <Toaster {...toasterConfig} />
                    </AppProvider>
                </Suspense>
            </body>
        </html>
    );
}