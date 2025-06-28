// contexts/SuiteContext.js
'use client'
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        suites: null,
        timestamp: null
    });

    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // Add the missing getFeatureLimits function
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

        const limits = subscriptionStatus.capabilities?.limits;
        if (!limits) {
            // Fallback default limits
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
    }, [subscriptionStatus]);

    const canCreateSuite = useMemo(() => {
        if (!userProfile || !subscriptionStatus) return false;

        const limits = getFeatureLimits();
        if (limits.suites === -1) return true; // Unlimited
        
        return suites.length < limits.suites;
    }, [userProfile, subscriptionStatus, suites.length, getFeatureLimits]);

    const fetchUserSuites = useCallback(async (userId = null) => {
        if (!userId || !userProfile) return [];

        try {
            if (isCacheValid() && cache.suites) {
                return cache.suites;
            }

            setIsLoading(true);
            let suiteList = [];

            const accountType = userProfile.accountType || 'individual';

            if (accountType === 'individual') {
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
                } catch (error) {
                    console.error('Error fetching individual suites:', error);
                    // Initialize structure if needed
                    await setDoc(doc(db, 'individualAccounts', userId), {
                        userId: userId,
                        accountType: 'individual',
                        createdAt: serverTimestamp()
                    }, { merge: true });
                }
            }

            // Handle organization suites
            if (userProfile.account_memberships?.length > 0) {
                for (const membership of userProfile.account_memberships) {
                    if (membership.org_id && membership.status === 'active') {
                        try {
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

            setCache({
                suites: uniqueSuites,
                timestamp: Date.now()
            });

            return uniqueSuites;
        } catch (error) {
            console.error('Error fetching suites:', error);
            return cache.suites || [];
        } finally {
            setIsLoading(false);
        }
    }, [cache.suites, isCacheValid, userProfile]);

    const setActiveSuiteWithStorage = useCallback((suite) => {
        setActiveSuite(suite);
        if (suite?.suite_id) {
            localStorage.setItem('activeSuiteId', suite.suite_id);
        } else {
            localStorage.removeItem('activeSuiteId');
        }
    }, []);

    const refetchSuites = useCallback(async () => {
        if (!user || !userProfile) return;

        setCache({ suites: null, timestamp: null });
        const userSuites = await fetchUserSuites(user.uid);
        setSuites(userSuites);

        // Handle active suite
        if (userSuites.length > 0) {
            const savedSuiteId = localStorage.getItem('activeSuiteId');
            const activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId) || userSuites[0];
            setActiveSuiteWithStorage(activeSuiteItem);
        } else {
            setActiveSuiteWithStorage(null);
        }
    }, [user, userProfile, fetchUserSuites, setActiveSuiteWithStorage]);

    const createTestSuite = useCallback(async (suiteData) => {
        if (!user || !userProfile) {
            throw new Error('User not authenticated or profile not loaded');
        }

        if (!canCreateSuite) {
            throw new Error('Suite creation limit reached');
        }

        try {
            const accountType = userProfile.accountType || 'individual';
            const isOrganizationSuite = suiteData.organizationId || accountType === 'organization';

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
                    owner_id: isOrganizationSuite ? (suiteData.organizationId || userProfile.session_context?.current_org_id) : user.uid,
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
                const orgId = suiteData.organizationId || userProfile.session_context?.current_org_id;
                if (!orgId) throw new Error('Organization ID required');
                collectionRef = collection(db, 'organizations', orgId, 'testSuites');
            } else {
                collectionRef = collection(db, 'individualAccounts', user.uid, 'testSuites');
            }

            const docRef = await addDoc(collectionRef, newSuite);
            await updateDoc(docRef, {
                suite_id: docRef.id,
                'metadata.last_modified': serverTimestamp()
            });

            // Refresh suites
            await refetchSuites();

            return { ...newSuite, suite_id: docRef.id };
        } catch (error) {
            console.error('Error creating test suite:', error);
            throw error;
        }
    }, [user, userProfile, canCreateSuite, refetchSuites]);

    // Load suites when user/profile changes
    useEffect(() => {
        if (user && userProfile) {
            refetchSuites();
        } else {
            setSuites([]);
            setActiveSuite(null);
        }
    }, [user, userProfile, refetchSuites]);

    const value = {
        suites,
        activeSuite,
        setActiveSuite: setActiveSuiteWithStorage,
        isLoading,
        canCreateSuite,
        createTestSuite,
        refetchSuites,
        fetchUserSuites,
        subscriptionStatus, // Make sure this is available
        getFeatureLimits // Add the missing function to the context value
    };

    return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
};