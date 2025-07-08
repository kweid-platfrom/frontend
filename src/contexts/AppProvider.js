/* eslint-disable react-hooks/exhaustive-deps */
// contexts/AppProvider.js - Unified provider for QA Test Management Platform
'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';
import { UserProfileProvider, useUserProfile } from './userProfileContext';
import SubscriptionProvider, { useSubscription } from './subscriptionContext';
import { SuiteProvider, useSuite } from './SuiteContext';

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
            inApp: true
        }
    });

    // Navigation state
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const initialModule = pathname?.split('/')[1] || null;
    const [activeModule, setActiveModule] = useState(() => {
        // Prevent setting dashboard when on root path
        return initialModule && initialModule !== '' ? initialModule : null;
    });

    // Feature flags and capabilities
    const [featureFlags, setFeatureFlags] = useState({
        betaFeatures: false,
        advancedReports: false,
        teamCollaboration: false,
        apiAccess: false,
        automation: false
    });

    // Combined authentication status
    const isAuthenticated = useMemo(() => {
        return auth.user && auth.user.uid && !auth.loading;
    }, [auth.user, auth.loading]);

    // Combined loading state - Only show loading when actually needed
    const isLoading = useMemo(() => {
        // Don't show loading if user is not authenticated
        if (!isAuthenticated) return false;
        
        return userProfile.loading ||
            subscription.isLoading ||
            suite.isLoading ||
            globalLoading;
    }, [isAuthenticated, userProfile.loading, subscription.isLoading, suite.isLoading, globalLoading]);

    // Combined user capabilities
    const userCapabilities = useMemo(() => {
        if (!isAuthenticated || !subscription.subscriptionStatus) return {};

        const capabilities = subscription.subscriptionStatus.capabilities || {};
        const limits = subscription.getFeatureLimits();

        return {
            ...capabilities,
            limits,
            canCreateSuite: suite.canCreateSuite,
            hasActiveSubscription: subscription.subscriptionStatus.isValid,
            isTrialActive: subscription.subscriptionStatus.isTrial,
            trialDaysRemaining: subscription.subscriptionStatus.trialDaysRemaining
        };
    }, [isAuthenticated, subscription.subscriptionStatus, subscription.getFeatureLimits, suite.canCreateSuite]);

    // Account summary
    const accountSummary = useMemo(() => {
        if (!isAuthenticated || !userProfile.profile) return null;

        const profile = userProfile.profile;
        const subs = subscription.subscriptionStatus;

        return {
            user: {
                uid: auth.user.uid,
                email: auth.user.email,
                displayName: auth.user.displayName,
                emailVerified: auth.user.emailVerified,
                photoURL: auth.user.photoURL
            },
            profile: {
                accountType: profile.accountType,
                organizationId: profile.organizationId,
                organizationName: profile.organizationName,
                role: profile.role,
                memberships: profile.account_memberships || []
            },
            subscription: {
                plan: subs?.subscriptionPlan || 'individual_free',
                status: subs?.subscriptionStatus || 'inactive',
                isValid: subs?.isValid || false,
                isTrial: subs?.isTrial || false,
                trialDaysRemaining: subs?.trialDaysRemaining || 0,
                billingCycle: subs?.billingCycle,
                nextBillingDate: subs?.nextBillingDate,
                willCancelAt: subs?.willCancelAt
            },
            suites: {
                total: suite.suites?.length || 0,
                active: suite.activeSuite,
                canCreate: suite.canCreateSuite
            }
        };
    }, [isAuthenticated, userProfile.profile, subscription.subscriptionStatus, suite.suites, suite.activeSuite, suite.canCreateSuite, auth.user]);

    // Notification management
    const addNotification = useCallback((notification) => {
        const id = Date.now().toString();
        const newNotification = {
            id,
            timestamp: new Date(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev]);

        // Auto-remove after 5 seconds for success/info notifications
        if (notification.type === 'success' || notification.type === 'info') {
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const markNotificationAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Navigation helpers
    const navigateToModule = useCallback((module) => {
        setActiveModule(module);

        // Update breadcrumbs based on module
        const moduleMap = {
            dashboard: ['Dashboard'],
            bugs: ['Bug Tracker'],
            testcases: ['Test Cases'],
            recordings: ['Recordings'],
            automation: ['Automation'],
            reports: ['Reports'],
            settings: ['Settings'],
            upgrade: ['Upgrade']
        };

        setBreadcrumbs(moduleMap[module] || [module]);
    }, []);

    const updateBreadcrumbs = useCallback((crumbs) => {
        setBreadcrumbs(crumbs);
    }, []);

    // Feature access helpers
    const hasFeatureAccess = useCallback((feature) => {
        return subscription.hasFeatureAccess(feature);
    }, [subscription.hasFeatureAccess]);

    const checkFeatureLimit = useCallback((feature, currentUsage) => {
        const limits = subscription.getFeatureLimits();
        const limit = limits[feature];

        if (limit === -1) return { canUse: true, unlimited: true };

        return {
            canUse: currentUsage < limit,
            unlimited: false,
            limit,
            remaining: Math.max(0, limit - currentUsage),
            usage: currentUsage
        };
    }, [subscription.getFeatureLimits]);

    // Application initialization - Fixed to handle non-authenticated users
    const initializeApp = useCallback(async () => {
        // Don't initialize if user is not authenticated
        if (!isAuthenticated) {
            setIsInitialized(true); // Set to true so non-authenticated users can use the app
            setGlobalLoading(false);
            return;
        }

        // If already initialized, don't initialize again
        if (isInitialized) {
            return;
        }

        try {
            setGlobalLoading(true);

            // Wait for all contexts to be ready with reasonable timeouts
            await Promise.all([
                // Ensure user profile is loaded
                userProfile.profile ? Promise.resolve() : new Promise((resolve) => {
                    let attempts = 0;
                    const maxAttempts = 30; // 3 seconds
                    const checkProfile = () => {
                        attempts++;
                        if (userProfile.profile || attempts >= maxAttempts) {
                            resolve();
                        } else {
                            setTimeout(checkProfile, 100);
                        }
                    };
                    checkProfile();
                }),

                // Ensure subscription status is loaded
                subscription.subscriptionStatus ? Promise.resolve() : new Promise((resolve) => {
                    let attempts = 0;
                    const maxAttempts = 30; // 3 seconds
                    const checkSubscription = () => {
                        attempts++;
                        if (subscription.subscriptionStatus || attempts >= maxAttempts) {
                            resolve();
                        } else {
                            setTimeout(checkSubscription, 100);
                        }
                    };
                    checkSubscription();
                })
            ]);

            // Update feature flags based on subscription
            if (subscription.subscriptionStatus) {
                setFeatureFlags({
                    betaFeatures: subscription.subscriptionStatus.capabilities?.canUseAPI || false,
                    advancedReports: subscription.subscriptionStatus.capabilities?.canAccessAdvancedReports || false,
                    teamCollaboration: subscription.subscriptionStatus.capabilities?.canInviteTeamMembers || false,
                    apiAccess: subscription.subscriptionStatus.capabilities?.canUseAPI || false,
                    automation: subscription.subscriptionStatus.capabilities?.canUseAutomation || false
                });
            }

            // Load app preferences from localStorage
            try {
                const savedPreferences = localStorage.getItem('appPreferences');
                if (savedPreferences) {
                    setAppPreferences(prev => ({
                        ...prev,
                        ...JSON.parse(savedPreferences)
                    }));
                }
            } catch (error) {
                console.warn('Error loading app preferences:', error);
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
                persistent: true
            });
        } finally {
            setGlobalLoading(false);
        }
    }, [isAuthenticated, userProfile.profile, subscription.subscriptionStatus, addNotification, isInitialized]);

    // Initialize app when authentication state changes
    useEffect(() => {
        // Reset initialization state when authentication changes
        if (!isAuthenticated) {
            setIsInitialized(true); // Allow non-authenticated users to use the app
            setGlobalLoading(false);
            setError(null);
        } else if (isAuthenticated && !isInitialized) {
            initializeApp();
        }
    }, [isAuthenticated, isInitialized, initializeApp]);

    // Save preferences to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('appPreferences', JSON.stringify(appPreferences));
        } catch (error) {
            console.warn('Error saving app preferences:', error);
        }
    }, [appPreferences]);

    // Unified context value
    const value = {
        // Authentication
        ...auth,
        isAuthenticated,

        // User Profile
        userProfile: userProfile.profile,
        ...userProfile,

        // Subscription
        subscription: subscription.subscriptionStatus,
        ...subscription,

        // Test Suites
        ...suite,

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

        // Preferences
        appPreferences,
        setAppPreferences,

        // Utilities
        refreshAll: useCallback(async () => {
            await Promise.all([
                userProfile.refreshUserProfile?.(),
                suite.refetchSuites?.(true),
                subscription.updateTrialStatusInDatabase?.()
            ]);
        }, [userProfile.refreshUserProfile, suite.refetchSuites, subscription.updateTrialStatusInDatabase]),

        // Error handling
        clearError: useCallback(() => setError(null), []),

        // App actions
        signOut: useCallback(async () => {
            try {
                await auth.signOut();
                setNotifications([]);
                setIsInitialized(false);
                setActiveModule(null);
                setBreadcrumbs([]);
                localStorage.removeItem('appPreferences');
            } catch (error) {
                console.error('Error signing out:', error);
                addNotification({
                    type: 'error',
                    title: 'Sign Out Error',
                    message: 'Failed to sign out. Please try again.'
                });
            }
        }, [auth.signOut, addNotification])
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// Main AppProvider component that wraps all providers
export const AppProvider = ({ children }) => {
    return (
        <AuthProvider>
            <UserProfileProvider>
                <SubscriptionProvider>
                    <SuiteProvider>
                        <UnifiedAppProvider>
                            {children}
                        </UnifiedAppProvider>
                    </SuiteProvider>
                </SubscriptionProvider>
            </UserProfileProvider>
        </AuthProvider>
    );
};

// Convenience hooks for specific contexts (backward compatibility)
export const useAppAuth = () => {
    const { user, signIn, signOut, signUp, loading: authLoading, error: authError } = useApp();
    return { user, signIn, signOut, signUp, loading: authLoading, error: authError };
};

export const useAppSubscription = () => {
    const {
        subscription,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription
    } = useApp();
    return {
        subscription,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription
    };
};

export const useAppSuites = () => {
    const {
        suites,
        activeSuite,
        setActiveSuite,
        createTestSuite,
        canCreateSuite,
        refetchSuites
    } = useApp();
    return {
        suites,
        activeSuite,
        setActiveSuite,
        createTestSuite,
        canCreateSuite,
        refetchSuites
    };
};

export const useAppProfile = () => {
    const {
        userProfile,
        profile,
        refreshUserProfile,
        updateProfile,
        loading: profileLoading
    } = useApp();
    return {
        userProfile,
        profile,
        refreshUserProfile,
        updateProfile,
        loading: profileLoading
    };
};

// Navigation hook
export const useAppNavigation = () => {
    const {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
        updateBreadcrumbs
    } = useApp();
    return {
        activeModule,
        breadcrumbs,
        sidebarCollapsed,
        setSidebarCollapsed,
        navigateToModule,
        updateBreadcrumbs
    };
};

// Notifications hook
export const useAppNotifications = () => {
    const {
        notifications,
        addNotification,
        removeNotification,
        markNotificationAsRead,
        clearAllNotifications
    } = useApp();
    return {
        notifications,
        addNotification,
        removeNotification,
        markNotificationAsRead,
        clearAllNotifications
    };
};

// Feature access hook
export const useAppFeatures = () => {
    const {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities
    } = useApp();
    return {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities
    };
};

export default AppProvider;