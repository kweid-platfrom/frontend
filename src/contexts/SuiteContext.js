'use client'
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext';
import { suiteService } from '../services/suiteService'; // Import suiteService

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
        isProfileLoaded
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
        timestamp: null
    });

    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.current.timestamp && (Date.now() - cache.current.timestamp) < CACHE_DURATION;
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
                emailVerified: user?.emailVerified 
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
                hasProfile: !!userProfile
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

        // Since useMemo can't handle async directly, we'll assume true for initial render
        // and let the component handle async checks
        return true;
    }, [isAuthenticated, userProfile, isRegistering]);

    const getSuiteLimit = useCallback(async () => {
        if (isRegistering()) return 0;
        const result = await suiteService.canCreateNewSuite(user.uid);
        return result.maxAllowed;
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
                isAuthenticated
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
            if (!result.suites) {
                throw new Error('Failed to fetch suites');
            }

            cache.current = {
                suites: result.suites,
                timestamp: Date.now()
            };

            return result.suites;
        } catch (error) {
            console.error('Error fetching suites:', error);
            setError(error.message);
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
            console.log('Cannot refetch - missing requirements:', { 
                shouldFetchSuites,
                isRegistering: isRegistering(),
                isAuthenticated
            });
            return;
        }

        console.log('Refetching suites...');

        if (forceRefresh) {
            cache.current = { suites: null, timestamp: null };
        }

        const userSuites = await fetchUserSuites(user.uid, forceRefresh);
        setSuites(userSuites);

        if (userSuites.length > 0 && typeof window !== 'undefined') {
            const savedSuiteId = localStorage.getItem('activeSuiteId');
            const activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId) || userSuites[0];
            setActiveSuiteWithStorage(activeSuiteItem);
        } else {
            setActiveSuiteWithStorage(null);
        }
    }, [user?.uid, fetchUserSuites, setActiveSuiteWithStorage, shouldFetchSuites, isRegistering, isAuthenticated]);

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

        try {
            const canCreateResult = await suiteService.canCreateNewSuite(user.uid);
            if (!canCreateResult.canCreate) {
                throw new Error(canCreateResult.message);
            }

            const result = await suiteService.createSuite(
                suiteData,
                user.uid,
                { capabilities: { limits: { testSuites: canCreateResult.maxAllowed } } },
                suiteData.organizationId
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            const newSuite = {
                suite_id: result.suiteId,
                ...result.suite,
                accountType: suiteData.organizationId ? 'organization' : 'individual',
                ownerId: suiteData.organizationId || user.uid,
                organizationId: suiteData.organizationId
            };

            setSuites(prevSuites => [newSuite, ...prevSuites]);
            setActiveSuiteWithStorage(newSuite);
            cache.current = { suites: null, timestamp: null };

            setTimeout(() => refetchSuites(true), 100);

            console.log('Suite created successfully:', newSuite);
            return {
                suite_id: result.suiteId,
                ...result.suite
            };
        } catch (error) {
            console.error('Error creating test suite:', error);
            throw error;
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
            console.log('Initializing suites for user:', userId);
            initializedRef.current = true;
            refetchSuites(false);
        } else if (!shouldFetchSuites || isRegistering()) {
            console.log('Clearing suites - conditions not met:', {
                shouldFetchSuites,
                isRegistering: isRegistering(),
                isAuthenticated,
                profileLoading,
                isNewUser
            });
            setSuites([]);
            setActiveSuite(null);
            if (!isRegistering()) {
                setError(null);
            }
        }
    }, [shouldFetchSuites, refetchSuites, isRegistering, user?.uid, isAuthenticated, profileLoading, isNewUser]);

    useEffect(() => {
        return () => {
            // No direct Firestore cleanup needed since suiteService handles it
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
                isAuthenticated: false
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
            isAuthenticated
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
        isRegistering
    ]);

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};