/* eslint-disable react-hooks/exhaustive-deps */
// contexts/AppProvider.js - Unified provider for QA Test Management Platform
'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

    // Track initialization state with refs to prevent unnecessary re-renders
    const initializationRef = useRef({
        isInitialized: false,
        isInitializing: false,
        lastAuthState: null,
        initializationPromise: null
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
            inApp: true
        }
    });

    // Navigation state
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const initialModule = pathname?.split('/')[1] || null;
    const [activeModule, setActiveModule] = useState(() => {
        return initialModule && initialModule !== '' ? initialModule : null;
    });

    // Feature flags - Use ref to prevent unnecessary re-renders
    const [featureFlags, setFeatureFlags] = useState({
        betaFeatures: false,
        advancedReports: false,
        teamCollaboration: false,
        apiAccess: false,
        automation: false
    });

    // Stable authentication status - Only update when truly changed
    const isAuthenticated = useMemo(() => {
        const currentAuth = auth.user && auth.user.uid && !auth.loading;
        
        // Only update if state actually changed
        if (initializationRef.current.lastAuthState !== currentAuth) {
            initializationRef.current.lastAuthState = currentAuth;
        }
        
        return currentAuth;
    }, [auth.user?.uid, auth.loading]);

    // Optimized loading state - More granular control
    const isLoading = useMemo(() => {
        // Never show loading for non-authenticated users
        if (!isAuthenticated) return false;
        
        // Don't show loading if we're already initialized
        if (initializationRef.current.isInitialized) return false;
        
        // Show loading only when actually initializing or when contexts are truly loading
        return initializationRef.current.isInitializing || 
               userProfile.isLoading || 
               subscription.isLoading || 
               suite.isLoading || 
               globalLoading;
    }, [
        isAuthenticated, 
        userProfile.isLoading, 
        subscription.isLoading, 
        suite.isLoading, 
        globalLoading,
        isInitialized
    ]);

    // Memoized user capabilities with dependency tracking
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
            trialDaysRemaining: subscription.subscriptionStatus.trialDaysRemaining,
            canCreateResource: subscription.canCreateResource,
            getResourceLimit: subscription.getResourceLimit
        };
    }, [
        isAuthenticated, 
        subscription.subscriptionStatus?.isValid,
        subscription.subscriptionStatus?.isTrial,
        subscription.subscriptionStatus?.trialDaysRemaining,
        subscription.subscriptionStatus?.capabilities,
        suite.canCreateSuite
    ]);

    // Optimized account summary with shallow comparison
    const accountSummary = useMemo(() => {
        if (!isAuthenticated || !userProfile.userProfile) return null;

        const profile = userProfile.userProfile;
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
                willCancelAt: subs?.willCancelAt,
                isExpired: subs?.isExpired || false,
                showTrialBanner: subs?.showTrialBanner || false,
                showUpgradePrompt: subs?.showUpgradePrompt || true
            },
            suites: {
                total: suite.suites?.length || 0,
                active: suite.activeSuite,
                canCreate: suite.canCreateSuite
            }
        };
    }, [
        isAuthenticated,
        auth.user?.uid,
        auth.user?.email,
        auth.user?.displayName,
        auth.user?.emailVerified,
        auth.user?.photoURL,
        userProfile.userProfile?.accountType,
        userProfile.userProfile?.organizationId,
        userProfile.userProfile?.organizationName,
        userProfile.userProfile?.role,
        subscription.subscriptionStatus?.subscriptionPlan,
        subscription.subscriptionStatus?.subscriptionStatus,
        subscription.subscriptionStatus?.isValid,
        subscription.subscriptionStatus?.isTrial,
        subscription.subscriptionStatus?.trialDaysRemaining,
        suite.suites?.length,
        suite.activeSuite,
        suite.canCreateSuite
    ]);

    // Optimized notification management
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

    // Navigation helpers - Stable references
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
            upgrade: ['Upgrade']
        };

        setBreadcrumbs(moduleMap[module] || [module]);
    }, []);

    const updateBreadcrumbs = useCallback((crumbs) => {
        setBreadcrumbs(crumbs);
    }, []);

    // Stable feature access helpers
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

    const canCreateResource = useCallback((resourceType, currentCount = 0) => {
        return subscription.canCreateResource(resourceType, currentCount);
    }, [subscription.canCreateResource]);

    const getResourceLimit = useCallback((resourceType) => {
        return subscription.getResourceLimit(resourceType);
    }, [subscription.getResourceLimit]);

    // Improved initialization with proper state management
    const initializeApp = useCallback(async () => {
        // Prevent concurrent initialization
        if (initializationRef.current.isInitializing) {
            return initializationRef.current.initializationPromise;
        }

        // Don't initialize if user is not authenticated
        if (!isAuthenticated) {
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            return;
        }

        // If already initialized for this auth state, don't reinitialize
        if (initializationRef.current.isInitialized) {
            return;
        }

        initializationRef.current.isInitializing = true;
        
        const initPromise = (async () => {
            try {
                setGlobalLoading(true);

                // Create timeout promises for each context
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

                // Wait for contexts to be ready with proper timeouts
                await Promise.allSettled([
                    createTimeoutPromise(() => userProfile.userProfile),
                    createTimeoutPromise(() => subscription.subscriptionStatus)
                ]);

                // Update feature flags only if subscription data is available
                if (subscription.subscriptionStatus?.capabilities) {
                    const capabilities = subscription.subscriptionStatus.capabilities;
                    setFeatureFlags(prev => {
                        const newFlags = {
                            betaFeatures: capabilities.canUseAPI || false,
                            advancedReports: capabilities.canExportReports || false,
                            teamCollaboration: capabilities.canInviteTeamMembers || false,
                            apiAccess: capabilities.canUseAPI || false,
                            automation: capabilities.canCreateAutomatedTests || false
                        };
                        
                        // Only update if flags actually changed
                        if (JSON.stringify(prev) !== JSON.stringify(newFlags)) {
                            return newFlags;
                        }
                        return prev;
                    });
                }

                // Load preferences only once
                if (!localStorage.getItem('appPreferencesLoaded')) {
                    try {
                        const savedPreferences = localStorage.getItem('appPreferences');
                        if (savedPreferences) {
                            const parsed = JSON.parse(savedPreferences);
                            setAppPreferences(prev => ({
                                ...prev,
                                ...parsed
                            }));
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
                    persistent: true
                });
            } finally {
                setGlobalLoading(false);
                initializationRef.current.isInitializing = false;
                initializationRef.current.initializationPromise = null;
            }
        })();

        initializationRef.current.initializationPromise = initPromise;
        return initPromise;
    }, [isAuthenticated, userProfile.userProfile, subscription.subscriptionStatus?.capabilities, addNotification]);

    // Optimized initialization effect
    useEffect(() => {
        if (!isAuthenticated) {
            // Reset for non-authenticated users
            initializationRef.current.isInitialized = true;
            setIsInitialized(true);
            setGlobalLoading(false);
            setError(null);
            return;
        }

        // Only initialize if not already initialized and user is authenticated
        if (isAuthenticated && !initializationRef.current.isInitialized && !initializationRef.current.isInitializing) {
            initializeApp();
        }
    }, [isAuthenticated, initializeApp]);

    // Debounced preferences save
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem('appPreferences', JSON.stringify(appPreferences));
            } catch (error) {
                console.warn('Error saving app preferences:', error);
            }
        }, 500); // Debounce by 500ms

        return () => clearTimeout(timeoutId);
    }, [appPreferences]);

    // Optimized refresh function
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
    }, [userProfile.refreshProfile, suite.refetchSuites, subscription.updateTrialStatusInDatabase]);

    // Optimized sign out
    const signOut = useCallback(async () => {
        try {
            await auth.signOut();
            
            // Reset all state
            setNotifications([]);
            setIsInitialized(false);
            setActiveModule(null);
            setBreadcrumbs([]);
            initializationRef.current.isInitialized = false;
            initializationRef.current.isInitializing = false;
            initializationRef.current.initializationPromise = null;
            
            // Clear preferences
            localStorage.removeItem('appPreferences');
            localStorage.removeItem('appPreferencesLoaded');
        } catch (error) {
            console.error('Error signing out:', error);
            addNotification({
                type: 'error',
                title: 'Sign Out Error',
                message: 'Failed to sign out. Please try again.'
            });
        }
    }, [auth.signOut, addNotification]);

    // Clear error callback
    const clearError = useCallback(() => setError(null), []);

    // Memoized context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        // Authentication
        ...auth,
        isAuthenticated,

        // User Profile
        profile: userProfile.userProfile,
        userProfile: userProfile.userProfile,
        isLoading: userProfile.isLoading,
        isUpdating: userProfile.isUpdating,
        displayName: userProfile.displayName,
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
        refreshUserProfile: userProfile.refreshProfile,
        clearProfile: userProfile.clearProfile,
        updateUserProfile: userProfile.updateProfile,

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
        canCreateSuite: suite.canCreateSuite,
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
        signOut
    }), [
        auth,
        isAuthenticated,
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
        signOut
    ]);

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
        canCreateResource,
        getResourceLimit,
        createCheckoutSession,
        cancelSubscription,
        reactivateSubscription,
        getBillingHistory,
        updatePaymentMethod,
        billingConfig,
        capabilities
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
        capabilities
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
        isLoading: profileLoading
    } = useApp();
    return {
        userProfile,
        profile,
        refreshUserProfile,
        updateProfile,
        loading: profileLoading
    };
};

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

export const useAppFeatures = () => {
    const {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities,
        canCreateResource,
        getResourceLimit
    } = useApp();
    return {
        featureFlags,
        hasFeatureAccess,
        checkFeatureLimit,
        userCapabilities,
        canCreateResource,
        getResourceLimit
    };
};

export default AppProvider;