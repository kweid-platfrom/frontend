/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppProvider';
import { useSuiteAccess } from '../hooks/useSuiteAccess';
import LoadingScreen from './common/LoadingScreen';
import CreateSuiteModal from './modals/createSuiteModal';
import Register from './auth/Register';
import Login from './auth/Login';
import PageLayout from './layout/PageLayout';
import NotificationBanner from './notifications/NotificationBanner';
import { toast } from 'sonner';

const AppProviderWrapper = ({ children }) => {
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // For public routes: NO AppProvider wrapping, no PageLayout
    if (isPublicRoute) {
        return (
            <div className="public-route">
                {children}
            </div>
        );
    }

    // For protected routes: wrap with AppProvider and include PageLayout
    return (
        <AppProvider>
            <ProtectedRouteContent>{children}</ProtectedRouteContent>
        </AppProvider>
    );
};

// This component runs INSIDE AppProvider, so it can use useApp
const ProtectedRouteContent = ({ children }) => {
    const router = useRouter();
    const { state, actions, isAuthenticated, isLoading } = useApp();
    const { needsSuiteCreation, shouldShowSuiteModal, createSuite, suiteCreationBlocked } = useSuiteAccess();
    const [appReady, setAppReady] = useState(false);
    const [authMode, setAuthMode] = useState('login');

    // Helper functions
    const needsEmailVerification = () => {
        return state.auth.currentUser?.uid &&
            state.auth.currentUser?.emailVerified === false &&
            state.auth.isInitialized;
    };

    const isFullyAuthenticated = () => {
        return isAuthenticated &&
            state.auth.currentUser?.uid &&
            state.auth.currentUser?.emailVerified === true;
    };

    const shouldShowAuthUI = () => {
        return state.auth.isInitialized &&
            !isAuthenticated &&
            !state.auth.currentUser?.uid;
    };

    // Main authentication and app readiness logic
    useEffect(() => {
        // Wait for auth initialization
        if (!state.auth.isInitialized) {
            setAppReady(false);
            return;
        }

        // If user needs email verification, redirect
        if (needsEmailVerification()) {
            actions.ui.closeModal('createSuite');
            actions.suites.clearSuites();
            router.push('/verify-email');
            setAppReady(false);
            return;
        }

        // If not authenticated, show auth UI
        if (shouldShowAuthUI()) {
            setAppReady(false);
            return;
        }

        // If authenticated but no profile data, fetch it
        if (isAuthenticated && state.auth.currentUser?.uid && !state.auth.profileLoaded) {
            console.log('Fetching user profile data...');
            actions.auth.refreshUserProfile()
                .then(() => {
                    console.log('User profile loaded successfully');
                })
                .catch((error) => {
                    console.error('Failed to load user profile:', error);
                    // Don't block the app if profile fetch fails
                });
        }

        // Wait for app data to load
        if (state.auth.loading || state.subscription.loading || state.suites.loading) {
            setAppReady(false);
            return;
        }

        // Check trial expiry
        if (state.subscription.isTrialActive &&
            state.subscription.trialEndsAt &&
            new Date() > new Date(state.subscription.trialEndsAt)) {
            actions.subscription.handleTrialExpiry(state.suites, actions.suites, actions.ui)
                .catch((error) => {
                    console.error('Error handling trial expiry:', error);
                    toast.error(error.message || 'Error updating subscription. Please contact support.');
                });
            setAppReady(false);
            return;
        }

        // Check if suite creation is needed
        if (isFullyAuthenticated() && needsSuiteCreation && !suiteCreationBlocked && shouldShowSuiteModal) {
            // Don't open modal if it's already open or if we just created a suite
            if (!state.ui.modals?.createSuite?.isOpen) {
                actions.ui.openModal('createSuite');
            }
            setAppReady(false);
            return;
        }

        // All checks passed - close any open modals and set ready
        if (state.ui.modals?.createSuite?.isOpen) {
            actions.ui.closeModal('createSuite');
        }
        setAppReady(true);
    }, [
        state.auth.isInitialized,
        state.auth.loading,
        state.auth.profileLoaded, // Add this dependency
        isAuthenticated,
        state.auth.currentUser?.uid,
        state.auth.currentUser?.emailVerified,
        state.subscription.loading,
        state.suites.loading,
        needsSuiteCreation,
        suiteCreationBlocked,
        shouldShowSuiteModal,
        state.subscription.isTrialActive,
        state.subscription.trialEndsAt,
    ]);

    const handleSuiteCreated = async (newSuite) => {
        try {
            const result = await createSuite({
                ...newSuite,
                ownerType: state.auth.accountType || 'individual',
                ownerId: state.auth.currentUser?.uid,
                status: 'active',
            });

            if (result.success) {
                // Close modal immediately
                actions.ui.closeModal('createSuite');

                // Activate the suite
                actions.suites.activateSuite(result.data);

                // Set app as ready to prevent re-rendering loops
                setAppReady(true);

                // Show success message
                toast.success(`Welcome to ${newSuite.name}! Your workspace is ready.`, { duration: 5000 });

                // Force a small delay to ensure state is stable before proceeding
                setTimeout(() => {
                    setAppReady(true);
                }, 100);
            } else {
                toast.error(result.error?.message || 'Failed to create suite', { duration: 5000 });
            }
        } catch (error) {
            console.error('Suite creation error:', error);
            toast.error(error.message || 'An unexpected error occurred', { duration: 5000 });
        }
    };

    const handleRegistrationComplete = () => {
        toast.success('Registration completed! Welcome to QAID!', { duration: 5000 });
    };

    const handleLoginComplete = () => {
        // Auth state will update automatically
    };

    const getLoadingMessage = () => {
        if (!state.auth.isInitialized) return "Initializing application...";
        if (state.auth.loading) return "Authenticating...";
        if (needsEmailVerification()) return "Redirecting to email verification...";
        if (state.subscription.loading) return "Loading subscription info...";
        if (state.suites.loading) return "Loading workspaces...";
        if (isLoading) return "Preparing your workspace...";
        return "Loading...";
    };

    // Show loading when necessary
    if (!state.auth.isInitialized ||
        (isFullyAuthenticated() && (state.auth.loading || isLoading || state.subscription.loading || state.suites.loading))) {
        return <LoadingScreen message={getLoadingMessage()} />;
    }

    // Show authentication UI
    if (shouldShowAuthUI()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
                {authMode === 'register' ? (
                    <Register
                        onRegistrationComplete={handleRegistrationComplete}
                        onSwitchToLogin={() => setAuthMode('login')}
                    />
                ) : (
                    <Login
                        onLoginComplete={handleLoginComplete}
                        onSwitchToRegister={() => setAuthMode('register')}
                    />
                )}
                <div id="modal-root" />
                <div id="toast-root" />
            </div>
        );
    }

    // Show suite creation modal
    if (isFullyAuthenticated() && needsSuiteCreation && shouldShowSuiteModal && !suiteCreationBlocked && !appReady) {
        return (
            <>
                <CreateSuiteModal
                    isOpen={true}
                    onSuiteCreated={handleSuiteCreated}
                    isRequired={true}
                />
                <div id="modal-root" />
                <div id="toast-root" />
            </>
        );
    }

    // Show loading if app not ready
    if (!appReady) {
        return <LoadingScreen message="Preparing your workspace..." />;
    }

    // Render protected content with PageLayout
    return (
        <PageLayout>
            <NotificationBanner />
            {children}
            <div id="modal-root" />
            <div id="toast-root" />
        </PageLayout>
    );
};

export default AppProviderWrapper;