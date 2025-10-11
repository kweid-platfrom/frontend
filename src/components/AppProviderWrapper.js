/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppProvider';
import LoadingScreen from './common/LoadingScreen';
import Register from './auth/Register';
import Login from './auth/Login';
import PageLayout from './layout/PageLayout';
import CreateSuiteModal from './modals/createSuiteModal';
import TipsMode from './TipsMode';

// Persistent storage for tracking user interactions
const STORAGE_KEY = 'userAppInteractions';
const INTERACTION_THRESHOLD = 2;

const AppProviderWrapper = ({ children }) => {
  const pathname = usePathname();
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  
  // FIXED: Check if path starts with /learn (catches /learn, /learn/*, /learn/test-types, etc.)
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/learn');

  if (isPublicRoute) {
    return <PublicRouteContent>{children}</PublicRouteContent>;
  }

  return (
    <AppProvider>
      <ProtectedRouteContent>{children}</ProtectedRouteContent>
    </AppProvider>
  );
};

// New component for public routes that still has access to global theme
const PublicRouteContent = ({ children }) => {
  return <div className="public-route">{children}</div>;
};

const ProtectedRouteContent = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { state, actions, isAuthenticated, isLoading } = useApp();
  const [appReady, setAppReady] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [showTipsMode, setShowTipsMode] = useState(false);
  const [interactionCount, setInteractionCount] = useState(() => {
    // Load interaction count from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const bypassTipsModeRoutes = ['/documents', '/documents/create'];
  const interactiveRoutes = ['/test-cases', '/bugs', '/sprints', '/dashboard'];
  const shouldBypassTipsMode = bypassTipsModeRoutes.some((route) => pathname.startsWith(route));

  // Track user interactions
  const trackInteraction = useCallback(() => {
    setInteractionCount((prev) => {
      const newCount = prev + 1;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newCount.toString());
      }
      return newCount;
    });
  }, []);

  // Monitor page navigation for interactions
  useEffect(() => {
    if (interactiveRoutes.some((route) => pathname.startsWith(route))) {
      trackInteraction();
    }
  }, [pathname, trackInteraction]);

  // Memoized helper functions
  const needsEmailVerification = useCallback(
    () =>
      state.auth.currentUser?.uid &&
      state.auth.currentUser?.emailVerified === false &&
      state.auth.isInitialized,
    [state.auth.currentUser?.uid, state.auth.currentUser?.emailVerified, state.auth.isInitialized]
  );

  const isFullyAuthenticated = useCallback(
    () => isAuthenticated && state.auth.currentUser?.uid && state.auth.currentUser?.emailVerified === true,
    [isAuthenticated, state.auth.currentUser?.uid, state.auth.currentUser?.emailVerified]
  );

  const shouldShowAuthUI = useCallback(
    () => state.auth.isInitialized && !isAuthenticated && !state.auth.currentUser?.uid,
    [state.auth.isInitialized, isAuthenticated, state.auth.currentUser?.uid]
  );

  const needsTestSuite = useCallback(
    () =>
      isFullyAuthenticated() &&
      state.auth.profileLoaded &&
      (!state.suites.testSuites || state.suites.testSuites.length === 0) &&
      !state.suites.loading,
    [isFullyAuthenticated, state.auth.profileLoaded, state.suites.testSuites, state.suites.loading]
  );

  const shouldShowDashboard = useCallback(
    () =>
      isFullyAuthenticated() &&
      state.suites.testSuites?.length > 0 &&
      state.suites.activeSuite,
    [isFullyAuthenticated, state.suites.testSuites, state.suites.activeSuite]
  );

  // Handle suite creation
  const handleSuiteCreated = useCallback(
    async (suiteData) => {
      try {
        console.log('Suite created:', suiteData);
        await actions.suites.loadTestSuites();
        if (suiteData?.id) {
          await actions.suites.activateSuite(suiteData);
          trackInteraction(); // Count suite creation as an interaction
        }
        
        // Use centralized notification system instead of direct toast
        actions.ui.showNotification({
          id: `suite-created-${Date.now()}`,
          type: 'success',
          message: 'Test suite created successfully!',
          duration: 5000
        });
        
        setShowCreateSuiteModal(false);
        setShowTipsMode(interactionCount < INTERACTION_THRESHOLD && !shouldBypassTipsMode);
        setAppReady(true);
      } catch (error) {
        console.error('Error after suite creation:', error);
        
        // Use centralized notification system for errors
        actions.ui.showNotification({
          id: `suite-error-${Date.now()}`,
          type: 'error',
          message: 'Suite created but failed to reload. Please refresh.',
          duration: 5000
        });
        
        setShowCreateSuiteModal(false);
        setAppReady(true);
      }
    },
    [actions.suites, actions.ui, interactionCount, shouldBypassTipsMode, trackInteraction]
  );

  const handleTipsSuiteCreated = useCallback(
    async (newSuite) => {
      try {
        await actions.suites.loadTestSuites();
        if (newSuite?.id) {
          await actions.suites.activateSuite(newSuite);
          trackInteraction(); // Count suite creation as an interaction
        }
        
        // Use centralized notification system
        actions.ui.showNotification({
          id: `tips-suite-created-${Date.now()}`,
          type: 'success',
          message: 'Test suite created successfully!',
          duration: 5000
        });
        
        setShowTipsMode(interactionCount < INTERACTION_THRESHOLD && !shouldBypassTipsMode);
        setAppReady(true);
      } catch (error) {
        console.error('Error after tips suite creation:', error);
        
        // Use centralized notification system for errors
        actions.ui.showNotification({
          id: `tips-suite-error-${Date.now()}`,
          type: 'error',
          message: 'Suite created but failed to reload. Please refresh.',
          duration: 5000
        });
      }
    },
    [actions.suites, actions.ui, interactionCount, shouldBypassTipsMode, trackInteraction]
  );

  // Main effect for authentication and suite handling
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      if (!state.auth.isInitialized) {
        setAppReady(false);
        return;
      }

      if (needsEmailVerification()) {
        actions.ui.closeModal('createSuite');
        actions.suites.clearSuites();
        router.push('/verify-email');
        setAppReady(false);
        return;
      }

      if (shouldShowAuthUI()) {
        setAppReady(false);
        return;
      }

      if (isFullyAuthenticated() && !state.auth.profileLoaded) {
        console.log('Fetching user profile...');
        try {
          await actions.auth.refreshUserProfile();
          console.log('User profile loaded');
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      }

      if (state.auth.loading || state.subscription.loading || state.suites.loading) {
        setAppReady(false);
        return;
      }

      if (
        state.subscription.isTrialActive &&
        state.subscription.trialEndsAt &&
        new Date() > new Date(state.subscription.trialEndsAt)
      ) {
        try {
          await actions.subscription.handleTrialExpiry(state.suites, actions.suites, actions.ui);
        } catch (error) {
          console.error('Error handling trial expiry:', error);
          
          // Use centralized notification system
          actions.ui.showNotification({
            id: `trial-expiry-error-${Date.now()}`,
            type: 'error',
            message: error.message || 'Error updating subscription.',
            duration: 5000
          });
        }
        setAppReady(false);
        return;
      }

      if (needsTestSuite() && mounted) {
        setShowCreateSuiteModal(true);
        setShowTipsMode(false);
        setAppReady(false);
        return;
      }

      if (isFullyAuthenticated()) {
        const hasAnySuites = state.suites.testSuites?.length > 0;
        const hasActiveSuite = !!state.suites.activeSuite;

        if (hasAnySuites && !hasActiveSuite && mounted) {
          console.log('Activating first suite:', state.suites.testSuites[0]);
          actions.suites.activateSuite(state.suites.testSuites[0]);
        }

        if (hasAnySuites && hasActiveSuite && mounted) {
          setShowTipsMode(interactionCount < INTERACTION_THRESHOLD && !shouldBypassTipsMode);
          setAppReady(true);
          setShowCreateSuiteModal(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
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
    shouldBypassTipsMode,
    actions.suites,
    actions.ui,
    actions.auth,
    actions.subscription,
    interactionCount,
  ]);

  const getLoadingMessage = useCallback(() => {
    if (!state.auth.isInitialized) return 'Initializing application...';
    if (state.auth.loading) return 'Authenticating...';
    if (needsEmailVerification()) return 'Redirecting to email verification...';
    if (state.subscription.loading) return 'Loading subscription info...';
    if (state.suites.loading) return 'Loading workspaces...';
    if (isLoading) return 'Preparing your workspace...';
    return 'Loading...';
  }, [
    state.auth.isInitialized,
    state.auth.loading,
    needsEmailVerification,
    state.subscription.loading,
    state.suites.loading,
    isLoading,
  ]);

  if (
    !state.auth.isInitialized ||
    (isFullyAuthenticated() && (state.auth.loading || isLoading || state.subscription.loading || state.suites.loading))
  ) {
    return <LoadingScreen message={getLoadingMessage()} />;
  }

  if (shouldShowAuthUI()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-slate-900 dark:via-gray-900 dark:to-teal-900 transition-colors duration-200">
        {authMode === 'register' ? (
          <Register onSwitchToLogin={() => setAuthMode('login')} />
        ) : (
          <Login
            onLoginComplete={() => console.log('Login completed')}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        )}
        <div id="modal-root" />
        <div id="toast-root" />
      </div>
    );
  }

  if (showCreateSuiteModal && needsTestSuite()) {
    return (
      <PageLayout>
        <CreateSuiteModal
          isOpen={true}
          onSuiteCreated={handleSuiteCreated}
          onCancel={() => needsTestSuite() ? null : setShowCreateSuiteModal(false)}
          isRequired={true}
          accountType={state.auth.currentUser?.accountType || 'individual'}
        />
        <div id="modal-root" />
        <div id="toast-root" />
      </PageLayout>
    );
  }

  if (!appReady) {
    return <LoadingScreen message="Preparing your workspace..." />;
  }

  if (showTipsMode && shouldShowDashboard() && !shouldBypassTipsMode) {
    return (
      <PageLayout title="Dashboard">
        <TipsMode
          isTrialActive={state.subscription.isTrialActive}
          trialDaysRemaining={state.subscription.trialDaysRemaining}
          isOrganizationAccount={state.auth.currentUser?.accountType === 'organization'}
          onSuiteCreated={handleTipsSuiteCreated}
          onInteraction={trackInteraction}
        />
        <div id="modal-root" />
        <div id="toast-root" />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {children}
      <div id="modal-root" />
      <div id="toast-root" />
    </PageLayout>
  );
};

export default AppProviderWrapper;