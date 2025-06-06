// contexts/ProjectContext.js
'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../config/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    orderBy
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
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    // Check subscription status
    const checkSubscriptionStatus = (userProfile) => {
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
    };

    // Fetch user profile
    const fetchUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    // Fetch user projects
    const fetchUserProjects = async (uid, organizationId = null) => {
        try {
            let q;
            if (organizationId) {
                // Company account - fetch organization projects
                q = query(
                    collection(db, 'projects'),
                    where('organizationId', '==', organizationId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Personal account - fetch user's projects
                q = query(
                    collection(db, 'projects'),
                    where('createdBy', '==', uid),
                    where('organizationId', '==', null),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const projectList = [];

            querySnapshot.forEach((doc) => {
                projectList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return projectList;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    };

    // Check if user can create more projects
    const canCreateProject = () => {
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
                return true; // Unlimited
            default:
                return false;
        }
    };

    // Auth state listener
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoading(true);

            if (currentUser) {
                setUser(currentUser);

                // Fetch user profile
                const profile = await fetchUserProfile(currentUser.uid);
                setUserProfile(profile);

                if (profile) {
                    // Fetch projects
                    const userProjects = await fetchUserProjects(
                        currentUser.uid,
                        profile.organizationId
                    );
                    setProjects(userProjects);

                    // Check if onboarding is needed
                    if (userProjects.length === 0) {
                        setNeedsOnboarding(true);
                    } else {
                        setNeedsOnboarding(false);
                        // Set active project (last created or from localStorage)
                        const savedProjectId = localStorage.getItem('activeProjectId');
                        const activeProj = userProjects.find(p => p.id === savedProjectId) || userProjects[0];
                        setActiveProject(activeProj);
                    }
                }
            } else {
                setUser(null);
                setUserProfile(null);
                setProjects([]);
                setActiveProject(null);
                setNeedsOnboarding(false);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Save active project to localStorage
    useEffect(() => {
        if (activeProject) {
            localStorage.setItem('activeProjectId', activeProject.id);
        }
    }, [activeProject]);

    const value = {
        user,
        userProfile,
        projects,
        activeProject,
        setActiveProject,
        isLoading,
        needsOnboarding,
        setNeedsOnboarding,
        canCreateProject,
        checkSubscriptionStatus: () => checkSubscriptionStatus(userProfile),
        refetchProjects: async () => {
            if (user && userProfile) {
                const userProjects = await fetchUserProjects(
                    user.uid,
                    userProfile.organizationId
                );
                setProjects(userProjects);
            }
        }
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};