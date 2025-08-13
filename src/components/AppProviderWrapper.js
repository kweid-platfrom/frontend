/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppProvider';
import LoadingScreen from './common/LoadingScreen';
import Register from './auth/Register';
import Login from './auth/Login';
import PageLayout from './layout/PageLayout';
import CreateSuiteModal from './modals/createSuiteModal';
import TipsMode from './TipsMode';
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
    const pathname = usePathname();
    const { 
        state, 
        actions, 
        isAuthenticated, 
        isLoading
    } = useApp();
    const [appReady, setAppReady] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
    const [showTipsMode, setShowTipsMode] = useState(false);

    // Routes that should bypass tips mode and show normal content
    const bypassTipsModeRoutes = ['/documents', '/documents/create'];
    const shouldBypassTipsMode = bypassTipsModeRoutes.some(route => pathname.startsWith(route));

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

    const needsTestSuite = () => {
        return isFullyAuthenticated() &&
            state.auth.profileLoaded &&
            (!state.suites.testSuites || state.suites.testSuites.length === 0) &&
            !state.suites.loading;
    };

    const shouldShowDashboard = () => {
        return isFullyAuthenticated() &&
            state.suites.testSuites &&
            state.suites.testSuites.length > 0 &&
            state.suites.activeSuite;
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

        // Check if user needs to create their first test suite
        if (needsTestSuite()) {
            console.log('User needs to create first test suite');
            setShowCreateSuiteModal(true);
            setShowTipsMode(false);
            setAppReady(false);
            return;
        }

        // Dashboard access logic
        if (isFullyAuthenticated()) {
            const hasAnySuites = state.suites.testSuites && state.suites.testSuites.length > 0;
            const hasActiveSuite = state.suites.activeSuite;

            console.log('Dashboard readiness check:', {
                isFullyAuthenticated: isFullyAuthenticated(),
                hasAnySuites,
                hasActiveSuite,
                pathname,
                shouldBypassTipsMode
            });

            // If user has suites but no active suite, activate the first one
            if (hasAnySuites && !hasActiveSuite) {
                console.log('Activating first available suite:', state.suites.testSuites[0]);
                actions.suites.activateSuite(state.suites.testSuites[0]);
            }

            // Check if we should show tips mode (has suites but no substantial content)
            // BUT only if we're not on a route that should bypass tips mode
            if (hasAnySuites && hasActiveSuite) {
                if (shouldBypassTipsMode) {
                    // User is on documents page or create page - show normal content
                    setShowTipsMode(false);
                    setAppReady(true);
                    setShowCreateSuiteModal(false);
                } else {
                    // User has substantial content - show normal dashboard
                    setShowTipsMode(false);
                    setAppReady(true);
                    setShowCreateSuiteModal(false);
                }
            } else {
                // App is ready - user can access dashboard
                setAppReady(true);
                setShowTipsMode(false);
                setShowCreateSuiteModal(false);
            }
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
        pathname,
        shouldBypassTipsMode
    ]);

    const handleLoginComplete = () => {
        // Auth state will update automatically, no special handling needed
        console.log('Login completed, auth state will update automatically');
    };

    const handleSuiteCreated = async (suiteData) => {
        console.log('Suite created successfully:', suiteData);
        toast.success('Test suite created successfully!', { duration: 5000 });
        
        // Reload suites to ensure we have the latest data
        try {
            await actions.suites.loadTestSuites();
            
            // Activate the newly created suite
            if (suiteData && suiteData.id) {
                await actions.suites.activateSuite(suiteData);
            }
            
            // Close the modal and show tips mode
            setShowCreateSuiteModal(false);
            setShowTipsMode(true);
            setAppReady(true);
        } catch (error) {
            console.error('Error after suite creation:', error);
            toast.error('Suite created but failed to reload. Please refresh the page.');
            setShowCreateSuiteModal(false);
            setAppReady(true);
        }
    };

    const handleSuiteModalCancel = () => {
        // For first-time users, they can't cancel creating a suite
        // The modal should handle this by not showing cancel option when required
        if (needsTestSuite()) {
            return; // Don't allow cancel if they need a suite
        }
        setShowCreateSuiteModal(false);
    };

    const handleTipsSuiteCreated = async (newSuite) => {
        // Handle suite creation from tips mode
        try {
            await actions.suites.loadTestSuites();
            if (newSuite && newSuite.id) {
                await actions.suites.activateSuite(newSuite);
            }
            toast.success('Test suite created successfully!', { duration: 5000 });
        } catch (error) {
            console.error('Error after tips suite creation:', error);
            toast.error('Suite created but failed to reload. Please refresh the page.');
        }
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

    // Show create suite modal if user needs to create their first suite
    if (showCreateSuiteModal && needsTestSuite()) {
        return (
            <PageLayout>
                <CreateSuiteModal
                    isOpen={true}
                    onSuiteCreated={handleSuiteCreated}
                    onCancel={handleSuiteModalCancel}
                    isRequired={true} // This prevents cancel and shows appropriate messaging
                    accountType={state.auth.currentUser?.account_type || state.auth.currentUser?.accountType}
                />
                <div id="modal-root" />
                <div id="toast-root" />
            </PageLayout>
        );
    }

    // Show loading if app not ready
    if (!appReady) {
        return <LoadingScreen message="Preparing your workspace..." />;
    }

    // Show tips mode if user has suites but dashboard would be empty
    // BUT NOT if user is on a route that should bypass tips mode
    if (showTipsMode && shouldShowDashboard() && !shouldBypassTipsMode) {
        return (
            <PageLayout title="Dashboard">
                <TipsMode 
                    isTrialActive={state.subscription.isTrialActive}
                    trialDaysRemaining={state.subscription.trialDaysRemaining}
                    isOrganizationAccount={
                        state.auth.currentUser?.account_type === 'organization' || 
                        state.auth.currentUser?.accountType === 'organization'
                    }
                    onSuiteCreated={handleTipsSuiteCreated}
                />
                <div id="modal-root" />
                <div id="toast-root" />
            </PageLayout>
        );
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