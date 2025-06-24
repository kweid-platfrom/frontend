// contexts/ProjectContext.js
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
    serverTimestamp
} from 'firebase/firestore';
import { accountService } from '../services/accountService';

const ProjectContext = createContext();

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    const [isProfileUpdating, setIsProfileUpdating] = useState(false);

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        userProfile: null,
        projects: null,
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
        return !isUserLoading && !isProjectsLoading && projects.length === 0;
    }, [isUserLoading, isProjectsLoading, projects.length]);

    // Updated canCreateProject with trial logic and proper error handling
    const canCreateProject = useMemo(() => {
        if (!userProfile) return false;
        
        try {
            const capabilities = accountService.getUserCapabilities(userProfile);
            
            // Check if capabilities and limits exist
            if (!capabilities || !capabilities.limits || typeof capabilities.limits.projects === 'undefined') {
                console.warn('AccountService capabilities or limits not properly configured');
                return false;
            }
            
            const projectCount = projects.length;
            
            // During trial or if user has premium subscription
            if (capabilities.isTrialActive || capabilities.subscriptionType !== 'free') {
                return projectCount < capabilities.limits.projects;
            }
            
            // Free tier - only 1 project
            return projectCount < 1;
        } catch (error) {
            console.error('Error checking canCreateProject:', error);
            // Fallback to basic logic if accountService fails
            return projects.length < 1;
        }
    }, [userProfile, projects.length]);

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
                case 'multipleProjects':
                    return capabilities.canCreateMultipleProjects;
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
                    projects: 1,
                    testScripts: 10,
                    recordings: 3,
                    teamMembers: 1
                };
            }
            
            return capabilities.limits;
        } catch (error) {
            console.error('Error getting feature limits:', error);
            // Return default limits as fallback
            return {
                projects: 1,
                testScripts: 10,
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
                const originalProfile = { uid, ...userDoc.data() };
                
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
                uid,
                email: userEmail,
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
                uid: user.uid,
                email: user.email,
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
                    accountCreatedAt: serverTimestamp()
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

    // Optimized project fetching with pagination and caching
    const fetchUserProjects = useCallback(async (uid, organizationId = null) => {
        try {
            // Return cached data if valid
            if (isCacheValid() && cache.projects) {
                return cache.projects;
            }

            let q;
            if (organizationId) {
                q = query(
                    collection(db, 'projects'),
                    where('organizationId', '==', organizationId),
                    orderBy('createdAt', 'desc'),
                    limit(50) // Limit initial load
                );
            } else {
                q = query(
                    collection(db, 'projects'),
                    where('createdBy', '==', uid),
                    where('organizationId', '==', null),
                    orderBy('createdAt', 'desc'),
                    limit(50) // Limit initial load
                );
            }

            const querySnapshot = await getDocs(q);
            const projectList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCache(prev => ({
                ...prev,
                projects: projectList,
                timestamp: Date.now()
            }));

            return projectList;
        } catch (error) {
            console.error('Error fetching projects:', error);
            // Return cached data as fallback
            return cache.projects || [];
        }
    }, [cache.projects, isCacheValid]);

    // Set active project with localStorage sync
    const setActiveProjectWithStorage = useCallback((project) => {
        setActiveProject(project);
        if (project?.id) {
            localStorage.setItem('activeProjectId', project.id);
        } else {
            localStorage.removeItem('activeProjectId');
        }
    }, []);

    // Enhanced data loading with better error handling and new user setup
    const loadUserData = useCallback(async (currentUser) => {
        if (!currentUser) return;

        try {
            // Load user profile first (needed for project query)
            setIsUserLoading(true);
            let profile = await fetchUserProfile(currentUser.uid);
            
            // If no profile exists, set up a new user profile
            if (!profile) {
                console.log('No profile found, setting up new user');
                profile = await setupNewUserProfile(currentUser.uid, currentUser.email);
            }
            
            setUserProfile(profile);
            setIsUserLoading(false);

            // Load projects in parallel if we have profile
            if (profile) {
                setIsProjectsLoading(true);
                const userProjects = await fetchUserProjects(
                    currentUser.uid,
                    profile.organizationId
                );
                setProjects(userProjects);

                // Set active project logic
                if (userProjects.length > 0) {
                    const savedProjectId = localStorage.getItem('activeProjectId');
                    let activeProj = null;
                    
                    // Try to find the saved project first
                    if (savedProjectId) {
                        activeProj = userProjects.find(p => p.id === savedProjectId);
                    }
                    
                    // If no saved project or saved project not found, use the first (most recent)
                    if (!activeProj) {
                        activeProj = userProjects[0];
                    }
                    
                    setActiveProjectWithStorage(activeProj);
                } else {
                    // No projects found, clear active project
                    setActiveProjectWithStorage(null);
                }
                setIsProjectsLoading(false);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setIsUserLoading(false);
            setIsProjectsLoading(false);
        }
    }, [fetchUserProfile, setupNewUserProfile, fetchUserProjects, setActiveProjectWithStorage]);

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
                setProjects([]);
                setActiveProject(null);
                setIsUserLoading(false);
                setIsProjectsLoading(false);
                setTrialStatusUpdated(false);
                // Clear cache
                setCache({ userProfile: null, projects: null, timestamp: null });
                // Clear localStorage
                localStorage.removeItem('activeProjectId');
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

    // Optimized refetch function with better active project handling
    const refetchProjects = useCallback(async () => {
        if (!user || !userProfile) return;

        setIsProjectsLoading(true);
        // Clear cache to force fresh data
        setCache(prev => ({ ...prev, projects: null, timestamp: null }));
        
        try {
            const userProjects = await fetchUserProjects(
                user.uid,
                userProfile.organizationId
            );
            setProjects(userProjects);

            // Handle active project after refetch
            if (userProjects.length > 0) {
                const savedProjectId = localStorage.getItem('activeProjectId');
                let activeProj = null;
                
                // Try to find the saved project first
                if (savedProjectId) {
                    activeProj = userProjects.find(p => p.id === savedProjectId);
                }
                
                // If no saved project or saved project not found, use the first (most recent)
                if (!activeProj) {
                    activeProj = userProjects[0];
                }
                
                setActiveProjectWithStorage(activeProj);
            } else {
                setActiveProjectWithStorage(null);
            }
        } finally {
            setIsProjectsLoading(false);
        }
    }, [user, userProfile, fetchUserProjects, setActiveProjectWithStorage]);

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
        
        // Projects data
        projects,
        activeProject,
        setActiveProject: setActiveProjectWithStorage,
        
        // Loading states
        isLoading: isLoading || isUserLoading,
        isUserLoading,
        isProjectsLoading,
        isProfileUpdating,
        
        // Profile methods
        updateUserProfile,
        createOrUpdateUserProfile,
        refreshUserProfile,
        updateProfileField,
        forceTrialStatusUpdate,
        
        // Project methods
        refetchProjects,
        
        // Computed values
        needsOnboarding,
        canCreateProject,
        checkSubscriptionStatus: () => subscriptionStatus,
        
        // New freemium trial methods
        hasFeatureAccess,
        getFeatureLimits,
        subscriptionStatus,
    }), [
        user,
        userProfile,
        projects,
        activeProject,
        setActiveProjectWithStorage,
        isLoading,
        isUserLoading,
        isProjectsLoading,
        isProfileUpdating,
        updateUserProfile,
        createOrUpdateUserProfile,
        refreshUserProfile,
        updateProfileField,
        forceTrialStatusUpdate,
        refetchProjects,
        needsOnboarding,
        canCreateProject,
        subscriptionStatus,
        hasFeatureAccess,
        getFeatureLimits
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};