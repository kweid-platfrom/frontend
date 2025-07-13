// contexts/SuiteContext.js - Fixed authentication issues
'use client'
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useUserProfile } from './userProfileContext'; // Fixed import path
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

    // Use refs to prevent infinite loops
    const fetchingRef = useRef(false);
    const initializedRef = useRef(false);
    const userDocEnsuredRef = useRef(false);
    const currentUserIdRef = useRef(null);

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        suites: null,
        timestamp: null
    });

    // Helper function to safely check if registration is in progress
    const isRegistering = useCallback(() => {
        return typeof window !== 'undefined' && window.isRegistering;
    }, []);

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // Enhanced authentication checking
    const isAuthenticated = useMemo(() => {
        return !!(user && user.uid && user.emailVerified);
    }, [user]);

    // Check if user should have access to fetch suites per security rules
    const shouldFetchSuites = useMemo(() => {
        // NEVER fetch suites during registration
        if (isRegistering()) {
            console.log('shouldFetchSuites: false - registration in progress');
            return false;
        }

        // Must have authenticated user with verified email
        if (!isAuthenticated) {
            console.log('shouldFetchSuites: false - user not authenticated or email not verified', { 
                user: !!user, 
                uid: !!user?.uid,
                emailVerified: user?.emailVerified 
            });
            return false;
        }

        // Must not be a new user (profile should exist)
        if (isNewUser) {
            console.log('shouldFetchSuites: false - new user detected');
            return false;
        }

        // Must have user profile loaded and not be loading
        if (!isProfileLoaded || profileLoading) {
            console.log('shouldFetchSuites: false - profile not loaded or loading', {
                isProfileLoaded,
                profileLoading,
                hasProfile: !!userProfile
            });
            return false;
        }

        // Must not have profile errors
        if (profileError) {
            console.log('shouldFetchSuites: false - profile error:', profileError);
            return false;
        }

        return true;
    }, [isRegistering, isAuthenticated, isNewUser, isProfileLoaded, profileLoading, profileError, user, userProfile]);

    // Simple subscription limits (since useSubscription is not available)
    const getSubscriptionLimits = useCallback(() => {
        if (!userProfile) return { suites: 0 };
        
        // Basic limits based on account type or subscription status
        const accountType = userProfile.account_type || 'individual';
        const subscriptionPlan = userProfile.subscription?.plan || 'free';
        
        switch (subscriptionPlan) {
            case 'pro':
                return { suites: 50 };
            case 'enterprise':
                return { suites: -1 }; // unlimited
            default:
                return { suites: accountType === 'organization' ? 10 : 5 };
        }
    }, [userProfile]);

    // Check if user can create more suites
    const canCreateSuite = useMemo(() => {
        if (!isAuthenticated || !userProfile || isRegistering()) return false;
        
        const limits = getSubscriptionLimits();
        return limits.suites === -1 || suites.length < limits.suites;
    }, [isAuthenticated, userProfile, suites.length, getSubscriptionLimits, isRegistering]);

    // Get suite limit
    const getSuiteLimit = useCallback(() => {
        if (isRegistering()) return 0;
        const limits = getSubscriptionLimits();
        return limits.suites;
    }, [getSubscriptionLimits, isRegistering]);

    // Ensure user document exists BEFORE any suite operations
    const ensureUserDocumentExists = useCallback(async (userId) => {
        // Never run during registration
        if (isRegistering()) {
            console.log('Skipping user document creation - registration in progress');
            return;
        }

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
    }, [isRegistering]);

    // Fetch suites matching security rules constraints
    const fetchUserSuites = useCallback(async (userId = null, forceRefresh = false) => {
        // Never fetch during registration
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

            // Ensure user document exists BEFORE attempting to fetch suites
            await ensureUserDocumentExists(userId);

            let suiteList = [];

            console.log('Fetching suites for userId:', userId);

            // Fetch individual suites
            try {
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

            // Fetch organization suites
            if (userProfile?.account_memberships?.length > 0) {
                console.log('Checking org memberships:', userProfile.account_memberships.length);

                for (const membership of userProfile.account_memberships) {
                    if (membership.org_id && membership.status === 'active') {
                        try {
                            console.log('Fetching org suites for:', membership.org_id);
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
    }, [cache.suites, isCacheValid, userProfile, shouldFetchSuites, ensureUserDocumentExists, isRegistering, isAuthenticated]);

    const setActiveSuiteWithStorage = useCallback((suite) => {
        // Don't set active suite during registration
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
        // Never refetch during registration
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
            setCache({ suites: null, timestamp: null });
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

    // Create test suite with security rule compliance
    const createTestSuite = useCallback(async (suiteData) => {
        // Never create suites during registration
        if (isRegistering()) {
            throw new Error('Cannot create test suites during registration');
        }

        if (!isAuthenticated) {
            throw new Error('User not authenticated or email not verified');
        }

        if (!userProfile) {
            throw new Error('User profile not loaded');
        }

        if (!canCreateSuite) {
            const suiteLimit = getSuiteLimit();
            throw new Error(`Suite limit reached. Your current plan allows ${suiteLimit === -1 ? 'unlimited' : suiteLimit} suites.`);
        }

        try {
            await ensureUserDocumentExists(user.uid);

            const isOrganizationSuite = !!suiteData.organizationId;
            const ownerType = isOrganizationSuite ? 'organization' : 'individual';
            const ownerId = isOrganizationSuite ? suiteData.organizationId : user.uid;

            console.log('Creating suite:', {
                ownerType,
                ownerId,
                isOrganizationSuite,
                userProfile: userProfile?.account_type,
                currentSuiteCount: suites.length,
                suiteLimit: getSuiteLimit()
            });

            if (isOrganizationSuite) {
                const orgId = suiteData.organizationId;
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
                ownerType,
                ownerId,
                name: suiteData.name,
                description: suiteData.description || '',
                status: 'active',
                tags: suiteData.tags || [],
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                permissions: {
                    [user.uid]: 'admin'
                },
                testingAssets: {
                    bugs: [],
                    testCases: [],
                    recordings: [],
                    automatedScripts: [],
                    dashboardMetrics: {},
                    reports: [],
                    settings: {}
                },
                collaboration: {
                    activityLog: [],
                    comments: [],
                    notifications: []
                }
            };

            console.log('Creating suite with data:', newSuite);

            const collectionRef = collection(db, 'testSuites');
            const docRef = await addDoc(collectionRef, newSuite);

            await updateDoc(docRef, {
                suite_id: docRef.id,
                updatedAt: serverTimestamp()
            });

            const createdSuite = { ...newSuite, suite_id: docRef.id };

            const newSuiteForState = {
                ...createdSuite,
                accountType: ownerType,
                ownerId,
                organizationId: isOrganizationSuite ? suiteData.organizationId : undefined
            };

            setSuites(prevSuites => [newSuiteForState, ...prevSuites]);
            setActiveSuiteWithStorage(newSuiteForState);
            setCache({ suites: null, timestamp: null });

            // Refresh suites after creation
            setTimeout(() => refetchSuites(true), 100);

            console.log('Suite created and state updated immediately:', newSuiteForState);

            return createdSuite;
        } catch (error) {
            console.error('Error creating test suite:', error);
            throw error;
        }
    }, [user, userProfile, refetchSuites, setActiveSuiteWithStorage, ensureUserDocumentExists, suites.length, canCreateSuite, getSuiteLimit, isRegistering, isAuthenticated]);

    // Initialize suites when user and profile are ready
    useEffect(() => {
        const userId = user?.uid;
        
        // Reset when user changes
        if (userId !== currentUserIdRef.current) {
            console.log('User changed, resetting suite context');
            currentUserIdRef.current = userId;
            initializedRef.current = false;
            fetchingRef.current = false;
            userDocEnsuredRef.current = false;
            setCache({ suites: null, timestamp: null });
            setSuites([]);
            setActiveSuite(null);
            setError(null);
        }

        // Initialize when ready
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

    // Completely disable suite context during registration
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