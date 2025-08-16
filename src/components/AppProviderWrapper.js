'use client'
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '../context/AppProvider';
import LoadingScreen from './common/LoadingScreen';
import Register from './auth/Register';
import Login from './auth/Login';
import PageLayout from './layout/PageLayout';
import CreateSuiteModal from './modals/createSuiteModal';
import TipsMode from './TipsMode';
import { useAuthFlow } from '../hooks/useAuthFlow';
import { useSuiteFlow } from '../hooks/useSuiteFlow';
import { useAppReadiness } from '../hooks/useAppReadiness';

const AppProviderWrapper = ({ children }) => {
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isPublicRoute) {
        return (
            <div className="public-route">
                {children}
            </div>
        );
    }

    return (
        <AppProvider>
            <ProtectedRouteContent>{children}</ProtectedRouteContent>
        </AppProvider>
    );
};

const ProtectedRouteContent = ({ children }) => {
    const pathname = usePathname();
    const { state, isLoading } = useApp();
    
    const { 
        isFullyAuthenticated, 
        shouldShowAuthUI,
        currentUser 
    } = useAuthFlow();
    
    const { 
        needsTestSuite, 
        shouldShowDashboard,
        showCreateSuiteModal, 
        setShowCreateSuiteModal, 
        handleSuiteCreated    } = useSuiteFlow();
    
    const { 
        appReady, 
        showTipsMode, 
        setShowTipsMode,
        shouldBypassTipsMode, 
        getLoadingMessage 
    } = useAppReadiness(pathname);
    
    const [authMode, setAuthMode] = useState('login');

    const handleLoginComplete = () => {
        console.log('Login completed, auth state will update automatically');
    };

    const handleSuiteModalCancel = () => {
        if (needsTestSuite) {
            return;
        }
        setShowCreateSuiteModal(false);
    };

    const handleTipsSuiteCreated = async (newSuite) => {
        const result = await handleSuiteCreated(newSuite);
        if (result.success) {
            setShowTipsMode(false);
        }
    };

    if (!state.auth.isInitialized ||
        (isFullyAuthenticated && (state.auth.loading || isLoading || state.subscription.loading || state.suites.loading))) {
        return <LoadingScreen message={getLoadingMessage()} />;
    }

    if (shouldShowAuthUI) {
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

    if (showCreateSuiteModal && needsTestSuite) {
        return (
            <PageLayout>
                <CreateSuiteModal
                    isOpen={true}
                    onSuiteCreated={handleSuiteCreated}
                    onCancel={handleSuiteModalCancel}
                    isRequired={true}
                    accountType={currentUser?.account_type || currentUser?.accountType}
                />
                <div id="modal-root" />
                <div id="toast-root" />
            </PageLayout>
        );
    }

    if (!appReady) {
        return <LoadingScreen message="Preparing your workspace..." />;
    }

    if (showTipsMode && shouldShowDashboard && !shouldBypassTipsMode) {
        return (
            <PageLayout title="Dashboard">
                <TipsMode 
                    isTrialActive={state.subscription.isTrialActive}
                    trialDaysRemaining={state.subscription.trialDaysRemaining}
                    isOrganizationAccount={
                        currentUser?.account_type === 'organization' || 
                        currentUser?.accountType === 'organization'
                    }
                    onSuiteCreated={handleTipsSuiteCreated}
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