'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthProvider'; // Update path if needed

export default function Dashboard() {
    const { currentUser, userProfile, loading, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && initialized && !currentUser) {
            router.push('/login'); // Redirect unauthenticated users
        }
    }, [currentUser, loading, initialized, router]);

    if (loading || !initialized || !currentUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="text-gray-500 text-lg">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">
                Welcome, {userProfile?.name || 'User'} 👋
            </h1>
            <p className="text-gray-600 mb-6">Here’s your personalized dashboard.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl shadow p-5 bg-white border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2">Account Details</h2>
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Account Type:</strong> {userProfile?.accountType || 'N/A'}</p>
                </div>

                <div className="rounded-2xl shadow p-5 bg-white border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2">Status</h2>
                    <p>You are successfully logged in ✅</p>
                </div>
            </div>
        </div>
    );
}
