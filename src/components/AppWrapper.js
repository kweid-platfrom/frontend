import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppProvider';
import LoadingScreen from './common/LoadingScreen';
import CreateSuiteModal from './modals/createSuiteModal';
import TrialExpiredModal from './modals/TrialExpiredModal';

const AppProviderWrapper = ({ children }) => {
    const {
        state,
        actions,
        isAuthenticated,
        hasCreatedSuite,
        suiteCreationBlocked,
        isTrialActive,
        planLimits,
        isLoading
    } = useApp();

    const [initializationComplete, setInitializationComplete] = useState(false);
    const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
    const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('🚀 Initializing app...');
                const authSuccess = await actions.initializeAuth();

                if (authSuccess) {
                    console.log('✅ Auth initialized successfully');
                    setInitializationComplete(true);
                } else {
                    console.log('❌ Auth initialization failed or user not authenticated');
                    actions.showToast('error', 'Authentication failed. Please sign in again.');
                    setInitializationComplete(true);
                }
            } catch (error) {
                console.error('❌ App initialization error:', error);
                actions.logError('App initialization failed', error);
                actions.showToast('error', 'Failed to initialize app. Please try again later.');
                setInitializationComplete(true);
            }
        };

        initializeApp();
    }, [actions]);

    useEffect(() => {
        if (!initializationComplete || !isAuthenticated || isLoading) {
            return;
        }

        console.log('🔍 Evaluating suite access...', {
            hasCreatedSuite,
            suiteCreationBlocked,
            isTrialActive,
            currentPlan: state.subscription.currentPlan,
            activeSuitesCount: state.suites.suites.length
        });

        const needsSuiteCreation = !hasCreatedSuite || suiteCreationBlocked || state.suites.suites.length === 0;

        if (needsSuiteCreation) {
            console.log('🔒 Suite creation required');
            setShowCreateSuiteModal(true);
            setAppReady(false);
        } else {
            console.log('✅ Suite access validated, app ready');
            setShowCreateSuiteModal(false);
            setAppReady(true);
        }
    }, [
        initializationComplete,
        isAuthenticated,
        isLoading,
        hasCreatedSuite,
        suiteCreationBlocked,
        state.suites.suites.length,
        state.subscription.currentPlan,
        isTrialActive,
        actions
    ]);

    const handleSuiteCreated = (newSuite) => {
        console.log('✅ Suite created successfully:', newSuite.name);
        setShowCreateSuiteModal(false);
        setAppReady(true);
        actions.activateSuite(newSuite);
        actions.showToast('success', `Welcome to ${newSuite.name}! Your workspace is ready.`);
    };

    const handleTrialExpiredAction = (action) => {
        if (action === 'upgrade') {
            setShowTrialExpiredModal(false);
            actions.openModal('upgradePrompt');
        } else if (action === 'continue') {
            setShowTrialExpiredModal(false);
        }
    };

    if (!initializationComplete || isLoading) {
        return (
            <LoadingScreen
                message={
                    !initializationComplete
                        ? "Initializing application..."
                        : "Loading your workspace..."
                }
            />
        );
    }

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

    if (showCreateSuiteModal) {
        return (
            <>
                <LoadingScreen message="Setting up your workspace..." />
                <CreateSuiteModal
                    isOpen={true}
                    onSuiteCreated={handleSuiteCreated}
                    accountType={state.auth.accountType}
                    planLimits={planLimits}
                    isRequired={true}
                />
            </>
        );
    }

    if (showTrialExpiredModal) {
        return (
            <>
                {children}
                <TrialExpiredModal
                    isOpen={true}
                    onAction={handleTrialExpiredAction}
                    excessSuites={state.suites.suites.length - planLimits.maxSuites}
                    currentPlan={state.subscription.currentPlan}
                />
            </>
        );
    }

    if (!appReady) {
        return <LoadingScreen message="Preparing your workspace..." />;
    }

    return (
        <div className="app-wrapper">
            {children}
            <div id="modal-root" />
            <div id="toast-root" />
        </div>
    );
};

export default AppProviderWrapper;