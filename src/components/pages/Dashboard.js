import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import DashboardContent from '../DashboardContent';

const Dashboard = ({ hasValidAccess = true }) => {
    const { currentUser, userProfile } = useAuth();
    const [showProfileBanner, setShowProfileBanner] = useState(false);

    useEffect(() => {
        if (hasValidAccess && currentUser) {
            const needsProfileCompletion =
                (!currentUser.displayName && (!userProfile?.name && !userProfile?.displayName)) ||
                (!currentUser.emailVerified && currentUser.providerData?.some(p => p.providerId === 'password')) ||
                (!currentUser.providerData || currentUser.providerData.length === 0) ||
                (userProfile && !userProfile.setupCompleted && userProfile.setupStep !== 'completed') ||
                (userProfile && !userProfile.onboardingStatus?.onboardingComplete);

            setShowProfileBanner(needsProfileCompletion);
        } else {
            setShowProfileBanner(false);
        }
    }, [hasValidAccess, currentUser, userProfile]);

    const handleCompleteProfile = () => {
        // Navigate to profile setup
        console.log('Navigate to profile setup');
    };

    const handleDismissProfileBanner = () => {
        setShowProfileBanner(false);
    };

    return (
        <DashboardContent
            hasValidAccess={hasValidAccess}
            showProfileBanner={showProfileBanner}
            onCompleteProfile={handleCompleteProfile}
            onDismissProfileBanner={handleDismissProfileBanner}
        />
    );
};

export default Dashboard;