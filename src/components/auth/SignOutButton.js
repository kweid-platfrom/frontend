'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppProvider';
import { LogOut, Loader2 } from 'lucide-react';

const SignOutButton = ({ className = '', variant = 'icon' }) => {
    const [loading, setLoading] = useState(false);
    const { actions } = useApp();
    const router = useRouter();

    const handleSignOut = async () => {
        setLoading(true);
        try {
            const result = await actions.auth.signOut();

            // Optional: fallback redirect if AuthProvider doesn't push
            if (result?.success && typeof window !== 'undefined') {
                router.push('/login'); // relative path to avoid /auth/login issue
            }
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const icon = loading ? (
        <Loader2 className="animate-spin w-4 h-4" />
    ) : (
        <LogOut className="w-4 h-4" />
    );

    const sharedClasses = `transition-all disabled:opacity-50 ${className}`;

    if (variant === 'icon') {
        return (
            <button
                onClick={handleSignOut}
                disabled={loading}
                className={`text-[#2D3142] hover:text-white ${sharedClasses}`}
                aria-label="Sign out"
            >
                {icon}
            </button>
        );
    }

    if (variant === 'text') {
        return (
            <button
                onClick={handleSignOut}
                disabled={loading}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${sharedClasses}`}
            >
                {icon}
                Sign out
            </button>
        );
    }

    // Default to full variant
    return (
        <button
            onClick={handleSignOut}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 rounded ${sharedClasses}`}
        >
            {icon}
            Sign out
        </button>
    );
};

export default SignOutButton;