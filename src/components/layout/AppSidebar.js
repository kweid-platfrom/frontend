// components/AppSidebar.js
import React from "react";
import { useApp } from "@/context/AppProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AppSidebar = () => {
    const { state: { ui, subscription }, isAuthenticated } = useApp();
    const pathname = usePathname();

    const navItems = [
        { path: "/dashboard", label: "Dashboard", feature: null },
        { path: "/test-cases", label: "Test Cases", feature: "canCreateTestCases" },
        { path: "/bugs", label: "Bugs", feature: null },
        { path: "/reports", label: "Reports", feature: null },
        { path: "/recordings", label: "Recordings", feature: "canUseRecordings" },
        { path: "/test-automation", label: "Test Automation", feature: "canUseAutomation" },
    ];

    const hasFeatureAccess = (feature) => {
        if (!feature || !isAuthenticated) return true;
        return subscription.planLimits[feature] && !ui.featureLocks[`${feature}Locked`];
    };

    return (
        <aside className="w-64 bg-gray-50 p-4 h-screen sticky top-0" aria-label="Main navigation">
            <nav>
                <ul className="space-y-1">
                    {navItems.map((item) =>
                        (!item.feature || hasFeatureAccess(item.feature)) && (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`block p-2 rounded-md text-sm font-medium transition-colors ${pathname === item.path
                                            ? "bg-teal-100 text-teal-800"
                                            : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                                        }`}
                                    aria-current={pathname === item.path ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        )
                    )}
                </ul>
            </nav>
        </aside>
    );
};

export default AppSidebar;