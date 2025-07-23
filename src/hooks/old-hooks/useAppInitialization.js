/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef } from 'react';

const useAppInitialization = (
    isAuthenticated,
    pathname,
    userProfile,
    subscription,
    suite,
    setIsInitialized,
    setGlobalLoading,
    setError,
    setFeatureFlags,
    setAppPreferences,
    addNotification
) => {
    const NO_AUTH_CHECK_PAGES = ['/login', '/register'];
    const initializationRef = useRef({
        isInitialized: false,
        isInitializing: false,
        lastAuthState: null,
        initializationPromise: null,
    });

    const initializeApp = useCallback(async () => {
        if (initializationRef.current.isInitializing) {
            return initializationRef.current.initializationPromise;
        }

        if (initializationRef.current.isInitialized) {
            return;
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (NO_AUTH_CHECK_PAGES.includes(pathname) && !token) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        if (!isAuthenticated) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        initializationRef.current.isInitializing = true;
        const initPromise = (async () => {
            try {
                setGlobalLoading(true);
                const createTimeoutPromise = (checkFn, timeout = 10000) => {
                    return new Promise((resolve) => {
                        const startTime = Date.now();
                        const check = () => {
                            if (checkFn() || Date.now() - startTime > timeout) {
                                resolve();
                            } else {
                                setTimeout(check, 100);
                            }
                        };
                        check();
                    });
                };

                await Promise.allSettled([
                    createTimeoutPromise(() => userProfile.userProfile),
                    createTimeoutPromise(() => subscription.subscriptionStatus),
                    createTimeoutPromise(() => suite.suites),
                ]);

                if (subscription.subscriptionStatus?.capabilities) {
                    setFeatureFlags((prev) => ({
                        ...prev,
                        betaFeatures: subscription.subscriptionStatus.capabilities.canUseAPI || false,
                        advancedReports: subscription.subscriptionStatus.capabilities.canExportReports || false,
                        teamCollaboration: subscription.subscriptionStatus.capabilities.canInviteTeamMembers || false,
                        apiAccess: subscription.subscriptionStatus.capabilities.canUseAPI || false,
                        automation: subscription.subscriptionStatus.capabilities.canCreateAutomatedTests || false,
                        bugTracker: true,
                    }));
                }

                if (typeof window !== 'undefined' && !localStorage.getItem('appPreferencesLoaded')) {
                    try {
                        const savedPreferences = localStorage.getItem('appPreferences');
                        if (savedPreferences) {
                            const parsedPreferences = JSON.parse(savedPreferences);
                            setAppPreferences((prev) => ({ ...prev, ...parsedPreferences }));
                        }
                        localStorage.setItem('appPreferencesLoaded', 'true');
                    } catch (error) {
                        console.warn('Error loading app preferences:', error);
                    }
                }

                initializationRef.current.isInitialized = true;
                setIsInitialized(true);
                setError(null);
            } catch (error) {
                console.error('Error initializing app:', error);
                setError(error.message);
                addNotification({
                    type: 'error',
                    title: 'Initialization Error',
                    message: 'Failed to initialize application. Please refresh the page.',
                    persistent: true,
                });
            } finally {
                setGlobalLoading(false);
                initializationRef.current.isInitializing = false;
                initializationRef.current.initializationPromise = null;
            }
        })();

        initializationRef.current.initializationPromise = initPromise;
        return initPromise;
    }, [
        pathname,
        isAuthenticated,
        userProfile.userProfile,
        subscription.subscriptionStatus,
        suite.suites,
        setIsInitialized,
        setGlobalLoading,
        setError,
        setFeatureFlags,
        setAppPreferences,
        addNotification,
    ]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (NO_AUTH_CHECK_PAGES.includes(pathname) && !token) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            setError(null);
            return;
        }

        if (!isAuthenticated) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            setError(null);
            return;
        }

        initializeApp();
    }, [isAuthenticated, pathname, initializeApp]);

    return { initializeApp };
};      

export default useAppInitialization;