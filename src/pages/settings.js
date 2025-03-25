"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

// Import your section components
import ProfileSection from '@/components/settings/ProfileSec';
import NotificationSection from '@/components/settings/NotificationsSec';
import ThemeSection from '@/components/settings/ThemeSec';
import SubscriptionSection from '@/components/settings/SubscriptionSec';
import SecuritySection from '@/components/settings/SecuritySec';
import OrganizationSection from '@/components/settings/OrganizationSec';
import TeamSection from '@/components/settings/TeamSec';
import SettingsSkeleton from '@/components/settings/SettingsSkeleton';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [orgData, setOrgData] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {

        // Early return if authentication is still loading
        if (authLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                // Fetch user document from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const firestoreUserData = userDocSnap.data();
                    
                    // Combine Firebase Auth and Firestore data
                    const combinedUserData = {
                        ...user,
                        ...firestoreUserData
                    };

                    setUserData(combinedUserData);

                    // Fetch organization data if exists
                    if (firestoreUserData.organizationId) {
                        const orgDocRef = doc(db, 'organizations', firestoreUserData.organizationId);
                        const orgDocSnap = await getDoc(orgDocRef);
                        
                        if (orgDocSnap.exists()) {
                            setOrgData(orgDocSnap.data());
                        }

                        // Fetch team members if user is admin
                        if (firestoreUserData.role === 'admin') {
                            const teamRef = collection(
                                db, 
                                'organizations', 
                                firestoreUserData.organizationId, 
                                'members'
                            );
                            const teamSnap = await getDocs(teamRef);
                            const members = teamSnap.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setTeamMembers(members);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, router, authLoading]);

    if (authLoading || loading) {
        return <SettingsSkeleton />;
    }

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const isAdmin = userData?.role === 'admin';
    const sections = [
        { id: 'profile', label: 'Profile', icon: 'user' },
        { id: 'notifications', label: 'Notifications', icon: 'bell' },
        { id: 'theme', label: 'Theme', icon: 'palette' },
        { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
        { id: 'security', label: 'Security', icon: 'shield' },
    ];

    if (isAdmin) {
        sections.push(
            { id: 'organization', label: 'Organization', icon: 'building' },
            { id: 'team', label: 'Team Members', icon: 'users' }
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-20">
                        <nav>
                            <ul className="space-y-2">
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <button
                                            onClick={() => handleSectionChange(section.id)}
                                            className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-3 transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <span>{section.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1">
                    <div className="space-y-8">
                        {activeSection === 'profile' && (
                            <ProfileSection userData={userData} />
                        )}

                        {activeSection === 'notifications' && (
                            <NotificationSection userData={userData} />
                        )}

                        {activeSection === 'theme' && (
                            <ThemeSection userData={userData} />
                        )}

                        {activeSection === 'subscription' && (
                            <SubscriptionSection
                                userData={userData}
                                orgData={orgData}
                                isAdmin={isAdmin}
                            />
                        )}

                        {activeSection === 'security' && (
                            <SecuritySection userData={userData} />
                        )}

                        {isAdmin && activeSection === 'organization' && (
                            <OrganizationSection orgData={orgData} />
                        )}

                        {isAdmin && activeSection === 'team' && (
                            <TeamSection
                                orgData={orgData}
                                teamMembers={teamMembers}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}