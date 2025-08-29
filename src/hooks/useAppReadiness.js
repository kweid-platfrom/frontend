/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppProvider';
import { useAuthFlow } from './useAuthFlow';
import { useSuiteFlow } from './useSuiteFlow';
import { toast } from 'sonner';

export const useAppReadiness = (pathname) => {
    const { state, actions } = useApp();
    const router = useRouter();
    const { 
        isFullyAuthenticated, 
        needsEmailVerification, 
        shouldShowAuthUI, 
        profileLoaded,
        refreshUserProfile 
    } = useAuthFlow();
    const { needsTestSuite, setShowCreateSuiteModal } = useSuiteFlow();
    
    const [appReady, setAppReady] = useState(false);
    const [showTipsMode, setShowTipsMode] = useState(false);
    
    const bypassTipsModeRoutes = ['/documents', '/documents/create'];
    const shouldBypassTipsMode = bypassTipsModeRoutes.some(route => pathname.startsWith(route));

    const checkTrialExpiry = () => {
        if (state.subscription.isTrialActive &&
            state.subscription.trialEndsAt &&
            new Date() > new Date(state.subscription.trialEndsAt)) {
            actions.subscription.handleTrialExpiry(state.suites, actions.suites, actions.ui)
                .catch((error) => {
                    console.error('Error handling trial expiry:', error);
                    toast.error(error.message || 'Error updating subscription. Please contact support.');
                });
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (!state.auth.isInitialized) {
            setAppReady(false);
            return;
        }

        if (needsEmailVerification) {
            actions.ui.closeModal('createSuite');
            actions.suites.clearSuites();
            router.push('/verify-email');
            setAppReady(false);
            return;
        }

        if (shouldShowAuthUI) {
            setAppReady(false);
            return;
        }

        if (isFullyAuthenticated && !profileLoaded) {
            console.log('Fetching user profile data...');
            refreshUserProfile()
                .then(() => {
                    console.log('User profile loaded successfully');
                })
                .catch((error) => {
                    console.error('Failed to load user profile:', error);
                });
        }

        if (state.auth.loading || state.subscription.loading || state.suites.loading) {
            setAppReady(false);
            return;
        }

        if (checkTrialExpiry()) {
            setAppReady(false);
            return;
        }

        if (needsTestSuite) {
            console.log('User needs to create first test suite');
            setShowCreateSuiteModal(true);
            setShowTipsMode(false);
            setAppReady(false);
            return;
        }

        if (isFullyAuthenticated) {
            const hasAnySuites = state.suites.testSuites?.length > 0;
            const hasActiveSuite = !!state.suites.activeSuite;

            console.log('Dashboard readiness check:', {
                isFullyAuthenticated,
                hasAnySuites,
                hasActiveSuite,
                pathname,
                shouldBypassTipsMode,
                activeSuiteName: state.suites.activeSuite?.name,
                suiteCount: state.suites.testSuites?.length || 0
            });

            // REMOVED: ensureActiveSuite() call - let AppProvider handle suite restoration
            // This prevents interference with newly created suites

            if (hasAnySuites) {
                if (shouldBypassTipsMode) {
                    setShowTipsMode(false);
                    setAppReady(true);
                } else {
                    setShowTipsMode(false);
                    setAppReady(true);
                }
            } else {
                setAppReady(true);
                setShowTipsMode(false);
            }
        }
    }, [
        state.auth.isInitialized,
        state.auth.loading,
        profileLoaded,
        isFullyAuthenticated,
        needsEmailVerification,
        shouldShowAuthUI,
        state.subscription.loading,
        state.suites.loading,
        state.suites.testSuites?.length,
        state.suites.activeSuite?.id,
        state.subscription.isTrialActive,
        state.subscription.trialEndsAt,
        pathname,
        shouldBypassTipsMode,
        needsTestSuite,
        setShowCreateSuiteModal
    ]);

    const getLoadingMessage = () => {
        if (!state.auth.isInitialized) return "Initializing application...";
        if (state.auth.loading) return "Authenticating...";
        if (needsEmailVerification) return "Redirecting to email verification...";
        if (state.subscription.loading) return "Loading subscription info...";
        if (state.suites.loading) return "Loading workspaces...";
        if (state.auth.isAuthenticated && !profileLoaded) return "Loading profile...";
        return "Preparing your workspace...";
    };

    return {
        appReady,
        showTipsMode,
        setShowTipsMode,
        shouldBypassTipsMode,
        getLoadingMessage
    };
};