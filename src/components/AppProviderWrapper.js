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
    const [suiteCreationInProgress, setSuiteCreationInProgress] = useState(false); // Track suite creation

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

        // FIX 3: Improved suite creation logic
        const hasAnySuites = state.suites.testSuites && state.suites.testSuites.length > 0;
        const hasActiveSuite = state.suites.activeSuite;

        console.log('Suite readiness check:', {
            isFullyAuthenticated: isFullyAuthenticated(),
            hasAnySuites,
            hasActiveSuite,
            needsSuiteCreation,
            suiteCreationBlocked,
            shouldShowSuiteModal,
            suiteCreationInProgress
        });

        // If user is authenticated but has no suites and isn't blocked, show suite creation modal
        if (isFullyAuthenticated() && !hasAnySuites && !suiteCreationBlocked && !suiteCreationInProgress) {
            // Don't open modal if it's already open
            if (!state.ui.modals?.createSuite?.isOpen) {
                console.log('Opening suite creation modal - no suites found');
                actions.ui.openModal('createSuite');
            }
            setAppReady(false);
            return;
        }

        // If user has suites but no active suite, activate the first one
        if (isFullyAuthenticated() && hasAnySuites && !hasActiveSuite && !suiteCreationInProgress) {
            console.log('Activating first available suite:', state.suites.testSuites[0]);
            actions.suites.activateSuite(state.suites.testSuites[0]);
            // Continue to set app as ready
        }

        // All checks passed - close any open modals and set ready
        if (state.ui.modals?.createSuite?.isOpen && (hasAnySuites || suiteCreationBlocked)) {
            console.log('Closing suite creation modal - conditions met');
            actions.ui.closeModal('createSuite');
        }

        // App is ready if user is authenticated and either has suites or creation is blocked
        if (isFullyAuthenticated() && (hasAnySuites || suiteCreationBlocked)) {
            setAppReady(true);
        } else {
            setAppReady(false);
        }
    }, [
        state.auth.isInitialized,
        state.auth.loading,
        state.auth.profileLoaded,
        isAuthenticated,
        state.auth.currentUser?.uid,
        state.auth.currentUser?.emailVerified,
        state.subscription.loading,
        state.suites.loading,
        state.suites.testSuites?.length, // Track changes in suite count
        state.suites.activeSuite?.id, // Track active suite changes
        needsSuiteCreation,
        suiteCreationBlocked,
        shouldShowSuiteModal,
        state.subscription.isTrialActive,
        state.subscription.trialEndsAt,
        suiteCreationInProgress, // Track suite creation progress
    ]);

    const handleSuiteCreated = async (newSuite) => {
        try {
            setSuiteCreationInProgress(true);
            console.log('Creating suite with data:', newSuite);

            const result = await createSuite({
                ...newSuite,
                ownerType: state.auth.accountType || 'individual',
                ownerId: state.auth.currentUser?.uid,
                organizationId: state.auth.currentUser?.organizationId || null,
                status: 'active',
            });

            if (result.success) {
                console.log('Suite created successfully:', result.data);

                // Close modal immediately
                actions.ui.closeModal('createSuite');

                // Show success message
                toast.success(`Welcome to ${newSuite.name}! Your workspace is ready.`, { duration: 5000 });

                // The suite should already be added to the state via the createSuite action
                // The real-time subscription will also pick it up, but the action handles immediate state update

                // Small delay to ensure state propagation
                setTimeout(() => {
                    setSuiteCreationInProgress(false);

                    // Check if we have suites now and set app ready
                    if (state.suites.testSuites?.length > 0) {
                        setAppReady(true);
                    }
                }, 100);

            } else {
                console.error('Suite creation failed:', result.error);
                toast.error(result.error?.message || 'Failed to create suite', { duration: 5000 });
                setSuiteCreationInProgress(false);
            }
        } catch (error) {
            console.error('Suite creation error:', error);
            toast.error(error.message || 'An unexpected error occurred', { duration: 5000 });
            setSuiteCreationInProgress(false);
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
        if (suiteCreationInProgress) return "Creating your workspace...";
        if (isLoading) return "Preparing your workspace...";
        return "Loading...";
    };

    // Show loading when necessary
    if (!state.auth.isInitialized ||
        (isFullyAuthenticated() && (state.auth.loading || isLoading || state.subscription.loading || state.suites.loading || suiteCreationInProgress))) {
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
    const shouldShowModal = isFullyAuthenticated() &&
        (!state.suites.testSuites || state.suites.testSuites.length === 0) &&
        !suiteCreationBlocked &&
        !appReady &&
        !suiteCreationInProgress;

    if (shouldShowModal) {
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