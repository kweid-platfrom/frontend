'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthProvider';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireEmailVerified = false }) => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!currentUser) {
                router.replace('/login');
            } else if (requireEmailVerified && !currentUser.emailVerified) {
                router.replace('/verify-email');
            }
        }
    }, [loading, currentUser, requireEmailVerified, router]);

    // Show loading until auth is resolved or redirect occurs
    if (loading || !currentUser || (requireEmailVerified && !currentUser.emailVerified)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
