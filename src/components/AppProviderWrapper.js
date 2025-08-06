/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppProvider';
import LoadingScreen from './common/LoadingScreen';
import OrganizationSetupModal from './modals/OrganizationSetupModal';
import Register from './auth/Register';
import Login from './auth/Login';
import PageLayout from './layout/PageLayout';
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
    const { 
        state, 
        actions, 
        isAuthenticated, 
        isLoading,
        registrationState,
        needsRegistration,
        needsOrgSetup,
        pendingRegistrationData 
    } = useApp();
    const [appReady, setAppReady] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [orgSetupInProgress, setOrgSetupInProgress] = useState(false);

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
            actions.ui.closeModal('organizationSetup');
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

        // If authenticated but registration is incomplete, handle registration flow
        if (isFullyAuthenticated() && needsRegistration) {
            console.log('Registration incomplete, current state:', registrationState);
            
            // For individual accounts with pending registration, auto-complete it
            if (registrationState === 'pending' && state.auth.currentUser?.accountType === 'individual') {
                console.log('Auto-completing individual account registration');
                // This should be handled automatically by the AppProvider's checkRegistrationStatus
                // The system should complete the registration and update the state
                setAppReady(false);
                return;
            }
            
            // For organization accounts, show organization setup modal
            if (registrationState === 'org-setup' && !orgSetupInProgress) {
                if (!state.ui.modals?.organizationSetup?.isOpen) {
                    console.log('Opening organization setup modal');
                    actions.ui.openModal('organizationSetup');
                }
                setAppReady(false);
                return;
            }
            
            // If org setup is in progress, show loading
            if (orgSetupInProgress) {
                setAppReady(false);
                return;
            }
        }

        // If authenticated but no profile data, fetch it
        if (isAuthenticated && state.auth.currentUser?.uid && !state.auth.profileLoaded && !needsRegistration) {
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

        // Dashboard access logic (after registration is complete)
        if (isFullyAuthenticated() && !needsRegistration) {
            const hasAnySuites = state.suites.testSuites && state.suites.testSuites.length > 0;
            const hasActiveSuite = state.suites.activeSuite;

            console.log('Dashboard readiness check:', {
                isFullyAuthenticated: isFullyAuthenticated(),
                hasAnySuites,
                hasActiveSuite,
                registrationComplete: !needsRegistration
            });

            // If user has suites but no active suite, activate the first one
            if (hasAnySuites && !hasActiveSuite) {
                console.log('Activating first available suite:', state.suites.testSuites[0]);
                actions.suites.activateSuite(state.suites.testSuites[0]);
            }

            // App is ready - user can access dashboard with or without suites
            setAppReady(true);
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
        state.suites.testSuites?.length,
        state.suites.activeSuite?.id,
        state.subscription.isTrialActive,
        state.subscription.trialEndsAt,
        registrationState,
        needsRegistration,
        needsOrgSetup,
        orgSetupInProgress,
    ]);



    // Handle organization setup completion
    const handleOrganizationSetupComplete = async (organizationData) => {
        try {
            setOrgSetupInProgress(true);
            console.log('Setting up organization:', organizationData);

            const result = await actions.registration.completeOrganizationSetup(organizationData);

            if (result.success) {
                console.log('Organization setup completed successfully');
                actions.ui.closeModal('organizationSetup');
                toast.success(`Welcome to ${organizationData.organizationName}! Your organization is ready.`, { duration: 5000 });
            } else {
                console.error('Organization setup failed:', result.error);
                toast.error(result.error || 'Organization setup failed. Please try again.', { duration: 5000 });
            }
        } catch (error) {
            console.error('Organization setup error:', error);
            toast.error(error.message || 'An unexpected error occurred', { duration: 5000 });
        } finally {
            setOrgSetupInProgress(false);
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
        if (orgSetupInProgress) return "Setting up your organization...";
        if (state.subscription.loading) return "Loading subscription info...";
        if (state.suites.loading) return "Loading workspaces...";
        if (isLoading) return "Preparing your workspace...";
        return "Loading...";
    };

    // Show loading when necessary
    if (!state.auth.isInitialized ||
        orgSetupInProgress ||
        (isFullyAuthenticated() && !needsRegistration && (state.auth.loading || isLoading || state.subscription.loading || state.suites.loading))) {
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

    // Show organization setup modal for organization accounts
    if (isFullyAuthenticated() && needsRegistration && registrationState === 'org-setup') {
        return (
            <>
                <OrganizationSetupModal
                    isOpen={true}
                    onComplete={handleOrganizationSetupComplete}
                    isRequired={true}
                    user={state.auth.currentUser}
                    pendingData={pendingRegistrationData}
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
            {children}
            <div id="modal-root" />
            <div id="toast-root" />
        </PageLayout>
    );
};

export default AppProviderWrapper;