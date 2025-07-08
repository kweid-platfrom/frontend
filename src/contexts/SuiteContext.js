/* eslint-disable react-hooks/exhaustive-deps */
// contexts/SuiteContext.js
'use client'
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext';
import { useSubscription } from './subscriptionContext'; // Updated import
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
    doc,
    where
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
    // UPDATED: Use SubscriptionProvider as single source of truth
    const { 
        subscriptionStatus, 
        getFeatureLimits, 
        canCreateResource, 
        getResourceLimit 
    } = useSubscription();

    const [suites, setSuites] = useState([]);
    const [activeSuite, setActiveSuite] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use refs to prevent infinite loops
    const fetchingRef = useRef(false);
    const initializedRef = useRef(false);
    const userDocEnsuredRef = useRef(false);

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        suites: null,
        timestamp: null
    });

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // ALIGNED: Check if user should have access to fetch suites per security rules
    const shouldFetchSuites = useMemo(() => {
        // Must have authenticated user (isAuthenticated() in rules)
        if (!user) return false;
        // Security rules require authenticated user
        return true;
    }, [user?.uid]);

    // UPDATED: Use SubscriptionProvider's canCreateResource for suite creation
    const canCreateSuite = useMemo(() => {
        if (!userProfile || !subscriptionStatus) return false;
        
        // Use the centralized resource creation check from SubscriptionProvider
        return canCreateResource('suites', suites.length);
    }, [userProfile, subscriptionStatus, suites.length, canCreateResource]);

    // UPDATED: Get suite limit from SubscriptionProvider
    const getSuiteLimit = useCallback(() => {
        return getResourceLimit('suites');
    }, [getResourceLimit]);

    // ALIGNED: Ensure user document exists BEFORE any suite operations
    const ensureUserDocumentExists = useCallback(async (userId) => {
        if (userDocEnsuredRef.current) {
            return;
        }

        try {
            console.log('Ensuring user document exists for:', userId);
            await setDoc(doc(db, 'users', userId), {
                user_id: userId,
                created_at: serverTimestamp(),
                preferences: {},
                contact_info: {}
            }, { merge: true });
            
            userDocEnsuredRef.current = true;
            console.log('User document ensured successfully');
        } catch (error) {
            console.error('Failed to ensure user document:', error);
            throw error;
        }
    }, []);

    // ALIGNED: Fetch suites matching security rules constraints
    const fetchUserSuites = useCallback(async (userId = null, forceRefresh = false) => {
        if (!userId || !shouldFetchSuites) {
            console.log('Skipping fetch - missing requirements:', { userId: !!userId, shouldFetchSuites });
            return [];
        }

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

            // ALIGNED: Ensure user document exists BEFORE attempting to fetch suites
            await ensureUserDocumentExists(userId);

            let suiteList = [];

            console.log('Fetching suites for userId:', userId);

            // ALIGNED: Fetch individual suites with proper query constraints
            try {
                // Query for individual suites where user is the owner
                // This aligns with security rule: ownerType == 'individual' && ownerId == getUserId()
                const individualSuitesQuery = query(
                    collection(db, 'testSuites'),
                    where('ownerType', '==', 'individual'),
                    where('ownerId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const individualSnapshot = await getDocs(individualSuitesQuery);
                const individualSuites = individualSnapshot.docs.map(doc => ({
                    suite_id: doc.id,
                    ...doc.data(),
                    accountType: 'individual',
                    ownerId: userId
                }));

                suiteList = [...individualSuites];
                console.log('Fetched individual suites:', individualSuites.length);
            } catch (error) {
                console.error('Error fetching individual suites:', error);
                
                if (error.code === 'permission-denied') {
                    console.error('Permission denied - user document may not exist or security rules blocking access');
                    throw new Error('Unable to access test suites. Please check your account permissions.');
                }
                throw error;
            }

            // ALIGNED: Fetch organization suites for each membership
            if (userProfile?.account_memberships?.length > 0) {
                console.log('Checking org memberships:', userProfile.account_memberships.length);

                // Process each organization membership separately to align with security rules
                for (const membership of userProfile.account_memberships) {
                    if (membership.org_id && membership.status === 'active') {
                        try {
                            console.log('Fetching org suites for:', membership.org_id);

                            // Query for organization suites where user's org is the owner
                            // This aligns with security rule: ownerType == 'organization' && isOrgMember(ownerId)
                            const orgSuitesQuery = query(
                                collection(db, 'testSuites'),
                                where('ownerType', '==', 'organization'),
                                where('ownerId', '==', membership.org_id),
                                orderBy('createdAt', 'desc'),
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
                            // Continue with other organizations even if one fails
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
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
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
    }, [cache.suites, isCacheValid, userProfile, shouldFetchSuites, ensureUserDocumentExists]);

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

    // ALIGNED: Create test suite with proper security rule compliance
    const createTestSuite = useCallback(async (suiteData) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        // ALIGNED: Check email verification if required by your business logic
        if (!user.emailVerified) {
            throw new Error('Email verification required to create suites');
        }

        // UPDATED: Use SubscriptionProvider to check if user can create more suites
        if (!canCreateResource('suites', suites.length)) {
            const suiteLimit = getSuiteLimit();
            throw new Error(`Suite limit reached. Your current plan allows ${suiteLimit === -1 ? 'unlimited' : suiteLimit} suites.`);
        }

        try {
            // ALIGNED: Ensure user document exists before creating suite
            await ensureUserDocumentExists(user.uid);

            // ALIGNED: Determine suite ownership based on organizationId
            const isOrganizationSuite = !!suiteData.organizationId;
            const ownerType = isOrganizationSuite ? 'organization' : 'individual';
            const ownerId = isOrganizationSuite ? suiteData.organizationId : user.uid;

            console.log('Creating suite:', {
                ownerType,
                ownerId,
                isOrganizationSuite,
                userProfile: userProfile?.accountType,
                currentSuiteCount: suites.length,
                suiteLimit: getSuiteLimit()
            });

            // ALIGNED: For organization suites, verify admin permissions
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

            // ALIGNED: Create suite data that matches security rule requirements
            const newSuite = {
                // CRITICAL: Core identification fields required by security rules
                ownerType,
                ownerId,

                // Suite metadata
                name: suiteData.name,
                description: suiteData.description || '',
                status: 'active',
                tags: suiteData.tags || [],

                // ALIGNED: Audit fields required by security rules
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                // ALIGNED: Access control structure
                permissions: {
                    [user.uid]: 'admin'
                },

                // ALIGNED: Testing assets structure (empty initially)
                testingAssets: {
                    bugs: [],
                    testCases: [],
                    recordings: [],
                    automatedScripts: [],
                    dashboardMetrics: {},
                    reports: [],
                    settings: {}
                },

                // ALIGNED: Collaboration structure
                collaboration: {
                    activityLog: [],
                    comments: [],
                    notifications: []
                }
            };

            console.log('Creating suite with data:', newSuite);

            // ALIGNED: Create in top-level testSuites collection
            const collectionRef = collection(db, 'testSuites');
            const docRef = await addDoc(collectionRef, newSuite);

            // Update with document ID
            await updateDoc(docRef, {
                suite_id: docRef.id,
                updatedAt: serverTimestamp()
            });

            const createdSuite = { ...newSuite, suite_id: docRef.id };

            // IMMEDIATE UPDATE: Add the new suite to the current state
            const newSuiteForState = {
                ...createdSuite,
                accountType: ownerType,
                ownerId,
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
    }, [user, userProfile, refetchSuites, setActiveSuiteWithStorage, ensureUserDocumentExists, suites.length, canCreateResource, getSuiteLimit]);

    // ALIGNED: Initialize suites when user is ready
    useEffect(() => {
        if (shouldFetchSuites && !initializedRef.current) {
            console.log('Initializing suites...');
            initializedRef.current = true;
            refetchSuites(false);
        } else if (!shouldFetchSuites) {
            console.log('Clearing suites - shouldFetchSuites is false');
            setSuites([]);
            setActiveSuite(null);
            setError(null);
            initializedRef.current = false;
        }
    }, [shouldFetchSuites, refetchSuites]);

    // ALIGNED: Reset initialization and user doc ensured status when user changes
    useEffect(() => {
        initializedRef.current = false;
        fetchingRef.current = false;
        userDocEnsuredRef.current = false;
        setCache({ suites: null, timestamp: null });
        setSuites([]);
        setActiveSuite(null);
        setError(null);
    }, [user?.uid]);

    // UPDATED: Return value that uses SubscriptionProvider as single source of truth
    const value = {
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
        
        // UPDATED: Use SubscriptionProvider's centralized functions
        subscriptionStatus,
        getFeatureLimits,
        canCreateResource,
        getResourceLimit,
        getSuiteLimit,
        
        // Keep for backward compatibility
        shouldFetchSuites
    };

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};