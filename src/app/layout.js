"use client"
import React from "react";
import { AlertProvider } from "../components/CustomAlert"

export default function RootLayout({ children }) {

    return (
        <html lang="en">
            <body>
                <AlertProvider>
                    {children}
                </AlertProvider>
            </body>
        </html>
    );
}
