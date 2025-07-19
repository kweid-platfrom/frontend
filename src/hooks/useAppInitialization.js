/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from 'react';

export const useAppInitialization = (
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

    const initializeApp = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (NO_AUTH_CHECK_PAGES.includes(pathname) && !token) {
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        if (!isAuthenticated) {
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        try {
            setGlobalLoading(true);
            const createTimeoutPromise = (checkFn, timeout = 5000) => {
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
                        setAppPreferences((prev) => ({ ...prev, ...JSON.parse(savedPreferences) }));
                    }
                    localStorage.setItem('appPreferencesLoaded', 'true');
                } catch (error) {
                    console.warn('Error loading app preferences:', error);
                }
            }

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
        }
    }, [NO_AUTH_CHECK_PAGES, pathname, isAuthenticated, setIsInitialized, setGlobalLoading, subscription.subscriptionStatus, setError, userProfile.userProfile, suite.suites, setFeatureFlags, setAppPreferences, addNotification]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (NO_AUTH_CHECK_PAGES.includes(pathname) && !token) {
            setIsInitialized(true);
            setGlobalLoading(false);
            setError(null);
            return;
        }

        if (!isAuthenticated) {
            setIsInitialized(true);
            setGlobalLoading(false);
            setError(null);
            return;
        }

        initializeApp();
    }, [isAuthenticated, initializeApp, pathname, NO_AUTH_CHECK_PAGES, setIsInitialized, setGlobalLoading, setError]);
};