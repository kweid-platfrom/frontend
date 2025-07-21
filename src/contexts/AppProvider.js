"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';
import { UserProfileProvider, useUserProfile } from './userProfileContext';
import SubscriptionProvider, { useSubscription } from './subscriptionContext';
import { SuiteProvider, useSuite } from './SuiteContext';
import { EntityProvider, useEntityData } from './EntityProvider';

const NO_AUTH_CHECK_PAGES = ['/login', '/register'];

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

// Separate component to handle EntityProvider with proper dependencies
const EntityProviderWrapper = ({ children, isAuthenticated, activeSuiteId, orgId, accountType }) => {
    console.log('EntityProviderWrapper props:', { isAuthenticated, activeSuiteId, orgId, accountType });

    const hasRequiredProps = isAuthenticated &&
        activeSuiteId &&
        accountType &&
        (accountType === 'individual' || orgId);

    // Only render EntityProvider when we have valid data
    if (!hasRequiredProps) {
        console.log('EntityProviderWrapper: Missing required props, rendering without EntityProvider');
        return (
            <EntityProvider
                isAuthenticated={false}
                activeSuiteId={null}
                orgId={null}
                accountType={null}
            >
                {children}
            </EntityProvider>
        );
    }

    return (
        <EntityProvider
            isAuthenticated={isAuthenticated}
            activeSuiteId={activeSuiteId}
            orgId={orgId}
            accountType={accountType}
        >
            {children}
        </EntityProvider>
    );
};

const UnifiedAppProvider = ({ children }) => {
    const auth = useAuth();
    const userProfile = useUserProfile();
    const subscription = useSubscription();
    const suite = useSuite();
    const pathname = usePathname();
    const router = useRouter();

    const initializationRef = useRef({
        isInitialized: false,
        isInitializing: false,
        lastAuthState: null,
        initializationPromise: null,
    });

    const [notifications, setNotifications] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appPreferences, setAppPreferences] = useState({
        theme: 'system',
        language: 'en',
        notifications: { email: true, push: true, inApp: true },
    });
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeModule, setActiveModule] = useState(pathname?.split('/')[1] || null);
    const [featureFlags, setFeatureFlags] = useState({
        betaFeatures: false,
        advancedReports: false,
        teamCollaboration: false,
        apiAccess: false,
        automation: false,
        bugTracker: true,
    });

    // Compute authentication state
    const isAuthenticated = useMemo(() => {
        const authState = auth.currentUser && auth.currentUser.uid && !auth.loading;
        console.log('Computing isAuthenticated:', {
            hasUser: !!auth.currentUser,
            uid: auth.currentUser?.uid,
            loading: auth.loading,
            result: authState
        });
        return authState;
    }, [auth.currentUser, auth.loading]);

    // Compute Entity Provider props
    const entityProviderProps = useMemo(() => {
        if (!isAuthenticated || !userProfile.userProfile) {
            console.log('Entity props: Not authenticated or no profile');
            return {
                isAuthenticated: false,
                activeSuiteId: null,
                orgId: null,
                accountType: null,
            };
        }

        const activeSuiteId = suite.activeSuite?.id;
        const accountType = userProfile.userProfile?.accountType || auth.accountType;

        // For individual accounts, orgId should be null
        // For organization accounts, get from userProfile
        const orgId = accountType === 'individual'
            ? null
            : userProfile.userProfile?.organizationId;

        console.log('Computing entity props:', {
            isAuthenticated,
            activeSuiteId,
            orgId,
            accountType,
            hasProfile: !!userProfile.userProfile,
            hasActiveSuite: !!suite.activeSuite
        });

        return {
            isAuthenticated,
            activeSuiteId,
            orgId,
            accountType,
        };
    }, [isAuthenticated, userProfile.userProfile, suite.activeSuite, auth.accountType]);;

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

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
    }, [removeNotification]);

    const markNotificationAsRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

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

    const hasFeatureAccess = useCallback(
        (feature) => subscription.hasFeatureAccess?.(feature) || feature === 'bugTracker',
        [subscription]
    );

    const checkFeatureLimit = useCallback(
        (feature, currentUsage) => {
            const limits = subscription.getFeatureLimits?.() || {};
            const limit = limits[feature] || (feature === 'bugTracker' ? -1 : 0);
            return {
                canUse: limit === -1 || currentUsage < limit,
                unlimited: limit === -1,
                limit,
                remaining: Math.max(0, limit - currentUsage),
                usage: currentUsage,
            };
        },
        [subscription]
    );

    const canCreateResource = useCallback(
        (resourceType, currentCount = 0) =>
            subscription.canCreateResource?.(resourceType, currentCount) || resourceType === 'bugs',
        [subscription]
    );

    const getResourceLimit = useCallback(
        (resourceType) => subscription.getResourceLimit?.(resourceType) || (resourceType === 'bugs' ? -1 : 0),
        [subscription]
    );

    const authLoadingOverride = useMemo(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        return NO_AUTH_CHECK_PAGES.includes(pathname) && !token ? false : auth.loading;
    }, [auth.loading, pathname]);

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

    const userCapabilities = useMemo(() => {
        if (!isAuthenticated || !subscription.subscriptionStatus) {
            return {
                canViewSuite: false,
                canEditSuite: false,
                canDeleteSuite: false,
                canInviteTeamMembers: false,
                canManageOrganization: false,
                canViewBugs: false,
                canCreateBugs: false,
                canUpdateBugs: false,
                canDeleteBugs: false,
                canManageBugs: false,
                hasActiveSubscription: false,
                isTrialActive: false,
                trialDaysRemaining: 0,
            };
        }

        const capabilities = subscription.subscriptionStatus.capabilities || {};
        const limits = subscription.getFeatureLimits?.() || {};
        const userRole = auth.getPrimaryUserRole?.(userProfile.userProfile?.organizationId) || userProfile.userProfile?.role || 'member';

        return {
            ...capabilities,
            limits,
            canViewSuite: auth.canViewSuite,
            canEditSuite: auth.canEditSuite,
            canDeleteSuite: auth.canDeleteSuite,
            canInviteTeamMembers: auth.canInviteTeamMembers,
            canManageOrganization: auth.canManageOrganization,
            canViewBugs: true,
            canCreateBugs: true,
            canUpdateBugs: userRole === 'admin' || userRole === 'editor',
            canDeleteBugs: userRole === 'admin',
            canManageBugs: userRole === 'admin',
            hasActiveSubscription: subscription.subscriptionStatus.isValid || false,
            isTrialActive: subscription.subscriptionStatus.isTrial || false,
            trialDaysRemaining: subscription.subscriptionStatus.trialDaysRemaining || 0,
            canCreateResource: subscription.canCreateResource,
            getResourceLimit: subscription.getResourceLimit,
        };
    }, [isAuthenticated, subscription, auth, userProfile.userProfile?.organizationId, userProfile.userProfile?.role]);

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
                role: auth.getPrimaryUserRole?.(profile.organizationId) || profile.role,
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
            },
        };
    }, [isAuthenticated, userProfile.userProfile, auth, subscription.subscriptionStatus, suite.suites?.length, suite.activeSuite]);

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

                // Wait for core data to be ready
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

    const refreshAll = useCallback(async () => {
        const promises = [];
        if (userProfile.refreshProfile) promises.push(userProfile.refreshProfile());
        if (suite.refetchSuites) promises.push(suite.refetchSuites(true));
        if (subscription.updateTrialStatusInDatabase) promises.push(subscription.updateTrialStatusInDatabase());
        await Promise.allSettled(promises);
    }, [userProfile, suite, subscription]);

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
    }, [auth, router, addNotification]);

    const clearError = useCallback(() => setError(null), []);

    const value = useMemo(() => ({
        ...auth,
        user: auth.currentUser,
        isAuthenticated,
        loading: authLoadingOverride,
        userProfile: userProfile.userProfile,
        isLoading: userProfile.isLoading,
        isUpdating: userProfile.isUpdating,
        displayName: auth.displayName,
        email: auth.email,
        accountType: auth.accountType,
        isAdmin: auth.isAdmin,
        currentAccount: userProfile.currentAccount,
        hasAdminPermission: auth.hasPermission?.('manage_organization'),
        isNewUser: userProfile.isNewUser,
        isProfileLoaded: !!userProfile.userProfile,
        fetchUserProfile: userProfile.fetchUserProfile,
        updateProfile: userProfile.updateProfile,
        updateProfileField: userProfile.updateProfileField,
        setupNewUserProfile: userProfile.setupNewUserProfile,
        refreshUserProfile: userProfile.refreshProfile,
        clearProfile: userProfile.clearProfile,
        updateUserProfile: auth.updateUserProfile,
        subscription: subscription.subscriptionStatus,
        subscriptionStatus: subscription.subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits: subscription.getFeatureLimits,
        updateTrialStatusInDatabase: subscription.updateTrialStatusInDatabase,
        canCreateResource,
        getResourceLimit,
        createCheckoutSession: subscription.createCheckoutSession,
        cancelSubscription: subscription.cancelSubscription,
        reactivateSubscription: subscription.reactivateSubscription,
        getBillingHistory: subscription.getBillingHistory,
        updatePaymentMethod: subscription.updatePaymentMethod,
        billingConfig: subscription.billingConfig,
        capabilities: subscription.capabilities,
        suites: suite.suites,
        userTestSuites: suite.userTestSuites,
        activeSuite: suite.activeSuite,
        setActiveSuite: suite.setActiveSuite,
        createTestSuite: suite.createTestSuite,
        refetchSuites: suite.refetchSuites,
        fetchUserSuites: suite.fetchUserSuites,
        getSuiteLimit: suite.getSuiteLimit,
        shouldFetchSuites: suite.shouldFetchSuites,
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
        setSidebarCollapsed,
        navigateToModule,
        updateBreadcrumbs,
        featureFlags,
        appPreferences,
        setAppPreferences,
        refreshAll,
        clearError,
        signOut,
        checkFeatureLimit,
    }), [
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
        appPreferences,
        hasFeatureAccess,
        canCreateResource,
        getResourceLimit,
        refreshAll,
        clearError,
        signOut,
        checkFeatureLimit,
    ]);

    return (
        <AppContext.Provider value={value}>
            <EntityProviderWrapper {...entityProviderProps}>
                {children}
            </EntityProviderWrapper>
        </AppContext.Provider>
    );
};

// Updated AppProvider structure
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

// Hook for accessing entity data through the app context
export const useAppEntityData = () => {
    const context = useApp();
    if (!context) {
        throw new Error('useAppEntityData must be used within an AppProvider');
    }

    // Access entity data from the EntityProvider through useEntityData hook
    const entityContext = useEntityData();

    return {
        testCases: entityContext.testCases,
        bugs: entityContext.bugs,
        recordings: entityContext.recordings,
        relationships: entityContext.relationships,
        createTestCase: entityContext.createTestCase,
        updateTestCase: entityContext.updateTestCase,
        deleteTestCase: entityContext.deleteTestCase,
        createBug: entityContext.createBug,
        updateBug: entityContext.updateBug,
        deleteBug: entityContext.deleteBug,
        linkBugToTestCase: entityContext.linkBugToTestCase,
        unlinkBugFromTestCase: entityContext.unlinkBugFromTestCase,
        refreshAllData: entityContext.refreshAllData,
        isLoading: entityContext.isLoading,
        error: entityContext.error,
        isInitialized: entityContext.isInitialized,
    };
};

export const useAppAuth = () => {
    const { user, signIn, signOut, registerWithEmail, loading, authError } = useApp();
    return { user, signIn, signOut, signUp: registerWithEmail, loading, error: authError };
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
        refetchSuites,
    } = useApp();
    return {
        suites,
        activeSuite,
        setActiveSuite,
        createTestSuite,
        refetchSuites,
    };
};

export const useAppProfile = () => {
    const { userProfile, refreshUserProfile, updateProfile, isLoading } = useApp();
    return {
        userProfile,
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