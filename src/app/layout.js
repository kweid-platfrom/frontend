"use client";
import React from "react";
import { AppProvider } from "../contexts/AppProvider";
import AppWrapper from "../components/layout/AppWrapper";
import { Poppins, Montserrat, Noto_Sans_Hebrew } from "next/font/google";
import { Toaster } from "sonner";

// Load fonts
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });
const sansHebrew = Noto_Sans_Hebrew({ subsets: ["hebrew"], weight: ["400", "700"] });

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${poppins.className} ${montserrat.className} ${sansHebrew.className}`}>
                <AppProvider>
                    <AppWrapper>
                        {children}
                    </AppWrapper>
                    <div id="modal-root"></div>
                    <Toaster
                        richColors
                        closeButton={false}
                        position="top-center"
                        expand={true}
                        visibleToasts={4}
                        toastOptions={{
                            style: {
                                background: "rgba(255, 255, 255, 0.95)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(148, 163, 184, 0.2)",
                                borderRadius: "5px",
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                fontFamily: "inherit",
                            },
                            className: "font-medium",
                            duration: 4000,
                            error: {
                                icon: null,
                            },
                        }}
                        theme="light"
                    />
                </AppProvider>
            </body>
        </html>
    );
}