'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import FeatureAccessBanner from '../common/FeatureAccessBanner';
import NotificationBanner from '../notifications/NotificationBanner';

const PageLayout = ({ children }) => {
    const pathname = usePathname();
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/email-verification'];
    const { state } = useApp();
    const needsUpgrade = state.subscription.currentPlan === 'free' && !state.subscription.isTrialActive;

    if (publicRoutes.includes(pathname)) {
        return children;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
                <AppHeader />
                <NotificationBanner />
                {needsUpgrade && (
                    <FeatureAccessBanner
                        message={`Upgrade to ${state.subscription.currentPlan === 'free' ? 'Pro' : 'Enterprise'} to unlock all features!`}
                    />
                )}
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
};

export default PageLayout;