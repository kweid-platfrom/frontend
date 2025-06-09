// components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({
    children,
    requireEmailVerified = false,
    requireOnboardingComplete = false
}) => {
    const { currentUser, userProfile, loading } = useAuth();

    // Show loading spinner while auth state is being determined
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Check email verification requirement
    if (requireEmailVerified && !currentUser.emailVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    // Check onboarding completion requirement
    if (requireOnboardingComplete && userProfile) {
        if (!userProfile.onboardingStatus?.onboardingComplete) {
            return <Navigate to="/onboarding" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
