"use client"; // Needed for Next.js 13+ App Router

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../config/firebase";
import Dashboard from "../dashboard/Dashboard";

const DashboardPage = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((authUser) => {
            if (!authUser) {
                router.push("/login"); // Redirect to login if not authenticated
            } else {
                setUser(authUser);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (!user) return <p>Loading...</p>;

    return <Dashboard />;
};

export default DashboardPage;
