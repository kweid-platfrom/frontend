// pages/onboarding.js (or app/onboarding/page.js for App Router)
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthProvider';
import OnboardingRouter from '../../components/onboarding/OnboardingRouter';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
    const { currentUser, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect logic if needed
        if (!loading) {
            if (!currentUser) {
                router.push('/login');
                return;
            }
            
            if (!currentUser.emailVerified) {
                router.push('/verify-email');
                return;
            }
            
            if (userProfile?.onboardingStatus?.onboardingComplete) {
                router.push('/dashboard');
                return;
            }
        }
    }, [currentUser, userProfile, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return <OnboardingRouter />;
}