'use client';
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext';
import { suiteService } from '../services/suiteService'; // Assumed to wrap FirestoreService

const SuiteContext = createContext();

export const useSuite = () => {
    const context = useContext(SuiteContext);
    if (!context) {
        throw new Error('useSuite must be used within a SuiteProvider');
    }
    return context;
};

export const SuiteProvider = ({ children }) => {
    const { user } = useAuth();
    const {
        userProfile,
        isLoading: profileLoading,
        error: profileError,
        isNewUser,
        isProfileLoaded,
    } = useUserProfile();

    const [suites, setSuites] = useState([]);
    const [activeSuite, setActiveSuite] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchingRef = useRef(false);
    const initializedRef = useRef(false);
    const currentUserIdRef = useRef(null);

    const cache = useRef({
        suites: null,
        timestamp: null,
    });

    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.current.timestamp && Date.now() - cache.current.timestamp < CACHE_DURATION;
    }, []);

    const isAuthenticated = useMemo(() => {
        return !!(user && user.uid && user.emailVerified);
    }, [user]);

    const shouldFetchSuites = useMemo(() => {
        if (isRegistering()) {
            console.log('shouldFetchSuites: false - registration in progress');
            return false;
        }
        if (!isAuthenticated) {
            console.log('shouldFetchSuites: false - user not authenticated or email not verified', {
                user: !!user,
                uid: !!user?.uid,
                emailVerified: user?.emailVerified,
            });
            return false;
        }
        if (isNewUser) {
            console.log('shouldFetchSuites: false - new user detected');
            return false;
        }
        if (!isProfileLoaded || profileLoading) {
            console.log('shouldFetchSuites: false - profile not loaded or loading', {
                isProfileLoaded,
                profileLoading,
                hasProfile: !!userProfile,
            });
            return false;
        }
        if (profileError) {
            console.log('shouldFetchSuites: false - profile error:', profileError);
            return false;
        }
        return true;
    }, [isRegistering, isAuthenticated, isNewUser, isProfileLoaded, profileLoading, profileError, user, userProfile]);

    const canCreateSuite = useMemo(() => {
        if (!isAuthenticated || !userProfile || isRegistering()) return false;
        return true; // Async check handled in createTestSuite
    }, [isAuthenticated, userProfile, isRegistering]);

    const getSuiteLimit = useCallback(async () => {
        if (isRegistering()) return 0;
        try {
            const result = await suiteService.canCreateNewSuite(user.uid);
            return result.maxAllowed || 0;
        } catch (error) {
            console.error('Error getting suite limit:', error);
            return 0;
        }
    }, [isRegistering, user?.uid]);

    const fetchUserSuites = useCallback(async (userId = null, forceRefresh = false) => {
        if (isRegistering()) {
            console.log('Skipping suite fetch - registration in progress');
            return [];
        }
        if (!userId || !shouldFetchSuites) {
            console.log('Skipping fetch - missing requirements:', {
                userId: !!userId,
                shouldFetchSuites,
                isRegistering: isRegistering(),
                isAuthenticated,
            });
            return [];
        }
        if (fetchingRef.current && !forceRefresh) {
            console.log('Already fetching, skipping...');
            return cache.current.suites || [];
        }

        try {
            if (!forceRefresh && isCacheValid() && cache.current.suites) {
                console.log('Using cached suites');
                return cache.current.suites;
            }

            fetchingRef.current = true;
            setIsLoading(true);
            setError(null);

            console.log('Fetching suites for userId:', userId);
            const result = await suiteService.getUserSuites(userId);
            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to fetch suites');
            }

            const userSuites = result.data.map(suite => ({
                suite_id: suite.id, // Map FirestoreService id to suite_id
                ...suite,
            }));

            cache.current = {
                suites: userSuites,
                timestamp: Date.now(),
            };

            return userSuites;
        } catch (error) {
            console.error('Error fetching suites:', error);
            const errorMessage = error.code === 'permission-denied'
                ? 'You do not have permission to access test suites.'
                : error.message || 'Failed to fetch test suites.';
            setError(errorMessage);
            return cache.current.suites || [];
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [isRegistering, shouldFetchSuites, isCacheValid, isAuthenticated]);

    const setActiveSuiteWithStorage = useCallback((suite) => {
        if (isRegistering()) {
            console.log('Skipping active suite setting - registration in progress');
            return;
        }
        setActiveSuite(suite);
        if (suite?.suite_id && typeof window !== 'undefined') {
            localStorage.setItem('activeSuiteId', suite.suite_id);
        } else if (typeof window !== 'undefined') {
            localStorage.removeItem('activeSuiteId');
        }
    }, [isRegistering]);

    const refetchSuites = useCallback(async (forceRefresh = true) => {
        if (isRegistering()) {
            console.log('Skipping refetch - registration in progress');
            return;
        }
        if (!shouldFetchSuites) {
            console.log('Cannot refetch - missing requirements:', { shouldFetchSuites, isAuthenticated });
            return;
        }
        try {
            if (forceRefresh) cache.current = { suites: null, timestamp: null };
            const userSuites = await fetchUserSuites(user.uid, forceRefresh);
            setSuites(userSuites);
            if (userSuites.length > 0) {
                const savedSuiteId = localStorage.getItem('activeSuiteId');
                const activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId) || userSuites[0];
                setActiveSuiteWithStorage(activeSuiteItem);
                console.log('Set active suite:', activeSuiteItem?.suite_id);
            } else {
                setActiveSuiteWithStorage(null);
            }
        } catch (error) {
            console.error('Error refetching suites:', error);
            setError(`Failed to fetch test suites: ${error.message}`);
        }
    }, [user?.uid, fetchUserSuites, setActiveSuiteWithStorage, shouldFetchSuites, isAuthenticated, isRegistering]);

    const createTestSuite = useCallback(async (suiteData) => {
        if (isRegistering()) {
            throw new Error('Cannot create test suites during registration');
        }
        if (!isAuthenticated) {
            throw new Error('User not authenticated or email not verified');
        }
        if (!userProfile) {
            throw new Error('User profile not loaded');
        }
        if (!suiteData.name) {
            throw new Error('Suite name is required');
        }

        try {
            const canCreateResult = await suiteService.canCreateNewSuite(user.uid);
            if (!canCreateResult.canCreate) {
                throw new Error(canCreateResult.message || 'Cannot create new suite due to limits');
            }

            const formattedSuiteData = {
                name: suiteData.name,
                description: suiteData.description || '',
                ownerType: suiteData.organizationId ? 'organization' : 'individual',
                ownerId: suiteData.organizationId || user.uid,
                tags: suiteData.tags || [],
                settings: suiteData.settings || {},
                access_control: {
                    ownerType: suiteData.organizationId ? 'organization' : 'individual',
                    ownerId: suiteData.organizationId || user.uid,
                    admins: suiteData.access_control?.admins || [],
                    members: suiteData.access_control?.members || [user.uid],
                    permissions_matrix: suiteData.access_control?.permissions_matrix || {},
                },
            };

            const result = await suiteService.createSuite(formattedSuiteData, user.uid, {
                capabilities: { limits: { testSuites: canCreateResult.maxAllowed } },
            });

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to create suite');
            }

            const newSuite = {
                suite_id: result.docId, // Map FirestoreService docId to suite_id
                ...result.data,
            };

            setSuites(prevSuites => [newSuite, ...prevSuites]);
            setActiveSuiteWithStorage(newSuite);
            cache.current = { suites: null, timestamp: null };

            setTimeout(() => refetchSuites(true), 100);

            console.log('Suite created successfully:', newSuite);
            return newSuite;
        } catch (error) {
            console.error('Error creating test suite:', error);
            const errorMessage = error.code === 'permission-denied'
                ? 'You do not have permission to create a test suite.'
                : error.message || 'Failed to create test suite.';
            throw new Error(errorMessage);
        }
    }, [user, userProfile, refetchSuites, setActiveSuiteWithStorage, isRegistering, isAuthenticated]);

    useEffect(() => {
        const userId = user?.uid;
        if (userId !== currentUserIdRef.current) {
            console.log('User changed, resetting suite context');
            currentUserIdRef.current = userId;
            initializedRef.current = false;
            fetchingRef.current = false;
            cache.current = { suites: null, timestamp: null };
            setSuites([]);
            setActiveSuite(null);
            setError(null);
        }
        if (shouldFetchSuites && !initializedRef.current && !isRegistering()) {
            initializedRef.current = true;
            refetchSuites(false);
        }
    }, [shouldFetchSuites, refetchSuites, isRegistering, user?.uid, isAuthenticated, profileLoading, isNewUser]);

    useEffect(() => {
        return () => {
            suiteService.cleanup(); // Cleanup Firestore subscriptions
        };
    }, []);

    const value = useMemo(() => {
        if (isRegistering()) {
            return {
                suites: [],
                userTestSuites: [],
                activeSuite: null,
                setActiveSuite: () => {},
                isLoading: false,
                loading: false,
                error: null,
                canCreateSuite: false,
                createTestSuite: () => Promise.reject(new Error('Cannot create test suites during registration')),
                refetchSuites: () => Promise.resolve(),
                fetchUserSuites: () => Promise.resolve([]),
                getSuiteLimit: () => 0,
                shouldFetchSuites: false,
                isAuthenticated: false,
            };
        }

        return {
            suites,
            userTestSuites: suites,
            activeSuite,
            setActiveSuite: setActiveSuiteWithStorage,
            isLoading,
            loading: isLoading,
            error,
            canCreateSuite,
            createTestSuite,
            refetchSuites,
            fetchUserSuites,
            getSuiteLimit,
            shouldFetchSuites,
            isAuthenticated,
        };
    }, [
        suites,
        activeSuite,
        setActiveSuiteWithStorage,
        isLoading,
        error,
        canCreateSuite,
        createTestSuite,
        refetchSuites,
        fetchUserSuites,
        getSuiteLimit,
        shouldFetchSuites,
        isAuthenticated,
        isRegistering,
    ]);

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};