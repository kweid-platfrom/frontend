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
    orderBy,
    limit
} from 'firebase/firestore';

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

    // Cache for reducing Firebase calls
    const [cache, setCache] = useState({
        userProfile: null,
        projects: null,
        timestamp: null
    });

    // Memoized values for better performance
    const needsOnboarding = useMemo(() => {
        return !isUserLoading && !isProjectsLoading && projects.length === 0;
    }, [isUserLoading, isProjectsLoading, projects.length]);

    const canCreateProject = useMemo(() => {
        if (!userProfile) return false;
        const { subscriptionType } = userProfile;
        const projectCount = projects.length;

        switch (subscriptionType) {
            case 'free':
            case 'individual':
                return projectCount < 1;
            case 'team':
                return projectCount < 5;
            case 'enterprise':
                return true;
            default:
                return false;
        }
    }, [userProfile, projects.length]);

    const subscriptionStatus = useMemo(() => {
        if (!userProfile) return { isValid: false, isExpired: true };

        const now = new Date();
        const expiry = userProfile.subscriptionExpiry?.toDate();

        if (userProfile.subscriptionType === 'free' || userProfile.subscriptionType === 'individual') {
            return {
                isValid: expiry && expiry > now,
                isExpired: expiry && expiry <= now,
                daysLeft: expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0
            };
        }

        return { isValid: true, isExpired: false };
    }, [userProfile]);

    // Optimized cache check (5 minutes cache)
    const isCacheValid = useCallback(() => {
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        return cache.timestamp && (Date.now() - cache.timestamp) < CACHE_DURATION;
    }, [cache.timestamp]);

    // Fetch user profile with caching
    const fetchUserProfile = useCallback(async (uid) => {
        try {
            // Return cached data if valid
            if (isCacheValid() && cache.userProfile) {
                return cache.userProfile;
            }

            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                setCache(prev => ({
                    ...prev,
                    userProfile: profileData,
                    timestamp: Date.now()
                }));
                return profileData;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Return cached data as fallback
            return cache.userProfile || null;
        }
    }, [cache.userProfile, isCacheValid]);

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

    // Optimized data loading with parallel requests
    const loadUserData = useCallback(async (currentUser) => {
        if (!currentUser) return;

        try {
            // Load user profile first (needed for project query)
            setIsUserLoading(true);
            const profile = await fetchUserProfile(currentUser.uid);
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
    }, [fetchUserProfile, fetchUserProjects, setActiveProjectWithStorage]);

    // Optimized auth state listener
    useEffect(() => {
        const auth = getAuth();
        let mounted = true;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!mounted) return;

            setIsLoading(true);

            if (currentUser) {
                setUser(currentUser);
                await loadUserData(currentUser);
            } else {
                // Clear all user data
                setUser(null);
                setUserProfile(null);
                setProjects([]);
                setActiveProject(null);
                setIsUserLoading(false);
                setIsProjectsLoading(false);
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

    const value = useMemo(() => ({
        user,
        userProfile,
        projects,
        activeProject,
        setActiveProject: setActiveProjectWithStorage, // Use the version that syncs with localStorage
        isLoading: isLoading || isUserLoading, // Dashboard can show once user is loaded
        isProjectsLoading,
        needsOnboarding,
        canCreateProject,
        checkSubscriptionStatus: () => subscriptionStatus,
        refetchProjects
    }), [
        user,
        userProfile,
        projects,
        activeProject,
        setActiveProjectWithStorage,
        isLoading,
        isUserLoading,
        isProjectsLoading,
        needsOnboarding,
        canCreateProject,
        subscriptionStatus,
        refetchProjects
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};