/* eslint-disable react-hooks/exhaustive-deps */
// contexts/SuiteContext.js
'use client'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    orderBy,
    limit,
    serverTimestamp,
    addDoc
} from 'firebase/firestore';
import { accountService } from '../services/accountService';

const SuiteContext = createContext();

export const useSuite = () => {
    const context = useContext(SuiteContext);
    if (!context) {
        throw new Error('useSuite must be used within a SuiteProvider');
    }
    return context;
};

export const SuiteProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [suites, setSuites] = useState([]);
    const [activeSuite, setActiveSuite] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isSuitesLoading, setIsSuitesLoading] = useState(true);
    const [isProfileUpdating, setIsProfileUpdating] = useState(false);

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        userProfile: null,
        suites: null,
        timestamp: null
    });

    // Track if we've already updated the trial status in this session
    const [trialStatusUpdated, setTrialStatusUpdated] = useState(false);

    // Memoized subscription status with trial logic
    const subscriptionStatus = useMemo(() => {
        if (!userProfile) return { 
            isValid: false, 
            isExpired: true, 
            isTrial: false,
            trialDaysRemaining: 0,
            subscriptionType: 'free',
            subscriptionStatus: 'active'
        };

        // Check and update trial status
        const updatedProfile = accountService.checkAndUpdateTrialStatus(userProfile);
        const capabilities = accountService.getUserCapabilities(updatedProfile);

        return {
            isValid: capabilities.isTrialActive || updatedProfile.subscriptionType !== 'free',
            isExpired: !capabilities.isTrialActive && updatedProfile.subscriptionType === 'free',
            isTrial: capabilities.isTrialActive,
            trialDaysRemaining: capabilities.trialDaysRemaining,
            subscriptionType: capabilities.subscriptionType,
            subscriptionStatus: capabilities.subscriptionStatus,
            capabilities: capabilities,
            // Helper methods
            showTrialBanner: capabilities.isTrialActive && capabilities.trialDaysRemaining <= 7,
            showUpgradePrompt: !capabilities.isTrialActive && updatedProfile.subscriptionType === 'free',
            profile: updatedProfile
        };
    }, [userProfile]);

    // Memoized values for better performance with trial logic
    const needsOnboarding = useMemo(() => {
        return !isUserLoading && !isSuitesLoading && suites.length === 0;
    }, [isUserLoading, isSuitesLoading, suites.length]);

    // Updated canCreateSuite with trial logic and proper error handling
    const canCreateSuite = useMemo(() => {
        if (!userProfile) return false;
        
        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
            
            // Check if capabilities and limits exist
            if (!capabilities || !capabilities.limits || typeof capabilities.limits.testSuites === 'undefined') {
                console.warn('AccountService capabilities or limits not properly configured');
                return false;
            }
            
            const suiteCount = suites.length;
            
            // During trial or if user has premium subscription
            if (capabilities.isTrialActive || capabilities.subscriptionType !== 'free') {
                return suiteCount < capabilities.limits.testSuites;
            }
            
            // Free tier - only 1 suite
            return suiteCount < 1;
        } catch (error) {
            console.error('Error checking canCreateSuite:', error);
            // Fallback to basic logic if accountService fails
            return suites.length < 1;
        }
    }, [userProfile, suites.length]);

    // New function to check specific feature access
    const hasFeatureAccess = useCallback((featureName) => {
        if (!userProfile) return false;
        
        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
            
            // Check if capabilities exist
            if (!capabilities) {
                console.warn('AccountService capabilities not available');
                return false;
            }
            
            switch (featureName) {
                case 'multipleSuites':
                    return capabilities.canCreateMultipleSuites;
                case 'advancedReports':
                    return capabilities.canAccessAdvancedReports;
                case 'teamCollaboration':
                    return capabilities.canInviteTeamMembers;
                case 'apiAccess':
                    return capabilities.canUseAPI;
                case 'automation':
                    return capabilities.canUseAutomation;
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error checking feature access for ${featureName}:`, error);
            return false;
        }
    }, [userProfile]);

    // Get feature limits
    const getFeatureLimits = useCallback(() => {
        if (!userProfile) return null;
        
        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
            
            if (!capabilities || !capabilities.limits) {
                console.warn('AccountService limits not available');
                // Return default limits as fallback
                return {
                    testSuites: 2,
                    testCases: 10,
                    recordings: 3,
                    teamMembers: 2
                };
            }
            
            return capabilities.limits;
        } catch (error) {
            console.error('Error getting feature limits:', error);
            // Return default limits as fallback
            return {
                testSuites: 1,
                testCases: 10,
                recordings: 3,
                teamMembers: 1
            };
        }
    }, [userProfile]);

    // Optimized cache check (5 minutes cache)
    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // Enhanced function to update trial status in database
    const updateTrialStatusInDatabase = useCallback(async (uid, originalProfile, updatedProfile) => {
        // Skip if no significant changes or already updated in this session
        if (trialStatusUpdated) return updatedProfile;

        const needsUpdate = (
            originalProfile.isTrialActive !== updatedProfile.isTrialActive ||
            originalProfile.subscriptionStatus !== updatedProfile.subscriptionStatus ||
            originalProfile.trialDaysRemaining !== updatedProfile.trialDaysRemaining ||
            (!originalProfile.hasUsedTrial && updatedProfile.hasUsedTrial) ||
            (!originalProfile.trialStartDate && updatedProfile.trialStartDate)
        );

        if (!needsUpdate) return updatedProfile;

        try {
            console.log('Updating trial status in database:', {
                uid,
                changes: {
                    isTrialActive: { from: originalProfile.isTrialActive, to: updatedProfile.isTrialActive },
                    subscriptionStatus: { from: originalProfile.subscriptionStatus, to: updatedProfile.subscriptionStatus },
                    trialDaysRemaining: { from: originalProfile.trialDaysRemaining, to: updatedProfile.trialDaysRemaining }
                }
            });

            const updateData = {
                subscriptionType: updatedProfile.subscriptionType,
                subscriptionStatus: updatedProfile.subscriptionStatus,
                isTrialActive: updatedProfile.isTrialActive,
                trialDaysRemaining: updatedProfile.trialDaysRemaining,
                showTrialBanner: updatedProfile.showTrialBanner,
                features: updatedProfile.features,
                limits: updatedProfile.limits,
                updatedAt: serverTimestamp()
            };

            // Add trial-specific fields if they exist
            if (updatedProfile.trialStartDate) {
                updateData.trialStartDate = updatedProfile.trialStartDate;
            }
            if (updatedProfile.trialEndDate) {
                updateData.trialEndDate = updatedProfile.trialEndDate;
            }
            if (updatedProfile.hasUsedTrial !== undefined) {
                updateData.hasUsedTrial = updatedProfile.hasUsedTrial;
            }
            if (updatedProfile.trialExpiredAt) {
                updateData.trialExpiredAt = updatedProfile.trialExpiredAt;
                updateData.trialExpired = true;
            }

            await updateDoc(doc(db, 'users', uid), updateData);
            console.log('Trial status successfully updated in database');
            
            // Mark as updated for this session
            setTrialStatusUpdated(true);
            
            return updatedProfile;
        } catch (error) {
            console.error('Error updating trial status in database:', error);
            // Return the updated profile even if database update fails
            return updatedProfile;
        }
    }, [trialStatusUpdated]);

    // Fetch user profile with enhanced trial handling
    const fetchUserProfile = useCallback(async (uid, forceRefresh = false) => {
        try {
            // Return cached data if valid and not forcing refresh
            if (!forceRefresh && isCacheValid() && cache.userProfile) {
                return cache.userProfile;
            }

            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const originalProfile = { user_id: uid, ...userDoc.data() };
                
                // Check if trial status needs to be updated
                const updatedProfile = accountService.checkAndUpdateTrialStatus(originalProfile);
                
                // Update database if needed
                const finalProfile = await updateTrialStatusInDatabase(uid, originalProfile, updatedProfile);
                
                // Update cache
                setCache(prev => ({
                    ...prev,
                    userProfile: finalProfile,
                    timestamp: Date.now()
                }));
                
                return finalProfile;
            } else {
                // User document doesn't exist - this might be a new user
                console.log('User document not found, might be a new user:', uid);
                return null;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Return cached data as fallback
            return cache.userProfile || null;
        }
    }, [cache.userProfile, isCacheValid, updateTrialStatusInDatabase]);

    // Enhanced setup for new users without profiles
    const setupNewUserProfile = useCallback(async (uid, userEmail) => {
        try {
            console.log('Setting up new user profile with trial:', uid);
            
            const accountType = accountService.getAccountType(userEmail);
            const trialConfig = accountService.createFreemiumSubscription(accountType);
            
            const newProfile = {
                user_id: uid,
                primary_email: userEmail,
                profile_info: {
                    name: '',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                },
                account_memberships: [], // Initialize as empty array
                session_context: {},
                accountType,
                role: accountType === 'organization' ? 'admin' : 'user',
                createdAt: new Date(),
                accountCreatedAt: new Date(),
                onboardingCompleted: false,
                ...trialConfig
            };

            await setDoc(doc(db, 'users', uid), newProfile);
            console.log('New user profile created with trial');
            
            // Reset trial status updated flag since this is a new user
            setTrialStatusUpdated(false);
            
            return newProfile;
        } catch (error) {
            console.error('Error setting up new user profile:', error);
            throw error;
        }
    }, []);

    // Update user profile method
    const updateUserProfile = useCallback(async (profileData) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            setIsProfileUpdating(true);
            
            const userDocRef = doc(db, 'users', user.uid);
            
            // Prepare update data with timestamp
            const updateData = {
                ...profileData,
                updatedAt: serverTimestamp()
            };

            // Update document in Firestore
            await updateDoc(userDocRef, updateData);

            // Fetch fresh profile data to ensure consistency
            const updatedProfile = await fetchUserProfile(user.uid, true);
            
            // Update local state
            setUserProfile(updatedProfile);
            
            // Clear cache to force fresh data on next fetch
            setCache(prev => ({
                ...prev,
                userProfile: null,
                timestamp: null
            }));

            // Reset trial status updated flag
            setTrialStatusUpdated(false);

            return updatedProfile;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        } finally {
            setIsProfileUpdating(false);
        }
    }, [user, fetchUserProfile]);

    // Create or update user profile (useful for first time users)
    const createOrUpdateUserProfile = useCallback(async (profileData) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            setIsProfileUpdating(true);
            
            const userDocRef = doc(db, 'users', user.uid);
            
            // Check if this is a new user by checking if they have trial data
            const existingDoc = await getDoc(userDocRef);
            const isNewUser = !existingDoc.exists() || !existingDoc.data().hasUsedTrial;
            
            let profileWithTimestamps = {
                ...profileData,
                user_id: user.uid,
                primary_email: user.email,
                updatedAt: serverTimestamp()
            };

            // If new user, add trial configuration
            if (isNewUser) {
                const accountType = profileData.accountType || accountService.getAccountType(user.email);
                const trialConfig = accountService.createFreemiumSubscription(accountType);
                
                profileWithTimestamps = {
                    ...profileWithTimestamps,
                    ...trialConfig,
                    createdAt: serverTimestamp(),
                    accountCreatedAt: serverTimestamp(),
                    profile_info: {
                        name: profileData.profile_info?.name || '',
                        timezone: profileData.profile_info?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
                    },
                    account_memberships: profileData.account_memberships || [],
                    session_context: profileData.session_context || {}
                };
            }

            // Use setDoc with merge option to create or update
            await setDoc(userDocRef, profileWithTimestamps, { merge: true });

            // Fetch fresh profile data
            const updatedProfile = await fetchUserProfile(user.uid, true);
            
            // Update local state
            setUserProfile(updatedProfile);
            
            // Clear cache
            setCache(prev => ({
                ...prev,
                userProfile: null,
                timestamp: null
            }));

            // Reset trial status updated flag
            setTrialStatusUpdated(false);

            return updatedProfile;
        } catch (error) {
            console.error('Error creating/updating user profile:', error);
            throw error;
        } finally {
            setIsProfileUpdating(false);
        }
    }, [user, fetchUserProfile]);

    // Refresh user profile method
    const refreshUserProfile = useCallback(async () => {
        if (!user) return null;

        try {
            setIsUserLoading(true);
            // Reset trial status updated flag to allow fresh updates
            setTrialStatusUpdated(false);
            const freshProfile = await fetchUserProfile(user.uid, true);
            setUserProfile(freshProfile);
            return freshProfile;
        } catch (error) {
            console.error('Error refreshing user profile:', error);
            throw error;
        } finally {
            setIsUserLoading(false);
        }
    }, [user, fetchUserProfile]);

    // Update specific profile fields
    const updateProfileField = useCallback(async (fieldName, fieldValue) => {
        if (!user) {
            throw new Error('User not authenticated');
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            const updateData = {
                [fieldName]: fieldValue,
                updatedAt: serverTimestamp()
            };

            await updateDoc(userDocRef, updateData);

            // Update local state optimistically
            setUserProfile(prev => ({
                ...prev,
                [fieldName]: fieldValue
            }));

            // Clear cache
            setCache(prev => ({
                ...prev,
                userProfile: null,
                timestamp: null
            }));

            return true;
        } catch (error) {
            console.error(`Error updating profile field ${fieldName}:`, error);
            throw error;
        }
    }, [user]);

    // Optimized suite fetching with pagination and caching
    const fetchUserSuites = useCallback(async (uid = null) => {
        try {
            // Return cached data if valid
            if (isCacheValid() && cache.suites) {
                return cache.suites;
            }

            let suiteList = [];

            // Fetch individual suites (owned by user)
            const individualSuitesQuery = query(
                collection(db, 'testSuites'),
                where('access_control.owner_id', '==', uid),
                orderBy('metadata.created_date', 'desc'),
                limit(50)
            );

            const individualSuitesSnapshot = await getDocs(individualSuitesQuery);
            const individualSuites = individualSuitesSnapshot.docs.map(doc => ({
                suite_id: doc.id,
                ...doc.data()
            }));

            suiteList = [...individualSuites];

            // If user has organization memberships, fetch organization suites
            if (userProfile?.account_memberships?.length > 0) {
                for (const membership of userProfile.account_memberships) {
                    if (membership.org_id && membership.status === 'active') {
                        try {
                            const orgSuitesQuery = query(
                                collection(db, 'testSuites'),
                                where('access_control.owner_id', '==', membership.org_id),
                                orderBy('metadata.created_date', 'desc'),
                                limit(50)
                            );

                            const orgSuitesSnapshot = await getDocs(orgSuitesQuery);
                            const orgSuites = orgSuitesSnapshot.docs.map(doc => ({
                                suite_id: doc.id,
                                ...doc.data(),
                                isOrganizationSuite: true,
                                organizationId: membership.org_id
                            }));

                            suiteList = [...suiteList, ...orgSuites];
                        } catch (error) {
                            console.warn(`Error fetching suites for org ${membership.org_id}:`, error);
                        }
                    }
                }
            }

            // Remove duplicates and sort by creation date
            const uniqueSuites = suiteList.reduce((acc, suite) => {
                const existingIndex = acc.findIndex(s => s.suite_id === suite.suite_id);
                if (existingIndex === -1) {
                    acc.push(suite);
                }
                return acc;
            }, []);

            uniqueSuites.sort((a, b) => {
                const dateA = a.metadata?.created_date?.toDate?.() || new Date(a.metadata?.created_date);
                const dateB = b.metadata?.created_date?.toDate?.() || new Date(b.metadata?.created_date);
                return dateB - dateA;
            });

            setCache(prev => ({
                ...prev,
                suites: uniqueSuites,
                timestamp: Date.now()
            }));

            return uniqueSuites;
        } catch (error) {
            console.error('Error fetching suites:', error);
            // Return cached data as fallback
            return cache.suites || [];
        }
    }, [cache.suites, isCacheValid, userProfile]);

    // Set active suite with localStorage sync
    const setActiveSuiteWithStorage = useCallback((suite) => {
        setActiveSuite(suite);
        if (suite?.suite_id) {
            localStorage.setItem('activeSuiteId', suite.suite_id);
        } else {
            localStorage.removeItem('activeSuiteId');
        }
    }, []);

    // Create new test suite
    const createTestSuite = useCallback(async (suiteData) => {
        if (!user || !userProfile) {
            throw new Error('User not authenticated or profile not loaded');
        }

        if (!canCreateSuite) {
            throw new Error('Suite creation limit reached');
        }

        try {
            const suiteId = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newSuite = {
                suite_id: suiteId,
                metadata: {
                    name: suiteData.name,
                    description: suiteData.description || '',
                    created_by: user.uid,
                    created_date: serverTimestamp(),
                    updated_date: serverTimestamp(),
                    tags: suiteData.tags || [],
                    version: '1.0.0'
                },
                access_control: {
                    owner_id: suiteData.organizationId || user.uid,
                    members: suiteData.members || [],
                    admins: suiteData.admins || [],
                    visibility: suiteData.visibility || 'private'
                },
                testing_assets: {
                    test_cases: [],
                    recordings: [],
                    automated_scripts: [],
                    reports: []
                },
                settings: {
                    notifications: true,
                    auto_execution: false,
                    retention_days: 30
                }
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'testSuites'), newSuite);
            
            // Update the suite with the actual document ID
            await updateDoc(docRef, { suite_id: docRef.id });

            // Refetch suites to update local state
            await refetchSuites();

            return { ...newSuite, suite_id: docRef.id };
        } catch (error) {
            console.error('Error creating test suite:', error);
            throw error;
        }
    }, [user, userProfile, canCreateSuite]);

    // Enhanced data loading with better error handling and new user setup
    const loadUserData = useCallback(async (currentUser) => {
        if (!currentUser) return;

        try {
            // Load user profile first (needed for suite query)
            setIsUserLoading(true);
            let profile = await fetchUserProfile(currentUser.uid);
            
            // If no profile exists, set up a new user profile
            if (!profile) {
                console.log('No profile found, setting up new user');
                profile = await setupNewUserProfile(currentUser.uid, currentUser.email);
            }
            
            setUserProfile(profile);
            setIsUserLoading(false);

            // Load suites in parallel if we have profile
            if (profile) {
                setIsSuitesLoading(true);
                const userSuites = await fetchUserSuites(
                    currentUser.uid,
                    profile.organizationId
                );
                setSuites(userSuites);

                // Set active suite logic
                if (userSuites.length > 0) {
                    const savedSuiteId = localStorage.getItem('activeSuiteId');
                    let activeSuiteItem = null;
                    
                    // Try to find the saved suite first
                    if (savedSuiteId) {
                        activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId);
                    }
                    
                    // If no saved suite or saved suite not found, use the first (most recent)
                    if (!activeSuiteItem) {
                        activeSuiteItem = userSuites[0];
                    }
                    
                    setActiveSuiteWithStorage(activeSuiteItem);
                } else {
                    // No suites found, clear active suite
                    setActiveSuiteWithStorage(null);
                }
                setIsSuitesLoading(false);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setIsUserLoading(false);
            setIsSuitesLoading(false);
        }
    }, [fetchUserProfile, setupNewUserProfile, fetchUserSuites, setActiveSuiteWithStorage]);

    // Optimized auth state listener
    useEffect(() => {
        const auth = getAuth();
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!mounted) return;

            setIsLoading(true);

            if (currentUser) {
                setUser(currentUser);
                // Reset trial status updated flag for new auth session
                setTrialStatusUpdated(false);
                await loadUserData(currentUser);
            } else {
                // Clear all user data
                setUser(null);
                setUserProfile(null);
                setSuites([]);
                setActiveSuite(null);
                setIsUserLoading(false);
                setIsSuitesLoading(false);
                setTrialStatusUpdated(false);
                // Clear cache
                setCache({ userProfile: null, suites: null, timestamp: null });
                // Clear localStorage
                localStorage.removeItem('activeSuiteId');
            }

            if (mounted) {
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [loadUserData]);

    // Optimized refetch function with better active suite handling
    const refetchSuites = useCallback(async () => {
        if (!user || !userProfile) return;

        setIsSuitesLoading(true);
        // Clear cache to force fresh data
        setCache(prev => ({ ...prev, suites: null, timestamp: null }));
        
        try {
            const userSuites = await fetchUserSuites(
                user.uid,
                userProfile.organizationId
            );
            setSuites(userSuites);

            // Handle active suite after refetch
            if (userSuites.length > 0) {
                const savedSuiteId = localStorage.getItem('activeSuiteId');
                let activeSuiteItem = null;
                
                // Try to find the saved suite first
                if (savedSuiteId) {
                    activeSuiteItem = userSuites.find(s => s.suite_id === savedSuiteId);
                }
                
                // If no saved suite or saved suite not found, use the first (most recent)
                if (!activeSuiteItem) {
                    activeSuiteItem = userSuites[0];
                }
                
                setActiveSuiteWithStorage(activeSuiteItem);
            } else {
                setActiveSuiteWithStorage(null);
            }
        } finally {
            setIsSuitesLoading(false);
        }
    }, [user, userProfile, fetchUserSuites, setActiveSuiteWithStorage]);

    // Force trial status check and update
    const forceTrialStatusUpdate = useCallback(async () => {
        if (!user) return null;

        try {
            // Reset the flag to allow update
            setTrialStatusUpdated(false);
            
            // Force refresh profile which will trigger trial status check
            const freshProfile = await fetchUserProfile(user.uid, true);
            setUserProfile(freshProfile);
            
            return freshProfile;
        } catch (error) {
            console.error('Error forcing trial status update:', error);
            throw error;
        }
    }, [user, fetchUserProfile]);

    const value = useMemo(() => ({
        // User and profile data
        user,
        userProfile,
        
        // Suites data
        suites,
        activeSuite,
        setActiveSuite: setActiveSuiteWithStorage,
        
        // Loading states
        isLoading: isLoading || isUserLoading,
        isUserLoading,
        isSuitesLoading,
        isProfileUpdating,
        
        // Profile methods
        updateUserProfile,
        createOrUpdateUserProfile,
        refreshUserProfile,
        updateProfileField,
        forceTrialStatusUpdate,
        
        // Suite methods
        refetchSuites,
        createTestSuite,
        
        // Computed values
        needsOnboarding,
        canCreateSuite,
        checkSubscriptionStatus: () => subscriptionStatus,
        
        // New freemium trial methods
        hasFeatureAccess,
        getFeatureLimits,
        subscriptionStatus,
    }), [
        user,
        userProfile,
        suites,
        activeSuite,
        setActiveSuiteWithStorage,
        isLoading,
        isUserLoading,
        isSuitesLoading,
        isProfileUpdating,
        updateUserProfile,
        createOrUpdateUserProfile,
        refreshUserProfile,
        updateProfileField,
        forceTrialStatusUpdate,
        refetchSuites,
        createTestSuite,
        needsOnboarding,
        canCreateSuite,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits
    ]);

    return (
        <SuiteContext.Provider value={value}>
            {children}
        </SuiteContext.Provider>
    );
};