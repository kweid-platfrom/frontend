/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext';
import { suiteService } from '../../services/suiteService';

const SuiteContext = createContext();

export const useSuite = () => {
    const context = useContext(SuiteContext);
    if (!context) throw new Error('useSuite must be used within a SuiteProvider');
    return context;
};

export const SuiteProvider = ({ children }) => {
    const { user } = useAuth();
    const { userProfile, isLoading: profileLoading, error: profileError, isProfileLoaded } = useUserProfile();

    const [suites, setSuites] = useState([]);
    const [activeSuite, setActiveSuite] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    const subscriptionRef = useRef(null);
    const fetchAbortController = useRef(null);
    const cache = useRef({ suites: null, timestamp: null, version: 0 });
    const CACHE_DURATION = 5 * 60 * 1000;

    const isCacheValid = useCallback(() => {
        return cache.current.timestamp && Date.now() - cache.current.timestamp < CACHE_DURATION && cache.current.suites !== null;
    }, [CACHE_DURATION]);

    const clearCache = useCallback(() => {
        cache.current = { suites: null, timestamp: null, version: cache.current.version + 1 };
    }, []);

    const isAuthenticated = useMemo(() => user && user.uid, [user]);
    const shouldFetchSuites = useMemo(() => isAuthenticated && isProfileLoaded && !profileLoading && !profileError, [isAuthenticated, isProfileLoaded, profileLoading, profileError]);

    const availableOrganizations = useMemo(() => {
        return userProfile?.account_memberships
            ?.filter(m => m.status === 'active' && m.role === 'Admin')
            .map(m => ({ id: m.org_id, name: m.org_name || m.org_id, role: m.role })) || [];
    }, [userProfile?.account_memberships]);

    const { individualSuites, organizationSuites, totalSuites } = useMemo(() => {
        const individual = suites.filter(s => s.ownerType === 'individual');
        const organization = suites.filter(s => s.ownerType === 'organization');
        const organizationGroups = organization.reduce((groups, suite) => {
            const orgId = suite.ownerId;
            if (!groups[orgId]) {
                const orgInfo = availableOrganizations.find(org => org.id === orgId);
                groups[orgId] = {
                    organizationId: orgId,
                    organizationName: orgInfo?.name || orgId,
                    role: orgInfo?.role || 'Member',
                    suites: [],
                    suiteCount: 0
                };
            }
            groups[orgId].suites.push(suite);
            groups[orgId].suiteCount++;
            return groups;
        }, {});
        return {
            individualSuites: individual,
            organizationSuites: Object.values(organizationGroups),
            totalSuites: suites.length
        };
    }, [suites, availableOrganizations]);

    const getSuiteLimit = useCallback(async (organizationId = null) => {
        if (!user?.uid) return { canCreate: false, maxAllowed: 0, remaining: 0 };
        try {
            const result = await suiteService.canCreateNewSuite(user.uid, organizationId);
            return result;
        } catch (error) {
            console.error('Error getting suite limit:', error);
            return { canCreate: false, maxAllowed: 0, remaining: 0, message: 'Error checking limits' };
        }
    }, [user?.uid]);

    const fetchUserSuites = useCallback(async (userId, options = {}) => {
        const { forceRefresh = false, silent = false } = options;
        if (!userId || !shouldFetchSuites) return { suites: cache.current.suites || [], fromCache: true };

        if (!forceRefresh && isCacheValid() && cache.current.suites) return { suites: cache.current.suites, fromCache: true };
        if (isFetching && !forceRefresh) return { suites: cache.current.suites || [], fromCache: true };

        if (fetchAbortController.current) fetchAbortController.current.abort();
        fetchAbortController.current = new AbortController();

        try {
            if (!silent) {
                setIsFetching(true);
                setIsLoading(true);
                setError(null);
            }

            const result = await suiteService.getUserSuites(userId);
            if (!result.success) throw new Error(result.error || 'Failed to fetch suites');

            cache.current = { suites: result.suites, timestamp: Date.now(), version: cache.current.version + 1 };
            setLastFetchTime(new Date());
            return { suites: result.suites, fromCache: false };
        } catch (error) {
            if (error.name === 'AbortError') return { suites: cache.current.suites || [], fromCache: true };
            const errorMessage = error.code === 'permission-denied' ? 'No permission to access suites' : error.message || 'Failed to fetch suites';
            if (!silent) setError(errorMessage);
            return { suites: cache.current.suites || [], fromCache: true, error: errorMessage };
        } finally {
            fetchAbortController.current = null;
            if (!silent) {
                setIsFetching(false);
                setIsLoading(false);
            }
        }
    }, [shouldFetchSuites, isCacheValid, isFetching]);

    const setActiveSuiteWithStorage = useCallback((suite) => {
        if (suite && !suites.find(s => s.suite_id === suite.suite_id)) {
            console.warn('Attempting to set active suite not in list');
            return;
        }
        setActiveSuite(suite);
        if (typeof window !== 'undefined') {
            try {
                if (suite?.suite_id) {
                    localStorage.setItem('activeSuiteId', suite.suite_id);
                    localStorage.setItem('activeSuiteTimestamp', Date.now().toString());
                } else {
                    localStorage.removeItem('activeSuiteId');
                    localStorage.removeItem('activeSuiteTimestamp');
                }
            } catch (storageError) {
                console.warn('Failed to update localStorage:', storageError);
            }
        }
    }, [suites]);

    const refetchSuites = useCallback(async (options = {}) => {
        const { forceRefresh = true, silent = false, updateActiveSuite = true } = options;
        if (!shouldFetchSuites || !user?.uid) return { success: false, error: 'Cannot fetch suites' };

        try {
            if (forceRefresh) clearCache();
            const fetchResult = await fetchUserSuites(user.uid, { forceRefresh, silent });
            setSuites(fetchResult.suites);

            if (updateActiveSuite && fetchResult.suites.length > 0) {
                let activeSuiteToSet = null;
                if (typeof window !== 'undefined') {
                    const savedSuiteId = localStorage.getItem('activeSuiteId');
                    const savedTimestamp = localStorage.getItem('activeSuiteTimestamp');
                    const isRecentlySaved = savedTimestamp && Date.now() - parseInt(savedTimestamp) < 24 * 60 * 60 * 1000;
                    if (savedSuiteId && isRecentlySaved) {
                        activeSuiteToSet = fetchResult.suites.find(s => s.suite_id === savedSuiteId);
                    }
                }
                setActiveSuiteWithStorage(activeSuiteToSet || fetchResult.suites[0]);
            } else if (updateActiveSuite) {
                setActiveSuiteWithStorage(null);
            }

            return { success: true, suites: fetchResult.suites, fromCache: fetchResult.fromCache, count: fetchResult.suites.length };
        } catch (error) {
            if (!silent) setError(error.message || 'Failed to fetch suites');
            return { success: false, error: error.message || 'Failed to fetch suites' };
        }
    }, [user?.uid, fetchUserSuites, setActiveSuiteWithStorage, shouldFetchSuites, clearCache]);

    const checkSuiteNameExists = useCallback(async (name, organizationId = null) => {
        if (!name || typeof name !== 'string') return { exists: false, error: 'Invalid suite name' };
        const trimmedName = name.trim();
        if (trimmedName.length < 3 || trimmedName.length > 100) {
            return { exists: false, error: 'Suite name must be 3-100 characters' };
        }

        try {
            const result = await suiteService.checkSuiteNameExists(trimmedName, user.uid, organizationId);
            return {
                exists: result.exists,
                error: result.exists ? `Suite "${trimmedName}" already exists` : result.error
            };
        } catch (error) {
            return { exists: false, error: 'Unable to verify suite name' };
        }
    }, [user?.uid]);

    const createTestSuite = useCallback(async (suiteData, organizationId = null) => {
        if (!isAuthenticated || !userProfile || !suiteData.name) {
            throw new Error('Missing required data');
        }

        try {
            const trimmedName = suiteData.name.trim();
            if (trimmedName.length < 3 || trimmedName.length > 100) {
                throw new Error('Suite name must be 3-100 characters');
            }

            const nameCheck = await checkSuiteNameExists(trimmedName, organizationId);
            if (nameCheck.exists) throw new Error(nameCheck.error);

            const canCreateResult = await getSuiteLimit(organizationId);
            if (!canCreateResult.canCreate) throw new Error(canCreateResult.message);

            if (organizationId && !availableOrganizations.some(org => org.id === organizationId)) {
                throw new Error('No admin access to specified organization');
            }

            const formattedSuiteData = {
                name: trimmedName,
                description: suiteData.description?.trim() || '',
                tags: Array.isArray(suiteData.tags) ? suiteData.tags : [],
                settings: suiteData.settings || {},
                access_control: {
                    ownerType: organizationId ? 'organization' : 'individual',
                    ownerId: organizationId || user.uid,
                    admins: [user.uid],
                    members: [user.uid],
                    permissions_matrix: suiteData.access_control?.permissions_matrix || {}
                }
            };

            const result = await suiteService.createSuite(formattedSuiteData, user.uid, organizationId);
            if (!result.success) throw new Error(result.error);

            setSuites(prev => [result.suite, ...prev]);
            setActiveSuiteWithStorage(result.suite);
            clearCache();
            setTimeout(() => refetchSuites({ silent: true, updateActiveSuite: false }), 1000);

            return result.suite;
        } catch (error) {
            throw new Error(error.message || 'Failed to create suite');
        }
    }, [user, userProfile, isAuthenticated, availableOrganizations, getSuiteLimit, setActiveSuiteWithStorage, refetchSuites, checkSuiteNameExists, clearCache]);

    const switchSuite = useCallback(async (suiteId) => {
        if (!suiteId || !user?.uid) return { success: false, error: 'Missing required parameters' };
        try {
            const result = await suiteService.switchSuite(user.uid, suiteId);
            if (!result.success) throw new Error(result.error);
            setActiveSuiteWithStorage(suites.find(s => s.suite_id === suiteId));
            return { success: true, suite: result.suite };
        } catch (error) {
            setError(error.message || 'Failed to switch suite');
            return { success: false, error: error.message || 'Failed to switch suite' };
        }
    }, [user?.uid, suites, setActiveSuiteWithStorage]);

    useEffect(() => {
        if (!shouldFetchSuites || !user?.uid) return;

        const unsubscribe = suiteService.subscribeToSuites(
            updatedSuites => {
                setSuites(updatedSuites);
                cache.current = { suites: updatedSuites, timestamp: Date.now(), version: cache.current.version + 1 };

                if (typeof window !== 'undefined') {
                    const savedSuiteId = localStorage.getItem('activeSuiteId');
                    const savedTimestamp = localStorage.getItem('activeSuiteTimestamp');
                    const isRecentlySaved = savedTimestamp && Date.now() - parseInt(savedTimestamp) < 24 * 60 * 60 * 1000;
                    const activeSuiteItem = savedSuiteId && isRecentlySaved ? updatedSuites.find(s => s.suite_id === savedSuiteId) : null;
                    setActiveSuiteWithStorage(activeSuiteItem || (updatedSuites.length > 0 ? updatedSuites[0] : null));
                }
                setError(null);
            },
            user.uid
        );

        subscriptionRef.current = unsubscribe;
        return () => unsubscribe && unsubscribe();
    }, [shouldFetchSuites, user?.uid, setActiveSuiteWithStorage]);

    useEffect(() => {
        if (shouldFetchSuites && user?.uid && suites.length === 0) {
            refetchSuites({ forceRefresh: false, silent: false });
        }
    }, [shouldFetchSuites, user?.uid, suites.length, refetchSuites]);

    useEffect(() => {
        return () => {
            if (subscriptionRef.current) subscriptionRef.current();
            if (fetchAbortController.current) fetchAbortController.current.abort();
            suiteService.cleanup();
        };
    }, []);

    const value = useMemo(() => ({
        suites,
        userTestSuites: suites,
        individualSuites,
        organizationSuites,
        activeSuite,
        totalSuites,
        setActiveSuite: setActiveSuiteWithStorage,
        switchSuite,
        createTestSuite,
        checkSuiteNameExists,
        refetchSuites,
        fetchUserSuites,
        availableOrganizations,
        getSuiteLimit,
        isLoading,
        isFetching,
        error,
        canCreateSuite: isAuthenticated && userProfile,
        shouldFetchSuites,
        isAuthenticated,
        lastFetchTime,
        clearCache,
        isCacheValid: isCacheValid(),
        cacheVersion: cache.current.version
    }), [
        suites,
        individualSuites,
        organizationSuites,
        activeSuite,
        totalSuites,
        setActiveSuiteWithStorage,
        switchSuite,
        createTestSuite,
        checkSuiteNameExists,
        refetchSuites,
        fetchUserSuites,
        availableOrganizations,
        getSuiteLimit,
        isLoading,
        isFetching,
        error,
        isAuthenticated,
        userProfile,
        shouldFetchSuites,
        lastFetchTime,
        clearCache,
        isCacheValid
    ]);

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};