/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';
import { UserProfileProvider, useUserProfile } from './userProfileContext';
import { SubscriptionProvider, useSubscription } from './subscriptionContext';
import { SuiteProvider, useSuite } from './SuiteContext';
import { EntityProvider, useEntityContext } from './EntityProvider';
import useAppInitialization from '../hooks/useAppInitialization';

const NO_AUTH_CHECK_PAGES = ['/login', '/register', '/verify-email'];

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};

const EntityProviderWrapper = ({ children }) => {
    return <EntityProvider>{children}</EntityProvider>;
};

const UnifiedAppProvider = ({ children }) => {
    const auth = useAuth();
    const userProfile = useUserProfile();
    const subscription = useSubscription();
    const suite = useSuite();
    const pathname = usePathname();
    const router = useRouter();

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

    const featureFlags = useMemo(() => ({
        betaFeatures: subscription.hasFeatureAccess?.('beta_features') || false,
        advancedReports: subscription.hasFeatureAccess?.('reports') || false,
        teamCollaboration: subscription.hasFeatureAccess?.('team_management') || false,
        apiAccess: subscription.hasFeatureAccess?.('api_access') || false,
        automation: subscription.hasFeatureAccess?.('automation') || false,
        bugTracker: true,
        organizationSuites: subscription.hasFeatureAccess?.('organization_suites') || false,
    }), [subscription]);

    const isAuthenticated = useMemo(() => auth.currentUser && auth.currentUser.uid && auth.currentUser.emailVerified, [auth.currentUser]);

    const shouldInitialize = useMemo(() => {
        if (NO_AUTH_CHECK_PAGES.includes(pathname)) return false;
        if (!isAuthenticated) return false;
        if (!userProfile.isProfileLoaded || userProfile.isLoading || userProfile.error) return false;
        return true;
    }, [pathname, isAuthenticated, userProfile.isProfileLoaded, userProfile.isLoading, userProfile.error]);

    const addNotification = useCallback((notification) => {
        const id = Date.now().toString();
        const newNotification = { id, timestamp: new Date(), read: false, ...notification };
        setNotifications((prev) => [newNotification, ...prev.slice(0, 49)]); // Limit to 50 notifications
        if (notification.type === 'success' || notification.type === 'info') {
            setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
        }
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const markNotificationAsRead = useCallback((id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
            const limit = subscription.getResourceLimit?.(feature) || (feature === 'bugTracker' ? -1 : 0);
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
            subscription.canCreateResource?.(resourceType) || resourceType === 'bugs',
        [subscription]
    );

    const getResourceLimit = useCallback(
        (resourceType) => subscription.getResourceLimit?.(resourceType) || (resourceType === 'bugs' ? -1 : 0),
        [subscription]
    );

    const isLoading = useMemo(() => {
        return userProfile.isLoading || subscription.isLoading || suite.isLoading || globalLoading;
    }, [userProfile.isLoading, subscription.isLoading, suite.isLoading, globalLoading]);

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
                canCreateSuite: false,
                canCreateIndividualSuite: false,
                canCreateOrganizationSuite: false,
                limits: {},
            };
        }

        const userRole = userProfile.userProfile?.role || auth.getPrimaryUserRole?.(userProfile.userProfile?.organizationId) || 'member';
        const accountType = userProfile.accountType || 'individual';
        const suiteLimit = suite.getSuiteLimit(accountType === 'organization' ? userProfile.userProfile?.organizationId : auth.currentUser?.uid);

        return {
            canViewSuite: suite.shouldFetchSuites,
            canEditSuite: userRole === 'Editor' || userRole === 'Admin',
            canDeleteSuite: userRole === 'Admin',
            canInviteTeamMembers: auth.canInviteTeamMembers && hasFeatureAccess('invite_team_members'),
            canManageOrganization: auth.canManageOrganization && hasFeatureAccess('team_management'),
            canViewBugs: true,
            canCreateBugs: true,
            canUpdateBugs: userRole === 'Editor' || userRole === 'Admin',
            canDeleteBugs: userRole === 'Admin',
            canManageBugs: userRole === 'Admin',
            hasActiveSubscription: subscription.subscriptionStatus?.isValid || false,
            isTrialActive: subscription.subscriptionStatus?.isTrial || false,
            trialDaysRemaining: subscription.subscriptionStatus?.trialDaysRemaining || 0,
            canCreateSuite: suite.canCreateSuite,
            canCreateIndividualSuite: suite.canCreateSuite && (accountType === 'individual' || suite.availableOrganizations.length === 0),
            canCreateOrganizationSuite: suite.canCreateSuite && hasFeatureAccess('organization_suites') && suite.availableOrganizations.length > 0,
            limits: {
                individualSuites: suiteLimit.then(res => res.maxAllowed).catch(() => 0),
                organizationSuites: suiteLimit.then(res => res.maxAllowed).catch(() => 0),
                currentIndividualSuites: suite.individualSuites?.length || 0,
                currentOrganizationSuites: suite.organizationSuites?.reduce((total, org) => total + org.suites.length, 0) || 0,
            },
        };
    }, [isAuthenticated, subscription.subscriptionStatus, userProfile.userProfile?.role, userProfile.userProfile?.organizationId, userProfile.accountType, auth, suite, hasFeatureAccess]);

    const accountSummary = useMemo(() => {
        if (!isAuthenticated || !userProfile.userProfile || !auth.currentUser) return null;

        return {
            user: {
                uid: auth.currentUser.uid,
                email: userProfile.email || auth.currentUser.email,
                displayName: userProfile.displayName || auth.currentUser.displayName,
                emailVerified: auth.currentUser.emailVerified,
                photoURL: auth.currentUser.photoURL,
                avatarInitials: userProfile.avatarInitials,
            },
            profile: {
                accountType: userProfile.accountType,
                organizationId: userProfile.userProfile.organizationId,
                organizationName: userProfile.userProfile.organizationName,
                role: auth.getPrimaryUserRole?.(userProfile.userProfile.organizationId) || 'member',
                memberships: userProfile.userProfile.account_memberships || [],
            },
            subscription: {
                plan: subscription.subscriptionStatus?.subscriptionPlan || 'individual_free',
                status: subscription.subscriptionStatus?.subscriptionStatus || 'inactive',
                isValid: subscription.subscriptionStatus?.isValid || false,
                isTrial: subscription.subscriptionStatus?.isTrial || false,
                trialDaysRemaining: subscription.subscriptionStatus?.trialDaysRemaining || 0,
                billingCycle: subscription.subscriptionStatus?.billingCycle || 'monthly',
                nextBillingDate: subscription.subscriptionStatus?.nextBillingDate,
                willCancelAt: subscription.subscriptionStatus?.willCancelAt,
                isExpired: subscription.subscriptionStatus?.isExpired || false,
                showTrialBanner: subscription.subscriptionStatus?.showTrialBanner || false,
                showUpgradePrompt: subscription.subscriptionStatus?.showUpgradePrompt || false,
            },
            suites: {
                total: suite.suites?.length || 0,
                individual: suite.individualSuites?.length || 0,
                organization: suite.organizationSuites?.reduce((total, org) => total + org.suites.length, 0) || 0,
                active: suite.activeSuite,
                availableOrganizations: suite.availableOrganizations || [],
                organizationGroups: suite.organizationSuites || [],
                limits: {
                    individual: userCapabilities.limits.individualSuites,
                    organization: userCapabilities.limits.organizationSuites,
                },
            },
        };
    }, [
        isAuthenticated,
        userProfile.userProfile,
        userProfile.email,
        userProfile.displayName,
        userProfile.avatarInitials,
        userProfile.accountType,
        auth,
        subscription.subscriptionStatus,
        suite.suites,
        suite.individualSuites,
        suite.organizationSuites,
        suite.activeSuite,
        suite.availableOrganizations,
        userCapabilities,
    ]);

    const { initializeApp } = useAppInitialization(
        isAuthenticated,
        pathname,
        userProfile,
        subscription,
        suite,
        setIsInitialized,
        setGlobalLoading,
        setError,
        setAppPreferences,
        addNotification
    );

    useEffect(() => {
        if (shouldInitialize) initializeApp();
    }, [shouldInitialize, initializeApp]);

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
        setGlobalLoading(true);
        try {
            await Promise.allSettled([
                auth.refreshUserData?.(),
                userProfile.refreshProfile?.(),
                suite.refetchSuites?.({ forceRefresh: true }),
                subscription.updateSubscriptionStatus?.(auth.currentUser?.uid),
            ]);
        } catch (error) {
            setError(error.message || 'Failed to refresh data');
        } finally {
            setGlobalLoading(false);
        }
    }, [auth, userProfile, suite, subscription]);

    const signOut = useCallback(async () => {
        try {
            setNotifications([]);
            setActiveModule(null);
            setBreadcrumbs([]);
            setError(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('appPreferences');
                localStorage.removeItem('appPreferencesLoaded');
                localStorage.removeItem('activeSuiteId');
                localStorage.removeItem('activeSuiteTimestamp');
            }
            await auth.signOut();
            router.push('/login');
        } catch (error) {
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
        loading: auth.loading,
        userProfile: userProfile.userProfile,
        isLoading,
        isUpdating: userProfile.isUpdating,
        displayName: userProfile.displayName,
        avatarInitials: userProfile.avatarInitials,
        email: userProfile.email,
        accountType: userProfile.accountType,
        isAdmin: userProfile.isAdmin,
        currentAccount: userProfile.currentAccount,
        hasAdminPermission: userProfile.hasAdminPermission,
        isNewUser: userProfile.isNewUser,
        isProfileLoaded: userProfile.isProfileLoaded,
        fetchUserProfile: userProfile.fetchUserProfile,
        updateProfile: userProfile.updateProfile,
        updateProfileField: userProfile.updateProfileField,
        setupNewUserProfile: userProfile.setupNewUserProfile,
        refreshProfile: userProfile.refreshProfile,
        clearProfile: userProfile.clearProfile,
        subscription: subscription.subscriptionStatus,
        subscriptionStatus: subscription.subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits: subscription.getFeatureLimits,
        updateSubscriptionStatus: subscription.updateSubscriptionStatus,
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
        individualSuites: suite.individualSuites,
        organizationSuites: suite.organizationSuites,
        availableOrganizations: suite.availableOrganizations,
        activeSuite: suite.activeSuite,
        setActiveSuite: suite.setActiveSuite,
        switchSuite: suite.switchSuite,
        createTestSuite: suite.createTestSuite,
        checkSuiteNameExists: suite.checkSuiteNameExists,
        refetchSuites: suite.refetchSuites,
        fetchUserSuites: suite.fetchUserSuites,
        getSuiteLimit: suite.getSuiteLimit,
        shouldFetchSuites: suite.shouldFetchSuites,
        canCreateSuite: suite.canCreateSuite,
        isInitialized,
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
        appPreferences,
        auth,
        isAuthenticated,
        userProfile,
        subscription,
        suite,
        isLoading,
        hasFeatureAccess,
        canCreateResource,
        getResourceLimit,
        isInitialized,
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
        refreshAll,
        clearError,
        signOut,
        checkFeatureLimit,
    ]);

    return (
        <AppContext.Provider value={value}>
            <EntityProviderWrapper>
                {children}
            </EntityProviderWrapper>
        </AppContext.Provider>
    );
};

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

export const useAppEntityData = () => {
    const entityContext = useEntityContext();
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
        createRecording: entityContext.createRecording,
        updateRecording: entityContext.updateRecording,
        deleteRecording: entityContext.deleteRecording,
        createRelationship: entityContext.createRelationship,
        getTestCaseById: entityContext.getTestCaseById,
        getBugById: entityContext.getBugById,
        getRecordingById: entityContext.getRecordingById,
        getBugsForTestCase: entityContext.getBugsForTestCase,
        getRecordingsForBug: entityContext.getRecordingsForBug,
        getTestCasesForRequirement: entityContext.getTestCasesForRequirement,
        isLoading: entityContext.isLoading,
        isInitialized: entityContext.isInitialized,
        errors: entityContext.errors,
        clearError: entityContext.clearError,
        clearAllErrors: entityContext.clearAllErrors,
        refreshData: entityContext.refreshData,
        accountType: entityContext.accountType,
        orgId: entityContext.orgId,
        activeSuiteId: entityContext.activeSuiteId,
    };
};

export const useAppAuth = () => {
    const {
        currentUser,
        signIn,
        signInWithGoogle,
        registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        resetPassword,
        confirmPasswordReset,
        resendVerificationEmail,
        deleteAccount,
        linkProvider,
        unlinkProvider,
        refreshSession,
        signOut,
        loading,
        authError,
        isProviderLinked,
    } = useApp();
    return {
        user: currentUser,
        signIn,
        signInWithGoogle,
        signUp: registerWithEmail,
        registerWithEmailLink,
        completeEmailLinkSignIn,
        setUserPassword,
        resetPassword,
        confirmPasswordReset,
        resendVerificationEmail,
        deleteAccount,
        linkProvider,
        unlinkProvider,
        refreshSession,
        signOut,
        loading,
        error: authError,
        isProviderLinked,
    };
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
        individualSuites,
        organizationSuites,
        availableOrganizations,
        activeSuite,
        setActiveSuite,
        switchSuite,
        createTestSuite,
        checkSuiteNameExists,
        refetchSuites,
        fetchUserSuites,
        canCreateSuite,
        getSuiteLimit,
    } = useApp();
    return {
        suites,
        userTestSuites: suites,
        individualSuites,
        organizationSuites,
        availableOrganizations,
        activeSuite,
        setActiveSuite,
        switchSuite,
        createTestSuite,
        checkSuiteNameExists,
        refetchSuites,
        fetchUserSuites,
        canCreateSuite,
        getSuiteLimit,
    };
};

export const useAppProfile = () => {
    const { userProfile, refreshProfile, updateProfile, updateProfileField, isLoading, avatarInitials } = useApp();
    return {
        userProfile,
        refreshProfile,
        updateProfile,
        updateProfileField,
        loading: isLoading,
        avatarInitials,
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