"use client";
import React from "react";
import { AlertProvider } from "../components/CustomAlert";
import { AuthProvider } from "../context/AuthProvider"; // Import AuthProvider
import { Poppins, Montserrat, Noto_Sans_Hebrew } from "next/font/google";

// Load fonts with required weights & subsets
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });
const sansHebrew = Noto_Sans_Hebrew({ subsets: ["hebrew"], weight: ["400", "700"] });

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${poppins.className} ${montserrat.className} ${sansHebrew.className}`}>
                <AuthProvider>  {/* Wrap the entire app */}
                    <AlertProvider>
                        {children}
                    </AlertProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
