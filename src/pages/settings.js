"use client";
import { useEffect, useState, useCallback } from "react";
import { doc, collection, onSnapshot, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthProvider";
import ProfileSection from "../components/appSetting/ProfileSection";
import NotificationSection from "../components/appSetting/NotificationSection";
import ThemeSection from "../components/appSetting/ThemeSection";
import SubscriptionSection from "../components/appSetting/SubscriptionSection";
import SecuritySection from "../components/appSetting/SecuritySection";
import OrganizationSection from "../components/appSetting/OrganizationSection";
import TeamSection from "../components/appSetting/TeamSection";
import SettingsSkeleton from "../components/appSetting/SettingsSkeleton";
export default function SettingsPage() {
    const auth = useAuth();
    const user = auth?.user || null;
    const authLoading = auth?.loading || false;
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [orgData, setOrgData] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [activeSection, setActiveSection] = useState("profile");
    const fetchOrganizationData = useCallback(async (organizationId, role) => {
        if (!organizationId) return null;
        try {
            // Fetch organization data with real-time updates
            const orgDocRef = doc(db, "organizations", organizationId);
            const unsubscribeOrg = onSnapshot(orgDocRef, (orgDocSnap) => {
                if (orgDocSnap.exists()) {
                    const fetchedOrgData = orgDocSnap.data();
                    setOrgData(fetchedOrgData);
                }
            });
            // Fetch team members if user is an admin with real-time updates
            if (role === "admin") {
                const teamRef = collection(db, "organizations", organizationId, "members");
                const unsubscribeTeam = onSnapshot(teamRef, (teamSnap) => {
                    const members = teamSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setTeamMembers(members);
                });
                // Return both unsubscribe functions
                return () => {
                    unsubscribeOrg();
                    unsubscribeTeam();
                };
            }
            return unsubscribeOrg;
        } catch (error) {
            console.error("Error fetching organization data:", error);
            return null;
        }
    }, []);
    useEffect(() => {
        // Skip fetching if no user
        if (!user) {
            setLoading(false);
            return;
        }
        let unsubscribeFunc = null;
        // Debug: Manually check if user document exists
        const checkUserDocument = async () => {
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                console.log("Debug - User document exists:", userDocSnap.exists());
                if (userDocSnap.exists()) {
                    console.log("Debug - User document data:", userDocSnap.data());
                } else {
                    console.log("Debug - No user document found. Creating one...");
                    // Create basic user document if none exists
                    const basicUserData = {
                        firstName: user.displayName ? user.displayName.split(' ')[0] : "",
                        lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : "",
                        email: user.email,
                        avatarUrl: user.photoURL || "",
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp() // This is used
                    };
                    await setDoc(userDocRef, basicUserData);
                    console.log("Debug - Created basic user document");
                }
                // Set up real-time listener for user data
                const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setUserData(userData);
                        // If user has organization, fetch that data too
                        if (userData.organizationId) {
                            // Declare organizationId and role here
                            const organizationId = userData.organizationId;
                            const role = userData.role;
                            const cleanupOrg = fetchOrganizationData(organizationId, role);
                            unsubscribeFunc = cleanupOrg;
                        }
                    }
                    setLoading(false);
                });
                return unsubscribeUser;
            } catch (error) {
                console.error("Debug - Error checking user document:", error);
                setLoading(false);
                return null;
            }
        };
        const unsubscribe = checkUserDocument();
        // Cleanup function
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
            if (typeof unsubscribeFunc === 'function') unsubscribeFunc();
        };
    }, [user, fetchOrganizationData]);
    // Handle profile updates
    const handleProfileUpdate = async (updatedData) => {
        // This function is for immediate UI feedback - the actual data will update via onSnapshot
        if (!user?.uid) return;
        try {
            // Optimistically update local state for better UX
            setUserData(prev => ({ ...prev, ...updatedData }));
        } catch (error) {
            console.error("Error handling profile update:", error);
        }
    };
    // Show loading skeleton during authentication and data fetching
    if (authLoading || loading) {
        console.log("Showing loading skeleton. authLoading:", authLoading, "loading:", loading);
        return <SettingsSkeleton />;
    }
    // Add this debug output
    console.log("Rendering SettingsPage with userData:", userData);
    const handleSectionChange = (section) => setActiveSection(section);
    const isAdmin = userData?.role === "admin";
    const sections = [
        { id: "profile", label: "Profile" },
        { id: "notifications", label: "Notifications" },
        { id: "theme", label: "Theme" },
        { id: "subscription", label: "Subscription" },
        { id: "security", label: "Security" },
    ];
    if (isAdmin) {
        sections.push(
            { id: "organization", label: "Organization" },
            { id: "team", label: "Team Members" }
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
                                            className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-3 transition-colors ${activeSection === section.id
                                                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <div className="flex-1 space-y-8">
                    {activeSection === "profile" && (
                        <ProfileSection
                            userData={userData}
                            isEditable={true}
                            onProfileUpdate={handleProfileUpdate}
                        />
                    )}
                    {activeSection === "notifications" && <NotificationSection userData={userData} />}
                    {activeSection === "theme" && <ThemeSection userData={userData} />}
                    {activeSection === "subscription" && (
                        <SubscriptionSection userData={userData} orgData={orgData} isAdmin={isAdmin} />
                    )}
                    {activeSection === "security" && <SecuritySection userData={userData} />}
                    {isAdmin && activeSection === "organization" && <OrganizationSection orgData={orgData} />}
                    {isAdmin && activeSection === "team" && <TeamSection orgData={orgData} teamMembers={teamMembers} />}
                </div>
            </div>
        </div>
    );
}