// components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireEmailVerified = false }) => {
    const { currentUser, loading } = useAuth();

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

    // ✅ Everything is good, render the protected content
    return children;
};

export default ProtectedRoute;
