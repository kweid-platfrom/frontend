"use client"
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const OrganizationContext = createContext();

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider = ({ children }) => {
    const [user] = useAuthState(auth);
    const [organization, setOrganization] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch organization data when user is authenticated
    useEffect(() => {
        if (!user) return;

        // Get the organization the user belongs to
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
            if (doc.exists() && doc.data().organizationId) {
                const orgId = doc.data().organizationId;
                const orgRef = doc(db, 'organizations', orgId);

                // Subscribe to organization changes
                const unsubscribeOrg = onSnapshot(orgRef, (doc) => {
                    if (doc.exists()) {
                        setOrganization({ id: doc.id, ...doc.data() });
                    } else {
                        setError('Organization not found');
                    }
                    setLoading(false);
                }, (err) => {
                    setError(`Failed to load organization: ${err.message}`);
                    setLoading(false);
                });

                // Subscribe to organization members
                const membersQuery = query(
                    collection(db, 'organizationMembers'),
                    where('organizationId', '==', orgId)
                );

                const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
                    const membersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setUsers(membersData);
                }, (err) => {
                    setError(`Failed to load members: ${err.message}`);
                });

                return () => {
                    unsubscribeOrg();
                    unsubscribeMembers();
                };
            } else {
                setLoading(false);
                setError('User not associated with an organization');
            }
        }, (err) => {
            setError(`Failed to load user data: ${err.message}`);
            setLoading(false);
        });

        return () => unsubscribeUser();
    }, [user]);

    // Update organization information
    const updateOrganization = async (data) => {
        if (!organization) return;

        try {
            const orgRef = doc(db, 'organizations', organization.id);
            await updateDoc(orgRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (err) {
            setError(`Failed to update organization: ${err.message}`);
            return false;
        }
    };

    // Update user permission
    const updateUserPermission = async (userId, permission, value) => {
        if (!organization) return;

        try {
            const memberRef = doc(db, 'organizationMembers', userId);
            await updateDoc(memberRef, {
                [`permissions.${permission}`]: value,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (err) {
            setError(`Failed to update permission: ${err.message}`);
            return false;
        }
    };

    // Invite new user
    const inviteUser = async (email, role) => {
        if (!organization || !user) return;

        try {
            // Create a new invitation in the invitations collection
            const invitationRef = doc(collection(db, 'invitations'));
            await setDoc(invitationRef, {
                email,
                role,
                organizationId: organization.id,
                invitedBy: user.uid,
                status: 'pending',
                permissions: getDefaultPermissions(role),
                createdAt: serverTimestamp()
            });

            // You would typically also send an email invitation here or trigger a Cloud Function

            return true;
        } catch (err) {
            setError(`Failed to invite user: ${err.message}`);
            return false;
        }
    };

    // Remove user from organization
    const removeUser = async (userId) => {
        if (!organization) return;

        try {
            // Remove the user from organization members
            await deleteDoc(doc(db, 'organizationMembers', userId));

            // Update the user record to remove organization association
            await updateDoc(doc(db, 'users', userId), {
                organizationId: null,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (err) {
            setError(`Failed to remove user: ${err.message}`);
            return false;
        }
    };

    // Helper to get default permissions based on role
    const getDefaultPermissions = (role) => {
        switch (role) {
            case 'Admin':
                return {
                    canManageUsers: true,
                    canEditSettings: true,
                    canViewReports: true,
                    canManageProjects: true
                };
            case 'Developer':
                return {
                    canManageUsers: false,
                    canEditSettings: false,
                    canViewReports: true,
                    canManageProjects: true
                };
            case 'Viewer':
                return {
                    canManageUsers: false,
                    canEditSettings: false,
                    canViewReports: true,
                    canManageProjects: false
                };
            default:
                return {
                    canManageUsers: false,
                    canEditSettings: false,
                    canViewReports: false,
                    canManageProjects: false
                };
        }
    };

    const value = {
        organization,
        users,
        currentUserId: user?.uid,
        loading,
        error,
        updateOrganization,
        updateUserPermission,
        inviteUser,
        removeUser
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};
