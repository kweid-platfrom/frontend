/* eslint-disable react-hooks/exhaustive-deps */
// contexts/AppProvider.js - Unified provider for QA Test Management Platform
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';
import { UserProfileProvider, useUserProfile } from './userProfileContext';
import SubscriptionProvider, { useSubscription } from './subscriptionContext';
import { SuiteProvider, useSuite } from './SuiteContext';

// Public pages to skip auth checks when no token is present
const NO_AUTH_CHECK_PAGES = ['/login', '/register'];

// Create unified app context
const AppContext = createContext();

// Custom hook to access unified app state
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// Internal provider that combines all contexts
const UnifiedAppProvider = ({ children }) => {
    // Get all context values
    const auth = useAuth();
    const userProfile = useUserProfile();
    const subscription = useSubscription();
    const suite = useSuite();
    const pathname = usePathname();
    const router = useRouter();

    // Track initialization state with refs to prevent unnecessary re-renders
    const initializationRef = useRef({
        isInitialized: false,
        isInitializing: false,
        lastAuthState: null,
        initializationPromise: null,
    });

    // Application-wide state
    const [notifications, setNotifications] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appPreferences, setAppPreferences] = useState({
        theme: 'system',
        language: 'en',
        notifications: {
            email: true,
            push: true,
            inApp: true,
        },
    });

    // Navigation state
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const initialModule = pathname?.split('/')[1] || null;
    const [activeModule, setActiveModule] = useState(() => {
        return initialModule && initialModule !== '' ? initialModule : null;
    });

    // Feature flags
    const [featureFlags, setFeatureFlags] = useState({
        betaFeatures: false,
        advancedReports: false,
        teamCollaboration: false,
        apiAccess: false,
        automation: false,
    });

    // Stable authentication status
    const isAuthenticated = useMemo(() => {
        const currentAuth = auth.currentUser && auth.currentUser.uid && !auth.loading;
        if (initializationRef.current.lastAuthState !== currentAuth) {
            initializationRef.current.lastAuthState = currentAuth;
        }
        return currentAuth;
    }, [auth.currentUser?.uid, auth.loading]);

    // Override auth loading for public pages
    const authLoadingOverride = useMemo(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        return NO_AUTH_CHECK_PAGES.includes(pathname) && !token ? false : auth.loading;
    }, [auth.loading, pathname]);

    // Optimized loading state
    const isLoading = useMemo(() => {
        if (!isAuthenticated) return false;
        if (initializationRef.current.isInitialized) return false;
        return (
            initializationRef.current.isInitializing ||
            userProfile.isLoading ||
            subscription.isLoading ||
            suite.isLoading ||
            globalLoading
        );
    }, [
        isAuthenticated,
        userProfile.isLoading,
        subscription.isLoading,
        suite.isLoading,
        globalLoading,
    ]);

    // Memoized user capabilities
    const userCapabilities = useMemo(() => {
        if (!isAuthenticated || !subscription.subscriptionStatus) {
            return {
                canCreateSuite: false,
                canViewSuite: false,
                canEditSuite: false,
                canDeleteSuite: false,
                canInviteTeamMembers: false,
                canManageOrganization: false,
                hasActiveSubscription: false,
                isTrialActive: false,
                trialDaysRemaining: 0,
            };
        }

        const capabilities = subscription.subscriptionStatus.capabilities || {};
        const limits = subscription.getFeatureLimits?.() || {};

        return {
            ...capabilities,
            limits,
            canCreateSuite: auth.canCreateSuite,
            canViewSuite: auth.canViewSuite,
            canEditSuite: auth.canEditSuite,
            canDeleteSuite: auth.canDeleteSuite,
            canInviteTeamMembers: auth.canInviteTeamMembers,
            canManageOrganization: auth.canManageOrganization,
            hasActiveSubscription: subscription.subscriptionStatus.isValid || false,
            isTrialActive: subscription.subscriptionStatus.isTrial || false,
            trialDaysRemaining: subscription.subscriptionStatus.trialDaysRemaining || 0,
            canCreateResource: subscription.canCreateResource,
            getResourceLimit: subscription.getResourceLimit,
        };
    }, [
        isAuthenticated,
        subscription.subscriptionStatus,
        auth.canCreateSuite,
        auth.canViewSuite,
        auth.canEditSuite,
        auth.canDeleteSuite,
        auth.canInviteTeamMembers,
        auth.canManageOrganization,
        subscription.getFeatureLimits,
        subscription.canCreateResource,
        subscription.getResourceLimit,
    ]);

    // Optimized account summary
    const accountSummary = useMemo(() => {
        if (!isAuthenticated || !userProfile.userProfile || !auth.currentUser) {
            return null;
        }

        const profile = userProfile.userProfile;
        const subs = subscription.subscriptionStatus || {};

        return {
            user: {
                uid: auth.currentUser.uid,
                email: auth.email || auth.currentUser.email,
                displayName: auth.displayName || auth.currentUser.displayName,
                emailVerified: auth.currentUser.emailVerified,
                photoURL: auth.currentUser.photoURL,
            },
            profile: {
                accountType: auth.accountType || profile.accountType,
                organizationId: profile.organizationId,
                organizationName: profile.organizationName,
                role: auth.getPrimaryUserRole(profile.organizationId) || profile.role,
                memberships: profile.account_memberships || [],
            },
            subscription: {
                plan: subs.subscriptionPlan || 'individual_free',
                status: subs.subscriptionStatus || 'inactive',
                isValid: subs.isValid || false,
                isTrial: subs.isTrial || false,
                trialDaysRemaining: subs.trialDaysRemaining || 0,
                billingCycle: subs.billingCycle,
                nextBillingDate: subs.nextBillingDate,
                willCancelAt: subs.willCancelAt,
                isExpired: subs.isExpired || false,
                showTrialBanner: subs.showTrialBanner || false,
                showUpgradePrompt: subs.showUpgradePrompt || true,
            },
            suites: {
                total: suite.suites?.length || 0,
                active: suite.activeSuite,
                canCreate: auth.canCreateSuite,
            },
        };
    }, [
        isAuthenticated,
        auth.currentUser,
        auth.email,
        auth.displayName,
        auth.accountType,
        auth.getPrimaryUserRole,
        auth.canCreateSuite,
        userProfile.userProfile,
        subscription.subscriptionStatus,
        suite.suites,
        suite.activeSuite,
    ]);

    // Notification management
    const addNotification = useCallback((notification) => {
        const id = Date.now().toString();
        const newNotification = {
            id,
            timestamp: new Date(),
            read: false,
            ...notification,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        if (notification.type === 'success' || notification.type === 'info') {
            setTimeout(() => removeNotification(id), 5000);
        }
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const markNotificationAsRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Navigation helpers
    const navigateToModule = useCallback((module) => {
        setActiveModule(module);
        const moduleMap = {
            dashboard: ['Dashboard'],
            bugs: ['Bug Tracker'],
            testcases: ['Test Cases'],
            recordings: ['Recordings'],
            automation: ['Automation'],
            reports: ['Reports'],
            settings: ['Settings'],
            upgrade: ['Upgrade'],
        };
        setBreadcrumbs(moduleMap[module] || [module]);
    }, []);

    const updateBreadcrumbs = useCallback((crumbs) => {
        setBreadcrumbs(crumbs);
    }, []);

    // Feature access helpers
    const hasFeatureAccess = useCallback(
        (feature) => subscription.hasFeatureAccess?.(feature) || false,
        [subscription.hasFeatureAccess],
    );

    const checkFeatureLimit = useCallback(
        (feature, currentUsage) => {
            const limits = subscription.getFeatureLimits?.() || {};
            const limit = limits[feature] || 0;
            if (limit === -1) return { canUse: true, unlimited: true };
            return {
                canUse: currentUsage < limit,
                unlimited: false,
                limit,
                remaining: Math.max(0, limit - currentUsage),
                usage: currentUsage,
            };
        },
        [subscription.getFeatureLimits],
    );

    const canCreateResource = useCallback(
        (resourceType, currentCount = 0) =>
            subscription.canCreateResource?.(resourceType, currentCount) || false,
        [subscription.canCreateResource],
    );

    const getResourceLimit = useCallback(
        (resourceType) => subscription.getResourceLimit?.(resourceType) || 0,
        [subscription.getResourceLimit],
    );

    // Application initialization
    const initializeApp = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (NO_AUTH_CHECK_PAGES.includes(pathname) && !token) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        if (initializationRef.current.isInitializing) {
            return initializationRef.current.initializationPromise;
        }

        if (!isAuthenticated) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        if (initializationRef.current.isInitialized) {
            return;
        }

        initializationRef.current.isInitializing = true;

        const initPromise = (async () => {
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
                    const capabilities = subscription.subscriptionStatus.capabilities;
                    setFeatureFlags((prev) => {
                        const newFlags = {
                            betaFeatures: capabilities.canUseAPI || false,
                            advancedReports: capabilities.canExportReports || false,
                            teamCollaboration: capabilities.canInviteTeamMembers || false,
                            apiAccess: capabilities.canUseAPI || false,
                            automation: capabilities.canCreateAutomatedTests || false,
                        };
                        if (JSON.stringify(prev) !== JSON.stringify(newFlags)) {
                            return newFlags;
                        }
                        return prev;
                    });
                }

                if (typeof window !== 'undefined' && !localStorage.getItem('appPreferencesLoaded')) {
                    try {
                        const savedPreferences = localStorage.getItem('appPreferences');
                        if (savedPreferences) {
                            const parsed = JSON.parse(savedPreferences);
                            setAppPreferences((prev) => ({ ...prev, ...parsed }));
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
        isAuthenticated,
        userProfile.userProfile,
        subscription.subscriptionStatus,
        suite.suites,
        addNotification,
        pathname,
    ]);

    // Initialization effect
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

        if (isAuthenticated && !initializationRef.current.isInitialized && !initializationRef.current.isInitializing) {
            initializeApp();
        }
    }, [isAuthenticated, initializeApp, pathname]);

    // Save preferences with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem('appPreferences', JSON.stringify(appPreferences));
            } catch (error) {
                console.warn('Error saving app preferences:', error);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [appPreferences]);

    // Refresh all data
    const refreshAll = useCallback(async () => {
        const promises = [];
        if (userProfile.refreshProfile) {
            promises.push(userProfile.refreshProfile());
        }
        if (suite.refetchSuites) {
            promises.push(suite.refetchSuites(true));
        }
        if (subscription.updateTrialStatusInDatabase) {
            promises.push(subscription.updateTrialStatusInDatabase());
        }
        await Promise.allSettled(promises);
    }, [
        userProfile.refreshProfile,
        suite.refetchSuites,
        subscription.updateTrialStatusInDatabase,
    ]);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            setNotifications([]);
            setActiveModule(null);
            setBreadcrumbs([]);
            setError(null);
            initializationRef.current.isInitialized = false;
            initializationRef.current.isInitializing = false;
            initializationRef.current.initializationPromise = null;
            initializationRef.current.lastAuthState = null;
            localStorage.removeItem('appPreferences');
            localStorage.removeItem('appPreferencesLoaded');
            await auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            addNotification({
                type: 'error',
                title: 'Sign Out Error',
                message: 'Failed to sign out. Please try again.',
            });
        }
    }, [auth.signOut, addNotification, router]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Memoized context value
    const value = useMemo(
        () => ({
            // Authentication
            ...auth,
            isAuthenticated,
            loading: authLoadingOverride,

            // User Profile
            profile: userProfile.userProfile,
            userProfile: userProfile.userProfile,
            isLoading: userProfile.isLoading,
            isUpdating: userProfile.isUpdating,
            displayName: auth.displayName,
            email: auth.email,
            accountType: auth.accountType,
            isAdmin: auth.isAdmin,
            currentAccount: userProfile.currentAccount,
            hasAdminPermission: auth.hasPermission('manage_organization'),
            isNewUser: userProfile.isNewUser,
            isProfileLoaded: !!userProfile.userProfile,
            fetchUserProfile: userProfile.fetchUserProfile,
            updateProfile: userProfile.updateProfile,
            updateProfileField: userProfile.updateProfileField,
            setupNewUserProfile: userProfile.setupNewUserProfile,
            refreshUserProfile: userProfile.refreshProfile,
            clearProfile: userProfile.clearProfile,
            updateUserProfile: auth.updateUserProfile,

            // Subscription
            subscription: subscription.subscriptionStatus,
            subscriptionStatus: subscription.subscriptionStatus,
            hasFeatureAccess: subscription.hasFeatureAccess,
            getFeatureLimits: subscription.getFeatureLimits,
            updateTrialStatusInDatabase: subscription.updateTrialStatusInDatabase,
            canCreateResource: subscription.canCreateResource,
            getResourceLimit: subscription.getResourceLimit,
            createCheckoutSession: subscription.createCheckoutSession,
            cancelSubscription: subscription.cancelSubscription,
            reactivateSubscription: subscription.reactivateSubscription,
            getBillingHistory: subscription.getBillingHistory,
            updatePaymentMethod: subscription.updatePaymentMethod,
            billingConfig: subscription.billingConfig,
            capabilities: subscription.capabilities,

            // Test Suites
            suites: suite.suites,
            userTestSuites: suite.userTestSuites,
            activeSuite: suite.activeSuite,
            setActiveSuite: suite.setActiveSuite,
            createTestSuite: suite.createTestSuite,
            canCreateSuite: auth.canCreateSuite,
            refetchSuites: suite.refetchSuites,
            fetchUserSuites: suite.fetchUserSuites,
            getSuiteLimit: suite.getSuiteLimit,
            shouldFetchSuites: suite.shouldFetchSuites,

            // Application State
            isInitialized,
            isLoading,
            error,
            accountSummary,
            userCapabilities,

            // Notifications
            notifications,
            addNotification,
            removeNotification,
            markNotificationAsRead,
            clearAllNotifications,

            // Navigation
            activeModule,
            breadcrumbs,
            sidebarCollapsed,
            setSidebarCollapsed,
            navigateToModule,
            updateBreadcrumbs,

            // Features
            featureFlags,
            hasFeatureAccess,
            checkFeatureLimit,
            canCreateResource,
            getResourceLimit,

            // Preferences
            appPreferences,
            setAppPreferences,

            // Utilities
            refreshAll,
            clearError,
            signOut,
        }),
        [
            auth,
            isAuthenticated,
            authLoadingOverride,
            userProfile,
            subscription,
            suite,
            isInitialized,
            isLoading,
            error,
            accountSummary,
            userCapabilities,
            notifications,
            addNotification,
            removeNotification,
            markNotificationAsRead,
            clearAllNotifications,
            activeModule,
            breadcrumbs,
            sidebarCollapsed,
            navigateToModule,
            updateBreadcrumbs,
            featureFlags,
            hasFeatureAccess,
            checkFeatureLimit,
            canCreateResource,
            getResourceLimit,
            appPreferences,
            refreshAll,
            clearError,
            signOut,
        ],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Main AppProvider component
export const AppProvider = ({ children }) => {
    return (
        <AuthProvider>
            <UserProfileProvider>
                <SubscriptionProvider>
                    <SuiteProvider>
                        <UnifiedAppProvider>{children}</UnifiedAppProvider>
                    </SuiteProvider>
                </SubscriptionProvider>
            </UserProfileProvider>
        </AuthProvider>
    );
};

// Convenience hooks
export const useAppAuth = () => {
    const { currentUser, signIn, signOut, registerWithEmail, loading, authError } = useApp();
    return { user: currentUser, signIn, signOut, signUp: registerWithEmail, loading, error: authError };
};

export const useAppSubscription = () => {
    const {
        subscription,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        canCreateResource,
        getResourceLimit,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        billingConfig,
        capabilities,
    } = useApp();
    return {
        subscription,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        canCreateResource,
        getResourceLimit,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        billingConfig,
        capabilities,
    };
};

export const useAppSuites = () => {
    const {
        suites,
        activeSuite,
        setActiveSuite,
        createTestSuite,
        canCreateSuite,
        refetchSuites,
    } = useApp();
    return {
        suites,
        activeSuite,
        setActiveSuite,
        createTestSuite,
        canCreateSuite,
        refetchSuites,
    };
};

export const useAppProfile = () => {
    const { userProfile, profile, refreshUserProfile, updateProfile, isLoading } = useApp();
    return {
        userProfile,
        profile,
        refreshUserProfile,
        updateProfile,
        loading: isLoading,
    };
};

export const useAppNavigation = () => {
    const {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
        updateBreadcrumbs,
    } = useApp();
    return {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
        updateBreadcrumbs,
    };
};

export const useAppNotifications = () => {
    const {
        notifications,
        addNotification,
        removeNotification,
        markNotificationAsRead,
        clearAllNotifications,
    } = useApp();
    return {
        notifications,
        addNotification,
        removeNotification,
        markNotificationAsRead,
        clearAllNotifications,
    };
};

export const useAppFeatures = () => {
    const {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities,
        canCreateResource,
        getResourceLimit,
    } = useApp();
    return {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities,
        canCreateResource,
        getResourceLimit,
    };
};

export default AppProvider;