"use client";
import { useEffect, useState, useCallback } from "react";
import { doc, collection, onSnapshot } from "firebase/firestore";
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
        // Skip fetching if no user or still loading authentication
        if (!user || authLoading) {
            setLoading(false);
            return;
        }

        let unsubscribeUser = null;
        let unsubscribeOrg = null;

        const setupRealTimeListeners = async () => {
            try {
                setLoading(true);

                // Set up real-time listener for user document
                const userDocRef = doc(db, "users", user.uid);
                unsubscribeUser = onSnapshot(userDocRef, async (userDocSnap) => {
                    if (userDocSnap.exists()) {
                        const fetchedUserData = userDocSnap.data();
                        setUserData(fetchedUserData);

                        // Close previous org subscription if exists
                        if (unsubscribeOrg) {
                            unsubscribeOrg();
                        }

                        // Fetch organization data if user belongs to an organization
                        if (fetchedUserData.organizationId) {
                            unsubscribeOrg = await fetchOrganizationData(
                                fetchedUserData.organizationId, 
                                fetchedUserData.role
                            );
                        }
                    }
                }, (error) => {
                    console.error("Error listening to user document:", error);
                });
            } catch (error) {
                console.error("Error setting up real-time listeners:", error);
            } finally {
                setLoading(false);
            }
        };

        setupRealTimeListeners();

        // Cleanup function to unsubscribe from listeners
        return () => {
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeOrg) unsubscribeOrg();
        };
    }, [user, authLoading, fetchOrganizationData]);

    // Rest of the component remains the same as in the original code...

    // Show loading skeleton during authentication and data fetching
    if (authLoading || loading) {
        return <SettingsSkeleton />;
    }

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
                                            className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-3 transition-colors ${
                                                activeSection === section.id
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
                    {activeSection === "profile" && <ProfileSection userData={userData} />}
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