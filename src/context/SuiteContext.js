/* eslint-disable react-hooks/exhaustive-deps */
// contexts/SuiteContext.js
'use client'
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext';
import { useSubscription } from './subscriptionContext';
import { db } from '../config/firebase';
import {
    collection,
    query,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    addDoc,
    updateDoc,
    setDoc,
    doc
} from 'firebase/firestore';

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
    const { userProfile } = useUserProfile();
    const { subscriptionStatus } = useSubscription();

    const [suites, setSuites] = useState([]);
    const [activeSuite, setActiveSuite] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use refs to prevent infinite loops
    const fetchingRef = useRef(false);
    const initializedRef = useRef(false);

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        suites: null,
        timestamp: null
    });

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // SIMPLIFIED: Check if user should have access to fetch suites
    const shouldFetchSuites = useMemo(() => {
        // Must have authenticated user
        if (!user) return false;

        // Must have email verified (per Firestore rules)
        if (!user.emailVerified) return false;

        // Don't need to wait for userProfile for basic fetching
        return true;
    }, [user?.uid, user?.emailVerified]);

    // Updated getFeatureLimits function with proper trial support
    const getFeatureLimits = useCallback(() => {
        if (!subscriptionStatus) {
            // Default limits for free tier
            return {
                suites: 1,
                testCases: 10,
                recordings: 5,
                automatedScripts: 0
            };
        }

        // Check if user is on trial (30 days trial gives full features)
        const isTrialActive = subscriptionStatus.isTrialActive ||
            subscriptionStatus.subscriptionStatus === 'trial';

        if (isTrialActive) {
            // During trial, give full features based on account type
            const accountType = userProfile?.accountType || 'individual';

            if (accountType === 'organization') {
                const orgType = subscriptionStatus.subscriptionType || 'organization_trial';
                if (orgType.includes('enterprise')) {
                    return {
                        suites: -1, // unlimited
                        testCases: -1,
                        recordings: -1,
                        automatedScripts: -1
                    };
                } else {
                    return {
                        suites: 10, // team level
                        testCases: -1,
                        recordings: -1,
                        automatedScripts: -1
                    };
                }
            } else {
                return {
                    suites: 5, // individual trial
                    testCases: -1,
                    recordings: -1,
                    automatedScripts: -1
                };
            }
        }

        // Non-trial limits
        const limits = subscriptionStatus.capabilities?.limits;
        if (!limits) {
            // Fallback default limits based on account type
            const accountType = userProfile?.accountType || 'individual';
            if (accountType === 'organization') {
                return {
                    suites: 5,
                    testCases: 50,
                    recordings: 25,
                    automatedScripts: 10
                };
            }
            return {
                suites: 1,
                testCases: 10,
                recordings: 5,
                automatedScripts: 0
            };
        }

        return {
            suites: limits.testSuites || 1,
            testCases: limits.testCases || 10,
            recordings: limits.recordings || 5,
            automatedScripts: limits.automatedScripts || 0
        };
    }, [subscriptionStatus, userProfile]);

    const canCreateSuite = useMemo(() => {
        if (!userProfile || !subscriptionStatus) return false;

        const limits = getFeatureLimits();
        if (limits.suites === -1) return true; // Unlimited

        return suites.length < limits.suites;
    }, [userProfile, subscriptionStatus, suites.length, getFeatureLimits]);

    // IMPROVED: Initialize individual account document if needed
    const ensureIndividualAccountExists = useCallback(async (userId) => {
        try {
            await setDoc(doc(db, 'individualAccounts', userId), {
                userId: userId,
                accountType: 'individual',
                createdAt: serverTimestamp(),
                metadata: {
                    created_date: serverTimestamp(),
                    last_modified: serverTimestamp()
                }
            }, { merge: true });
            console.log('Individual account structure ensured');
        } catch (error) {
            console.error('Failed to ensure individual account:', error);
        }
    }, []);

    const fetchUserSuites = useCallback(async (userId = null, forceRefresh = false) => {
        if (!userId || !shouldFetchSuites) {
            console.log('Skipping fetch - missing requirements:', { userId: !!userId, shouldFetchSuites });
            return [];
        }

        // Prevent concurrent fetches
        if (fetchingRef.current && !forceRefresh) {
            console.log('Already fetching, skipping...');
            return cache.suites || [];
        }

        try {
            if (!forceRefresh && isCacheValid() && cache.suites) {
                console.log('Using cached suites');
                return cache.suites;
            }

            fetchingRef.current = true;
            setIsLoading(true);
            setError(null);

            let suiteList = [];
            const accountType = userProfile?.accountType || 'individual';

            console.log('Fetching suites for accountType:', accountType, 'userId:', userId);

            // ALWAYS try to fetch individual suites first
            try {
                const individualSuitesQuery = query(
                    collection(db, 'individualAccounts', userId, 'testSuites'),
                    orderBy('metadata.created_date', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(individualSuitesQuery);
                const individualSuites = snapshot.docs.map(doc => ({
                    suite_id: doc.id,
                    ...doc.data(),
                    accountType: 'individual',
                    ownerId: userId
                }));

                suiteList = [...individualSuites];
                console.log('Fetched individual suites:', individualSuites.length);
            } catch (error) {
                console.error('Error fetching individual suites:', error);

                // If permission denied, try to initialize the account structure
                if (error.code === 'permission-denied') {
                    console.log('Permission denied - ensuring individual account exists...');
                    await ensureIndividualAccountExists(userId);
                }
            }

            // Handle organization suites (only if userProfile is available)
            if (userProfile?.account_memberships?.length > 0) {
                console.log('Checking org memberships:', userProfile.account_memberships.length);

                for (const membership of userProfile.account_memberships) {
                    if (membership.org_id && membership.status === 'active') {
                        try {
                            console.log('Fetching org suites for:', membership.org_id);

                            const orgSuitesQuery = query(
                                collection(db, 'organizations', membership.org_id, 'testSuites'),
                                orderBy('metadata.created_date', 'desc'),
                                limit(25)
                            );

                            const orgSnapshot = await getDocs(orgSuitesQuery);
                            const orgSuites = orgSnapshot.docs.map(doc => ({
                                suite_id: doc.id,
                                ...doc.data(),
                                accountType: 'organization',
                                organizationId: membership.org_id,
                                ownerId: membership.org_id
                            }));

                            suiteList = [...suiteList, ...orgSuites];
                            console.log('Fetched org suites:', orgSuites.length);
                        } catch (error) {
                            console.warn(`Error fetching org suites for ${membership.org_id}:`, error);
                        }
                    }
                }
            }

            // Remove duplicates and sort
            const uniqueSuites = suiteList.reduce((acc, suite) => {
                const existingIndex = acc.findIndex(s => s.suite_id === suite.suite_id);
                if (existingIndex === -1) {
                    acc.push(suite);
                }
                return acc;
            }, []);

            uniqueSuites.sort((a, b) => {
                const dateA = a.metadata?.created_date?.toDate?.() || new Date(0);
                const dateB = b.metadata?.created_date?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            console.log('Final unique suites:', uniqueSuites.length);

            setCache({
                suites: uniqueSuites,
                timestamp: Date.now()
            });

            return uniqueSuites;
        } catch (error) {
            console.error('Error fetching suites:', error);
            setError(error.message);
            return cache.suites || [];
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [cache.suites, isCacheValid, userProfile, shouldFetchSuites, ensureIndividualAccountExists]);

    const setActiveSuiteWithStorage = useCallback((suite) => {
        setActiveSuite(suite);
        if (suite?.suite_id && typeof window !== 'undefined') {
            localStorage.setItem('activeSuiteId', suite.suite_id);
        } else if (typeof window !== 'undefined') {
            localStorage.removeItem('activeSuiteId');
        }
    }, []);

    const refetchSuites = useCallback(async (forceRefresh = true) => {
        if (!user || !shouldFetchSuites) {
            console.log('Cannot refetch - missing requirements');
            return;
        }

        console.log('Refetching suites...');

        if (forceRefresh) {
            setCache({ suites: null, timestamp: null });
        }

        const userSuites = await fetchUserSuites(user.uid, forceRefresh);
        setSuites(userSuites);

        // Handle active suite
        if (userSuites.length > 0 && typeof window !== 'undefined') {
            const savedSuiteId = localStorage.getItem('activeSuiteId');
            const activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId) || userSuites[0];
            setActiveSuiteWithStorage(activeSuiteItem);
        } else {
            setActiveSuiteWithStorage(null);
        }
    }, [user, fetchUserSuites, setActiveSuiteWithStorage, shouldFetchSuites]);

    const createTestSuite = useCallback(async (suiteData) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        if (!user.emailVerified) {
            throw new Error('Email verification required to create suites');
        }

        try {
            // FIXED: Determine if this should be an organization suite based on the passed organizationId
            const isOrganizationSuite = !!suiteData.organizationId;

            console.log('Creating suite:', {
                isOrganizationSuite,
                organizationId: suiteData.organizationId,
                userProfile: userProfile?.accountType
            });

            // For organization suites, verify admin permissions before attempting creation
            if (isOrganizationSuite) {
                const orgId = suiteData.organizationId;

                // Check if user is an admin of this organization
                const isOrgAdmin = userProfile?.account_memberships?.some(
                    membership => membership.org_id === orgId &&
                        membership.status === 'active' &&
                        membership.role === 'Admin'
                );

                if (!isOrgAdmin) {
                    throw new Error('Only organization administrators can create test suites for the organization');
                }
            }

            const newSuite = {
                metadata: {
                    name: suiteData.name,
                    description: suiteData.description || '',
                    created_by: user.uid,
                    created_date: serverTimestamp(),
                    last_modified: serverTimestamp(),
                    status: 'active',
                    tags: suiteData.tags || []
                },
                access_control: {
                    owner_id: isOrganizationSuite ? suiteData.organizationId : user.uid,
                    admins: [user.uid],
                    members: [],
                    permissions_matrix: {
                        [user.uid]: 'admin'
                    }
                },
                testing_assets: {
                    bugs: [],
                    test_cases: [],
                    recordings: [],
                    automated_scripts: [],
                    dashboard_metrics: {},
                    reports: [],
                    settings: {}
                },
                collaboration: {
                    activity_log: [],
                    comments: [],
                    notifications: []
                }
            };

            let collectionRef;
            if (isOrganizationSuite) {
                collectionRef = collection(db, 'organizations', suiteData.organizationId, 'testSuites');
            } else {
                // Ensure individual account exists before creating suite
                await ensureIndividualAccountExists(user.uid);
                collectionRef = collection(db, 'individualAccounts', user.uid, 'testSuites');
            }

            const docRef = await addDoc(collectionRef, newSuite);
            await updateDoc(docRef, {
                suite_id: docRef.id,
                'metadata.last_modified': serverTimestamp()
            });

            const createdSuite = { ...newSuite, suite_id: docRef.id };

            // IMMEDIATE UPDATE: Add the new suite to the current state right away
            const newSuiteForState = {
                ...createdSuite,
                accountType: isOrganizationSuite ? 'organization' : 'individual',
                ownerId: isOrganizationSuite ? suiteData.organizationId : user.uid,
                organizationId: isOrganizationSuite ? suiteData.organizationId : undefined
            };

            // Update state immediately
            setSuites(prevSuites => [newSuiteForState, ...prevSuites]);

            // Set as active suite immediately
            setActiveSuiteWithStorage(newSuiteForState);

            // Clear cache to ensure fresh data on next fetch
            setCache({ suites: null, timestamp: null });

            // Background refresh to ensure data consistency
            setTimeout(() => {
                refetchSuites(true);
            }, 1000);

            console.log('Suite created and state updated immediately:', newSuiteForState);

            return createdSuite;
        } catch (error) {
            console.error('Error creating test suite:', error);
            throw error;
        }
    }, [user, userProfile, refetchSuites, setActiveSuiteWithStorage, ensureIndividualAccountExists]);

    // SIMPLIFIED: Initialize suites when user is ready
    useEffect(() => {
        if (shouldFetchSuites && !initializedRef.current) {
            console.log('Initializing suites...');
            initializedRef.current = true;
            refetchSuites(false); // Don't force refresh on initial load
        } else if (!shouldFetchSuites) {
            // Clear suites for non-verified users
            console.log('Clearing suites - shouldFetchSuites is false');
            setSuites([]);
            setActiveSuite(null);
            setError(null);
            initializedRef.current = false;
        }
    }, [shouldFetchSuites, refetchSuites]);

    // Reset initialization when user changes
    useEffect(() => {
        initializedRef.current = false;
        fetchingRef.current = false;
        setCache({ suites: null, timestamp: null });
        setSuites([]);
        setActiveSuite(null);
        setError(null);
    }, [user?.uid]);

    // FIXED: Return userTestSuites to match dashboard expectations
    const value = {
        suites,
        userTestSuites: suites, // ← This is what Dashboard expects
        activeSuite,
        setActiveSuite: setActiveSuiteWithStorage,
        isLoading,
        loading: isLoading, // ← Also provide 'loading' alias for Dashboard
        error,
        canCreateSuite,
        createTestSuite,
        refetchSuites,
        fetchUserSuites,
        subscriptionStatus,
        getFeatureLimits,
        shouldFetchSuites // Expose this for dashboard logic
    };

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};