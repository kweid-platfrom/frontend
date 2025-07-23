/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppProvider';
import { useSuiteAccess } from '../hooks/useSuiteAccess';
import LoadingScreen from './common/LoadingScreen';
import CreateSuiteModal from './modals/createSuiteModal';

const AppProviderWrapper = ({ children }) => {
    const pathname = usePathname();
    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/email-verification'];

    // Skip authentication logic for public routes
    const isPublicRoute = publicRoutes.includes(pathname);

    const { state, actions, isAuthenticated, isLoading } = useApp();
    const { needsSuiteCreation, shouldShowSuiteModal, createSuite } = useSuiteAccess();
    const { currentPlan, trialEndsAt, isTrialActive } = state.subscription;
    const daysRemainingInTrial = trialEndsAt
        ? Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;
    
    // Initialize appReady state properly
    const [appReady, setAppReady] = useState(() => {
        // Only set to true initially for public routes
        return isPublicRoute;
    });
    
    // Add state to track if we've already processed the access check
    const [accessCheckProcessed, setAccessCheckProcessed] = useState(false);
    
    const [toast, setToast] = useState({ type: '', message: '', duration: 5000 });

    useEffect(() => {
        // Skip auth initialization for public routes or if already initialized
        if (isPublicRoute || state.auth.isInitialized) {
            setAppReady(isPublicRoute);
            return;
        }

        console.log('🚀 Initializing app via AppProvider...');
        actions.auth.initializeAuth().catch((error) => {
            console.error('❌ Auth initialization error:', error);
            setToast({
                type: 'error',
                message: 'Failed to initialize app. Please try again later.',
                duration: 5000,
            });
        });
    }, [actions.auth, isPublicRoute, state.auth.isInitialized]);

    useEffect(() => {
        // Skip logic for public routes or if auth is not initialized
        if (isPublicRoute || !state.auth.isInitialized) {
            setAppReady(isPublicRoute);
            setAccessCheckProcessed(isPublicRoute);
            return;
        }

        // Don't re-process if we've already handled the access check and nothing critical changed
        if (accessCheckProcessed && !state.auth.loading) {
            return;
        }

        if (!state.auth.loading) {
            console.log('🔍 Evaluating app access...', {
                isAuthenticated,
                suitesCount: state.suites.suites.length,
                activeSuites: state.suites.suites.filter((s) => s.status === 'active').length,
                isTrialActive,
                currentPlan,
                trialEndsAt,
                daysRemainingInTrial,
                needsSuiteCreation,
                accessCheckProcessed,
            });

            if (!isAuthenticated) {
                setAppReady(false);
                setAccessCheckProcessed(true);
                actions.ui.closeModal('createSuite');
                return;
            }

            if (needsSuiteCreation) {
                console.log('🔒 Suite creation required');
                actions.ui.openModal('createSuite');
                setAppReady(false);
                setAccessCheckProcessed(true);
                return;
            }

            // Check trial expiry
            if (isTrialActive && trialEndsAt && new Date() > new Date(trialEndsAt)) {
                console.log('🔒 Trial expired');
                actions.subscription.handleTrialExpiry(state.suites, actions.suites).catch((error) => {
                    console.error('❌ Error handling trial expiry:', error);
                    setToast({
                        type: 'error',
                        message: 'Error updating subscription. Please contact support.',
                        duration: 5000,
                    });
                });
                setAppReady(false);
                setAccessCheckProcessed(true);
                return;
            }

            console.log('✅ App access validated, ready');
            actions.ui.closeModal('createSuite');
            setAppReady(true);
            setAccessCheckProcessed(true);
        }
    }, [
        state.auth.loading,
        state.auth.isInitialized,
        isAuthenticated,
        state.suites.suites.length,
        needsSuiteCreation,
        isTrialActive,
        trialEndsAt,
        accessCheckProcessed,
        isPublicRoute,
    ]);

    const handleSuiteCreated = async (newSuite) => {
        console.log('✅ Creating suite:', newSuite.name);
        try {
            const result = await createSuite({
                ...newSuite,
                ownerType: state.auth.accountType,
                ownerId: state.auth.currentUser.uid,
                status: 'active',
            });
            if (result.success) {
                actions.ui.closeModal('createSuite');
                // Reset access check so it re-evaluates with the new suite
                setAccessCheckProcessed(false);
                setAppReady(true);
                setToast({
                    type: 'success',
                    message: `Welcome to ${newSuite.name}! Your workspace is ready.`,
                    duration: 5000,
                });
            } else {
                setToast({ type: 'error', message: result.error.message, duration: 5000 });
            }
        } catch (error) {
            setToast({ type: 'error', message: error.message, duration: 5000 });
        }
    };

    // Toast component
    const ToastComponent = () => (
        toast.message && (
            <div
                className={`fixed bottom-4 right-4 p-4 rounded-lg text-white z-50 ${
                    toast.type === 'success' 
                        ? 'bg-green-600' 
                        : toast.type === 'error' 
                        ? 'bg-red-600' 
                        : 'bg-yellow-600'
                }`}
            >
                {toast.message}
            </div>
        )
    );

    // For public routes, render children directly
    if (isPublicRoute) {
        return (
            <div className="app-wrapper">
                {children}
                <div id="modal-root" />
                <div id="toast-root" />
                <ToastComponent />
            </div>
        );
    }

    // Show loading screen while initializing or loading
    if (state.auth.loading || !state.auth.isInitialized || isLoading) {
        return (
            <LoadingScreen
                message={
                    !state.auth.isInitialized
                        ? 'Initializing application...'
                        : 'Loading your workspace...'
                }
            />
        );
    }

    // Show auth prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold text-gray-900">
                            Welcome to QA Platform
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please sign in to access your test management workspace
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show suite creation modal if needed
    if (needsSuiteCreation && shouldShowSuiteModal) {
        return (
            <div className="app-wrapper">
                <LoadingScreen message="Setting up your workspace..." />
                <div id="modal-root">
                    <CreateSuiteModal
                        isOpen={true}
                        onSuiteCreated={handleSuiteCreated}
                        accountType={state.auth.accountType}
                        planLimits={state.subscription.planLimits}
                        isRequired={true}
                    />
                </div>
                <div id="toast-root" />
                <ToastComponent />
            </div>
        );
    }

    // Only render main app if everything is ready
    if (!appReady) {
        return (
            <LoadingScreen message="Preparing your workspace..." />
        );
    }

    // Main app render
    return (
        <div className="app-wrapper">
            {children}
            <div id="modal-root" />
            <div id="toast-root" />
            <ToastComponent />
        </div>
    );
};

export default AppProviderWrapper;